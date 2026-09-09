import sys
import os

# Add root project path so backend can import ml package seamlessly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.routes import predict, machines, history, metrics
from backend.app.database.connection import db_manager

app = FastAPI(
    title="AI Predictive Maintenance Intelligence API",
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

@app.get("/health", tags=["System Health"])
@app.get("/api/health", tags=["System Health"])
def system_health():
    return {
        "status": "ONLINE",
        "ai_engine": "ONLINE",
        "mongodb_connected": db_manager.is_connected,
        "database_mode": "MongoDB Native" if db_manager.is_connected else "FileStore Fallback (Local JSON)",
        "models_loaded": ["XGBoost Classifier", "Keras LSTM RUL", "SHAP TreeExplainer"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
