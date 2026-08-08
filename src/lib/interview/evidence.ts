// Evidence memory system — pure functions for evidence operations

import type { EvidenceRecord } from '@/lib/types/interview';

export function getEvidenceForDay(evidence: EvidenceRecord[], day: number): EvidenceRecord[] {
  return evidence.filter(e => e.day === day);
}

export function getAverageScoreForDay(evidence: EvidenceRecord[], day: number): number {
  const dayEvidence = getEvidenceForDay(evidence, day);
  if (dayEvidence.length === 0) return 0;
  const total = dayEvidence.reduce((sum, e) => sum + e.evaluation.score, 0);
  return Math.round((total / dayEvidence.length) * 10) / 10;
}

export function getAllStrengths(evidence: EvidenceRecord[]): string[] {
  const strengths = new Set<string>();
  evidence.forEach(e => e.evaluation.strengths.forEach(s => strengths.add(s)));
  return [...strengths];
}

export function getAllGaps(evidence: EvidenceRecord[]): string[] {
  const gaps = new Set<string>();
  evidence.forEach(e => e.evaluation.gaps.forEach(g => gaps.add(g)));
  return [...gaps];
}

export function getFollowUpOpportunities(evidence: EvidenceRecord[]): string[] {
  return evidence
    .map(e => e.followUpOpportunity)
    .filter((f): f is string => f !== null && f.length > 0);
}

export function getUniqueDaysCovered(evidence: EvidenceRecord[]): number[] {
  return [...new Set(evidence.map(e => e.day))];
}

export function getTopicScores(evidence: EvidenceRecord[]): Record<string, number> {
  const days = getUniqueDaysCovered(evidence);
  const scores: Record<string, number> = {};
  for (const day of days) {
    const dayEvidence = getEvidenceForDay(evidence, day);
    const topic = dayEvidence[0]?.topic ?? `Day ${day}`;
    scores[topic] = getAverageScoreForDay(evidence, day);
  }
  return scores;
}

export function getEvidenceSummary(evidence: EvidenceRecord[]): string {
  if (evidence.length === 0) return 'No evidence gathered yet.';

  const days = getUniqueDaysCovered(evidence);
  const lines: string[] = [];

  for (const day of days) {
    const dayEvidence = getEvidenceForDay(evidence, day);
    const score = getAverageScoreForDay(evidence, day);
    const topic = dayEvidence[0]?.topic ?? `Day ${day}`;
    const strengths = dayEvidence.flatMap(e => e.evaluation.strengths);
    const gaps = dayEvidence.flatMap(e => e.evaluation.gaps);

    lines.push(`Day ${day} (${topic}): Score ${score}/10`);
    if (strengths.length > 0) lines.push(`  Strengths: ${strengths.join(', ')}`);
    if (gaps.length > 0) lines.push(`  Gaps: ${gaps.join(', ')}`);
  }

  return lines.join('\n');
}
