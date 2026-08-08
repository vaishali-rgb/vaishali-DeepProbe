// Interview controller — main orchestrator implementing the state machine
// Your application owns state/constraints/memory. Gemini owns reasoning.

import type { InterviewState, EvidenceRecord, InterviewPhase } from '@/lib/types/interview';
import type { CandidateProfile } from '@/lib/types/candidate';
import type { InterviewResponse, FeedbackResponse } from '@/lib/types/api';

import { sessionManager } from './session-manager';
import { analyzeCandidate } from './candidate-analyzer';
import { generateInterviewPlan } from './question-planner';
import { buildInterviewContext } from './context-builder';
import { canFinishInterview, getNextSuggestedDay } from './coverage-guard';
import { adaptDifficulty, scoreToQuality } from './difficulty';
import { isRepetition } from './repetition-checker';

import {
  createInitialState,
  addMessage,
  addEvidence,
  updateDifficulty,
  transitionPhase,
  addImportantClaim,
  markCompleted,
} from './state';

import { generateOpeningQuestion, generateInterviewResponse } from '@/lib/gemini/interviewer';
import { generateFinalFeedback } from '@/lib/gemini/evaluator';
import { saveCandidateMemory, retrieveCandidateMemory } from '@/lib/breeth/memory';

// ─── Start Interview ───────────────────────────────────────────────

export async function startInterview(
  sessionId: string,
  candidateData: CandidateProfile
): Promise<InterviewResponse> {
  // 1. Analyze candidate journey
  const analysis = analyzeCandidate(candidateData);

  // 2. Generate personalized interview plan
  const plan = generateInterviewPlan(analysis, candidateData.missions);

  // 3. Create initial state
  let state = createInitialState(sessionId, candidateData, plan, analysis);

  // 4. Build context for opening question
  let context = buildInterviewContext(state);
  
  // 4b. Inject Breeth Memory
  const pastMemory = await retrieveCandidateMemory(candidateData.member.id);
  if (pastMemory) {
    context += `\n\n=== PAST MEMORY ===\n${pastMemory}`;
  }

  // 5. Get opening question from Gemini
  const opening = await generateOpeningQuestion(context);

  // 6. Update state with the interviewer's opening message
  state = addMessage(state, 'interviewer', opening.question.text);
  state = transitionPhase(state, 'WARM_UP');

  // 7. Store session
  sessionManager.create(sessionId, state);

  return {
    reply: opening.question.text,
    done: false,
  };
}

// ─── Process Answer ────────────────────────────────────────────────

