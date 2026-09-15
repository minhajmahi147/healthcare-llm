from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

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

"""  this function is used to list assigned patients for the current doctor """
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsDoctor])
def doctor_patients(request):
    """List patients assigned to the current doctor. Assignment is staff-only."""
    doctor = request.user.doctor_profile
    patients = [_patient_payload(p) for p in doctor.assigned_patients.all()]
    return Response({"assigned_patients": patients})
