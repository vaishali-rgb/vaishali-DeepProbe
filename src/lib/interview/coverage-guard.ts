// Coverage guard — enforces 8 questions / 4 curriculum days minimum
// Gemini CANNOT override these hard constraints

import type { InterviewState } from '@/lib/types/interview';
import { MIN_QUESTIONS, MIN_CURRICULUM_DAYS } from '@/lib/types/interview';

export interface CoverageStatus {
  questionsAsked: number;
  questionsNeeded: number;
  daysCovered: number[];
  daysCount: number;
  daysNeeded: number;
  canFinish: boolean;
  uncoveredPlannedDays: number[];
}

export function getCoverageStatus(state: InterviewState): CoverageStatus {
  const uniqueDays = [...new Set(state.curriculumDaysCovered)];
  const questionsNeeded = Math.max(0, MIN_QUESTIONS - state.questionCount);
  const daysNeeded = Math.max(0, MIN_CURRICULUM_DAYS - uniqueDays.length);

  const uncoveredPlannedDays = state.interviewPlan.targetDays
    .map(d => d.day)
    .filter(day => !uniqueDays.includes(day));

  return {
    questionsAsked: state.questionCount,
    questionsNeeded,
    daysCovered: uniqueDays,
    daysCount: uniqueDays.length,
    daysNeeded,
    canFinish: questionsNeeded === 0 && daysNeeded === 0,
    uncoveredPlannedDays,
  };
}

export function canFinishInterview(state: InterviewState): boolean {
  return getCoverageStatus(state).canFinish;
}

export function getNextSuggestedDay(state: InterviewState): number | null {
  const status = getCoverageStatus(state);
  if (status.uncoveredPlannedDays.length > 0) {
    return status.uncoveredPlannedDays[0];
  }
  return null;
}

export function getCoverageConstraintText(state: InterviewState): string {
  const status = getCoverageStatus(state);
  const parts: string[] = [];

  if (status.questionsNeeded > 0) {
    parts.push(`Need ${status.questionsNeeded} more conversational turn(s)/question(s)`);
  }
  if (status.daysNeeded > 0) {
    parts.push(`Need to cover ${status.daysNeeded} more distinct curriculum day(s)`);
  }
  if (status.uncoveredPlannedDays.length > 0) {
    parts.push(`Planned days you should steer towards eventually: ${status.uncoveredPlannedDays.join(', ')}`);
  }

  return parts.length > 0
    ? `COVERAGE NOT MET: ${parts.join('. ')}. DO NOT end the interview. Follow-up questions DO count towards the question total, so prioritize deep follow-ups over jumping to new days.`
    : 'Coverage requirements met. Interview may conclude when sufficient evidence is gathered.';
}
