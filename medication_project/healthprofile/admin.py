from django import forms
from django.contrib import admin, messages
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from medication.models import Patient
from .models import healthProfile, HealthPlan, DailyProgress, DietaryRecommendation
from .utils import create_plans_for_profile

User = get_user_model()


class HealthProfileAdminForm(forms.ModelForm):
    username = forms.CharField(
        required=False,
        help_text="Create a new login for this profile. Leave blank to pick an existing user below.",
    )
    password = forms.CharField(required=False, widget=forms.PasswordInput)
    patient_name = forms.CharField(
        required=False,
        help_text="Display name for the patient. Defaults to the username.",
    )

    class Meta:
        model = healthProfile
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            for name in ("username", "password", "patient_name"):
                self.fields[name].widget = forms.HiddenInput()
        else:
            self.fields["user"].required = False
            self.fields["patient"].required = False

    def clean(self):
        cleaned = super().clean()
        if self.instance.pk:
            return cleaned

        username = (cleaned.get("username") or "").strip()
        password = cleaned.get("password") or ""
        user = cleaned.get("user")
        patient = cleaned.get("patient")

        if username:
            if User.objects.filter(username=username).exists():
                raise ValidationError({"username": "Username already exists."})
            if not password:
                raise ValidationError({"password": "Password is required when creating a user."})
        elif not user:
            raise ValidationError(
                {"username": "Enter a username and password, or select an existing user."}
            )

        if user and patient and patient.user_id and patient.user_id != user.id:
            raise ValidationError("Selected patient belongs to a different user.")

        return cleaned

    def save(self, commit=True):
        instance = super().save(commit=False)
        if not instance.pk:
            username = (self.cleaned_data.get("username") or "").strip()
            password = self.cleaned_data.get("password")
            if username:
                user = User.objects.create_user(username=username, password=password)
                name = (self.cleaned_data.get("patient_name") or "").strip() or username
                patient = Patient.objects.create(user=user, name=name)
                instance.user = user
                instance.patient = patient
            elif instance.user and not instance.patient:
                patient, _ = Patient.objects.get_or_create(
                    user=instance.user,
                    defaults={"name": instance.user.username},
                )
                instance.patient = patient
        if commit:
            instance.save()
        return instance


@admin.register(healthProfile)
class HealthProfileAdmin(admin.ModelAdmin):
    form = HealthProfileAdminForm
    list_display = ("patient", "user", "age", "weight", "disease_summary")
    list_filter = ("age", "disease")
    search_fields = ("patient__name", "user__username", "disease", "addition_info")
    fieldsets = (
        (
            "Create user",
            {
                "description": "Fill these to create a new login. Leave them blank to use an existing user.",
                "fields": ("username", "password", "patient_name"),
            },
        ),
        ("Existing records", {"fields": ("user", "patient")}),
        (
            "Profile",
            {
                "fields": (
                    "age",
                    "weight",
                    "height_feet",
                    "height_inches",
                    "bmi",
                    "disease",
                    "addition_info",
                )
            },
        ),
    )

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        formfield = super().formfield_for_dbfield(db_field, request, **kwargs)
        if db_field.name in ("user", "patient") and hasattr(formfield.widget, "can_add_related"):
            formfield.widget.can_add_related = False
            formfield.widget.can_change_related = False
        return formfield

    def disease_summary(self, obj):
        if obj.disease:
            return (obj.disease[:50] + "...") if len(obj.disease) > 50 else obj.disease
        return "-"

    disease_summary.short_description = "Disease"

    def save_model(self, request, obj, form, change):
        """Generate health plan and dietary recommendation when profile is saved.this is hooks for django admin."""
        super().save_model(request, obj, form, change)
        if (
            change
            and HealthPlan.objects.filter(patient=obj.patient).exists()
            and DietaryRecommendation.objects.filter(patient=obj.patient).exists()
        ):
            return
        try:
            create_plans_for_profile(obj)
            self.message_user(
                request,
                "Health plan and dietary recommendation were generated.",
            )
        except Exception as exc:
            self.message_user(
                request,
                f"Profile saved, but generating the plan failed: {exc}",
                level=messages.ERROR,
            )


@admin.register(HealthPlan)
class HealthPlanAdmin(admin.ModelAdmin):
    list_display = ('patient', 'generated_at', 'food_chart_preview')
    list_filter = ('generated_at',)
    search_fields = ('patient__name', 'food_chart', 'exercise_plan')
    readonly_fields = ('generated_at',)
    date_hierarchy = 'generated_at'

    def food_chart_preview(self, obj):
        """Short preview of food chart in list view"""
        if obj.food_chart:
            return (obj.food_chart[:60] + '...') if len(obj.food_chart) > 60 else obj.food_chart
        return '-'
    food_chart_preview.short_description = 'Food Chart Preview'


@admin.register(DailyProgress)
class DailyProgressAdmin(admin.ModelAdmin):
    list_display = ('patient', 'date', 'water_intake_liter', 'steps_walked', 'calories_consumed', 'mood')
    list_filter = ('date', 'mood', 'patient')
    search_fields = ('patient__name', 'mood', 'progress_note')
    date_hierarchy = 'date'

@admin.register(DietaryRecommendation)
class DietaryRecommendationAdmin(admin.ModelAdmin):
    list_display = ('patient', 'breakfast', 'lunch', 'dinner')
    search_fields = ('patient__name', 'breakfast', 'lunch', 'dinner')

    # Optional: Group recent progress by patient using inlines (if you want to see them under HealthProfile)

    # But here it's kept as a separate admin for easy daily tracking
