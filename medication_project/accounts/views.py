from django.contrib.auth import authenticate, get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from medication.models import Patient

User = get_user_model()


@api_view(["POST"])
def register(request):
    """Register a normal patient user (not staff)."""
    username = request.data.get("username")
    password = request.data.get("password")
    name = request.data.get("name")

    if not username or not password:
        return Response({"error": "username and password are required"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=400)

    user = User.objects.create_user(username=username, password=password)
    Patient.objects.create(user=user, name=name or username)

    return Response({"message": "User registered successfully"})


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def register_admin(request):
    """
    Register a new admin (staff) user.
    Only an existing staff user can call this.
    Does not create a Patient row.
    """
    username = request.data.get("username")
    password = request.data.get("password")
    email = request.data.get("email") or ""

    if not username or not password:
        return Response({"error": "username and password are required"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=400)

    user = User.objects.create_user(
        username=username,
        password=password,
        email=email,
    )
    user.is_staff = True
    user.save(update_fields=["is_staff"])

    return Response(
        {
            "message": "Admin registered successfully",
            "username": user.username,
            "is_staff": user.is_staff,
        },
        status=201,
    )


@api_view(["POST"])
def login(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user is None:
        return Response({"error": "Invalid credentials"}, status=400)

    refresh = RefreshToken.for_user(user)

    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "is_staff": user.is_staff,
            "username": user.username,
        }
    )
