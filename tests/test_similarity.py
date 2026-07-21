import pytest
from services.similarity import calculate_similarity, simple_sentence_split


class TestSimilarityNormalCases:
    def test_simple_sentence_split(self):
        text = "This is the first long sentence for testing. Here is another long sentence that should be split! Is this a third valid sentence?"
        sentences = simple_sentence_split(text)
        assert len(sentences) == 3
        assert "This is the first long sentence for testing." in sentences
        assert "Here is another long sentence that should be split!" in sentences

    def test_calculate_similarity_normal(self):
        resume_text = (
            "Engineered scalable backend microservices using Python FastAPI and PostgreSQL database. "
            "Architected automated CI CD pipelines with Docker containerization and Kubernetes orchestration. "
            "Optimized query performance reducing overall API latency by forty percent."
        )
        jd_text = (
            "Seeking a Senior Backend Engineer proficient in Python, FastAPI, PostgreSQL, and Docker. "
            "Experience with microservices architecture and API performance optimization is required."
        )

        result = calculate_similarity(resume_text, jd_text, top_k=3)

        assert isinstance(result, dict)
        assert "final_score" in result
        assert "top_matches" in result
        assert isinstance(result["final_score"], float)
        assert result["final_score"] > 0.0
        assert len(result["top_matches"]) <= 3

        for sent, score in result["top_matches"]:
            assert isinstance(sent, str)
            assert isinstance(score, float)
            assert 0.0 <= score <= 100.0


class TestSimilarityEmptyInput:
    def test_empty_resume_text(self):
        result = calculate_similarity("", "Backend developer required")
        assert result == {"final_score": 0.0, "top_matches": []}

    def test_empty_jd_text(self):
        result = calculate_similarity("Experienced Python engineer", "")
        assert result == {"final_score": 0.0, "top_matches": []}

    def test_both_empty(self):
        result = calculate_similarity("", "")
        assert result == {"final_score": 0.0, "top_matches": []}


class TestSimilarityEdgeCases:
    def test_very_short_resume_text(self):
        # Brief single-sentence resume (> 20 chars)
        short_resume = "Software engineer with 2 years of experience in Python."
        jd_text = "Looking for a Python software engineer with software development experience."
        result = calculate_similarity(short_resume, jd_text)
        assert isinstance(result, dict)
        assert result["final_score"] > 0.0
        assert len(result["top_matches"]) == 1

    def test_sub_twenty_char_sentences_raises_value_error(self):
        # Sentences <= 20 chars get filtered out by simple_sentence_split resulting in empty array
        short_resume = "Hi. Short. Bye."
        with pytest.raises(ValueError):
            calculate_similarity(short_resume, "Software engineer job description requiring experience.")

    def test_all_sentences_filtered_out_fallback(self):
        # Sentences containing email/phone/bachelor get filtered out, triggering fallback
        resume_text = (
            "Contact me via email address user@example.com anytime. "
            "Obtained a bachelor degree in software engineering."
        )
        jd_text = "Software engineering role requiring a bachelor degree in computer science or related field."

        result = calculate_similarity(resume_text, jd_text)
        assert len(result["top_matches"]) > 0

    def test_no_matching_skills_unrelated_text(self):
        resume_text = (
            "Prepared organic pastry dough and baked fresh artisan sourdough bread every morning. "
            "Managed kitchen inventory and coordinated with local organic flour suppliers."
        )
        jd_text = (
            "Developing low-level C++ embedded graphics drivers for automotive microcontroller hardware platforms."
        )

        result = calculate_similarity(resume_text, jd_text)
        assert isinstance(result["final_score"], float)
        # Low similarity expected for completely unrelated domains
        assert result["final_score"] < 50.0

    def test_custom_top_k(self):
        resume_text = (
            "First long sentence describing python development experience in detail. "
            "Second long sentence about fast API web frameworks and REST endpoints. "
            "Third long sentence covering PostgreSQL database optimization and queries. "
            "Fourth long sentence discussing docker containerization and deployment pipelines."
        )
        jd_text = "Python Developer with FastAPI, PostgreSQL, and Docker experience."

        result = calculate_similarity(resume_text, jd_text, top_k=2)
        assert len(result["top_matches"]) == 2
