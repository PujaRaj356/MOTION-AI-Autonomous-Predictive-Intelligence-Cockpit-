import React from 'react';

export default function HealthGauge({ score, size = 180 }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius * 0.75; // 270 deg arc
  const offset = circumference - (score / 100) * circumference;

  const getColor = (val) => {
    if (val <= 30) return 'var(--accent-red)';
    if (val <= 60) return 'var(--accent-amber)';
    return 'var(--accent-sage)';
  };

  const getLabel = (val) => {
    if (val <= 30) return 'CRITICAL';
    if (val <= 60) return 'WARNING';
    return 'HEALTHY';
  };

  const color = getColor(score);

  return (
    <div className="health-gauge-container">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-secondary)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={0}
          transform={`rotate(135 ${size / 2} ${size / 2})`}
        />
        {/* Foreground arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(135 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease' }}
        />
        <text
          x={size / 2}
          y={size / 2 - 4}
          textAnchor="middle"
          className="health-gauge-value"
          fill="var(--text-primary)"
          style={{ fontFamily: 'var(--font-display)', fontSize: `${size * 0.18}px`, fontWeight: 700 }}
        >
          {score}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 18}
          textAnchor="middle"
          fill={color}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px' }}
        >
          {getLabel(score)}
        </text>
      </svg>
    </div>
  );
}
