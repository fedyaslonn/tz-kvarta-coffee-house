"""Send committed leads to Telegram without affecting the HTTP response."""

import logging
from typing import Any

from aiogram import Bot
from aiogram.types import LinkPreviewOptions

from backend.config import Settings
from backend.schemas import ATTRIBUTION_KEYS

logger = logging.getLogger(__name__)

INTEREST_LABELS = {"subscription": "Подписка", "order": "Разовый заказ", "question": "Вопрос"}

MESSAGE_CHUNK_SIZE = 2000


def display_phone(value: str) -> str:
    """Show a validated Belarus E.164 number in a readable form."""
    if len(value) == 13 and value.startswith("+375") and value[1:].isdigit():
        return f"+375 ({value[4:6]}) {value[6:9]}-{value[9:11]}-{value[11:13]}"
    return value


def format_lead_notification(lead_id: int, data: dict[str, Any]) -> str:
    """Format validated contact details and attribution as plain text."""
    lines = [
        f"Новая заявка №{lead_id}",
        f"Имя: {data['name']}",
        f"Телефон: {display_phone(data['phone'])}",
        f"Интерес: {INTEREST_LABELS[data['interest']]}",
        f"Комментарий: {data.get('comment') or '-'}",
    ]
    attribution = data.get("utm", {})
    lines.extend(f"{key}: {attribution[key]}" for key in ATTRIBUTION_KEYS if attribution.get(key))
    lines.extend(
        f"{label}: {data[key]}"
        for key, label in (("referrer", "Источник перехода"), ("landing_path", "Страница входа"))
        if data.get(key) and (key != "landing_path" or data[key] != "/")
    )
    return "\n".join(lines)


async def send_lead_notification(settings: Settings, lead_id: int, data: dict[str, Any], request_id: str) -> None:
    """Attempt delivery after response; log failures without secrets or personal data."""
    token = settings.TG_TOKEN.get_secret_value().strip()
    chat_id = settings.TG_CHAT_ID.strip()
    if not token or not chat_id:
        logger.warning("Telegram notification skipped: configure TG_TOKEN and TG_CHAT_ID request_id=%s", request_id)
        return
    try:
        text = format_lead_notification(lead_id, data)
        async with Bot(token=token) as bot:
            for offset in range(0, len(text), MESSAGE_CHUNK_SIZE):
                await bot.send_message(
                    chat_id=chat_id,
                    text=text[offset : offset + MESSAGE_CHUNK_SIZE],
                    parse_mode=None,
                    link_preview_options=LinkPreviewOptions(is_disabled=True),
                    request_timeout=10,
                )
    except Exception as error:
        logger.error("Telegram notification failed request_id=%s type=%s", request_id, type(error).__name__)
