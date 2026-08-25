import json

from medication.utils import TEXT_MODEL, _groq_chat, clean_json_response


def _profile_summary(health_profile) -> str:
    return (
        f"- Age: {health_profile.age}\n"
        f"- Weight: {health_profile.weight} kg\n"
        f"- Height: {health_profile.height_feet} feet {health_profile.height_inches} inches\n"
        f"- BMI: {health_profile.bmi}\n"
        f"- Disease: {health_profile.disease}\n"
        f"- Additional Info: {health_profile.addition_info or 'None'}"
    )


def _parse_json_content(raw: str) -> dict:
    return json.loads(clean_json_response(raw))


def generate_health_plan(health_profile):
    """Generate a health plan using Groq based on healthProfile data."""
    user_content = f"""
    Generate a personalized health plan based on the following profile data.

    Profile:
    {_profile_summary(health_profile)}

    Return ONLY valid JSON. No explanation.

    JSON FORMAT:
    {{
        "food_chart": "string (detailed daily meal plan)",
        "exercise_plan": "string (recommended exercises and routine)",
        "sleep_plan": "string (sleep recommendations)"
    }}
    """
    raw = _groq_chat(
        [
            {"role": "system", "content": "You generate personalized health plans into clean JSON."},
            {"role": "user", "content": user_content},
        ],
        TEXT_MODEL,
        timeout=60,
        temperature=0.2,
    )
    return _parse_json_content(raw)


def generate_dietry_recommendation(health_profile):
    """Generate dietary recommendations using Groq based on healthProfile data."""
    user_content = f"""
    Generate dietary recommendations for breakfast, lunch, and dinner based on the following health profile:

    {_profile_summary(health_profile)}

    Return ONLY valid JSON in the following format:
    {{
        "breakfast": "string (recommended breakfast foods)",
        "lunch": "string (recommended lunch foods)",
        "dinner": "string (recommended dinner foods)",
        "snacks": "string (recommended snacks, optional)",
        "food_to_avoid": "string (foods to avoid, optional)"
    }}
    """
    raw = _groq_chat(
        [
            {"role": "system", "content": "You generate personalized dietary recommendations into clean JSON."},
            {"role": "user", "content": user_content},
        ],
        TEXT_MODEL,
        timeout=60,
        temperature=0.2,
    )
    return _parse_json_content(raw)
