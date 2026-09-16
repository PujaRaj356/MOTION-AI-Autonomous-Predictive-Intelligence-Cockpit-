# MOTION-AI: Autonomous Predictive Intelligence Cockpit

An industrial predictive maintenance system using Machine Learning (XGBoost, LSTM) and computer vision to predict machine failures and estimate Remaining Useful Life (RUL).

## Features
- **Sensor Telemetry Prediction**: XGBoost model for immediate failure prediction.
- **Remaining Useful Life**: Keras LSTM model for degradation forecasting.
- **Visual Inspection**: Heuristic analysis for cutting tool and component wear.
- **Explainability**: SHAP explanations for model transparency.

## Getting Started

### 1. Backend Setup
The backend is built with FastAPI and Python 3.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\Activate.ps1 on Windows
pip install -r requirements.txt
python -m backend.app.main
```
The backend API will run on `http://localhost:8000`.

### 2. Frontend Setup
The frontend is built with React, Vite, and Capacitor for cross-platform support.

```bash
cd frontend
npm install
npm run dev
```
The web dashboard will be available at `http://localhost:5173`.
