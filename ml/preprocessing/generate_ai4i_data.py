import pandas as pd
import numpy as np
import os

def generate_ai4i_dataset(num_samples=10000, seed=42):
    np.random.seed(seed)
    
    # Types: L (60%), M (30%), H (10%)
    types = np.random.choice(['L', 'M', 'H'], size=num_samples, p=[0.6, 0.3, 0.1])
    
    # Air temperature [K]: mean 300K, std 2K
    air_temp_k = np.random.normal(300.0, 2.0, num_samples)
    
    # Process temperature [K]: air_temp + 10K + noise
    process_temp_k = air_temp_k + 10.0 + np.random.normal(0.0, 1.0, num_samples)
    
    # Rotational speed [rpm]: mean 1500, std 180
    rotational_speed = np.random.normal(1535.0, 175.0, num_samples)
    rotational_speed = np.clip(rotational_speed, 1100, 2900)
    
    # Torque [Nm]: inversely related to speed + noise
    # Power = Torque * (2 * pi * RPM / 60) ~ constant range around 6000W
    torque = (6000.0 / (2 * np.pi * rotational_speed / 60.0)) + np.random.normal(0.0, 8.0, num_samples)
    torque = np.clip(torque, 3.8, 76.6)
    
    # Tool wear [min]: uniform 0 to 240
    tool_wear = np.random.uniform(0, 240, num_samples)
    
    # Calculate physics-inspired failures (Tool Wear Failure, Heat Dissipation, Power Failure, Overstrain)
    # TWF: Tool wear > 200 min with small chance, or > 230 min high chance
    twf = (tool_wear > 215) & (np.random.rand(num_samples) < 0.45)
    
    # HDF: Heat dissipation failure if process_temp - air_temp < 8.6K and RPM < 1380
    temp_diff = process_temp_k - air_temp_k
    hdf = (temp_diff < 8.6) & (rotational_speed < 1380)
    
    # PWF: Power failure if power < 3500W or power > 9000W
    power = torque * (2 * np.pi * rotational_speed / 60.0)
    pwf = (power < 3500) | (power > 9000)
    
    # OSF: Overstrain failure if tool wear * torque > 11000 (for L), 12000 (M), 13000 (H)
    osf_threshold = np.where(types == 'L', 11000, np.where(types == 'M', 12000, 13000))
    osf = (tool_wear * torque > osf_threshold)
    
    # Random background noise failure (0.5%)
    random_fail = np.random.rand(num_samples) < 0.005
    
    machine_failure = (twf | hdf | pwf | osf | random_fail).astype(int)
    
    # Convert K to C for intuitive display in frontend, but store standard dataset columns
    air_temp_c = air_temp_k - 273.15
    process_temp_c = process_temp_k - 273.15
    
    df = pd.DataFrame({
        'UDI': np.arange(1, num_samples + 1),
        'Product ID': [f"{t}{np.random.randint(10000, 99999)}" for t in types],
        'Type': types,
        'Air temperature [K]': np.round(air_temp_k, 2),
        'Process temperature [K]': np.round(process_temp_k, 2),
        'Air temperature [C]': np.round(air_temp_c, 2),
        'Process temperature [C]': np.round(process_temp_c, 2),
        'Rotational speed [rpm]': np.round(rotational_speed, 0).astype(int),
        'Torque [Nm]': np.round(torque, 2),
        'Tool wear [min]': np.round(tool_wear, 0).astype(int),
        'Machine failure': machine_failure,
        'TWF': twf.astype(int),
        'HDF': hdf.astype(int),
        'PWF': pwf.astype(int),
        'OSF': osf.astype(int)
    })
    
    out_dir = 'data/raw/ai4i'
    os.makedirs(out_dir, exist_ok=True)
    file_path = os.path.join(out_dir, 'ai4i2020.csv')
    df.to_csv(file_path, index=False)
    print(f"Generated AI4I dataset with {len(df)} rows. Failure rate: {df['Machine failure'].mean():.2%}")
    return file_path

if __name__ == '__main__':
    generate_ai4i_dataset()
