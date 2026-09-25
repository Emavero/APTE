"""Tests d'authentification et de réinitialisation de mot de passe.

Couvre la faille principale de l'ancienne implémentation : l'endpoint de
réinitialisation acceptait « e-mail + nouveau mot de passe » sans aucune preuve
de possession de la boîte, ce qui permettait de prendre n'importe quel compte.
"""

from __future__ import annotations

import pytest
from django.core import mail
from django.urls import reverse

from apps.users.services import build_reset_token

pytestmark = pytest.mark.django_db


# ---------------------------------------------------------------- inscription
def test_registration_creates_an_account(api):
    response = api.post(
        reverse("api:users:register"),
        {
            "email": "nouveau@apte.test",
            "phone": "77 987 65 43",
            "full_name": "Moussa Fall",
            "password": "Motdepasse!2024",
            "password2": "Motdepasse!2024",
        },
        format="json",
    )
    assert response.status_code == 201, response.data
    assert response.data["email"] == "nouveau@apte.test"
    assert "password" not in response.data


def test_registration_normalises_the_phone(api):
    api.post(
        reverse("api:users:register"),
        {
            "phone": "+221 77 987 65 43",
            "password": "Motdepasse!2024",
            "password2": "Motdepasse!2024",
        },
        format="json",
    )
    from django.contrib.auth import get_user_model

    assert get_user_model().objects.filter(phone="221779876543").exists()


def test_registration_refuses_a_weak_password(api):
    response = api.post(
        reverse("api:users:register"),
        {"email": "faible@apte.test", "password": "1234", "password2": "1234"},
        format="json",
    )
    assert response.status_code == 400


def test_registration_refuses_mismatched_passwords(api):
    response = api.post(
        reverse("api:users:register"),
        {"email": "x@apte.test", "password": "Motdepasse!2024", "password2": "Autre!2024"},
        format="json",
    )
    assert response.status_code == 400


def test_registration_refuses_a_duplicate_email(api, user):
    response = api.post(
        reverse("api:users:register"),
        {"email": user.email, "password": "Motdepasse!2024", "password2": "Motdepasse!2024"},
        format="json",
    )
    assert response.status_code == 400


def test_registration_requires_email_or_phone(api):
    response = api.post(
        reverse("api:users:register"),
        {"password": "Motdepasse!2024", "password2": "Motdepasse!2024"},
        format="json",
    )
    assert response.status_code == 400


# ------------------------------------------------------------------- connexion
def test_login_returns_a_token_pair(api, user):
    response = api.post(
        reverse("api:users:login"),
        {"email": user.email, "password": "Motdepasse!2024"},
        format="json",
    )
    assert response.status_code == 200
    assert response.data["access"] and response.data["refresh"]


def test_login_with_a_wrong_password_fails(api, user):
    response = api.post(reverse("api:users:login"), {"email": user.email, "password": "faux"}, format="json")
    assert response.status_code == 401


def test_logout_blacklists_the_refresh_token(api, user):
    tokens = api.post(
        reverse("api:users:login"),
        {"email": user.email, "password": "Motdepasse!2024"},
        format="json",
    ).data
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    logout = api.post(reverse("api:users:logout"), {"refresh": tokens["refresh"]}, format="json")
    assert logout.status_code == 200

    # Le jeton révoqué ne peut plus produire d'accès.
    refresh = api.post(reverse("api:users:token-refresh"), {"refresh": tokens["refresh"]}, format="json")
    assert refresh.status_code == 401


# --------------------------------------------------------------------- profil
def test_me_requires_authentication(api):
    assert api.get(reverse("api:users:me")).status_code == 401


def test_me_returns_the_current_profile(auth_api, user):
    response = auth_api.get(reverse("api:users:me"))
    assert response.status_code == 200
    assert response.data["email"] == user.email


def test_changing_the_password_requires_the_current_one(auth_api):
    response = auth_api.patch(reverse("api:users:me"), {"password": "NouveauPass!2024"}, format="json")
    assert response.status_code == 400
    assert response.data["code"] == "invalid_current_password"


