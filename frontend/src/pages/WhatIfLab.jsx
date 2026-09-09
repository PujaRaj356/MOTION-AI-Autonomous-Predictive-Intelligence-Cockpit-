import React, { useState } from 'react';
import { runSimulation } from '../services/api';
import ShapBarChart from '../components/common/ShapBarChart';
import { FlaskConical, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const defaultValues = {
  machine_id: 'M-102',
  air_temperature: 26.0,
  process_temperature: 36.5,
  rpm: 1540,
  torque: 42.0,
  tool_wear: 120,
  machine_type: 'L'
};

export default function WhatIfLab() {
  const [current, setCurrent] = useState({ ...defaultValues });
  const [simulated, setSimulated] = useState({
    ...defaultValues,
    air_temperature: 32.0,
    process_temperature: 44.0,
    rpm: 2300,
    torque: 65.0,
    tool_wear: 210
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fields = [
    { key: 'air_temperature', label: 'Air Temp', unit: '°C', min: 15, max: 45, step: 0.5 },
    { key: 'process_temperature', label: 'Process Temp', unit: '°C', min: 20, max: 55, step: 0.5 },
    { key: 'rpm', label: 'RPM', unit: 'RPM', min: 1000, max: 3000, step: 50 },
    { key: 'torque', label: 'Torque', unit: 'Nm', min: 5, max: 80, step: 1 },
    { key: 'tool_wear', label: 'Tool Wear', unit: 'min', min: 0, max: 250, step: 5 },
  ];

  const handleSim = async () => {
    setLoading(true);
    try {
      const res = await runSimulation({ machine_id: current.machine_id, current_values: current, simulated_values: simulated });
      setResult(res.data);
    } catch (e) {
      console.error('Simulation error:', e);
    } finally {
      setLoading(false);
    }
  };

  const DeltaIcon = ({ val }) => {
    if (val > 0) return <TrendingUp size={14} />;
    if (val < 0) return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-eyebrow">Simulation</div>
        <h2>What-If Laboratory</h2>
        <p className="page-header-desc">
          Compare current vs hypothetical operating conditions to understand how parameter changes affect failure risk
        </p>
      </div>

      {/* Side-by-Side Panels */}
      <div className="whatif-layout" style={{ marginBottom: 24 }}>
        {/* Current Panel */}
        <div className="whatif-panel">
          <div className="whatif-panel-header">Current Parameters (Baseline)</div>
          {fields.map(f => (
            <div key={f.key} className="input-group" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="input-label">{f.label} <span className="input-unit">({f.unit})</span></span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  {current[f.key]}
                </span>
              </div>
              <input
                type="range"
                className="range-slider"
                min={f.min}
                max={f.max}
                step={f.step}
                value={current[f.key]}
                onChange={e => setCurrent(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) }))}
              />
            </div>
          ))}
        </div>

        {/* Simulated Panel */}
        <div className="whatif-panel" style={{ borderColor: 'var(--accent-orange)', borderWidth: 2 }}>
          <div className="whatif-panel-header" style={{ color: 'var(--accent-orange)' }}>Simulated Parameters (Modified)</div>
          {fields.map(f => {
            const delta = simulated[f.key] - current[f.key];
            return (
              <div key={f.key} className="input-group" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="input-label">{f.label} <span className="input-unit">({f.unit})</span></span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      {simulated[f.key]}
                    </span>
                    {delta !== 0 && (
                      <span className={`delta-badge ${delta > 0 ? 'increase' : 'decrease'}`}>
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  className="range-slider"
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

      {/* Run Button */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <button className="btn btn-primary btn-lg" onClick={handleSim} disabled={loading}>
          {loading ? (
            <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Simulating...</>
          ) : (
            <><FlaskConical size={16} /> RUN SIMULATION</>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="stack">
          {/* Delta Summary */}
          <div className="metrics-grid">
            <div className={`metric-card ${result.delta_risk_pp > 0 ? 'red' : 'sage'}`}>
              <div className="metric-label">Risk Change</div>
              <div className="metric-value" style={{ color: result.delta_risk_pp > 0 ? 'var(--accent-red)' : 'var(--accent-sage)' }}>
                {result.delta_risk_pp > 0 ? '+' : ''}{result.delta_risk_pp}
                <span className="metric-unit">pp</span>
              </div>
            </div>
            <div className={`metric-card ${result.delta_health >= 0 ? 'sage' : 'red'}`}>
              <div className="metric-label">Health Delta</div>
              <div className="metric-value" style={{ color: result.delta_health >= 0 ? 'var(--accent-sage)' : 'var(--accent-red)' }}>
                {result.delta_health > 0 ? '+' : ''}{result.delta_health}
                <span className="metric-unit">pts</span>
              </div>
            </div>
            <div className={`metric-card ${result.delta_rul >= 0 ? 'sage' : 'amber'}`}>
              <div className="metric-label">RUL Delta</div>
              <div className="metric-value" style={{ color: result.delta_rul >= 0 ? 'var(--accent-sage)' : 'var(--accent-amber)' }}>
                {result.delta_rul > 0 ? '+' : ''}{result.delta_rul}
                <span className="metric-unit">cyc</span>
              </div>
            </div>
          </div>

          {/* Comparison */}
          <div className="grid-2">
            <div className="card">
              <span className="card-title">Baseline Result</span>
              <div style={{ marginTop: 12 }}>
                <div className="metric-value" style={{ fontSize: '1.8rem' }}>
                  {result.original_prediction.failure_percentage}%
                  <span className="metric-unit">failure probability</span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <span className={`status-badge ${result.original_prediction.risk_level.toLowerCase()}`}>
                    {result.original_prediction.risk_level}
                  </span>
                  <span style={{ marginLeft: 12, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    Health: {result.original_prediction.health_score} | RUL: {result.original_prediction.rul_estimate}
                  </span>
                </div>
              </div>
            </div>
            <div className="card" style={{ borderColor: 'var(--accent-orange)' }}>
              <span className="card-title" style={{ color: 'var(--accent-orange)' }}>Simulated Result</span>
              <div style={{ marginTop: 12 }}>
                <div className="metric-value" style={{ fontSize: '1.8rem' }}>
                  {result.simulated_prediction.failure_percentage}%
                  <span className="metric-unit">failure probability</span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <span className={`status-badge ${result.simulated_prediction.risk_level.toLowerCase()}`}>
                    {result.simulated_prediction.risk_level}
                  </span>
                  <span style={{ marginLeft: 12, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    Health: {result.simulated_prediction.health_score} | RUL: {result.simulated_prediction.rul_estimate}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SHAP Comparison */}
          <div className="grid-2">
            <div className="card">
              <span className="card-title">Baseline SHAP Breakdown</span>
              <ShapBarChart contributions={result.original_prediction.shap_explanation} />
            </div>
            <div className="card">
              <span className="card-title" style={{ color: 'var(--accent-orange)' }}>Simulated SHAP Breakdown</span>
              <ShapBarChart contributions={result.simulated_prediction.shap_explanation} />
            </div>
          </div>

          {/* Parameter Changes Table */}
          <div className="card">
            <span className="card-title">Parameter Change Log</span>
            <table className="data-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Original</th>
                  <th>Simulated</th>
                  <th>Delta</th>
                </tr>
              </thead>
              <tbody>
                {(result.parameter_changes || []).map((p, i) => (
                  <tr key={i}>
                    <td>{p.parameter}</td>
                    <td className="mono-cell">{p.original} {p.unit}</td>
                    <td className="mono-cell">{p.simulated} {p.unit}</td>
                    <td>
                      <span className={`delta-badge ${p.delta > 0 ? 'increase' : p.delta < 0 ? 'decrease' : 'neutral'}`}>
                        <DeltaIcon val={p.delta} />
                        {p.delta > 0 ? '+' : ''}{p.delta} {p.unit}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI Explanation */}
          <div className="card" style={{ borderLeft: '4px solid var(--accent-orange)' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <FlaskConical size={18} style={{ color: 'var(--accent-orange)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Simulation Analysis</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {result.explanation}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeltaIcon({ val }) {
  if (val > 0) return <TrendingUp size={14} />;
  if (val < 0) return <TrendingDown size={14} />;
  return <Minus size={14} />;
}
