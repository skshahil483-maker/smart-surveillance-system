import React from 'react';
import { User } from 'lucide-react';
import { DetectedPerson } from '../types/surveillance';

interface DetectedPersonsProps {
  persons: DetectedPerson[];
}

export const DetectedPersons: React.FC<DetectedPersonsProps> = ({ persons }) => {
  // Default mock persons matching reference screenshot if telemetry stream is initializing
  const isDemo = !(persons && persons.length > 0);
  const displayPersons = persons && persons.length > 0 ? persons : [
    { track_id: '01', activity: 'Fighting', status: 'SUSPICIOUS', confidence: 0.94, crop_url: '' },
    { track_id: '02', activity: 'Fighting', status: 'SUSPICIOUS', confidence: 0.92, crop_url: '' },
    { track_id: '03', activity: 'Walking', status: 'NORMAL', confidence: 0.96, crop_url: '' },
    { track_id: '04', activity: 'Walking', status: 'NORMAL', confidence: 0.95, crop_url: '' },
  ];

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase flex items-center gap-2">
          <User className="w-4 h-4 text-blue-400" />
          Detected Persons (Live)
          {isDemo && (
            <span className="px-1.5 py-0.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded text-[9px] font-bold tracking-wider">
              SAMPLE DATA
            </span>
          )}
        </h3>
        <span className="text-[11px] text-slate-400 font-mono">
          Total: <strong className="text-white">{displayPersons.length}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {displayPersons.map((p) => {
          const isSuspicious = p.status === 'SUSPICIOUS';
          const apiHost = `${window.location.hostname}:8000`;
          const cropImgSrc = p.crop_url.startsWith('http')
            ? p.crop_url
            : p.crop_url ? `http://${apiHost}${p.crop_url}?t=${Math.floor(Date.now() / 800)}` : '';

          return (
            <div
              key={p.track_id}
              className={`rounded-lg border p-2 bg-[#1e293b]/70 flex flex-col items-center transition ${
                isSuspicious ? 'border-red-600/80 shadow-md shadow-red-950/20' : 'border-emerald-600/60'
              }`}
            >
              {/* Crop Avatar Image */}
              <div className={`w-16 h-16 rounded-md overflow-hidden mb-2 border-2 flex items-center justify-center ${
                isSuspicious ? 'border-red-500' : 'border-emerald-500'
              } ${(!cropImgSrc || cropImgSrc.includes('undefined')) ? 'bg-slate-700' : ''}`}>
                {cropImgSrc && !cropImgSrc.includes('undefined') ? (
                  <img
                    src={cropImgSrc}
                    alt={`Person ${p.track_id}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-slate-500 text-[10px] font-bold">N/A</span>';
                    }}
                  />
                ) : (
                  <User className="w-6 h-6 text-slate-500" />
                )}
              </div>

              {/* Person ID */}
              <span className="text-xs font-bold text-white mb-0.5">
                Person {p.track_id}
              </span>

              {/* Activity Label */}
              <span className="text-[10px] text-slate-400 font-mono mb-1">
                Activity: <strong className="text-slate-200">{p.activity}</strong>
              </span>

              {/* Status Badge */}
              <span
                className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                  isSuspicious
                    ? 'bg-red-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {p.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
