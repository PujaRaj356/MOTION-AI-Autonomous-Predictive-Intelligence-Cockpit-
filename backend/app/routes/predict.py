from fastapi import APIRouter, HTTPException
from backend.app.schemas.models import (
    FailurePredictionRequest, FailurePredictionResponse,
    RULPredictionRequest, RULPredictionResponse,
    SimulationRequest, SimulationResponse
)
from backend.app.services.prediction_service import prediction_service

router = APIRouter(prefix="", tags=["Predictions"])

@router.post("/predict/failure", response_model=FailurePredictionResponse)
def predict_failure(request: FailurePredictionRequest):
    try:
        return prediction_service.predict_failure(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.post("/predict/rul", response_model=RULPredictionResponse)
def predict_rul(request: RULPredictionRequest):
    try:
        return prediction_service.predict_rul_sequence(request.machine_id, request.sequence)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RUL Prediction error: {str(e)}")

@router.post("/explain")
def explain_prediction(request: FailurePredictionRequest):
    try:
        res = prediction_service.predict_failure(request)
        return {
            "shap_explanation": res["shap_explanation"],
            "summary": res["ai_summary"],
            "top_risk_factors": [item["feature"] for item in res["shap_explanation"] if item["direction"] == "increases"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explainability error: {str(e)}")

@router.post("/simulate", response_model=SimulationResponse)
def run_simulation(request: SimulationRequest):
    try:
        return prediction_service.run_simulation(request.current_values, request.simulated_values)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")
