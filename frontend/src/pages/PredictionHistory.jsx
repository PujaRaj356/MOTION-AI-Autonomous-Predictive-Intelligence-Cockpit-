import React, { useState, useEffect } from 'react';
import { getPredictions } from '../services/api';
import { History as HistoryIcon, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PredictionHistory() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPredictions()
      .then(res => setPredictions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

  const getIcon = (risk) => {
    if (risk === 'CRITICAL') return <AlertTriangle size={14} style={{ color: 'var(--accent-red)' }} />;
    if (risk === 'WARNING') return <AlertCircle size={14} style={{ color: 'var(--accent-amber)' }} />;
    return <CheckCircle2 size={14} style={{ color: 'var(--accent-sage)' }} />;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-eyebrow">Log</div>
        <h2>Prediction History</h2>
        <p className="page-header-desc">
          Chronological log of all AI-generated failure predictions
        </p>
      </div>

      {predictions.length > 0 ? (
        <div className="timeline">
          {predictions.map((p, i) => (
            <div key={i} className={`timeline-item ${(p.risk_level || '').toLowerCase()}`}>
              <div className="card" style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {getIcon(p.risk_level)}
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.85rem' }}>
                      {p.machine_id}
                    </span>
                    <span className={`status-badge ${(p.risk_level || '').toLowerCase()}`}>{p.risk_level}</span>
                  </div>
                  <span className="timeline-time">{p.timestamp}</span>
                </div>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)' }}>Failure: </span>
                    <span className="mono-cell" style={{ fontWeight: 600, color: p.failure_percentage > 50 ? 'var(--accent-red)' : 'inherit' }}>
                      {p.failure_percentage}%
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)' }}>Health: </span>
                    <span className="mono-cell" style={{ fontWeight: 600 }}>{p.health_score}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)' }}>RUL: </span>
                    <span className="mono-cell" style={{ fontWeight: 600 }}>{p.rul_estimate} cycles</span>
                  </div>
                </div>
                {p.ai_summary && (
                  <div style={{ marginTop: 10, fontSize: '0.82rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--bg-secondary)', paddingTop: 10 }}>
                    {p.ai_summary}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, textAlign: 'center' }}>
          <HistoryIcon size={48} style={{ color: 'var(--border-light)', marginBottom: 16 }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: 6 }}>No Predictions Yet</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', maxWidth: 320 }}>
            Navigate to "Health Check" to run your first AI-powered prediction. All results will be logged here.
          </div>
        </div>
      )}
    </div>
  );
}
