import React from 'react';
import { X, Trash2, Calendar, MapPin, ShieldAlert, UserCheck, Video } from 'lucide-react';
import { EventItem } from '../types/surveillance';

interface EventDetailsModalProps {
  event: EventItem | null;
  onClose: () => void;
  onDelete?: (eventId: string) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  onClose,
  onDelete,
}) => {
  if (!event) return null;

  const isSuspicious = event.status === 'SUSPICIOUS';
  const apiHost = `${window.location.hostname}:8000`;
  const imgUrl = event.snapshot_path?.startsWith('http')
    ? event.snapshot_path
    : event.snapshot_path ? `http://${apiHost}${event.snapshot_path}` : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] rounded-xl border border-slate-700 max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-[#1e293b] px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span
              className={`p-2 rounded-lg ${
                isSuspicious ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Event Detail: <span className="font-mono text-blue-400">{event.event_id}</span>
              </h3>
              <p className="text-xs text-slate-400">Captured Evidence Snapshot & Log Metadata</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Snapshot Media */}
          <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-black max-h-[320px] flex items-center justify-center">
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={event.activity}
                className="max-h-[320px] w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.querySelector('.modal-fallback')?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`modal-fallback flex flex-col items-center text-slate-500 py-12 ${imgUrl ? 'hidden' : ''}`}>
              <Video className="w-10 h-10 mb-2 text-slate-600" />
              <span className="text-xs font-bold">Snapshot Not Available</span>
              <span className="text-[10px] text-slate-600 mt-0.5">Image was not captured for this event</span>
            </div>
            <div className="absolute top-3 left-3 bg-black/80 px-3 py-1 rounded text-xs font-mono font-bold text-white border border-white/10">
              SNAPSHOT EVIDENCE
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-[#1e293b] p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-sans text-[11px]">
                <Video className="w-3.5 h-3.5 text-blue-400" /> Activity
              </span>
              <span className="font-bold text-white text-sm">{event.activity}</span>
            </div>

            <div className="bg-[#1e293b] p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-sans text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-400" /> Status
              </span>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-extrabold uppercase ${
                  isSuspicious ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {event.status}
              </span>
            </div>

            <div className="bg-[#1e293b] p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-sans text-[11px]">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Confidence
              </span>
              <span className="font-bold text-emerald-400 text-sm">
                {Math.round(event.confidence * 100)}%
              </span>
            </div>

            <div className="bg-[#1e293b] p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-sans text-[11px]">
                <UserCheck className="w-3.5 h-3.5 text-amber-400" /> Person IDs
              </span>
              <span className="font-bold text-white text-sm">{event.person_ids}</span>
            </div>

            <div className="bg-[#1e293b] p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-sans text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-red-400" /> Location
              </span>
              <span className="font-bold text-slate-200 text-xs font-sans">{event.location}</span>
            </div>

            <div className="bg-[#1e293b] p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-sans text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Timestamp
              </span>
              <span className="font-bold text-slate-200 text-xs">{event.timestamp}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-[#1e293b] px-6 py-3 flex items-center justify-between border-t border-slate-800">
          {onDelete && (
            <button
              onClick={() => {
                onDelete(event.event_id);
                onClose();
              }}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Record
            </button>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
