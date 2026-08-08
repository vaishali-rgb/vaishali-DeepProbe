// In-memory session store — Map<sessionId, InterviewState>

import type { InterviewState } from '@/lib/types/interview';

class SessionStore {
  private sessions = new Map<string, InterviewState>();

  create(sessionId: string, state: InterviewState): void {
    this.sessions.set(sessionId, state);
  }

  get(sessionId: string): InterviewState | null {
    return this.sessions.get(sessionId) ?? null;
  }

  update(sessionId: string, state: InterviewState): void {
    if (!this.sessions.has(sessionId)) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    this.sessions.set(sessionId, state);
  }

  has(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  getAll(): InterviewState[] {
    return [...this.sessions.values()];
  }
}

// Singleton — persists across API calls in the same server process
declare global {
  var _sessionManager: SessionStore | undefined;
}

export const sessionManager = globalThis._sessionManager || new SessionStore();
if (process.env.NODE_ENV !== 'production') {
  globalThis._sessionManager = sessionManager;
}
