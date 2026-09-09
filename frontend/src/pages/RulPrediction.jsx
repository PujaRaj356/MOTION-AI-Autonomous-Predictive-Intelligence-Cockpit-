import React, { useState } from 'react';
import { predictRUL } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, TrendingDown, Play } from 'lucide-react';

export default function RulPrediction() {
  const [machineId, setMachineId] = useState('M-102');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runRUL = async () => {
    setLoading(true);
    try {
      const res = await predictRUL({ machine_id: machineId });
      setResult(res.data);
    } catch (e) {
      console.error('RUL error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-eyebrow">Deep Learning</div>
        <h2>Remaining Useful Life (RUL) Analysis</h2>
        <p className="page-header-desc">
          LSTM-based sequential sensor analysis to predict remaining operational cycles before failure
        </p>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div className="input-group" style={{ minWidth: 180 }}>
          <span className="input-label">Machine ID</span>
          <select className="input-field" value={machineId} onChange={e => setMachineId(e.target.value)}>
            {['M-101', 'M-102', 'M-103', 'M-104', 'M-105'].map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary btn-lg" onClick={runRUL} disabled={loading} style={{ marginTop: 18 }}>
          {loading ? (
            <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Processing...</>
          ) : (
            <><Play size={16} /> PREDICT RUL</>
          )}
        </button>
      </div>

      {result ? (
        <div className="stack">
          {/* RUL Result Cards */}
          <div className="metrics-grid">
            <div className="metric-card orange">
              <div className="metric-label">Estimated RUL</div>
              <div className="metric-value">{result.estimated_rul}<span className="metric-unit">cycles</span></div>
            </div>
            <div className="metric-card sage">
              <div className="metric-label">Confidence Range</div>
              <div className="metric-value" style={{ fontSize: '1.4rem' }}>{result.confidence_interval}</div>
            </div>
            <div className="metric-card amber">
              <div className="metric-label">Prediction Time</div>
              <div className="metric-value" style={{ fontSize: '1rem' }}>{result.timestamp}</div>
            </div>
          </div>

          {/* Degradation Chart */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <TrendingDown size={14} style={{ marginRight: 6 }} />
                Degradation Trajectory Forecast
              </span>
            </div>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.degradation_trend}>
                  <defs>
                    <linearGradient id="rulGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C65D32" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#C65D32" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="degGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7A8B72" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#7A8B72" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="cycle" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} label={{ value: 'Operating Cycles', position: 'insideBottom', offset: -5, fontSize: 11, fill: 'var(--text-tertiary)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                  <Tooltip contentStyle={{ background: '#20221F', border: 'none', borderRadius: 8, color: '#F4F1EA', fontSize: 13 }} />
                  <Area type="monotone" dataKey="predicted_rul" stroke="#C65D32" fill="url(#rulGrad)" strokeWidth={2} name="Predicted RUL" />
                  <Area type="monotone" dataKey="degradation_pct" stroke="#7A8B72" fill="url(#degGrad)" strokeWidth={2} name="Health %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* LSTM Info */}
          <div className="card" style={{ borderLeft: '4px solid var(--accent-orange)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Clock size={18} style={{ color: 'var(--accent-orange)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>LSTM Deep Learning Model</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  This analysis uses a 2-layer Keras LSTM neural network trained on NASA C-MAPSS turbofan engine
                  degradation sequences. The model processes 20-step sliding windows of 8 sensor channels
                  (process pressure, fan speed, core speed, engine temperature, fuel flow, torque, vibration,
                  and degradation index) to estimate remaining useful life before failure.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 350, textAlign: 'center' }}>
          <Clock size={48} style={{ color: 'var(--border-light)', marginBottom: 16 }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: 6 }}>RUL Prediction Ready</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', maxWidth: 360 }}>
            Select a machine and click "PREDICT RUL" to analyze remaining useful life using
            the LSTM deep learning model trained on sequential sensor degradation data.
          </div>
        </div>
      )}
    </div>
  );
}
