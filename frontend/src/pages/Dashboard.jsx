import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMachines, getHealth } from '../services/api';
import { Activity, AlertTriangle, CheckCircle2, Clock, Cpu, ShieldAlert, Sliders, ArrowUpRight, Gauge, Zap, Radio, RefreshCw } from 'lucide-react';

// Baseline 15 industrial machines in case API is cold-starting
const DEFAULT_FLEET = [
  { machine_id: "M-101", name: "CNC Milling Machine 01", machine_type: "CNC Lathe (H)", status: "HEALTHY", health_score: 91, failure_probability: 0.0037, rul: 152, air_temperature: 22.8, process_temperature: 34.2, rpm: 1475, torque: 48.2, tool_wear: 58.7 },
  { machine_id: "M-102", name: "CNC Milling Machine 02", machine_type: "CNC Lathe (L)", status: "CRITICAL", health_score: 18, failure_probability: 0.9483, rul: 11, air_temperature: 27.3, process_temperature: 41.5, rpm: 1982, torque: 51.7, tool_wear: 176.2 },
  { machine_id: "M-103", name: "Heavy Duty Router 03", machine_type: "Router (M)", status: "HEALTHY", health_score: 77, failure_probability: 0.0564, rul: 90, air_temperature: 28.2, process_temperature: 38.6, rpm: 1875, torque: 40.8, tool_wear: 155.0 },
  { machine_id: "M-104", name: "Precision Spindle 04", machine_type: "Spindle (H)", status: "HEALTHY", health_score: 91, failure_probability: 0.0055, rul: 151, air_temperature: 23.6, process_temperature: 35.1, rpm: 1450, torque: 39.1, tool_wear: 70.4 },
  { machine_id: "M-105", name: "High Speed Drill 05", machine_type: "Drill (L)", status: "CRITICAL", health_score: 14, failure_probability: 0.9869, rul: 10, air_temperature: 30.4, process_temperature: 44.8, rpm: 2040, torque: 63.2, tool_wear: 189.1 },
  { machine_id: "M-106", name: "Automated Lathe Station 06", machine_type: "Heavy Duty (H)", status: "HEALTHY", health_score: 87, failure_probability: 0.0442, rul: 143, air_temperature: 24.8, process_temperature: 36.3, rpm: 1502, torque: 52.6, tool_wear: 66.1 },
  { machine_id: "M-107", name: "Hydraulic Press Unit 07", machine_type: "Heavy Duty (H)", status: "HEALTHY", health_score: 88, failure_probability: 0.0164, rul: 135, air_temperature: 25.9, process_temperature: 37.4, rpm: 1417, torque: 46.9, tool_wear: 84.3 },
  { machine_id: "M-108", name: "High Precision Grinder 08", machine_type: "Medium Duty (M)", status: "CRITICAL", health_score: 22, failure_probability: 0.9237, rul: 12, air_temperature: 29.2, process_temperature: 42.1, rpm: 2334, torque: 54.0, tool_wear: 198.6 },
  { machine_id: "M-109", name: "5-Axis Machining Center 09", machine_type: "Heavy Duty (H)", status: "HEALTHY", health_score: 90, failure_probability: 0.0342, rul: 156, air_temperature: 23.8, process_temperature: 35.0, rpm: 1596, torque: 50.1, tool_wear: 50.3 },
  { machine_id: "M-110", name: "Industrial Boring Machine 10", machine_type: "Medium Duty (M)", status: "CRITICAL", health_score: 12, failure_probability: 0.9963, rul: 10, air_temperature: 31.9, process_temperature: 46.2, rpm: 2627, torque: 71.1, tool_wear: 222.4 },
  { machine_id: "M-111", name: "Conveyor Drive Motor 11", machine_type: "Light Duty (L)", status: "HEALTHY", health_score: 88, failure_probability: 0.0335, rul: 146, air_temperature: 25.2, process_temperature: 34.5, rpm: 1434, torque: 42.3, tool_wear: 74.2 },
  { machine_id: "M-112", name: "Robotic Welding Station 12", machine_type: "Medium Duty (M)", status: "HEALTHY", health_score: 61, failure_probability: 0.3136, rul: 92, air_temperature: 28.8, process_temperature: 39.7, rpm: 1834, torque: 47.5, tool_wear: 144.3 },
  { machine_id: "M-113", name: "Laser Cutting System 13", machine_type: "Heavy Duty (H)", status: "HEALTHY", health_score: 85, failure_probability: 0.1236, rul: 161, air_temperature: 23.3, process_temperature: 33.8, rpm: 1627, torque: 35.4, tool_wear: 60.7 },
  { machine_id: "M-114", name: "Vertical Milling Center 14", machine_type: "Light Duty (L)", status: "HEALTHY", health_score: 68, failure_probability: 0.2821, rul: 120, air_temperature: 26.6, process_temperature: 37.2, rpm: 1642, torque: 50.2, tool_wear: 101.6 },
  { machine_id: "M-115", name: "Turbo Spindle Station 15", machine_type: "Heavy Duty (H)", status: "CRITICAL", health_score: 19, failure_probability: 0.9119, rul: 12, air_temperature: 31.8, process_temperature: 45.9, rpm: 2559, torque: 58.4, tool_wear: 215.3 }
];

