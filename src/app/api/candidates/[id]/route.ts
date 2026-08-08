// GET /api/candidates/:id — returns a single candidate's full profile

import { NextRequest, NextResponse } from 'next/server';
import candidatesData from '@/data/candidates.json';
import type { CandidatesData } from '@/lib/types/candidate';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = candidatesData as CandidatesData;
  const candidate = data.candidates.find(c => c.member.id === id);

  if (!candidate) {
    return NextResponse.json(
      { error: 'Candidate not found', code: 'CANDIDATE_NOT_FOUND' },
      { status: 404 }
    );
  }

  return NextResponse.json(candidate);
}
