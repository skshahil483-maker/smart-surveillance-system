import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { EventsPage } from './pages/EventsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { ChannelsPage } from './pages/ChannelsPage';
import { EventDetailsModal } from './components/EventDetailsModal';
import { Camera, EventItem, TelemetryData, AnalyticsDistribution, SystemSettings } from './types/surveillance';
import { getCameras, getEvents, getActivityDistribution, getRecentSnapshots, getSettings, connectWebSocket } from './services/api';
import { soundNotifier } from './utils/sound';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'events' | 'channels' | 'settings' | 'about'>('dashboard');
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('CAM-01');
  const [selectedSource, setSelectedSource] = useState<string>('demo');

  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsDistribution | null>(null);
  const [snapshots, setSnapshots] = useState<EventItem[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    confidence_threshold: 0.60,
    alert_cooldown: 10,
    loitering_threshold: 10,
    alert_enabled: true,
    sound_enabled: true,
    active_camera_id: 'CAM-01',
  });

  const [selectedEventModal, setSelectedEventModal] = useState<EventItem | null>(null);

  const handleSelectCamera = (camId: string) => {
    setSelectedCamera(camId);
    const found = cameras.find((c) => c.camera_id === camId);
    if (found && found.source) {
      setSelectedSource(found.source);
    }
  };

  // Load initial REST data
  const loadInitialData = async () => {
    try {
      const [cams, evts, dist, snaps, sett] = await Promise.all([
        getCameras(),
        getEvents({ limit: 10 }),
        getActivityDistribution(),
        getRecentSnapshots(3),
        getSettings(),
      ]);

      setCameras(cams);
      setEvents(evts);
      setAnalytics(dist);
      setSnapshots(snaps);
      setSettings(sett);

      if (cams.length > 0) {
        const initCam = cams.find((c) => c.camera_id === 'CAM-01') || cams[0];
        if (initCam && initCam.source) {
          setSelectedSource(initCam.source);
        }
      }
    } catch (e) {
      console.error("Error loading initial surveillance data:", e);
    }
  };

  const reloadCameras = async () => {
    try {
      const cams = await getCameras();
      setCameras(cams);
    } catch (e) {
      console.error("Error reloading cameras:", e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Connect WebSocket for real-time telemetry stream (with auto-reconnect)
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = 1000; // Start at 1s, max 15s
    let isMounted = true;

    const connect = () => {
      ws = connectWebSocket((msg) => {
        if (msg.type === 'telemetry' && msg.data) {
          const telemData: TelemetryData = msg.data;
          setTelemetry(telemData);

          // If suspicious alert is active
          if (telemData.active_alert) {
            if (settings.sound_enabled) {
              soundNotifier.playAlertSiren();
            }

            // Auto-refresh events, snapshots & analytics when a new live alert triggers
            getEvents({ limit: 10 }).then(setEvents).catch(console.error);
            getRecentSnapshots(3).then(setSnapshots).catch(console.error);
            getActivityDistribution().then(setAnalytics).catch(console.error);
          }
        }
      });

      ws.onopen = () => {
        console.log("WebSocket connected to Smart Surveillance stream.");
        reconnectDelay = 1000; // Reset backoff on successful connect
      };

      ws.onclose = () => {
        if (isMounted) {
          console.warn(`WebSocket disconnected. Reconnecting in ${reconnectDelay / 1000}s...`);
          reconnectTimeout = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 1.5, 15000);
            connect();
          }, reconnectDelay);
        }
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [settings.sound_enabled]);

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cameras={cameras}
        selectedCamera={selectedCamera}
        onSelectCamera={handleSelectCamera}
      />

      {/* Main Content Pages */}
      <main className="flex-1 pb-12">
        {activeTab === 'dashboard' && (
          <Dashboard
            telemetry={telemetry}
            events={events}
            analytics={analytics}
            snapshots={snapshots}
            selectedSource={selectedSource}
            selectedCamera={selectedCamera}
            onSourceChange={setSelectedSource}
            onViewAllEvents={() => setActiveTab('events')}
            onSelectEvent={(evt) => setSelectedEventModal(evt)}
            soundEnabled={settings.sound_enabled}
          />
        )}

        {activeTab === 'events' && (
          <EventsPage
            onSelectEvent={(evt) => setSelectedEventModal(evt)}
          />
        )}

        {activeTab === 'channels' && (
          <ChannelsPage
            onSelectCamera={(camId) => handleSelectCamera(camId)}
            onSwitchToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            onSettingsSaved={(newSett) => setSettings(newSett)}
            onCamerasChanged={reloadCameras}
          />
        )}

        {activeTab === 'about' && <AboutPage />}
      </main>

      {/* Footer */}
      <footer className="bg-[#0f172a] border-t border-slate-800/80 px-6 py-3 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300">Smart Surveillance System</span>
          <span>|</span>
          <span>AI for a Safer Tomorrow</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
          <span>Powered by YOLOv8</span>
          <span>•</span>
          <span>ByteTrack</span>
          <span>•</span>
          <span>CNN + LSTM</span>
        </div>
      </footer>

      {/* Event Details Modal */}
      {selectedEventModal && (
        <EventDetailsModal
          event={selectedEventModal}
          onClose={() => setSelectedEventModal(null)}
        />
      )}
    </div>
  );
};

export default App;
