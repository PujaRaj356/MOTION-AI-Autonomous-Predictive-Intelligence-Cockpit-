import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Server, HeartPulse, Clock, FlaskConical,
  History, Wrench, BarChart3, Activity, Camera
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', index: '01' },
  { to: '/machines', icon: Server, label: 'Machines', index: '02' },
  { to: '/predict', icon: HeartPulse, label: 'Health Prediction', index: '03' },
  { to: '/rul', icon: Clock, label: 'RUL Prediction', index: '04' },
  { to: '/simulation', icon: FlaskConical, label: 'What-If Simulation', index: '05' },
  { to: '/inspection', icon: Camera, label: 'Visual Inspection', index: '06' },
  { to: '/history', icon: History, label: 'Prediction History', index: '07' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance', index: '08' },
  { to: '/metrics', icon: BarChart3, label: 'Model Evaluation', index: '09' },
];

export default function ArchitecturalSidebar({ systemHealth }) {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>Predictive <span>AI</span></h1>
        <div className="sidebar-brand-sub">Maintenance Intelligence</div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              data-label={item.label}
            >
              <span className="link-index">{item.index}</span>
              <Icon className="link-icon" size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-status">
          <span className={`status-dot ${systemHealth?.ai_engine === 'ONLINE' ? 'online' : 'offline'}`} />
          <span>AI Engine {systemHealth?.ai_engine || 'Loading...'}</span>
        </div>
        <div className="sidebar-status">
          <span className={`status-dot ${systemHealth?.mongodb_connected ? 'online' : 'warning'}`} />
          <span>{systemHealth?.mongodb_connected ? 'MongoDB' : 'FileStore'}</span>
        </div>
        <div className="sidebar-status" style={{ opacity: 0.4 }}>
          <Activity size={10} />
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
