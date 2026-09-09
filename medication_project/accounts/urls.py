from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import register, register_admin, login

urlpatterns = [
    path("register/", register),
    path("admin/register/", register_admin),
    path("login/", login),
    path("refresh/", TokenRefreshView.as_view()),
]