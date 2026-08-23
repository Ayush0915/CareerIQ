"""Configuration must load the same way regardless of working directory.

A relative ``env_file`` resolved against the current working directory, so a
key sitting in backend/.env was found when uvicorn ran from backend/ and
silently missed when a script ran from the repo root. The failure surfaced as
"OPENROUTER_API_KEY is not set", which points at the wrong thing entirely.
"""
import subprocess
import sys
from pathlib import Path

import pytest
from core.config import BACKEND_DIR, ENV_FILES, REPO_ROOT, Settings

BACKEND = str(BACKEND_DIR)


class TestEnvFileResolution:
    def test_env_paths_are_absolute(self):
        for path in ENV_FILES:
            assert Path(path).is_absolute(), f"{path} is relative to the CWD"

    def test_backend_env_is_searched(self):
        assert str(BACKEND_DIR / ".env") in ENV_FILES

    def test_repo_root_env_is_searched(self):
        assert str(REPO_ROOT / ".env") in ENV_FILES

    def test_backend_env_takes_precedence(self):
        """Later files win in pydantic-settings, and backend/.env is the one
        the README tells people to edit."""
        assert ENV_FILES.index(str(BACKEND_DIR / ".env")) > ENV_FILES.index(
            str(REPO_ROOT / ".env")
        )

    @pytest.mark.parametrize("cwd", [".", "backend", "scripts", "evals"])
    def test_settings_load_from_any_directory(self, cwd):
        """Spawn a fresh interpreter from each directory — import caching would
        otherwise hide the problem this test exists to catch."""
        target = REPO_ROOT / cwd
        if not target.is_dir():
            pytest.skip(f"{cwd} does not exist")

        result = subprocess.run(
            [
                sys.executable,
                "-c",
                f"import sys; sys.path.insert(0, {BACKEND!r});"
                "from core.config import get_settings;"
                "s = get_settings();"
                "print(s.primary_model)",
            ],
            cwd=target,
            capture_output=True,
            text=True,
            timeout=60,
        )
        assert result.returncode == 0, result.stderr
        assert ":free" in result.stdout


class TestModelCache:
    def test_cache_dir_is_not_temporary(self):
        """fastembed defaults to the system temp directory, which Windows
        clears — costing a silent 67MB re-download later."""
        cache = Settings().model_cache_dir.lower().replace("\\", "/")
        parts = cache.split("/")
        assert "temp" not in parts
        assert "tmp" not in parts

    def test_cache_dir_is_absolute(self):
        assert Path(Settings().model_cache_dir).is_absolute()

    def test_similarity_creates_the_cache_dir(self):
        from services.similarity import _cache_dir

        assert Path(_cache_dir()).is_dir()


class TestCredentialReporting:
    def test_missing_credentials_names_openrouter(self, monkeypatch):
        settings = Settings(openrouter_api_key="", rapidapi_key="")
        assert "OPENROUTER_API_KEY" in settings.missing_credentials()

    def test_configured_key_is_not_reported_missing(self):
        settings = Settings(openrouter_api_key="sk-or-something", rapidapi_key="x")
        assert settings.missing_credentials() == []
