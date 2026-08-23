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

    # Model IDs change and get deprecated — do not trust a hardcoded default.
    # Run `python scripts/check_models.py` to list currently available models
    # that support structured outputs, then set these in .env.
    #
    # Selection criteria, in order:
    #   1. Must appear under supported_parameters=structured_outputs
    #   2. Prefer models served by several providers (so failover has somewhere
    #      to go)
    #   3. Choose on schema-conformance rate, not price — at this payload size
    #      the spread between cheapest and premium is a couple of dollars a
    #      month
    primary_model: str = "deepseek/deepseek-chat"
    fallback_models: str = "google/gemini-flash-1.5,openai/gpt-4o-mini"
    # Cheaper chain for the generative coaching features, where the quality bar
    # is lower and the volume is higher.
    fast_primary_model: str = "google/gemini-flash-1.5"
    fast_fallback_models: str = "openai/gpt-4o-mini"

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
