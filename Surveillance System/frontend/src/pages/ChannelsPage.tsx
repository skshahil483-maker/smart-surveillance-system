import React, { useState, useEffect } from 'react';
import { Monitor, MapPin, Wifi, WifiOff, RefreshCw, Maximize2 } from 'lucide-react';
import { Camera } from '../types/surveillance';
import { getCameras } from '../services/api';

interface ChannelsPageProps {
  onSelectCamera?: (cameraId: string) => void;
  onSwitchToDashboard?: () => void;
}

export const ChannelsPage: React.FC<ChannelsPageProps> = ({
  onSelectCamera,
  onSwitchToDashboard,
}) => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [streamErrors, setStreamErrors] = useState<Record<string, boolean>>({});

  const loadCameras = async () => {
    setLoading(true);
    try {
      const data = await getCameras();
      setCameras(data);
    } catch (e) {
      console.error("Error loading cameras:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCameras();
  }, []);

  const handleStreamError = (cameraId: string) => {
    setStreamErrors((prev) => ({ ...prev, [cameraId]: true }));
  };

  const handleCameraClick = (cameraId: string) => {
    if (onSelectCamera) onSelectCamera(cameraId);
    if (onSwitchToDashboard) onSwitchToDashboard();
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-xs">
        Loading camera channels...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1800px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] p-5 rounded-xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Monitor className="w-5 h-5 text-blue-400" />
            Video Channels — Multi-Camera Grid View
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Live surveillance feeds from all registered cameras. Click any channel to switch to full dashboard view.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadCameras}
            className="px-4 py-2 bg-[#1e293b] hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-2 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Channels
          </button>
          <span className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-mono font-bold">
            {cameras.length} Camera{cameras.length !== 1 ? 's' : ''} Active
          </span>
        </div>
      </div>

      {/* Camera Grid */}
      {cameras.length === 0 ? (
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl p-12 text-center">
          <Monitor className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">No cameras registered yet.</p>
          <p className="text-slate-500 text-xs mt-1">Go to Admin Panel → Camera Management to add cameras.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {cameras.map((cam) => {
            const apiHost = `${window.location.hostname}:8000`;
            const feedSrc = cam.source && cam.source !== '' ? cam.source : 'demo';
            const feedUrl = `http://${apiHost}/api/stream/video_feed?source=${encodeURIComponent(feedSrc)}&camera_id=${cam.camera_id}`;
            const hasError = streamErrors[cam.camera_id];
            const isOnline = cam.status === 'Online';

            return (
              <div
                key={cam.camera_id}
                onClick={() => handleCameraClick(cam.camera_id)}
                className="group bg-[#0f172a] rounded-xl border border-slate-800 overflow-hidden shadow-xl hover:border-blue-500/60 transition-all cursor-pointer hover:shadow-blue-950/20 hover:shadow-2xl"
              >
                {/* Camera Feed Area */}
                <div className="relative bg-black h-48 sm:h-56 flex items-center justify-center overflow-hidden">
                  {hasError ? (
                    <div className="flex flex-col items-center justify-center text-slate-400 text-center p-4">
                      <WifiOff className="w-8 h-8 mb-2 text-amber-500" />
                      <span className="text-xs font-bold text-white">Stream Error</span>
                      <span className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                        Unable to connect to source: {cam.source || 'IP Address'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStreamErrors((prev) => ({ ...prev, [cam.camera_id]: false }));
                        }}
                        className="mt-3 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry Feed
                      </button>
                    </div>
                  ) : (
                    <img
                      src={feedUrl}
                      alt={`${cam.name} Feed`}
                      onError={() => handleStreamError(cam.camera_id)}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  )}

                  {/* Live indicator */}
                  {!hasError && (
                    <div className="absolute top-2.5 left-2.5">
                      <span className="bg-red-600/90 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        LIVE
                      </span>
                    </div>
                  )}

                  {/* Expand icon on hover */}
                  <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-blue-600/90 text-white p-1.5 rounded-lg flex items-center">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Channel number overlay */}
                  <div className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2 py-1 rounded border border-white/10 text-white text-[10px] font-mono font-bold">
                    CH {cam.camera_id.replace('CAM-', '')}
                  </div>
                </div>

                {/* Camera Info Footer */}
                <div className="px-4 py-3 bg-[#1e293b]/80 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></span>
                      <span className="text-xs font-bold text-white truncate">
                        {cam.camera_id} — {cam.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pl-4">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{cam.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isOnline ? (
                      <span className="px-2 py-0.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold flex items-center gap-1">
                        <Wifi className="w-3 h-3" /> Online
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded text-[10px] font-bold flex items-center gap-1">
                        <WifiOff className="w-3 h-3" /> Offline
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
