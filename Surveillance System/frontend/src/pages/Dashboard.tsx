import React from 'react';
import { LiveCameraFeed } from '../components/LiveCameraFeed';
import { AlertCard } from '../components/AlertCard';
import { DetectedPersons } from '../components/DetectedPersons';
import { ActivityDonutChart } from '../components/ActivityDonutChart';
import { EventLogTable } from '../components/EventLogTable';
import { RecentSnapshots } from '../components/RecentSnapshots';
import { TelemetryData, EventItem, AnalyticsDistribution } from '../types/surveillance';

interface DashboardProps {
  telemetry: TelemetryData | null;
  events: EventItem[];
  analytics: AnalyticsDistribution | null;
  snapshots: EventItem[];
  selectedSource: string;
  selectedCamera: string;
  onSourceChange: (src: string) => void;
  onViewAllEvents: () => void;
  onSelectEvent: (event: EventItem) => void;
  soundEnabled: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  telemetry,
  events,
  analytics,
  snapshots,
  selectedSource,
  selectedCamera,
  onSourceChange,
  onViewAllEvents,
  onSelectEvent,
  soundEnabled,
}) => {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1800px] mx-auto">
      {/* Top Main Section: Live Video (Left 2/3) + Alert Card & Event Log (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Camera Panel (Takes 2 Columns on Large Screens) */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <LiveCameraFeed
            telemetry={telemetry}
            selectedSource={selectedSource}
            selectedCamera={selectedCamera}
            onSourceChange={onSourceChange}
          />
        </div>

        {/* Right Column: Alert Card & Event Log Table */}
        <div className="flex flex-col gap-6">
          <AlertCard alert={telemetry?.active_alert || null} soundEnabled={soundEnabled} />
          <div className="flex-1 min-h-[320px]">
            <EventLogTable
              events={events}
              onViewAll={onViewAllEvents}
              onSelectEvent={onSelectEvent}
            />
          </div>
        </div>
      </div>

      {/* Bottom Section: Detected Persons Cards + Activity Donut Chart + Recent Snapshots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Live Detected Persons */}
        <div className="lg:col-span-1">
          <DetectedPersons persons={telemetry?.detected_persons || []} />
        </div>

        {/* Center: Activity Distribution Donut Chart */}
        <div className="lg:col-span-1">
          <ActivityDonutChart analytics={analytics} />
        </div>

        {/* Right: Recent Suspicious Snapshots */}
        <div className="lg:col-span-1">
          <RecentSnapshots
            snapshots={snapshots}
            onViewAll={onViewAllEvents}
            onSelectSnapshot={onSelectEvent}
          />
        </div>
      </div>
    </div>
  );
};
