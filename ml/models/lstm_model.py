import os
os.environ.setdefault("KERAS_BACKEND", "torch")

import joblib
import numpy as np
import keras


class LSTMRULModel:
    """Keras LSTM regressor for Remaining Useful Life prediction."""

    SENSOR_COLS = ["s2", "s3", "s4", "s7", "s8", "s11", "s12", "s15"]
    SEQ_LENGTH = 20

    def __init__(
        self,
        model_path="ml/saved_models/lstm_rul.keras",
        scaler_path="ml/saved_models/lstm_scaler.pkl",
    ):
        self.model = keras.models.load_model(model_path)
        self.scaler = joblib.load(scaler_path)

    def prepare_sequence(self, sequence_data: list = None) -> np.ndarray:
        if sequence_data is None or len(sequence_data) < self.SEQ_LENGTH:
            return self._synthesize_sequence()
        seq_matrix = np.array([
            [getattr(item, col, 0.0) for col in self.SENSOR_COLS]
            for item in sequence_data[: self.SEQ_LENGTH]
        ])
        return seq_matrix

    def _synthesize_sequence(self) -> np.ndarray:
        """Demo fallback when insufficient time-series data is provided."""
        seq_len = self.SEQ_LENGTH
        raw_seq = []
        bases = [642.0, 1585.0, 1400.0, 553.0, 2388.0, 47.5, 521.5, 8.4]
        for t in range(seq_len):
            deg = (t / float(seq_len)) ** 2
            raw_seq.append([b + deg * (i + 1) * 2 for i, b in enumerate(bases)])
        return np.array(raw_seq)

    def predict_rul(self, sequence_data: list = None) -> dict:
        seq_matrix = self.prepare_sequence(sequence_data)
        scaled_seq = self.scaler.transform(seq_matrix)
        input_tensor = np.expand_dims(scaled_seq, axis=0)
        pred_rul = float(self.model.predict(input_tensor, verbose=0)[0][0])
        estimated_rul = max(1, int(round(pred_rul)))
        return {
            "estimated_rul": estimated_rul,
            "used_synthetic_sequence": sequence_data is None or len(sequence_data) < self.SEQ_LENGTH,
        }
