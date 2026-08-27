import logging
import os
import re
from pathlib import Path

import numpy as np
from fastembed import TextEmbedding

EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"

logger = logging.getLogger(__name__)

_model = None


def _cache_dir() -> str:
    """Where the embedding model lives on disk.

    fastembed defaults to the system temp directory, which Windows clears —
    silently re-downloading 67MB on some later run. Pin it somewhere durable.
    """
    try:
        from core.config import settings

        target = Path(settings.model_cache_dir)
    except Exception:  # pragma: no cover - config-free use (scripts, tests)
        target = Path(
            os.environ.get(
                "MODEL_CACHE_DIR", str(Path.home() / ".cache" / "careeriq" / "models")
            )
        )

    target.mkdir(parents=True, exist_ok=True)
    return str(target)


def _threads() -> int | None:
    """How many threads onnxruntime may use, or None to let it decide.

    onnxruntime sizes its thread pool from the host's core count, which on a
    shared container bears no relation to the CPU share actually allotted. On a
    0.1-CPU instance that is eight threads contending for a tenth of a core —
    slower than one thread having it outright, and the contention is what
    starves the rest of the process. Set EMBEDDING_THREADS=1 there.
    """
    try:
        from core.config import settings

        value = settings.embedding_threads
    except Exception:  # pragma: no cover - config-free use (scripts, tests)
        value = int(os.environ.get("EMBEDDING_THREADS", "0") or 0)

    return value if value > 0 else None


def get_model():
    global _model
    if _model is None:
        cache = _cache_dir()
        threads = _threads()
        logger.info(
            "Loading %s (cache: %s, threads: %s)",
            EMBEDDING_MODEL,
            cache,
            threads or "auto",
        )
        _model = TextEmbedding(
            model_name=EMBEDDING_MODEL, cache_dir=cache, threads=threads
        )
    return _model


def warm_up() -> None:
    """Load the embedding model and run one throwaway embedding.

    Called from the FastAPI lifespan hook so the first real request does not
    pay the model load. Safe to call more than once.
    """
    list(get_model().embed(["warm up"]))


def _cosine(matrix: np.ndarray, vector: np.ndarray) -> np.ndarray:
    """Cosine similarity of each row in ``matrix`` against ``vector``.

    Replaces sklearn.metrics.pairwise.cosine_similarity, which was the only
    thing scikit-learn was imported for — roughly 40MB of wheels for one dot
    product.
    """
    matrix = np.asarray(matrix, dtype=np.float32)
    vector = np.asarray(vector, dtype=np.float32).reshape(-1)

    matrix_norms = np.linalg.norm(matrix, axis=1)
    vector_norm = np.linalg.norm(vector)
    denominator = matrix_norms * vector_norm
    # Guard against a zero-length embedding rather than emitting NaN.
    denominator = np.where(denominator == 0, 1e-12, denominator)

    return (matrix @ vector) / denominator


def simple_sentence_split(text: str):
    """
    Regex-based sentence splitter (no NLTK).
    """
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if len(s.strip()) > 20]


def calculate_similarity(resume_text: str, jd_text: str, top_k: int = 5):

    if not resume_text or not jd_text:
        return {"final_score": 0.0, "top_matches": []}

    sentences = simple_sentence_split(resume_text)

    filtered_sentences = []

    for sentence in sentences:
        s = sentence.lower()

        if re.search(r'\b(email|phone|linkedin|github|leet|hackerrank)\b', s):
            continue

        if re.search(r'\b(bachelor|school|education|cgpa|percent)\b', s):
            continue

        filtered_sentences.append(sentence)

    if not filtered_sentences:
        filtered_sentences = sentences

    model = get_model()
    jd_embedding = list(model.embed([jd_text]))[0]
    sentence_embeddings = np.array(list(model.embed(filtered_sentences)))

    similarities = _cosine(sentence_embeddings, jd_embedding)

    sentence_scores = list(zip(filtered_sentences, similarities, strict=True))
    sentence_scores.sort(key=lambda x: x[1], reverse=True)

    top_matches = sentence_scores[:top_k]

    if top_matches:
        final_score = np.mean([score for _, score in top_matches])
    else:
        final_score = 0.0

    return {
        "final_score": round(float(final_score) * 100, 2),
        "top_matches": [
            (sent, round(float(score) * 100, 2))
            for sent, score in top_matches
        ]
    }