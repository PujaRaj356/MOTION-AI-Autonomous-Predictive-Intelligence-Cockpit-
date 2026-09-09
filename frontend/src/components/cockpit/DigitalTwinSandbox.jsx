import React, { useState } from 'react';
import { runSimulation } from '../../services/api';
import { GitCompare, ArrowRight, TrendingUp, TrendingDown, Gauge, AlertTriangle, Play } from 'lucide-react';

export default function DigitalTwinSandbox() {
  const [baseline, setBaseline] = useState({
    air_temperature: 26.0,
    process_temperature: 36.5,
    rpm: 1540,
    torque: 42.0,
    tool_wear: 120
  });

  const [simulated, setSimulated] = useState({
    air_temperature: 33.5,
    process_temperature: 46.0,
    rpm: 2350,
    torque: 66.5,
    tool_wear: 215
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await runSimulation({
        machine_id: 'M-102',
        current_values: baseline,
        simulated_values: simulated
      });
      setResult(res.data);
    } catch (e) {
      console.error('Twin simulation error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'air_temperature', label: 'Air Temp', unit: '°C', min: 15, max: 45, step: 0.5 },
    { key: 'process_temperature', label: 'Process Temp', unit: '°C', min: 20, max: 55, step: 0.5 },
    { key: 'rpm', label: 'RPM', unit: 'RPM', min: 1000, max: 3000, step: 20 },
    { key: 'torque', label: 'Torque Load', unit: 'Nm', min: 5, max: 80, step: 0.5 },
    { key: 'tool_wear', label: 'Tool Wear', unit: 'min', min: 0, max: 250, step: 5 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Controls: Run Twin Simulation Button */}
      <div className="cockpit-panel" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--signal-cyan)' }}>
            DIGITAL TWIN PARAMETER STRESS SANDBOX
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-mid)', marginTop: 2 }}>
            Simulate hypothetical operational load changes and inspect exact failure risk divergence before deploying changes
          </div>
        </div>

        <button className="btn-hud" onClick={handleSimulate} disabled={loading}>
          <Play size={14} /> {loading ? 'SIMULATING...' : 'EXECUTE TWIN SIMULATION'}
        </button>
      </div>

      {/* Split Side-by-Side: Twin A (Baseline) vs Twin B (Hypothetical) */}
      <div className="cockpit-grid-2">
        {/* Twin A: Baseline */}
        <div className="cockpit-panel">
          <div className="panel-header">
            <span className="panel-title">● Twin A: Nominal Baseline</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--signal-mint)' }}>ACTUAL ASSET STATE</span>
          </div>

          {fields.map(f => (
            <div key={f.key} className="sensor-slider-row">
              <div className="sensor-slider-header">
                <span className="sensor-slider-label">{f.label}</span>
                <span className="sensor-slider-val" style={{ color: 'var(--text-pure)' }}>
                  {baseline[f.key]} {f.unit}
                </span>
              </div>
              <input
                type="range"
                className="hud-slider"
                min={f.min}
                max={f.max}
                step={f.step}
                value={baseline[f.key]}
                onChange={e => setBaseline(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) }))}
              />
            </div>
          ))}
        </div>

        {/* Twin B: Simulated Stress */}
        <div className="cockpit-panel" style={{ borderColor: 'rgba(255, 92, 0, 0.4)' }}>
          <div className="panel-header">
            <span className="panel-title" style={{ color: 'var(--signal-orange)' }}>▲ Twin B: Hypothetical Stress</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--signal-orange)' }}>VIRTUAL TEST RUN</span>
          </div>

          {fields.map(f => {
            const diff = simulated[f.key] - baseline[f.key];
            return (
              <div key={f.key} className="sensor-slider-row">
                <div className="sensor-slider-header">
                  <span className="sensor-slider-label">{f.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="sensor-slider-val" style={{ color: 'var(--signal-orange)' }}>
                      {simulated[f.key]} {f.unit}
                    </span>
                    {diff !== 0 && (
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.65rem',
                        padding: '1px 5px',
                        borderRadius: 3,
                        background: diff > 0 ? 'var(--signal-red-glow)' : 'var(--signal-mint-glow)',
                        color: diff > 0 ? 'var(--signal-red)' : 'var(--signal-mint)'
                      }}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  className="hud-slider"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={simulated[f.key]}
                  onChange={e => setSimulated(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) }))}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulation Result Output */}
      {result && (
        <div className="cockpit-panel" style={{ borderLeft: '4px solid var(--signal-orange)' }}>
          <div className="panel-header">
            <span className="panel-title">Twin Divergence Analytics</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <div style={{ background: 'var(--bg-panel-inset)', padding: 14, borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-dim)' }}>RISK DELTA</div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '2rem',
                fontWeight: 800,
                color: result.delta_risk_pp > 0 ? 'var(--signal-red)' : 'var(--signal-mint)'
              }}>
                {result.delta_risk_pp > 0 ? '+' : ''}{result.delta_risk_pp} <span style={{ fontSize: '0.7rem' }}>pp</span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-panel-inset)', padding: 14, borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-dim)' }}>HEALTH IMPACT</div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '2rem',
                fontWeight: 800,
                color: result.delta_health >= 0 ? 'var(--signal-mint)' : 'var(--signal-red)'
              }}>
                {result.delta_health > 0 ? '+' : ''}{result.delta_health} <span style={{ fontSize: '0.7rem' }}>pts</span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-panel-inset)', padding: 14, borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-dim)' }}>RUL LIFESPAN DELTA</div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '2rem',
                fontWeight: 800,
                color: result.delta_rul >= 0 ? 'var(--signal-mint)' : 'var(--signal-amber)'
              }}>
                {result.delta_rul > 0 ? '+' : ''}{result.delta_rul} <span style={{ fontSize: '0.7rem' }}>cyc</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14, fontSize: '0.82rem', color: 'var(--text-mid)', lineHeight: 1.5 }}>
            {result.explanation}
          </div>
        </div>
      )}
    </div>
  );
}
