// Gemini API client wrapper — handles connection, JSON mode, retries, timeouts

import { GoogleGenerativeAI } from '@google/generative-ai';

const LLM_TIMEOUT_MS = 45000;
const LLM_MAX_RETRIES = 3;
const MODEL_NAME = 'gemini-3.6-flash';

let genClients: GoogleGenerativeAI[] = [];
let currentClientIndex = 0;

function getClient(): GoogleGenerativeAI {
  if (genClients.length === 0) {
    let keys: string[] = [];
    
    // Look for numbered keys (GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.)
    for (let i = 1; i <= 10; i++) {
      const key = process.env[`GEMINI_API_KEY_${i}`];
      if (key && key.trim().length > 0) {
        keys.push(key.trim());
      }
    }

    // Fallback to comma-separated list
    if (keys.length === 0) {
      const keysStr = process.env.GEMINI_API_KEYS;
      if (keysStr) {
        keys = keysStr.split(',').map(k => k.trim()).filter(k => k.length > 0);
      }
    }
    
    // Fallback to single key
    if (keys.length === 0) {
      const singleKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (singleKey) {
        keys = [singleKey];
      }
    }

    if (keys.length === 0) {
      throw new Error('No API keys found. Set GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.');
    }

    genClients = keys.map(key => new GoogleGenerativeAI(key));
  }
  
  // Get current client
  const client = genClients[currentClientIndex];
  
  // Advance the round-robin counter for the NEXT call to spread load
  currentClientIndex = (currentClientIndex + 1) % genClients.length;
  
  return client;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const timeoutPromise = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('LLM Timeout')), ms));

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
      ]) as any;

      const text = result.response.text();
      return JSON.parse(text) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < LLM_MAX_RETRIES) {
        // Parse Google's RetryInfo if available (e.g. "retryDelay":"15s")
        const match = lastError.message.match(/retryDelay":"(\d+)s"/);
        let waitMs = match ? parseInt(match[1], 10) * 1000 : (attempt + 1) * 5000;
        
        console.warn(`[API Rate Limit/Error] Attempt ${attempt + 1} failed. Retrying in ${waitMs / 1000}s...`);
        await sleep(waitMs);
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
