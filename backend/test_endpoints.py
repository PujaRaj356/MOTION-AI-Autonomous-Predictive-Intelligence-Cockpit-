import urllib.request
import json
import time

endpoints = [
    'http://localhost:8000/health',
    'http://localhost:8000/api/health',
    'http://localhost:8000/machines',
    'http://localhost:8000/machines/M-102',
    'http://localhost:8000/metrics',
    'http://localhost:8000/predictions',
    'http://localhost:8000/maintenance',
    'http://localhost:5173/'
]

print("=== VERIFYING HTTP GET ENDPOINTS ===")
for url in endpoints:
    try:
        req = urllib.request.urlopen(url, timeout=5)
        print(f"[SUCCESS {req.status}] {url}")
    except Exception as e:
        print(f"[FAIL] {url}: {e}")

print("\n=== VERIFYING POST PREDICT/FAILURE ===")
try:
    data = json.dumps({
        'machine_id': 'M-102',
        'air_temperature': 28.5,
        'process_temperature': 38.2,
        'rpm': 1820,
        'torque': 52.0,
        'tool_wear': 165,
        'machine_type': 'L'
    }).encode()
    req = urllib.request.Request('http://localhost:8000/predict/failure', data=data, headers={'Content-Type': 'application/json'}, method='POST')
    res = urllib.request.urlopen(req, timeout=5)
    body = json.loads(res.read().decode())
    print(f"[SUCCESS 200] Failure Prob: {body.get('failure_percentage')}% | Health: {body.get('health_score')} | Risk: {body.get('risk_level')} | SHAP: {len(body.get('shap_explanation', []))} features")
except Exception as e:
    print(f"[FAIL POST /predict/failure]: {e}")

print("\n=== VERIFYING POST PREDICT/RUL ===")
try:
    data = json.dumps({'machine_id': 'M-102'}).encode()
    req = urllib.request.Request('http://localhost:8000/predict/rul', data=data, headers={'Content-Type': 'application/json'}, method='POST')
    res = urllib.request.urlopen(req, timeout=5)
    body = json.loads(res.read().decode())
    print(f"[SUCCESS 200] RUL: {body.get('estimated_rul')} cycles | CI: {body.get('confidence_interval')} | Forecast: {len(body.get('degradation_trend', []))} points")
except Exception as e:
    print(f"[FAIL POST /predict/rul]: {e}")

print("\n=== VERIFYING POST SIMULATE ===")
try:
    data = json.dumps({
        'machine_id': 'M-102',
        'current_values': {'air_temperature': 26, 'process_temperature': 36, 'rpm': 1500, 'torque': 40, 'tool_wear': 100},
        'simulated_values': {'air_temperature': 32, 'process_temperature': 44, 'rpm': 2300, 'torque': 65, 'tool_wear': 210}
    }).encode()
    req = urllib.request.Request('http://localhost:8000/simulate', data=data, headers={'Content-Type': 'application/json'}, method='POST')
    res = urllib.request.urlopen(req, timeout=5)
    body = json.loads(res.read().decode())
    print(f"[SUCCESS 200] Delta Risk: {body.get('delta_risk_pp')} pp | Delta Health: {body.get('delta_health')} | Params: {len(body.get('parameter_changes', []))}")
except Exception as e:
    print(f"[FAIL POST /simulate]: {e}")

print("\nALL VERIFICATION TESTS COMPLETED.")
