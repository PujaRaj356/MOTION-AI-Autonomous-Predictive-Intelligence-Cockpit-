import React, { useState, useEffect } from 'react';
import { predictFailure, getMachines } from '../services/api';
import HealthGauge from '../components/common/HealthGauge';
import ShapBarChart from '../components/common/ShapBarChart';
import { Zap, AlertTriangle, Shield, Lightbulb } from 'lucide-react';

export default function HealthPrediction() {
  const [form, setForm] = useState({
    machine_id: 'M-102',
    air_temperature: 28.5,
    process_temperature: 38.2,
    rpm: 1820,
    torque: 52.0,
    tool_wear: 165,
    machine_type: 'L'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [machines, setMachines] = useState([]);

  useEffect(() => {
    getMachines()
      .then(res => {
        if (res.data && res.data.length > 0) {
          setMachines(res.data);
          const first = res.data[0];
          setForm({
            machine_id: first.machine_id,
            air_temperature: first.air_temperature || 24.5,
            process_temperature: first.process_temperature || 34.8,
            rpm: first.rpm || 1540,
            torque: first.torque || 42.1,
            tool_wear: first.tool_wear || 45,
            machine_type: (first.machine_type && first.machine_type.includes('(H)') ? 'H' : (first.machine_type && first.machine_type.includes('(M)') ? 'M' : 'L'))
          });
        }
      })
      .catch(console.error);
  }, []);

  const handleSelectMachine = (id) => {
    const selected = machines.find(m => m.machine_id === id);
    if (selected) {
      setForm({
        machine_id: selected.machine_id,
        air_temperature: selected.air_temperature || 25.0,
        process_temperature: selected.process_temperature || 35.0,
        rpm: selected.rpm || 1500,
        torque: selected.torque || 42.0,
        tool_wear: selected.tool_wear || 50,
        machine_type: (selected.machine_type && selected.machine_type.includes('(H)') ? 'H' : (selected.machine_type && selected.machine_type.includes('(M)') ? 'M' : 'L'))
      });
    } else {
      handleChange('machine_id', id);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const runPrediction = async () => {
    setLoading(true);
    try {
      const res = await predictFailure(form);
      setResult(res.data);
    } catch (e) {
      console.error('Prediction error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'air_temperature', label: 'Air Temperature', unit: '°C', min: 15, max: 45, step: 0.1 },
    { key: 'process_temperature', label: 'Process Temperature', unit: '°C', min: 20, max: 55, step: 0.1 },
    { key: 'rpm', label: 'Rotational Speed', unit: 'RPM', min: 1000, max: 3000, step: 10 },
    { key: 'torque', label: 'Torque', unit: 'Nm', min: 5, max: 80, step: 0.5 },
    { key: 'tool_wear', label: 'Tool Wear', unit: 'min', min: 0, max: 250, step: 1 },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-eyebrow">AI Analysis</div>
        <h2>Health Check & Failure Prediction</h2>
        <p className="page-header-desc">
          Input sensor readings to compute failure probability, health score, and SHAP-powered root cause analysis
        </p>
      </div>

      <div className="grid-sidebar">
        {/* Input Panel */}
        <div className="card">
          <span className="card-title">Sensor Input Panel</span>

          <div className="input-grid" style={{ marginTop: 16 }}>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <span className="input-label">Registered Machine</span>
              <select className="input-field" value={form.machine_id} onChange={e => handleSelectMachine(e.target.value)}>
                {machines.length > 0 ? (
                  machines.map(m => (
                    <option key={m.machine_id} value={m.machine_id}>
                      {m.machine_id} — {m.name || 'Machine'}
                    </option>
                  ))
                ) : (
                  <option value="M-101">M-101</option>
                )}
              </select>
            </div>

            <div className="input-group">
              <span className="input-label">Machine Grade</span>
              <select className="input-field" value={form.machine_type} onChange={e => handleChange('machine_type', e.target.value)}>
                <option value="H">Heavy Duty (H)</option>
                <option value="M">Medium Duty (M)</option>
                <option value="L">Light Duty (L)</option>
              </select>
            </div>

            {fields.map(f => (
              <div key={f.key} className="input-group">
                <span className="input-label">{f.label} <span className="input-unit">({f.unit})</span></span>
                <input
                  type="number"
                  className="input-field"
                  value={form[f.key]}
                  onChange={e => handleChange(f.key, parseFloat(e.target.value) || 0)}
                  min={f.min}
                  max={f.max}
                  step={f.step}
                />
              </div>
            ))}
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 12 }}
            onClick={runPrediction}
            disabled={loading}
          >
            {loading ? (
              <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Analyzing...</>
            ) : (
              <><Zap size={16} /> RUN AI ANALYSIS</>
            )}
          </button>
        </div>

        {/* Results Panel */}
        <div className="stack">
          {result ? (
            <>
              {/* Health & Probability */}
              <div className="grid-2">
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span className="card-title">Health Score</span>
                  <HealthGauge score={result.health_score} size={160} />
                </div>
                <div className="card">
                  <span className="card-title">Failure Probability</span>
                  <div style={{ marginTop: 20, textAlign: 'center' }}>
                    <div className="card-value" style={{
                      fontSize: '3rem',
                      color: result.failure_percentage > 50 ? 'var(--accent-red)' : result.failure_percentage > 25 ? 'var(--accent-amber)' : 'var(--accent-sage)'
                    }}>
                      {result.failure_percentage}%
                    </div>
                    <span className={`status-badge ${result.risk_level.toLowerCase()}`} style={{ marginTop: 12 }}>
                      {result.risk_level}
                    </span>
                    <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                      RUL ESTIMATE: {result.rul_estimate} CYCLES
                    </div>
                  </div>
                </div>
              </div>

              {/* SHAP Explanation */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">SHAP Feature Contribution</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>← decreases risk | increases risk →</span>
                </div>
                <ShapBarChart contributions={result.shap_explanation} />
              </div>

              {/* AI Summary & Recommendation */}
              <div className="card" style={{ borderLeft: `4px solid ${
                result.risk_level === 'CRITICAL' ? 'var(--accent-red)' :
                result.risk_level === 'WARNING' ? 'var(--accent-amber)' : 'var(--accent-sage)'
              }` }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <Lightbulb size={18} style={{ color: 'var(--accent-orange)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>AI Explanation</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {result.ai_summary}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--bg-secondary)' }}>
                  <Shield size={18} style={{ color: 'var(--accent-sage)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Maintenance Recommendation</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {result.recommendation}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center' }}>
              <Zap size={40} style={{ color: 'var(--border-light)', marginBottom: 16 }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: 6 }}>Ready for Analysis</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', maxWidth: 300 }}>
                Input sensor parameters on the left panel and click "RUN AI ANALYSIS" to generate a prediction with XGBoost + SHAP explainability.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
