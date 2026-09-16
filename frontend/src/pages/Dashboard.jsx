import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMachines, getHealth } from '../services/api';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function Dashboard() {
  const [machines, setMachines] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [machinesRes, healthRes] = await Promise.all([getMachines(), getHealth()]);
      setMachines(machinesRes.data);
      setSystemHealth(healthRes.data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Error loading dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const avgHealth = machines.length
    ? Math.round(machines.reduce((s, m) => s + (m.health_score || 0), 0) / machines.length)
    : 0;
  const criticalCount = machines.filter(m => (m.status || '').toUpperCase() === 'CRITICAL').length;
  const warningCount = machines.filter(m => (m.status || '').toUpperCase() === 'WARNING').length;
  const healthyCount = machines.filter(m => (m.status || '').toUpperCase() === 'HEALTHY').length;

  if (loading) {
    return <div className="spinner-container"><div className="spinner" /></div>;
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="hero-section">
        <div>
          <div className="page-header-eyebrow">Predictive Maintenance Intelligence</div>
          <div className="hero-title">Predict failures before they happen.</div>
          <p className="hero-subtitle">
            AI-powered predictive maintenance for industrial machines. Combine machine learning,
            deep learning, and explainable AI to detect failure risk, estimate remaining useful life,
            and make maintenance decisions earlier.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => navigate('/predict')}>
              Check Machine Health
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/simulation')}>
              Run What-If Simulation
            </button>
          </div>
        </div>
        <div className="hero-meta">
          <div className="hero-meta-item">
            Last updated: <strong>{lastUpdated.toLocaleTimeString()}</strong>
          </div>
          <div className="hero-meta-item">
            System status: <strong style={{ color: 'var(--accent-sage)' }}>{systemHealth?.status || 'ONLINE'}</strong>
          </div>
          <div className="hero-meta-item">
            Machines monitored: <strong>{machines.length}</strong>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="metrics-grid">
        <div className="metric-card sage">
          <div className="metric-label">Machines Monitored</div>
          <div className="metric-value">{machines.length}</div>
        </div>
        <div className="metric-card sage">
          <div className="metric-label">Healthy</div>
          <div className="metric-value" style={{ color: 'var(--accent-sage)' }}>{healthyCount}</div>
        </div>
        <div className="metric-card amber">
          <div className="metric-label">Warning</div>
          <div className="metric-value" style={{ color: 'var(--accent-amber)' }}>{warningCount}</div>
        </div>
        <div className="metric-card red">
          <div className="metric-label">Critical</div>
          <div className="metric-value" style={{ color: 'var(--accent-red)' }}>{criticalCount}</div>
        </div>
        <div className="metric-card orange">
          <div className="metric-label">Average Health</div>
          <div className="metric-value">{avgHealth}<span className="metric-unit">%</span></div>
        </div>
      </div>

      {/* Machine Health Overview */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">Machine Health Overview</span>
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/machines')}>
            View All
          </button>
        </div>
        <div className="machine-cards-grid">
          {machines.slice(0, 12).map(m => (
            <div
              key={m.machine_id}
              className="machine-card"
              onClick={() => navigate(`/machine/${m.machine_id}`)}
            >
              <div className="machine-card-header">
                <span className="machine-card-id">{m.machine_id}</span>
                <span className={`status-badge ${(m.status || '').toLowerCase()}`}>{m.status}</span>
              </div>
              <div className="machine-card-stats">
                <div className="machine-stat">
                  <span className="machine-stat-label">Health</span>
                  <span className="machine-stat-value">{m.health_score}</span>
                </div>
                <div className="machine-stat">
                  <span className="machine-stat-label">Failure Risk</span>
                  <span className="machine-stat-value" style={{
                    color: (m.failure_probability || 0) > 0.5 ? 'var(--accent-red)' : 'inherit'
                  }}>
                    {((m.failure_probability || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="machine-stat">
                  <span className="machine-stat-label">RUL</span>
                  <span className="machine-stat-value">{m.rul || '—'} cycles</span>
                </div>
                <div className="machine-stat">
                  <span className="machine-stat-label">Last Update</span>
                  <span className="machine-stat-value" style={{ fontSize: '0.68rem' }}>
                    {(m.last_updated || '—').slice(0, 10)}
                  </span>
                </div>
              </div>
              <button
                className="btn btn-sm btn-primary"
                style={{ width: '100%' }}
                onClick={(e) => { e.stopPropagation(); navigate(`/machine/${m.machine_id}`); }}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Machines Alert */}
      {(criticalCount + warningCount) > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <AlertTriangle size={14} style={{ marginRight: 6, color: 'var(--accent-red)' }} />
              Machines Requiring Attention
            </span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Machine</th>
                <th>Status</th>
                <th>Health</th>
                <th>Failure Risk</th>
                <th>RUL</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {machines
                .filter(m => ['CRITICAL', 'WARNING'].includes((m.status || '').toUpperCase()))
                .slice(0, 8)
                .map(m => (
                  <tr key={m.machine_id}>
                    <td className="mono-cell">{m.machine_id}</td>
                    <td>
                      <span className={`status-badge ${(m.status || '').toLowerCase()}`}>{m.status}</span>
                    </td>
                    <td className="mono-cell">{m.health_score}</td>
                    <td className="mono-cell" style={{ color: m.failure_probability > 0.5 ? 'var(--accent-red)' : 'inherit' }}>
                      {(m.failure_probability * 100).toFixed(1)}%
                    </td>
                    <td className="mono-cell">{m.rul} cycles</td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => navigate(`/machine/${m.machine_id}`)}>
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
