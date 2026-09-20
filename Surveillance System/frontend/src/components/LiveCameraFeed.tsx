import React, { useState, useEffect } from 'react';
import { Video, Cpu, Activity, RefreshCw, Radio } from 'lucide-react';
import { TelemetryData } from '../types/surveillance';
import { SimulatedSurveillanceCanvas } from './SimulatedSurveillanceCanvas';

interface LiveCameraFeedProps {
  telemetry: TelemetryData | null;
  cameraName?: string;
  selectedSource: string;
  selectedCamera?: string;
  onSourceChange: (src: string) => void;
}

export const LiveCameraFeed: React.FC<LiveCameraFeedProps> = ({
  telemetry,
  cameraName,
  selectedSource,
  selectedCamera = 'CAM-01',
  onSourceChange,
}) => {
  const [streamError, setStreamError] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  // Check backend health periodically
  useEffect(() => {
    let isMounted = true;
    const checkBackend = async () => {
      try {
        const res = await fetch(`http://${window.location.hostname}:8000/`, { method: 'GET' });
        if (res.ok && isMounted) {
          setBackendOnline(true);
          setStreamError(false);
        }
      } catch {
        if (isMounted) {
          setBackendOnline(false);
        }
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Clear stream error when camera or source changes
  useEffect(() => {
    setStreamError(false);
  }, [selectedSource, selectedCamera]);

  const apiHost = `${window.location.hostname}:8000`;
  const videoFeedUrl = `http://${apiHost}/api/stream/video_feed?source=${encodeURIComponent(selectedSource || '0')}&camera_id=${selectedCamera}`;
  const displayName = cameraName || `${selectedCamera.replace('-', ' ')}`;
  const isSuspicious = telemetry?.status === 'SUSPICIOUS';

  return (
    <div className="relative bg-[#0f172a] rounded-xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col h-full">
      {/* Top Bar Controls */}
      <div className="bg-[#1e293b]/90 px-4 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSuspicious ? 'bg-red-400' : 'bg-emerald-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isSuspicious ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
          </span>
          <span className="font-bold text-white tracking-wide">{displayName}</span>
          {backendOnline ? (
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono font-medium flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" /> AI BACKEND ONLINE
            </span>
          ) : (
            <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded font-mono font-medium">
              SIMULATOR MODE
            </span>
          )}
        </div>

        {/* Source Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 hidden sm:inline">Mode:</span>
          <button
            onClick={() => {
              setStreamError(false);
              onSourceChange('demo');
            }}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
              selectedSource === 'demo'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ● DEMO VIDEO
          </button>
          <button
            onClick={() => {
              setStreamError(false);
              onSourceChange('0');
            }}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
              selectedSource === '0'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ● WEBCAM (AI)
          </button>
        </div>
      </div>

      {/* Main Video Stream Container */}
      <div className="relative flex-1 bg-black min-h-[360px] lg:min-h-[460px] flex items-center justify-center overflow-hidden">
        {streamError ? (
          <SimulatedSurveillanceCanvas cameraName={displayName} isSuspicious={isSuspicious} />
        ) : (
          <img
            key={`${selectedSource}-${selectedCamera}`}
            src={videoFeedUrl}
            alt="Live Surveillance Feed"
            onError={() => setStreamError(true)}
            className="w-full h-full object-cover"
          />
        )}


        {/* Live Camera Watermark & Timestamp Overlay */}
        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded border border-white/10 text-white text-xs font-mono">
          <div className="font-bold tracking-wider text-slate-200">{displayName}</div>
        </div>

        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded border border-white/10 text-white text-xs font-mono">
          {telemetry?.timestamp || new Date().toLocaleTimeString()}
        </div>

        {/* Live Status Tag */}
        <div className="absolute top-3 left-3">
          <span className="bg-red-600/90 text-white px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 tracking-wider shadow-lg">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            LIVE
          </span>
        </div>
      </div>

      {/* Performance Footer Stats */}
      <div className="bg-[#1e293b] px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>FPS: <strong className="text-white font-mono">{telemetry?.fps || 24}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-700 pl-4">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Inference: <strong className="text-white font-mono">{telemetry?.inference_ms || 42} ms</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5 text-purple-400" />
          <span>Persons Detected: <strong className="text-white font-mono">{telemetry?.persons_count || 4}</strong></span>
        </div>
      </div>
    </div>
  );
};

