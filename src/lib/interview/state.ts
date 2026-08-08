// Interview state factory and update functions — pure functions, no side effects

import type { CandidateProfile } from '@/lib/types/candidate';
import type {
  InterviewState,
  InterviewPlan,
  CandidateAnalysis,
  Message,
  EvidenceRecord,
  InterviewPhase,
  Difficulty,
  DifficultyTrajectory,
  DEFAULT_DIFFICULTY,
  KnowledgeState,
  TopicEvidence,
} from '@/lib/types/interview';
import { MAX_RECENT_MESSAGES } from '@/lib/types/interview';

export function createInitialState(
  sessionId: string,
  candidateData: CandidateProfile,
  plan: InterviewPlan,
  analysis: CandidateAnalysis
): InterviewState {
  const now = new Date().toISOString();
  return {
    sessionId,
    candidateId: candidateData.member.id,
    status: 'in_progress',
    phase: 'WARM_UP',

    questionCount: 0,
    curriculumDaysCovered: [],
    topicsCovered: [],

    difficulty: 'medium',
    difficultyTrajectory: 'stable',

    evidence: [],
    strengths: [],
    weaknesses: [],
    misconceptions: [],
    importantClaims: [],

    topicKnowledge: {},

    questionsAsked: [],
    recentMessages: [],

    interviewPlan: plan,
    candidateAnalysis: analysis,
    candidateData,

    startedAt: now,
    updatedAt: now,
  };
}

export function addMessage(
  state: InterviewState,
  role: 'interviewer' | 'candidate',
  content: string
): InterviewState {
  const message: Message = {
    role,
    content,
    timestamp: new Date().toISOString(),
  };

  const recentMessages = [...state.recentMessages, message];

  // Sliding window — keep last MAX_RECENT_MESSAGES
  const trimmed = recentMessages.length > MAX_RECENT_MESSAGES
    ? recentMessages.slice(-MAX_RECENT_MESSAGES)
    : recentMessages;

  return { ...state, recentMessages: trimmed, updatedAt: new Date().toISOString() };
}

export function addEvidence(
  state: InterviewState,
  record: EvidenceRecord
): InterviewState {
  const evidence = [...state.evidence, record];

  // Aggregate strengths/weaknesses/misconceptions from all evidence
  const allStrengths = new Set(state.strengths);
  const allWeaknesses = new Set(state.weaknesses);
  const allMisconceptions = new Set(state.misconceptions);

  record.evaluation.strengths.forEach(s => allStrengths.add(s));
  record.evaluation.gaps.forEach(g => allWeaknesses.add(g));
  record.evaluation.misconceptions.forEach(m => allMisconceptions.add(m));

  // Track covered days and topics
  const daysCovered = [...new Set([...state.curriculumDaysCovered, record.day])];
  const topicsCovered = [...new Set([...state.topicsCovered, record.topic])];

  return {
    ...state,
    evidence,
    strengths: [...allStrengths],
    weaknesses: [...allWeaknesses],
    misconceptions: [...allMisconceptions],
    curriculumDaysCovered: daysCovered,
    topicsCovered,
    questionCount: state.questionCount + 1,
    questionsAsked: [...state.questionsAsked, record.question],
    updatedAt: new Date().toISOString(),
  };
}

export function updateDifficulty(
  state: InterviewState,
  difficulty: Difficulty,
  trajectory: DifficultyTrajectory
): InterviewState {
  return { ...state, difficulty, difficultyTrajectory: trajectory, updatedAt: new Date().toISOString() };
}

export function transitionPhase(
  state: InterviewState,
  newPhase: InterviewPhase
): InterviewState {
  return { ...state, phase: newPhase, updatedAt: new Date().toISOString() };
}

export function addImportantClaim(
  state: InterviewState,
  claim: string
): InterviewState {
  return {
    ...state,
    importantClaims: [...state.importantClaims, claim],
    updatedAt: new Date().toISOString(),
  };
}

export function markCompleted(state: InterviewState): InterviewState {
  return { ...state, status: 'completed', phase: 'FINAL_ASSESSMENT', updatedAt: new Date().toISOString() };
}

// ─── Topic Knowledge Tracking ─────────────────────────────────────

function scoreToKnowledgeState(score: number, understanding: string): KnowledgeState {
  if (score <= 1 || understanding === 'none') return 'UNKNOWN';
  if (score <= 3) return 'WEAK';
  if (score <= 5) return 'PARTIAL';
  if (score <= 7) return 'COMPETENT';
  return 'STRONG';
}

export function updateTopicKnowledge(
  state: InterviewState,
  topic: string,
  curriculumDay: number,
  evaluation: EvidenceRecord['evaluation'],
  questionType: EvidenceRecord['questionType'],
  decision: string
): InterviewState {
  const existing = state.topicKnowledge[topic];
  const newKnowledge = scoreToKnowledgeState(evaluation.score, evaluation.understanding);

  // If knowledge improved from a previous weak/unknown state, that's a recovery
  const isRecovery = existing &&
    (existing.knowledgeState === 'UNKNOWN' || existing.knowledgeState === 'WEAK') &&
    (newKnowledge === 'PARTIAL' || newKnowledge === 'COMPETENT' || newKnowledge === 'STRONG');

  const updated: TopicEvidence = {
    curriculumDay,
    topic,
    knowledgeState: newKnowledge,
    evidence: [
      ...(existing?.evidence ?? []),
      ...evaluation.strengths,
    ],
    gaps: [
      ...(existing?.gaps ?? []),
      ...evaluation.gaps,
    ],
    misconceptions: [
      ...(existing?.misconceptions ?? []),
      ...evaluation.misconceptions,
    ],
    diagnosticAttempts: (existing?.diagnosticAttempts ?? 0) + (decision === 'diagnostic' ? 1 : 0),
    recoveryAttempts: (existing?.recoveryAttempts ?? 0) + (isRecovery ? 1 : 0),
    followUpsUsed: (existing?.followUpsUsed ?? 0) + (
      decision === 'follow_up' || decision === 'clarify' || decision === 'challenge' ? 1 : 0
    ),
    lastQuestionType: questionType,
  };

  return {
    ...state,
    topicKnowledge: { ...state.topicKnowledge, [topic]: updated },
    updatedAt: new Date().toISOString(),
  };
}
