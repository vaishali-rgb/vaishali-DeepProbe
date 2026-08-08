const BREETH_API_URL = process.env.BREETH_API_URL || 'https://api.thebreeth.com/v1';

export async function writeEpisode(content: string, metadata: Record<string, any> = {}, extractIntent: boolean = true) {
  const apiKey = process.env.BREETH_API_KEY;
  if (!apiKey) {
    console.warn("Breeth API key missing. Skipping memory write.");
    return null;
  }

  try {
    const response = await fetch(`${BREETH_API_URL}/episodes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        content,
        metadata,
        extract_intent: extractIntent
      })
    });
    
    if (!response.ok) {
      throw new Error(`Breeth API error: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to write to Breeth memory layer:", error);
    return null;
  }
}

export async function retrieveMemory(query: string, filter: Record<string, any> = {}) {
  const apiKey = process.env.BREETH_API_KEY;
  if (!apiKey) {
    console.warn("Breeth API key missing. Returning empty context.");
    return [];
  }

  try {
    const response = await fetch(`${BREETH_API_URL}/retrieve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        query,
        filter
      })
    });

    if (!response.ok) {
      throw new Error(`Breeth API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Failed to retrieve from Breeth memory layer:", error);
    return [];
  }
}
