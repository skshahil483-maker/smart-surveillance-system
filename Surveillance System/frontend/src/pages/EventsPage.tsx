import React, { useState, useEffect } from 'react';
import { Search, Download, Filter, Eye, Trash2, Calendar, ShieldAlert } from 'lucide-react';
import { EventItem, Camera } from '../types/surveillance';
import { getEvents, deleteEvent, getExportCsvUrl, getCameras } from '../services/api';

interface EventsPageProps {
  onSelectEvent: (event: EventItem) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({ onSelectEvent }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCamera, setSelectedCamera] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [cameras, setCameras] = useState<Camera[]>([]);

  // Load cameras for dynamic dropdown
  useEffect(() => {
    const loadCameras = async () => {
      try {
        const data = await getCameras();
        setCameras(data);
      } catch (e) {
        console.error("Error loading cameras:", e);
      }
    };
    loadCameras();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params: any = {
        activity: selectedActivity,
        status: selectedStatus,
        camera_id: selectedCamera,
        search: search,
      };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const data = await getEvents(params);
      setEvents(data);
    } catch (e) {
      console.error("Error fetching events:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedActivity, selectedStatus, selectedCamera, search, startDate, endDate]);

  const handleDelete = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete event ${eventId}?`)) {
      try {
        await deleteEvent(eventId);
        setEvents(events.filter((item) => item.event_id !== eventId));
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const handleClearDates = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="p-6 max-w-[1800px] mx-auto space-y-6">
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] p-5 rounded-xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-400" />
            Surveillance Event History Log
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Historical audit log of all recorded camera activities, detections, and suspicious alerts.
          </p>
        </div>

        <a
          href={getExportCsvUrl()}
          download="surveillance_events.csv"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </a>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 shadow-xl space-y-4">
        {/* Row 1: Search + Activity + Status + Camera */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search event ID, location, or activity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1e293b] text-white text-xs pl-9 pr-4 py-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#1e293b] px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Activity:</span>
              <select
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-[#1e293b]">All Activities</option>
                <option value="Weapon Detected" className="bg-[#1e293b]">🔪/🔫 Weapon Detected</option>
                <option value="Knife" className="bg-[#1e293b]">🔪 Knife</option>
                <option value="Gun" className="bg-[#1e293b]">🔫 Gun/Firearm</option>
                <option value="Fighting" className="bg-[#1e293b]">Fighting</option>
                <option value="Loitering" className="bg-[#1e293b]">Loitering</option>
                <option value="Falling" className="bg-[#1e293b]">Falling</option>
                <option value="Walking" className="bg-[#1e293b]">Walking</option>
                <option value="Running" className="bg-[#1e293b]">Running</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-[#1e293b] px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-[#1e293b]">All Statuses</option>
                <option value="SUSPICIOUS" className="bg-[#1e293b]">SUSPICIOUS</option>
                <option value="NORMAL" className="bg-[#1e293b]">NORMAL</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-[#1e293b] px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400">Camera:</span>
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-[#1e293b]">All Cameras</option>
                {cameras.map((cam) => (
                  <option key={cam.camera_id} value={cam.camera_id} className="bg-[#1e293b]">
                    {cam.camera_id} ({cam.name})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Date Range Picker */}
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold">Date Range:</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-500">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#1e293b] text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 font-mono cursor-pointer [color-scheme:dark]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-500">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#1e293b] text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 font-mono cursor-pointer [color-scheme:dark]"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={handleClearDates}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] font-semibold rounded-lg transition"
            >
              Clear Dates
            </button>
          )}

          {(startDate || endDate) && (
            <span className="text-[11px] text-blue-400 font-mono">
              Showing: {startDate || '∞'} → {endDate || '∞'}
            </span>
          )}
        </div>
      </div>

      {/* Events Data Table */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Loading surveillance event log...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            No events found matching current search filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-[#1e293b] text-slate-300 font-sans font-semibold border-b border-slate-800">
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Activity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Persons</th>
                  <th className="py-3 px-4">Camera</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {events.map((evt) => {
                  const isSuspicious = evt.status === 'SUSPICIOUS';
                  return (
                    <tr
                      key={evt.event_id || evt.id}
                      onClick={() => onSelectEvent(evt)}
                      className="hover:bg-slate-800/50 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 text-blue-400 font-bold">{evt.event_id}</td>
                      <td className="py-3 px-4 text-white font-medium font-sans">{evt.activity}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            isSuspicious ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {evt.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {Math.round(evt.confidence * 100)}%
                      </td>
                      <td className="py-3 px-4 text-slate-300">{evt.person_ids}</td>
                      <td className="py-3 px-4 text-slate-300 font-sans">{evt.camera_id}</td>
                      <td className="py-3 px-4 text-slate-400 font-sans">{evt.location}</td>
                      <td className="py-3 px-4 text-slate-300">{evt.timestamp}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onSelectEvent(evt)}
                            className="p-1.5 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(evt.event_id, e)}
                            className="p-1.5 rounded bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
