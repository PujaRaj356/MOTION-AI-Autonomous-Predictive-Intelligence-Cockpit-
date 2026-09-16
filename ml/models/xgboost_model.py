import joblib
import numpy as np


class XGBoostFailureModel:
    """XGBoost classifier for machine failure probability prediction."""

    TYPE_MAP = {"L": 0, "M": 1, "H": 2}

    def __init__(
        self,
        model_path="ml/saved_models/xgboost_failure.pkl",
        scaler_path="ml/saved_models/xgboost_scaler.pkl",
    ):
        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)

    def prepare_features(self, air_temp, process_temp, rpm, torque, tool_wear, machine_type="L"):
        type_code = self.TYPE_MAP.get(str(machine_type).upper(), 0)
        return [air_temp, process_temp, rpm, torque, tool_wear, type_code]

    def predict_proba(self, features: list) -> float:
        scaled = self.scaler.transform([features])
        return float(self.model.predict_proba(scaled)[0][1])

    def predict(self, request_data) -> dict:
        features = self.prepare_features(
            request_data.air_temperature,
            request_data.process_temperature,
            request_data.rpm,
            request_data.torque,
            request_data.tool_wear,
            getattr(request_data, "machine_type", "L") or "L",
        )
        prob = self.predict_proba(features)
        return {"failure_probability": prob, "raw_features": features}
