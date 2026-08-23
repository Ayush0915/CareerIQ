# Evaluation harness

The measurement instrument for every change after Phase 3. Without it,
"did the pipeline rewrite help?" and "which model should we use?" are both
unanswerable, and model selection degenerates into swapping until something
returns parseable output.

## Running it

```bash
# Deterministic pipeline only — no API key needed, no cost
python evals/run.py

# Include the LLM evaluation (spends credits)
python evals/run.py --with-llm

# Machine-readable, for diffing two runs
python evals/run.py --json > baseline.json

# Compare candidate models
python evals/bakeoff.py --models MODEL_A MODEL_B
```

## What is measured

| Metric | What it tells you |
|---|---|
| **nDCG@5 / @10** | Whether the right candidate is ranked first. The standard ranking metric in the published resume-matching literature, so the numbers are comparable outside this repo. |
| **RBO** | Rank agreement, top-weighted — disagreement at rank 1 costs more than at rank 10. Extrapolated form, so identical lists score exactly 1.0 at any length. |
| **Spearman** | Whether the continuous score tracks human grades at all. |
| **skill_f1** | Skill extraction against hand-labelled expectations. |
| **missing_skill_f1** | Whether reported gaps are real gaps. This is what the Phase 0 normalization bug destroyed. |
| **Parser field recall** | Which of name/email/phone/linkedin/github survive extraction, broken down by layout. Two-column resumes are where this falls apart. |
| **Schema conformance** | Share of LLM calls returning valid JSON. The metric that should decide model choice. |

## Honest limitations of the seed set

**The seed set is a smoke test, not a benchmark.** Three job descriptions and
twelve candidates, hand-written with clean separation between grades — the
current pipeline scores nDCG 1.0 on it. A saturated benchmark cannot show
improvement, which is exactly what Phase 5 needs it to do.

Before Phase 5, expand it to **40–60 candidates** with genuinely hard cases:

- Two candidates who should be nearly tied, so ordering is contestable
- A candidate with the right skills described in the wrong vocabulary
  (`K8s` vs `Kubernetes`, `Postgres` vs `PostgreSQL`)
- A career changer whose relevant experience is in a projects section
- A two-column resume whose text extraction is genuinely mangled
- An over-qualified candidate — technically strong, obviously not going to
  accept the role
- A keyword-stuffed resume that should score *lower* than its keyword overlap
  suggests

Public starting points:

- HuggingFace: `cnamuangtoun/resume-job-description-fit`
- Kaggle: resume + job-description pair collections

## Adding cases

One JSON object per line in `evals/data/*.jsonl`:

```json
{
  "id": "unique-case-id",
  "job_title": "Senior Backend Engineer",
  "jd_text": "full job description text",
  "candidates": [
    {
      "id": "candidate-1",
      "resume_text": "full resume text",
      "relevance": 3,
      "expected_skills": ["python", "docker"],
      "expected_missing": ["kubernetes"],
      "notes": "why this grade"
    }
  ]
}
```

Relevance grades: **3** strong fit · **2** good fit · **1** stretch · **0** not a fit.

Every case needs at least one grade-3 and one grade-0, or the ranking metrics
have nothing to discriminate — `tests/test_eval_metrics.py` enforces this.

## Workflow

1. Run `python evals/run.py --json > baseline.json` **before** changing anything.
2. Make the change.
3. Re-run and diff. If the number did not move, the change did not work —
   find out why before continuing.

Phase 5's exit criterion is **+10 nDCG points over the Phase 0 baseline**.
