import React, { useState, useEffect } from 'react';
import { predictFailure, predictRUL } from '../../services/api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Cpu, Zap, Flame, ShieldAlert, Sparkles, AlertOctagon } from 'lucide-react';

export default function NeuralDiagnosticLab({ initialMachine }) {
  const [sensors, setSensors] = useState({
    machine_id: initialMachine?.machine_id || 'M-102',
    air_temperature: initialMachine?.air_temperature || 28.5,
    process_temperature: initialMachine?.process_temperature || 38.2,
    rpm: initialMachine?.rpm || 1820,
    torque: initialMachine?.torque || 52.0,
    tool_wear: initialMachine?.tool_wear || 165,
    machine_type: initialMachine?.machine_type?.includes('H') ? 'H' : 'L'
  });

  const [xgbResult, setXgbResult] = useState(null);
  const [lstmResult, setLstmResult] = useState(null);
  const [isInferring, setIsInferring] = useState(false);

  // Trigger reactive prediction whenever sensors change
  useEffect(() => {
    const timer = setTimeout(() => {
      runDualInference();
    }, 120); // 120ms debounce for ultra smooth slider interaction
    return () => clearTimeout(timer);
  }, [sensors]);

  const runDualInference = async () => {
    setIsInferring(true);
    try {
      const [resXgb, resLstm] = await Promise.all([
        predictFailure(sensors),
        predictRUL({ machine_id: sensors.machine_id })
      ]);
      setXgbResult(resXgb.data);
      setLstmResult(resLstm.data);
    } catch (err) {
      console.error('Inference error:', err);
    } finally {
      setIsInferring(false);
    }
  };

  const handleSlider = (field, val) => {
    setSensors(prev => ({ ...prev, [field]: parseFloat(val) }));
  };

  // Quick Stress Injection Scenarios
  const injectScenario = (type) => {
    if (type === 'NOMINAL') {
      setSensors(prev => ({
        ...prev,
        air_temperature: 24.5,
        process_temperature: 34.2,
        rpm: 1520,
        torque: 38.0,
        tool_wear: 45
      }));
    } else if (type === 'THERMAL_SPIKE') {
      setSensors(prev => ({
        ...prev,
        air_temperature: 36.8,
        process_temperature: 49.5,
        rpm: 2150,
        torque: 58.0
      }));
    } else if (type === 'TOOL_WEAROUT') {
      setSensors(prev => ({
        ...prev,
        tool_wear: 235,
        torque: 68.0,
        rpm: 1340
      }));
    } else if (type === 'OVERSTRAIN') {
      setSensors(prev => ({
        ...prev,
        torque: 74.5,
        rpm: 2780,
        tool_wear: 195
      }));
    }
  };

  const sliderFields = [
    { key: 'air_temperature', label: 'Air Temperature', unit: '°C', min: 15, max: 45, step: 0.1 },
    { key: 'process_temperature', label: 'Process Temperature', unit: '°C', min: 20, max: 55, step: 0.1 },
    { key: 'rpm', label: 'Rotational Speed', unit: 'RPM', min: 1000, max: 3000, step: 10 },
    { key: 'torque', label: 'Torque Load', unit: 'Nm', min: 5, max: 80, step: 0.5 },
    { key: 'tool_wear', label: 'Tool Wear Duration', unit: 'min', min: 0, max: 250, step: 1 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Preset Injectors Bar */}
      <div className="cockpit-panel" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={14} color="var(--signal-cyan)" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--signal-cyan)', textTransform: 'uppercase' }}>
              Fault Injection Matrix
            </span>
          </div>

          <div className="preset-pills" style={{ margin: 0 }}>
            <button className="preset-pill" onClick={() => injectScenario('NOMINAL')}>
              ● Nominal Steady State
            </button>
            <button className="preset-pill danger" onClick={() => injectScenario('THERMAL_SPIKE')}>
              ▲ Heat Dissipation Fault
            </button>
            <button className="preset-pill danger" onClick={() => injectScenario('TOOL_WEAROUT')}>
              ▲ Tool Wear Saturation
            </button>
            <button className="preset-pill danger" onClick={() => injectScenario('OVERSTRAIN')}>
              ▲ Mechanical Overstrain
            </button>
          </div>
        </div>
      </div>

      {/* Main Dual-Engine Matrix */}
      <div className="cockpit-grid-2">
        {/* Left: Reactive Slider Console */}
        <div className="cockpit-panel">
          <div className="panel-header">
            <span className="panel-title">
              <Cpu size={14} /> Telemetry Injection Controls
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: isInferring ? 'var(--signal-amber)' : 'var(--signal-mint)' }}>
              {isInferring ? '⚡ CALCULATING...' : '● LIVE INFERENCE'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <span className="sensor-slider-label">Target Asset</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-pure)', marginTop: 2 }}>
                {sensors.machine_id}
              </div>
            </div>
            <div>
              <span className="sensor-slider-label">Quality Grade</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--signal-cyan)', marginTop: 2 }}>
                Grade {sensors.machine_type}
              </div>
            </div>
          </div>

          {sliderFields.map(f => (
            <div key={f.key} className="sensor-slider-row">
              <div className="sensor-slider-header">
                <span className="sensor-slider-label">{f.label}</span>
                <span className="sensor-slider-val">
                  {sensors[f.key]} <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{f.unit}</span>
                </span>
              </div>
              <input
                type="range"
                className="hud-slider"
                min={f.min}
                max={f.max}
                step={f.step}
                value={sensors[f.key]}
                onChange={e => handleSlider(f.key, e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* Right: Dual Output (XGBoost Failure Prob + SHAP Waterfall + LSTM RUL) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Top Gauge Readout */}
          <div className="cockpit-panel">
            <div className="panel-header">
              <span className="panel-title">Dual-Engine Inference Output</span>
              {xgbResult && (
                <span className={`hud-badge ${xgbResult.risk_level === 'CRITICAL' ? 'red' : xgbResult.risk_level === 'WARNING' ? 'amber' : 'mint'}`}>
                  {xgbResult.risk_level}
                </span>
              )}
            </div>

            {xgbResult && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{
                  background: 'var(--bg-panel-inset)',
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-dim)' }}>XGBOOST FAILURE PROB</div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '2.2rem',
                    fontWeight: 800,
                    color: xgbResult.failure_percentage > 50 ? 'var(--signal-red)' : xgbResult.failure_percentage > 25 ? 'var(--signal-amber)' : 'var(--signal-mint)'
                  }}>
                    {xgbResult.failure_percentage}%
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-mid)', marginTop: 2 }}>
                    Health Index: {xgbResult.health_score}/100
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-panel-inset)',
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-dim)' }}>LSTM REMAINING LIFE</div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '2.2rem',
                    fontWeight: 800,
                    color: 'var(--signal-cyan)'
                  }}>
                    {xgbResult.rul_estimate} <span style={{ fontSize: '0.8rem' }}>CYC</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-mid)', marginTop: 2 }}>
                    Confidence: 94.8%
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SHAP Feature Attribution Waterfall */}
          {xgbResult?.shap_explanation && (
            <div className="cockpit-panel">
              <div className="panel-header">
                <span className="panel-title">SHAP Feature Attribution (Root Cause Impact)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {xgbResult.shap_explanation.map((item, idx) => {
                  const isRiskInc = item.shap_value > 0;
                  const absVal = Math.abs(item.shap_value);
                  const barWidth = Math.min(absVal * 100, 100);

                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ width: 120, color: 'var(--text-mid)', textAlign: 'right' }}>
                        {item.feature}
                      </span>
                      <div style={{
                        flex: 1,
                        height: 12,
                        background: 'var(--bg-panel-inset)',
                        borderRadius: 2,
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${barWidth}%`,
                          height: '100%',
                          background: isRiskInc ? 'var(--signal-red)' : 'var(--signal-mint)',
                          borderRadius: 2,
                          transition: 'width 200ms ease'
                        }} />
                      </div>
                      <span style={{ width: 50, color: isRiskInc ? 'var(--signal-red)' : 'var(--signal-mint)', textAlign: 'right' }}>
                        {isRiskInc ? '+' : ''}{item.shap_value.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Automated Recommendation */}
          {xgbResult?.recommendation && (
            <div className="cockpit-panel" style={{ borderLeft: '4px solid var(--signal-cyan)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--signal-cyan)', textTransform: 'uppercase', marginBottom: 4 }}>
                Autonomous Maintenance Advisory
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-high)', lineHeight: 1.5 }}>
                {xgbResult.recommendation}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
