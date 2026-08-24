import re


def clean_text(text: str) -> str:
    """Clean resume text for NLP processing"""

    if not text:
        return ""

    # Lowercase
    text = text.lower()

    # Remove emails (optional but good)
    text = re.sub(r'\S+@\S+', ' ', text)

    # Remove URLs
    text = re.sub(r'http\S+|www\S+', ' ', text)

    # Remove special characters
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)

    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text).strip()

    return text