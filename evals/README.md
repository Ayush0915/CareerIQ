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

## Stress cases

`seed.jsonl` is the smoke test — clean separation, which the pipeline scores
1.0 on. `stress_a.jsonl` and `stress_b.jsonl` are the real benchmark: six
groups built to break specific parts of the pipeline.

| Stress | What it probes |
|---|---|
| `vocabulary` | Two byte-equivalent candidates, one writing `K8s`/`TF`/`Postgres` and one writing them out. Any score gap is surface-form sensitivity. |
| `keyword_stuffing` | A 48-item skills list with zero supporting evidence, against a genuine engineer with fewer keywords. |
| `career_change` | A teacher whose Projects section meets every requirement, against someone whose *title* says Software Engineer but whose work does not. |
| `overqualification` | A principal engineer with 15 years applying to a junior role — maximal keyword overlap, wrong role. |
| `near_tie` | Two ML engineers with genuinely contestable ordering, plus a researcher the JD explicitly discounts. |
| `mangled_extraction` | The same candidate twice: clean text, and the interleaved text a two-column PDF actually produces. |

### Equivalence pairs

Some candidates are declared `equivalent_pairs` — they describe substantively
the same fit, so they must receive near-identical scores. **This catches
defects the ranking metrics hide**: if the order happens to come out right, a
12-point penalty for writing "K8s" instead of "Kubernetes" is invisible to
nDCG but obvious here.

## Current baseline (deterministic pipeline, no LLM)

```
ndcg@5   0.9775      keyword_stuffing     0.8326  <-- weakest
rbo      0.9507      overqualification    0.9648
spearman 0.9033      everything else      1.0000

equivalence   worst gap 12.53   (pv-abbrev 68.9 vs pv-spelled 81.4)
skill_f1 0.9077      missing_skill_f1 0.7663
parser recall 0.8333 (single-column 0.67)
```

### What this already tells us

1. **Keyword stuffing wins.** `ds-stuffed` — 48 listed technologies, no
   evidence of using any — ranks **first**, above the engineer who actually
   built the pipelines. This is the clearest defect in the system.
2. **Experience level is ignored.** `jo-principal` ranks **second** for a role
   explicitly advertised at 0–2 years.
3. **Vocabulary costs 12.5 points.** Identical substance, different spelling.
   This is what the Phase 5 taxonomy work exists to fix.
4. **Extraction mangling costs almost nothing** (0.6 gap) — the embedding model
   is more robust to column interleaving than expected. Useful: it lowers the
   priority of layout-aware parsing relative to the other three.

## Grades are provisional — review them

Every grade in the stress files is **my proposed judgement, not ground truth**.
Cases marked `REVIEW` in their notes are the contestable ones. Reasonable
people would disagree about `nt-research` (does a PhD with one product
transfer beat a pure shipper?) and about `jo-mid` versus `jo-graduate`.

Change them. The labels are the ground truth the whole harness rests on, and
they should reflect *your* judgement about who you would interview.

## Expanding further

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

With the stress cases in place there is now real headroom: 0.9775 overall,
0.8326 on keyword stuffing, and a 12.53-point equivalence gap to close.
