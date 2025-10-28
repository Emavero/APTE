from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView,UserList,MeView, ResetPasswordView,DeleteMeView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("reset-password/",  ResetPasswordView.as_view(), name="user-me-update"),
    path("delete/", DeleteMeView.as_view(), name="user-me-delete"),
    path("", UserList.as_view(), name="user-list"),

]

