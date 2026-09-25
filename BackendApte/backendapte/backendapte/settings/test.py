"""Réglages de la suite de tests : rapides, déterministes, hors réseau."""

from .base import *  # noqa: F401,F403

DEBUG = False
SECRET_KEY = "test-only-key"  # noqa: S105
ALLOWED_HOSTS = ["*"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.InMemoryStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

# Les quotas sont volontairement hors de portée : la limitation de débit n'est
# pas l'objet de ces tests et un quota bas les rendrait dépendants de l'ordre
# d'exécution. Les scopes restent définis, sinon DRF refuse la requête.
REST_FRAMEWORK = {  # noqa: F405
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_THROTTLE_RATES": {
        "auth": "10000/min",
        "password_reset": "10000/min",
        "checkout": "10000/min",
        "webhook": "10000/min",
    },
}

WAVE_API_KEY = "test-api-key"
WAVE_WEBHOOK_SECRET = "test-webhook-secret"  # noqa: S105
WAVE_REQUIRE_SIGNED_WEBHOOK = True

LOGGING = {"version": 1, "disable_existing_loggers": False, "root": {"handlers": []}}
