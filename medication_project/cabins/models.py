from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import Q

from medication.models import Patient

User = get_user_model()


class Cabin(models.Model):
    cabin_id = models.BigAutoField(primary_key=True)
    number = models.CharField(max_length=32, unique=True)
    cabin_type = models.CharField(max_length=64)
    nightly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Cabin {self.number} ({self.cabin_type})"


class CabinApplication(models.Model):
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    application_id = models.BigAutoField(primary_key=True)
    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name="cabin_applications"
    )
    cabin = models.ForeignKey(
        Cabin, on_delete=models.CASCADE, related_name="applications"
    )
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    reject_reason = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviewed_cabin_applications"
    )

    def nights(self):
        return (self.end_date - self.start_date).days

    def __str__(self):
        return f"{self.patient.name} → {self.cabin.number} ({self.status})"


class Invoice(models.Model):
    invoice_id = models.BigAutoField(primary_key=True)
    application = models.OneToOneField(
        CabinApplication, on_delete=models.CASCADE, related_name="invoice"
    )
    invoice_number = models.CharField(max_length=32, unique=True)
    nights = models.PositiveIntegerField()
    nightly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    issued_at = models.DateTimeField(auto_now_add=True)
    pdf_file = models.FileField(upload_to="invoices/", blank=True)

    def __str__(self):
        return self.invoice_number


def date_range_overlaps(start, end):
    return Q(start_date__lt=end, end_date__gt=start)


def cabin_is_free(cabin, start, end, exclude_id=None):
    qs = CabinApplication.objects.filter(
        date_range_overlaps(start, end),
        cabin=cabin,
        status=CabinApplication.STATUS_APPROVED,
    )
    if exclude_id is not None:
        qs = qs.exclude(application_id=exclude_id)
    return not qs.exists()


def patient_has_overlap(patient, start, end, exclude_id=None):
    qs = CabinApplication.objects.filter(
        date_range_overlaps(start, end),
        patient=patient,
        status__in=[
            CabinApplication.STATUS_PENDING,
            CabinApplication.STATUS_APPROVED,
        ],
    )
    # exclude_id is the application_id of the application to exclude from the query to avoid checking against itself
    if exclude_id is not None:
        qs = qs.exclude(application_id=exclude_id)
    return qs.exists()


def stay_total(nightly_rate, nights):
    return (Decimal(nightly_rate) * nights).quantize(Decimal("0.01"))
