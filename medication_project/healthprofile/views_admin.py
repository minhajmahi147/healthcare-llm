"""
Staff-only admin APIs for viewing all patients and their diet / health plans.

Requires JWT auth + IsAdminUser (user.is_staff=True).
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Prefetch

from medication.models import Patient
from .models import healthProfile, HealthPlan, DietaryRecommendation


def _profile_payload(profile):
    """Turn a healthProfile row into a plain dict, or None if missing."""
    if profile is None:
        return None
    return {
        "age": profile.age,
        "weight": profile.weight,
        "height_feet": profile.height_feet,
        "height_inches": profile.height_inches,
        "bmi": profile.bmi,
        "disease": profile.disease,
        "addition_info": profile.addition_info or "",
    }


def _plan_payload(plan):
    """Turn a HealthPlan row into a plain dict (food / exercise / sleep), or None."""
    if plan is None:
        return None
    return {
        "food_chart": plan.food_chart,
        "exercise_plan": plan.exercise_plan,
        "sleep_plan": plan.sleep_plan,
        "generated_at": plan.generated_at,
    }


def _diet_payload(diet):
    """Turn a DietaryRecommendation row into a plain dict (meals + foods to avoid), or None."""
    if diet is None:
        return None
    return {
        "breakfast": diet.breakfast,
        "lunch": diet.lunch,
        "dinner": diet.dinner,
        "snacks": diet.snacks,
        "foods_to_avoid": diet.food_to_avoid,
        "created_at": diet.created_at,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_patient_list(request):
    """
    GET /api/health/admin/patients/

    List every patient for staff. Returns a short summary per patient
    (name, age, BMI, disease flags for whether a plan/diet exists).
    Does not include full food_chart / meal text — use admin_patient_detail for that.
    """
    patients = (
        Patient.objects.select_related("user", "healthprofile")
        .prefetch_related(
            Prefetch(
                "healthplan_set",
                queryset=HealthPlan.objects.order_by("-generated_at"),
            ),
            Prefetch(
                "dietaryrecommendation_set",
                queryset=DietaryRecommendation.objects.order_by("-created_at"),
            ),
        )
        .order_by("name")
    )

    data = []
    for patient in patients:
        try:
            profile = patient.healthprofile
        except healthProfile.DoesNotExist:
            profile = None
        plan = patient.healthplan_set.first()
        diet = patient.dietaryrecommendation_set.first()
        data.append(
            {
                "patient_id": patient.patient_id,
                "name": patient.name,
                "email": patient.email,
                "username": patient.user.username if patient.user else None,
                "age": profile.age if profile else None,
                "bmi": profile.bmi if profile else None,
                "disease": profile.disease if profile else None,
                "has_health_plan": plan is not None,
                "has_dietary_plan": diet is not None,
            }
        )
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_patient_detail(request, patient_id):
    """
    GET /api/health/admin/patients/<patient_id>/

    Return one patient's full health profile, latest health plan
    (food_chart, exercise, sleep), and latest dietary recommendation
    (breakfast / lunch / dinner / snacks / foods to avoid).
    Missing pieces are returned as null.
    """
    try:
        patient = Patient.objects.select_related("user").get(patient_id=patient_id)
    except Patient.DoesNotExist:
        return Response({"detail": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)

    profile = healthProfile.objects.filter(patient=patient).first()
    plan = HealthPlan.objects.filter(patient=patient).order_by("-generated_at").first()
    diet = (
        DietaryRecommendation.objects.filter(patient=patient)
        .order_by("-created_at")
        .first()
    )

    return Response(
        {
            "patient": {
                "patient_id": patient.patient_id,
                "name": patient.name,
                "email": patient.email,
                "username": patient.user.username if patient.user else None,
            },
            "health_profile": _profile_payload(profile),
            "health_plan": _plan_payload(plan),
            "dietary_recommendation": _diet_payload(diet),
        }
    )
