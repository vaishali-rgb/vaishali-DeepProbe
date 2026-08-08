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
