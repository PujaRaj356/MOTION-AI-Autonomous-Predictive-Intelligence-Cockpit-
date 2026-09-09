from fastapi import APIRouter, HTTPException
from backend.app.database.connection import db_manager

router = APIRouter(prefix="/machines", tags=["Machines"])

@router.get("")
def get_all_machines():
    try:
        machines = db_manager.get_collection_data("machines")
        return machines
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{machine_id}")
def get_machine_details(machine_id: str):
    try:
        machines = db_manager.get_collection_data("machines")
        machine = next((m for m in machines if m["machine_id"] == machine_id), None)
        
        if not machine:
            # Create a default dossier if machine is requested dynamically
            machine = {
                "machine_id": machine_id,
                "name": f"Machine {machine_id}",
                "machine_type": "CNC Lathe (H)",
                "status": "HEALTHY",
                "health_score": 85,
                "failure_probability": 0.12,
                "rul": 140,
                "air_temperature": 25.0,
                "process_temperature": 35.0,
                "rpm": 1500,
                "torque": 40.0,
                "tool_wear": 75,
                "last_updated": "2026-09-09 10:00:00"
            }
            
        # Get historical telemetry points
        predictions = db_manager.get_collection_data("predictions")
        m_preds = [p for p in predictions if p.get("machine_id") == machine_id]
        
        # Telemetry sample points
        telemetry = [
            {"time": "08:00", "temperature": machine["air_temperature"] - 2.0, "rpm": machine["rpm"] - 50, "torque": machine["torque"] - 3.0, "tool_wear": max(0, machine["tool_wear"] - 20), "failure_prob": max(0, machine["failure_probability"] - 0.05)},
            {"time": "09:00", "temperature": machine["air_temperature"] - 1.0, "rpm": machine["rpm"] - 20, "torque": machine["torque"] - 1.0, "tool_wear": max(0, machine["tool_wear"] - 10), "failure_prob": max(0, machine["failure_probability"] - 0.02)},
            {"time": "10:00", "temperature": machine["air_temperature"], "rpm": machine["rpm"], "torque": machine["torque"], "tool_wear": machine["tool_wear"], "failure_prob": machine["failure_probability"]}
        ]
        
        return {
            "machine": machine,
            "predictions_history": m_preds,
            "telemetry": telemetry
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
