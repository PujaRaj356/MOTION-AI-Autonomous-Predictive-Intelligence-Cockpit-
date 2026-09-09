import pandas as pd
import numpy as np
import os

def generate_cmapss_dataset(num_units=100, min_cycles=130, max_cycles=300, seed=42):
    np.random.seed(seed)
    records = []
    
    for unit in range(1, num_units + 1):
        total_life = np.random.randint(min_cycles, max_cycles)
        
        # Initial healthy values for key sensors
        # s2: Process Pressure (PSI) ~ 642
        # s3: Physical Fan Speed (RPM) ~ 1585
        # s4: Physical Core Speed (RPM) ~ 1400
        # s7: Engine Temp (°C) ~ 553
        # s8: Fuel Flow ~ 2388
        # s11: Torque / Load ~ 47.5
        # s12: Vibration ~ 521.5
        # s15: Tool Wear / Degradation Index ~ 8.4
        
        base_s2 = 642.0 + np.random.normal(0, 0.5)
        base_s3 = 1585.0 + np.random.normal(0, 2.0)
        base_s4 = 1400.0 + np.random.normal(0, 3.0)
        base_s7 = 553.0 + np.random.normal(0, 1.0)
        base_s8 = 2388.0 + np.random.normal(0, 0.2)
        base_s11 = 47.5 + np.random.normal(0, 0.2)
        base_s12 = 521.5 + np.random.normal(0, 0.5)
        base_s15 = 8.4 + np.random.normal(0, 0.05)
        
        for cycle in range(1, total_life + 1):
            rul = total_life - cycle
            # Exponential / quadratic degradation factor in the last 60% of life
            degradation_factor = max(0.0, (cycle - 0.4 * total_life) / (0.6 * total_life)) ** 2
            
            s2 = base_s2 + degradation_factor * 2.5 + np.random.normal(0, 0.3)
            s3 = base_s3 + degradation_factor * 15.0 + np.random.normal(0, 1.5)
            s4 = base_s4 + degradation_factor * 25.0 + np.random.normal(0, 2.0)
            s7 = base_s7 + degradation_factor * 8.0 + np.random.normal(0, 0.5)
            s8 = base_s8 + degradation_factor * 0.8 + np.random.normal(0, 0.1)
            s11 = base_s11 + degradation_factor * 1.5 + np.random.normal(0, 0.1)
            s12 = base_s12 - degradation_factor * 2.0 + np.random.normal(0, 0.3)
            s15 = base_s15 + degradation_factor * 0.4 + np.random.normal(0, 0.02)
            
            records.append({
                'unit_id': unit,
                'cycle': cycle,
                'op_setting_1': round(float(np.random.normal(0.001, 0.002)), 4),
                'op_setting_2': round(float(np.random.normal(0.0002, 0.0001)), 4),
                'op_setting_3': 100.0,
                's2': round(float(s2), 2),
                's3': round(float(s3), 2),
                's4': round(float(s4), 2),
                's7': round(float(s7), 2),
                's8': round(float(s8), 2),
                's11': round(float(s11), 2),
                's12': round(float(s12), 2),
                's15': round(float(s15), 4),
                'RUL': rul
            })
            
    df = pd.DataFrame(records)
    out_dir = 'data/raw/cmapss'
    os.makedirs(out_dir, exist_ok=True)
    file_path = os.path.join(out_dir, 'train_FD001.csv')
    df.to_csv(file_path, index=False)
    print(f"Generated C-MAPSS dataset with {len(df)} cycles across {num_units} units. Saved to {file_path}")
    return file_path

if __name__ == '__main__':
    generate_cmapss_dataset()
