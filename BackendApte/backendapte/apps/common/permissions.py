from rest_framework import permissions

SAFE_METHODS = permissions.SAFE_METHODS


class IsAdminOrReadOnly(permissions.BasePermission):
    """Lecture publique, écriture réservée au personnel."""

    message = "Seuls les administrateurs peuvent modifier cette ressource."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class IsOwner(permissions.BasePermission):
    """L'objet doit appartenir à l'utilisateur courant (ou il est staff)."""

    message = "Cette ressource ne vous appartient pas."
    owner_field = "user"

    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff:
            return True
        owner = getattr(obj, getattr(view, "owner_field", self.owner_field), None)
        return owner is not None and owner == request.user
