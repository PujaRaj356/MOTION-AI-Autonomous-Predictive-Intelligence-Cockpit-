import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMachines, getHealth } from '../services/api';
import { Activity, AlertTriangle, CheckCircle2, Clock, Cpu, ShieldAlert, Sliders, ArrowUpRight, Gauge, Zap } from 'lucide-react';

export default function Dashboard() {
  const [machines, setMachines] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
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
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const criticalCount = machines.filter(m => (m.status || '').toUpperCase() === 'CRITICAL').length;
  const warningCount = machines.filter(m => (m.status || '').toUpperCase() === 'WARNING').length;
  const healthyCount = machines.filter(m => (m.status || '').toUpperCase() === 'HEALTHY').length;
  const avgHealth = machines.length
    ? Math.round(machines.reduce((s, m) => s + (m.health_score || 0), 0) / machines.length)
    : 0;

  const filteredMachines = machines.filter(m => {
    if (activeFilter === 'ALL') return true;
    return (m.status || '').toUpperCase() === activeFilter;
  });

  if (loading && machines.length === 0) {
    return (
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Cockpit Hero Section */}
      <div className="hero-section">
        <div>
          <div className="page-header-eyebrow">
            <Zap size={13} /> SATELLITE INDUSTRIAL TELEMETRY // SECTOR ALPHA
          </div>
          <div className="hero-title">GearGuard Industrial Failure Prevention Cockpit</div>
          <p className="hero-subtitle">
            Autonomous multi-sensor diagnostics powered by XGBoost failure risk classifier and Keras LSTM
            Remaining Useful Life forecasting. Real-time telemetry monitoring across 15 active shop-floor units.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => navigate('/predict')}>
              <Cpu size={15} /> Launch Diagnostic Lab
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/simulation')}>
              <Sliders size={15} /> Digital Twin Simulation
            </button>
          </div>
        </div>
        <div className="hero-meta">
          <div className="hero-meta-item">
            Telemetry Feed: <strong style={{ color: 'var(--signal-green)' }}>LIVE (10s sync)</strong>
          </div>
          <div className="hero-meta-item">
            AI Engine: <strong>XGBoost + LSTM + SHAP</strong>
          </div>
          <div className="hero-meta-item">
            Factory Units Monitored: <strong style={{ color: 'var(--signal-mint)' }}>{machines.length} Machines</strong>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card orange">
          <div className="metric-label">Monitored Fleet</div>
          <div className="metric-value">{machines.length} <span className="metric-unit">Units</span></div>
        </div>
        <div className="metric-card sage">
          <div className="metric-label">Optimal Health</div>
          <div className="metric-value" style={{ color: 'var(--signal-green)' }}>
            {healthyCount} <span className="metric-unit">Online</span>
          </div>
        </div>
        <div className="metric-card amber">
          <div className="metric-label">Elevated Degradation</div>
          <div className="metric-value" style={{ color: 'var(--signal-amber)' }}>
            {warningCount} <span className="metric-unit">Warning</span>
          </div>
        </div>
        <div className="metric-card red">
          <div className="metric-label">Critical Breakdown Hazard</div>
          <div className="metric-value" style={{ color: 'var(--signal-red)' }}>
            {criticalCount} <span className="metric-unit">Urgent</span>
          </div>
        </div>
        <div className="metric-card sage">
          <div className="metric-label">Fleet Health Index</div>
          <div className="metric-value">
            {avgHealth}<span className="metric-unit">%</span>
          </div>
        </div>
      </div>

      {/* Machine Fleet Explorer */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="card-title">
              <Activity size={18} color="var(--signal-mint)" /> Monitored Industrial Fleet Overview
            </span>
          </div>
          <div className="filter-tabs">
            <button
              className={`filter-tab ${activeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveFilter('ALL')}
            >
              All Units ({machines.length})
            </button>
            <button
              className={`filter-tab ${activeFilter === 'HEALTHY' ? 'active' : ''}`}
              onClick={() => setActiveFilter('HEALTHY')}
            >
              🟢 Healthy ({healthyCount})
            </button>
            <button
              className={`filter-tab ${activeFilter === 'WARNING' ? 'active' : ''}`}
              onClick={() => setActiveFilter('WARNING')}
            >
              🟡 Warning ({warningCount})
            </button>
            <button
              className={`filter-tab ${activeFilter === 'CRITICAL' ? 'active' : ''}`}
              onClick={() => setActiveFilter('CRITICAL')}
            >
              🔴 Critical ({criticalCount})
            </button>
          </div>
        </div>

        {/* 15 Machine Cards Grid */}
        <div className="machine-cards-grid">
          {filteredMachines.map(m => {
            const statusLower = (m.status || 'healthy').toLowerCase();
            const failProbPct = ((m.failure_probability || 0) * 100).toFixed(1);
            const isCritical = statusLower === 'critical';
            const isWarning = statusLower === 'warning';

            return (
              <div
                key={m.machine_id}
                className={`machine-card status-${statusLower}`}
                onClick={() => navigate(`/machine/${m.machine_id}`)}
              >
                <div className="machine-card-header">
                  <div>
                    <div className="machine-card-id">{m.machine_id}</div>
                    <div className="machine-card-name">{m.name || 'Industrial Machine'}</div>
                  </div>
                  <span className={`status-badge ${statusLower}`}>
                    {m.status || 'HEALTHY'}
                  </span>
                </div>

                {/* Health Meter Progress Bar */}
                <div className="health-meter-wrap">
                  <div className="health-meter-head">
                    <span>Health Score</span>
                    <strong>{m.health_score || 0}%</strong>
                  </div>
                  <div className="health-meter-track">
                    <div
                      className={`health-meter-fill ${isCritical ? 'red' : isWarning ? 'amber' : 'green'}`}
                      style={{ width: `${Math.min(100, Math.max(5, m.health_score || 0))}%` }}
                    />
                  </div>
                </div>

                {/* Real-time Telemetry Grid */}
                <div className="machine-telemetry-grid">
                  <div className="telemetry-cell">
                    <span className="telemetry-cell-label">Air / Proc Temp</span>
                    <span className="telemetry-cell-val">
                      {m.air_temperature ? `${m.air_temperature}°C / ${m.process_temperature}°C` : '24.5°C / 34.8°C'}
                    </span>
                  </div>
                  <div className="telemetry-cell">
                    <span className="telemetry-cell-label">Speed & Torque</span>
                    <span className="telemetry-cell-val">
                      {m.rpm || 1540} RPM · {m.torque || 42} Nm
                    </span>
                  </div>
                  <div className="telemetry-cell">
                    <span className="telemetry-cell-label">Failure Risk</span>
                    <span className="telemetry-cell-val" style={{ color: isCritical ? 'var(--signal-red)' : isWarning ? 'var(--signal-amber)' : 'var(--signal-green)' }}>
                      {failProbPct}% Risk
                    </span>
                  </div>
                  <div className="telemetry-cell">
                    <span className="telemetry-cell-label">Remaining RUL</span>
                    <span className="telemetry-cell-val">
                      {m.rul || 140} cycles
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ flex: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/predict`);
                    }}
                  >
                    AI Diagnostic
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    style={{ flex: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/machine/${m.machine_id}`);
                    }}
                  >
                    Inspect <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Critical Equipment Hazard Warning Drawer */}
      {criticalCount > 0 && (
        <div className="card" style={{ borderLeft: '4px solid var(--signal-red)' }}>
          <div className="card-header">
            <span className="card-title" style={{ color: 'var(--signal-red)' }}>
              <ShieldAlert size={18} /> High-Risk Machine Incident Registry (Requires Immediate Overhaul)
            </span>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/maintenance')}>
              Open Work Orders
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Machine ID</th>
                <th>Designation</th>
                <th>Status</th>
                <th>Health</th>
                <th>AI Failure Prob</th>
                <th>Forecasted RUL</th>
                <th>Corrective Action</th>
              </tr>
            </thead>
            <tbody>
              {machines
                .filter(m => (m.status || '').toUpperCase() === 'CRITICAL')
                .map(m => (
                  <tr key={m.machine_id}>
                    <td className="mono-cell" style={{ fontWeight: 700, color: 'var(--text-pure)' }}>
                      {m.machine_id}
                    </td>
                    <td>{m.name}</td>
                    <td>
                      <span className="status-badge critical">CRITICAL</span>
                    </td>
                    <td className="mono-cell" style={{ color: 'var(--signal-red)', fontWeight: 700 }}>
                      {m.health_score}%
                    </td>
                    <td className="mono-cell" style={{ color: 'var(--signal-red)', fontWeight: 700 }}>
                      {((m.failure_probability || 0) * 100).toFixed(1)}%
                    </td>
                    <td className="mono-cell">{m.rul} cycles</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => navigate(`/machine/${m.machine_id}`)}
                      >
                        Inspect Telemetry
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
