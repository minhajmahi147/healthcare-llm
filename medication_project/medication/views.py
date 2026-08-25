from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Patient, Prescription, Medicine
from .utils import (
    GroqApiError,
    extract_pdf_text_with_vision_fallback,
    ocr_extract_prescription,
    parse_ocr_date,
)
from PyPDF2 import PdfReader
import json


def serialize_prescription(prescription):
    medicines = list(prescription.medicine_info.all())
    return {
        "prescription_id": prescription.prescrip_id,
        "patient": {
            "patient_id": prescription.patient.patient_id,
            "name": prescription.patient.name,
            "email": prescription.patient.email,
        },
        "precautions": prescription.prescrip_analogy,
        "medicines": [
            {
                "med_id": medicine.med_id,
                "name": medicine.name,
                "dosage": medicine.dosage,
                "instruction": medicine.instruction,
                "number_of_pills_in_day": medicine.number_of_pills_in_day,
                "part_of_day": medicine.part_of_day,
                "expire_date": medicine.expire_date.isoformat() if medicine.expire_date else None,
            }
            for medicine in medicines
        ],
        "summary": {
            "total_medicines": len(medicines),
            "total_pills_per_day": sum(m.number_of_pills_in_day for m in medicines),
        },
    }


@csrf_exempt
def get_prescription(request, prescription_id):
    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=400)

    try:
        prescription = Prescription.objects.prefetch_related("medicine_info").select_related("patient").get(
            prescrip_id=prescription_id
        )
    except Prescription.DoesNotExist:
        return JsonResponse({"error": "Prescription not found"}, status=404)

    return JsonResponse(serialize_prescription(prescription))


@csrf_exempt
def process_prescription(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=400)

    uploaded_file = request.FILES.get("file")
    if not uploaded_file:
        return JsonResponse({"error": "No file provided"}, status=400)

    if uploaded_file.content_type != "application/pdf":
        return JsonResponse({"error": "Only PDF files are supported"}, status=400)

    try:
        reader = PdfReader(uploaded_file)
        extracted_text = extract_pdf_text_with_vision_fallback(reader)
        ocr_json_str = ocr_extract_prescription(extracted_text)
        ocr_data = json.loads(ocr_json_str)
    except GroqApiError as exc:
        return JsonResponse({"error": str(exc)}, status=exc.status_code or 502)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=422)
    except (json.JSONDecodeError, KeyError, TypeError) as exc:
        return JsonResponse({"error": f"Failed to parse prescription data: {exc}"}, status=422)
    except Exception as exc:
        return JsonResponse({"error": f"Prescription processing failed: {exc}"}, status=500)

    patient_data = ocr_data.get("patient", {})
    patient_name = patient_data.get("name") or "Unknown patient"
    patient_email = patient_data.get("email") or None
    if patient_email == "":
        patient_email = None

    if patient_email:
        patient, _ = Patient.objects.get_or_create(
            email=patient_email,
            defaults={"name": patient_name},
        )
    else:
        patient = Patient.objects.create(name=patient_name, email=None)

    # Save prescription
    prescription_data = ocr_data.get("prescription", {})
    prescription = Prescription.objects.create(
        patient=patient,
        prescrip_analogy=prescription_data.get("analogy") or "",
    )

    # Save medicines
    medicine_list = []
    for med in ocr_data.get("medicines", []):
        medicine = Medicine.objects.create(
            name=med.get("name") or "Unknown medicine",
            expire_date=parse_ocr_date(med.get("expire_date")),
            dosage=med.get("dosage") or "",
            instruction=med.get("instruction") or "",
            number_of_pills_in_day=int(med.get("number_of_pills_in_day") or 1),
            part_of_day=med.get("part_of_day") or "morning",
        )
        medicine_list.append(medicine)

    prescription.medicine_info.set(medicine_list)

    payload = serialize_prescription(prescription)
    payload["message"] = "Prescription processed successfully"
    return JsonResponse(payload)
