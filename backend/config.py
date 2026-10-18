"""Environment configuration shared by API, migrations and scripts."""

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings; deployment credentials belong in the environment."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str
    ALLOWED_ORIGINS: str
    APP_VERSION: str
    TG_TOKEN: SecretStr = SecretStr("")
    TG_CHAT_ID: str = ""

    @property
    def allowed_origins(self) -> list[str]:
        """Return explicitly configured browser origins."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
