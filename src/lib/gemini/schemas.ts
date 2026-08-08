// Gemini structured output schemas — defines what Gemini must return

import type { Difficulty, QuestionType, UnderstandingLevel, DecisionAction } from '@/lib/types/interview';

// The structured response Gemini returns for each interview turn
export interface GeminiInterviewResponse {
  decision: DecisionAction;

  question: {
    text: string;
    type: QuestionType;
    difficulty: Difficulty;
    curriculumDay: number;
    topic: string;
  };

  evaluation: {
    score: number;
    understanding: UnderstandingLevel;
    strengths: string[];
    gaps: string[];
    misconceptions: string[];
  };

  reason: {
    trigger: string;
    basedOn: string;
    learningObjective: string;
    goal: string;
  };

  importantClaim: string | null;
  continueInterview: boolean;
}

// The response for the opening question (no evaluation yet)
export interface GeminiOpeningResponse {
  question: {
    text: string;
    type: QuestionType;
    difficulty: Difficulty;
    curriculumDay: number;
    topic: string;
  };

  reason: {
    trigger: string;
    basedOn: string;
    learningObjective: string;
    goal: string;
  };
}

// Final evaluator response
export interface GeminiFinalEvaluation {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
}

// Default/fallback values when parsing fails
export const FALLBACK_EVALUATION = {
  score: 5,
  understanding: 'partial' as UnderstandingLevel,
  strengths: [],
  gaps: [],
  misconceptions: [],
};

export const FALLBACK_REASON = {
  trigger: 'continuation',
  basedOn: 'interview_flow',
  learningObjective: 'assess understanding',
  goal: 'gather evidence',
};
