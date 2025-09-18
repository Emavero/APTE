from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from .models import User
from django import forms

# Form pour créer un utilisateur via l'admin
class UserCreationForm(forms.ModelForm):
    password = forms.CharField(label="Mot de passe", widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ("email", "phone", "full_name", "role")

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password"])  # Hash du mot de passe
        if commit:
            user.save()
        return user

# Form pour modifier un utilisateur via l'admin
class UserChangeForm(forms.ModelForm):
    password = ReadOnlyPasswordHashField(
        label="Mot de passe",
        help_text=(
            "Les mots de passe ne sont pas stockés en clair, "
            "vous ne pouvez pas voir le mot de passe de cet utilisateur, "
            "mais vous pouvez le modifier en utilisant "
            "<a href=\"../password/\">ce formulaire</a>."
        ),
    )

    class Meta:
        model = User
        fields = ("email", "phone", "full_name", "role", "is_active", "is_staff", "is_superuser")

# Admin personnalisé
class UserAdmin(BaseUserAdmin):
    form = UserChangeForm
    add_form = UserCreationForm

    list_display = ("email", "phone", "full_name", "role", "is_staff", "is_active")
    list_filter = ("is_staff", "is_active", "role")
    search_fields = ("email", "phone", "full_name")
    ordering = ("email",)

    fieldsets = (
        (None, {"fields": ("email", "phone", "password")}),
        ("Infos personnelles", {"fields": ("full_name", "role")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "phone", "full_name", "role", "password", "is_staff", "is_active"),
        }),
    )

admin.site.register(User, UserAdmin)
