"""Application settings, validated once at import time.

Previously configuration was read with bare ``os.environ.get`` calls scattered
across three service modules, each calling ``load_dotenv()`` again.  A missing
API key surfaced as a failed request deep inside a retry loop rather than as a
startup error.
"""
from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent

# Absolute paths, because a relative "env_file" resolves against the current
# working directory: running uvicorn from backend/ found the file, running a
# script from the repo root silently did not, and the failure looked like
# "API key not set" rather than "wrong directory".
# backend/.env wins where both define a key.
ENV_FILES = (str(REPO_ROOT / ".env"), str(BACKEND_DIR / ".env"))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILES,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ── Identity ──────────────────────────────────────────────────────────
    app_name: str = "CareerIQ API"
    version: str = "4.1.0"
    environment: str = Field(default="development")

    # ── Credentials ───────────────────────────────────────────────────────
    openrouter_api_key: str = ""

    # ── LLM ───────────────────────────────────────────────────────────────
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    app_url: str = "https://github.com/Ayush0915/CareerIQ"

    # Defaults are FREE-tier models (":free" suffix = $0 in and out).
    #
    # Model IDs churn constantly — run `python scripts/check_models.py --free`
    # to see what is actually live before trusting these.
    #
    # Important constraint on the free tier: almost no free model supports
    # schema-enforced output. core.llm negotiates downwards automatically
    # (strict schema -> JSON mode -> prompt-only) so this still works, but the
    # output is validated rather than guaranteed. Free models are also rate
    # limited to roughly 20 requests/minute and 200/day per account, and may be
    # withdrawn without notice.
    # Every ID below was read from GET /api/v1/models, not from a model's
    # display name, AND then called for real. Existing in the catalogue is not
    # the same as being callable: thinkingmachines/inkling:free and
    # inkling-small:free sat in these defaults while returning
    # "403 — only available on agentic harnesses" to every API request. They
    # passed --validate the entire time, because --validate only asked whether
    # the ID existed. Verify with both:
    #
    #   python scripts/check_models.py --validate --deep
    #   python scripts/check_models.py --audit
    #
    # Evaluation chain: needs reasoning quality and a long context. Every model
    # here advertises structured outputs, so the strict rung of the ladder can
    # hold all the way down the chain instead of degrading at the first
    # fallback.
    # Chosen by running the real evaluation schema against every reachable free
    # model and keeping the ones that returned a valid LLMEvaluation:
    #
    #   nemotron-3-super-120b   VALID    9.5s   934 tokens
    #   nemotron-3-nano-30b     VALID   18.1s   633 tokens
    #   nemotron-3-ultra-550b   VALID   58.2s   877 tokens
    #   dots-3-note-preview     truncated at 4000 tokens   <- was the primary
    #   nemotron-nano-9b-v2     truncated at 4000 tokens   <- was fast primary
    #   openrouter/free         truncated at 4000 tokens
    #   poolside/laguna-s-2.1   19 schema violations
    #   z-ai/glm-5.2            429, saturated
    #
    # Reproduce with `python scripts/check_models.py --audit`. Bigger is not
    # better here: the 550B model is six times slower than the 120B for an
    # equally valid object.
    primary_model: str = "nvidia/nemotron-3-super-120b-a12b:free"
    fallback_models: str = (
        "nvidia/nemotron-3-nano-30b-a3b:free,nvidia/nemotron-3-ultra-550b-a55b:free"
    )

    # Coaching chain: short generative outputs, higher call volume, lower
    # quality bar — throughput matters more than depth here.
    fast_primary_model: str = "nvidia/nemotron-3-nano-30b-a3b:free"
    fast_fallback_models: str = (
        "nvidia/nemotron-3-super-120b-a12b:free,nvidia/nemotron-3.5-lightning:free"
    )

    # How to request JSON: "auto" walks the ladder and remembers what worked.
    # Force a rung with "strict", "json_object" or "prompt".
    structured_output_mode: str = "auto"

    llm_timeout_s: float = 60.0
    llm_max_retries: int = 3
    llm_retry_backoff_s: float = 1.5

    # Ceiling on one whole LLM feature, however the ladder behaves underneath.
    # The three settings above compound: each upstream request gets its own
    # llm_timeout_s, is retried llm_max_retries times, and complete_json may
    # walk three output-mode rungs — so one slow free-tier provider can hold a
    # request for minutes. Every caller of the LLM is optional by design, so a
    # deadline that degrades to the deterministic result beats an open-ended
    # wait. Keep it below the tightest browser timeout (45s, course
    # recommendations); a healthy free-tier call returns in roughly 9s.
    llm_deadline_s: float = 30.0
    llm_cache_ttl_s: int = 600
    llm_cache_max_entries: int = 200

    @property
    def llm_api_key(self) -> str:
        return self.openrouter_api_key

    @staticmethod
    def _chain(primary: str, fallbacks: str) -> list[str]:
        extra = [m.strip() for m in fallbacks.split(",") if m.strip()]
        return [primary, *[m for m in extra if m != primary]]

    @property
    def model_chain(self) -> list[str]:
        """Primary first, then fallbacks in priority order."""
        return self._chain(self.primary_model, self.fallback_models)

    @property
    def fast_model_chain(self) -> list[str]:
        return self._chain(self.fast_primary_model, self.fast_fallback_models)

    # ── Networking ────────────────────────────────────────────────────────
    # The hyphen used to be mandatory ("career-iq.*"), so a Vercel project named
    # "careeriq" produced a domain this never matched and every browser request
    # died on CORS — with a backend that looked perfectly healthy from curl.
    # "career-?iq" accepts both spellings, and the trailing class covers Vercel
    # preview domains (careeriq-git-branch-user.vercel.app).
    # Override with CORS_ALLOW_ORIGIN_REGEX once the real domain is known.
    cors_allow_origin_regex: str = (
        r"https://career-?iq[a-z0-9-]*\.vercel\.app"
        r"|http://localhost:\d+|http://127\.0\.0\.1:\d+"
    )
    # X-Forwarded-For is caller-supplied and therefore spoofable by anyone who
    # can reach the app directly.  Enable only when genuinely behind a proxy
    # that overwrites the header.
    trust_proxy_headers: bool = False

    # ── Limits ────────────────────────────────────────────────────────────
    rate_limit: str = "5/minute"
    max_file_size_mb: int = 5
    max_jd_length: int = 8000

    # ── Behaviour ─────────────────────────────────────────────────────────
    warm_up_embeddings: bool = True

    # onnxruntime inference threads. 0 lets it size the pool from the host's
    # core count, which is right on a machine you own and wrong on a shared
    # container, where that count has nothing to do with your CPU share. Set
    # this to 1 on a fractional-CPU instance.
    embedding_threads: int = 0

    # fastembed otherwise caches into the system temp directory, which Windows
    # clears — costing a silent 67MB re-download on some later run.
    model_cache_dir: str = str(Path.home() / ".cache" / "careeriq" / "models")

    @field_validator("environment")
    @classmethod
    def _known_environment(cls, value: str) -> str:
        allowed = {"development", "staging", "production", "test"}
        if value not in allowed:
            raise ValueError(f"environment must be one of {sorted(allowed)}")
        return value

    @field_validator("structured_output_mode")
    @classmethod
    def _known_output_mode(cls, value: str) -> str:
        allowed = {"auto", "strict", "json_object", "prompt"}
        if value not in allowed:
            raise ValueError(f"structured_output_mode must be one of {sorted(allowed)}")
        return value

    @property
    def using_free_models(self) -> bool:
        return all(m.endswith(":free") for m in self.model_chain)

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    def missing_credentials(self) -> list[str]:
        """Credentials that are absent, for a startup warning.

        Deliberately a warning rather than a hard failure: the deterministic
        analysis pipeline still works without any LLM key, and refusing to boot
        would make local development harder than it needs to be.
        """
        missing = []
        if not self.openrouter_api_key:
            missing.append("OPENROUTER_API_KEY")
        return missing


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
