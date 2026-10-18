"""Async Alembic environment using the same settings and models as the API."""

import asyncio
from logging import getLogger

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

from backend.config import Settings
from backend.models import Base

target_metadata = Base.metadata


def migration_database_url() -> str:
    """Use a direct database connection for schema changes when one is configured."""
    settings = Settings()
    return settings.MIGRATION_DATABASE_URL or settings.DATABASE_URL


def run_offline() -> None:
    """Emit SQL without connecting."""
    context.configure(
        url=migration_database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_online() -> None:
    """Apply migrations with a dedicated short-lived connection."""
    engine = create_async_engine(migration_database_url(), poolclass=pool.NullPool, hide_parameters=True)
    try:
        async with engine.connect() as connection:

            def migrate(sync_connection):
                context.configure(connection=sync_connection, target_metadata=target_metadata, compare_type=True)
                with context.begin_transaction():
                    context.run_migrations()

            await connection.run_sync(migrate)
    finally:
        await engine.dispose()


if context.is_offline_mode():
    run_offline()
else:
    getLogger("alembic").setLevel("INFO")
    asyncio.run(run_online())
