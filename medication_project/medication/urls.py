from django.urls import path
from .views import get_prescription, process_prescription
from .views_admin import admin_assign_patient, admin_doctor_list, admin_unassign_patient
from .views_doctor import doctor_me, doctor_patients

urlpatterns = [
    path('upload-prescription/', process_prescription, name='upload-prescription'),
    path('prescription/<int:prescription_id>/', get_prescription, name='get-prescription'),
    path('doctors/me/', doctor_me, name='doctor_me'),
    path('doctors/me/patients/', doctor_patients, name='doctor_patients'),
    path('admin/doctors/', admin_doctor_list, name='admin_doctor_list'),
    path(
        'admin/doctors/<int:doctor_id>/patients/',
        admin_assign_patient,
        name='admin_assign_patient',
    ),
    path(
        'admin/doctors/<int:doctor_id>/patients/<int:patient_id>/',
        admin_unassign_patient,
        name='admin_unassign_patient',
    ),
]
