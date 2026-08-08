// Gemini API client wrapper — handles connection, JSON mode, retries, timeouts

import { GoogleGenerativeAI } from '@google/generative-ai';

const LLM_TIMEOUT_MS = 45000;
const LLM_MAX_RETRIES = 3;
const MODEL_NAME = 'gemini-3.6-flash';

let genClients: GoogleGenerativeAI[] = [];
let currentClientIndex = 0;

function getClient(): GoogleGenerativeAI {
  if (genClients.length === 0) {
    const keysStr = process.env.GEMINI_API_KEYS;
    const singleKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    let keys: string[] = [];
    if (keysStr) {
      keys = keysStr.split(',').map(k => k.trim()).filter(k => k.length > 0);
    } else if (singleKey) {
      keys = [singleKey];
    }

    if (keys.length === 0) {
      throw new Error('No API keys found. Set GEMINI_API_KEYS (comma separated) or GEMINI_API_KEY');
    }

    genClients = keys.map(key => new GoogleGenerativeAI(key));
  }
  
  // Get current client
  const client = genClients[currentClientIndex];
  
  // Advance the round-robin counter for the NEXT call to spread load
  currentClientIndex = (currentClientIndex + 1) % genClients.length;
  
  return client;
}

export async function generateJSON<T>(
  systemPrompt: string,
  userPrompt: string
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= LLM_MAX_RETRIES; attempt++) {
    try {
      // Get a new client on each attempt (round-robin)
      const client = getClient();
      const model = client.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const result = await Promise.race([
        model.generateContent({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: { role: 'model', parts: [{ text: systemPrompt }] },
        }),
        timeoutPromise(LLM_TIMEOUT_MS),
      ]);

      const text = result.response.text();
      return parseJSONResponse<T>(text);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < LLM_MAX_RETRIES) {
        await sleep(1000 * (attempt + 1)); // backoff
      }
    }
  }

  throw new Error(`Gemini API failed after ${LLM_MAX_RETRIES + 1} attempts: ${lastError?.message}`);
}

export async function generateText(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= LLM_MAX_RETRIES; attempt++) {
    try {
      // Get a new client on each attempt (round-robin)
      const client = getClient();
      const model = client.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: { temperature: 0.7 },
      });

      const result = await Promise.race([
        model.generateContent({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: { role: 'model', parts: [{ text: systemPrompt }] },
        }),
        timeoutPromise(LLM_TIMEOUT_MS),
      ]);

      return result.response.text();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < LLM_MAX_RETRIES) {
        await sleep(1000 * (attempt + 1)); // backoff
      }
    }
  }

  throw new Error(`Gemini API failed after ${LLM_MAX_RETRIES + 1} attempts: ${lastError?.message}`);
}

function parseJSONResponse<T>(text: string): T {
  // Try direct parse first
  try {
    return JSON.parse(text) as T;
  } catch {
    // Try extracting JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim()) as T;
    }
    // Try finding JSON object/array in text
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]) as T;
    }
    throw new Error(`Failed to parse JSON from Gemini response: ${text.slice(0, 200)}`);
  }
}

function timeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Gemini request timed out after ${ms}ms`)), ms)
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
