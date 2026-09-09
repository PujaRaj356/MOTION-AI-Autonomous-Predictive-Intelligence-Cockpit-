import React from 'react';

export default function ShapBarChart({ contributions }) {
  if (!contributions || contributions.length === 0) return null;

  const maxAbs = Math.max(...contributions.map(c => Math.abs(c.shap_value)), 0.01);

  return (
    <div style={{ width: '100%' }}>
      {contributions.map((c, i) => {
        const pct = Math.min((Math.abs(c.shap_value) / maxAbs) * 45, 45);
        const isPositive = c.shap_value > 0;

        return (
          <div key={i} className="shap-bar-row">
            <span className="shap-bar-label">{c.feature}</span>
            <div className="shap-bar-track">
              {/* Center line */}
              <div style={{
                position: 'absolute', left: '50%', top: 0, bottom: 0,
                width: '1px', background: 'var(--border-medium)'
              }} />
              <div
                className={`shap-bar-fill ${isPositive ? 'positive' : 'negative'}`}
                style={{
                  width: `${pct}%`,
                  ...(isPositive ? { left: '50%' } : { right: '50%', left: 'auto' })
                }}
              />
            </div>
            <span className="shap-bar-value" style={{
              color: isPositive ? 'var(--accent-red)' : 'var(--accent-sage)'
            }}>
              {isPositive ? '+' : ''}{c.shap_value.toFixed(3)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
