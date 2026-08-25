from django.urls import path
from .views import get_prescription, process_prescription

urlpatterns = [
    path('upload-prescription/', process_prescription, name='upload-prescription'),
    path('prescription/<int:prescription_id>/', get_prescription, name='get-prescription'),
]