export async function processAnswer(
  sessionId: string,
  message: string
): Promise<InterviewResponse> {
  // 1. Get session
  let state = sessionManager.get(sessionId);
  if (!state) {
    throw new SessionError('Session not found', 'SESSION_NOT_FOUND');
  }
  if (state.status === 'completed') {
    throw new SessionError('Interview already completed', 'INTERVIEW_COMPLETED');
  }

  // 2. Add candidate message
  state = addMessage(state, 'candidate', message);

  // 3. Determine phase progression
  state = progressPhase(state);

  // 4. Build compressed context
  let context = buildInterviewContext(state);
  
  // 4b. Inject Breeth Memory
  const pastMemory = await retrieveCandidateMemory(state.candidateData.member.id);
  if (pastMemory) {
    context += `\n\n=== PAST MEMORY ===\n${pastMemory}`;
  }

  // 5. Get Gemini's response (evaluation + next question + decision)
  const geminiResponse = await generateInterviewResponse(context, message);

  // 6. Create evidence record
  const evidenceRecord: EvidenceRecord = {
    day: geminiResponse.question.curriculumDay || getCurrentDay(state),
    topic: geminiResponse.question.topic || 'General',
    question: state.questionsAsked[state.questionsAsked.length - 1] || '',
    answer: message,
    questionType: geminiResponse.question.type,
    evaluation: geminiResponse.evaluation,
    followUpOpportunity: geminiResponse.evaluation.gaps[0] ?? null,
    reason: geminiResponse.reason,
    difficulty: state.difficulty,
  };

  // 7. Update evidence
  state = addEvidence(state, evidenceRecord);

  // 8. Update difficulty
  const quality = scoreToQuality(geminiResponse.evaluation.score);
  const { difficulty, trajectory } = adaptDifficulty(state.difficulty, quality);
  state = updateDifficulty(state, difficulty, trajectory);

  // 9. Store important claims
  if (geminiResponse.importantClaim) {
    state = addImportantClaim(state, geminiResponse.importantClaim);
    // Write claim directly to persistent memory
    await saveCandidateMemory(state.candidateData.member.id, `Candidate made an important claim: ${geminiResponse.importantClaim}`);
  }

  // 10. COVERAGE GUARD — override Gemini if needed
  const coverageMet = canFinishInterview(state);
  const geminiWantsToFinish = geminiResponse.decision === 'complete' || !geminiResponse.continueInterview;

  if (geminiWantsToFinish && !coverageMet) {
    // Override: force continuation
    const nextDay = getNextSuggestedDay(state);
    const overrideContext = buildInterviewContext(state, nextDay ?? undefined);
    const overrideResponse = await generateInterviewResponse(overrideContext, message);
    
    state = addMessage(state, 'interviewer', overrideResponse.question.text);
    sessionManager.update(sessionId, state);

    return { reply: overrideResponse.question.text, done: false };
  }

  if (geminiWantsToFinish && coverageMet) {
    // Interview complete — generate final feedback
    return await finishInterview(sessionId, state);
  }

  // 11. Check for repetition and regenerate if needed
  let replyText = geminiResponse.question.text;
  if (isRepetition(replyText, state.questionsAsked)) {
    // Ask Gemini to try a different question
    const retryContext = buildInterviewContext(state);
    const retryResponse = await generateInterviewResponse(retryContext, message);
    replyText = retryResponse.question.text;
  }

  // 12. Add interviewer message
  state = addMessage(state, 'interviewer', replyText);

  // 13. Save state
  sessionManager.update(sessionId, state);

  return { reply: replyText, done: false };
}

// ─── Finish Interview ──────────────────────────────────────────────

async function finishInterview(
  sessionId: string,
  state: InterviewState
): Promise<InterviewResponse> {
  // Generate final feedback
  const feedback = await generateFinalFeedback(state);

  // Persist the final evaluation to Breeth Memory
  const finalEvalStr = `Final Interview Feedback:\nSummary: ${feedback.summary}\nStrengths: ${feedback.strengths.join(', ')}\nGaps: ${feedback.gaps.join(', ')}`;
  await saveCandidateMemory(state.candidateData.member.id, finalEvalStr);

  // Mark completed
  state = markCompleted(state);

  const closingMessage = `Thank you for completing this interview, ${state.candidateData.member.name}. I've gathered sufficient evidence across ${[...new Set(state.curriculumDaysCovered)].length} curriculum areas over ${state.questionCount} questions. Your detailed feedback is ready for review.`;

  state = addMessage(state, 'interviewer', closingMessage);
  sessionManager.update(sessionId, state);

  const feedbackResponse: FeedbackResponse = {
    summary: feedback.summary,
    strengths: feedback.strengths,
    gaps: feedback.gaps,
    next: feedback.next,
  };

  return {
    reply: closingMessage,
    done: true,
    feedback: feedbackResponse,
  };
}

// ─── Phase Progression ─────────────────────────────────────────────

function progressPhase(state: InterviewState): InterviewState {
  const q = state.questionCount;
  const days = new Set(state.curriculumDaysCovered).size;

  // Phase transitions based on interview progress
  const phaseRules: [boolean, InterviewPhase][] = [
    [q <= 1, 'WARM_UP'],
    [q <= 3, 'FUNDAMENTALS'],
    [q <= 5, 'DEEP_DIVE'],
    [q <= 7, 'FOLLOW_UP'],
    [q >= 8 && days >= 4, 'SYSTEM_DESIGN'],
  ];

  for (const [condition, phase] of phaseRules) {
    if (condition && state.phase !== phase) {
      return transitionPhase(state, phase);
    }
  }

  return state;
}

// ─── Helpers ───────────────────────────────────────────────────────

function getCurrentDay(state: InterviewState): number {
  if (state.curriculumDaysCovered.length > 0) {
    return state.curriculumDaysCovered[state.curriculumDaysCovered.length - 1];
  }
  return state.interviewPlan.targetDays[0]?.day ?? 7;
}

// ─── Error Types ───────────────────────────────────────────────────

export class SessionError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'SessionError';
  }
}
