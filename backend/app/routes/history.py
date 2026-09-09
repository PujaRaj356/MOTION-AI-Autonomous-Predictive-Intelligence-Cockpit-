from fastapi import APIRouter, HTTPException
from backend.app.database.connection import db_manager

router = APIRouter(prefix="", tags=["History & Maintenance"])

@router.get("/predictions")
def get_prediction_history():
    try:
        preds = db_manager.get_collection_data("predictions")
        return preds[::-1] # Reverse for recent first
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scenarios")
def get_saved_scenarios():
    try:
        scenarios = db_manager.get_collection_data("scenarios")
        return scenarios[::-1]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/maintenance")
def get_maintenance_records():
    try:
        records = db_manager.get_collection_data("maintenance_records")
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
