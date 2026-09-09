class HealthEngine:
    @staticmethod
    def calculate_health_score(failure_probability: float, rul: float) -> int:
        """
        Calculates project-defined composite health score (0-100).
        Composite formula: 100 - (0.65 * failure_prob_pct + 0.35 * max(0, 100 - (RUL/200)*100))
        """
        fail_pct = failure_probability * 100.0
        rul_degrade_pct = max(0.0, (1.0 - min(rul, 200.0) / 200.0) * 100.0)
        
        penalty = 0.65 * fail_pct + 0.35 * rul_degrade_pct
        health = max(0, min(100, int(round(100.0 - penalty))))
        return health

    @staticmethod
    def get_risk_level(health_score: int) -> str:
        if health_score <= 30:
            return "CRITICAL"
        elif health_score <= 60:
            return "WARNING"
        else:
            return "HEALTHY"

    @staticmethod
    def generate_recommendation(risk_level: str, top_risk_factors: list) -> str:
        factors_str = " and ".join(top_risk_factors) if top_risk_factors else "operating strain"
        
        if risk_level == "CRITICAL":
            return f"Immediate maintenance inspection recommended. High {factors_str} are contributing significantly to critical failure risk. Halt high-load cycles."
        elif risk_level == "WARNING":
            return f"Schedule preventive maintenance within 48 hours. Elevated {factors_str} detected. Inspect thermal cooling loop and cutting tool assemblies."
        else:
            return "Machine is operating within a healthy range. Continue baseline automated monitoring."
