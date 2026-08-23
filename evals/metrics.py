"""Ranking and set-comparison metrics.

Deliberately dependency-free beyond numpy: an evaluation harness that is
awkward to run does not get run.

nDCG and Rank Biased Overlap are the two metrics the published resume-matching
work reports, so using them here means the numbers can be compared against
something outside this repository rather than only against ourselves.
"""
from __future__ import annotations

import math
from collections.abc import Iterable, Sequence

# ── Ranking ───────────────────────────────────────────────────────────────────

def dcg(relevances: Sequence[float], k: int | None = None) -> float:
    """Discounted cumulative gain of a ranking, highest relevance first."""
    items = list(relevances)[: k if k else len(relevances)]
    return sum(rel / math.log2(rank + 2) for rank, rel in enumerate(items))


def ndcg(predicted_relevances: Sequence[float], k: int | None = None) -> float:
    """Normalized DCG.

    ``predicted_relevances`` is the true relevance of each item *in the order
    the system ranked them*.  1.0 means the system produced the ideal ordering.
    """
    if not predicted_relevances:
        return 0.0
    ideal = sorted(predicted_relevances, reverse=True)
    denominator = dcg(ideal, k)
    if denominator == 0:
        return 0.0
    return dcg(predicted_relevances, k) / denominator


def rbo(left: Sequence[str], right: Sequence[str], p: float = 0.9) -> float:
    """Rank Biased Overlap of two ranked lists, extrapolated.

    Top-weighted, so disagreement near the top costs more than disagreement
    further down — which matches how anyone actually reads a ranked list.
    ``p`` is the persistence: 0.9 puts roughly 86% of the weight on the first
    ten ranks.

    This is the extrapolated form (RBO_EXT). The simpler truncated form gives
    identical short lists a score well below 1.0 — with four items it reports
    about 0.34 — which makes a perfect ranking look like a failure on a
    scorecard. Extrapolation assumes the unseen tail continues at the observed
    agreement rate, so identical lists score 1.0 at any length.
    """
    if not left or not right:
        return 0.0

    depth = min(len(left), len(right))
    seen_left: set[str] = set()
    seen_right: set[str] = set()
    weighted_sum = 0.0
    overlap_at_depth = 0

    for d in range(1, depth + 1):
        seen_left.add(left[d - 1])
        seen_right.add(right[d - 1])
        overlap_at_depth = len(seen_left & seen_right)
        weighted_sum += (overlap_at_depth / d) * (p**d)

    tail = (overlap_at_depth / depth) * (p**depth)
    return ((1 - p) / p) * weighted_sum + tail


def spearman(a: Sequence[float], b: Sequence[float]) -> float:
    """Spearman rank correlation, without pulling in scipy."""
    if len(a) != len(b) or len(a) < 2:
        return 0.0

    def ranks(values: Sequence[float]) -> list[float]:
        order = sorted(range(len(values)), key=lambda i: values[i])
        out = [0.0] * len(values)
        i = 0
        while i < len(order):
            j = i
            while j + 1 < len(order) and values[order[j + 1]] == values[order[i]]:
                j += 1
            average_rank = (i + j) / 2 + 1
            for k in range(i, j + 1):
                out[order[k]] = average_rank
            i = j + 1
        return out

    ra, rb = ranks(a), ranks(b)
    n = len(ra)
    mean_a = sum(ra) / n
    mean_b = sum(rb) / n
    num = sum((x - mean_a) * (y - mean_b) for x, y in zip(ra, rb, strict=True))
    den_a = math.sqrt(sum((x - mean_a) ** 2 for x in ra))
    den_b = math.sqrt(sum((y - mean_b) ** 2 for y in rb))
    if den_a == 0 or den_b == 0:
        return 0.0
    # Clamp: floating-point accumulation can push a perfect correlation a
    # fraction past 1.0, which then trips any downstream range check.
    return max(-1.0, min(1.0, num / (den_a * den_b)))


# ── Set comparison ────────────────────────────────────────────────────────────

def prf(predicted: Iterable[str], expected: Iterable[str]) -> dict[str, float]:
    """Precision, recall and F1 over two sets of labels."""
    pred = {p.strip().lower() for p in predicted if p and p.strip()}
    gold = {e.strip().lower() for e in expected if e and e.strip()}

    if not pred and not gold:
        return {"precision": 1.0, "recall": 1.0, "f1": 1.0, "tp": 0, "fp": 0, "fn": 0}

    tp = len(pred & gold)
    fp = len(pred - gold)
    fn = len(gold - pred)

    precision = tp / len(pred) if pred else 0.0
    recall = tp / len(gold) if gold else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0

    return {
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "tp": tp,
        "fp": fp,
        "fn": fn,
    }


def jaccard(predicted: Iterable[str], expected: Iterable[str]) -> float:
    pred = {p.strip().lower() for p in predicted}
    gold = {e.strip().lower() for e in expected}
    union = pred | gold
    if not union:
        return 1.0
    return len(pred & gold) / len(union)


# ── Aggregation ───────────────────────────────────────────────────────────────

def mean(values: Sequence[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def mae(predicted: Sequence[float], expected: Sequence[float]) -> float:
    """Mean absolute error, for score calibration checks."""
    if not predicted or len(predicted) != len(expected):
        return 0.0
    return mean([abs(p - e) for p, e in zip(predicted, expected, strict=True)])
