"""Application settings, validated once at import time.

Previously configuration was read with bare ``os.environ.get`` calls scattered
across three service modules, each calling ``load_dotenv()`` again.  A missing
API key surfaced as a failed request deep inside a retry loop rather than as a
startup error.
"""
from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
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
    rapidapi_key: str = ""

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
    primary_model: str = "dots-studio/dots-3-note-preview:free"
    fallback_models: str = "nvidia/nemotron-3-super:free,z-ai/glm-5.2:free"
    # Chain for the generative coaching features, where the quality bar is
    # lower and the call volume is higher.
    fast_primary_model: str = "nvidia/nemotron-3.5-lightning:free"
    fast_fallback_models: str = "google/gemma-4-26b-a4b:free"

    # How to request JSON: "auto" walks the ladder and remembers what worked.
    # Force a rung with "strict", "json_object" or "prompt".
    structured_output_mode: str = "auto"

    llm_timeout_s: float = 60.0
    llm_max_retries: int = 3
    llm_retry_backoff_s: float = 1.5
    llm_cache_ttl_s: int = 600
    llm_cache_max_entries: int = 200

    @property
    def llm_api_key(self) -> str:
        return self.openrouter_api_key

    @staticmethod
    def _chain(primary: str, fallbacks: str) -> List[str]:
        extra = [m.strip() for m in fallbacks.split(",") if m.strip()]
        return [primary, *[m for m in extra if m != primary]]

    @property
    def model_chain(self) -> List[str]:
        """Primary first, then fallbacks in priority order."""
        return self._chain(self.primary_model, self.fallback_models)

    @property
    def fast_model_chain(self) -> List[str]:
        return self._chain(self.fast_primary_model, self.fast_fallback_models)

    # ── Networking ────────────────────────────────────────────────────────
    cors_allow_origin_regex: str = (
        r"https://career-iq.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+"
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

    def missing_credentials(self) -> List[str]:
        """Credentials that are absent, for a startup warning.

        Deliberately a warning rather than a hard failure: the deterministic
        analysis pipeline still works without any LLM key, and refusing to boot
        would make local development harder than it needs to be.
        """
        missing = []
        if not self.openrouter_api_key:
            missing.append("OPENROUTER_API_KEY")
        if not self.rapidapi_key:
            missing.append("RAPIDAPI_KEY")
        return missing


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
