import time
import random
import json
import urllib.request
import urllib.error
import sys

API_URL = "http://localhost:8000"

def get_machines():
    try:
        req = urllib.request.Request(f"{API_URL}/machines")
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching machines: {e}")
        return []

def send_telemetry(payload):
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            f"{API_URL}/predict/failure",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        return None

def start_stream():
    print("=" * 65)
    print(">> GEARGUARD // AUTONOMOUS REAL-TIME SENSOR TELEMETRY STREAMER")
    print(f">> Target API Engine: {API_URL}")
    print(">> Frequency: Continuous real-time stream (every 2.0s)")
    print("=" * 65)

    machines = get_machines()
    if not machines:
        print("[!] Could not connect to API or retrieve machines. Retrying in 3s...")
        time.sleep(3)
        machines = get_machines()

    if not machines:
        print("[!] Failed to initialize machine fleet. Exiting.")
        sys.exit(1)

    print(f"[OK] Discovered {len(machines)} active factory machines for live streaming.\n")

    # Maintain running state per machine
    fleet_state = {}
    for m in machines:
        mid = m["machine_id"]
        fleet_state[mid] = {
            "air_temperature": float(m.get("air_temperature") or 25.0),
            "process_temperature": float(m.get("process_temperature") or 35.0),
            "rpm": float(m.get("rpm") or 1500.0),
            "torque": float(m.get("torque") or 42.0),
            "tool_wear": float(m.get("tool_wear") or 60.0),
            "machine_type": m.get("machine_type", "CNC")[0] if m.get("machine_type") else "H"
        }

    cycle = 0
    while True:
        cycle += 1
        # Pick 2-3 machines to update in each tick for realistic asynchronous streaming
        selected_mids = random.sample(list(fleet_state.keys()), k=min(3, len(fleet_state)))

        for mid in selected_mids:
            st = fleet_state[mid]

            # Realistic physical micro-variations
            rpm_noise = random.uniform(-18.0, 18.0)
            torque_noise = random.uniform(-1.2, 1.2)
            temp_noise = random.uniform(-0.15, 0.15)

            new_rpm = max(1200.0, min(2800.0, round(st["rpm"] + rpm_noise, 1)))
            new_torque = max(20.0, min(75.0, round(st["torque"] + torque_noise, 1)))
            new_air = max(18.0, min(36.0, round(st["air_temperature"] + temp_noise, 2)))
            # Process temperature tracks mechanical torque load
            thermal_load = (new_torque - 40.0) * 0.05
            new_proc = max(28.0, min(48.0, round(st["process_temperature"] + thermal_load + temp_noise, 2)))
            
            # Cumulative wear ticks up slowly
            new_wear = min(240.0, round(st["tool_wear"] + random.uniform(0.05, 0.2), 1))

            st["rpm"] = new_rpm
            st["torque"] = new_torque
            st["air_temperature"] = new_air
            st["process_temperature"] = new_proc
            st["tool_wear"] = new_wear

            m_type = st["machine_type"]
            if m_type not in ["L", "M", "H"]:
                m_type = "H"

            payload = {
                "machine_id": mid,
                "air_temperature": new_air,
                "process_temperature": new_proc,
                "rpm": new_rpm,
                "torque": new_torque,
                "tool_wear": new_wear,
                "machine_type": m_type
            }

            result = send_telemetry(payload)
            if result:
                health = result.get("health_score", 0)
                risk = result.get("risk_level", "NORMAL")
                prob = result.get("failure_percentage", 0.0)
                rul = result.get("rul_estimate", 0)

                tag = "[OK]" if risk == "HEALTHY" else ("[WARN]" if risk == "WARNING" else "[CRIT]")
                t_str = time.strftime("%H:%M:%S")
                print(f"[{t_str}] {tag} {mid} | {new_rpm:.0f} RPM | {new_torque:.1f} Nm | Air: {new_air:.1f}C | Proc: {new_proc:.1f}C | Health: {health}% | Risk: {prob:.1f}% | RUL: {rul}cyc")

        time.sleep(2.0)

if __name__ == "__main__":
    start_stream()
