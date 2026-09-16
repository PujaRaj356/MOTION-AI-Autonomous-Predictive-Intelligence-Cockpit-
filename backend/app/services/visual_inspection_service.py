import base64
import io
from datetime import datetime
from PIL import Image, ImageFilter, ImageStat
import numpy as np
import torch
import torchvision.models as models
from backend.app.database.connection import db_manager
from ml.models.health_engine import HealthEngine


class IndustrialTargetValidator:
    """
    Validates that the scanned image is an industrial machine / tool
    and not common non-industrial items (e.g. computer mouse, smartphone, keyboard, pet, food).
    """
    def __init__(self):
        self._model = None
        self._preprocess = None
        self._categories = None
        self._initialized = False

    def _lazy_init(self):
        if self._initialized:
            return
        try:
            weights = models.MobileNet_V3_Small_Weights.DEFAULT
            self._model = models.mobilenet_v3_small(weights=weights).eval()
            self._preprocess = weights.transforms()
            self._categories = weights.meta["categories"]
            self._initialized = True
        except Exception as e:
            print(f"[VisualInspection] Target validator init warning: {e}")
            self._initialized = False

    def validate(self, img: Image.Image) -> tuple[bool, str, float]:
        self._lazy_init()
        if not self._initialized or self._model is None:
            return True, "Industrial Object", 1.0

        try:
            tensor = self._preprocess(img).unsqueeze(0)
            with torch.no_grad():
                preds = self._model(tensor).squeeze(0).softmax(0)
                top10 = torch.topk(preds, 10)

            top_idx = top10.indices[0].item()
            top_label = self._categories[top_idx]
            top_score = top10.values[0].item()

            forbidden_keywords = [
                'mouse', 'mousetrap', 'keyboard', 'laptop', 'telephone', 'cellphone', 'cellular',
                'joystick', 'screen', 'monitor', 'television', 'remote control', 'remote',
                'coffee mug', 'mug', 'cup', 'water bottle', 'bottle', 'plate', 'saucer',
                'pizza', 'banana', 'apple', 'orange', 'broccoli', 'sandwich', 'burger',
                'sunglass', 'sunglasses', 'shoe', 'running shoe', 'sandal', 'sock', 'boot',
                'sweatshirt', 'jersey', 'suit', 'coat', 'jean', 'pajama', 'pillow', 'quilt',
                'teddy bear', 'toys', 'dog', 'cat', 'bird', 'face', 'person',
                'speaker', 'loudspeaker', 'puck', 'pan', 'frying pan', 'pot', 'strainer',
                'fork', 'spoon', 'knife', 'bowl', 'ball', 'racket', 'book', 'paper',
                'wallet', 'bag', 'backpack', 'guitar', 'piano', 'desk', 'chair', 'table',
                'hand-held computer', 'hand blower', 'handkerchief', 'vacuum',
                'hair dryer', 'electric fan', 'microwave', 'toaster', 'refrigerator'
            ]

            # 1. Animal / Organism check (ImageNet indices 0-397)
            if top_idx < 398 and top_score > 0.08:
                clean_name = top_label.replace("_", " ").title()
                return False, clean_name, top_score

            # 2. Check top predictions for forbidden non-industrial items
            for idx, score in zip(top10.indices[:6], top10.values[:6]):
                label = self._categories[idx.item()].lower()
                for kw in forbidden_keywords:
                    if kw in label and score.item() > 0.03:
                        clean_name = self._categories[idx.item()].replace("_", " ").title()
                        return False, clean_name, score.item()

            return True, top_label.replace("_", " ").title(), top_score
        except Exception as e:
            print(f"[VisualInspection] Validation pass error: {e}")
            return True, "Industrial Equipment", 1.0


validator = IndustrialTargetValidator()


