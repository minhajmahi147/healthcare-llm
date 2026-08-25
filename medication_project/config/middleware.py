import time
import logging

logger = logging.getLogger("api_usage")


class CorsMiddleware:
    """Allow the React dev server to call the Django API directly."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "OPTIONS":
            from django.http import HttpResponse

            response = HttpResponse()
        else:
            response = self.get_response(request)

        response["Access-Control-Allow-Origin"] = "http://localhost:5173"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response


class APILoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.monotonic()
        response = self.get_response(request)
        elapsed_ms = round((time.monotonic() - start) * 1000, 1)

        user = "anonymous"
        if hasattr(request, "user") and request.user.is_authenticated:
            user = request.user.username

        logger.info(
            "API usage: %s %s status=%s user=%s duration=%sms",
            request.method,
            request.get_full_path(),
            response.status_code,
            user,
            elapsed_ms,
        )

        return response