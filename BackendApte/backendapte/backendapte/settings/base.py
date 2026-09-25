"""Réglages communs du projet APTE.

Aucun secret n'est codé en dur : tout est lu dans l'environnement (``.env`` en
local, variables d'environnement en production). Voir ``.env.example``.
"""

from datetime import timedelta
from pathlib import Path

from decouple import Csv, config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ---------------------------------------------------------------- Sécurité
SECRET_KEY = config("DJANGO_SECRET_KEY", default="")
DEBUG = config("DJANGO_DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("DJANGO_ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())

AUTH_USER_MODEL = "users.User"

# ---------------------------------------------------------------- Applications
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.humanize",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",
    "corsheaders",
    "django_filters",
]

LOCAL_APPS = [
    "apps.common",
    "apps.users",
    "apps.products",
    "apps.orders",
    "apps.quotes",
    "apps.cart",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backendapte.urls"
WSGI_APPLICATION = "backendapte.wsgi.application"
ASGI_APPLICATION = "backendapte.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ---------------------------------------------------------------- Base de données
if config("POSTGRES_DB", default=""):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": config("POSTGRES_DB"),
            "USER": config("POSTGRES_USER", default="postgres"),
            "PASSWORD": config("POSTGRES_PASSWORD", default=""),
            "HOST": config("POSTGRES_HOST", default="localhost"),
            "PORT": config("POSTGRES_PORT", default="5432"),
            "CONN_MAX_AGE": config("DB_CONN_MAX_AGE", default=60, cast=int),
            "ATOMIC_REQUESTS": False,
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------- Sessions
SESSION_ENGINE = "django.contrib.sessions.backends.db"
SESSION_COOKIE_AGE = config("SESSION_COOKIE_AGE", default=60 * 60 * 24 * 14, cast=int)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_HTTPONLY = False
CSRF_TRUSTED_ORIGINS = config("CSRF_TRUSTED_ORIGINS", default="", cast=Csv())

# ---------------------------------------------------------------- Mots de passe
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

PASSWORD_RESET_TIMEOUT = config("PASSWORD_RESET_TIMEOUT", default=60 * 60, cast=int)

# ---------------------------------------------------------------- i18n
LANGUAGE_CODE = "fr-fr"
TIME_ZONE = config("DJANGO_TIME_ZONE", default="Africa/Dakar")
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------- Fichiers
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

MEDIA_URL = "/media/"
MEDIA_ROOT = Path(config("DJANGO_MEDIA_ROOT", default=str(BASE_DIR / "media")))

FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024

# ---------------------------------------------------------------- API
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "apps.common.pagination.DefaultPagination",
    "PAGE_SIZE": 20,
    "EXCEPTION_HANDLER": "apps.common.exceptions.api_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": ("rest_framework.throttling.ScopedRateThrottle",),
    "DEFAULT_THROTTLE_RATES": {
        "auth": config("THROTTLE_AUTH", default="10/min"),
        "password_reset": config("THROTTLE_PASSWORD_RESET", default="5/hour"),
        "checkout": config("THROTTLE_CHECKOUT", default="30/hour"),
        "webhook": config("THROTTLE_WEBHOOK", default="120/min"),
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=config("JWT_ACCESS_MINUTES", default=30, cast=int)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=config("JWT_REFRESH_DAYS", default=7, cast=int)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# SIGNING_KEY n'est posée que si elle est fournie explicitement. La figer ici sur
# SECRET_KEY la gèlerait à la valeur lue dans ce module, avant que dev.py / test.py
# n'aient défini la leur : la clé de signature se retrouvait vide et toute
# connexion échouait. Sans cette entrée, simple_jwt retombe sur SECRET_KEY
# résolue au démarrage de l'application, donc sur la valeur finale.
_jwt_signing_key = config("JWT_SIGNING_KEY", default="")
if _jwt_signing_key:
    SIMPLE_JWT["SIGNING_KEY"] = _jwt_signing_key

SPECTACULAR_SETTINGS = {
    "TITLE": "APTE API",
    "DESCRIPTION": "API e-commerce et devis APTE (produits, panier, commandes, facturation).",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": "/api",
    # Plusieurs ressources portent un champ « status » : on nomme explicitement
    # chaque énumération pour garder un schéma stable entre deux générations.
    "ENUM_NAME_OVERRIDES": {
        "OrderStatusEnum": "apps.orders.models.OrderStatus.choices",
        "InvoiceStatusEnum": "apps.orders.models.InvoiceStatus.choices",
        "PaymentStatusEnum": "apps.orders.models.PaymentStatus.choices",
        "QuoteStatusEnum": "apps.quotes.models.QuoteStatus.choices",
        "PaymentMethodEnum": "apps.orders.models.PaymentMethod.choices",
        "UserRoleEnum": "apps.users.models.Role.choices",
    },
}

# ---------------------------------------------------------------- CORS
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:5173,http://127.0.0.1:5173",
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------- Facturation
BILLING_CURRENCY = config("BILLING_CURRENCY", default="XOF")
BILLING_CURRENCY_SYMBOL = config("BILLING_CURRENCY_SYMBOL", default="FCFA")
# Le XOF n'a pas de sous-unité : les montants sont arrondis à l'unité.
BILLING_CURRENCY_DECIMAL_PLACES = config("BILLING_CURRENCY_DECIMAL_PLACES", default=0, cast=int)
# Les prix catalogue sont TTC : la TVA est extraite du total, jamais ajoutée.
BILLING_TAX_RATE = config("BILLING_TAX_RATE", default="0.18")
BILLING_TAX_LABEL = config("BILLING_TAX_LABEL", default="TVA")
BILLING_PRICES_INCLUDE_TAX = config("BILLING_PRICES_INCLUDE_TAX", default=True, cast=bool)
BILLING_INVOICE_PREFIX = config("BILLING_INVOICE_PREFIX", default="APTE")
BILLING_INVOICE_DUE_DAYS = config("BILLING_INVOICE_DUE_DAYS", default=0, cast=int)
BILLING_FREE_SHIPPING = config("BILLING_FREE_SHIPPING", default=True, cast=bool)
BILLING_SHIPPING_FLAT_FEE = config("BILLING_SHIPPING_FLAT_FEE", default="0")

COMPANY_INFO = {
    "name": config("COMPANY_NAME", default="APTE"),
    "legal_name": config("COMPANY_LEGAL_NAME", default="APTE SARL"),
    "address": config("COMPANY_ADDRESS", default="Dakar, Sénégal"),
    "phone": config("COMPANY_PHONE", default=""),
    "email": config("COMPANY_EMAIL", default=""),
    "tax_id": config("COMPANY_TAX_ID", default=""),
    "trade_register": config("COMPANY_TRADE_REGISTER", default=""),
}

# ---------------------------------------------------------------- Paiement Wave
WAVE_API_URL = config("WAVE_API_URL", default="https://api.wave.com/v1")
WAVE_API_KEY = config("WAVE_API_KEY", default="")
WAVE_WEBHOOK_SECRET = config("WAVE_WEBHOOK_SECRET", default="")
WAVE_TIMEOUT_SECONDS = config("WAVE_TIMEOUT_SECONDS", default=15, cast=int)
# En l'absence de secret webhook, on refuse les callbacks plutôt que de faire
# confiance à un appel non signé (un webhook non vérifié = commandes payées
# gratuitement). Mettre à False uniquement pour un environnement de test isolé.
WAVE_REQUIRE_SIGNED_WEBHOOK = config("WAVE_REQUIRE_SIGNED_WEBHOOK", default=True, cast=bool)
PAYMENT_GATEWAY = config("PAYMENT_GATEWAY", default="apps.orders.services.payments.wave.WaveGateway")

BACKEND_URL = config("BACKEND_URL", default="http://localhost:8000")
FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:5173")

# ---------------------------------------------------------------- E-mail
EMAIL_BACKEND = config("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = config("EMAIL_HOST", default="")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="no-reply@apte.local")

# ---------------------------------------------------------------- Journalisation
LOG_LEVEL = config("DJANGO_LOG_LEVEL", default="INFO")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {name} {process:d} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {"handlers": ["console"], "level": LOG_LEVEL},
    "loggers": {
        "django": {"handlers": ["console"], "level": LOG_LEVEL, "propagate": False},
        "django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False},
        "apps": {"handlers": ["console"], "level": LOG_LEVEL, "propagate": False},
    },
}
