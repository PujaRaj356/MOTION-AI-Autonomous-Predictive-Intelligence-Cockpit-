import React, { useState, useRef, useCallback, useEffect } from 'react';
import { runVisualInspection, getMachines } from '../services/api';
import { Camera, Upload, Scan, Wrench, AlertTriangle, CheckCircle, RefreshCw, Droplets, Layers, ShieldCheck } from 'lucide-react';

const MACHINE_TYPES = [
  { 
    id: 'CNC', 
    label: 'CNC Machine', 
    component: 'Cutting Tool', 
    active: true, 
    desc: 'Tool wear, edge chipping & flank degradation',
    icon: Wrench,
    defaultMachine: 'M-101'
  },
  { 
    id: 'CONVEYOR', 
    label: 'Conveyor Belt', 
    component: 'Belt Assembly', 
    active: true, 
    desc: 'Surface tears, cracks & alignment tracking',
    icon: Layers,
    defaultMachine: 'M-111'
  },
  { 
    id: 'HYDRAULIC', 
    label: 'Hydraulic Equipment', 
    component: 'Hydraulic Assembly', 
    active: true, 
    desc: 'Oil leakage, hose damage & seal failure',
    icon: Droplets,
    defaultMachine: 'M-107'
  },
];

export default function VisualInspection() {
  const [machineType, setMachineType] = useState('CNC');
  const [machineId, setMachineId] = useState('M-101');
  const [machines, setMachines] = useState([]);

  useEffect(() => {
    getMachines()
      .then(res => {
        if (res.data && res.data.length > 0) {
          setMachines(res.data);
          setMachineId(res.data[0].machine_id);
        }
      })
      .catch(console.error);
  }, []);

  const [mode, setMode] = useState('camera'); // camera | upload
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const handleSelectMachineType = (typeId) => {
    setMachineType(typeId);
    setResult(null);
    if (machines.length > 0) {
      const matched = machines.find(m => {
        const name = (m.name || '').toLowerCase();
        if (typeId === 'CONVEYOR') return name.includes('conveyor') || m.machine_id === 'M-111';
        if (typeId === 'HYDRAULIC') return name.includes('hydraulic') || name.includes('press') || m.machine_id === 'M-107';
        return name.includes('cnc') || name.includes('lathe') || name.includes('milling') || m.machine_id === 'M-101';
      });
      if (matched) {
        setMachineId(matched.machine_id);
      }
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Ensure stream tracks are attached when video element mounts in the DOM
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => {
        console.warn('Video play interrupted or auto-play prevented:', err);
      });
    }
  }, [cameraActive]);

  // Clean up tracks on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    stopCamera();
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
      streamRef.current = stream;
      setCameraActive(true);
      setPreview(null);
      setResult(null);
    } catch (err) {
      console.error('Camera initialization failed:', err);
      setError('Camera access denied or unavailable. Please grant camera permission in your browser or use image upload.');
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const w = video.videoWidth || video.clientWidth || 640;
    const h = video.videoHeight || video.clientHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPreview(dataUrl);
    stopCamera();
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      setResult(null);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const loadPresetImage = async (url) => {
    try {
      stopCamera();
      setError(null);
      setResult(null);
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Failed to load preset image:', err);
      setError('Failed to load preset sample image.');
    }
  };

  const runInspection = async () => {
    if (!preview) {
      setError('Capture or upload an image first.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await runVisualInspection({
        machine_id: machineId,
        machine_type: machineType,
        image_base64: preview,
      });
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Inspection failed. Ensure the backend is running.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const conditionColor = (condition) => {
    if (condition?.includes('SEVERE') || condition?.includes('CRITICAL')) return 'var(--accent-red)';
    if (condition?.includes('WARNING') || condition?.includes('MODERATE')) return 'var(--accent-amber)';
    return 'var(--accent-sage)';
  };

  const activeComponent = MACHINE_TYPES.find(t => t.id === machineType)?.component || 'Component';

  return (
    <div>
      <div className="page-header">
        <div className="page-header-eyebrow">Autonomous Computer Vision</div>
        <h2>Visual Defect Inspection Cockpit</h2>
        <p className="page-header-desc">
          Context-aware multi-modal optical diagnostic scanner for CNC tool wear, conveyor belt surface tracking, and hydraulic fluid leakage.
        </p>
      </div>

      {/* Machine Type Selection (All 3 Modules Fully Active) */}
      <div className="inspection-types">
        {MACHINE_TYPES.map(t => {
          const IconComponent = t.icon;
          const isSelected = machineType === t.id;
          return (
            <div
              key={t.id}
              className={`inspection-type-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelectMachineType(t.id)}
              style={{ cursor: 'pointer', transition: 'all 0.25s ease' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <IconComponent size={28} style={{ color: isSelected ? 'var(--signal-cyan)' : 'var(--text-secondary)' }} />
                {isSelected ? (
                  <span className="demo-badge" style={{ background: 'rgba(0, 240, 255, 0.15)', color: 'var(--signal-cyan)', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                    ACTIVE SCANNER
                  </span>
                ) : (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Ready</span>
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4, color: isSelected ? '#fff' : 'var(--text-secondary)' }}>
                {t.label}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                {t.desc}
              </div>
            </div>
          );
        })}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-sidebar">
        {/* Camera / Upload Panel */}
        <div className="stack">
          <div className="card">
            <span className="card-title">Inspection Target</span>
            <div className="input-group" style={{ marginTop: 12, marginBottom: 12 }}>
              <span className="input-label">Assigned Fleet Unit</span>
              <select className="input-field" value={machineId} onChange={e => setMachineId(e.target.value)}>
                {machines.length > 0 ? (
                  machines.map(m => (
                    <option key={m.machine_id} value={m.machine_id}>
                      {m.machine_id} — {m.name || 'Registered Machine'} ({m.machine_type || 'Industrial'})
                    </option>
                  ))
                ) : (
                  <option value="M-101">M-101 — CNC Milling Machine 01</option>
                )}
              </select>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Target Sub-assembly: <strong style={{ color: 'var(--signal-cyan)' }}>{activeComponent}</strong>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button className={`btn btn-sm ${mode === 'camera' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('camera')}>
                <Camera size={14} /> Live Optical Camera
              </button>
              <button className={`btn btn-sm ${mode === 'upload' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setMode('upload'); stopCamera(); }}>
                <Upload size={14} /> File Upload / Presets
              </button>
            </div>

            {mode === 'camera' ? (
              <>
                <div className="camera-viewport">
                  {preview ? (
                    <img src={preview} alt="Captured" />
                  ) : cameraActive ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted />
                      <div className="camera-overlay" />
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', gap: 10 }}>
                      <Camera size={44} />
                      <span style={{ fontSize: '0.82rem' }}>Optical sensor offline. Click below to activate.</span>
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {!cameraActive && !preview && (
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={startCamera}>
                      <Camera size={14} /> Open Camera
                    </button>
                  )}
                  {cameraActive && (
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={captureFrame}>
                      <Scan size={14} /> Capture Target Frame
                    </button>
                  )}
                  {preview && (
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setPreview(null); setResult(null); }}>
                      <RefreshCw size={14} /> Retake
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="camera-viewport">
                  {preview ? (
                    <img src={preview} alt="Uploaded" />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', gap: 10 }}>
                      <Upload size={44} />
                      <span style={{ fontSize: '0.82rem' }}>Drop inspection frame or select factory preset</span>
                    </div>
                  )}
                </div>
                <label className="btn btn-secondary" style={{ marginTop: 12, width: '100%', cursor: 'pointer' }}>
                  <Upload size={14} /> Select Custom Image From Disk
                  <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
                </label>

                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Calibrated Industrial Test Presets ({machineType}):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '8px 4px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                      onClick={() => loadPresetImage('/sample_images/00_pristine_new_carbide_insert.jpg')}
                    >
                      <span style={{ color: 'var(--accent-sage)', fontWeight: 700 }}>✓ NOMINAL</span>
                      <span>Pristine Component</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '8px 4px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                      onClick={() => loadPresetImage('/sample_images/01_worn_carbide_tool.jpg')}
                    >
                      <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>⚠ MODERATE</span>
                      <span>Flank / Surface Wear</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '8px 4px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                      onClick={() => loadPresetImage('/sample_images/03_severely_chipped_end_mill.jpg')}
                    >
                      <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>🚨 CRITICAL</span>
                      <span>Fracture / Chipping</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 16 }}
              onClick={runInspection}
              disabled={loading || !preview}
            >
              {loading ? 'Evaluating Surface Pattern...' : <><Scan size={16} /> SCAN {machineType} COMPONENT</>}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="stack">
          {result ? (
            <>
              <div className="card" style={{ borderLeft: `4px solid ${conditionColor(result.condition)}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div className="page-header-eyebrow">Visual Diagnostic Verdict</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{result.inspection_type} Inspection</div>
                  </div>
                  <span className="demo-badge">{result.model_mode}</span>
                </div>

                <div className="metrics-grid" style={{ marginBottom: 16 }}>
                  <div className="metric-card orange">
                    <div className="metric-label">Component Tested</div>
                    <div className="metric-value" style={{ fontSize: '1.05rem' }}>{result.component}</div>
                  </div>
                  <div className="metric-card" style={{ borderLeftColor: conditionColor(result.condition) }}>
                    <div className="metric-label">Assessed Condition</div>
                    <div className="metric-value" style={{ fontSize: '1.1rem', color: conditionColor(result.condition) }}>
                      {result.condition}
                    </div>
                  </div>
                  <div className="metric-card sage">
                    <div className="metric-label">Diagnostic Confidence</div>
                    <div className="metric-value">{result.confidence}%</div>
                  </div>
                </div>

                {result.detected_issues?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>Identified Surface Anomaly Patterns:</div>
                    <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {result.detected_issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ padding: '14px 16px', background: 'var(--bg-panel-inset)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={16} style={{ color: 'var(--accent-amber)' }} />
                    Automated Maintenance Recommendation
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {result.recommendation}
                  </div>
                </div>

                {result.image_metrics && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Edge Density</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{result.image_metrics.edge_density}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Dark Ratio</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{result.image_metrics.dark_ratio}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Luminance</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{result.image_metrics.brightness}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Contrast</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{result.image_metrics.contrast}</div>
                    </div>
                  </div>
                )}
              </div>

              {result.combined_health && (
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Multi-Modal Telemetry Sensor Fusion</span>
                    <ShieldCheck size={18} style={{ color: 'var(--accent-sage)' }} />
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Real-time sensor failure probability (XGBoost) combined with optical computer vision defect score for {result.machine_id}.
                  </p>
                  <div className="metrics-grid">
                    <div className="metric-card sage">
                      <div className="metric-label">Fused Health Score</div>
                      <div className="metric-value">{result.combined_health.health_score} / 100</div>
                    </div>
                    <div className="metric-card orange">
                      <div className="metric-label">Sensor Risk Level</div>
                      <div className="metric-value" style={{ fontSize: '1.2rem' }}>
                        {result.combined_health.sensor_failure_pct}%
                      </div>
                    </div>
                    <div className="metric-card amber">
                      <div className="metric-label">Visual Wear Penalty</div>
                      <div className="metric-value" style={{ fontSize: '1.2rem', color: 'var(--accent-amber)' }}>
                        -{result.combined_health.visual_penalty} pts
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 420, textAlign: 'center', padding: 24 }}>
              <Scan size={48} style={{ color: 'var(--text-dim)', marginBottom: 16 }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>Ready for {machineType} Visual Inspection</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', maxWidth: 360, lineHeight: 1.5 }}>
                Point optical camera or load a preset sample image of the {activeComponent}, then click <strong>SCAN {machineType} COMPONENT</strong> to run multi-modal visual defect diagnostics.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
