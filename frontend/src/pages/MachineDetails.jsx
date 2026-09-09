import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMachineDetails } from '../services/api';
import HealthGauge from '../components/common/HealthGauge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Thermometer, Gauge, Cog, Timer } from 'lucide-react';

export default function MachineDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMachineDetails(id)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;
  if (!data) return <div style={{ padding: 40, textAlign: 'center' }}>Machine not found</div>;

  const m = data.machine;
  const telemetry = data.telemetry || [];

  return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back
      </button>

      <div className="page-header">
        <div className="page-header-eyebrow">Machine Dossier</div>
        <h2>{m.machine_id} — {m.name || 'Machine'}</h2>
        <p className="page-header-desc">{m.machine_type || 'Industrial Machine'} • Last Updated: {m.last_updated || '—'}</p>
      </div>

      {/* Top Overview */}
      <div className="grid-sidebar" style={{ marginBottom: 24 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span className="card-title" style={{ marginBottom: 8 }}>Health Index</span>
          <HealthGauge score={m.health_score || 0} size={170} />
          <span className={`status-badge ${(m.status || '').toLowerCase()}`} style={{ marginTop: 8 }}>{m.status}</span>
        </div>

        <div className="card">
          <span className="card-title">Operating Parameters</span>
          <div className="metrics-grid" style={{ marginTop: 16 }}>
            <div className="metric-card orange">
              <div className="metric-label"><Thermometer size={10} style={{ marginRight: 4 }} />Air Temp</div>
              <div className="metric-value">{m.air_temperature}<span className="metric-unit">°C</span></div>
            </div>
            <div className="metric-card orange">
              <div className="metric-label"><Thermometer size={10} style={{ marginRight: 4 }} />Process Temp</div>
              <div className="metric-value">{m.process_temperature}<span className="metric-unit">°C</span></div>
            </div>
            <div className="metric-card sage">
              <div className="metric-label"><Gauge size={10} style={{ marginRight: 4 }} />RPM</div>
              <div className="metric-value">{m.rpm}</div>
            </div>
            <div className="metric-card amber">
              <div className="metric-label"><Cog size={10} style={{ marginRight: 4 }} />Torque</div>
              <div className="metric-value">{m.torque}<span className="metric-unit">Nm</span></div>
            </div>
            <div className="metric-card red">
              <div className="metric-label"><Timer size={10} style={{ marginRight: 4 }} />Tool Wear</div>
              <div className="metric-value">{m.tool_wear}<span className="metric-unit">min</span></div>
            </div>
            <div className="metric-card sage">
              <div className="metric-label">RUL Estimate</div>
              <div className="metric-value">{m.rul}<span className="metric-unit">cyc</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Chart */}
      {telemetry.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <span className="card-title">Sensor Telemetry History</span>
          <div style={{ height: 220, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetry}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                <Tooltip contentStyle={{ background: '#20221F', border: 'none', borderRadius: 8, color: '#F4F1EA', fontSize: 13 }} />
                <Line type="monotone" dataKey="temperature" stroke="#C65D32" strokeWidth={2} dot={false} name="Temp °C" />
                <Line type="monotone" dataKey="rpm" stroke="#7A8B72" strokeWidth={2} dot={false} name="RPM" />
                <Line type="monotone" dataKey="torque" stroke="#D69A3A" strokeWidth={2} dot={false} name="Torque" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-primary" onClick={() => navigate('/predict')}>Run Health Check</button>
        <button className="btn btn-secondary" onClick={() => navigate('/simulation')}>What-If Simulation</button>
        <button className="btn btn-secondary" onClick={() => navigate('/rul')}>RUL Analysis</button>
      </div>
    </div>
  );
}
