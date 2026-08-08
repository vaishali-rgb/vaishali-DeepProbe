// Final evaluator — generates evidence-based feedback at interview end

import { generateJSON } from './client';
import type { FeedbackResponse } from '@/lib/types/api';
import type { InterviewState } from '@/lib/types/interview';

const EVALUATOR_SYSTEM_PROMPT = `You are a senior technical evaluator reviewing an AI engineering interview.

RULES:
- Base ALL feedback strictly on the structured evidence provided. Do not invent strengths or gaps not demonstrated.
- Strengths should reference SPECIFIC demonstrated behavior (e.g., "Clearly explained the retrieval-to-generation flow").
- Gaps should reference SPECIFIC demonstrated weaknesses (e.g., "Could not articulate indexing tradeoffs").
- Next steps should be ACTIONABLE (e.g., "Practice designing router-based multi-agent systems").
- Summary should be 2-3 sentences capturing overall performance and depth.
- Do NOT use generic phrases like "The candidate is good at AI."

OUTPUT FORMAT:
Respond with valid JSON matching the exact specified schema. Do not include any text outside the JSON.`;

export async function generateFinalFeedback(
  state: InterviewState
): Promise<FeedbackResponse> {
  const topics = Object.values(state.topicKnowledge);

  const topicSummary = topics.map(t => {
    let summary = `- Day ${t.curriculumDay}: ${t.topic} -> Knowledge State: ${t.knowledgeState}`;
    if (t.evidence.length > 0) summary += `\n  Strengths: ${t.evidence.join('; ')}`;
    if (t.gaps.length > 0) summary += `\n  Gaps: ${t.gaps.join('; ')}`;
    if (t.misconceptions.length > 0) summary += `\n  Misconceptions: ${t.misconceptions.join('; ')}`;
    if (t.recoveryAttempts > 0) summary += `\n  Note: Candidate recovered from a weak start.`;
    return summary;
  }).join('\n\n');

  const userPrompt = `Generate a highly structured, actionable final interview assessment based on the following evidence ledger.

CANDIDATE: ${state.candidateData.member.name} (${state.candidateData.member.jobRole}, ${state.candidateData.member.yearsExperience} years experience)
TOTAL QUESTIONS: ${state.questionCount}

EVIDENCE LEDGER BY TOPIC:
${topicSummary || 'No topic evidence recorded.'}

Respond with JSON:
{
  "summary": "2-3 sentence overall assessment",
  "technicalStrengths": ["specific technical strength 1", "specific technical strength 2"],
  "technicalGaps": ["specific technical gap 1", "specific technical gap 2"],
  "demonstratedSkills": ["e.g. Prompt Engineering", "Vector Databases"],
  "misconceptions": ["any fundamental misunderstandings, or empty array"],
  "communicationStrengths": ["e.g. clearly articulates tradeoffs"],
  "communicationGaps": ["e.g. struggles to explain concepts simply"],
  "curriculumCoverage": ["Day 12: Prompt Engineering", "Day 7: Embeddings"],
  "recommendedNextSteps": ["actionable technical recommendation 1", "actionable technical recommendation 2"]
}`;

  try {
    const result = await generateJSON<FeedbackResponse>(EVALUATOR_SYSTEM_PROMPT, userPrompt);
    return validateFeedback(result);
  } catch (err) {
    console.error("Failed to generate final feedback, using fallback:", err);
    return buildFallbackFeedback(state);
  }
}

function validateFeedback(feedback: Partial<FeedbackResponse>): FeedbackResponse {
  return {
    summary: feedback.summary || 'Interview completed. Please review the detailed feedback below.',
    technicalStrengths: Array.isArray(feedback.technicalStrengths) ? feedback.technicalStrengths : [],
    technicalGaps: Array.isArray(feedback.technicalGaps) ? feedback.technicalGaps : [],
    demonstratedSkills: Array.isArray(feedback.demonstratedSkills) ? feedback.demonstratedSkills : [],
    misconceptions: Array.isArray(feedback.misconceptions) ? feedback.misconceptions : [],
    communicationStrengths: Array.isArray(feedback.communicationStrengths) ? feedback.communicationStrengths : [],
    communicationGaps: Array.isArray(feedback.communicationGaps) ? feedback.communicationGaps : [],
    curriculumCoverage: Array.isArray(feedback.curriculumCoverage) ? feedback.curriculumCoverage : [],
    recommendedNextSteps: Array.isArray(feedback.recommendedNextSteps) && feedback.recommendedNextSteps.length > 0
      ? feedback.recommendedNextSteps
      : ['Review the topics covered in this interview for deeper understanding'],
  };
}

function buildFallbackFeedback(state: InterviewState): FeedbackResponse {
  const topics = Object.values(state.topicKnowledge);
  const coverage = topics.map(t => `Day ${t.curriculumDay}: ${t.topic}`);
  const strengths = state.strengths.slice(0, 5);
  const gaps = state.weaknesses.slice(0, 5);

  return {
    summary: `The candidate completed an interview covering ${topics.length} technical areas. Feedback was generated from backup systems due to a processing error.`,
    technicalStrengths: strengths.length > 0 ? strengths : ['Completed the technical interview'],
    technicalGaps: gaps.length > 0 ? gaps : ['Further depth needed in some areas'],
    demonstratedSkills: topics.filter(t => t.knowledgeState === 'COMPETENT' || t.knowledgeState === 'STRONG').map(t => t.topic),
    misconceptions: state.misconceptions.slice(0, 5),
    communicationStrengths: [],
    communicationGaps: [],
    curriculumCoverage: coverage,
    recommendedNextSteps: ['Continue building projects to deepen practical understanding'],
  };
}
