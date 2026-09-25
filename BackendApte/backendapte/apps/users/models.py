"""Entité utilisateur."""

from __future__ import annotations

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from apps.common.validators import validate_phone

from .managers import UserManager


class Role(models.TextChoices):
    INDIVIDUAL = "individual", "Particulier"
    COMPANY = "company", "Entreprise"


class User(AbstractBaseUser, PermissionsMixin):
    """Utilisateur identifié par e-mail (identifiant principal) ou téléphone."""

    email = models.EmailField("e-mail", unique=True, null=True, blank=True)
    phone = models.CharField(
        "téléphone",
        max_length=15,
        unique=True,
        null=True,
        blank=True,
        validators=[validate_phone],
    )

    full_name = models.CharField("nom complet", max_length=255, blank=True)
    role = models.CharField("type de compte", max_length=20, choices=Role.choices, default=Role.INDIVIDUAL)

    is_active = models.BooleanField("actif", default=True)
    is_staff = models.BooleanField("membre du personnel", default=False)
    date_joined = models.DateTimeField("inscrit le", default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["phone"]

    class Meta:
        verbose_name = "utilisateur"
        verbose_name_plural = "utilisateurs"
        ordering = ["email"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(email__isnull=False) | models.Q(phone__isnull=False),
                name="user_has_email_or_phone",
            ),
        ]

    def __str__(self) -> str:
        return self.email or self.phone or f"Utilisateur #{self.pk}"

    @property
    def display_name(self) -> str:
        return self.full_name or self.email or self.phone or ""

    def get_full_name(self) -> str:
        return self.full_name

    def get_short_name(self) -> str:
        return self.full_name.split(" ")[0] if self.full_name else (self.email or "")
