const fs = require('fs');

async function test() {
  try {
    const rawData = fs.readFileSync('./src/data/candidates.json', 'utf-8');
    const candidates = JSON.parse(rawData).candidates;
    const candidate = candidates[0];
    const sessionId = "test-recovery-" + Date.now();

    console.log("=== TEST: Knowledge Recovery Ladder ===\n");

    // Step 1: Start interview
    console.log("1. Starting interview...");
    const initRes = await fetch("http://localhost:3000/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, candidate })
    });
    const initData = await initRes.json();
    console.log("   Opening:", initData.reply);
    console.log("");

    // Step 2: Say "I don't know" 
    console.log("2. Candidate says: 'I don't know'");
    const msg1Res = await fetch("http://localhost:3000/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message: "I don't know" })
    });
    const msg1Data = await msg1Res.json();
    console.log("   Interviewer:", msg1Data.reply);
    console.log("   [Should be a DIAGNOSTIC/simplified question on the SAME topic, NOT a new topic]");
    console.log("");

    // Step 3: Give a partial answer to the diagnostic
    console.log("3. Candidate gives partial answer: 'I think it controls how the AI behaves'");
    const msg2Res = await fetch("http://localhost:3000/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message: "I think it controls how the AI behaves" })
    });
    const msg2Data = await msg2Res.json();
    console.log("   Interviewer:", msg2Data.reply);
    console.log("   [Should be a RECOVERY follow-up, stepping back up in difficulty]");
    console.log("");

    console.log("=== TEST COMPLETE ===");
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
