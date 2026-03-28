from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
    )

    database_url: str = (
        "postgresql+asyncpg://halalchecker:halalchecker@localhost:5433/halalchecker"
    )
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"
    embedding_model_name: str = "all-MiniLM-L6-v2"
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    debug: bool = False


settings = Settings()
