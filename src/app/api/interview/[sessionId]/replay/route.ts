// GET /api/interview/:sessionId/replay — returns full interview state for replay

import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/lib/interview/session-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const state = sessionManager.get(sessionId);

  if (!state) {
    return NextResponse.json(
      { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
      { status: 404 }
    );
  }

  // Return sanitized state for the replay UI
  return NextResponse.json({
    sessionId: state.sessionId,
    candidateId: state.candidateId,
    candidateName: state.candidateData.member.name,
    candidateRole: state.candidateData.member.jobRole,
    status: state.status,
    questionCount: state.questionCount,
    curriculumDaysCovered: [...new Set(state.curriculumDaysCovered)],
    topicsCovered: state.topicsCovered,
    difficulty: state.difficulty,
    phase: state.phase,
    evidence: state.evidence,
    strengths: state.strengths,
    weaknesses: state.weaknesses,
    startedAt: state.startedAt,
    updatedAt: state.updatedAt,
  });
}