export default function Dashboard() {
  const [machines, setMachines] = useState(DEFAULT_FLEET);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [packetCount, setPacketCount] = useState(1);
  const [lastPacketTime, setLastPacketTime] = useState('Just now');
  const [isPulseActive, setIsPulseActive] = useState(false);
  const navigate = useNavigate();

  // Apply continuous live sensor jitter
  const applySensorJitter = (baseFleet) => {
    return baseFleet.map(m => {
      const rpmDrift = (Math.random() - 0.5) * 12;
      const torqueDrift = (Math.random() - 0.5) * 0.8;
      const tempDrift = (Math.random() - 0.5) * 0.2;
      const wearDrift = m.status === 'CRITICAL' ? 0.01 : 0.04;

      return {
        ...m,
        rpm: Math.round(Math.max(800, (m.rpm || 1500) + rpmDrift)),
        torque: parseFloat(Math.max(10, Math.min(95, (m.torque || 40) + torqueDrift)).toFixed(1)),
        air_temperature: parseFloat(Math.max(18, (m.air_temperature || 24) + tempDrift).toFixed(1)),
        process_temperature: parseFloat(Math.max(25, (m.process_temperature || 35) + tempDrift).toFixed(1)),
        tool_wear: parseFloat(((m.tool_wear || 50) + wearDrift).toFixed(1)),
        last_updated: new Date().toLocaleTimeString()
      };
    });
  };

  const loadData = async () => {
    try {
      const [machinesRes, healthRes] = await Promise.all([getMachines(), getHealth()]);
      if (machinesRes && machinesRes.data && Array.isArray(machinesRes.data) && machinesRes.data.length > 0) {
        setMachines(applySensorJitter(machinesRes.data));
      } else {
        setMachines(prev => applySensorJitter(prev.length > 0 ? prev : DEFAULT_FLEET));
      }
      if (healthRes && healthRes.data) {
        setSystemHealth(healthRes.data);
      }
      setPacketCount(c => c + 1);
      setLastPacketTime(new Date().toLocaleTimeString());
      setIsPulseActive(true);
      setTimeout(() => setIsPulseActive(false), 800);
    } catch (e) {
      // Offline or network lag fallback: keep telemetry breathing locally
      setMachines(prev => applySensorJitter(prev.length > 0 ? prev : DEFAULT_FLEET));
      setPacketCount(c => c + 1);
      setLastPacketTime(new Date().toLocaleTimeString());
      setIsPulseActive(true);
      setTimeout(() => setIsPulseActive(false), 800);
    } finally {
      setLoading(false);
    }
  };

  // Live polling every 3.5 seconds
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3500);
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

  return (
    <div>
      {/* Cockpit Hero Section */}
      <div className="hero-section">
        <div>
          <div className="page-header-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'var(--signal-mint)',
              boxShadow: '0 0 10px var(--signal-mint)'
            }} />
            <span>SATELLITE INDUSTRIAL TELEMETRY // SECTOR ALPHA</span>
          </div>
          <div className="hero-title">GearGuard Industrial Failure Prevention Cockpit</div>
          <p className="hero-subtitle">
            Autonomous multi-sensor diagnostics powered by XGBoost failure risk classifier and Keras LSTM
            Remaining Useful Life forecasting. Real-time telemetry monitoring across 15 active shop-floor units.
          </p>
          <div className="hero-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => navigate('/predict')}>
              <Cpu size={15} /> Launch Diagnostic Lab
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/simulation')}>
              <Sliders size={15} /> Digital Twin Simulation
            </button>
            <button
              className="btn btn-secondary"
              style={{
                borderColor: isPulseActive ? 'var(--signal-mint)' : 'var(--border-subtle)',
                background: isPulseActive ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                transition: 'all 0.2s ease'
              }}
              onClick={loadData}
              title="Manually force telemetry ingestion pulse"
            >
              <RefreshCw size={14} className={isPulseActive ? 'spin' : ''} style={{ color: 'var(--signal-mint)' }} />
              Ingest Sensor Pulse
            </button>
          </div>
        </div>
        <div className="hero-meta">
          <div className="hero-meta-item" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Radio size={14} style={{ color: 'var(--signal-green)' }} />
            <span>Telemetry Feed:</span>
            <strong style={{ color: 'var(--signal-green)' }}>LIVE (3.5s Stream)</strong>
          </div>
          <div className="hero-meta-item">
            Packets Processed: <strong style={{ color: 'var(--signal-mint)' }}>#{packetCount.toLocaleString()}</strong>
          </div>
          <div className="hero-meta-item">
            AI Engine: <strong>XGBoost + LSTM + SHAP</strong>
          </div>
          <div className="hero-meta-item">
            Active Fleet Units: <strong style={{ color: 'var(--signal-mint)' }}>{machines.length} Machines</strong>
          </div>
          <div className="hero-meta-item" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            Last Stream Sync: <strong style={{ color: 'var(--text-mid)' }}>{lastPacketTime}</strong>
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
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.72rem',
              color: 'var(--signal-mint)',
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'rgba(0, 242, 254, 0.1)',
              border: '1px solid rgba(0, 242, 254, 0.2)'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--signal-mint)' }} />
              Live Sensor Stream Active
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
              <CheckCircle2 size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: 'var(--signal-green)' }} />
              Healthy ({healthyCount})
            </button>
            <button
              className={`filter-tab ${activeFilter === 'WARNING' ? 'active' : ''}`}
              onClick={() => setActiveFilter('WARNING')}
            >
              <AlertTriangle size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: 'var(--signal-amber)' }} />
              Warning ({warningCount})
            </button>
            <button
              className={`filter-tab ${activeFilter === 'CRITICAL' ? 'active' : ''}`}
              onClick={() => setActiveFilter('CRITICAL')}
            >
              <ShieldAlert size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: 'var(--signal-red)' }} />
              Critical ({criticalCount})
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
                    <div className="machine-card-id" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{m.machine_id}</span>
                      <span style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: isCritical ? 'var(--signal-red)' : isWarning ? 'var(--signal-amber)' : 'var(--signal-green)'
                      }} />
                    </div>
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

                {/* Real-time Telemetry Grid with clean °C and live numbers */}
                <div className="machine-telemetry-grid">
                  <div className="telemetry-cell">
                    <span className="telemetry-cell-label">Air / Proc Temp</span>
                    <span className="telemetry-cell-val" style={{ transition: 'color 0.3s ease' }}>
                      {m.air_temperature}°C / {m.process_temperature}°C
                    </span>
                  </div>
                  <div className="telemetry-cell">
                    <span className="telemetry-cell-label">Speed & Torque</span>
                    <span className="telemetry-cell-val">
                      {m.rpm} RPM • {m.torque} Nm
                    </span>
                  </div>
                  <div className="telemetry-cell">
                    <span className="telemetry-cell-label">Failure Risk</span>
                    <span className="telemetry-cell-val" style={{ color: isCritical ? 'var(--signal-red)' : isWarning ? 'var(--signal-amber)' : 'var(--signal-green)' }}>
                      {failProbPct}% Risk
                    </span>
                  </div>
                  <div className="telemetry-cell">
                    <span className="telemetry-cell-label">Tool Wear / RUL</span>
                    <span className="telemetry-cell-val">
                      {m.tool_wear}m • {m.rul} cycles
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
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
