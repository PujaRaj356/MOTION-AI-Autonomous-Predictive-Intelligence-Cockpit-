import React from 'react';
import { LayoutGrid, Cpu, GitCompare, Wrench, BarChart2 } from 'lucide-react';

const modes = [
  { id: 'deck', key: '1', label: 'Fleet Deck', icon: LayoutGrid },
  { id: 'neural', key: '2', label: 'Neural Lab', icon: Cpu },
  { id: 'twin', key: '3', label: 'Twin Sandbox', icon: GitCompare },
  { id: 'dispatch', key: '4', label: 'Dispatch Strip', icon: Wrench },
  { id: 'benchmarks', key: '5', label: 'Model Metrics', icon: BarChart2 },
];

export default function CommandDock({ activeMode, setActiveMode }) {
  return (
    <div className="command-dock-wrapper">
      <nav className="command-dock">
        {modes.map(mode => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              className={`dock-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveMode(mode.id)}
            >
              <Icon size={14} />
              <span>{mode.label}</span>
              <span className="dock-key">{mode.key}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
