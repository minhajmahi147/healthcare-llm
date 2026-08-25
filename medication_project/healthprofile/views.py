import logging

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError
from .models import healthProfile, HealthPlan, DietaryRecommendation
from medication.models import Patient
from healthprofile.utils import generate_health_plan, generate_dietry_recommendation

logger = logging.getLogger("api_usage")

PROFILE_FIELDS = ['age', 'weight', 'height_feet', 'height_inches', 'disease', 'addition_info']


def serialize_profile(profile, created=False):
    return {
        "age": profile.age,
        "weight": profile.weight,
        "height_feet": profile.height_feet,
        "height_inches": profile.height_inches,
        "disease": profile.disease,
        "addition_info": profile.addition_info or '',
        "bmi": profile.bmi,
        "created": created,
    }


@api_view(['GET', 'POST', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def get_health_profile(request):
    patient, _ = Patient.objects.get_or_create(user=request.user, defaults={'name': request.user.username})

    if request.method == 'GET':
        profile = healthProfile.objects.filter(user=request.user).first()
        if not profile:
            return Response({
                "age": None,
                "weight": None,
                "height_feet": None,
                "height_inches": None,
                "disease": '',
                "addition_info": '',
                "bmi": None,
                "created": False,
            })
        return Response(serialize_profile(profile))

    payload = request.data if isinstance(request.data, dict) else {}
    data = {k: payload[k] for k in PROFILE_FIELDS if k in payload}

    if not data:
        return Response({"detail": "No valid fields provided"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        profile, created = healthProfile.objects.get_or_create(
            user=request.user,
            patient=patient,
            defaults=data
        )
        if not created:
            for k, v in data.items():
                setattr(profile, k, v)
            profile.save()
    except ValidationError as exc:
        details = exc.message_dict if hasattr(exc, 'message_dict') else exc.messages
        return Response({"detail": details}, status=status.HTTP_400_BAD_REQUEST)

    try:
        plan_data = generate_health_plan(profile)
        HealthPlan.objects.create(
            patient=patient,
            food_chart=plan_data['food_chart'],
            exercise_plan=plan_data['exercise_plan'],
            sleep_plan=plan_data.get('sleep_plan', '')
        )
        dietary_data = generate_dietry_recommendation(profile)
        DietaryRecommendation.objects.create(
            patient=patient,
            breakfast=dietary_data.get('breakfast', ''),
            lunch=dietary_data.get('lunch', ''),
            dinner=dietary_data.get('dinner', ''),
            snacks=dietary_data.get('snacks', ''),
            food_to_avoid=dietary_data.get('food_to_avoid') or dietary_data.get('foods_to_avoid', ''),
        )
    except Exception as e:
        logger.exception("Failed to generate health plan")
        return Response(
            {"detail": f"Profile saved, but generating your plan failed: {e}"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response(
        serialize_profile(profile, created=created),
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )

    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_health_plan(request):
    from medication.models import Patient
    patient = Patient.objects.filter(user=request.user).first()
    if not patient:
        return Response(
            {"detail": "Save your health profile first."},
            status=status.HTTP_404_NOT_FOUND,
        )

    plan = HealthPlan.objects.filter(patient=patient).order_by('-generated_at').first()
    if not plan:
        return Response(
            {"detail": "No health plan available yet. Save your health profile to generate one."},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response({
        "food_chart": plan.food_chart,
        "exercise_plan": plan.exercise_plan,
        "sleep_plan": plan.sleep_plan,
        "generated_at": plan.generated_at
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dietary_recommendation(request):
    from medication.models import Patient
    patient = Patient.objects.filter(user=request.user).first()
    if not patient:
        return Response(
            {"detail": "Save your health profile first."},
            status=status.HTTP_404_NOT_FOUND,
        )

    recommendation = DietaryRecommendation.objects.filter(patient=patient).order_by('-created_at').first()
    if not recommendation:
        return Response(
            {"detail": "No dietary recommendation available yet. Save your health profile to generate one."},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response({
        "breakfast": recommendation.breakfast,
        "lunch": recommendation.lunch,
        "dinner": recommendation.dinner,
        "snacks": recommendation.snacks,
        "foods_to_avoid": recommendation.food_to_avoid,
        "created_at": recommendation.created_at
    })