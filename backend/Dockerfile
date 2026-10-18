FROM python:3.13-slim AS dependencies
ENV POETRY_VIRTUALENVS_IN_PROJECT=true
WORKDIR /app
RUN pip install --no-cache-dir poetry==2.5.1
COPY pyproject.toml poetry.lock ./
RUN poetry install --no-interaction --no-ansi --no-root --only main

FROM python:3.13-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PATH="/app/.venv/bin:$PATH"
WORKDIR /app
COPY --from=dependencies /app/.venv ./.venv
COPY alembic.ini ./
COPY backend/*.py ./backend/
COPY backend/migrations ./backend/migrations
RUN useradd --create-home app && chown -R app:app /app
USER app
EXPOSE 8000
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000} --no-access-log"]
