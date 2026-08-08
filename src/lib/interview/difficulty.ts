// Difficulty adaptation using state transition table — no if/else chains

import type { Difficulty, DifficultyTrajectory } from '@/lib/types/interview';

type AnswerQuality = 'strong' | 'average' | 'weak';

// State transition table
const transitions: Record<Difficulty, Record<AnswerQuality, Difficulty>> = {
  easy:   { strong: 'medium', average: 'easy',   weak: 'easy' },
  medium: { strong: 'hard',   average: 'medium', weak: 'easy' },
  hard:   { strong: 'hard',   average: 'medium', weak: 'medium' },
};

// Difficulty ordering for trajectory calculation
const difficultyOrder: Record<Difficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

export function adaptDifficulty(
  current: Difficulty,
  answerQuality: AnswerQuality
): { difficulty: Difficulty; trajectory: DifficultyTrajectory } {
  const next = transitions[current][answerQuality];
  const currentOrder = difficultyOrder[current];
  const nextOrder = difficultyOrder[next];

  let trajectory: DifficultyTrajectory = 'stable';
  if (nextOrder > currentOrder) trajectory = 'increasing';
  if (nextOrder < currentOrder) trajectory = 'decreasing';

  return { difficulty: next, trajectory };
}

export function scoreToQuality(score: number): AnswerQuality {
  if (score >= 7) return 'strong';
  if (score >= 4) return 'average';
  return 'weak';
}

export function getDifficultyLabel(difficulty: Difficulty): string {
  const labels: Record<Difficulty, string> = {
    easy: 'Foundational',
    medium: 'Intermediate',
    hard: 'Advanced',
  };
  return labels[difficulty];
}
