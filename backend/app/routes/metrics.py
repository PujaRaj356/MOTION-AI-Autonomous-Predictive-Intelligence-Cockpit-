import json
import os
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/metrics", tags=["Model Evaluation Metrics"])

DEFAULT_FEATURE_IMPORTANCE = {
    "Tool Wear": 0.3671,
    "Torque": 0.2704,
    "Rotational Speed": 0.1366,
    "Air Temperature": 0.0975,
    "Process Temperature": 0.0943,
    "Machine Type": 0.0341
}

@router.get("")
def get_model_metrics():
    try:
        xgb_metrics = {}
        lstm_metrics = {}
        
        xgb_file = 'ml/saved_models/xgboost_metrics.json'
        lstm_file = 'ml/saved_models/lstm_metrics.json'
        
        if os.path.exists(xgb_file):
            with open(xgb_file, 'r') as f:
                xgb_metrics = json.load(f)
                
        if os.path.exists(lstm_file):
            with open(lstm_file, 'r') as f:
                lstm_metrics = json.load(f)
                
        # Ensure feature_importance is always populated
        if not xgb_metrics.get("feature_importance"):
            xgb_metrics["feature_importance"] = DEFAULT_FEATURE_IMPORTANCE
            
        # Ensure confusion_matrix dictionary representation is available
        cm = xgb_metrics.get("confusion_matrix")
        if isinstance(cm, list) and len(cm) == 2 and len(cm[0]) == 2:
            xgb_metrics["confusion_matrix"] = {
                "tn": cm[0][0],
                "fp": cm[0][1],
                "fn": cm[1][0],
                "tp": cm[1][1]
            }
            xgb_metrics["confusion_matrix_raw"] = cm
            
        return {
            "xgboost": xgb_metrics,
            "lstm": lstm_metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
