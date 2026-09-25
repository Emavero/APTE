#!/bin/sh
# Point d'entrée du conteneur backend : attend la base, applique les migrations,
# puis passe la main à la commande du conteneur.
set -eu

wait_for_database() {
    [ -n "${POSTGRES_HOST:-}" ] || return 0

    printf 'En attente de PostgreSQL sur %s:%s' "$POSTGRES_HOST" "${POSTGRES_PORT:-5432}"
    attempt=0
    until python -c "
import os, socket, sys
host = os.environ['POSTGRES_HOST']
port = int(os.environ.get('POSTGRES_PORT', '5432'))
try:
    with socket.create_connection((host, port), timeout=2):
        pass
except OSError:
    sys.exit(1)
" 2>/dev/null; do
        attempt=$((attempt + 1))
        if [ "$attempt" -ge 60 ]; then
            echo " échec : base injoignable après 60 tentatives." >&2
            exit 1
        fi
        printf '.'
        sleep 1
    done
    echo ' prêt.'
}

wait_for_database

if [ "${DJANGO_MIGRATE_ON_START:-1}" = "1" ]; then
    echo "Application des migrations…"
    python manage.py migrate --noinput
fi

if [ "${DJANGO_COLLECTSTATIC_ON_START:-0}" = "1" ]; then
    echo "Collecte des fichiers statiques…"
    python manage.py collectstatic --noinput
fi

if [ "${DJANGO_LOAD_SEED:-0}" = "1" ] && [ -f products_seed.json ]; then
    echo "Chargement du jeu de données de démonstration…"
    python manage.py loaddata products_seed.json || echo "Jeu de données déjà chargé, ignoré."
fi

exec "$@"
