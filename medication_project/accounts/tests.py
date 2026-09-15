from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from medication.models import Doctor, Patient

User = get_user_model()


class DoctorApiTests(APITestCase):
    def test_register_login_and_profile(self):
        register = self.client.post(
            "/api/auth/doctor/register/",
            {
                "username": "dr_smith",
                "password": "secret123",
                "name": "Dr. Smith",
                "department": "Cardiology",
            },
            format="json",
        )
        self.assertEqual(register.status_code, 201)
        self.assertTrue(Doctor.objects.filter(user__username="dr_smith").exists())
        self.assertFalse(Patient.objects.filter(user__username="dr_smith").exists())

        login = self.client.post(
            "/api/auth/login/",
            {"username": "dr_smith", "password": "secret123"},
            format="json",
        )
        self.assertEqual(login.status_code, 200)
        self.assertTrue(login.data["is_doctor"])
        self.assertFalse(login.data["is_staff"])

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        me = self.client.get("/api/doctors/me/")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data["name"], "Dr. Smith")
        self.assertEqual(me.data["department"], "Cardiology")
        self.assertEqual(me.data["assigned_patients"], [])

        patched = self.client.patch(
            "/api/doctors/me/",
            {"department": "Neurology"},
            format="json",
        )
        self.assertEqual(patched.status_code, 200)
        self.assertEqual(patched.data["department"], "Neurology")

    def test_doctor_sees_only_assigned_patients(self):
        doctor_user = User.objects.create_user(username="dr_jane", password="secret123")
        doctor = Doctor.objects.create(
            user=doctor_user, name="Dr. Jane", department="Oncology"
        )
        patient_user = User.objects.create_user(username="pat", password="secret123")
        patient = Patient.objects.create(user=patient_user, name="Pat")
        other_user = User.objects.create_user(username="other", password="secret123")
        Patient.objects.create(user=other_user, name="Other")
        doctor.assigned_patients.add(patient)

        login = self.client.post(
            "/api/auth/login/",
            {"username": "dr_jane", "password": "secret123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

        listed = self.client.get("/api/doctors/me/patients/")
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(len(listed.data["assigned_patients"]), 1)
        self.assertEqual(listed.data["assigned_patients"][0]["patient_id"], patient.patient_id)

        blocked = self.client.post(
            "/api/doctors/me/patients/",
            {"patient_id": patient.patient_id},
            format="json",
        )
        self.assertEqual(blocked.status_code, 405)

    def test_patient_cannot_access_doctor_api(self):
        self.client.post(
            "/api/auth/register/",
            {"username": "patient1", "password": "secret123", "name": "Patient One"},
            format="json",
        )
        login = self.client.post(
            "/api/auth/login/",
            {"username": "patient1", "password": "secret123"},
            format="json",
        )
        self.assertFalse(login.data["is_doctor"])
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        me = self.client.get("/api/doctors/me/")
        self.assertEqual(me.status_code, 403)
