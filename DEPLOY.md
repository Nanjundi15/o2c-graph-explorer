# 🚀 Deployment Guide

Two services: **Backend on Render** + **Frontend on Vercel**
Total setup time: ~15 minutes.

---

## Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "feat: initial SAP O2C graph explorer"
git remote add origin https://github.com/YOUR_USERNAME/o2c-graph-explorer.git
git push -u origin main
```

---

## Step 2 — Deploy Backend on Render

1. Go to https://render.com → New → Web Service
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`

Render will:

* Install Python dependencies
* Run `python ingest.py` (creates & loads DB)
* Start FastAPI using uvicorn

---

### Build & Start Commands

```
Build Command:
pip install -r requirements.txt && python ingest.py

Start Command:
uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

### Environment Variables

```
GROQ_API_KEY   = your_groq_api_key_here
DATABASE_PATH  = /opt/render/project/src/o2c.db
```

---

### Important

* Ensure `o2c.db` exists OR is created by `ingest.py`
* Keep your dataset files in repo if ingest depends on them

---

### Test Backend

```
https://your-render-app.onrender.com/api/graph/overview
```

You should see JSON output.

---

## Step 3 — Deploy Frontend on Vercel

1. Go to https://vercel.com → New Project → Import from GitHub
2. Select your repo
3. Set **Root Directory** to `frontend`
4. Vercel auto-detects Vite

---

### Environment Variable

```
VITE_API_URL = https://your-render-app.onrender.com
```

⚠️ Do NOT add `/api` (handled in code)

---

### Deploy

Vercel will give a URL like:

```
https://your-app.vercel.app
```

---

## Step 4 — Verify End-to-End

Open your app and test:

* [ ] Graph loads with entity nodes
* [ ] Click a node → records appear
* [ ] Analytics tab loads correctly
* [ ] Chat works with real data
* [ ] No blank screen or API errors

---

### Chat Test Examples

```
Which products have the most billing documents?
```

```
Trace billing document 90504248
```

---

## Debug Tips

* If chat shows “no results” → check DATABASE_PATH
* If frontend blank → check VITE_API_URL
* If API fails → check Render logs

---

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
python ingest.py
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:8000/docs

---

## Architecture

```
User → Vercel (Frontend) → Render (Backend) → DB + Groq API
```
