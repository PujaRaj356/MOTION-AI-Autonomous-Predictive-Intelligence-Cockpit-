import React, { useState, useEffect } from 'react';
import { getMaintenance } from '../services/api';
import { Wrench, AlertTriangle, Clock } from 'lucide-react';

export default function Maintenance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMaintenance()
      .then(res => setRecords(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-eyebrow">Operations</div>
        <h2>Maintenance Work Orders</h2>
        <p className="page-header-desc">
          AI-generated maintenance recommendations and engineering work orders
        </p>
      </div>

      {records.length > 0 ? (
        <div className="stack">
          {records.map((r, i) => (
            <div key={i} className={`work-order ${(r.priority || '').toLowerCase()}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <span className="work-order-id">{r.id}</span>
                  <div className="work-order-title">{r.title}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`status-badge ${r.priority === 'HIGH' ? 'critical' : r.priority === 'MEDIUM' ? 'warning' : 'healthy'}`}>
                    {r.priority === 'HIGH' && <AlertTriangle size={10} />}
                    {r.priority}
                  </span>
                  <span className={`status-badge ${r.status === 'OPEN' ? 'warning' : 'healthy'}`}>
                    {r.status}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-orange)', fontWeight: 600 }}>
                  {r.machine_id}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                  <Clock size={10} />
                  {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                </span>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '1.5px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Issue
                </div>
                <div className="work-order-desc">{r.issue}</div>
              </div>

              <div style={{ background: 'var(--bg-surface-alt)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-secondary)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '1.5px', color: 'var(--accent-sage)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Recommended Action
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {r.recommended_action}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, textAlign: 'center' }}>
          <Wrench size={48} style={{ color: 'var(--border-light)', marginBottom: 16 }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: 6 }}>No Work Orders</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', maxWidth: 320 }}>
            Work orders are generated automatically when the AI engine detects maintenance needs.
          </div>
        </div>
      )}
    </div>
  );
}
