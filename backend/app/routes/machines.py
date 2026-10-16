import os
import random
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from backend.app.database.connection import db_manager

router = APIRouter(prefix="/machines", tags=["Machines"])

def apply_live_telemetry_drift(machines):
    """
    Simulates real-time industrial sensor harmonics and live telemetry stream.
    Applies continuous physical oscillations to RPM, Torque, Temperatures, and Tool Wear.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    for m in machines:
        m["last_updated"] = now_iso
        # Micro-fluctuations around current operating point
        rpm_jitter = random.uniform(-7.5, 7.5)
        torque_jitter = random.uniform(-0.5, 0.5)
        temp_jitter = random.uniform(-0.12, 0.12)
        
        m["rpm"] = round(max(800.0, float(m.get("rpm", 1500)) + rpm_jitter), 1)
        m["torque"] = round(max(10.0, min(95.0, float(m.get("torque", 45)) + torque_jitter)), 1)
        m["air_temperature"] = round(max(18.0, float(m.get("air_temperature", 25)) + temp_jitter), 2)
        m["process_temperature"] = round(max(25.0, float(m.get("process_temperature", 38)) + temp_jitter), 2)
        
        # Tool wear creeps forward on active machines
        if m.get("status") != "CRITICAL":
            m["tool_wear"] = round(float(m.get("tool_wear", 50)) + random.uniform(0.02, 0.08), 1)
            
    return machines

@router.get("")
def get_all_machines():
    try:
        machines = db_manager.get_collection_data("machines")
        # Apply live streaming physical drift so each poll reflects real-time continuous operation
        live_machines = apply_live_telemetry_drift(machines)
        return live_machines
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{machine_id}")
def get_machine_details(machine_id: str):
    try:
        machines = db_manager.get_collection_data("machines")
        machine = next((m for m in machines if m["machine_id"] == machine_id), None)
        
        if not machine:
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
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
        else:
            machine["last_updated"] = datetime.now(timezone.utc).isoformat()
            
        # Get historical telemetry points
        predictions = db_manager.get_collection_data("predictions")
        m_preds = [p for p in predictions if p.get("machine_id") == machine_id]
        
        # Telemetry sample points
        telemetry = [
            {"time": "08:00", "temperature": round(machine["air_temperature"] - 2.0, 1), "rpm": round(machine["rpm"] - 50, 1), "torque": round(machine["torque"] - 3.0, 1), "tool_wear": max(0, round(machine["tool_wear"] - 20, 1)), "failure_prob": max(0, round(machine["failure_probability"] - 0.05, 3))},
            {"time": "09:00", "temperature": round(machine["air_temperature"] - 1.0, 1), "rpm": round(machine["rpm"] - 20, 1), "torque": round(machine["torque"] - 1.0, 1), "tool_wear": max(0, round(machine["tool_wear"] - 10, 1)), "failure_prob": max(0, round(machine["failure_probability"] - 0.02, 3))},
            {"time": "10:00", "temperature": round(machine["air_temperature"], 1), "rpm": round(machine["rpm"], 1), "torque": round(machine["torque"], 1), "tool_wear": round(machine["tool_wear"], 1), "failure_prob": round(machine["failure_probability"], 3)}
        ]
        
        return {
            "machine": machine,
            "predictions_history": m_preds,
            "telemetry": telemetry
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
