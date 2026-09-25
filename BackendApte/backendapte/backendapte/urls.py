"""Routage racine du projet APTE.

Toutes les ressources d'API sont préfixées par ``/api/`` : cela réserve la racine
au service des fichiers statiques / média et évite toute collision avec les
routes du frontend.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def healthcheck(_request):
    """Sonde de disponibilité (docker-compose, orchestrateur, load balancer)."""
    return JsonResponse({"status": "ok"})


api_patterns = [
    path("users/", include("apps.users.urls")),
    path("products/", include("apps.products.urls")),
    path("orders/", include("apps.orders.urls")),
    path("quotes/", include("apps.quotes.urls")),
    path("cart/", include("apps.cart.urls")),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", healthcheck, name="health"),
    path("api/", include((api_patterns, "api"))),
]

if settings.DEBUG:
    # En production, les média et les statiques sont servis par WhiteNoise /
    # le serveur frontal, jamais par Django.
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
