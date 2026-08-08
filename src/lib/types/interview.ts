// Core interview types — state, evidence, phases, decisions

import type { CandidateProfile } from './candidate';

// Interview phases (natural flow, not rigid)
export type InterviewPhase =
  | 'WARM_UP'
  | 'FUNDAMENTALS'
  | 'DEEP_DIVE'
  | 'FOLLOW_UP'
  | 'SYSTEM_DESIGN'
  | 'FINAL_ASSESSMENT';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type DifficultyTrajectory = 'increasing' | 'stable' | 'decreasing';

export type QuestionType =
  | 'conceptual'
  | 'scenario'
  | 'debugging'
  | 'architecture'
  | 'tradeoff'
  | 'why_how'
  | 'project_based'
  | 'system_design'
  | 'follow_up'
  | 'diagnostic'
  | 'recovery';

export type UnderstandingLevel = 'none' | 'partial' | 'solid' | 'deep';

export type DecisionAction =
  | 'follow_up'
  | 'new_topic'
  | 'clarify'
  | 'challenge'
  | 'diagnostic'
  | 'recovery'
  | 'complete';

// Evidence record — stored per question
export interface EvidenceRecord {
  day: number;
  topic: string;
  question: string;
  answer: string;
  questionType: QuestionType;
  evaluation: {
    score: number;
    understanding: UnderstandingLevel;
    strengths: string[];
    gaps: string[];
    misconceptions: string[];
  };
  followUpOpportunity: string | null;
  reason: QuestionReason;
  difficulty: Difficulty;
}

export interface QuestionReason {
  trigger: string;
  basedOn: string;
  learningObjective: string;
  goal: string;
}

// Knowledge state per topic — tracks the candidate's demonstrated understanding
export type KnowledgeState =
  | 'UNTESTED'
  | 'UNKNOWN'
  | 'WEAK'
  | 'PARTIAL'
  | 'COMPETENT'
  | 'STRONG';

// Per-topic evidence tracker
export interface TopicEvidence {
  curriculumDay: number;
  topic: string;
  knowledgeState: KnowledgeState;
  evidence: string[];
  gaps: string[];
  misconceptions: string[];
  diagnosticAttempts: number;
  recoveryAttempts: number;
  followUpsUsed: number;
  lastQuestionType: QuestionType;
}

// Chat message
export interface Message {
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: string;
}

// Planned day in the interview plan
export interface PlannedDay {
  day: number;
  topic: string;
  priority: number;
  suggestedDifficulty: Difficulty;
  suggestedQuestionTypes: QuestionType[];
  missionStatus: 'passed' | 'failed' | 'skipped';
  attempts: number;
}

export interface InterviewPlan {
  targetDays: PlannedDay[];
  totalTargetQuestions: number;
}

// Candidate analysis result
export interface CandidateAnalysis {
  passedMissions: { day: number; title: string; attempts: number }[];
  failedMissions: { day: number; title: string; attempts: number }[];
  skippedMissions: { day: number; title: string }[];
  highEffortTopics: { day: number; title: string; attempts: number }[];
  firstTryTopics: { day: number; title: string }[];
  completionRate: number;
  firstTryRate: number;
  consistencyLevel: 'high' | 'medium' | 'low';
  experienceTier: 'junior' | 'mid' | 'senior' | 'expert';
}

// Main interview state — the source of truth
export interface InterviewState {
  sessionId: string;
  candidateId: string;
  status: 'initializing' | 'in_progress' | 'completed';
  phase: InterviewPhase;

  // Coverage tracking
  questionCount: number;
  curriculumDaysCovered: number[];
  topicsCovered: string[];

  // Difficulty
  difficulty: Difficulty;
  difficultyTrajectory: DifficultyTrajectory;

  // Evidence memory
  evidence: EvidenceRecord[];
  strengths: string[];
  weaknesses: string[];
  misconceptions: string[];
  importantClaims: string[];

  // Knowledge state per topic
  topicKnowledge: Record<string, TopicEvidence>;

  // Repetition prevention
  questionsAsked: string[];

  // Conversation (short-term: last 4 turns)
  recentMessages: Message[];

  // Plan & analysis
  interviewPlan: InterviewPlan;
  candidateAnalysis: CandidateAnalysis;
  candidateData: CandidateProfile;

  // Timestamps
  startedAt: string;
  updatedAt: string;
}

// Constants
export const MIN_QUESTIONS = 8;
export const MIN_CURRICULUM_DAYS = 4;
export const MAX_RECENT_MESSAGES = 6; // 3 pairs of Q&A
export const DEFAULT_DIFFICULTY: Difficulty = 'medium';
export const MAX_FOLLOWUPS_PER_TOPIC = 3;
export const MAX_DIAGNOSTIC_ATTEMPTS = 2;
