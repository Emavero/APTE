"""Point d'entrée WSGI (gunicorn/uwsgi)."""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backendapte.settings.prod")

application = get_wsgi_application()
