from django.urls import path

from .views import (
    DeleteMeView,
    LogoutView,
    MeView,
    PasswordResetView,
    RegisterView,
    ThrottledTokenObtainPairView,
    ThrottledTokenRefreshView,
    UserListView,
)

app_name = "users"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", ThrottledTokenObtainPairView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", ThrottledTokenRefreshView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("reset-password/", PasswordResetView.as_view(), name="password-reset"),
    path("delete/", DeleteMeView.as_view(), name="delete-me"),
    path("", UserListView.as_view(), name="list"),
]
