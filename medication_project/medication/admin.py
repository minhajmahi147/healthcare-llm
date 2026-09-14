from django.contrib import admin
from .models import Patient, Doctor, Medicine, Prescription, MedicineScheduler, Reminder
from .models import MedicineScheduler, time_slot
from .models import SchedulerTime


class SchedulerTimeInline(admin.TabularInline):
    model = SchedulerTime
    extra = 1  # number of empty forms shown by default

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('patient_id', 'name', 'email')
    search_fields = ('name', 'email')


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('doctor_id', 'name', 'department')
    search_fields = ('name', 'department')
    filter_horizontal = ('assigned_patients',)


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ('med_id', 'name', 'expire_date','number_of_pills_in_day')
    list_filter = ('expire_date',)
    
    search_fields = ('name',)

# Inline for adding medicines to a prescription to look good in admin
class MedicineInline(admin.TabularInline):
    model = Prescription.medicine_info.through  # uses the intermediate table
    extra = 1
@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ('prescrip_id', 'patient', 'prescrip_analogy')
    inlines = [MedicineInline]
    exclude = ('medicine_info',)  # hide the original ManyToMany


@admin.register(MedicineScheduler)
class MedicineSchedulerAdmin(admin.ModelAdmin):
    list_display = ('med_sch_id', 'med_id', 'start_date', 'end_date', 'times_per_day','get_time_slots')
    search_fields = ('patient_id__name', 'med_id__name')
    inlines = [SchedulerTimeInline]
    # filter_horizontal = ('time_slots',)
    def get_time_slots(self, obj):
        return ", ".join(slot.label for slot in obj.time_slots.all())


    get_time_slots.short_description = 'Time Slots'



@admin.register(Reminder)
class ReminderAdmin(admin.ModelAdmin):
    list_display = ('reminder_id', 'status', 'reminder_time', 'is_taken', 'patient_id', 'med_id')
    list_filter = ('is_taken', 'status')
    search_fields = ('patient_id__name', 'med_id__name')

@admin.register(time_slot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ('key', 'label')

