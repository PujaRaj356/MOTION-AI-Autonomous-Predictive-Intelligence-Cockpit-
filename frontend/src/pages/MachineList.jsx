import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMachines } from '../services/api';
import { Search, Filter } from 'lucide-react';

export default function MachineList() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    getMachines()
      .then(res => setMachines(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = machines.filter(m => {
    const matchSearch = (m.machine_id + ' ' + (m.name || '') + ' ' + (m.machine_type || ''))
      .toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || (m.status || '').toUpperCase() === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-eyebrow">Fleet</div>
        <h2>Machine Registry</h2>
        <p className="page-header-desc">Monitored assets and their current operating state</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search machines..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>
        {['ALL', 'HEALTHY', 'WARNING', 'CRITICAL'].map(f => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Health</th>
              <th>Fail Probability</th>
              <th>RUL</th>
              <th>Temp (°C)</th>
              <th>RPM</th>
              <th>Torque (Nm)</th>
              <th>Tool Wear</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.machine_id} onClick={() => navigate(`/machine/${m.machine_id}`)} style={{ cursor: 'pointer' }}>
                <td className="mono-cell" style={{ fontWeight: 600 }}>{m.machine_id}</td>
                <td>{m.name || '—'}</td>
                <td style={{ fontSize: '0.8rem' }}>{m.machine_type || '—'}</td>
                <td>
                  <span className={`status-badge ${(m.status || '').toLowerCase()}`}>{m.status}</span>
                </td>
                <td className="mono-cell">{m.health_score}</td>
                <td className="mono-cell" style={{ color: m.failure_probability > 0.5 ? 'var(--accent-red)' : 'inherit' }}>
                  {(m.failure_probability * 100).toFixed(1)}%
                </td>
                <td className="mono-cell">{m.rul} cyc</td>
                <td className="mono-cell">{m.air_temperature}°</td>
                <td className="mono-cell">{m.rpm}</td>
                <td className="mono-cell">{m.torque}</td>
                <td className="mono-cell">{m.tool_wear} min</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
            No machines found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
}
