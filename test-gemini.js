const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testKey() {
  const key = process.env.GEMINI_API_KEY_1;
  if (!key) {
    console.error("❌ GEMINI_API_KEY_1 is not set in the environment.");
    process.exit(1);
  }

  console.log("Testing GEMINI_API_KEY_1...");
  try {
    const genAI = new GoogleGenerativeAI(key);
    // Use gemini-1.5-flash since 3.6-flash might be a hypothetical/future name or alias.
    // The codebase uses 'gemini-3.6-flash', I will use what's in the client.ts just to be sure, or 'gemini-1.5-flash'.
    // Actually, I'll just use what the user's project uses or gemini-1.5-flash which is known to exist.
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" }); 
    const result = await model.generateContent("Respond with the exact word: SUCCESS");
    console.log("✅ Success! The API key is valid and working. Response:", result.response.text().trim());
  } catch (error) {
    console.error("❌ Failed! The API key is invalid or rate limited.");
    console.error(error.message);
  }
}

testKey();
