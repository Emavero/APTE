"""Réglages de développement local."""

from decouple import config

from .base import *  # noqa: F401,F403
from .base import REST_FRAMEWORK, SECRET_KEY

DEBUG = True
ALLOWED_HOSTS = ["*"]

# Clé de repli : uniquement acceptable hors production.
if not SECRET_KEY:
    SECRET_KEY = "dev-only-insecure-key-change-me"  # noqa: S105

# Le schéma et la doc restent librement consultables en local.
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ),
}

EMAIL_BACKEND = config("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
