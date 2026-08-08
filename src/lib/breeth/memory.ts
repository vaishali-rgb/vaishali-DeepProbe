import { writeEpisode, retrieveMemory } from './client';

export async function saveCandidateMemory(candidateId: string, interactionContext: string) {
  // Format the interaction into a memory episode
  const content = `[Candidate: ${candidateId}]
Interview Interaction Context:
${interactionContext}`;

  // Write to Breeth, passing extract_intent: true so the AI engine 
  // analyzes the reasoning and cognitive patterns behind this interaction.
  await writeEpisode(
    content,
    { candidateId, type: 'interview_interaction' },
    true // Extract intent
  );
}

export async function retrieveCandidateMemory(candidateId: string): Promise<string> {
  // Query Breeth for anything related to this candidate's history
  const memories = await retrieveMemory(
    `Candidate ${candidateId} technical skills, evaluation history, and preferences`,
    { candidateId }
  );

  if (memories.length === 0) {
    return "";
  }

  // Format memories into a single context string to inject into the LLM prompt
  return memories
    .map((m: any, index: number) => `Memory ${index + 1}: ${m.content || m.text || JSON.stringify(m)}`)
    .join('\n');
}
