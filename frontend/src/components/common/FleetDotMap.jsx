import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function FleetDotMap({ machines }) {
  const navigate = useNavigate();

  if (!machines || machines.length === 0) return null;

  return (
    <div className="fleet-dot-map">
      {machines.map((m, i) => {
        const status = (m.status || 'HEALTHY').toLowerCase();
        const statusClass = status === 'critical' ? 'critical' : status === 'warning' ? 'warning' : 'healthy';

        return (
          <div
            key={m.machine_id || i}
            className={`fleet-dot ${statusClass}`}
            title={`${m.machine_id} — ${m.name || ''} — Health: ${m.health_score}`}
            onClick={() => navigate(`/machine/${m.machine_id}`)}
          >
            {(m.machine_id || '').replace('M-', '')}
          </div>
        );
      })}
    </div>
  );
}
