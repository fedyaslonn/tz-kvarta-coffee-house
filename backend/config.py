"""Environment configuration shared by API, migrations and scripts."""

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url


def normalize_asyncpg_url(value: str | None) -> str | None:
    """Translate libpq TLS URL options from managed Postgres providers for asyncpg."""
    if value is None:
        return None
    url = make_url(value)
    if url.drivername == "postgresql":
        url = url.set(drivername="postgresql+asyncpg")
    elif url.drivername != "postgresql+asyncpg":
        raise ValueError("DATABASE_URL must use the postgresql+asyncpg driver")
    query = dict(url.query)
    sslmode = query.pop("sslmode", None)
    query.pop("channel_binding", None)
    if sslmode:
        query.setdefault("ssl", sslmode)
    return url.set(query=query).render_as_string(hide_password=False)


class Settings(BaseSettings):
    """Application settings; deployment credentials belong in the environment."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str
    MIGRATION_DATABASE_URL: str | None = None
    ALLOWED_ORIGINS: str
    APP_VERSION: str
    TG_TOKEN: SecretStr = SecretStr("")
    TG_CHAT_ID: str = ""

    def model_post_init(self, __context: object) -> None:
        """Normalize provider connection strings after settings are loaded."""
        self.DATABASE_URL = normalize_asyncpg_url(self.DATABASE_URL) or ""
        self.MIGRATION_DATABASE_URL = normalize_asyncpg_url(self.MIGRATION_DATABASE_URL)

    @property
    def allowed_origins(self) -> list[str]:
        """Return explicitly configured browser origins."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
