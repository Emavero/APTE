# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Image du backend Django APTE.
#   - cible « dev »  : serveur de développement, rechargement automatique
#   - cible « prod » : gunicorn, utilisateur non privilégié, statiques collectés
# ---------------------------------------------------------------------------
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# libpq pour psycopg, curl pour le healthcheck du conteneur.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 curl \
    && rm -rf /var/lib/apt/lists/*

# Les dépendances sont copiées seules : le cache de couche survit aux
# modifications du code applicatif.
COPY requirements.txt requirements-dev.txt ./


# --------------------------------------------------------------------- dev
FROM base AS dev

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && pip install -r requirements-dev.txt \
    && apt-get purge -y build-essential libpq-dev \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

COPY . .

ENV DJANGO_SETTINGS_MODULE=backendapte.settings.dev
EXPOSE 8000
ENTRYPOINT ["entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]


# -------------------------------------------------------------------- prod
FROM base AS prod

RUN pip install -r requirements.txt

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

COPY . .

# Un conteneur applicatif ne tourne pas en root.
RUN useradd --create-home --uid 10001 apte \
    && mkdir -p /app/staticfiles /app/media \
    && chown -R apte:apte /app
USER apte

ENV DJANGO_SETTINGS_MODULE=backendapte.settings.prod

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:8000/health/ || exit 1

ENTRYPOINT ["entrypoint.sh"]
CMD ["gunicorn", "backendapte.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--timeout", "60", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
