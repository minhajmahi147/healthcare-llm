import base64
import re
import requests
from datetime import datetime
from dotenv import load_dotenv
import os
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent.parent / ".env")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
TEXT_MODEL = os.getenv("GROQ_TEXT_MODEL", "openai/gpt-oss-20b")
VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "qwen/qwen3.6-27b")
MIN_PDF_TEXT_LENGTH = 50

PRESCRIPTION_JSON_FORMAT = """
{
  "patient": {
    "name": "string",
    "email": "string"
  },
  "prescription": {
    "analogy": "string"
  },
  "medicines": [
    {
      "name": "string",
      "expire_date": "YYYY-MM-DD or null if not found",
      "dosage": "string",
      "instruction": "string",
      "number_of_pills_in_day": int,
      "part_of_day": "morning/evening/night"
    }
  ]
}
"""


def parse_ocr_date(value):
    """Convert OCR date strings to date objects; empty or invalid values become None."""
    if value is None:
        return None
    if isinstance(value, str):
        value = value.strip()
        if not value:
            return None
        try:
            return datetime.strptime(value, "%Y-%m-%d").date()
        except ValueError:
            return None
    return value


class GroqApiError(Exception):
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


_THINK_OPEN = "<" + "think" + ">"
_THINK_CLOSE = "<" + "/" + "think" + ">"


def strip_model_thinking(raw: str) -> str:
    think_pattern = (
        re.escape(_THINK_OPEN) + r".*?(?:" + re.escape(_THINK_CLOSE) + r"|$)"
    )
    raw = re.sub(think_pattern, "", raw, flags=re.DOTALL | re.IGNORECASE)
    raw = re.sub(
        r"<think>.*?(?:</think>|$)",
        "",
        raw,
        flags=re.DOTALL | re.IGNORECASE,
    )
    return raw.strip()


def clean_json_response(raw: str) -> str:
    raw = strip_model_thinking(raw)
    if raw.startswith("```"):
        raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        raw = raw[start : end + 1]
    return raw


def _groq_chat(messages, model, *, timeout=60, max_completion_tokens=4096, temperature=None):
    if not GROQ_API_KEY:
        raise GroqApiError(
            "GROQ_API_KEY is not configured. Add it to medication_project/.env",
            status_code=503,
        )

    payload = {"model": model, "messages": messages, "max_completion_tokens": max_completion_tokens}
    if temperature is not None:
        payload["temperature"] = temperature

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(GROQ_URL, json=payload, headers=headers, timeout=timeout)
        response.raise_for_status()
    except requests.HTTPError as exc:
        status = exc.response.status_code if exc.response is not None else 502
        detail = ""
        if exc.response is not None:
            try:
                detail = exc.response.text[:300]
            except Exception:
                detail = ""
        raise GroqApiError(
            f"Groq API rejected the request ({status}). {detail}".strip(),
            status_code=status,
        ) from exc
    except requests.RequestException as exc:
        raise GroqApiError("Unable to reach Groq API.", status_code=502) from exc

    data = response.json()
    if "choices" not in data or not data["choices"]:
        raise ValueError(f"OCR API Error: {data}")

    content = (data["choices"][0].get("message") or {}).get("content") or ""
    if not str(content).strip():
        raise GroqApiError("Groq returned empty content. Try again or use a different GROQ_TEXT_MODEL.", status_code=502)
    return content


def extract_pdf_text(reader) -> str:
    text = ""
    for page in reader.pages:
        text += (page.extract_text() or "") + "\n"
    return text.strip()


def extract_embedded_pdf_images(reader) -> list[tuple[str, str]]:
    """Return embedded page images as (mime_type, base64_data) pairs."""
    images = []
    for page in reader.pages:
        resources = page.get("/Resources")
        if not resources:
            continue
        xobjects = resources.get("/XObject")
        if not xobjects:
            continue
        xobjects = xobjects.get_object()
        for name in xobjects:
            obj = xobjects[name].get_object()
            if obj.get("/Subtype") != "/Image":
                continue
            data = obj.get_data()
            if data.startswith(b"\xff\xd8"):
                mime = "jpeg"
            elif data.startswith(b"\x89PNG\r\n\x1a\n"):
                mime = "png"
            else:
                continue
            images.append((mime, base64.b64encode(data).decode("ascii")))
    return images


def ocr_transcribe_prescription_image(base64_image: str, mime: str = "jpeg") -> str:
    """Use a vision model to read text from a scanned prescription image."""
    raw = _groq_chat(
        [
            {
                "role": "system",
                "content": "You are an OCR engine. Transcribe all visible text verbatim. No commentary.",
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Transcribe every word, number, and medicine detail from this prescription image.",
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/{mime};base64,{base64_image}"},
                    },
                ],
            },
        ],
        VISION_MODEL,
        timeout=120,
        max_completion_tokens=4096,
        temperature=0,
    )
    return strip_model_thinking(raw)


def extract_pdf_text_with_vision_fallback(reader) -> str:
    """Extract PDF text, falling back to vision OCR for scanned/image-only PDFs."""
    text = extract_pdf_text(reader)
    if len(text) >= MIN_PDF_TEXT_LENGTH:
        return text

    images = extract_embedded_pdf_images(reader)
    if not images:
        raise ValueError(
            "This PDF has no readable text. Upload a text-based PDF or a clear scanned prescription."
        )

    transcriptions = []
    for mime, image_b64 in images:
        transcribed = ocr_transcribe_prescription_image(image_b64, mime)
        if transcribed:
            transcriptions.append(transcribed)

    combined = "\n\n".join(transcriptions).strip()
    if not combined:
        raise ValueError("Could not read any text from the scanned prescription image.")
    return combined


def ocr_extract_prescription(text_content: str) -> str:
    """Convert prescription text into structured JSON using a text model."""
    user_content = f"""
Extract structured prescription data from the following text.

Return ONLY valid JSON. No explanation.

TEXT:
\"\"\"{text_content}\"\"\"

JSON FORMAT:
{PRESCRIPTION_JSON_FORMAT}
"""
    raw = _groq_chat(
        [
            {"role": "system", "content": "You extract prescriptions into clean JSON."},
            {"role": "user", "content": user_content},
        ],
        TEXT_MODEL,
    )
    return clean_json_response(raw)
