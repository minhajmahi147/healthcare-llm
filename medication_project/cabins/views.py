from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from django.http import FileResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from medication.models import Patient

from .models import (
    Cabin,
    CabinApplication,
    cabin_is_free,
    patient_has_overlap,
)


def _patient_or_error(request):
    patient = Patient.objects.filter(user=request.user).first()
    if patient is None:
        return None, Response({"error": "Patient profile required"}, status=403)
    return patient, None


def _parse_date(value, field):
    if not value:
        return None, Response({"error": f"{field} is required"}, status=400)
    if isinstance(value, date) and not isinstance(value, datetime):
        return value, None
    try:
        return date.fromisoformat(str(value)[:10]), None
    except ValueError:
        return None, Response({"error": f"{field} must be YYYY-MM-DD"}, status=400)


def _validate_stay(start, end):
    if end <= start:
        return Response({"error": "end_date must be after start_date"}, status=400)
    if start < timezone.localdate():
        return Response({"error": "start_date cannot be in the past"}, status=400)
    return None


def _invoice_payload(invoice):
    if invoice is None:
        return None
    return {
        "invoice_number": invoice.invoice_number,
        "nights": invoice.nights,
        "nightly_rate": str(invoice.nightly_rate),
        "total": str(invoice.total),
        "issued_at": invoice.issued_at,
    }


def _application_payload(application):
    cabin = application.cabin
    invoice = getattr(application, "invoice", None)
    return {
        "application_id": application.application_id,
        "status": application.status,
        "start_date": application.start_date,
        "end_date": application.end_date,
        "nights": application.nights(),
        "reject_reason": application.reject_reason or "",
        "created_at": application.created_at,
        "cabin": {
            "cabin_id": cabin.cabin_id,
            "number": cabin.number,
            "cabin_type": cabin.cabin_type,
            "nightly_rate": str(cabin.nightly_rate),
        },
        "patient": {
            "patient_id": application.patient.patient_id,
            "name": application.patient.name,
        },
        "invoice": _invoice_payload(invoice),
    }


def _cabin_payload(cabin, start=None, end=None):
    available = True
    if start and end:
        available = cabin_is_free(cabin, start, end)
    return {
        "cabin_id": cabin.cabin_id,
        "number": cabin.number,
        "cabin_type": cabin.cabin_type,
        "nightly_rate": str(cabin.nightly_rate),
        "is_active": cabin.is_active,
        "available": available,
    }


def parse_rate(value):
    try:
        rate = Decimal(str(value))
    except (InvalidOperation, TypeError):
        return None
    if rate <= 0:
        return None
    return rate.quantize(Decimal("0.01"))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cabin_list(request):
    patient, error = _patient_or_error(request)
    if error:
        return error

    start_raw = request.query_params.get("start_date")
    end_raw = request.query_params.get("end_date")
    start = end = None
    if start_raw or end_raw:
        start, err = _parse_date(start_raw, "start_date")
        if err:
            return err
        end, err = _parse_date(end_raw, "end_date")
        if err:
            return err
        stay_error = _validate_stay(start, end)
        if stay_error:
            return stay_error

    cabins = Cabin.objects.filter(is_active=True).order_by("number")
    return Response([_cabin_payload(cabin, start, end) for cabin in cabins])


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def patient_applications(request):
    patient, error = _patient_or_error(request)
    if error:
        return error

    if request.method == "GET":
        applications = (
            CabinApplication.objects.filter(patient=patient)
            .select_related("cabin", "patient", "invoice")
            .order_by("-created_at")
        )
        return Response([_application_payload(row) for row in applications])

    cabin_id = request.data.get("cabin_id")
    if not cabin_id:
        return Response({"error": "cabin_id is required"}, status=400)
    start, err = _parse_date(request.data.get("start_date"), "start_date")
    if err:
        return err
    end, err = _parse_date(request.data.get("end_date"), "end_date")
    if err:
        return err
    stay_error = _validate_stay(start, end)
    if stay_error:
        return stay_error

    try:
        cabin = Cabin.objects.get(cabin_id=cabin_id, is_active=True)
    except Cabin.DoesNotExist:
        return Response({"error": "Cabin not found"}, status=404)

    if not cabin_is_free(cabin, start, end):
        return Response({"error": "Cabin is not free for those dates"}, status=409)
    if patient_has_overlap(patient, start, end):
        return Response(
            {"error": "You already have a pending or approved stay overlapping those dates"},
            status=409,
        )

    application = CabinApplication.objects.create(
        patient=patient,
        cabin=cabin,
        start_date=start,
        end_date=end,
    )
    return Response(_application_payload(application), status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cancel_application(request, application_id):
    patient, error = _patient_or_error(request)
    if error:
        return error

    try:
        application = CabinApplication.objects.select_related(
            "cabin", "patient", "invoice"
        ).get(application_id=application_id, patient=patient)
    except CabinApplication.DoesNotExist:
        return Response({"error": "Application not found"}, status=404)

    if application.status != CabinApplication.STATUS_PENDING:
        return Response({"error": "Only pending applications can be cancelled"}, status=400)

    application.status = CabinApplication.STATUS_CANCELLED
    application.save(update_fields=["status"])
    return Response(_application_payload(application))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_invoice(request, application_id):
    try:
        application = CabinApplication.objects.select_related("invoice", "cabin", "patient").get(
            application_id=application_id
        )
    except CabinApplication.DoesNotExist:
        return Response({"error": "Application not found"}, status=404)

    is_owner = (
        hasattr(request.user, "patient_profile")
        and application.patient_id == request.user.patient_profile.patient_id
    )
    if not (request.user.is_staff or is_owner):
        return Response({"error": "Not allowed"}, status=403)

    invoice = getattr(application, "invoice", None)
    if invoice is None or not invoice.pdf_file:
        return Response({"error": "Invoice not available"}, status=404)

    return FileResponse(
        invoice.pdf_file.open("rb"),
        as_attachment=True,
        filename=f"{invoice.invoice_number}.pdf",
        content_type="application/pdf",
    )
