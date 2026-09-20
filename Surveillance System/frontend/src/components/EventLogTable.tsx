import React from 'react';
import { List, ArrowRight } from 'lucide-react';
import { EventItem } from '../types/surveillance';

interface EventLogTableProps {
  events: EventItem[];
  onViewAll?: () => void;
  onSelectEvent?: (event: EventItem) => void;
}

export const EventLogTable: React.FC<EventLogTableProps> = ({
  events,
  onViewAll,
  onSelectEvent,
}) => {
  // Default sample events matching reference screenshot if API loading
  const isDemo = !(events && events.length > 0);
  const displayEvents = events && events.length > 0 ? events.slice(0, 8) : [
    { id: 1, event_id: 'EVT-000001', camera_id: 'Cam 01', activity: 'Fighting', status: 'SUSPICIOUS', confidence: 0.94, person_ids: '01, 02', location: 'Main Corridor', timestamp: '17:25:32', created_at: '' },
    { id: 2, event_id: 'EVT-000002', camera_id: 'Cam 01', activity: 'Running', status: 'NORMAL', confidence: 0.88, person_ids: '04', location: 'Main Corridor', timestamp: '17:18:11', created_at: '' },
    { id: 3, event_id: 'EVT-000003', camera_id: 'Cam 02', activity: 'Loitering', status: 'SUSPICIOUS', confidence: 0.85, person_ids: '03', location: 'Entrance', timestamp: '17:12:03', created_at: '' },
    { id: 4, event_id: 'EVT-000004', camera_id: 'Cam 01', activity: 'Walking', status: 'NORMAL', confidence: 0.95, person_ids: '03, 04', location: 'Main Corridor', timestamp: '16:58:41', created_at: '' },
    { id: 5, event_id: 'EVT-000005', camera_id: 'Cam 03', activity: 'Falling', status: 'SUSPICIOUS', confidence: 0.89, person_ids: '05', location: 'Parking Area', timestamp: '16:45:20', created_at: '' },
    { id: 6, event_id: 'EVT-000006', camera_id: 'Cam 02', activity: 'Walking', status: 'NORMAL', confidence: 0.92, person_ids: '06', location: 'Entrance', timestamp: '16:32:11', created_at: '' },
    { id: 7, event_id: 'EVT-000007', camera_id: 'Cam 01', activity: 'Trespassing', status: 'SUSPICIOUS', confidence: 0.91, person_ids: '07', location: 'Main Corridor', timestamp: '16:21:09', created_at: '' },
    { id: 8, event_id: 'EVT-000008', camera_id: 'Cam 03', activity: 'Standing', status: 'NORMAL', confidence: 0.90, person_ids: '08', location: 'Parking Area', timestamp: '16:10:44', created_at: '' },
  ] as EventItem[];

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2">
        <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase flex items-center gap-2">
          <List className="w-4 h-4 text-blue-400" />
          Event Log
          {isDemo && (
            <span className="px-1.5 py-0.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded text-[9px] font-bold tracking-wider">
              SAMPLE DATA
            </span>
          )}
        </h3>
        <button
          onClick={onViewAll}
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition"
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-sans font-semibold">
              <th className="py-2 px-2">Time</th>
              <th className="py-2 px-2">Activity</th>
              <th className="py-2 px-2">Status</th>
              <th className="py-2 px-2 text-right">Camera</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {displayEvents.map((evt) => {
              const isSuspicious = evt.status === 'SUSPICIOUS';
              return (
                <tr
                  key={evt.event_id || evt.id}
                  onClick={() => onSelectEvent && onSelectEvent(evt)}
                  className="hover:bg-slate-800/50 cursor-pointer transition"
                >
                  <td className="py-2.5 px-2 text-slate-300 font-bold">{evt.timestamp}</td>
                  <td className="py-2.5 px-2 text-white font-medium font-sans">{evt.activity}</td>
                  <td className="py-2.5 px-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                        isSuspicious
                          ? 'bg-red-600/90 text-white'
                          : 'bg-emerald-600/90 text-white'
                      }`}
                    >
                      {evt.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-400 font-sans">{evt.camera_id}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
