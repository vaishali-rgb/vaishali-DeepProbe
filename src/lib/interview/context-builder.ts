// Context builder — compresses interview state into ~1200 tokens for Gemini
// This is the core innovation: Gemini never sees the full transcript

import type { InterviewState } from '@/lib/types/interview';
import type { CurriculumDay } from '@/lib/types/curriculum';
import { getDayByNumber, getModuleForDay } from '@/lib/curriculum/retriever';
import { getEvidenceSummary, getFollowUpOpportunities } from './evidence';
import { getCoverageConstraintText } from './coverage-guard';
import { formatAskedQuestions } from './repetition-checker';
import { getDifficultyLabel } from './difficulty';

export function buildInterviewContext(
  state: InterviewState,
  targetDay?: number
): string {
  const sections: string[] = [];

  sections.push(buildCandidateSection(state));
  sections.push(buildInterviewStatusSection(state));
  sections.push(buildCurriculumSection(state, targetDay));
  sections.push(buildEvidenceSection(state));
  sections.push(buildRecentConversationSection(state));
  sections.push(buildConstraintsSection(state));

  return sections.filter(s => s.length > 0).join('\n\n');
}

function buildCandidateSection(state: InterviewState): string {
  const { member, signals } = state.candidateData;
  const analysis = state.candidateAnalysis;

  const passedCount = analysis.passedMissions.length;
  const failedCount = analysis.failedMissions.length;
  const skippedCount = analysis.skippedMissions.length;

  return `=== CANDIDATE PROFILE ===
Name: ${member.name}
Role: ${member.jobRole} | Experience: ${member.yearsExperience} years | Education: ${member.education}
Cohort Status: ${member.status}
Missions: ${passedCount} passed, ${failedCount} failed, ${skippedCount} skipped
Commit Days: ${signals.commitDays}/31 | First-try rate: ${Math.round(analysis.firstTryRate * 100)}%
Consistency: ${analysis.consistencyLevel} | Experience tier: ${analysis.experienceTier}`;
}

function buildInterviewStatusSection(state: InterviewState): string {
  const daysCovered = [...new Set(state.curriculumDaysCovered)];
  return `=== INTERVIEW STATUS ===
Phase: ${state.phase}
Questions asked: ${state.questionCount}
Difficulty: ${getDifficultyLabel(state.difficulty)} (${state.difficulty}) — trajectory: ${state.difficultyTrajectory}
Curriculum days covered: [${daysCovered.join(', ')}] (${daysCovered.length} unique)
Topics covered: ${state.topicsCovered.join(', ') || 'none yet'}`;
}

function buildCurriculumSection(state: InterviewState, targetDay?: number): string {
  const day = targetDay ?? state.interviewPlan.targetDays.find(
    d => !state.curriculumDaysCovered.includes(d.day)
  )?.day ?? state.interviewPlan.targetDays[0]?.day;

  if (!day) return '';

  const currDay = getDayByNumber(day);
  if (!currDay) return '';

  const mod = getModuleForDay(day);
  const mission = state.candidateData.missions.find(m => m.day === day);

  let missionInfo = 'No mission data';
  if (mission) {
    if (mission.skipped) {
      missionInfo = 'SKIPPED (do not assume knowledge, probe gently)';
    } else if (mission.passed) {
      missionInfo = `PASSED (${mission.attempts} attempt${(mission.attempts ?? 0) > 1 ? 's' : ''})`;
    } else {
      missionInfo = `DID NOT PASS (${mission.attempts} attempt${(mission.attempts ?? 0) > 1 ? 's' : ''} — probe gently, do NOT mention failure)`;
    }
  }

  return `=== CURRENT CURRICULUM CONTEXT ===
Day ${currDay.day}: ${currDay.title}
Module: ${mod?.title ?? 'Unknown'} (Module ${mod?.n ?? '?'})
Type: ${currDay.type}
Tools: ${currDay.tools.join(', ')}
Objectives:
${currDay.objectives.map(o => `- ${o}`).join('\n')}
Candidate mission status: ${missionInfo}`;
}

function buildEvidenceSection(state: InterviewState): string {
  const evidenceSummary = getEvidenceSummary(state.evidence);
  const followUps = getFollowUpOpportunities(state.evidence);

  let section = `=== ACCUMULATED EVIDENCE ===\n${evidenceSummary}`;

  if (state.strengths.length > 0) {
    section += `\n\nKey strengths: ${state.strengths.slice(0, 5).join(', ')}`;
  }
  if (state.weaknesses.length > 0) {
    section += `\nKey weaknesses: ${state.weaknesses.slice(0, 5).join(', ')}`;
  }
  if (state.importantClaims.length > 0) {
    section += `\nImportant claims: ${state.importantClaims.slice(0, 3).join('; ')}`;
  }
  if (followUps.length > 0) {
    section += `\n\nFollow-up opportunities: ${followUps.slice(0, 3).join(', ')}`;
  }

  return section;
}

function buildRecentConversationSection(state: InterviewState): string {
  if (state.recentMessages.length === 0) return '';

  const lines = state.recentMessages.map(m => {
    const role = m.role === 'interviewer' ? 'Interviewer' : 'Candidate';
    return `[${role}]: ${m.content}`;
  });

  return `=== RECENT CONVERSATION ===\n${lines.join('\n')}`;
}

function buildConstraintsSection(state: InterviewState): string {
  const coverageText = getCoverageConstraintText(state);
  const askedText = formatAskedQuestions(state.questionsAsked);

  let section = `=== CONSTRAINTS ===\n${coverageText}`;

  if (askedText) {
    section += `\n\nQUESTIONS ALREADY ASKED (DO NOT REPEAT):\n${askedText}`;
  }

  // Phase guidance
  const phaseGuidance = getPhaseGuidance(state);
  if (phaseGuidance) {
    section += `\n\nPHASE GUIDANCE: ${phaseGuidance}`;
  }

  return section;
}

function getPhaseGuidance(state: InterviewState): string {
  const phaseMap: Record<string, string> = {
    WARM_UP: 'Ask about the candidate\'s projects and learning journey. Start with open-ended, project-based questions.',
    DEEP_DIVE: 'INTERACTIVE PHASE: You MUST ask follow-up questions to probe their previous answer. Do not jump to a new topic until you have explored their current answer deeply. Use clarify, challenge, or scenario follow-ups.',
    SYSTEM_DESIGN: 'Give practical engineering scenarios. Test architectural thinking and production readiness.',
    FINAL_ASSESSMENT: 'Wrap up the interview. Generate final assessment.',
  };
  return phaseMap[state.phase] ?? '';
}
