from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class FailurePredictionRequest(BaseModel):
    machine_id: str = Field(default="M-102", description="Machine identifier")
    air_temperature: float = Field(..., description="Air Temperature in Celsius (°C)")
    process_temperature: float = Field(..., description="Process Temperature in Celsius (°C)")
    rpm: float = Field(..., description="Rotational Speed in RPM")
    torque: float = Field(..., description="Torque in Nm")
    tool_wear: float = Field(..., description="Tool Wear in minutes")
    machine_type: Optional[str] = Field(default="L", description="Type: L, M, H")

class ShapContribution(BaseModel):
    feature: str
    value: float
    shap_value: float
    impact: str
    direction: str

class FailurePredictionResponse(BaseModel):
    machine_id: str
    failure_probability: float
    failure_percentage: float
    risk_level: str
    health_score: int
    rul_estimate: int
    recommendation: str
    shap_explanation: List[ShapContribution]
    ai_summary: str
    timestamp: str

class SequenceReading(BaseModel):
    s2: float = 642.0
    s3: float = 1585.0
    s4: float = 1400.0
    s7: float = 553.0
    s8: float = 2388.0
    s11: float = 47.5
    s12: float = 521.5
    s15: float = 8.4

class RULPredictionRequest(BaseModel):
    machine_id: str = "M-102"
    sequence: Optional[List[SequenceReading]] = None
    custom_cycles_ran: Optional[int] = None

class RULPredictionResponse(BaseModel):
    machine_id: str
    estimated_rul: int
    degradation_trend: List[Dict[str, Any]]
    confidence_interval: str
    timestamp: str

class SimulationRequest(BaseModel):
    machine_id: str = "M-102"
    current_values: FailurePredictionRequest
    simulated_values: FailurePredictionRequest

class SimulationResponse(BaseModel):
    machine_id: str
    original_prediction: Dict[str, Any]
    simulated_prediction: Dict[str, Any]
    delta_risk_pp: float
    delta_health: int
    delta_rul: int
    explanation: str
    parameter_changes: List[Dict[str, Any]]
    timestamp: str

class VisualInspectionRequest(BaseModel):
    machine_id: str = "M-101"
    machine_type: str = "CNC"
    image_base64: str

class CombinedHealthResult(BaseModel):
    health_score: int
    sensor_failure_pct: float
    visual_penalty: int
    risk_level: str

class VisualInspectionResponse(BaseModel):
    machine_id: str
    machine_type: str
    inspection_type: str
    component: str
    condition: str
    confidence: int
    detected_issues: List[str]
    recommendation: str
    image_metrics: Dict[str, float]
    model_mode: str
    combined_health: CombinedHealthResult
    timestamp: str
