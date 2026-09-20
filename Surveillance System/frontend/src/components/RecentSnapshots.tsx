import React from 'react';
import { Camera, ArrowRight } from 'lucide-react';
import { EventItem } from '../types/surveillance';

interface RecentSnapshotsProps {
  snapshots: EventItem[];
  onViewAll?: () => void;
  onSelectSnapshot?: (event: EventItem) => void;
}

export const RecentSnapshots: React.FC<RecentSnapshotsProps> = ({
  snapshots,
  onViewAll,
  onSelectSnapshot,
}) => {
  const hasRealSnapshots = snapshots && snapshots.length > 0;
  const displaySnapshots = hasRealSnapshots ? snapshots.slice(0, 3) : [];

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase flex items-center gap-2">
          <Camera className="w-4 h-4 text-emerald-400" />
          Recent Snapshots (Suspicious)
        </h3>
        <button
          onClick={onViewAll}
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition"
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {!hasRealSnapshots ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 rounded-lg bg-[#1e293b]/40 border border-slate-800/60">
          <Camera className="w-8 h-8 text-slate-600 mb-2" />
          <span className="text-xs font-bold text-slate-400">No Alert Snapshots Yet</span>
          <span className="text-[10px] text-slate-500 mt-1">
            Real-time evidence snapshots will automatically capture here when suspicious activity or weapon alerts occur.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 flex-1">
          {displaySnapshots.map((item) => {
            const apiHost = `${window.location.hostname}:8000`;
            const rawPath = item.snapshot_path;
            const imgUrl = rawPath?.startsWith('http')
              ? rawPath
              : rawPath ? `http://${apiHost}${rawPath}` : null;

            return (
              <div
                key={item.event_id || item.id}
                onClick={() => onSelectSnapshot && onSelectSnapshot(item)}
                className="group relative rounded-lg overflow-hidden border border-slate-800 bg-[#1e293b] cursor-pointer hover:border-red-500/80 transition flex flex-col"
              >
                {/* Snapshot Image Container */}
                <div className="relative h-24 sm:h-28 overflow-hidden bg-black flex items-center justify-center">
                  {imgUrl ? (
                    <img
                      src={`${imgUrl}?t=${Date.now()}`}
                      alt={item.activity}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-slate-500">
                      <Camera className="w-6 h-6 mb-1 text-slate-600" />
                      <span className="text-[9px] font-bold">No Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                </div>

                {/* Snapshot Label Footer */}
                <div className="p-2 bg-[#1e293b] flex flex-col text-xs">
                  <span className="font-bold text-white font-sans truncate">{item.activity}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
