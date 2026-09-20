import React, { useState, useEffect } from 'react';
import { Video, Shield, Calendar, Clock } from 'lucide-react';
import { Camera } from '../types/surveillance';

interface HeaderProps {
  activeTab: 'dashboard' | 'events' | 'channels' | 'settings' | 'about';
  setActiveTab: (tab: 'dashboard' | 'events' | 'channels' | 'settings' | 'about') => void;
  cameras: Camera[];
  selectedCamera: string;
  onSelectCamera: (camId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  cameras,
  selectedCamera,
  onSelectCamera,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format: Aug 18, 2026
      const dateStr = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      // Format: 17:25:32
      const timeStr = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      setCurrentDate(dateStr);
      setCurrentTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navTabs: { key: typeof activeTab; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'events', label: 'Events' },
    { key: 'channels', label: '📺 Channels' },
    { key: 'settings', label: '⚙️ Admin Panel' },
    { key: 'about', label: 'About' },
  ];

  return (
    <header className="bg-[#0f172a] border-b border-slate-800/80 px-6 py-4 text-white">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Title Section */}
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30 text-blue-400">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Smart Surveillance System
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Deep Learning-Based Suspicious Activity Detection
          </p>
        </div>

        {/* Right Status & Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Camera Dropdown */}
          <div className="flex items-center gap-2 bg-[#1e293b] px-3 py-1.5 rounded-lg border border-slate-700">
            <Video className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCamera}
              onChange={(e) => onSelectCamera(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {cameras.length > 0 ? (
                cameras.map((c) => (
                  <option key={c.camera_id} value={c.camera_id} className="bg-[#1e293b] text-white">
                    {c.camera_id} ({c.name})
                  </option>
                ))
              ) : (
                <option value="CAM-01" className="bg-[#1e293b] text-white">
                  Camera 01
                </option>
              )}
            </select>
          </div>

          {/* Live Indicator */}
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            Live
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-3 bg-[#1e293b] px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 font-mono">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentDate || 'Aug 18, 2026'}</span>
            </div>
            <div className="flex items-center gap-1.5 border-l border-slate-700 pl-3">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-white font-bold">{currentTime || '17:25:32'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/60">
        {navTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
};
