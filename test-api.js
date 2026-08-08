const fs = require('fs');

async function test() {
  try {
    const rawData = fs.readFileSync('./src/data/candidates.json', 'utf-8');
    const candidates = JSON.parse(rawData).candidates;
    const candidate = candidates[0];
    const sessionId = "test-" + Date.now();

    console.log("Starting session...");
    const initRes = await fetch("http://localhost:3000/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, candidate })
    });
    console.log("Init status:", initRes.status);
    console.log("Init response:", await initRes.text());

    console.log("Sending message...");
    const msgRes = await fetch("http://localhost:3000/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message: "I used Pinecone." })
    });
    console.log("Msg status:", msgRes.status);
    console.log("Msg response:", await msgRes.text());
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
