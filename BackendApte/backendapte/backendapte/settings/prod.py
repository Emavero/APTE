"""Réglages de production.

Le module échoue au démarrage si un secret obligatoire manque : mieux vaut un
conteneur qui refuse de démarrer qu'une instance exposée avec une clé par défaut.
"""

from decouple import config
from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403
from .base import ALLOWED_HOSTS, SECRET_KEY, WAVE_API_KEY, WAVE_WEBHOOK_SECRET

DEBUG = False

_missing = [name for name, value in (("DJANGO_SECRET_KEY", SECRET_KEY),) if not value]
if _missing:
    raise ImproperlyConfigured("Variables d'environnement obligatoires manquantes: " + ", ".join(_missing))

if not ALLOWED_HOSTS or ALLOWED_HOSTS == ["*"]:
    raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS doit lister les domaines servis.")

# ------------------------------------------------------------------ Durcissement
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
# Reste activé par défaut ; désactivable quand le TLS est terminé en amont
# (sinon un frontal en HTTP interne provoque une boucle de redirections).
SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=True, cast=bool)
SECURE_HSTS_SECONDS = config("SECURE_HSTS_SECONDS", default=31536000, cast=int)
SECURE_HSTS_PRELOAD = True
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"

X_FRAME_OPTIONS = "DENY"

# Le schéma OpenAPI reste servi, la console navigable non.
REST_FRAMEWORK = {  # noqa: F405
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",),
}

if not WAVE_API_KEY or not WAVE_WEBHOOK_SECRET:
    import logging

    logging.getLogger(__name__).warning(
        "Wave n'est pas entièrement configuré (WAVE_API_KEY / WAVE_WEBHOOK_SECRET): "
        "le paiement mobile restera indisponible."
    )
