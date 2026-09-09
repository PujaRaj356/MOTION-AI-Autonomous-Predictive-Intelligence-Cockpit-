import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity, ShieldCheck, AlertTriangle, Flame, Disc, Sliders, Zap } from 'lucide-react';

export default function FloorSchematicDeck({ machines, onSelectMachine, onQuickInject }) {
  const [selectedId, setSelectedId] = useState(machines[0]?.machine_id || 'M-101');
  const selectedMachine = machines.find(m => m.machine_id === selectedId) || machines[0] || {};

  // Mock telemetry buffer for real-time oscilloscope
  const telemetryData = [
    { time: 'T-20s', temp: (selectedMachine.air_temperature || 25) - 1.2, rpm: (selectedMachine.rpm || 1500) - 30, torque: (selectedMachine.torque || 40) - 2 },
    { time: 'T-15s', temp: (selectedMachine.air_temperature || 25) - 0.5, rpm: (selectedMachine.rpm || 1500) + 15, torque: (selectedMachine.torque || 40) + 1 },
    { time: 'T-10s', temp: (selectedMachine.air_temperature || 25) + 0.8, rpm: (selectedMachine.rpm || 1500) - 10, torque: (selectedMachine.torque || 40) - 0.5 },
    { time: 'T-5s',  temp: (selectedMachine.air_temperature || 25) + 1.5, rpm: (selectedMachine.rpm || 1500) + 40, torque: (selectedMachine.torque || 40) + 3 },
    { time: 'NOW',   temp: (selectedMachine.air_temperature || 25), rpm: (selectedMachine.rpm || 1500), torque: (selectedMachine.torque || 40) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Deck: 2D Spatial Floor Bay Grid */}
      <div className="cockpit-panel">
        <div className="panel-header">
          <span className="panel-title">
            <Activity size={14} /> Manufacturing Floor Bay Topology // Sector Alpha
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
            SELECT NODE TO INSPECT TELEMETRY
          </span>
        </div>

        <div className="floor-grid">
          {machines.map((m) => {
            const isSelected = m.machine_id === selectedId;
            const status = (m.status || 'HEALTHY').toUpperCase();
            const statusClass = status === 'CRITICAL' ? 'critical' : status === 'WARNING' ? 'warning' : 'healthy';

            return (
              <div
                key={m.machine_id}
                className={`bay-card ${statusClass}`}
                style={isSelected ? { borderColor: 'var(--signal-cyan)', background: 'var(--bg-panel-hover)' } : {}}
                onClick={() => {
                  setSelectedId(m.machine_id);
                  if (onSelectMachine) onSelectMachine(m);
                }}
              >
                <div className="bay-header">
                  <div>
                    <div className="bay-id">{m.machine_id}</div>
                    <div className="bay-type">{m.name || 'CNC Lathe Unit'}</div>
                  </div>
                  <span className={`hud-badge ${status === 'CRITICAL' ? 'red' : status === 'WARNING' ? 'amber' : 'mint'}`}>
                    {status}
                  </span>
                </div>

                {/* Circular Mini Health Gauge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Health Index
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: m.health_score <= 30 ? 'var(--signal-red)' : m.health_score <= 60 ? 'var(--signal-amber)' : 'var(--signal-mint)'
                    }}>
                      {m.health_score} <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>/100</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Est. RUL
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--signal-cyan)' }}>
                      {m.rul} <span style={{ fontSize: '0.65rem' }}>cyc</span>
                    </div>
                  </div>
                </div>

                {/* Telemetry metrics inside card */}
                <div className="bay-telemetry-grid">
                  <div className="bay-telemetry-item">
                    <span className="bay-telemetry-label">Air Temp</span>
                    <span className="bay-telemetry-val">{m.air_temperature}°C</span>
                  </div>
                  <div className="bay-telemetry-item">
                    <span className="bay-telemetry-label">RPM</span>
                    <span className="bay-telemetry-val">{m.rpm}</span>
                  </div>
                  <div className="bay-telemetry-item">
                    <span className="bay-telemetry-label">Torque</span>
                    <span className="bay-telemetry-val">{m.torque} Nm</span>
                  </div>
                  <div className="bay-telemetry-item">
                    <span className="bay-telemetry-label">Tool Wear</span>
                    <span className="bay-telemetry-val">{m.tool_wear} min</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Deck: Selected Node Detailed Diagnostic & Telemetry Stream */}
      <div className="cockpit-grid-2">
        {/* Real-Time Sensor Stream Oscilloscope */}
        <div className="cockpit-panel">
          <div className="panel-header">
            <span className="panel-title">
              <Zap size={14} /> Telemetry Oscilloscope // {selectedMachine.machine_id}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--signal-cyan)' }}>
                ● Temp
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--signal-mint)' }}>
                ● RPM
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--signal-amber)' }}>
                ● Torque
              </span>
            </div>
          </div>

          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData}>
                <defs>
                  <linearGradient id="tempGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#38BDF8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="var(--border-subtle)" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-dim)', fontFamily: 'JetBrains Mono' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-dim)', fontFamily: 'JetBrains Mono' }} />
                <Tooltip
                  contentStyle={{ background: '#090C11', borderColor: '#2A364D', borderRadius: 6, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                />
                <Area type="monotone" dataKey="temp" stroke="#38BDF8" fill="url(#tempGlow)" strokeWidth={2} name="Temp °C" />
                <Area type="monotone" dataKey="torque" stroke="#FFB020" fill="none" strokeWidth={1.5} name="Torque Nm" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Node Health Dossier & Direct Actions */}
        <div className="cockpit-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="panel-header">
              <span className="panel-title">Diagnostic Summary // {selectedMachine.machine_id}</span>
              <span className={`hud-badge ${(selectedMachine.status || 'HEALTHY').toUpperCase() === 'CRITICAL' ? 'red' : 'mint'}`}>
                {selectedMachine.status || 'HEALTHY'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8 }}>
              <div style={{
                background: 'var(--bg-panel-inset)',
                padding: '12px 18px',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center'
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-dim)' }}>FAIL PROBABILITY</div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  color: selectedMachine.failure_probability > 0.5 ? 'var(--signal-red)' : 'var(--signal-mint)'
                }}>
                  {((selectedMachine.failure_probability || 0.08) * 100).toFixed(1)}%
                </div>
              </div>

              <div style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-mid)', lineHeight: 1.5 }}>
                Operating cycle count is at <span style={{ color: 'var(--text-pure)', fontWeight: 600 }}>{selectedMachine.tool_wear || 100} min</span> tool load.
                Sequential LSTM forecasts <span style={{ color: 'var(--signal-cyan)', fontWeight: 600 }}>{selectedMachine.rul || 120} cycles</span> of remaining useful life.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              className="btn-hud"
              style={{ flex: 1 }}
              onClick={() => onQuickInject && onQuickInject(selectedMachine)}
            >
              <Sliders size={13} /> Load into Neural Lab
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