def test_changing_the_password_with_the_current_one_succeeds(auth_api, user):
    response = auth_api.patch(
        reverse("api:users:me"),
        {"current_password": "Motdepasse!2024", "password": "NouveauPass!2024"},
        format="json",
    )
    assert response.status_code == 200
    user.refresh_from_db()
    assert user.check_password("NouveauPass!2024")


def test_a_user_cannot_take_another_users_email(auth_api, other_user):
    response = auth_api.patch(reverse("api:users:me"), {"email": other_user.email}, format="json")
    assert response.status_code == 400


def test_deleting_the_account_deactivates_it(auth_api, user):
    assert auth_api.delete(reverse("api:users:delete-me")).status_code == 204
    user.refresh_from_db()
    assert user.is_active is False


# ----------------------------------------------- réinitialisation de mot de passe
def test_reset_without_token_never_changes_the_password(api, user):
    response = api.post(
        reverse("api:users:password-reset"),
        {"email": user.email, "new_password": "PirateMotdepasse!2024"},
        format="json",
    )
    assert response.status_code == 200
    assert response.data["stage"] == "email_sent"

    user.refresh_from_db()
    assert user.check_password("Motdepasse!2024")
    assert not user.check_password("PirateMotdepasse!2024")


def test_reset_request_sends_a_link(api, user):
    mail.outbox.clear()
    api.post(reverse("api:users:password-reset"), {"email": user.email}, format="json")
    assert len(mail.outbox) == 1
    assert "reset-password/" in mail.outbox[0].body


def test_reset_request_does_not_reveal_unknown_addresses(api, user):
    mail.outbox.clear()
    known = api.post(reverse("api:users:password-reset"), {"email": user.email}, format="json")
    unknown = api.post(reverse("api:users:password-reset"), {"email": "inexistant@apte.test"}, format="json")
    assert known.status_code == unknown.status_code == 200
    assert known.data == unknown.data
    assert len(mail.outbox) == 1


def test_reset_with_a_valid_token_changes_the_password(api, user):
    response = api.post(
        reverse("api:users:password-reset"),
        {"token": build_reset_token(user), "new_password": "NouveauPass!2024"},
        format="json",
    )
    assert response.status_code == 200
    assert response.data["stage"] == "completed"
    user.refresh_from_db()
    assert user.check_password("NouveauPass!2024")


def test_a_reset_token_cannot_be_replayed(api, user):
    token = build_reset_token(user)
    first = api.post(
        reverse("api:users:password-reset"),
        {"token": token, "new_password": "NouveauPass!2024"},
        format="json",
    )
    assert first.status_code == 200

    replay = api.post(
        reverse("api:users:password-reset"),
        {"token": token, "new_password": "EncoreAutre!2024"},
        format="json",
    )
    assert replay.status_code == 400
    user.refresh_from_db()
    assert user.check_password("NouveauPass!2024")


@pytest.mark.parametrize("token", ["n-importe-quoi", "abc-def", "MQ-faux-jeton"])
def test_a_forged_token_is_refused(api, user, token):
    response = api.post(
        reverse("api:users:password-reset"),
        {"token": token, "new_password": "PirateMotdepasse!2024"},
        format="json",
    )
    assert response.status_code == 400
    user.refresh_from_db()
    assert user.check_password("Motdepasse!2024")


def test_a_token_of_one_user_cannot_reset_another(api, user, other_user):
    """Le jeton est lié à l'utilisateur : il ne peut pas être détourné."""
    token = build_reset_token(other_user)
    api.post(
        reverse("api:users:password-reset"),
        {"token": token, "new_password": "NouveauPass!2024"},
        format="json",
    )
    user.refresh_from_db()
    assert user.check_password("Motdepasse!2024")


def test_reset_refuses_a_weak_password(api, user):
    response = api.post(
        reverse("api:users:password-reset"),
        {"token": build_reset_token(user), "new_password": "1234"},
        format="json",
    )
    assert response.status_code == 400


# ------------------------------------------------------------------- annuaire
def test_user_list_is_staff_only(auth_api):
    assert auth_api.get(reverse("api:users:list")).status_code == 403


def test_staff_can_list_users(api, staff_user, user):
    api.force_authenticate(user=staff_user)
    response = api.get(reverse("api:users:list"))
    assert response.status_code == 200
    assert response.data["count"] >= 2
