// Interview controller — main orchestrator implementing the state machine
// ARCHITECTURE: Gemini RECOMMENDS the next action. Controller VALIDATES and ENFORCES it.

import type { InterviewState, EvidenceRecord, InterviewPhase, DecisionAction } from '@/lib/types/interview';
import { MAX_FOLLOWUPS_PER_TOPIC, MAX_DIAGNOSTIC_ATTEMPTS } from '@/lib/types/interview';
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
  updateTopicKnowledge,
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

  // 5. Get Gemini's RECOMMENDATION (evaluation + next question + decision)
  const geminiResponse = await generateInterviewResponse(context, message);

  // 6. Create evidence record
  const currentTopic = geminiResponse.question.topic || 'General';
  const currentDay = geminiResponse.question.curriculumDay || getCurrentDay(state);
  const evidenceRecord: EvidenceRecord = {
    day: currentDay,
    topic: currentTopic,
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
    await saveCandidateMemory(state.candidateData.member.id, `Candidate made an important claim: ${geminiResponse.importantClaim}`);
  }

  // 10. Update per-topic knowledge state
  state = updateTopicKnowledge(
    state,
    currentTopic,
    currentDay,
    geminiResponse.evaluation,
    geminiResponse.question.type,
    geminiResponse.decision
  );

  // ═══════════════════════════════════════════════════════════════════
  // 11. CONTROLLER ENFORCEMENT — Override Gemini if needed
  // Gemini recommends. Controller decides.
  // ═══════════════════════════════════════════════════════════════════

  const forceExit = geminiResponse.forceEarlyExit === true;
  let enforcedDecision = geminiResponse.decision;
  const geminiWantsNewTopic = enforcedDecision === 'new_topic';

  // 11a. KNOWLEDGE RECOVERY ENFORCEMENT
  // If topic is UNKNOWN/WEAK and diagnostic budget remains, BLOCK topic changes
  const topicState = state.topicKnowledge[currentTopic];
  if (topicState && !forceExit) {
    const isWeakOrUnknown = topicState.knowledgeState === 'UNKNOWN' || topicState.knowledgeState === 'WEAK';
    const hasDiagnosticBudget = topicState.diagnosticAttempts < MAX_DIAGNOSTIC_ATTEMPTS;

    if (isWeakOrUnknown && hasDiagnosticBudget && geminiWantsNewTopic) {
      // OVERRIDE: Force diagnostic instead of topic jump
      console.log(`[Controller] OVERRIDE: Blocking topic jump. Topic "${currentTopic}" is ${topicState.knowledgeState} with ${topicState.diagnosticAttempts}/${MAX_DIAGNOSTIC_ATTEMPTS} diagnostics used. Forcing diagnostic.`);
      enforcedDecision = 'diagnostic';
    }
  }

  // 11b. TOPIC DEPTH BUDGET ENFORCEMENT
  // If too many follow-ups on one topic, force a topic change
  if (topicState && !forceExit) {
    const depthExhausted = topicState.followUpsUsed >= MAX_FOLLOWUPS_PER_TOPIC;
    const diagnosticExhausted = topicState.diagnosticAttempts >= MAX_DIAGNOSTIC_ATTEMPTS;
    const stayingOnTopic = enforcedDecision !== 'new_topic' && enforcedDecision !== 'complete';

    if (depthExhausted && stayingOnTopic && topicState.knowledgeState !== 'UNKNOWN') {
      console.log(`[Controller] OVERRIDE: Topic "${currentTopic}" depth budget exhausted (${topicState.followUpsUsed}/${MAX_FOLLOWUPS_PER_TOPIC} follow-ups). Forcing new topic.`);
      enforcedDecision = 'new_topic';
    }
    // Also force new topic if diagnostic budget is exhausted on an UNKNOWN topic
    if (topicState.knowledgeState === 'UNKNOWN' && diagnosticExhausted && stayingOnTopic) {
      console.log(`[Controller] OVERRIDE: Topic "${currentTopic}" diagnostic budget exhausted. Candidate cannot answer. Moving on.`);
      enforcedDecision = 'new_topic';
    }
  }

  // 11c. STRONG ANSWER ESCALATION
  // If candidate is strong, force Gemini to challenge or use a scenario rather than easy follow-ups
  if (topicState && !forceExit && !geminiWantsNewTopic) {
    const isStrong = topicState.knowledgeState === 'STRONG' || topicState.knowledgeState === 'COMPETENT';
    const geminiIsTooEasy = enforcedDecision === 'follow_up' || enforcedDecision === 'clarify' || enforcedDecision === 'diagnostic';

    if (isStrong && geminiIsTooEasy) {
      console.log(`[Controller] OVERRIDE: Topic "${currentTopic}" is ${topicState.knowledgeState}. Escalating difficulty to challenge/scenario.`);
      enforcedDecision = topicState.followUpsUsed > 1 ? 'scenario' : 'challenge';
    }
  }

  // 11d. MISCONCEPTION CHALLENGE
  // If a misconception was just detected, force a challenge immediately to address it
  const misconceptions = geminiResponse.evaluation?.misconceptions || [];
  if (!forceExit && misconceptions.length > 0 && !geminiWantsNewTopic) {
    if (enforcedDecision !== 'challenge' && enforcedDecision !== 'diagnostic') {
      console.log(`[Controller] OVERRIDE: Misconception detected. Forcing challenge.`);
      enforcedDecision = 'challenge';
    }
  }

  // 11e. COMPLETION GUARD — check coverage + evidence quality
  const coverageMet = canFinishInterview(state);
  const evidenceQualitySufficient = hasMinimumEvidenceQuality(state);
  const geminiWantsToFinish = enforcedDecision === 'complete' || !geminiResponse.continueInterview || forceExit;

  if (geminiWantsToFinish && !forceExit && (!coverageMet || !evidenceQualitySufficient)) {
    // Override: force continuation — not enough coverage or evidence
    console.log(`[Controller] OVERRIDE: Blocking completion. Coverage met: ${coverageMet}, Evidence quality: ${evidenceQualitySufficient}`);
    const nextDay = getNextSuggestedDay(state);
    const overrideContext = buildInterviewContext(state, nextDay ?? undefined);
    const overrideResponse = await generateInterviewResponse(overrideContext, message);
    
    state = addMessage(state, 'interviewer', overrideResponse.question.text);
    sessionManager.update(sessionId, state);

    return { reply: overrideResponse.question.text, done: false };
  }

  if (geminiWantsToFinish && (forceExit || (coverageMet && evidenceQualitySufficient))) {
    // Interview complete — generate final feedback
    return await finishInterview(sessionId, state);
  }

  // 11f. If controller overrode the decision, regenerate the question with the enforced action
  let replyText = geminiResponse.question.text;
  if (enforcedDecision !== geminiResponse.decision) {
    console.log(`[Controller] Decision overridden: ${geminiResponse.decision} → ${enforcedDecision}. Regenerating question.`);
    
    let overrideHint = '';
    if (enforcedDecision === 'diagnostic') {
      overrideHint = `\n\nCONTROLLER OVERRIDE: You MUST ask a DIAGNOSTIC question. Simplify the current topic "${currentTopic}" to a high-level fundamental concept. Do NOT change to a new topic. Ask something a beginner could answer.`;
    } else if (enforcedDecision === 'new_topic') {
      const nextDay = getNextSuggestedDay(state);
      const nextDayInfo = nextDay ? `Switch to curriculum Day ${nextDay}.` : 'Pick a completely different curriculum area.';
      overrideHint = `\n\nCONTROLLER OVERRIDE: You MUST move to a COMPLETELY DIFFERENT topic. The candidate has been unable to answer questions about "${currentTopic}" after multiple attempts. ${nextDayInfo} Do NOT ask anything related to "${currentTopic}".`;
    } else if (enforcedDecision === 'challenge') {
      const recentMisconception = misconceptions[0];
      const challengeHint = recentMisconception 
        ? `Challenge this specific misconception directly: "${recentMisconception}"`
        : `Push the candidate harder on edge cases or limitations.`;
      overrideHint = `\n\nCONTROLLER OVERRIDE: You MUST ask a CHALLENGE question. The candidate has demonstrated strong knowledge of "${currentTopic}". ${challengeHint} Do NOT ask a basic follow-up.`;
    } else if (enforcedDecision === 'scenario') {
      overrideHint = `\n\nCONTROLLER OVERRIDE: You MUST ask a SCENARIO question. Present a real-world production problem (e.g., latency, scaling, memory limits) related to "${currentTopic}". Force the candidate to make engineering tradeoffs.`;
    }

    const overrideContext = buildInterviewContext(state) + overrideHint;
    const overrideResponse = await generateInterviewResponse(overrideContext, message);
    replyText = overrideResponse.question.text;
  }

  // 12. Check for repetition and regenerate if needed
  if (isRepetition(replyText, state.questionsAsked)) {
    const retryContext = buildInterviewContext(state);
    const retryResponse = await generateInterviewResponse(retryContext, message);
    replyText = retryResponse.question.text;
  }

  // 13. Add interviewer message
  state = addMessage(state, 'interviewer', replyText);

  // 14. Save state
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
  const finalEvalStr = `Final Interview Feedback:\nSummary: ${feedback.summary}\nStrengths: ${feedback.technicalStrengths.join(', ')}\nGaps: ${feedback.technicalGaps.join(', ')}\nNext Steps: ${feedback.recommendedNextSteps.join(', ')}`;
  await saveCandidateMemory(state.candidateData.member.id, finalEvalStr);

  // Mark completed
  state = markCompleted(state);

  // Build a structured closing message
  const topicCount = Object.keys(state.topicKnowledge).length;
  const evidenceCount = state.evidence.length;
  const misconceptionCount = state.misconceptions.length;
  const recoveryCount = Object.values(state.topicKnowledge).filter(t => t.recoveryAttempts > 0).length;

  const closingMessage = `Thank you for completing this interview, ${state.candidateData.member.name}. I've gathered sufficient evidence across ${[...new Set(state.curriculumDaysCovered)].length} curriculum areas over ${state.questionCount} questions. Your detailed feedback is ready for review.`;

  state = addMessage(state, 'interviewer', closingMessage);
  sessionManager.update(sessionId, state);

  // The feedback object already matches the FeedbackResponse interface exactly now.
  const feedbackResponse: FeedbackResponse = feedback;

  return {
    reply: closingMessage,
    done: true,
    feedback: feedbackResponse,
  };
}

