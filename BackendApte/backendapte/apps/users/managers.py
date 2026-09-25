"""Manager du modèle utilisateur."""

from __future__ import annotations

from django.contrib.auth.models import BaseUserManager

from apps.common.validators import normalize_phone


class UserManager(BaseUserManager):
    """Création d'utilisateurs identifiés par e-mail *ou* téléphone."""

    use_in_migrations = True

    def _create_user(self, email=None, phone=None, password=None, **extra_fields):
        if not email and not phone:
            raise ValueError("Un utilisateur doit avoir au moins un e-mail ou un téléphone.")

        user = self.model(
            email=self.normalize_email(email) if email else None,
            phone=normalize_phone(phone),
            **extra_fields,
        )
        # set_password hache le mot de passe ; set_unusable_password interdit la
        # connexion par mot de passe (comptes créés par un canal externe).
        if password:
            user.password = self.make_password_for(user, password)
        else:
            user.set_unusable_password()
        user.full_clean(exclude=["password"])
        user.save(using=self._db)
        return user

    @staticmethod
    def make_password_for(user, password: str) -> str:
        user.set_password(password)
        return user.password

    def create_user(self, email=None, phone=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, phone, password, **extra_fields)

    def create_superuser(self, email=None, phone=None, password=None, **extra_fields):
        extra_fields.update(is_staff=True, is_superuser=True, is_active=True)
        if not password:
            raise ValueError("Un superutilisateur doit avoir un mot de passe.")
        return self._create_user(email, phone, password, **extra_fields)
