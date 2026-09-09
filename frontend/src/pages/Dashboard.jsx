import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMachines, getHealth } from '../services/api';
import HealthGauge from '../components/common/HealthGauge';
import FleetDotMap from '../components/common/FleetDotMap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AlertTriangle, TrendingUp, Activity, Server } from 'lucide-react';

export default function Dashboard() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getMachines();
      setMachines(res.data);
    } catch (e) {
      console.error('Error loading machines:', e);
    } finally {
      setLoading(false);
    }
  };

  const avgHealth = machines.length
    ? Math.round(machines.reduce((s, m) => s + (m.health_score || 0), 0) / machines.length)
    : 0;
  const criticalCount = machines.filter(m => (m.status || '').toUpperCase() === 'CRITICAL').length;
  const warningCount = machines.filter(m => (m.status || '').toUpperCase() === 'WARNING').length;
  const healthyCount = machines.filter(m => (m.status || '').toUpperCase() === 'HEALTHY').length;

  // Mock telemetry for dashboard chart
  const telemetry = [
    { time: '06:00', health: 89, failProb: 8 },
    { time: '07:00', health: 87, failProb: 10 },
    { time: '08:00', health: 84, failProb: 14 },
    { time: '09:00', health: 78, failProb: 22 },
    { time: '10:00', health: avgHealth, failProb: Math.round((1 - avgHealth / 100) * 60) },
  ];

  if (loading) {
    return <div className="spinner-container"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-eyebrow">Dashboard</div>
        <h2>System Overview</h2>
        <p className="page-header-desc">
          Real-time fleet health monitoring powered by XGBoost and LSTM
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card sage">
          <div className="metric-label">Fleet Health</div>
          <div className="metric-value">{avgHealth}<span className="metric-unit">/ 100</span></div>
          <div className={`metric-change ${avgHealth >= 70 ? 'positive' : 'negative'}`}>
            {avgHealth >= 70 ? '● Stable' : '▼ Degrading'}
          </div>
        </div>
        <div className="metric-card orange">
          <div className="metric-label">Machines Online</div>
          <div className="metric-value">{machines.length}</div>
          <div className="metric-change positive">All reporting</div>
        </div>
        <div className="metric-card red">
          <div className="metric-label">Critical Alerts</div>
          <div className="metric-value">{criticalCount}</div>
          <div className="metric-change negative">
            {criticalCount > 0 ? 'Action required' : 'Clear'}
          </div>
        </div>
        <div className="metric-card amber">
          <div className="metric-label">Warnings</div>
          <div className="metric-value">{warningCount}</div>
          <div className="metric-change" style={{ color: 'var(--accent-amber)' }}>
            {warningCount > 0 ? 'Monitor closely' : 'None'}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Health Gauge */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Composite Health Index</span>
            <span className="status-badge healthy" style={
              avgHealth <= 30 ? { background: 'var(--accent-red-light)', color: 'var(--accent-red)' } :
              avgHealth <= 60 ? { background: 'var(--accent-amber-light)', color: 'var(--accent-amber)' } :
              {}
            }>
              {avgHealth <= 30 ? 'CRITICAL' : avgHealth <= 60 ? 'WARNING' : 'HEALTHY'}
            </span>
          </div>
          <HealthGauge score={avgHealth} size={200} />
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-tertiary)', letterSpacing: '1px' }}>
              WEIGHTED ACROSS {machines.length} MACHINES
            </span>
          </div>
        </div>

        {/* Fleet Dot Map */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Fleet Status Map</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--accent-sage)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-sage)' }} /> {healthyCount}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--accent-amber)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-amber)' }} /> {warningCount}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--accent-red)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-red)' }} /> {criticalCount}
              </span>
            </div>
          </div>
          <FleetDotMap machines={machines} />
          <div style={{ marginTop: 16, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Click any node to open detailed machine dossier
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">Health & Risk Trend</span>
          <Activity size={16} style={{ color: 'var(--text-tertiary)' }} />
        </div>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={telemetry}>
              <defs>
                <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7A8B72" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#7A8B72" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A63D32" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#A63D32" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
              <Tooltip
                contentStyle={{ background: '#20221F', border: 'none', borderRadius: 8, color: '#F4F1EA', fontSize: 13 }}
                labelStyle={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono', fontSize: 11 }}
              />
              <Area type="monotone" dataKey="health" stroke="#7A8B72" fill="url(#healthGrad)" strokeWidth={2} name="Health Score" />
              <Area type="monotone" dataKey="failProb" stroke="#A63D32" fill="url(#riskGrad)" strokeWidth={2} name="Risk %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Critical Machines Table */}
      {criticalCount + warningCount > 0 && (
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
                <th>Type</th>
                <th>Status</th>
                <th>Health</th>
                <th>Fail Prob</th>
                <th>RUL</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {machines
                .filter(m => ['CRITICAL', 'WARNING'].includes((m.status || '').toUpperCase()))
                .map(m => (
                <tr key={m.machine_id}>
                  <td className="mono-cell">{m.machine_id}</td>
                  <td>{m.machine_type || '—'}</td>
                  <td>
                    <span className={`status-badge ${(m.status || '').toLowerCase()}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="mono-cell">{m.health_score}</td>
                  <td className="mono-cell" style={{ color: m.failure_probability > 0.5 ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                    {(m.failure_probability * 100).toFixed(1)}%
                  </td>
                  <td className="mono-cell">{m.rul} cycles</td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => navigate(`/machine/${m.machine_id}`)}
                    >
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
