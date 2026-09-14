from rest_framework.permissions import BasePermission


class IsDoctor(BasePermission):
    """Allow only authenticated users that have a Doctor profile."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "doctor_profile")
        )
