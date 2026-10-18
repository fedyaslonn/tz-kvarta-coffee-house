"""Lead storage with a PostgreSQL-wide sliding duplicate window."""

from datetime import timedelta
from typing import Any

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import Lead


async def save_lead(session: AsyncSession, data: dict[str, Any]) -> int | None:
    """Insert once per phone per 600 seconds, including across API workers."""
    await session.execute(text("SET LOCAL lock_timeout = '5s'"))
    await session.execute(
        text("SELECT pg_advisory_xact_lock(CAST(:phone_key AS BIGINT))"),
        {"phone_key": int(data["phone"][1:])},
    )
    current_time = (await session.execute(select(func.clock_timestamp()))).scalar_one()
    existing = (
        await session.execute(
            select(Lead.id)
            .where(Lead.phone == data["phone"], Lead.created_at > current_time - timedelta(seconds=600))
            .limit(1)
        )
    ).scalar_one_or_none()
    if existing is not None:
        return None
    values = dict(data)
    values.update(values.pop("utm", {}))
    lead = Lead(**values)
    session.add(lead)
    await session.flush()
    return lead.id
