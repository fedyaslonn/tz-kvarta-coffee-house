"""Async database session manager with transaction ownership."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)


class DatabaseSessionManager:
    """Own an engine and commit, roll back and release each session."""

    def __init__(self, host: str, **engine_kwargs: Any) -> None:
        options: dict[str, Any] = {
            "pool_size": 5,
            "max_overflow": 10,
            "pool_pre_ping": True,
            "pool_recycle": 300,
            "pool_timeout": 5,
            "isolation_level": "READ COMMITTED",
            "connect_args": {"timeout": 5, "command_timeout": 5},
        }
        options.update(engine_kwargs)
        options["hide_parameters"] = True
        self._engine: AsyncEngine | None = create_async_engine(host, **options)
        self._sessionmaker: async_sessionmaker[AsyncSession] | None = async_sessionmaker(
            bind=self._engine, expire_on_commit=False, class_=AsyncSession
        )

    async def close(self) -> None:
        """Dispose the pool; repeated shutdown is harmless."""
        if self._engine is not None:
            await self._engine.dispose()
            self._engine = None
            self._sessionmaker = None

    async def test_connection(self) -> None:
        """Check connectivity without leaving a connection checked out."""
        if self._engine is None:
            raise RuntimeError("DatabaseSessionManager is closed")
        async with self._engine.connect() as connection:
            await connection.execute(text("SELECT 1"))

    @asynccontextmanager
    async def session(self) -> AsyncIterator[AsyncSession]:
        """Commit before exiting, including rollback on errors and cancellation."""
        if self._sessionmaker is None:
            raise RuntimeError("DatabaseSessionManager is closed")
        async with self._sessionmaker() as session:
            try:
                yield session
                await session.commit()
            except BaseException:
                # Cancellation must release locks and roll back, too.
                await session.rollback()
                raise
