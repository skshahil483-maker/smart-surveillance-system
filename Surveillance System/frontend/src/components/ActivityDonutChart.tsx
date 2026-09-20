import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { AnalyticsDistribution } from '../types/surveillance';

interface ActivityDonutChartProps {
  analytics: AnalyticsDistribution | null;
}

export const ActivityDonutChart: React.FC<ActivityDonutChartProps> = ({ analytics }) => {
  // Default values matching reference screenshot if API loading
  const isDemo = !(analytics?.distribution && analytics.distribution.length > 0);
  const data = analytics?.distribution && analytics.distribution.length > 0 ? analytics.distribution : [
    { name: 'Walking', value: 52, color: '#10B981' },
    { name: 'Running', value: 18, color: '#3B82F6' },
    { name: 'Fighting', value: 14, color: '#EF4444' },
    { name: 'Loitering', value: 12, color: '#F59E0B' },
    { name: 'Falling', value: 10, color: '#8B5CF6' },
    { name: 'Others', value: 20, color: '#6B7280' },
  ];

  const totalEvents = analytics?.total_events || data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-purple-400" />
          Activity Distribution (Today)
          {isDemo && (
            <span className="px-1.5 py-0.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded text-[9px] font-bold tracking-wider">
              SAMPLE DATA
            </span>
          )}
        </h3>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Recharts Donut */}
        <div className="relative w-44 h-44 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Donut Center Counter */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total</span>
            <span className="text-xl font-extrabold text-white font-mono">{totalEvents}</span>
            <span className="text-[9px] text-slate-400">events</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between font-medium">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                ></span>
                <span className="text-slate-300 text-[11px]">{item.name}</span>
              </div>
              <span className="font-mono text-slate-100 font-bold text-[11px]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
