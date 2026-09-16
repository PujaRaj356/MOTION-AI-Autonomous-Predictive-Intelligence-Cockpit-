# User Stories and ML Tasks

In accordance with the project guidelines, this document outlines the core user stories and their corresponding Machine Learning (ML) data tasks for the **MOTION-AI Predictive Intelligence Cockpit**.

## 1. Machine Failure Prediction (Classification)

**User Story (Product):**
As a factory maintenance manager, I want the system to flag machines that are likely to fail in the near future (e.g., within 24 hours), so that I can schedule proactive maintenance and avoid unexpected downtime.

**Supporting ML Task:**
As a data scientist, I want to train and compare classifiers (Logistic Regression, Random Forest, XGBoost) on historical sensor telemetry and failure logs, so that I can select the best-performing model for identifying failure signatures.

**Acceptance Criteria:**
- **Recall ≥ 0.90** on the failure class (since a missed failure is costlier than a false alarm).
- **Precision ≥ 0.75** to keep the maintenance team's workload manageable by reducing false alarms.
- **Inference latency < 200ms** per machine reading to support real-time dashboard updates.

---

## 2. Remaining Useful Life (RUL) Estimation (Regression / Sequence Modeling)

**User Story (Product):**
As a reliability engineer, I want to see a continuous estimate of the Remaining Useful Life (RUL) for each engine or machine, so that I can optimize the lifecycle of parts and order replacements just in time.

**Supporting ML Task:**
As an ML engineer, I want to build and train a sequence-modeling architecture (like Keras LSTM) on the time-series degradation data, so that the model captures the temporal wear-and-tear patterns leading up to a failure.

**Acceptance Criteria:**
- **RMSE (Root Mean Squared Error) ≤ 15 cycles/hours** on the held-out test set.
- The model successfully processes variable-length time-series windows without crashing.
- Degradation curves output by the model smoothly decrease over time, matching physical expectations.

---

## 3. Explainability and Trust (Feature Importance)

**User Story (Product):**
As a maintenance technician, I want the dashboard to show me exactly *why* a machine was flagged for failure (e.g., "Vibration is 20% higher than normal"), so that I know what to inspect first when I go to the factory floor.

**Supporting ML Task:**
As a data scientist, I want to integrate a SHAP (SHapley Additive exPlanations) TreeExplainer with the XGBoost model, so that I can extract the top contributing features for every individual prediction made by the API.

**Acceptance Criteria:**
- The API payload returns the top 3 contributing sensors alongside the failure probability.
- SHAP value generation adds **no more than 500ms** of overhead to the inference latency.
- The explanations align with domain logic (e.g., high temperature and high vibration positively correlate with failure probability).
