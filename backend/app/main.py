import sys
import os

# Constrain ML thread pools to 1 thread to avoid memory spikes on resource-constrained containers (e.g. Render 512MB)
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

# Add root project path so backend can import ml package seamlessly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.routes import predict, machines, history, metrics, visual
from backend.app.database.connection import db_manager

app = FastAPI(
    title="GearGuard AI Predictive Maintenance Intelligence API",
    description="Backend API powered by XGBoost, Keras LSTM, and SHAP for industrial machine failure prediction and Remaining Useful Life (RUL) estimation.",
    version="1.0.0"
)

# CORS setup for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers with and without /api prefix
app.include_router(predict.router)
app.include_router(predict.router, prefix="/api")
app.include_router(machines.router)
app.include_router(machines.router, prefix="/api")
app.include_router(history.router)
app.include_router(history.router, prefix="/api")
app.include_router(metrics.router)
app.include_router(metrics.router, prefix="/api")
app.include_router(visual.router)
app.include_router(visual.router, prefix="/api")

@app.get("/health", tags=["System Health"])
@app.get("/api/health", tags=["System Health"])
def system_health():
    try:
        import psutil
        rss_mb = round(psutil.Process().memory_info().rss / (1024 * 1024), 1)
    except Exception:
        rss_mb = None

    return {
        "status": "ONLINE",
        "service": "GearGuard Predictive Intelligence API",
        "ai_engine": "ONLINE",
        "memory_rss_mb": rss_mb,
        "mongodb_connected": db_manager.is_connected,
        "database_mode": "MongoDB Native" if db_manager.is_connected else "FileStore Fallback (Local JSON)",
        "models_loaded": ["XGBoost Classifier", "Keras LSTM RUL (Lazy)", "SHAP TreeExplainer (Lazy)", "Visual Inspection (CNC MobileNet Lazy)"]
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=False)
