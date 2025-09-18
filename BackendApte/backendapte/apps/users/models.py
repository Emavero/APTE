from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

# ==============================
# Gestionnaire personnalisé
# ==============================
class UserManager(BaseUserManager):
    
    """
    Manager personnalisé pour le modèle User.
    Définit comment créer des utilisateurs normaux et des superusers.
    """

    def create_user(self, email=None, phone=None, password=None, **extra_fields):
       
        """
        Crée et sauvegarde un utilisateur normal.
        - email ou phone doivent être fournis.
        - le mot de passe est hashé automatiquement.
        """
        if not email and not phone:
            raise ValueError("Un utilisateur doit avoir au moins un email ou un numéro de téléphone")

        # Normalise l'email (minuscule, etc.) si fourni
        email = self.normalize_email(email) if email else None

        # Crée l'objet utilisateur sans l'enregistrer encore en DB
        user = self.model(email=email, phone=phone, **extra_fields)

        # Hash du mot de passe
        user.set_password(password)

        # Sauvegarde en base de données
        user.save(using=self._db)
        return user

    def create_superuser(self, email, phone, password=None, **extra_fields):
        """
        Crée un superuser avec tous les droits.
        Définit is_staff, is_superuser et is_active à True par défaut.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        return self.create_user(email, phone, password, **extra_fields)


# ==============================
# Modèle utilisateur personnalisé
# ==============================
class User(AbstractBaseUser, PermissionsMixin):
    """
    Modèle d'utilisateur personnalisé.
    Hérite de AbstractBaseUser pour la gestion du mot de passe.
    Hérite de PermissionsMixin pour gérer les permissions et groupes.
    """

    # Informations de contact
    email = models.EmailField(unique=True, null=True, blank=True)  # email unique, facultatif
    phone = models.CharField(max_length=15, unique=True, null=True, blank=True)  # numéro unique, facultatif

    # Informations personnelles
    full_name = models.CharField(max_length=255, blank=True)
    role = models.CharField(
        max_length=20,
        choices=[ ("individual", "Particulier"),("company", "Entreprise")],
        default="individual"
    )

    # Statut et permissions
    is_active = models.BooleanField(default=True)  # permet d'activer/désactiver l'utilisateur
    is_staff = models.BooleanField(default=False)  # permet l'accès à l'admin
    date_joined = models.DateTimeField(auto_now_add=True)  # date de création de l'utilisateur

    # Associe le manager personnalisé
    objects = UserManager()

    # ==============================
    # Configuration Django
    # ==============================
    USERNAME_FIELD = "email"       # champ utilisé pour l'authentification
    REQUIRED_FIELDS = ["phone"]    # champs requis pour create_superuser

    def __str__(self):
        """
        Retourne une représentation lisible de l'utilisateur.
        Affiche l'email si disponible, sinon le numéro de téléphone.
        """
        return self.email or self.phone
