// @ts-nocheck
import { NextResponse } from 'next/server';
import { generateFinalFeedback } from '@/lib/gemini/evaluator';
import type { InterviewState } from '@/lib/types/interview';

export async function GET() {
  const mockState: InterviewState = {
    sessionId: 'test-eval',
    candidateData: {
      member: {
        id: 'user1',
        name: 'Sarah',
        jobRole: 'Data Engineer',
        yearsExperience: 4,
        organizationId: 'org1',
      },
      missions: [],
      skills: [],
    },
    interviewPlan: { targetDays: [], estimatedDuration: 30, focusAreas: [] },
    phase: 'FINAL_ASSESSMENT',
    status: 'completed',
    startTime: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
    difficulty: 'medium',
    evidence: [],
    strengths: ['Strong Python', 'Understands pipelines'],
    weaknesses: ['Vague on vector DBs'],
    misconceptions: ['Thinks RAG is a fine-tuning method'],
    importantClaims: [],
    questionsAsked: [],
    questionCount: 9,
    curriculumDaysCovered: [12, 7],
    topicKnowledge: {
      'Prompt Engineering': {
        curriculumDay: 12,
        topic: 'Prompt Engineering',
        knowledgeState: 'COMPETENT',
        evidence: ['Explained system vs user prompts well', 'Understands guardrails'],
        gaps: ['Struggled with evaluation metrics'],
        misconceptions: [],
        diagnosticAttempts: 0,
        recoveryAttempts: 0,
        followUpsUsed: 2,
        lastQuestionType: 'clarify'
      },
      'Embeddings': {
        curriculumDay: 7,
        topic: 'Embeddings',
        knowledgeState: 'WEAK',
        evidence: [],
        gaps: ['Could not explain how text becomes vectors', 'Did not know cosine similarity'],
        misconceptions: ['Thinks RAG is fine-tuning'],
        diagnosticAttempts: 2,
        recoveryAttempts: 0,
        followUpsUsed: 1,
        lastQuestionType: 'diagnostic'
      }
    }
  };

  try {
    const feedback = await generateFinalFeedback(mockState);
    return NextResponse.json({ success: true, feedback });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
