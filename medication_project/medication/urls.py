from django.urls import path
from .views import get_prescription, process_prescription
from .views_doctor import doctor_me, doctor_patients

urlpatterns = [
    path('upload-prescription/', process_prescription, name='upload-prescription'),
    path('prescription/<int:prescription_id>/', get_prescription, name='get-prescription'),
    path('doctors/me/', doctor_me, name='doctor_me'),
    path('doctors/me/patients/', doctor_patients, name='doctor_patients'),
]
