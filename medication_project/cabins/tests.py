from datetime import timedelta
from decimal import Decimal
import tempfile

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from cabins.models import Cabin, CabinApplication, Invoice
from cabins.pdf import build_text_pdf
from medication.models import Doctor, Patient

User = get_user_model()


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class CabinApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin", password="secret123", is_staff=True
        )
        patient_user = User.objects.create_user(username="pat", password="secret123")
        self.patient = Patient.objects.create(user=patient_user, name="Pat")
        other_user = User.objects.create_user(username="other", password="secret123")
        self.other_patient = Patient.objects.create(user=other_user, name="Other")
        doctor_user = User.objects.create_user(username="dr_jane", password="secret123")
        Doctor.objects.create(user=doctor_user, name="Dr. Jane", department="Oncology")
        self.cabin = Cabin.objects.create(
            number="101",
            cabin_type="Deluxe",
            nightly_rate=Decimal("1500.00"),
        )
        self.start = timezone.localdate() + timedelta(days=2)
        self.end = self.start + timedelta(days=3)

    def _login(self, username):
        login = self.client.post(
            "/api/auth/login/",
            {"username": username, "password": "secret123"},
            format="json",
        )
        self.assertEqual(login.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        return login.data

    def test_patient_applies_when_cabin_is_free(self):
        self._login("pat")
        listed = self.client.get(
            "/api/cabins/",
            {"start_date": self.start.isoformat(), "end_date": self.end.isoformat()},
        )
        self.assertEqual(listed.status_code, 200)
        self.assertTrue(listed.data[0]["available"])

        created = self.client.post(
            "/api/cabins/applications/",
            {
                "cabin_id": self.cabin.cabin_id,
                "start_date": self.start.isoformat(),
                "end_date": self.end.isoformat(),
            },
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.data["status"], "pending")
        self.assertEqual(created.data["nights"], 3)

        mine = self.client.get("/api/cabins/applications/")
        self.assertEqual(len(mine.data), 1)

    def test_cannot_apply_when_approved_stay_overlaps(self):
        CabinApplication.objects.create(
            patient=self.other_patient,
            cabin=self.cabin,
            start_date=self.start,
            end_date=self.end,
            status=CabinApplication.STATUS_APPROVED,
        )
        self._login("pat")
        blocked = self.client.post(
            "/api/cabins/applications/",
            {
                "cabin_id": self.cabin.cabin_id,
                "start_date": self.start.isoformat(),
                "end_date": self.end.isoformat(),
            },
            format="json",
        )
        self.assertEqual(blocked.status_code, 409)

    def test_admin_approve_creates_invoice_pdf(self):
        application = CabinApplication.objects.create(
            patient=self.patient,
            cabin=self.cabin,
            start_date=self.start,
            end_date=self.end,
        )
        self._login("admin")
        approved = self.client.post(
            f"/api/cabins/admin/applications/{application.application_id}/approve/"
        )
        self.assertEqual(approved.status_code, 200)
        self.assertEqual(approved.data["status"], "approved")
        self.assertIsNotNone(approved.data["invoice"])
        self.assertTrue(approved.data["invoice"]["invoice_number"].startswith("INV-"))
        self.assertEqual(approved.data["invoice"]["total"], "4500.00")

        invoice = Invoice.objects.get(application=application)
        self.assertTrue(invoice.pdf_file)
        with invoice.pdf_file.open("rb") as pdf_file:
            self.assertTrue(pdf_file.read().startswith(b"%PDF"))

        pdf = self.client.get(
            f"/api/cabins/applications/{application.application_id}/invoice/"
        )
        self.assertEqual(pdf.status_code, 200)
        self.assertIn("application/pdf", pdf["Content-Type"])

    def test_second_approve_loses_if_cabin_taken(self):
        first = CabinApplication.objects.create(
            patient=self.patient,
            cabin=self.cabin,
            start_date=self.start,
            end_date=self.end,
        )
        second = CabinApplication.objects.create(
            patient=self.other_patient,
            cabin=self.cabin,
            start_date=self.start,
            end_date=self.end,
        )
        self._login("admin")
        ok = self.client.post(
            f"/api/cabins/admin/applications/{first.application_id}/approve/"
        )
        self.assertEqual(ok.status_code, 200)
        conflict = self.client.post(
            f"/api/cabins/admin/applications/{second.application_id}/approve/"
        )
        self.assertEqual(conflict.status_code, 409)

    def test_admin_reject_and_patient_cancel(self):
        application = CabinApplication.objects.create(
            patient=self.patient,
            cabin=self.cabin,
            start_date=self.start,
            end_date=self.end,
        )
        self._login("admin")
        rejected = self.client.post(
            f"/api/cabins/admin/applications/{application.application_id}/reject/",
            {"reason": "No beds needed"},
            format="json",
        )
        self.assertEqual(rejected.status_code, 200)
        self.assertEqual(rejected.data["status"], "rejected")

        pending = CabinApplication.objects.create(
            patient=self.patient,
            cabin=self.cabin,
            start_date=self.start + timedelta(days=10),
            end_date=self.end + timedelta(days=10),
        )
        self._login("pat")
        cancelled = self.client.post(
            f"/api/cabins/applications/{pending.application_id}/cancel/"
        )
        self.assertEqual(cancelled.status_code, 200)
        self.assertEqual(cancelled.data["status"], "cancelled")

    def test_admin_can_create_cabin(self):
        self._login("admin")
        created = self.client.post(
            "/api/cabins/admin/cabins/",
            {"number": "202", "cabin_type": "Single", "nightly_rate": "800"},
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.data["number"], "202")

        listed = self.client.get("/api/cabins/admin/cabins/")
        self.assertEqual(len(listed.data), 2)

    def test_doctor_cannot_apply(self):
        self._login("dr_jane")
        listed = self.client.get("/api/cabins/")
        self.assertEqual(listed.status_code, 403)

    def test_pdf_bytes_are_valid_header(self):
        pdf = build_text_pdf("Title", ["Line one"])
        self.assertTrue(pdf.startswith(b"%PDF-1.4"))
        self.assertIn(b"%%EOF", pdf)
