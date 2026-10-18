"""Marshmallow validation and the matching public JSON schema."""

import re
from typing import Any

import phonenumbers
from marshmallow import EXCLUDE, Schema, ValidationError, fields, validate

ATTRIBUTION_KEYS = ("utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "yclid")


class TrimmedString(fields.String):
    """Trim string input before applying length validators."""

    def _deserialize(self, value: Any, attr: str | None, data: Any, **kwargs: Any) -> str:
        result = str(super()._deserialize(value, attr, data, **kwargs)).strip()
        if "\x00" in result:
            raise ValidationError("Текст содержит недопустимый символ.")
        return result


class BelarusPhone(fields.String):
    """Validate a full Belarus number and return E.164."""

    def _deserialize(self, value: Any, attr: str | None, data: Any, **kwargs: Any) -> str:
        raw = super()._deserialize(value, attr, data, **kwargs)
        message = "Укажите белорусский номер."
        if len(raw) > 40 or not re.fullmatch(r"\+?[0-9() \-]+", raw.strip()):
            raise ValidationError(message)
        digits = re.sub(r"\D", "", raw)
        if len(digits) == 12 and digits.startswith("375"):
            raw = "+" + digits
        try:
            phone = phonenumbers.parse(raw, "BY")
        except phonenumbers.NumberParseException as error:
            raise ValidationError(message) from error
        if phone.country_code != 375 or phone.extension or not phonenumbers.is_valid_number(phone):
            raise ValidationError(message)
        return str(phonenumbers.format_number(phone, phonenumbers.PhoneNumberFormat.E164))


class AttributionSchema(Schema):
    """Known campaign keys, tolerating additional tracking parameters."""

    class Meta:
        unknown = EXCLUDE

    utm_source = TrimmedString(validate=validate.Length(max=255))
    utm_medium = TrimmedString(validate=validate.Length(max=255))
    utm_campaign = TrimmedString(validate=validate.Length(max=255))
    utm_content = TrimmedString(validate=validate.Length(max=255))
    utm_term = TrimmedString(validate=validate.Length(max=255))
    gclid = TrimmedString(validate=validate.Length(max=255))
    yclid = TrimmedString(validate=validate.Length(max=255))


class LeadSchema(Schema):
    """The only request-body validator used by the API."""

    name = TrimmedString(required=True, validate=validate.Length(min=2, max=60, error="Имя: от 2 до 60 символов."))
    phone = BelarusPhone(required=True)
    interest = fields.String(
        required=True,
        validate=validate.OneOf(
            ("subscription", "order", "question"), error="Выберите подписку, разовый заказ или вопрос."
        ),
    )
    comment = TrimmedString(validate=validate.Length(max=600, error="Комментарий: не более 600 символов."))
    utm = fields.Nested(AttributionSchema, load_default=dict)
    referrer = TrimmedString(validate=validate.Length(max=2048))
    landing_path = TrimmedString(validate=validate.Length(max=2048))


def flatten_errors(messages: Any, prefix: str = "") -> dict[str, str]:
    """Flatten nested Marshmallow errors to field-to-first-message mappings."""
    if isinstance(messages, dict):
        result: dict[str, str] = {}
        for key, value in messages.items():
            path = f"{prefix}.{key}" if prefix else str(key)
            result.update(flatten_errors(value, path))
        return result
    message = str(messages[0]) if isinstance(messages, list) and messages else str(messages)
    translations = {
        "Missing data for required field.": "Заполните обязательное поле.",
        "Unknown field.": "Неизвестное поле.",
        "Not a valid string.": "Укажите текстовое значение.",
        "Field may not be null.": "Поле не может быть пустым.",
        "Invalid input type.": "Ожидается JSON-объект.",
    }
    return {"_form" if prefix in ("", "_schema") else prefix: translations.get(message, message)}


def request_schema() -> dict[str, Any]:
    """Describe JSON input without adding a second Pydantic validator."""

    def response_schema(description: str, properties: dict[str, Any]) -> dict[str, Any]:
        return {
            "description": description,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": list(properties),
                        "properties": properties,
                    }
                }
            },
        }

    validation_error = {
        "ok": {"const": False},
        "errors": {"type": "object", "additionalProperties": {"type": "string"}},
    }
    server_error = {"ok": {"const": False}, "error": {"type": "string"}}
    properties: dict[str, Any] = {
        "name": {"type": "string", "minLength": 2, "maxLength": 60},
        "phone": {"type": "string", "example": "+375 29 123-45-67"},
        "interest": {"type": "string", "enum": ["subscription", "order", "question"]},
        "comment": {"type": "string", "maxLength": 600},
        "referrer": {"type": "string", "maxLength": 2048},
        "landing_path": {"type": "string", "maxLength": 2048},
        "utm": {
            "type": "object",
            "properties": {key: {"type": "string", "maxLength": 255} for key in ATTRIBUTION_KEYS},
            "additionalProperties": True,
        },
    }
    return {
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["name", "phone", "interest"],
                        "additionalProperties": False,
                        "properties": properties,
                    }
                }
            },
        },
        "responses": {
            "200": response_schema("Повторная заявка", {"ok": {"const": True}, "duplicate": {"const": True}}),
            "201": response_schema("Заявка сохранена", {"ok": {"const": True}, "id": {"type": "integer"}}),
            "400": response_schema("Невалидный JSON", validation_error),
            "422": response_schema("Ошибки полей", validation_error),
            "503": response_schema("База временно недоступна", server_error),
            "500": response_schema("Внутренняя ошибка", server_error),
        },
    }
