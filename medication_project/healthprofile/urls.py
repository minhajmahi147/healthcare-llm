from django.urls import path
from .views import get_health_profile, get_health_plan, get_dietary_recommendation
from .views_admin import admin_patient_list, admin_patient_detail

urlpatterns = [
    path("profile/", get_health_profile, name="get_health_profile"),
    path("plan/", get_health_plan, name="get_health_plan"),
    path(
        "dietary-recommendation/",
        get_dietary_recommendation,
        name="get_dietary_recommendation",
    ),
    path("admin/patients/", admin_patient_list, name="admin_patient_list"),
    path(
        "admin/patients/<int:patient_id>/",
        admin_patient_detail,
        name="admin_patient_detail",
    ),
]
