"""
main.py
-------
FastAPI application entry point.
Run locally:  uvicorn main:app --reload
Run prod:     uvicorn main:app --host 0.0.0.0 --port $PORT
"""

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from routes.graph import router as graph_router
from routes.chat  import router as chat_router

app = FastAPI(
    title="SAP O2C Graph API",
    description="Graph-based data modeling and LLM query interface for SAP Order-to-Cash data.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Tighten to your Vercel URL in production if desired
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph_router, prefix="/api/graph", tags=["Graph"])
app.include_router(chat_router,  prefix="/api/chat",  tags=["Chat"])


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "SAP O2C Graph API"}


# Serve built React frontend when running as a single service (optional)
_static = Path(__file__).parent.parent / "frontend" / "dist"
if _static.exists():
    app.mount("/", StaticFiles(directory=str(_static), html=True), name="static")
else:
    @app.get("/")
    def root():
        return {"status": "ok", "docs": "/docs"}
@app.get("/ping")
def ping():
    return {"pong": True}