import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, precision_score, recall_score, f1_score, roc_auc_score
import joblib
import json
import os

def train_xgboost():
    print("Loading AI4I 2020 dataset...")
    df = pd.read_csv('data/raw/ai4i/ai4i2020.csv')
    
    # Map Type to integer
    type_map = {'L': 0, 'M': 1, 'H': 2}
    df['Type_encoded'] = df['Type'].map(type_map)
    
    features = [
        'Air temperature [C]',
        'Process temperature [C]',
        'Rotational speed [rpm]',
        'Torque [Nm]',
        'Tool wear [min]',
        'Type_encoded'
    ]
    
    X = df[features]
    y = df['Machine failure']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Calculate scale_pos_weight for imbalance handling
    ratio = (len(y_train) - sum(y_train)) / sum(y_train)
    
    model = xgb.XGBClassifier(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.05,
        scale_pos_weight=ratio,
        eval_metric='logloss',
        random_state=42
    )
    
    model.fit(X_train_scaled, y_train)
    
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]
    
    prec = float(precision_score(y_test, y_pred))
    rec = float(recall_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred))
    auc = float(roc_auc_score(y_test, y_prob))
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    metrics = {
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(auc, 4),
        "confusion_matrix": cm,
        "features": features
    }
    
    print("\n--- XGBoost Model Evaluation ---")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"ROC AUC:   {auc:.4f}")
    print(f"Confusion Matrix:\n{np.array(cm)}")
    
    os.makedirs('ml/saved_models', exist_ok=True)
    joblib.dump(model, 'ml/saved_models/xgboost_failure.pkl')
    joblib.dump(scaler, 'ml/saved_models/xgboost_scaler.pkl')
    with open('ml/saved_models/xgboost_metrics.json', 'w') as f:
        json.dump(metrics, f, indent=2)
        
    print("Saved XGBoost model, scaler, and metrics to ml/saved_models/")

if __name__ == '__main__':
    train_xgboost()
