from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Patient
from .permissions import IsDoctor


def _patient_payload(patient):
    return {
        "patient_id": patient.patient_id,
        "name": patient.name,
        "email": patient.email,
    }


def _doctor_payload(doctor):
    patients = [_patient_payload(p) for p in doctor.assigned_patients.all()]
    return {
        "doctor_id": doctor.doctor_id,
        "name": doctor.name,
        "department": doctor.department,
        "assigned_patients": patients,
    }

"""  this function is used to get the current doctor's profile and assigned patients """
@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated, IsDoctor])
def doctor_me(request):
    """Current doctor's profile and assigned patients."""
    print(">>>>>>>>>>>>>request", request)
    print(">>>>>>>>>>>>>request.user", request.user)
    doctor = request.user.doctor_profile
    print(">>>>>>>>>>>>>doctor", doctor)

    if request.method == "PATCH":
        if "name" in request.data:
            doctor.name = request.data.get("name") or doctor.name
        if "department" in request.data:
            department = request.data.get("department")
            if not department:
                return Response({"error": "department cannot be empty"}, status=400)
            doctor.department = department
        doctor.save()

    return Response(_doctor_payload(doctor))

"""  this function is used to list or assign patients for the current doctor """
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, IsDoctor])
def doctor_patients(request):
    """List or assign patients for the current doctor."""
    doctor = request.user.doctor_profile

    if request.method == "GET":
        patients = [_patient_payload(p) for p in doctor.assigned_patients.all()]
        return Response({"assigned_patients": patients})

    patient_id = request.data.get("patient_id")
    if not patient_id:
        return Response({"error": "patient_id is required"}, status=400)

    try:
        patient = Patient.objects.get(patient_id=patient_id)
    except Patient.DoesNotExist:
        return Response({"error": "Patient not found"}, status=404)

    doctor.assigned_patients.add(patient)
    return Response(
        {
            "message": "Patient assigned",
            "assigned_patients": [_patient_payload(p) for p in doctor.assigned_patients.all()],
        }
    )
