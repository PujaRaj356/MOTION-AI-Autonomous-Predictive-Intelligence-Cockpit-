import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ArchitecturalSidebar from './components/layout/ArchitecturalSidebar';
import Dashboard from './pages/Dashboard';
import MachineList from './pages/MachineList';
import MachineDetails from './pages/MachineDetails';
import HealthPrediction from './pages/HealthPrediction';
import RulPrediction from './pages/RulPrediction';
import WhatIfLab from './pages/WhatIfLab';
import PredictionHistory from './pages/PredictionHistory';
import Maintenance from './pages/Maintenance';
import ModelEvaluation from './pages/ModelEvaluation';
import VisualInspection from './pages/VisualInspection';
import { getHealth } from './services/api';

export default function App() {
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    const load = () => getHealth().then(r => setSystemHealth(r.data)).catch(() => {});
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <div className="aurora-bg">
        <div className="aurora-blob aurora-blob-1"></div>
        <div className="aurora-blob aurora-blob-2"></div>
        <div className="aurora-blob aurora-blob-3"></div>
      </div>
      <div className="app-layout">
        <ArchitecturalSidebar systemHealth={systemHealth} />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/machines" element={<MachineList />} />
            <Route path="/machine/:id" element={<MachineDetails />} />
            <Route path="/predict" element={<HealthPrediction />} />
            <Route path="/rul" element={<RulPrediction />} />
            <Route path="/simulation" element={<WhatIfLab />} />
            <Route path="/history" element={<PredictionHistory />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/metrics" element={<ModelEvaluation />} />
            <Route path="/inspection" element={<VisualInspection />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
