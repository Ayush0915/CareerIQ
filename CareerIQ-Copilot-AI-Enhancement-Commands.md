# CareerIQ — AI Enhancement Prompts for Copilot

Paste each numbered block into Copilot/Antigravity as its own task. These are additive features, not fixes — do them after the fix pass. Pick 2–3 for depth rather than doing all 5.

---

**1.**
```
Add a streaming version of the resume analysis endpoint. In
backend/routers/analyze.py, add a new POST /analyze/stream endpoint that
returns a StreamingResponse (text/event-stream). It should yield JSON-encoded
SSE messages as each stage completes: {"step": "parsing"}, then
{"step": "skills_extracted", "skills": [...]}, then stream Groq's response
tokens as they arrive from llm_master_evaluate (modify llm_evaluator.py to
support streaming via client.chat.completions.create(..., stream=True) and
yield chunks), and finally {"step": "done", "result": {...full AnalysisResponse...}}.

Then in frontend/src/hooks/useAnalysis.js, replace the current setInterval-based
fake progress simulation with a real EventSource (or fetch + ReadableStream)
that consumes /analyze/stream and updates progress/state based on the actual
"step" messages received, not a fixed timer.
```

**2.**
```
Add a resume version-diff feature. Create a new backend endpoint
POST /api/v1/analyze/compare that accepts two resume files and one job
description, runs the existing analyze_resume logic on both, and returns a
diff object: { before: AnalysisResponse, after: AnalysisResponse,
score_delta: number, skills_gained: [...], skills_lost: [...] }.

Create a new frontend component frontend/src/components/ResumeDiff.jsx that
renders a two-column "Before / After" layout showing both scores side by side
with the delta highlighted (e.g. "+12 ATS score", "+3 skills matched" in
green, negative deltas in red). Use the `diff` npm package for word-level
diffing of matching bullet points between the two versions.
```

**3.**
```
Add persisted analysis history using localStorage (no backend changes needed
for v1). In frontend/src/hooks/useAnalysis.js, after a successful analysis,
save { id: crypto.randomUUID(), createdAt: Date.now(), jobTitle, score:
data.semantic_match_score, response: data } to a "careeriq_history" array in
localStorage, capped at the most recent 5 entries.

Create frontend/src/components/AnalysisHistory.jsx that reads this array and
renders a clickable list (title, date, score) that lets the user re-view a
past analysis by setting it as the current `data` in the app without
re-calling the API. Add this component to the dashboard sidebar in
ResultsDashboard.jsx.
```

**4.**
```
Add explainable, evidence-backed ATS scoring. In
backend/services/ats_simulator.py, update each of the 8 individual ATS checks
so that instead of returning just a pass/fail boolean and score, each check
also returns an "evidence" object containing 1-2 concrete examples from the
actual resume text that justify the result — e.g. for the quantification
check, return the specific unquantified bullet points found, and for keyword
density, return the specific missing keywords with the JD context that
required them.

Update backend/models/schemas.py to add an `evidence` field to whatever
model represents individual ATS check results.

In frontend/src/components/ATSBreakdown.jsx, render this evidence inline
under each failed check as a small muted text block, e.g. an example weak
bullet with a one-line suggestion, instead of just a checkmark/X.
```

**5.**
```
Add an architecture diagram to the README. In README.md, insert a Mermaid
flowchart (renders natively on GitHub) right after the "What CareerIQ Does"
section, showing the real request flow: Upload (PDF/DOCX) -> Parse & Extract
Text -> fans out via asyncio.gather into four parallel branches (LLM Master
Evaluate via Groq Llama 3.3-70b, Experience Detection, Section Parsing &
Scoring, Semantic Similarity via sentence-transformers) plus ATS Simulation
running off the parsed text -> all branches merge into a single Merge &
Respond step. Use this exact flow, matching backend/routers/analyze.py's
actual asyncio.gather() call.
```

---

## Checklist

- [ ] 1. Streaming LLM responses — replace fake progress bar with real SSE-driven progress
- [ ] 2. Resume version diffing — before/after comparison with score deltas
- [ ] 3. Persisted analysis history — localStorage-backed "last 5 analyses" panel
- [ ] 4. Explainable ATS scoring — evidence-backed pass/fail on each of the 8 checks
- [ ] 5. Architecture diagram in README — Mermaid flowchart of the async orchestration
