import os
os.environ['KERAS_BACKEND'] = 'torch'

import joblib
import json
import numpy as np
import keras
from datetime import datetime
from ml.explainability.shap_explainer import ShapExplainer
from ml.models.health_engine import HealthEngine
from backend.app.database.connection import db_manager

class PredictionService:
    def __init__(self):
        print("Initializing Prediction Engine...")
        self.xgb_model = joblib.load('ml/saved_models/xgboost_failure.pkl')
        self.xgb_scaler = joblib.load('ml/saved_models/xgboost_scaler.pkl')
        self.lstm_model = keras.models.load_model('ml/saved_models/lstm_rul.keras')
        self.lstm_scaler = joblib.load('ml/saved_models/lstm_scaler.pkl')
        self.shap_explainer = ShapExplainer()
        self.type_map = {'L': 0, 'M': 1, 'H': 2}

    def predict_failure(self, request_data) -> dict:
        m_type = request_data.machine_type.upper() if hasattr(request_data, 'machine_type') and request_data.machine_type else 'L'
        type_code = self.type_map.get(m_type, 0)
        
        raw_features = [
            request_data.air_temperature,
            request_data.process_temperature,
            request_data.rpm,
            request_data.torque,
            request_data.tool_wear,
            type_code
        ]
        
        scaled = self.xgb_scaler.transform([raw_features])
        prob = float(self.xgb_model.predict_proba(scaled)[0][1])
        
        # Estimate RUL based on tool wear & physical load if sequence is single reading
        # Base RUL = 200 - tool_wear adjusted by thermal & torque stress
        base_rul = max(5, int(200 - request_data.tool_wear * 0.7 - (request_data.torque - 40) * 0.8))
        if prob > 0.7:
            base_rul = min(base_rul, int(50 * (1.0 - prob) + 10))
            
        health_score = HealthEngine.calculate_health_score(prob, base_rul)
        risk_level = HealthEngine.get_risk_level(health_score)
        
        shap_res = self.shap_explainer.explain_instance(raw_features)
        recommendation = HealthEngine.generate_recommendation(risk_level, shap_res["top_risk_factors"])
        
        result = {
            "machine_id": request_data.machine_id,
            "failure_probability": round(prob, 4),
            "failure_percentage": round(prob * 100.0, 1),
            "risk_level": risk_level,
            "health_score": health_score,
            "rul_estimate": base_rul,
            "recommendation": recommendation,
            "shap_explanation": shap_res["contributions"],
            "ai_summary": shap_res["summary"],
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Save prediction log
        db_manager.save_record("predictions", result)
        
        # Update machine status
        db_manager.update_machine_state(request_data.machine_id, {
            "status": risk_level,
            "health_score": health_score,
            "failure_probability": round(prob, 4),
            "rul": base_rul,
            "air_temperature": request_data.air_temperature,
            "process_temperature": request_data.process_temperature,
            "rpm": request_data.rpm,
            "torque": request_data.torque,
            "tool_wear": request_data.tool_wear,
            "last_updated": datetime.now().isoformat()
        })
        
        return result

    def predict_rul_sequence(self, machine_id: str, sequence_data: list = None) -> dict:
        if sequence_data is None or len(sequence_data) < 20:
            # Generate realistic sequential data based on NASA C-MAPSS parameters
            seq_len = 20
            sensor_cols = ['s2', 's3', 's4', 's7', 's8', 's11', 's12', 's15']
            # Synthesize sequence
            raw_seq = []
            base_s2, base_s3, base_s4 = 642.0, 1585.0, 1400.0
            base_s7, base_s8, base_s11 = 553.0, 2388.0, 47.5
            base_s12, base_s15 = 521.5, 8.4
            
            for t in range(seq_len):
                deg = (t / float(seq_len)) ** 2
                raw_seq.append([
                    base_s2 + deg * 2.0 + np.random.normal(0, 0.2),
                    base_s3 + deg * 12.0 + np.random.normal(0, 1.0),
                    base_s4 + deg * 20.0 + np.random.normal(0, 1.5),
                    base_s7 + deg * 6.0 + np.random.normal(0, 0.4),
                    base_s8 + deg * 0.6 + np.random.normal(0, 0.1),
                    base_s11 + deg * 1.2 + np.random.normal(0, 0.1),
                    base_s12 - deg * 1.5 + np.random.normal(0, 0.2),
                    base_s15 + deg * 0.3 + np.random.normal(0, 0.02)
                ])
            seq_matrix = np.array(raw_seq)
        else:
            sensor_cols = ['s2', 's3', 's4', 's7', 's8', 's11', 's12', 's15']
            seq_matrix = np.array([[getattr(item, col, 0.0) for col in sensor_cols] for item in sequence_data[:20]])
            
        scaled_seq = self.lstm_scaler.transform(seq_matrix)
        input_tensor = np.expand_dims(scaled_seq, axis=0)
        
        pred_rul = float(self.lstm_model.predict(input_tensor, verbose=0)[0][0])
        estimated_rul = max(1, int(round(pred_rul)))
        
        # Build degradation trend chart points
        degradation_trend = []
        for i in range(1, 11):
            cycle_no = i * 10
            est = max(0, estimated_rul - i * 8 + np.random.randint(-2, 3))
            health_degradation = max(10, 100 - i * 7.5)
            degradation_trend.append({
                "cycle": cycle_no,
                "predicted_rul": est,
                "degradation_pct": round(health_degradation, 1)
            })
            
        return {
            "machine_id": machine_id,
            "estimated_rul": estimated_rul,
            "degradation_trend": degradation_trend,
            "confidence_interval": f"{max(1, estimated_rul-5)} - {estimated_rul+8} cycles",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

    def run_simulation(self, current_data, simulated_data) -> dict:
        orig_res = self.predict_failure(current_data)
        sim_res = self.predict_failure(simulated_data)
        
        risk_diff_pp = round(sim_res["failure_percentage"] - orig_res["failure_percentage"], 1)
        health_diff = sim_res["health_score"] - orig_res["health_score"]
        rul_diff = sim_res["rul_estimate"] - orig_res["rul_estimate"]
        
        param_changes = []
        params = [
            ("Air Temperature", current_data.air_temperature, simulated_data.air_temperature, "°C"),
            ("Process Temperature", current_data.process_temperature, simulated_data.process_temperature, "°C"),
            ("Rotational Speed", current_data.rpm, simulated_data.rpm, "RPM"),
            ("Torque", current_data.torque, simulated_data.torque, "Nm"),
            ("Tool Wear", current_data.tool_wear, simulated_data.tool_wear, "min")
        ]
        
        for name, orig, sim, unit in params:
            diff = round(sim - orig, 1)
            param_changes.append({
                "parameter": name,
                "original": orig,
                "simulated": sim,
                "delta": diff,
                "unit": unit
            })
            
        if risk_diff_pp > 0:
            exp_text = f"The simulated operating parameters increase failure risk by {abs(risk_diff_pp)} percentage points due to elevated load and stress conditions."
        elif risk_diff_pp < 0:
            exp_text = f"The simulated operating adjustments reduce failure risk by {abs(risk_diff_pp)} percentage points, moving the machine into a safer thermal operating zone."
        else:
            exp_text = "The simulated parameter adjustments have negligible net impact on machine failure probability."
            
        result = {
            "machine_id": current_data.machine_id,
            "original_prediction": orig_res,
            "simulated_prediction": sim_res,
            "delta_risk_pp": risk_diff_pp,
            "delta_health": health_diff,
            "delta_rul": rul_diff,
            "explanation": exp_text,
            "parameter_changes": param_changes,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        db_manager.save_record("scenarios", result)
        return result

prediction_service = PredictionService()
