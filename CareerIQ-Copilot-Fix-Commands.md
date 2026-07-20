# CareerIQ — Fix Prompts for Copilot

Paste each numbered block into Copilot/Antigravity as its own task. Do them in order — 1 to 6 are blocking issues.

---

**1.**
```
In .gitignore, replace the line `*.json` with specific patterns so package.json
is never ignored. Use:
data/*.csv
data/*.xlsx
data/*.db
Then force-add frontend/package.json and package-lock.json to git and commit them.
```

**2.**
```
In backend/services/job_fetcher.py, remove `verify=False` from both
requests.get() calls to jsearch.p.rapidapi.com. Let it default to verify=True.
```

**3.**
```
In frontend/src/App.jsx, remove the fabricated stats: "4.9 (2.1k reviews)",
"24,000+ resumes analyzed", and the "91% ATS Pass Rate" stat card. Replace the
4-stat strip with real, verifiable values: "8 ATS Checks Per Report",
"5 AI Coaching Tools", "<10s Analysis Time", "Llama 3.3-70b Powered By".
Remove the star-rating and review-count UI entirely.
```

**4.**
```
In frontend/src/index.css, replace:
input:focus, textarea:focus, select:focus, button:focus-visible { outline: none; }
with:
button:focus-visible { outline: 2px solid #5147E5; outline-offset: 2px; border-radius: 6px; }
Also fix line ~127: `.ev-input:focus { border-color: #5147E5 \!important; }` — remove
the stray backslash before !important, it's invalid CSS.
```

**5.**
```
In backend/requirements.txt, run `pip freeze > requirements.txt` inside the
backend venv and commit the pinned version output instead of the current
unpinned package list. Also create backend/.env.example with:
GROQ_API_KEY=your_groq_api_key_here
RAPIDAPI_KEY=your_rapidapi_key_here
Then delete all frontend/vite.config.js.timestamp-*.mjs files and add
`vite.config.js.timestamp-*` to .gitignore.
```

**6.**
```
In frontend/src/hooks/useAnalysis.js, fix the loading-flash bug: currently
`finally { setLoading(false) }` runs before the `setTimeout(() => setData(result), 300)`
callback, causing a brief flash of the landing page. Change the try block to
`await new Promise(r => setTimeout(r, 300))` then `setData(result)` directly,
instead of wrapping setData in setTimeout.
```

**7.**
```
Add responsive breakpoints to frontend/src/App.jsx. Convert the hero section's
two-column inline-style grid (currently fixed side-by-side) to stack vertically
below 768px, and convert the 4-column stats strip
(gridTemplateColumns:'repeat(4,1fr)') to 2 columns on mobile and 1 column below
480px. Use Tailwind responsive classes (md:grid-cols-4, grid-cols-1) instead of
inline styles for this section.
```

**8.**
```
In backend/services/llm_evaluator.py, add a _sanitize_for_prompt() function
that strips common prompt-injection patterns (case-insensitive matches for
"ignore previous instructions", "ignore above instructions", "system:") from
resume_text before it's inserted into the prompt in llm_master_evaluate().
Also wrap the resume excerpt in <<<RESUME>>> / <<<END RESUME>>> delimiters in
the prompt and add a line telling the model to treat that content as untrusted
data, never as instructions.
```

**9.**
```
In backend/services/job_fetcher.py, replace all print() calls with
logger.info() / logger.error() using Python's logging module, matching the
logger pattern already used in backend/main.py. Add
`logger = logging.getLogger(__name__)` at the top of the file.
```

**10.**
```
In backend/routers/analyze.py, add magic-byte validation before parsing the
uploaded file: check that PDF files start with b"%PDF-" and DOCX files start
with b"PK\x03\x04", raising HTTPException(400, "File content doesn't match its
extension.") if not. Do this after the file size check and before writing to
the temp file.
```

**11.**
```
In backend/main.py, remove "groq_key" and "rapidapi_key" from the /health
endpoint response — it should only return {"status": "ok", "version": "4.0.0"}.
```

**12.**
```
In backend/services/job_fetcher.py, fix calculate_job_match(): remove the
arbitrary `* 2.5` multiplier and `min(score * 2.5, 99)` cap. Return the real
percentage (matched / len(resume_skills) * 100, capped at 100) instead.
```

---

## Checklist

- [ ] 1. Fix `.gitignore` `*.json` rule and restore `package.json`
- [ ] 2. Remove `verify=False` in `job_fetcher.py`
- [ ] 3. Replace fabricated landing-page stats with real numbers
- [ ] 4. Restore keyboard focus ring on buttons; fix `\!important` CSS typo
- [ ] 5. Pin `requirements.txt` versions; add `.env.example`; remove stray `vite.config.js.timestamp-*` files
- [ ] 6. Fix loading→landing-page flash bug in `useAnalysis.js`
- [ ] 7. Add responsive breakpoints to hero + stats sections
- [ ] 8. Add prompt-injection sanitization in `llm_evaluator.py`
- [ ] 9. Replace `print()` with `logger` calls in `job_fetcher.py`
- [ ] 10. Add magic-byte file validation in `analyze.py`
- [ ] 11. Strip secret-presence booleans from `/health` endpoint
- [ ] 12. Remove arbitrary `2.5x` multiplier from job match scoring
