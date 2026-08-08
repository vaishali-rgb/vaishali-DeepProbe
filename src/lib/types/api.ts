// API request/response types — matches organizer's technical-spec.md exactly

import type { CandidateProfile } from './candidate';

// --- Request types ---

// Initial request: starts a new interview
export interface InterviewInitRequest {
  sessionId: string;
  candidate: CandidateProfile;
}

// Subsequent request: candidate's answer
export interface InterviewTurnRequest {
  sessionId: string;
  message: string;
}

// Union type for the POST body
export type InterviewRequest = InterviewInitRequest | InterviewTurnRequest;

// Type guards
export function isInitRequest(req: InterviewRequest): req is InterviewInitRequest {
  return 'candidate' in req && req.candidate !== undefined;
}

export function isTurnRequest(req: InterviewRequest): req is InterviewTurnRequest {
  return 'message' in req && typeof (req as InterviewTurnRequest).message === 'string';
}

// --- Response types ---

// Feedback object (final response only)
export interface FeedbackResponse {
  summary: string;
  technicalStrengths: string[];
  technicalGaps: string[];
  demonstratedSkills: string[];
  misconceptions: string[];
  communicationStrengths: string[];
  communicationGaps: string[];
  curriculumCoverage: string[];
  recommendedNextSteps: string[];
}

// The organizer-facing response — DO NOT MODIFY THIS CONTRACT
export interface InterviewResponse {
  reply: string;
  done: boolean;
  feedback?: FeedbackResponse;
}

// --- Error response ---
export interface ErrorResponse {
  error: string;
  code: string;
}
