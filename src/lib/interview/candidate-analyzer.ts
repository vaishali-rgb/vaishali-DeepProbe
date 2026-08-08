// Analyze candidate journey using strategy maps — no nested if/else

import type { CandidateProfile, Mission } from '@/lib/types/candidate';
import type { CandidateAnalysis } from '@/lib/types/interview';

// Strategy map for mission classification
const classifiers = {
  passed: (m: Mission) => m.passed === true,
  failed: (m: Mission) => m.passed === false && !m.skipped,
  skipped: (m: Mission) => m.skipped === true,
  highEffort: (m: Mission) => (m.attempts ?? 0) >= 3,
  firstTry: (m: Mission) => m.passed === true && m.attempts === 1,
};

// Experience tier lookup
const experienceTiers: [number, 'junior' | 'mid' | 'senior' | 'expert'][] = [
  [15, 'expert'],
  [8, 'senior'],
  [3, 'mid'],
  [0, 'junior'],
];

// Consistency level lookup
const consistencyLevels: [number, 'high' | 'medium' | 'low'][] = [
  [25, 'high'],
  [15, 'medium'],
  [0, 'low'],
];

function lookupTier<T>(value: number, tiers: [number, T][]): T {
  for (const [threshold, level] of tiers) {
    if (value >= threshold) return level;
  }
  return tiers[tiers.length - 1][1];
}

export function analyzeCandidate(candidate: CandidateProfile): CandidateAnalysis {
  const { missions, signals, member } = candidate;

  const passed = missions.filter(classifiers.passed);
  const failed = missions.filter(classifiers.failed);
  const skipped = missions.filter(classifiers.skipped);
  const highEffort = missions.filter(classifiers.highEffort);
  const firstTry = missions.filter(classifiers.firstTry);

  const completionRate = signals.missionsCompleted / 31;
  const firstTryRate = signals.missionsFirstTry / Math.max(signals.missionsCompleted, 1);

  return {
    passedMissions: passed.map(m => ({
      day: m.day,
      title: m.title,
      attempts: m.attempts ?? 0,
    })),
    failedMissions: failed.map(m => ({
      day: m.day,
      title: m.title,
      attempts: m.attempts ?? 0,
    })),
    skippedMissions: skipped.map(m => ({
      day: m.day,
      title: m.title,
    })),
    highEffortTopics: highEffort.map(m => ({
      day: m.day,
      title: m.title,
      attempts: m.attempts ?? 0,
    })),
    firstTryTopics: firstTry.map(m => ({
      day: m.day,
      title: m.title,
    })),
    completionRate,
    firstTryRate,
    consistencyLevel: lookupTier(signals.commitDays, consistencyLevels),
    experienceTier: lookupTier(member.yearsExperience, experienceTiers),
  };
}
