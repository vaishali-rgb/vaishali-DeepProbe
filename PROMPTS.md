# AI-Usage Log & Vibe-Coding Journey (PROMPTS.md)

This document serves as the official AI-usage log and prompt transcript for **DeepProbe: AI Interview Agent**, demonstrating how the application was genuinely "vibe-coded" from zero to production using advanced agentic AI coding assistants.

---

## 1. Initial Concept & Architecture Kickoff

**User Prompt:**
> "I need to build an AI Interview Agent for my hackathon submission. It needs to conduct a personalized technical interview based on a candidate's learning journey (31-day cohort). It should ask dynamic questions, track evidence, enforce coverage (at least 8 questions over 4 topics), and generate a final evaluation. Propose an implementation plan."

**AI Reasoning & Output:**
The AI proposed a stateless, edge-ready Next.js architecture separating the Interview Engine (state, memory, hard constraints) from the LLM Reasoning Engine (Gemini 2.5 Flash). It outlined a 6-phase flow (Warm-up → Fundamentals → Deep Dive → Follow-up → System Design → Final Assessment) and proposed the core data structures (`InterviewState`, `EvidenceRecord`).

**User Prompt:**
> "I love this architecture. Let's start with Phase 1: The Core Engine. Generate the types and the central controller that will handle the state machine."

---

## 2. Core Engine & State Management

**User Prompt:**
> "Create the `controller.ts`, `state.ts`, and `evidence.ts` files. Make sure we use lookup maps and state transition tables instead of massive if/else chains. The AI should not be able to override the hard constraints (8 questions minimum)."

**AI Implementation:**
The AI generated modular, pure functions for state updates and strict constraint guards.

*Key AI-Generated Snippet (`coverage-guard.ts`):*
```typescript
export function canFinishInterview(state: InterviewState): boolean {
  const questionsOk = state.questionCount >= 8;
  const daysOk = new Set(state.curriculumDaysCovered).size >= 4;
  return questionsOk && daysOk;
}
```

---

## 3. Gemini Integration & System Prompt Engineering

**User Prompt:**
> "Now let's connect Gemini 2.5 Flash. I need a robust system prompt for the `interviewer.ts` that enforces JSON output and forces the AI to act as a senior technical evaluator. Also, build a `ContextBuilder` that compresses the transcript into an 'Accumulated Evidence' summary so we don't blow up the context window."

**System Prompt Engineered by AI:**
```markdown
You are a senior technical evaluator reviewing an AI engineering interview.
RULES:
- Base ALL feedback strictly on the structured evidence provided.
- Strengths should reference SPECIFIC demonstrated behavior.
- Gaps should reference SPECIFIC demonstrated weaknesses.
- Next steps should be ACTIONABLE.
- Do NOT use generic phrases.
```

**User Prompt:**
> "Gemini keeps repeating questions if the user gives a vague answer. Add a `RepetitionChecker` that compares the new generated question against the `questionsAsked` array, and forces a retry if it's too similar."

---

## 4. Building the Glassmorphism UI

**User Prompt:**
> "Let's build the frontend. I want a premium, dark-mode glassmorphism aesthetic. Deep navy background with electric blue and violet accents. Use Framer Motion for smooth transitions between interview turns."

**AI Implementation:**
The AI generated the Next.js App Router pages (`app/page.tsx`, `app/interview/[sessionId]/page.tsx`), creating custom Tailwind utility classes for frosted glass effects and integrating `lucide-react` icons.

**User Prompt:**
> "The typing indicator is a bit boring. Can you make a 'ThinkingIndicator' component that looks like spinning rings or glowing dots to show when Gemini is reasoning?"

**AI Implementation:**
*The AI generated a custom SVG animation using Framer Motion to simulate the AI's "neural processing" state.*

---

## 5. Debugging Edge Cases & API Safeguards

**User Prompt:**
> "I'm testing it, but when I hit the Vercel edge function timeout limit (10s), the app crashes. Can we refactor the API route to use the Node runtime with a 60-second `maxDuration`, and add a fail-fast mechanism for 429/401 errors from Google?"

**AI Reasoning:**
The AI identified that Next.js App Router defaults to Edge in some configurations which restricts timeouts. It refactored `route.ts` to explicitly export `export const maxDuration = 60;` and added `timeoutPromise` wrappers to the Gemini fetch calls.

**User Prompt:**
> "Wait, I just got an 'Unknown error' on Vercel. Check the console logs."

**AI Debugging Transcript:**
1. *AI analyzes the Vercel build logs.*
2. *AI identifies that `LLM_TIMEOUT_MS` was set too close to Vercel's absolute limit, causing a race condition.*
3. *AI suggests:* "Let's increase the LLM timeout to 55 seconds and wrap the `GoogleGenerativeAI` call in a strict Promise.race block."

---

## 6. Final Polish: Replay & Evaluation

**User Prompt:**
> "To stand out in the hackathon, let's add a 'Replay' screen. When the interview ends, the user should be able to look back at every question, see exactly *why* the AI decided to ask it (the trigger and learning objective), and what evidence it extracted."

**AI Implementation:**
The AI created `src/app/replay/page.tsx`, hooking into the `InterviewState` to render expandable UI cards that expose the "AI Inner Monologue" (the hidden JSON fields where Gemini logs its reasoning).

**User Prompt:**
> "Add a dedicated 'End Interview' button in the top right. If the user clicks it, it should immediately trigger the Final Evaluator based on the evidence collected so far, bypassing the 8-question minimum."

**AI Implementation:**
The AI integrated a confirmation modal with `framer-motion`, added an `isEvaluating` state, and built a full-screen blurred loading overlay to mask the latency of the final Gemini evaluation call.

---

## 7. Deployment & Vercel Configuration

**User Prompt:**
> "I need to deploy this to Vercel. Give me the `vercel.json`, `next.config.ts`, and update the `README.md` to be extremely professional with mermaid diagrams of our architecture."

**AI Implementation:**
*The AI generated the complete Vercel configuration, ensured all TypeScript errors were resolved (strict mode compliance), and created the comprehensive README.md present in the root directory.*

**User Prompt:**
> "Push all the code to GitHub so I can submit."

**AI Action:**
*Executed git staging, committed with standard conventional commits (`feat: complete AI Interview Agent implementation and polish`), and pushed directly to `origin main`.*

---

## Summary of AI Agency

Throughout this build, the AI agent functioned as a **Senior Pair Programmer**:
1. **Architectural Design:** Proposing state machines over nested conditionals.
2. **Context Optimization:** Designing the `ContextBuilder` to compress chat history into structured evidence, saving tokens and improving LLM accuracy.
3. **Full-Stack Implementation:** Writing everything from backend API routes and TypeScript interfaces to frontend Framer Motion animations.
4. **DevOps & Debugging:** Diagnosing Vercel timeout limits, resolving TypeScript strict-mode errors, and managing Git version control directly from the terminal.

*This project was 100% vibe-coded via conversational prompting, demonstrating the power of agentic AI in rapid software engineering.*
