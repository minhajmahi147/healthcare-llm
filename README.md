# Healthcare LLM (Med Life AI)

A full-stack healthcare assistant that combines a **Django REST API** with a **React (Vite)** frontend. Users can register, manage a health profile, generate AI health plans and dietary recommendations (via Groq), and upload prescription PDFs for structured medicine extraction.

---

## What this project does

| Area | Description |
|------|-------------|
| **Auth** | Register / login with JWT (access + refresh). Session restored from `localStorage`. |
| **Health profile** | Save age, weight, height, conditions; BMI is computed on the backend. |
| **Health plan** | After a profile save, Groq generates food, exercise, and sleep guidance. |
| **Dietary** | Meal-level recommendations (breakfast, lunch, dinner, snacks, foods to avoid). |
| **Prescriptions** | Upload a PDF; vision/text models extract patient info and medicine details. |

### Stack

- **Backend:** Django, Django REST Framework, SimpleJWT, SQLite (default), Groq API
- **Frontend:** React 19, TypeScript, Vite, React Router
- **AI:** Groq chat/completions for plans, diet, and prescription OCR

### Repo layout

```
frontend/                 # Vite + React SPA (port 5173)
medication_project/       # Django API (port 8000)
  accounts/               # Auth endpoints
  healthprofile/          # Profile, plan, dietary
  medication/             # Prescription upload & OCR
```

In development, Vite proxies `/api` → `http://127.0.0.1:8000`, so the browser only talks to the frontend origin.

---

## Prerequisites

- **Python 3.10+** (3.12/3.14 work with the project venv)
- **Node.js 18+** and npm
- A **Groq API key** from [https://console.groq.com](https://console.groq.com)

---

## Installation

### 1. Clone the repo

```bash
git clone https://github.com/minhajmahi147/healthcare-llm.git
cd healthcare-llm
git checkout develop
```

### 2. Backend setup

```bash
cd medication_project

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
# If some packages are missing from requirements.txt, also install:
# pip install django djangorestframework djangorestframework-simplejwt python-dotenv pypdf

# Environment
cp .env.example .env
# Edit .env and set a real GROQ_API_KEY
```

Example `.env`:

```env
GROQ_API_KEY=your_real_groq_key
GROQ_TEXT_MODEL=openai/gpt-oss-20b
```

```bash
# Database
python manage.py migrate

# Optional admin user
python manage.py createsuperuser

# Run API
python manage.py runserver
```

Backend: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)  
Admin: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

### 3. Frontend setup

Open a **second** terminal:

```bash
cd frontend

npm install

# Optional: copy env (defaults to /api which Vite proxies)
cp .env.example .env

npm run dev
```

Frontend: [http://localhost:5173/](http://localhost:5173/)

---

## Quick start (after install)

1. Start Django on **8000**.
2. Start Vite on **5173**.
3. Open the frontend URL (not Django) in the browser.
4. Register a user → fill **Health Profile** → open **Health Plan** / **Dietary**.
5. Upload a prescription PDF under **Prescription**.

---

## Main API routes

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/auth/register/` | Create account |
| `POST` | `/api/auth/login/` | JWT login |
| `POST` | `/api/auth/refresh/` | Refresh access token |
| `GET/POST` | `/api/health/profile/` | Read / save profile (+ trigger AI generation) |
| `GET` | `/api/health/plan/` | Latest health plan |
| `GET` | `/api/health/dietary-recommendation/` | Latest diet tips |
| `POST` | `/api/upload-prescription/` | Upload prescription PDF |
| `GET` | `/api/prescription/<id>/` | Get parsed prescription |

Authenticated health/prescription calls use:

```http
Authorization: Bearer <access_token>
```

---

## Notes

- Default DB is **SQLite** (`medication_project/db.sqlite3`). Postgres via Docker is optional and commented in settings.
- Without a valid `GROQ_API_KEY` (and a current model id), profile save may succeed for the profile but plan/diet generation will fail.
- Do not commit `.env`, `.venv/`, `node_modules/`, or `db.sqlite3` — they are covered by `.gitignore`.

---

## License

Private / project use unless otherwise specified by the repository owner.
