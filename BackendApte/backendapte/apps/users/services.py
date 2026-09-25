"""Cas d'usage du domaine « utilisateurs ».

Les vues ne contiennent aucune règle : elles délèguent ici. Ce module ne connaît
ni HTTP ni DRF, ce qui le rend testable isolément.
"""

from __future__ import annotations

import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db import transaction
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.common.exceptions import DomainError

logger = logging.getLogger(__name__)
User = get_user_model()

# Séparateur entre l'identifiant encodé et le jeton signé (pas un secret).
RESET_TOKEN_SEPARATOR = "-"  # noqa: S105


@transaction.atomic
def register_user(*, email=None, phone=None, password: str, full_name: str = "", role: str = "individual"):
    """Inscrit un nouvel utilisateur."""
    return User.objects.create_user(
        email=email,
        phone=phone,
        password=password,
        full_name=full_name,
        role=role,
    )


@transaction.atomic
def update_profile(user, *, full_name=None, email=None, phone=None, password=None, current_password=None):
    """Met à jour le profil. Changer le mot de passe exige l'ancien."""
    if password is not None:
        if not current_password or not user.check_password(current_password):
            raise DomainError("Le mot de passe actuel est incorrect.", code="invalid_current_password")
        validate_password(password, user)
        user.set_password(password)

    if full_name is not None:
        user.full_name = full_name
    if email is not None:
        user.email = User.objects.normalize_email(email)
    if phone is not None:
        from apps.common.validators import normalize_phone

        user.phone = normalize_phone(phone)

    user.full_clean(exclude=["password"])
    user.save()
    return user


def build_reset_token(user) -> str:
    """Jeton opaque ``<uid base64>-<jeton signé>`` valable PASSWORD_RESET_TIMEOUT."""
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    return f"{uid}{RESET_TOKEN_SEPARATOR}{default_token_generator.make_token(user)}"


def _parse_reset_token(token: str):
    uid, separator, signed = str(token or "").partition(RESET_TOKEN_SEPARATOR)
    if not separator or not uid or not signed:
        raise DomainError("Lien de réinitialisation invalide.", code="invalid_reset_token")
    try:
        pk = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=pk, is_active=True)
    except (User.DoesNotExist, ValueError, TypeError, OverflowError) as exc:
        raise DomainError("Lien de réinitialisation invalide.", code="invalid_reset_token") from exc
    if not default_token_generator.check_token(user, signed):
        raise DomainError("Lien de réinitialisation expiré ou déjà utilisé.", code="expired_reset_token")
    return user


def request_password_reset(*, email: str) -> None:
    """Envoie un lien de réinitialisation.

    Ne révèle jamais si l'adresse existe : la réponse HTTP est identique dans les
    deux cas, sinon l'endpoint sert d'oracle d'énumération des comptes.
    """
    user = User.objects.filter(email__iexact=email, is_active=True).first()
    if user is None:
        logger.info("Réinitialisation demandée pour une adresse inconnue.")
        return

    token = build_reset_token(user)
    reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password/{token}"
    send_mail(
        subject="Réinitialisation de votre mot de passe APTE",
        message=(
            "Bonjour,\n\n"
            "Vous avez demandé la réinitialisation de votre mot de passe APTE.\n"
            f"Cliquez sur ce lien pour choisir un nouveau mot de passe :\n{reset_url}\n\n"
            "Ce lien expire dans une heure. Si vous n'êtes pas à l'origine de cette "
            "demande, ignorez simplement ce message.\n"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
    logger.info("Lien de réinitialisation envoyé à l'utilisateur #%s", user.pk)


@transaction.atomic
def confirm_password_reset(*, token: str, new_password: str):
    """Applique un nouveau mot de passe à partir d'un jeton valide."""
    user = _parse_reset_token(token)
    validate_password(new_password, user)
    user.set_password(new_password)
    user.save(update_fields=["password"])
    logger.info("Mot de passe réinitialisé pour l'utilisateur #%s", user.pk)
    return user


def logout(*, refresh_token: str) -> None:
    """Révoque le jeton de rafraîchissement (liste noire)."""
    if not refresh_token:
        raise DomainError("Jeton de rafraîchissement requis.", code="missing_refresh_token")
    try:
        RefreshToken(refresh_token).blacklist()
    except TokenError as exc:
        raise DomainError("Jeton de rafraîchissement invalide.", code="invalid_refresh_token") from exc


@transaction.atomic
def deactivate_account(user) -> None:
    """Désactive le compte au lieu de le supprimer.

    Une suppression en cascade effacerait les commandes et donc les pièces
    comptables associées : la loi impose de les conserver.
    """
    user.is_active = False
    user.email = None if user.email is None else user.email
    user.save(update_fields=["is_active"])
    logger.info("Compte #%s désactivé", user.pk)
