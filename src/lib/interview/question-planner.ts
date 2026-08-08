// Curriculum-aware interview planner — weighted scoring for topic selection

import type { CandidateAnalysis, InterviewPlan, PlannedDay, Difficulty, QuestionType } from '@/lib/types/interview';
import type { Mission } from '@/lib/types/candidate';
import { getDayByNumber } from '@/lib/curriculum/retriever';

// Scoring weights for topic priority
const SCORE_WEIGHTS = {
  passedFirstTry: 3,     // Can go deep
  passedHighEffort: 5,   // Most interesting to probe
  failed: 4,             // Gentle probing, high demo value
  skipped: 1,            // Avoid as core, ask if external experience
  coreAITopic: 2,        // Days 7-15, 21-24 are most relevant
  setupDay: -3,          // Days 1-3 are low value
} as const;

// Days considered core AI content
const CORE_AI_DAYS = new Set([7, 8, 9, 10, 11, 12, 13, 14, 15, 21, 22, 23, 24]);
const SETUP_DAYS = new Set([1, 2, 3]);

// Difficulty suggestions based on mission performance
const difficultyMap: Record<string, Difficulty> = {
  'passed_1': 'hard',       // First try → go deep
  'passed_low': 'medium',   // 2 attempts → standard
  'passed_high': 'medium',  // Many attempts → probe understanding
  'failed': 'easy',         // Failed → start gentle
  'skipped': 'easy',        // Skipped → exploratory
};

// Question type suggestions based on mission status
const questionTypeMap: Record<string, QuestionType[]> = {
  'passed_1': ['architecture', 'tradeoff', 'system_design'],
  'passed_low': ['scenario', 'why_how', 'debugging'],
  'passed_high': ['conceptual', 'follow_up', 'debugging'],
  'failed': ['conceptual', 'why_how', 'scenario'],
  'skipped': ['conceptual', 'project_based'],
};

function getMissionKey(mission: Mission): string {
  if (mission.skipped) return 'skipped';
  if (!mission.passed) return 'failed';
  if (mission.attempts === 1) return 'passed_1';
  if ((mission.attempts ?? 0) <= 2) return 'passed_low';
  return 'passed_high';
}

function scoreMission(mission: Mission): number {
  let score = 0;
  const key = getMissionKey(mission);

  // Base score from mission status
  const statusScores: Record<string, number> = {
    passed_1: SCORE_WEIGHTS.passedFirstTry,
    passed_low: SCORE_WEIGHTS.passedFirstTry,
    passed_high: SCORE_WEIGHTS.passedHighEffort,
    failed: SCORE_WEIGHTS.failed,
    skipped: SCORE_WEIGHTS.skipped,
  };
  score += statusScores[key] ?? 0;

  // Bonus for core AI topics
  if (CORE_AI_DAYS.has(mission.day)) score += SCORE_WEIGHTS.coreAITopic;

  // Penalty for setup days
  if (SETUP_DAYS.has(mission.day)) score += SCORE_WEIGHTS.setupDay;

  return score;
}

export function generateInterviewPlan(
  analysis: CandidateAnalysis,
  missions: Mission[]
): InterviewPlan {
  // Score and rank all missions
  const scoredMissions = missions
    .map(m => ({
      mission: m,
      score: scoreMission(m),
      key: getMissionKey(m),
    }))
    .sort((a, b) => b.score - a.score);

  // Select top 5-6 days, ensuring diversity
  const selectedDays: PlannedDay[] = [];
  const coveredModules = new Set<number>();

  for (const { mission, key } of scoredMissions) {
    if (selectedDays.length >= 6) break;

    const currDay = getDayByNumber(mission.day);
    if (!currDay) continue;

    // Determine module for diversity
    let moduleN = 0;
    if (mission.day <= 3) moduleN = 1;
    else if (mission.day <= 6) moduleN = 2;
    else if (mission.day <= 10) moduleN = 3;
    else if (mission.day <= 15) moduleN = 4;
    else if (mission.day <= 20) moduleN = 5;
    else if (mission.day <= 24) moduleN = 6;
    else if (mission.day <= 28) moduleN = 7;
    else moduleN = 8;

    // Prefer module diversity after first 4
    if (selectedDays.length >= 4 && coveredModules.has(moduleN)) continue;

    const missionStatus = mission.skipped
      ? 'skipped' as const
      : mission.passed
        ? 'passed' as const
        : 'failed' as const;

    selectedDays.push({
      day: mission.day,
      topic: currDay.title,
      priority: selectedDays.length + 1,
      suggestedDifficulty: difficultyMap[key] ?? 'medium',
      suggestedQuestionTypes: questionTypeMap[key] ?? ['conceptual'],
      missionStatus,
      attempts: mission.attempts ?? 0,
    });

    coveredModules.add(moduleN);
  }

  return {
    targetDays: selectedDays,
    totalTargetQuestions: Math.max(8, selectedDays.length * 2),
  };
}
