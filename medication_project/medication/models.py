# medication/models.py
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
User = get_user_model()




class time_slot(models.Model):
    key = models.CharField(max_length=20, unique=True)
    label = models.CharField(max_length=20)

    def __str__(self):
        return self.label


class Patient(models.Model):
    patient_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, null=True, blank=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, default=None, null=True,  related_name="patient_profile")

    def __str__(self):
        return self.name


class Medicine(models.Model):
    med_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    expire_date = models.DateField(null=True, blank=True)
    dosage = models.TextField()
    instruction = models.TextField()
    number_of_pills_in_day = models.IntegerField(default=1)
    part_of_day = models.CharField(max_length=255, default="morning")

    def __str__(self):
        return self.name


class Prescription(models.Model):
    prescrip_id = models.BigAutoField(primary_key=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="prescriptions")
    medicine_info = models.ManyToManyField(
        Medicine,
        related_name="prescriptions",
        blank=True  # allows Prescription without any medicines initially
    )
    prescrip_analogy = models.TextField()

    def __str__(self):
        return f"Prescription {self.prescrip_id} for {self.patient.name}"


class MedicineScheduler(models.Model):
    med_sch_id = models.BigAutoField(primary_key=True)
    med_id = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name="schedules")
    patient_id = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="schedules")
    start_date = models.DateField()
    end_date = models.DateField()
    times_per_day = models.IntegerField()
    #repeated_days = models.TextField()

    # time_slots_choices = [
    #     ('morning', 'Morning'),
    #     ('afternoon', 'Afternoon'),
    #     ('evening', 'Evening'),
    #     ('night', 'Night'),
    # ] 
    time_slots = models.ManyToManyField(time_slot, through="SchedulerTime",related_name="schedules")
  
    def __str__(self):
        return f"Schedule {self.med_sch_id} for Medicine {self.med_id.name}"


class Reminder(models.Model):
    reminder_id = models.BigAutoField(primary_key=True)
    status = models.CharField(max_length=255)
    sch_id = models.BigIntegerField()
    reminder_time = models.DateField(default=timezone.now)
    med_id = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name="reminders")
    patient_id = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="reminders")
    is_taken = models.BooleanField(default=False)

    def __str__(self):
        return f"Reminder {self.reminder_id} for Patient {self.patient_id.name}"


#this is  a through model to link MedicineScheduler and time_slot with additional field reminder_time
class SchedulerTime(models.Model):
    scheduler =models.ForeignKey(MedicineScheduler, on_delete=models.CASCADE)
    slot =models.ForeignKey(time_slot, on_delete=models.CASCADE)
    reminder_time =models.TimeField()