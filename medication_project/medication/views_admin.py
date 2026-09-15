"""
Staff-only APIs for assigning patients to doctors.

Requires JWT auth + IsAdminUser (user.is_staff=True).
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from .models import Doctor, Patient
from .views_doctor import _doctor_payload


def _get_doctor(doctor_id):
    try:
        return Doctor.objects.prefetch_related("assigned_patients").get(
            doctor_id=doctor_id
        )
    except Doctor.DoesNotExist:
        return None


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_doctor_list(request):
    """
    GET /api/admin/doctors/

    List every doctor and the patients currently assigned to them.
    """
    doctors = Doctor.objects.prefetch_related("assigned_patients").order_by("name")
    return Response([_doctor_payload(doctor) for doctor in doctors])


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_assign_patient(request, doctor_id):
    """
    POST /api/admin/doctors/<doctor_id>/patients/

    Assign a patient to a doctor. Body: { "patient_id": <int> }.
    Idempotent if the patient is already assigned.
    """
    doctor = _get_doctor(doctor_id)
    if doctor is None:
        return Response({"error": "Doctor not found"}, status=404)

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
            **_doctor_payload(doctor),
        }
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_unassign_patient(request, doctor_id, patient_id):
    """
    DELETE /api/admin/doctors/<doctor_id>/patients/<patient_id>/

    Remove a patient from a doctor's assigned list. Idempotent if not assigned.
    """
    doctor = _get_doctor(doctor_id)
    if doctor is None:
        return Response({"error": "Doctor not found"}, status=404)

    try:
        patient = Patient.objects.get(patient_id=patient_id)
    except Patient.DoesNotExist:
        return Response({"error": "Patient not found"}, status=404)

    doctor.assigned_patients.remove(patient)
    return Response(
        {
            "message": "Patient unassigned",
            **_doctor_payload(doctor),
        }
    )
