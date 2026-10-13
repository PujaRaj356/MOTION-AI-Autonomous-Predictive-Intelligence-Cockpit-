import numpy as np
import joblib

class ShapExplainer:
    def __init__(self, model_path='ml/saved_models/xgboost_failure.pkl', scaler_path='ml/saved_models/xgboost_scaler.pkl'):
        self.model_path = model_path
        self.scaler_path = scaler_path
        self._model = None
        self._scaler = None
        self._explainer = None
        self.feature_names = [
            'Air Temperature',
            'Process Temperature',
            'Rotational Speed',
            'Torque',
            'Tool Wear',
            'Machine Type'
        ]

    @property
    def model(self):
        if self._model is None:
            self._model = joblib.load(self.model_path)
        return self._model

    @property
    def scaler(self):
        if self._scaler is None:
            self._scaler = joblib.load(self.scaler_path)
        return self._scaler

    @property
    def explainer(self):
        if self._explainer is None:
            import shap
            self._explainer = shap.TreeExplainer(self.model)
        return self._explainer

    def explain_instance(self, input_features):
        """
        input_features: list of 6 values [Air_Temp_C, Process_Temp_C, RPM, Torque, Tool_Wear, Type_encoded]
        """
        scaled_input = self.scaler.transform([input_features])
        shap_values = self.explainer.shap_values(scaled_input)
        
        # Handle SHAP output dimension variations
        if isinstance(shap_values, list):
            sv = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
        elif len(shap_values.shape) == 2:
            sv = shap_values[0]
        else:
            sv = shap_values[0]
            
        contributions = []
        for name, value, shap_val in zip(self.feature_names, input_features, sv):
            impact = "high" if abs(shap_val) > 0.5 else ("medium" if abs(shap_val) > 0.15 else "low")
            direction = "increases" if shap_val > 0 else "decreases"
            contributions.append({
                "feature": name,
                "value": float(value),
                "shap_value": round(float(shap_val), 4),
                "impact": impact,
                "direction": direction
            })
            
        # Sort by absolute impact magnitude
        contributions.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
        
        # Generate dynamic human readable explanation
        top_risk_factors = [c["feature"] for c in contributions if c["direction"] == "increases" and abs(c["shap_value"]) > 0.1]
        top_protective = [c["feature"] for c in contributions if c["direction"] == "decreases" and abs(c["shap_value"]) > 0.1]
        
        if top_risk_factors:
            risk_str = " and ".join(top_risk_factors[:2])
            text_summary = f"{risk_str} are the primary factors increasing the predicted failure risk."
        elif top_protective:
            prot_str = " and ".join(top_protective[:2])
            text_summary = f"Machine operating parameters like {prot_str} are keeping failure risk low."
        else:
            text_summary = "All operating conditions are within standard operational baseline thresholds."
            
        return {
            "contributions": contributions,
            "summary": text_summary,
            "top_risk_factors": top_risk_factors[:3]
        }

if __name__ == '__main__':
    explainer = ShapExplainer()
    sample = [82.4, 108.5, 1540, 44.2, 181, 0] # high temp, high tool wear
    res = explainer.explain_instance(sample)
    print("SHAP test output:")
    print(res)