// ─── Evidence Quality Gate ─────────────────────────────────────────

function hasMinimumEvidenceQuality(state: InterviewState): boolean {
  // Don't allow completion with only "I don't know" answers
  // At least some evidence records must have score > 1
  const meaningfulEvidence = state.evidence.filter(e => e.evaluation.score > 1);
  
  // Need at least 3 evidence records with actual content,
  // OR if the candidate genuinely can't answer anything, allow after enough attempts
  if (meaningfulEvidence.length >= 3) return true;
  
  // Safety valve: if we've asked 12+ questions and still no meaningful evidence,
  // the interview has been thorough enough
  if (state.questionCount >= 12) return true;
  
  return false;
}

// ─── Phase Progression ─────────────────────────────────────────────

function progressPhase(state: InterviewState): InterviewState {
  const q = state.questionCount;
  const days = new Set(state.curriculumDaysCovered).size;

  const phaseRules: [boolean, InterviewPhase][] = [
    [q <= 1, 'WARM_UP'],
    [q >= 8 && days >= 4, 'SYSTEM_DESIGN'],
  ];

  for (const [condition, phase] of phaseRules) {
    if (condition && state.phase !== phase) {
      return transitionPhase(state, phase);
    }
  }
  
  if (state.phase !== 'DEEP_DIVE') {
    return transitionPhase(state, 'DEEP_DIVE');
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
