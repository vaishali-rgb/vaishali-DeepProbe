// POST /api/interview — the organizer-required endpoint
// Contract defined in technical-spec.md — DO NOT MODIFY

import { NextRequest, NextResponse } from 'next/server';
import { startInterview, processAnswer, SessionError } from '@/lib/interview/controller';
import { sessionManager } from '@/lib/interview/session-manager';
import type { InterviewResponse, ErrorResponse } from '@/lib/types/api';

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
      // Check for duplicate session
      if (sessionManager.has(sessionId)) {
        return errorResponse('Session already exists', 'SESSION_EXISTS', 409);
      }

      const result: InterviewResponse = await startInterview(sessionId, body.candidate);
      return NextResponse.json(result);
    }

    // Route: Turn request (has message field)
    if ('message' in body) {
      const message = body.message;

      // Validate message
      if (typeof message !== 'string' || message.trim().length === 0) {
        return errorResponse('Message cannot be empty', 'EMPTY_MESSAGE', 400);
      }

      const result: InterviewResponse = await processAnswer(sessionId, message.trim());
      return NextResponse.json(result);
    }

    return errorResponse(
      'Request must contain either "candidate" (to start) or "message" (to continue)',
      'INVALID_REQUEST',
      400
    );
  } catch (error) {
    if (error instanceof SessionError) {
      const statusMap: Record<string, number> = {
        SESSION_NOT_FOUND: 404,
        INTERVIEW_COMPLETED: 409,
      };
      const status = statusMap[error.code] ?? 400;
      return errorResponse(error.message, error.code, status);
    }

    console.error('[/api/interview] Unhandled error:', error);
    return errorResponse(
      'An internal error occurred. Please try again.',
      'INTERNAL_ERROR',
      500
    );
  }
}

function errorResponse(message: string, code: string, status: number) {
  const body: ErrorResponse = { error: message, code };
  return NextResponse.json(body, { status });
}
