import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Cpu, Database, Volume2, VolumeX, Terminal, Gauge } from 'lucide-react';

export default function HeadsUpDisplay({ systemHealth, machines, activeMode, audioEnabled, setAudioEnabled }) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0').slice(0, 2));
    };
    const timer = setInterval(updateTime, 100);
    return () => clearInterval(timer);
  }, []);

  const criticalCount = machines.filter(m => (m.status || '').toUpperCase() === 'CRITICAL').length;
  const warningCount = machines.filter(m => (m.status || '').toUpperCase() === 'WARNING').length;
  const avgHealth = machines.length
    ? Math.round(machines.reduce((acc, m) => acc + (m.health_score || 0), 0) / machines.length)
    : 100;

  return (
    <header className="hud-header">
      {/* Brand & Mission Group */}
      <div className="hud-brand">
        <div className="hud-logo-icon">M</div>
        <div className="hud-title-group">
          <div className="hud-title">MOTION <span>//</span> AI COCKPIT</div>
          <div className="hud-subtitle">Autonomous Predictive Intelligence</div>
        </div>
      </div>

      {/* Center Real-Time Telemetry Stream Ticker */}
      <div className="hud-metrics-ticker">
        {/* Fleet Health Gauge */}
        <div className="hud-ticker-item">
          <span className="hud-ticker-label">Global Fleet Health</span>
          <div className="hud-ticker-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`pulse-dot ${avgHealth <= 30 ? 'red' : avgHealth <= 60 ? 'amber' : 'mint'}`} />
            <span className={avgHealth <= 30 ? 'red' : avgHealth <= 60 ? 'amber' : 'mint'}>{avgHealth}%</span>
          </div>
        </div>

        {/* Inference Latency */}
        <div className="hud-ticker-item">
          <span className="hud-ticker-label">Inference Engine</span>
          <div className="hud-ticker-value cyan">
            <Cpu size={12} style={{ display: 'inline', marginRight: 4 }} />
            XGB+LSTM (14ms)
          </div>
        </div>

        {/* Critical Alerts Counter */}
        <div className="hud-ticker-item">
          <span className="hud-ticker-label">Active Hazards</span>
          <div className="hud-ticker-value" style={{ color: criticalCount > 0 ? 'var(--signal-red)' : 'var(--text-dim)' }}>
            <ShieldAlert size={12} style={{ display: 'inline', marginRight: 4 }} />
            {criticalCount} CRITICAL / {warningCount} WARN
          </div>
        </div>

        {/* Database & Pipeline Status */}
        <div className="hud-ticker-item">
          <span className="hud-ticker-label">Telemetry Pipeline</span>
          <div className="hud-ticker-value mint">
            <Database size={12} style={{ display: 'inline', marginRight: 4 }} />
            {systemHealth?.mongodb_connected ? 'MongoDB Native' : 'FileStore Synced'}
          </div>
        </div>
      </div>

      {/* Right Controls: Millisecond Clock & Sound Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          className="dock-btn"
          onClick={() => setAudioEnabled(!audioEnabled)}
          title={audioEnabled ? "Mute Mission Audio" : "Enable Telemetry Sounds"}
          style={{ padding: '6px 10px' }}
        >
          {audioEnabled ? <Volume2 size={14} color="var(--signal-cyan)" /> : <VolumeX size={14} color="var(--text-dim)" />}
          <span className="dock-key">SND</span>
        </button>

        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: 'var(--signal-cyan)',
          background: 'var(--bg-panel-inset)',
          padding: '4px 10px',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xs)',
          letterSpacing: '1px'
        }}>
          {timeStr || '00:00:00.00'}
        </div>
      </div>
    </header>
  );
}
