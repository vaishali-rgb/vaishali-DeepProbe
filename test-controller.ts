import { processAnswer, startInterview } from './src/lib/interview/controller';
import { CandidatesData } from './src/lib/types/candidate';
import fs from 'fs';

async function test() {
  try {
    const rawData = fs.readFileSync('./src/data/candidates.json', 'utf-8');
    const candidates = JSON.parse(rawData).candidates;
    const candidate = candidates[0];

    const sessionId = "test-session-" + Date.now();
    console.log("Starting interview...");
    const initRes = await startInterview(sessionId, candidate);
    console.log("Start Response:", initRes.reply);

    console.log("Sending answer...");
    const turnRes = await processAnswer(sessionId, "I built a RAG pipeline using Pinecone.");
    console.log("Turn Response:", turnRes.reply);
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

test();
