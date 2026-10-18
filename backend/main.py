"""FastAPI application and HTTP contract for lead intake."""

import asyncio
import json
import logging
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import BackgroundTasks, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from marshmallow import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from backend.config import Settings
from backend.db import DatabaseSessionManager
from backend.observability import configure_logging, report_error
from backend.schemas import LeadSchema, flatten_errors, request_schema
from backend.service import save_lead
from backend.telegram import send_lead_notification

logger = logging.getLogger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    """Build the application; initialize its pool during lifespan."""
    config = settings or Settings()

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        configure_logging()
        database = DatabaseSessionManager(config.DATABASE_URL)
        application.state.database = database
        try:
            await database.test_connection()
            logger.info("Database connection ready")
            yield
        except Exception as error:
            report_error(error, "lifespan")
            raise
        finally:
            await database.close()

    application = FastAPI(title="Kvarta Leads API", version=config.APP_VERSION, lifespan=lifespan)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=config.allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
        expose_headers=["X-Request-ID"],
    )

    @application.middleware("http")
    async def request_context(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        request_id = uuid4().hex
        request.state.request_id = request_id
        try:
            response = await call_next(request)
        except Exception as error:
            report_error(error, request_id)
            response = JSONResponse(
                status_code=500,
                content={"ok": False, "error": "Не удалось отправить заявку. Попробуйте ещё раз позже."},
            )
        response.headers["X-Request-ID"] = request_id
        return response

    @application.get("/api/health")
    async def health_check() -> dict[str, str]:
        return {"status": "ok", "service": "kvarta-api"}

    @application.get("/api/ready")
    async def readiness(request: Request) -> JSONResponse:
        try:
            await request.app.state.database.test_connection()
        except (SQLAlchemyError, OSError, asyncio.TimeoutError):
            return JSONResponse(status_code=503, content={"status": "unavailable"})
        return JSONResponse(content={"status": "ready"})

    @application.post("/api/lead", openapi_extra=request_schema(), status_code=201)
    async def create_lead(request: Request, background_tasks: BackgroundTasks) -> JSONResponse:
        try:
            body = bytearray()
            async for chunk in request.stream():
                body.extend(chunk)

            payload = json.loads(body)
        except (json.JSONDecodeError, UnicodeDecodeError):
            return JSONResponse(status_code=400, content={"ok": False, "errors": {"_form": "Невалидный JSON."}})
        if isinstance(payload, dict) and "referrer" not in payload:
            payload["referrer"] = request.headers.get("referer", "")
        try:
            data = LeadSchema().load(payload)
        except ValidationError as error:
            return JSONResponse(status_code=422, content={"ok": False, "errors": flatten_errors(error.messages)})
        try:
            async with request.app.state.database.session() as session:
                lead_id = await save_lead(session, data)
        except (SQLAlchemyError, OSError, asyncio.TimeoutError) as error:
            report_error(error, request.state.request_id)
            return JSONResponse(
                status_code=503,
                content={"ok": False, "error": "Сервис временно недоступен. Повторите отправку через минуту."},
            )
        if lead_id is None:
            return JSONResponse(content={"ok": True, "duplicate": True})
        background_tasks.add_task(send_lead_notification, config, lead_id, data, request.state.request_id)
        return JSONResponse(status_code=201, content={"ok": True, "id": lead_id}, background=background_tasks)

    return application


app = create_app()
