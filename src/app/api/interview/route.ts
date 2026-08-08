// POST /api/interview — the organizer-required endpoint
// Contract defined in technical-spec.md — DO NOT MODIFY

import { NextRequest, NextResponse } from 'next/server';
import { startInterview, processAnswer, finishInterview, SessionError } from '@/lib/interview/controller';
import type { InterviewResponse, ErrorResponse } from '@/lib/types/api';

export const maxDuration = 60; // Allow up to 60 seconds for Gemini API calls on Vercel
export const runtime = 'edge'; // Vercel Edge Runtime (up to 30s free execution, no cold boots)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate sessionId
    if (!body.sessionId || typeof body.sessionId !== 'string') {
      return errorResponse('Missing or invalid sessionId', 'MISSING_SESSION_ID', 400);
    }

    const { sessionId } = body;

    // Route: Init request (has candidate field)
    if (body.candidate) {
      // (Stateless: no duplicate session check needed)

      const result: InterviewResponse = await startInterview(sessionId, body.candidate);
      return NextResponse.json(result);
    }

    // Route: Turn request (has message field)
    if ('message' in body) {
      const message = body.message;
      const state = body.state;

      if (!state) return errorResponse('Missing interview state', 'MISSING_STATE', 400);

      // Validate message
      if (typeof message !== 'string' || message.trim().length === 0) {
        return errorResponse('Message cannot be empty', 'EMPTY_MESSAGE', 400);
      }

      const result: InterviewResponse = await processAnswer(sessionId, message.trim(), state);
      return NextResponse.json(result);
    }

    // Route: Early Exit request
    if (body.action === 'end') {
      const state = body.state;
      if (!state) return errorResponse('Missing interview state', 'MISSING_STATE', 400);
      
      const result: InterviewResponse = await finishInterview(sessionId, state);
      return NextResponse.json(result);
    }

    return errorResponse(
      'Request must contain "candidate" (to start), "message" (to continue), or "action" (to end)',
      'INVALID_REQUEST',
      400
    );
  } catch (error: any) {
    if (error instanceof SessionError) {
      const statusMap: Record<string, number> = {
        SESSION_NOT_FOUND: 404,
        INTERVIEW_COMPLETED: 409,
      };
      const status = statusMap[error.code] ?? 400;
      return errorResponse(error.message, error.code, status);
    }

    console.error('[/api/interview] Unhandled error:', error);
    return NextResponse.json({ 
      error: 'An internal error occurred. Please try again.', 
      code: 'INTERNAL_ERROR',
      message: error?.message,
      stack: error?.stack 
    }, { status: 500 });
  }
}

function errorResponse(message: string, code: string, status: number) {
  const body: ErrorResponse = { error: message, code };
  return NextResponse.json(body, { status });
}
