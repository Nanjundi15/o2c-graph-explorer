# Deployment Guide

Two services: **Backend on Railway** + **Frontend on Vercel**.
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

## Step 2 — Deploy Backend on Railway

1. Go to https://railway.app → New Project → Deploy from GitHub repo
2. Select your repo → set **Root Directory** to `backend`
3. Railway auto-detects `nixpacks.toml` — it will:
   - Install Python deps
   - Run `python ingest.py` (loads the DB)
   - Start `uvicorn main:app`
4. Add environment variables in Railway dashboard:
   ```
   GEMINI_API_KEY  =  your_gemini_api_key_here
   DATA_DIR        =  /app/data/sap-o2c-data
   DB_PATH         =  /app/data/o2c.db
   ```
5. **Important:** Upload the `data/sap-o2c-data/` folder to your repo
   (it needs the JSONL files to run ingest.py on first deploy)
6. Copy the Railway domain — looks like: `https://o2c-api-production.up.railway.app`

> **Test:** Visit `https://your-app.up.railway.app/api/graph/overview`
> You should see JSON with nodes and edges.

---

## Step 3 — Deploy Frontend on Vercel

1. Go to https://vercel.com → New Project → Import from GitHub
2. Select your repo → set **Root Directory** to `frontend`
3. Vercel auto-detects Vite
4. Add environment variable:
   ```
   VITE_API_URL  =  https://your-railway-domain.up.railway.app
   ```
5. Deploy → Vercel gives you a URL like `https://o2c-graph-explorer.vercel.app`

> **Test:** Open the Vercel URL — you should see the graph and be able to chat.

---

## Step 4 — Verify End-to-End

Open the app and try:
- [ ] Graph loads with 11 entity nodes
- [ ] Click a node → drawer slides in with records
- [ ] Analytics tab → top products chart loads
- [ ] Chat: "Which products have the most billing documents?" → data-backed answer
- [ ] Chat: "Write me a poem" → guardrail rejection message
- [ ] Chat: "Trace billing document 90504248" → full O2C flow

---

## Alternative: Run as a Single Service (no Vercel needed)

Build the frontend and serve it from FastAPI:

```bash
# Build frontend
cd frontend && npm run build  # outputs to frontend/dist/

# FastAPI serves dist/ automatically (see main.py)
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000
```

Then on Railway, set root to `/` (not `/backend`) and use:
```
build:  cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt && python ingest.py
start:  cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## Local Development

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
python ingest.py          # once
cp .env.example .env      # add your GEMINI_API_KEY
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev               # opens http://localhost:5173
```

API docs available at: http://localhost:8000/docs
