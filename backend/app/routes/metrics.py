import json
import os
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/metrics", tags=["Model Evaluation Metrics"])

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
                
        return {
            "xgboost": xgb_metrics,
            "lstm": lstm_metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
