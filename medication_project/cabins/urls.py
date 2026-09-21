from django.urls import path

from .views import cabin_list, cancel_application, download_invoice, patient_applications
from .views_admin import (
    admin_application_list,
    admin_approve_application,
    admin_cabin_detail,
    admin_cabin_list,
    admin_reject_application,
)

urlpatterns = [
    path("", cabin_list, name="cabin_list"),
    path("applications/", patient_applications, name="patient_cabin_applications"),
    path(
        "applications/<int:application_id>/cancel/",
        cancel_application,
        name="cancel_cabin_application",
    ),
    path(
        "applications/<int:application_id>/invoice/",
        download_invoice,
        name="cabin_invoice_download",
    ),
    path("admin/cabins/", admin_cabin_list, name="admin_cabin_list"),
    path("admin/cabins/<int:cabin_id>/", admin_cabin_detail, name="admin_cabin_detail"),
    path("admin/applications/", admin_application_list, name="admin_cabin_applications"),
    path(
        "admin/applications/<int:application_id>/approve/",
        admin_approve_application,
        name="admin_approve_cabin_application",
    ),
    path(
        "admin/applications/<int:application_id>/reject/",
        admin_reject_application,
        name="admin_reject_cabin_application",
    ),
]
