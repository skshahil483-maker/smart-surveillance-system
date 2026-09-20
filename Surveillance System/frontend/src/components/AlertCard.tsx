import React from 'react';
import { AlertTriangle, CheckCircle2, Bell } from 'lucide-react';
import { ActiveAlert } from '../types/surveillance';

interface AlertCardProps {
  alert: ActiveAlert | null;
  soundEnabled: boolean;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  const isSuspicious = alert !== null;
  const isWeapon = alert?.event_type === 'WEAPON_DETECTED' || alert?.weapon_type != null || alert?.activity.includes('Knife') || alert?.activity.includes('Gun');

  return (
    <div className={`rounded-xl border p-5 transition-all duration-300 shadow-xl ${
      isSuspicious
        ? 'bg-red-950/40 border-red-600/80 shadow-red-900/20'
        : 'bg-emerald-950/20 border-emerald-800/50 shadow-emerald-950/10'
    }`}>
      {isSuspicious ? (
        <div>
          {/* Header Badge */}
          <div className="flex items-center gap-3 border-b border-red-800/60 pb-3 mb-4">
            <div className="p-2 bg-red-600/20 rounded-lg text-red-500 animate-bounce">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-red-500 tracking-wide uppercase">
                {isWeapon ? '🔴 WEAPON DETECTED' : 'Suspicious Activity Detected'}
              </h3>
              <p className="text-xs text-red-400 font-medium">
                {isWeapon ? 'CRITICAL SECURITY THREAT DETECTED' : 'Immediate Attention Required'}
              </p>
            </div>
          </div>

          {/* Key-Value Details */}
          <div className="space-y-2 text-xs font-mono text-slate-300">
            {isWeapon && (
              <div className="flex justify-between py-1 border-b border-red-900/40">
                <span className="text-slate-400">Weapon</span>
                <span className="font-extrabold text-red-400 uppercase text-sm">
                  {alert.weapon_type || alert.activity}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-red-900/40">
              <span className="text-slate-400">Person</span>
              <span className="font-bold text-white">
                ID: {alert.person_ids || 'Unassigned'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-red-900/40">
              <span className="text-slate-400">Camera</span>
              <span className="font-bold text-slate-200">{alert.camera_id}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-red-900/40">
              <span className="text-slate-400">Time</span>
              <span className="font-bold text-slate-200">{alert.timestamp}</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-400">Confidence</span>
              <span className="font-bold text-red-400">
                {Math.round((alert.weapon_confidence || alert.confidence) * 100)}%
              </span>
            </div>
          </div>

          {/* Alert Button */}
          <div className="mt-5">
            <button className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 animate-pulse">
              <Bell className="w-4 h-4 fill-white" /> Alert Triggered
            </button>
          </div>
        </div>
      ) : (
        <div className="py-6 flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-400 mb-3 border border-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-emerald-400 tracking-wide uppercase">
            System Normal
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            No weapon detections or suspicious activity currently detected in monitored zone.
          </p>
        </div>
      )}
    </div>
  );
};
