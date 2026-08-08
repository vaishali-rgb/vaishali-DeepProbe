// Final evaluator — generates evidence-based feedback at interview end

import { generateJSON } from './client';
import type { GeminiFinalEvaluation } from './schemas';
import type { InterviewState } from '@/lib/types/interview';
import { getEvidenceSummary, getTopicScores, getAllStrengths, getAllGaps } from '@/lib/interview/evidence';

const EVALUATOR_SYSTEM_PROMPT = `You are a senior technical evaluator reviewing an AI engineering interview.

RULES:
- Base ALL feedback on the evidence provided. Do not invent strengths or gaps not demonstrated.
- Strengths should reference SPECIFIC demonstrated behavior (e.g., "Clearly explained the retrieval-to-generation flow").
- Gaps should reference SPECIFIC demonstrated weaknesses (e.g., "Could not articulate indexing tradeoffs").
- Next steps should be ACTIONABLE (e.g., "Practice designing router-based multi-agent systems").
- Summary should be 2-3 sentences capturing overall performance.
- Do NOT use generic phrases like "The candidate is good at AI."

OUTPUT FORMAT:
Respond with valid JSON only.`;

export async function generateFinalFeedback(
  state: InterviewState
): Promise<GeminiFinalEvaluation> {
  const evidenceSummary = getEvidenceSummary(state.evidence);
  const topicScores = getTopicScores(state.evidence);

  const userPrompt = `Generate a final interview assessment based on the following evidence.

CANDIDATE: ${state.candidateData.member.name} (${state.candidateData.member.jobRole}, ${state.candidateData.member.yearsExperience} years experience)

EVIDENCE FROM INTERVIEW:
${evidenceSummary}

TOPIC SCORES:
${Object.entries(topicScores).map(([topic, score]) => `${topic}: ${score}/10`).join('\n')}

ACCUMULATED STRENGTHS:
${state.strengths.join('\n') || 'None recorded'}

ACCUMULATED WEAKNESSES:
${state.weaknesses.join('\n') || 'None recorded'}

MISCONCEPTIONS:
${state.misconceptions.join('\n') || 'None recorded'}

IMPORTANT CLAIMS:
${state.importantClaims.join('\n') || 'None recorded'}

Questions asked: ${state.questionCount}
Curriculum days covered: ${[...new Set(state.curriculumDaysCovered)].length}

Respond with JSON:
{
  "summary": "2-3 sentence overall assessment",
  "strengths": ["evidence-based strength 1", "evidence-based strength 2", ...],
  "gaps": ["evidence-based gap 1", "evidence-based gap 2", ...],
  "next": ["actionable recommendation 1", "actionable recommendation 2", ...]
}`;

  try {
    const result = await generateJSON<GeminiFinalEvaluation>(EVALUATOR_SYSTEM_PROMPT, userPrompt);
    return validateFeedback(result);
  } catch {
    return buildFallbackFeedback(state);
  }
}

function validateFeedback(feedback: GeminiFinalEvaluation): GeminiFinalEvaluation {
  return {
    summary: feedback.summary || 'Interview completed. Please review the detailed feedback below.',
    strengths: Array.isArray(feedback.strengths) && feedback.strengths.length > 0
      ? feedback.strengths
      : ['Completed the technical interview'],
    gaps: Array.isArray(feedback.gaps) && feedback.gaps.length > 0
      ? feedback.gaps
      : ['Areas for further study were identified during the interview'],
    next: Array.isArray(feedback.next) && feedback.next.length > 0
      ? feedback.next
      : ['Review the topics covered in this interview for deeper understanding'],
  };
}

function buildFallbackFeedback(state: InterviewState): GeminiFinalEvaluation {
  const strengths = getAllStrengths(state.evidence);
  const gaps = getAllGaps(state.evidence);
  const topicScores = getTopicScores(state.evidence);

  const strongTopics = Object.entries(topicScores)
    .filter(([, score]) => score >= 7)
    .map(([topic]) => topic);

  const weakTopics = Object.entries(topicScores)
    .filter(([, score]) => score < 5)
    .map(([topic]) => topic);

  return {
    summary: `The candidate demonstrated knowledge across ${Object.keys(topicScores).length} topics. ${strongTopics.length > 0 ? `Strongest areas include ${strongTopics.join(' and ')}.` : ''} ${weakTopics.length > 0 ? `Areas needing improvement include ${weakTopics.join(' and ')}.` : ''}`.trim(),
    strengths: strengths.length > 0 ? strengths.slice(0, 5) : ['Completed the technical interview'],
    gaps: gaps.length > 0 ? gaps.slice(0, 5) : ['Further depth needed in some areas'],
    next: weakTopics.length > 0
      ? weakTopics.map(t => `Study ${t} in more depth with practical exercises`)
      : ['Continue building projects to deepen practical understanding'],
  };
}