class VisualInspectionService:
    """
    Phase 1 CNC visual inspection using heuristic image analysis.
    Validates that the target is industrial machinery before analysis.
    """

    CNC_THRESHOLDS = {
        "edge_density_warning": 0.08,
        "edge_density_severe": 0.14,
        "dark_ratio_warning": 0.25,
        "dark_ratio_severe": 0.40,
    }

    def analyze_image(self, image_base64: str, machine_type: str, machine_id: str) -> dict:
        img = self._decode_image(image_base64)

        # Validate target is an industrial object
        is_valid, detected_target, conf = validator.validate(img)
        if not is_valid:
            conf_pct = int(conf * 100)
            raise ValueError(
                f"Non-Industrial Object Detected: '{detected_target}' ({conf_pct}% confidence). "
                f"Visual inspection only supports industrial machinery (e.g., {machine_type} Cutting Tool, Spindle, Conveyor, or Hydraulic Assembly). "
                f"Please point camera at a valid industrial machine component."
            )

        metrics = self._compute_metrics(img)
        if machine_type == "CNC":
            assessment = self._assess_cnc(metrics)
            inspection_type = "CNC"
            component = "Cutting Tool"
        elif machine_type == "CONVEYOR":
            assessment = self._assess_conveyor(metrics)
            inspection_type = "CONVEYOR"
            component = "Belt Assembly"
        elif machine_type == "HYDRAULIC":
            assessment = self._assess_hydraulic(metrics)
            inspection_type = "HYDRAULIC"
            component = "Hydraulic Assembly"
        else:
            raise ValueError(f"Unknown machine type: {machine_type}")

        combined = self._fuse_with_sensors(machine_id, assessment)

        result = {
            "machine_id": machine_id,
            "machine_type": machine_type,
            "inspection_type": inspection_type,
            "component": component,
            "condition": assessment["condition"],
            "confidence": assessment["confidence"],
            "detected_issues": assessment["detected_issues"],
            "recommendation": assessment["recommendation"],
            "image_metrics": metrics,
            "model_mode": "HEURISTIC_DEV",
            "combined_health": combined,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }

        db_manager.save_record("visual_inspections", result)
        return result

    def _decode_image(self, image_base64: str) -> Image.Image:
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]
            
        # Ensure correct base64 padding
        missing_padding = len(image_base64) % 4
        if missing_padding:
            image_base64 += "=" * (4 - missing_padding)
            
        raw = base64.b64decode(image_base64)
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        return img.resize((256, 256))

    def _compute_metrics(self, img: Image.Image) -> dict:
        gray = img.convert("L")
        edges = gray.filter(ImageFilter.FIND_EDGES)
        edge_arr = np.array(edges, dtype=float) / 255.0
        edge_density = float(np.mean(edge_arr > 0.15))

        arr = np.array(gray, dtype=float) / 255.0
        dark_ratio = float(np.mean(arr < 0.35))
        brightness = float(np.mean(arr))
        contrast = float(ImageStat.Stat(gray).stddev[0]) / 128.0

        return {
            "edge_density": round(edge_density, 4),
            "dark_ratio": round(dark_ratio, 4),
            "brightness": round(brightness, 4),
            "contrast": round(contrast, 4),
        }

    def _assess_cnc(self, metrics: dict) -> dict:
        t = self.CNC_THRESHOLDS
        issues = []
        severity_score = 0.0

        if metrics["edge_density"] > t["edge_density_severe"]:
            issues.append("Edge wear — high surface irregularity detected")
            severity_score += 0.45
        elif metrics["edge_density"] > t["edge_density_warning"]:
            issues.append("Moderate edge wear patterns")
            severity_score += 0.25

        if metrics["dark_ratio"] > t["dark_ratio_severe"]:
            issues.append("Tip degradation — dark worn regions detected")
            severity_score += 0.35
        elif metrics["dark_ratio"] > t["dark_ratio_warning"]:
            issues.append("Possible tip degradation")
            severity_score += 0.20

        if metrics["contrast"] > 0.55:
            issues.append("Surface damage — high contrast anomalies")
            severity_score += 0.20

        if severity_score >= 0.65:
            condition = "SEVERE WEAR"
            recommendation = "Inspect and replace cutting tool immediately. Severe visual wear indicators detected."
        elif severity_score >= 0.30:
            condition = "WARNING"
            recommendation = "Schedule tool inspection. Moderate wear indicators detected — monitor closely."
        else:
            condition = "GOOD"
            recommendation = "Cutting tool appears within acceptable visual condition. Continue normal monitoring."

        confidence = min(95, int(72 + severity_score * 28 + metrics["edge_density"] * 50))

        return {
            "condition": condition,
            "confidence": confidence,
            "detected_issues": issues if issues else ["No significant visual defects detected"],
            "recommendation": recommendation,
            "severity_score": round(severity_score, 3),
        }

    def _assess_conveyor(self, metrics: dict) -> dict:
        issues = []
        severity_score = 0.0

        if metrics["edge_density"] > 0.12:
            issues.append("Belt damage — surface cracks/tears detected")
            severity_score += 0.40
        elif metrics["edge_density"] > 0.08:
            issues.append("Moderate surface wear on belt")
            severity_score += 0.20

        if metrics["contrast"] > 0.60:
            issues.append("Belt misalignment detected")
            severity_score += 0.35
        elif metrics["contrast"] > 0.45:
            issues.append("Possible belt misalignment")
            severity_score += 0.15

        if severity_score >= 0.50:
            condition = "WARNING"
            recommendation = "Inspect belt alignment and check for severe cracks."
        elif severity_score >= 0.20:
            condition = "MODERATE WEAR"
            recommendation = "Schedule conveyor maintenance check soon."
        else:
            condition = "GOOD"
            recommendation = "Conveyor belt appears within acceptable visual condition."

        confidence = min(96, int(75 + severity_score * 20 + metrics["edge_density"] * 40))

        return {
            "condition": condition,
            "confidence": confidence,
            "detected_issues": issues if issues else ["No visual defects detected"],
            "recommendation": recommendation,
            "severity_score": round(severity_score, 3),
        }

    def _assess_hydraulic(self, metrics: dict) -> dict:
        issues = []
        severity_score = 0.0

        if metrics["dark_ratio"] > 0.35:
            issues.append("Oil Leakage — dark fluid patches detected")
            severity_score += 0.60
        elif metrics["dark_ratio"] > 0.25:
            issues.append("Possible Oil Leakage or dark spotting")
            severity_score += 0.30

        if metrics["edge_density"] > 0.15:
            issues.append("Hose damage — irregular shapes on hose assembly")
            severity_score += 0.25

        if severity_score >= 0.55:
            condition = "CRITICAL"
            recommendation = "Immediate inspection required. High probability of hydraulic fluid leakage."
        elif severity_score >= 0.25:
            condition = "WARNING"
            recommendation = "Check hydraulic lines for minor leaks or damage."
        else:
            condition = "GOOD"
            recommendation = "Hydraulic assembly shows no visible signs of leakage."

        confidence = min(94, int(70 + severity_score * 30 + metrics["dark_ratio"] * 30))

        return {
            "condition": condition,
            "confidence": confidence,
            "detected_issues": issues if issues else ["No visual leaks or damage detected"],
            "recommendation": recommendation,
            "severity_score": round(severity_score, 3),
        }

    def _fuse_with_sensors(self, machine_id: str, assessment: dict) -> dict:
        machines = db_manager.get_collection_data("machines")
        machine = next((m for m in machines if m["machine_id"] == machine_id), None)

        sensor_prob = machine.get("failure_probability", 0.15) if machine else 0.15
        sensor_rul = machine.get("rul", 120) if machine else 120
        base_health = HealthEngine.calculate_health_score(sensor_prob, sensor_rul)

        visual_penalty = {"GOOD": 0, "WARNING": 15, "SEVERE WEAR": 30}.get(assessment["condition"], 0)
        combined_health = max(0, base_health - visual_penalty)

        return {
            "health_score": combined_health,
            "sensor_failure_pct": round(sensor_prob * 100, 1),
            "visual_penalty": visual_penalty,
            "risk_level": HealthEngine.get_risk_level(combined_health),
        }


visual_inspection_service = VisualInspectionService()
