"""
EDU CARD AI — Application Configuration

Loads settings from environment variables (.env) and YAML config files.
"""

import os
from pathlib import Path
from functools import lru_cache
from typing import List

import yaml
from pydantic_settings import BaseSettings


# ---------------------------------------------------------------------------
# Pydantic Settings (env-driven)
# ---------------------------------------------------------------------------

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database — Cloud PostgreSQL or local SQLite
    DATABASE_URL: str = "sqlite:///./edu_card_ai.db"

    # JWT Authentication
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Application
    APP_NAME: str = "EDU CARD AI"
    DEBUG: bool = True
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def sqlalchemy_database_url(self) -> str:
        """
        Normalizes DATABASE_URL for SQLAlchemy compatibility:
        - Cloud providers (Heroku, Render, Supabase, Neon) often supply 'postgres://'.
        - SQLAlchemy 2.0 requires 'postgresql://' or 'postgresql+psycopg2://'.
        """
        url = self.DATABASE_URL.strip()
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url

    @property
    def is_postgres(self) -> bool:
        return self.sqlalchemy_database_url.startswith("postgresql")

    @property
    def masked_database_url(self) -> str:
        """Returns connection URL with password masked for safe logging/UI display."""
        import re
        url = self.sqlalchemy_database_url
        if "@" in url:
            # Mask password between ':' and '@'
            return re.sub(r":([^:@]+)@", ":****@", url)
        return url

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


# ---------------------------------------------------------------------------
# YAML config helpers
# ---------------------------------------------------------------------------

_CONFIG_DIR = Path(__file__).resolve().parent.parent.parent / "config"


def _load_yaml(filename: str) -> dict:
    """Load a YAML config file from the project config/ directory."""
    filepath = _CONFIG_DIR / filename
    if not filepath.exists():
        raise FileNotFoundError(f"Config file not found: {filepath}")
    with open(filepath, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


@lru_cache()
def get_settings() -> Settings:
    return Settings()


@lru_cache()
def get_thresholds() -> dict:
    return _load_yaml("thresholds.yaml")


@lru_cache()
def get_playbook() -> dict:
    return _load_yaml("playbook.yaml")


# ---------------------------------------------------------------------------
# Convenience singletons (imported throughout the app)
# ---------------------------------------------------------------------------

settings = get_settings()
thresholds = get_thresholds()
playbook = get_playbook()

BANNED_WORDS: List[str] = playbook.get("banned_words", [])
DISCLAIMER: str = playbook.get("disclaimer", "")
