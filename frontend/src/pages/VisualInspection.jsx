import React, { useState, useRef, useCallback, useEffect } from 'react';
import { runVisualInspection } from '../services/api';
import { Camera, Upload, Scan, Wrench, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

const MACHINE_TYPES = [
  { id: 'CNC', label: 'CNC Machine', component: 'Cutting Tool', active: true, desc: 'Tool wear & damage detection' },
  { id: 'CONVEYOR', label: 'Conveyor Belt', component: 'Belt Assembly', active: false, desc: 'Phase 2 — Coming soon' },
  { id: 'HYDRAULIC', label: 'Hydraulic Equipment', component: 'Hydraulic Assembly', active: false, desc: 'Phase 3 — Coming soon' },
];

export default function VisualInspection() {
  const [machineType, setMachineType] = useState('CNC');
  const [machineId, setMachineId] = useState('M-101');
  const [mode, setMode] = useState('camera'); // camera | upload
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

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
        // Fallback for laptops and desktop webcams that don't support environment facingMode
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

  return (
    <div>
      <div className="page-header">
        <div className="page-header-eyebrow">Computer Vision</div>
        <h2>Visual Inspection Module</h2>
        <p className="page-header-desc">
          Context-aware camera inspection for CNC tool wear, conveyor belt damage, and hydraulic leakage.
          Phase 1 (CNC) is active; Conveyor and Hydraulic coming in Phases 2–3.
        </p>
      </div>

      {/* Machine Type Selection */}
      <div className="inspection-types">
        {MACHINE_TYPES.map(t => (
          <div
            key={t.id}
            className={`inspection-type-card ${machineType === t.id ? 'selected' : ''} ${!t.active ? 'disabled' : ''}`}
            onClick={() => t.active && setMachineType(t.id)}
          >
            <Wrench size={28} style={{ color: machineType === t.id ? 'var(--signal-cyan)' : 'var(--text-dim)', marginBottom: 10 }} />
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{t.label}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{t.desc}</div>
            {!t.active && <span className="demo-badge" style={{ marginTop: 8 }}>Phase 2/3</span>}
          </div>
        ))}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-sidebar">
        {/* Camera / Upload Panel */}
        <div className="stack">
          <div className="card">
            <span className="card-title">Inspection Target</span>
            <div className="input-group" style={{ marginTop: 12, marginBottom: 12 }}>
              <span className="input-label">Machine ID</span>
              <select className="input-field" value={machineId} onChange={e => setMachineId(e.target.value)}>
                {Array.from({ length: 24 }, (_, i) => `M-${101 + i}`).map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Component: <strong>{MACHINE_TYPES.find(t => t.id === machineType)?.component}</strong>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button className={`btn btn-sm ${mode === 'camera' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('camera')}>
                <Camera size={14} /> Camera
              </button>
              <button className={`btn btn-sm ${mode === 'upload' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setMode('upload'); stopCamera(); }}>
                <Upload size={14} /> Upload
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>
                      <Camera size={48} />
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
                      <Scan size={14} /> Capture
                    </button>
                  )}
                  {preview && (
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setPreview(null); setResult(null); }}>
                      Retake
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>
                      <Upload size={48} />
                    </div>
                  )}
                </div>
                <label className="btn btn-secondary" style={{ marginTop: 12, width: '100%', cursor: 'pointer' }}>
                  <Upload size={14} /> Select Image
                  <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
                </label>
              </>
            )}

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 16 }}
              onClick={runInspection}
              disabled={loading || !preview}
            >
              {loading ? 'Analyzing...' : <><Scan size={16} /> SCAN MACHINE</>}
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
                    <div className="page-header-eyebrow">Visual Assessment</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{result.inspection_type} Inspection</div>
                  </div>
                  <span className="demo-badge">{result.model_mode}</span>
                </div>

                <div className="metrics-grid" style={{ marginBottom: 16 }}>
                  <div className="metric-card orange">
                    <div className="metric-label">Component</div>
                    <div className="metric-value" style={{ fontSize: '1.1rem' }}>{result.component}</div>
                  </div>
                  <div className="metric-card" style={{ borderLeftColor: conditionColor(result.condition) }}>
                    <div className="metric-label">Condition</div>
                    <div className="metric-value" style={{ fontSize: '1.1rem', color: conditionColor(result.condition) }}>
                      {result.condition}
                    </div>
                  </div>
                  <div className="metric-card sage">
                    <div className="metric-label">Confidence</div>
                    <div className="metric-value">{result.confidence}%</div>
                  </div>
                </div>

                {result.detected_issues?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Detected:</div>
                    <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      {result.detected_issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ padding: '14px 16px', background: 'var(--bg-panel-inset)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={16} style={{ color: 'var(--accent-amber)' }} />
                    Recommendation
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{result.recommendation}</div>
                </div>
              </div>

              {result.combined_health && (
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Combined Health Engine</span>
                    <CheckCircle size={16} style={{ color: 'var(--accent-sage)' }} />
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Sensor-based XGBoost risk fused with visual inspection assessment.
                  </p>
                  <div className="metrics-grid">
                    <div className="metric-card sage">
                      <div className="metric-label">Combined Health</div>
                      <div className="metric-value">{result.combined_health.health_score}</div>
                    </div>
                    <div className="metric-card orange">
                      <div className="metric-label">Sensor Risk</div>
                      <div className="metric-value" style={{ fontSize: '1.2rem' }}>
                        {result.combined_health.sensor_failure_pct}%
                      </div>
                    </div>
                    <div className="metric-card amber">
                      <div className="metric-label">Visual Penalty</div>
                      <div className="metric-value" style={{ fontSize: '1.2rem' }}>
                        -{result.combined_health.visual_penalty}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center' }}>
              <Scan size={48} style={{ color: 'var(--text-dim)', marginBottom: 16 }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: 6 }}>Ready for Visual Inspection</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', maxWidth: 340 }}>
                Select CNC machine type, point your camera at the cutting tool, and click SCAN MACHINE.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
