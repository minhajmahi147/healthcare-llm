from django.contrib import admin

from .models import Cabin, CabinApplication, Invoice


@admin.register(Cabin)
class CabinAdmin(admin.ModelAdmin):
    list_display = ("cabin_id", "number", "cabin_type", "nightly_rate", "is_active")
    search_fields = ("number", "cabin_type")


@admin.register(CabinApplication)
class CabinApplicationAdmin(admin.ModelAdmin):
    list_display = (
        "application_id",
        "patient",
        "cabin",
        "start_date",
        "end_date",
        "status",
    )
    list_filter = ("status",)


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("invoice_number", "application", "nights", "total", "issued_at")
    search_fields = ("invoice_number",)
