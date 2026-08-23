# ── Stage 1: build the dependency environment ────────────────────────────────
FROM python:3.11-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

# Dependency layer, cached independently of application code.
COPY pyproject.toml uv.lock* ./
RUN uv venv /opt/venv && \
    VIRTUAL_ENV=/opt/venv uv pip install -r pyproject.toml


# ── Stage 2: bake the embedding model ────────────────────────────────────────
# Downloading BAAI/bge-small-en-v1.5 at build time rather than on the first
# request is the difference between a warm start and a first user waiting
# through a model download on top of container boot.
FROM builder AS model-cache

ENV PATH="/opt/venv/bin:$PATH" \
    HF_HOME=/opt/models

RUN python -c "\
from fastembed import TextEmbedding; \
m = TextEmbedding(model_name='BAAI/bge-small-en-v1.5'); \
list(m.embed(['warm up'])); \
print('embedding model cached')"


# ── Stage 3: runtime ─────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

RUN groupadd --system app && useradd --system --gid app --home /app app

ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HF_HOME=/opt/models \
    PORT=8000

WORKDIR /app

COPY --from=builder    /opt/venv  /opt/venv
COPY --from=model-cache /opt/models /opt/models
COPY backend/ /app/

RUN chown -R app:app /app /opt/models
USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request,os; urllib.request.urlopen(f'http://127.0.0.1:{os.environ.get(\"PORT\",8000)}/health').read()"

# Single worker on purpose: the in-process LLM cache, rate limiter and usage
# counters are all per-process.  Scale replicas only after moving that state
# out (see the roadmap, Phase 7).
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 1 --proxy-headers --forwarded-allow-ips='*'"]
