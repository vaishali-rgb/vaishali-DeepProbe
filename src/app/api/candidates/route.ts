// GET /api/candidates — returns all candidate summaries for the frontend selector

import { NextResponse } from 'next/server';
import candidatesData from '@/data/candidates.json';
import type { CandidatesData } from '@/lib/types/candidate';

export async function GET() {
  const data = candidatesData as CandidatesData;

  const summaries = data.candidates.map(c => ({
    id: c.member.id,
    name: c.member.name,
    jobRole: c.member.jobRole,
    yearsExperience: c.member.yearsExperience,
    education: c.member.education,
    status: c.member.status,
    missionsCompleted: c.signals.missionsCompleted,
    missionsFirstTry: c.signals.missionsFirstTry,
    commitDays: c.signals.commitDays,
    totalMissions: c.missions.length,
    passedCount: c.missions.filter(m => m.passed === true).length,
    failedCount: c.missions.filter(m => m.passed === false && !m.skipped).length,
    skippedCount: c.missions.filter(m => m.skipped === true).length,
  }));

  return NextResponse.json({ candidates: summaries });
}
