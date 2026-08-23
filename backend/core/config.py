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
    # Phase 2 replaces Groq with OpenRouter; both are accepted during the
    # transition so a half-migrated environment still boots.
    openrouter_api_key: str = ""
    groq_api_key: str = ""
    rapidapi_key: str = ""

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
        if not (self.openrouter_api_key or self.groq_api_key):
            missing.append("OPENROUTER_API_KEY")
        if not self.rapidapi_key:
            missing.append("RAPIDAPI_KEY")
        return missing


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
