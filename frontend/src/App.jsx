import React, { useState, useEffect } from 'react';
import HeadsUpDisplay from './components/cockpit/HeadsUpDisplay';
import CommandDock from './components/cockpit/CommandDock';
import FloorSchematicDeck from './components/cockpit/FloorSchematicDeck';
import NeuralDiagnosticLab from './components/cockpit/NeuralDiagnosticLab';
import DigitalTwinSandbox from './components/cockpit/DigitalTwinSandbox';
import DispatchTerminal from './components/cockpit/DispatchTerminal';
import BenchmarkStudio from './components/cockpit/BenchmarkStudio';
import { getMachines, getHealth } from './services/api';
import './styles/theme.css';

function App() {
  const [activeMode, setActiveMode] = useState('deck');
  const [machines, setMachines] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Load initial fleet data & system health
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut listener (1-5 for modes)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === '1') setActiveMode('deck');
      if (e.key === '2') setActiveMode('neural');
      if (e.key === '3') setActiveMode('twin');
      if (e.key === '4') setActiveMode('dispatch');
      if (e.key === '5') setActiveMode('benchmarks');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadData = async () => {
    try {
      const [mRes, hRes] = await Promise.all([
        getMachines(),
        getHealth()
      ]);
      setMachines(mRes.data || []);
      setSystemHealth(hRes.data || {});
      if (!selectedMachine && mRes.data?.length > 0) {
        setSelectedMachine(mRes.data[0]);
      }
    } catch (err) {
      console.warn('Backend sync warning:', err);
    }
  };

  const handleQuickInject = (machine) => {
    setSelectedMachine(machine);
    setActiveMode('neural');
  };

  return (
    <div className="cockpit-viewport">
      {/* Top Precision Heads-Up Display */}
      <HeadsUpDisplay
        systemHealth={systemHealth}
        machines={machines}
        activeMode={activeMode}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
      />

      {/* Main Mission Control Workspace */}
      <main className="cockpit-body">
        {activeMode === 'deck' && (
          <FloorSchematicDeck
            machines={machines}
            onSelectMachine={setSelectedMachine}
            onQuickInject={handleQuickInject}
          />
        )}

        {activeMode === 'neural' && (
          <NeuralDiagnosticLab
            initialMachine={selectedMachine || machines[0]}
          />
        )}

        {activeMode === 'twin' && (
          <DigitalTwinSandbox />
        )}

        {activeMode === 'dispatch' && (
          <DispatchTerminal />
        )}

        {activeMode === 'benchmarks' && (
          <BenchmarkStudio />
        )}
      </main>

      {/* Bottom Floating HUD Command Dock */}
      <CommandDock
        activeMode={activeMode}
        setActiveMode={setActiveMode}
      />
    </div>
  );
}

export default App;
