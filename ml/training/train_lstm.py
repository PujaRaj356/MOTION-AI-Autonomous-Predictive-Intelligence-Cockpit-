import os
os.environ['KERAS_BACKEND'] = 'torch'

import pandas as pd
import numpy as np
import keras
from keras import layers
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import json

def create_sequences(df, feature_cols, seq_length=20):
    X_seq = []
    y_seq = []
    
    for unit in df['unit_id'].unique():
        unit_df = df[df['unit_id'] == unit]
        data = unit_df[feature_cols].values
        ruls = unit_df['RUL'].values
        
        if len(data) < seq_length:
            continue
            
        # Step of 2 to reduce memory & speed up training
        for i in range(0, len(data) - seq_length + 1, 2):
            X_seq.append(data[i:i+seq_length])
            y_seq.append(ruls[i+seq_length-1])
            
    return np.array(X_seq), np.array(y_seq)

def train_lstm():
    print("Loading C-MAPSS dataset for fast LSTM RUL training...")
    df = pd.read_csv('data/raw/cmapss/train_FD001.csv')
    
    sensor_cols = ['s2', 's3', 's4', 's7', 's8', 's11', 's12', 's15']
    
    scaler = StandardScaler()
    df[sensor_cols] = scaler.fit_transform(df[sensor_cols])
    
    seq_length = 20
    
    units = df['unit_id'].unique()
    train_units = units[:80]
    test_units = units[80:]
    
    train_mask = df['unit_id'].isin(train_units)
    test_mask = df['unit_id'].isin(test_units)
    
    X_train, y_train = create_sequences(df[train_mask], sensor_cols, seq_length)
    X_test, y_test = create_sequences(df[test_mask], sensor_cols, seq_length)
    
    print(f"Sequences shape: Train {X_train.shape}, Test {X_test.shape}")
    
    model = keras.Sequential([
        layers.Input(shape=(seq_length, len(sensor_cols))),
        layers.LSTM(32, return_sequences=False),
        layers.Dropout(0.1),
        layers.Dense(16, activation='relu'),
        layers.Dense(1)
    ])
    
    model.compile(optimizer=keras.optimizers.Adam(learning_rate=0.005), loss='mse', metrics=['mae'])
    
    print("Training Keras LSTM model...")
    model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=6,
        batch_size=256,
        verbose=1
    )
    
    y_pred = model.predict(X_test).flatten()
    
    mae = float(mean_absolute_error(y_test, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    r2 = float(r2_score(y_test, y_pred))
    
    print("\n--- LSTM RUL Model Evaluation ---")
    print(f"MAE:  {mae:.2f} cycles")
    print(f"RMSE: {rmse:.2f} cycles")
    print(f"R²:   {r2:.4f}")
    
    metrics = {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "r2_score": round(r2, 4),
        "seq_length": seq_length,
        "features": sensor_cols
    }
    
    os.makedirs('ml/saved_models', exist_ok=True)
    model.save('ml/saved_models/lstm_rul.keras')
    joblib.dump(scaler, 'ml/saved_models/lstm_scaler.pkl')
    with open('ml/saved_models/lstm_metrics.json', 'w') as f:
        json.dump(metrics, f, indent=2)
        
    print("Saved LSTM model, scaler, and metrics to ml/saved_models/")

if __name__ == '__main__':
    train_lstm()
