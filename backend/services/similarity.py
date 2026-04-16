from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re

model = SentenceTransformer("all-MiniLM-L6-v2")


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

    jd_embedding = model.encode([jd_text])
    sentence_embeddings = model.encode(filtered_sentences)

    similarities = cosine_similarity(sentence_embeddings, jd_embedding).flatten()

    sentence_scores = list(zip(filtered_sentences, similarities))
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