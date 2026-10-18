"""Error reporting with deliberate removal of submitted personal data."""

import logging
import traceback
from typing import Any


class SafeFormatter(logging.Formatter):
    """Keep stack locations without exception messages or local variables."""

    def formatException(self, exc_info: Any) -> str:
        """Render only exception type and stack locations."""
        frames = traceback.extract_tb(exc_info[2])
        locations = "\n".join(f"  {frame.filename}:{frame.lineno} in {frame.name}" for frame in frames)
        return f"{exc_info[0].__name__}\n{locations}"


def configure_logging() -> None:
    """Configure standard stderr logging without submitted personal data."""
    handler = logging.StreamHandler()
    handler.setFormatter(SafeFormatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
    logging.basicConfig(level=logging.INFO, handlers=[handler], force=True)
    for name in ("sqlalchemy.engine", "sqlalchemy.pool", "uvicorn.access"):
        logging.getLogger(name).disabled = True


def report_error(error: Exception, request_id: str) -> None:
    """Log a failure once, retaining stack locations but no exception values."""
    logging.getLogger("backend").error(
        "Request failed request_id=%s type=%s",
        request_id,
        type(error).__name__,
        exc_info=(type(error), error, error.__traceback__),
    )
