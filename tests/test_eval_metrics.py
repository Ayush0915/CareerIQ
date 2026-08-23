"""Tests for the evaluation metrics themselves.

A measurement instrument that is wrong is worse than no measurement, because
it produces confident numbers that justify the wrong decisions. These check the
metrics against cases where the correct answer is known by construction.
"""
import pytest

from evals import metrics


class TestNDCG:
    def test_perfect_ranking_scores_one(self):
        assert metrics.ndcg([3, 2, 1, 0]) == pytest.approx(1.0)

    def test_reversed_ranking_scores_low(self):
        assert metrics.ndcg([0, 1, 2, 3]) < 0.75

    def test_single_item(self):
        assert metrics.ndcg([3]) == pytest.approx(1.0)

    def test_empty(self):
        assert metrics.ndcg([]) == 0.0

    def test_all_zero_relevance(self):
        assert metrics.ndcg([0, 0, 0]) == 0.0

    def test_k_truncation_ignores_the_tail(self):
        assert metrics.ndcg([3, 3, 0, 0], k=2) == pytest.approx(1.0)

    def test_swapping_the_top_two_costs_more_than_the_bottom_two(self):
        top_swap = metrics.ndcg([2, 3, 1, 0])
        bottom_swap = metrics.ndcg([3, 2, 0, 1])
        assert top_swap < bottom_swap


class TestRBO:
    def test_identical_lists_score_one(self):
        """The extrapolated form must not penalize a perfect short ranking —
        the truncated form reports about 0.34 here."""
        items = ["a", "b", "c", "d"]
        assert metrics.rbo(items, items) == pytest.approx(1.0, abs=1e-9)

    def test_identical_long_lists_score_one(self):
        items = [str(i) for i in range(25)]
        assert metrics.rbo(items, items) == pytest.approx(1.0, abs=1e-9)

    def test_disjoint_lists_score_zero(self):
        assert metrics.rbo(["a", "b"], ["c", "d"]) == pytest.approx(0.0)

    def test_reversed_scores_below_identical(self):
        items = ["a", "b", "c", "d"]
        assert metrics.rbo(items, list(reversed(items))) < 1.0

    def test_top_disagreement_costs_more(self):
        base = ["a", "b", "c", "d", "e"]
        swap_top = ["b", "a", "c", "d", "e"]
        swap_bottom = ["a", "b", "c", "e", "d"]
        assert metrics.rbo(base, swap_top) < metrics.rbo(base, swap_bottom)

    def test_empty_input(self):
        assert metrics.rbo([], ["a"]) == 0.0

    def test_bounded_between_zero_and_one(self):
        assert 0.0 <= metrics.rbo(["a", "b", "c"], ["c", "a", "b"]) <= 1.0


class TestSpearman:
    def test_perfect_agreement(self):
        assert metrics.spearman([1, 2, 3], [10, 20, 30]) == pytest.approx(1.0)

    def test_perfect_disagreement(self):
        assert metrics.spearman([1, 2, 3], [30, 20, 10]) == pytest.approx(-1.0)

    def test_handles_ties(self):
        assert -1.0 <= metrics.spearman([1, 1, 2], [5, 5, 9]) <= 1.0

    def test_too_short(self):
        assert metrics.spearman([1], [1]) == 0.0

    def test_constant_input_is_not_a_crash(self):
        assert metrics.spearman([1, 1, 1], [1, 2, 3]) == 0.0


class TestPRF:
    def test_exact_match(self):
        result = metrics.prf(["python", "docker"], ["python", "docker"])
        assert result["f1"] == pytest.approx(1.0)

    def test_case_and_whitespace_insensitive(self):
        result = metrics.prf([" Python "], ["python"])
        assert result["f1"] == pytest.approx(1.0)

    def test_no_overlap(self):
        result = metrics.prf(["java"], ["python"])
        assert result["f1"] == 0.0
        assert result["fp"] == 1 and result["fn"] == 1

    def test_both_empty_is_perfect(self):
        assert metrics.prf([], [])["f1"] == 1.0

    def test_partial_match_counts(self):
        result = metrics.prf(["python", "java"], ["python", "docker"])
        assert result["tp"] == 1
        assert result["precision"] == pytest.approx(0.5)
        assert result["recall"] == pytest.approx(0.5)


class TestHelpers:
    def test_jaccard(self):
        assert metrics.jaccard(["a", "b"], ["a", "b"]) == 1.0
        assert metrics.jaccard(["a"], ["b"]) == 0.0
        assert metrics.jaccard(["a", "b"], ["b", "c"]) == pytest.approx(1 / 3)

    def test_jaccard_of_two_empty_sets(self):
        assert metrics.jaccard([], []) == 1.0

    def test_mean_of_empty(self):
        assert metrics.mean([]) == 0.0

    def test_mae(self):
        assert metrics.mae([1.0, 2.0], [1.0, 4.0]) == pytest.approx(1.0)

    def test_mae_length_mismatch(self):
        assert metrics.mae([1.0], [1.0, 2.0]) == 0.0


class TestDataset:
    def test_seed_dataset_loads(self):
        from evals.dataset import load_cases, summary

        cases = load_cases()
        stats = summary(cases)
        assert stats["job_descriptions"] >= 3
        assert stats["candidates"] >= 12

    def test_every_case_has_a_full_relevance_spread(self):
        """Each JD needs a clear best and a clear worst, or ranking metrics
        have nothing to discriminate."""
        from evals.dataset import load_cases

        for case in load_cases():
            grades = {c.relevance for c in case.candidates}
            assert 3 in grades, f"{case.id} has no strong-fit candidate"
            assert 0 in grades, f"{case.id} has no negative control"

    def test_ideal_order_is_sorted_by_relevance(self):
        from evals.dataset import load_cases

        for case in load_cases():
            grades = case.relevance_by_id()
            ordered = [grades[i] for i in case.ideal_order()]
            assert ordered == sorted(ordered, reverse=True)


class TestParseRecall:
    def test_fixtures_score(self):
        from evals.parse_recall import DEFAULT_FIXTURES, score_all

        report = score_all(DEFAULT_FIXTURES)
        assert 0.0 <= report["overall_recall"] <= 1.0
        assert "two-column" in report["by_layout"]

    def test_clean_resume_is_fully_recovered(self):
        from evals.parse_recall import DEFAULT_FIXTURES, score_fixture

        clean = next(f for f in DEFAULT_FIXTURES if f.id == "clean-single-column")
        assert score_fixture(clean).recall == pytest.approx(1.0)
