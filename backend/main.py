from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from contextlib import asynccontextmanager

from models import (
    LinuxComponent,
    EvaluationRequest,
    EvaluationResult,
    LeaderboardEntry
)
from data import LINUX_COMPONENTS
from evaluator import evaluate_linux_architecture
from database import init_db, save_run, get_leaderboard, get_run_details

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="TuxFall: Linux Architecture Descent API",
    description="Backend API powering the Linux penguin skyfall game and architectural evaluation engine",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Vercel frontend, local development, and external clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "TuxFall Linux SysArch Engine",
        "version": "1.0.0",
        "kernel_ready": True
    }

@app.get("/api/items", response_model=List[LinuxComponent])
def get_linux_items():
    """Returns the comprehensive catalogue of Linux components and system hazards."""
    return LINUX_COMPONENTS

@app.post("/api/evaluate", response_model=EvaluationResult)
def evaluate_run(request: EvaluationRequest):
    """
    Evaluates player's captured items during the descent.
    Scores accuracy, checks for architectural validity across the 5 Linux layers,
    detects synergies, computes penalties for hazards/conflicts, and persists the run.
    """
    try:
        result = evaluate_linux_architecture(request)
        save_run(result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Architecture evaluation failed: {str(e)}")

@app.get("/api/leaderboard", response_model=List[LeaderboardEntry])
def get_scores_leaderboard(limit: int = 20):
    """Returns high scores and top Linux architectures."""
    return get_leaderboard(limit=limit)

@app.get("/api/runs/{run_id}")
def get_saved_run(run_id: str):
    """Returns full architectural blueprint and evaluation for a specific run ID."""
    run = get_run_details(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
