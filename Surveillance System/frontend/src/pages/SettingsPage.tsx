import React, { useState, useEffect } from 'react';
import { Sliders, Volume2, ShieldCheck, Video, Save, Plus, Trash2, X, MapPin, Link2 } from 'lucide-react';
import { SystemSettings, Camera } from '../types/surveillance';
import { getSettings, updateSettings, getCameras, createCamera, deleteCamera } from '../services/api';

interface SettingsPageProps {
  onSettingsSaved?: (newSettings: SystemSettings) => void;
  onCamerasChanged?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onSettingsSaved, onCamerasChanged }) => {
  const [settings, setSettings] = useState<SystemSettings>({
    confidence_threshold: 0.60,
    alert_cooldown: 10,
    loitering_threshold: 10,
    alert_enabled: true,
    sound_enabled: true,
    active_camera_id: 'CAM-01',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Camera Management State
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [camerasLoading, setCamerasLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [cameraAdded, setCameraAdded] = useState<boolean>(false);
  const [newCamera, setNewCamera] = useState({
    camera_id: '',
    name: '',
    location: '',
    source: '',
    status: 'Online',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (e) {
        console.error("Error loading settings:", e);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
    loadCameras();
  }, []);

  const loadCameras = async () => {
    setCamerasLoading(true);
    try {
      const data = await getCameras();
      setCameras(data);
    } catch (e) {
      console.error("Error loading cameras:", e);
    } finally {
      setCamerasLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateSettings(settings);
      setSettings(updated);
      setSavedSuccess(true);
      if (onSettingsSaved) onSettingsSaved(updated);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
    }
  };

  const handleAddCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamera.camera_id || !newCamera.name) return;

    try {
      await createCamera(newCamera);
      setNewCamera({ camera_id: '', name: '', location: '', source: '', status: 'Online' });
      setShowAddForm(false);
      setCameraAdded(true);
      setTimeout(() => setCameraAdded(false), 3000);
      await loadCameras();
      if (onCamerasChanged) onCamerasChanged();
    } catch (err) {
      console.error("Error adding camera:", err);
    }
  };

  const handleDeleteCamera = async (cameraId: string) => {
    if (window.confirm(`Are you sure you want to remove camera ${cameraId}? This cannot be undone.`)) {
      try {
        await deleteCamera(cameraId);
        await loadCameras();
        if (onCamerasChanged) onCamerasChanged();
      } catch (err) {
        console.error("Error deleting camera:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-xs">
        Loading system configuration...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-6">
      <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
            Surveillance System Admin Panel
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Centralized control panel for AI detection sensitivity, camera feed rules, audio sirens, and database management.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-[#1e293b] px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>ADMIN ACCESS ACTIVE</span>
        </div>
      </div>

      {/* ==================== CAMERA MANAGEMENT ==================== */}
      <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Video className="w-4 h-4 text-blue-400" /> Camera Management
          </h3>
          <div className="flex items-center gap-3">
            {cameraAdded && (
              <span className="text-xs text-emerald-400 font-bold animate-pulse">
                ✓ Camera added successfully!
              </span>
            )}
            <span className="text-xs text-slate-400 font-mono">
              {cameras.length} camera{cameras.length !== 1 ? 's' : ''} registered
            </span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition ${
                showAddForm
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
              }`}
            >
              {showAddForm ? (
                <><X className="w-3.5 h-3.5" /> Cancel</>
              ) : (
                <><Plus className="w-3.5 h-3.5" /> Add Camera</>
              )}
            </button>
          </div>
        </div>

        {/* Add Camera Form */}
        {showAddForm && (
          <form onSubmit={handleAddCamera} className="bg-[#1e293b] p-5 rounded-lg border border-blue-500/30 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-1">
              <Plus className="w-4 h-4" /> Register New Camera
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Camera ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CAM-02"
                  value={newCamera.camera_id}
                  onChange={(e) => setNewCamera({ ...newCamera, camera_id: e.target.value })}
                  className="w-full bg-[#0f172a] text-white text-xs px-3 py-2.5 rounded-lg border border-slate-700 font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Camera Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Library Entrance"
                  value={newCamera.name}
                  onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                  className="w-full bg-[#0f172a] text-white text-xs px-3 py-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-slate-400" /> Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Building A, Floor 2"
                  value={newCamera.location}
                  onChange={(e) => setNewCamera({ ...newCamera, location: e.target.value })}
                  className="w-full bg-[#0f172a] text-white text-xs px-3 py-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block flex items-center gap-1.5">
                  <Link2 className="w-3 h-3 text-slate-400" /> Source URL / Index
                </label>
                <input
                  type="text"
                  placeholder="e.g. rtsp://192.168.1.10:554/stream or 0"
                  value={newCamera.source}
                  onChange={(e) => setNewCamera({ ...newCamera, source: e.target.value })}
                  className="w-full bg-[#0f172a] text-white text-xs px-3 py-2.5 rounded-lg border border-slate-700 font-mono focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-500">
                  Enter RTSP URL, video file path, or webcam index (0, 1, 2...)
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Camera
              </button>
            </div>
          </form>
        )}

        {/* Camera List Table */}
        {camerasLoading ? (
          <div className="p-6 text-center text-slate-400 font-mono text-xs">
            Loading cameras...
          </div>
        ) : cameras.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            No cameras registered. Click "Add Camera" to register your first camera.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#1e293b] text-slate-300 font-semibold border-b border-slate-800">
                  <th className="py-2.5 px-3">Camera ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cameras.map((cam) => (
                  <tr key={cam.camera_id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-400">
                      {cam.camera_id}
                    </td>
                    <td className="py-2.5 px-3 text-white font-medium">{cam.name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{cam.location}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] max-w-[200px] truncate">
                      {cam.source || '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cam.status === 'Online'
                          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-600/20 text-red-400 border border-red-500/30'
                      }`}>
                        {cam.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeleteCamera(cam.camera_id)}
                        className="p-1.5 rounded bg-red-600/15 text-red-400 hover:bg-red-600 hover:text-white transition"
                        title="Delete Camera"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================== AI SETTINGS FORM ==================== */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Detection Engine Parameters */}
        <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800 shadow-xl space-y-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-purple-400" /> AI Detection Sensitivity & Thresholds
          </h3>

          {/* Confidence Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <label className="text-slate-300">YOLOv8 Confidence Threshold</label>
              <span className="text-blue-400 font-mono font-bold">
                {Math.round(settings.confidence_threshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.30"
              max="0.95"
              step="0.05"
              value={settings.confidence_threshold}
              onChange={(e) =>
                setSettings({ ...settings, confidence_threshold: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-[11px] text-slate-400">
              Higher values reduce false positives; lower values increase sensitivity to subtle interactions.
            </p>
          </div>

          {/* Alert Cooldown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Alert Cooldown (Seconds)
              </label>
              <input
                type="number"
                min="3"
                max="60"
                value={settings.alert_cooldown}
                onChange={(e) =>
                  setSettings({ ...settings, alert_cooldown: parseInt(e.target.value) || 10 })
                }
                className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-lg border border-slate-700 font-mono focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400">
                Minimum wait time before logging another event for continuous suspicious activity.
              </p>
            </div>

            {/* Loitering Threshold */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Loitering Time Limit (Seconds)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={settings.loitering_threshold}
                onChange={(e) =>
                  setSettings({ ...settings, loitering_threshold: parseInt(e.target.value) || 10 })
                }
                className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-lg border border-slate-700 font-mono focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400">
                Duration a person can remain stationary before triggering a Loitering Alert.
              </p>
            </div>
          </div>
        </div>

        {/* Weapon Detection Parameters */}
        <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800 shadow-xl space-y-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-red-500" /> Weapon & Knife Detection AI Settings
          </h3>

          <div className="flex items-center justify-between p-3 bg-[#1e293b] rounded-lg border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white block">Knife & Gun AI Detection</span>
              <span className="text-[11px] text-slate-400">
                Run YOLOv8 weapon model in real-time to detect knives and firearms.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.weapon_detection_enabled ?? true}
              onChange={(e) => setSettings({ ...settings, weapon_detection_enabled: e.target.checked })}
              className="w-5 h-5 text-red-600 rounded focus:ring-0 cursor-pointer accent-red-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weapon Confidence Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <label className="text-slate-300">Weapon Confidence Threshold</label>
                <span className="text-red-400 font-mono font-bold">
                  {Math.round((settings.weapon_confidence_threshold ?? 0.60) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.95"
                step="0.05"
                value={settings.weapon_confidence_threshold ?? 0.60}
                onChange={(e) =>
                  setSettings({ ...settings, weapon_confidence_threshold: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <p className="text-[11px] text-slate-400">
                Minimum confidence required to flag a knife or firearm detection.
              </p>
            </div>

            {/* Confirmation Frames */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Temporal Confirmation (Frames)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.weapon_confirmation_frames ?? 3}
                onChange={(e) =>
                  setSettings({ ...settings, weapon_confirmation_frames: parseInt(e.target.value) || 3 })
                }
                className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-lg border border-slate-700 font-mono focus:outline-none focus:border-red-500"
              />
              <p className="text-[11px] text-slate-400">
                Number of consecutive frames weapon must be detected before firing an alert.
              </p>
            </div>
          </div>
        </div>

        {/* Alerts & Sound Toggles */}
        <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800 shadow-xl space-y-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Volume2 className="w-4 h-4 text-emerald-400" /> Notifications & Audio Alerts
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#1e293b] rounded-lg border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Visual Dashboard Alerts</span>
                <span className="text-[11px] text-slate-400">
                  Highlight red alert card and trigger dashboard popups during suspicious events.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.alert_enabled}
                onChange={(e) => setSettings({ ...settings, alert_enabled: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-0 cursor-pointer accent-blue-600"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#1e293b] rounded-lg border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Audible Siren Sound</span>
                <span className="text-[11px] text-slate-400">
                  Play real-time browser audio siren alert when fighting or suspicious activity occurs.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.sound_enabled}
                onChange={(e) => setSettings({ ...settings, sound_enabled: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-0 cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between bg-[#0f172a] p-4 rounded-xl border border-slate-800">
          {savedSuccess ? (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> System settings updated successfully!
            </span>
          ) : (
            <span className="text-xs text-slate-400">All changes apply instantly to AI stream.</span>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-blue-600/30 flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
