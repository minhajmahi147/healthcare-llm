from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from .models import (
    Cabin,
    CabinApplication,
    Invoice,
    cabin_is_free,
    stay_total,
)
from .pdf import render_invoice_pdf
from .views import _application_payload, _cabin_payload, parse_rate


def _next_invoice_number():
    year = timezone.now().year
    prefix = f"INV-{year}-"
    last = (
        Invoice.objects.filter(invoice_number__startswith=prefix)
        .order_by("-invoice_id")
        .first()
    )
    seq = 1
    if last:
        seq = int(last.invoice_number.rsplit("-", 1)[-1]) + 1
    return f"{prefix}{seq:04d}"


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_cabin_list(request):
    if request.method == "GET":
        cabins = Cabin.objects.order_by("number")
        return Response([_cabin_payload(cabin) for cabin in cabins])

    number = (request.data.get("number") or "").strip()
    cabin_type = (request.data.get("cabin_type") or "").strip()
    rate = parse_rate(request.data.get("nightly_rate"))
    if not number or not cabin_type or rate is None:
        return Response(
            {"error": "number, cabin_type, and a positive nightly_rate are required"},
            status=400,
        )
    if Cabin.objects.filter(number=number).exists():
        return Response({"error": "Cabin number already exists"}, status=400)

    cabin = Cabin.objects.create(
        number=number,
        cabin_type=cabin_type,
        nightly_rate=rate,
        is_active=bool(request.data.get("is_active", True)),
    )
    return Response(_cabin_payload(cabin), status=201)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_cabin_detail(request, cabin_id):
    try:
        cabin = Cabin.objects.get(cabin_id=cabin_id)
    except Cabin.DoesNotExist:
        return Response({"error": "Cabin not found"}, status=404)

    if "number" in request.data:
        number = (request.data.get("number") or "").strip()
        if not number:
            return Response({"error": "number cannot be empty"}, status=400)
        if Cabin.objects.exclude(cabin_id=cabin_id).filter(number=number).exists():
            return Response({"error": "Cabin number already exists"}, status=400)
        cabin.number = number
    if "cabin_type" in request.data:
        cabin_type = (request.data.get("cabin_type") or "").strip()
        if not cabin_type:
            return Response({"error": "cabin_type cannot be empty"}, status=400)
        cabin.cabin_type = cabin_type
    if "nightly_rate" in request.data:
        rate = parse_rate(request.data.get("nightly_rate"))
        if rate is None:
            return Response({"error": "nightly_rate must be a positive number"}, status=400)
        cabin.nightly_rate = rate
    if "is_active" in request.data:
        cabin.is_active = bool(request.data.get("is_active"))
    cabin.save()
    return Response(_cabin_payload(cabin))


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_application_list(request):
    status_filter = request.query_params.get("status")
    applications = CabinApplication.objects.select_related(
        "cabin", "patient", "invoice"
    ).order_by("-created_at")
    if status_filter:
        applications = applications.filter(status=status_filter)
    return Response([_application_payload(row) for row in applications])


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_approve_application(request, application_id):
    with transaction.atomic():
        try:
            application = (
                CabinApplication.objects.select_for_update()
                .select_related("cabin", "patient")
                .get(application_id=application_id)
            )
        except CabinApplication.DoesNotExist:
            return Response({"error": "Application not found"}, status=404)

        if application.status != CabinApplication.STATUS_PENDING:
            return Response({"error": "Only pending applications can be approved"}, status=400)
        if not application.cabin.is_active:
            return Response({"error": "Cabin is not active"}, status=409)
        if not cabin_is_free(
            application.cabin,
            application.start_date,
            application.end_date,
            exclude_id=application.application_id,
        ):
            return Response({"error": "Cabin is no longer free for those dates"}, status=409)

        nights = application.nights()
        application.status = CabinApplication.STATUS_APPROVED
        application.reviewed_at = timezone.now()
        application.reviewed_by = request.user
        application.save()

        invoice = Invoice.objects.create(
            application=application,
            invoice_number=_next_invoice_number(),
            nights=nights,
            nightly_rate=application.cabin.nightly_rate,
            total=stay_total(application.cabin.nightly_rate, nights),
        )
        pdf_bytes = render_invoice_pdf(invoice)
        invoice.pdf_file.save(f"{invoice.invoice_number}.pdf", ContentFile(pdf_bytes), save=True)

    application = CabinApplication.objects.select_related(
        "cabin", "patient", "invoice"
    ).get(application_id=application_id)
    return Response(_application_payload(application))


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_reject_application(request, application_id):
    try:
        application = CabinApplication.objects.select_related(
            "cabin", "patient", "invoice"
        ).get(application_id=application_id)
    except CabinApplication.DoesNotExist:
        return Response({"error": "Application not found"}, status=404)

    if application.status != CabinApplication.STATUS_PENDING:
        return Response({"error": "Only pending applications can be rejected"}, status=400)

    application.status = CabinApplication.STATUS_REJECTED
    application.reject_reason = (request.data.get("reason") or "").strip()
    application.reviewed_at = timezone.now()
    application.reviewed_by = request.user
    application.save()
    return Response(_application_payload(application))
