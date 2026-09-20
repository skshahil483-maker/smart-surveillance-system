export interface Camera {
  id: number;
  camera_id: string;
  name: string;
  location: string;
  source: string;
  status: 'Online' | 'Offline';
  is_active: boolean;
}

export interface DetectedWeapon {
  class_name: string;
  confidence: number;
  bbox: number[];
  associated_person_id?: string | null;
}

export interface EventItem {
  id: number;
  event_id: string;
  camera_id: string;
  event_type?: string;
  activity: string;
  status: 'SUSPICIOUS' | 'NORMAL';
  confidence: number;
  person_ids: string;
  weapon_type?: string | null;
  weapon_confidence?: number | null;
  location: string;
  timestamp: string;
  snapshot_path?: string | null;
  video_path?: string | null;
  created_at: string;
}

export interface DetectedPerson {
  track_id: string;
  activity: string;
  status: 'SUSPICIOUS' | 'NORMAL';
  confidence: number;
  crop_url: string;
}

export interface ActiveAlert {
  camera_id: string;
  event_type?: string;
  activity: string;
  status: 'SUSPICIOUS';
  confidence: number;
  person_ids: string;
  persons_count: number;
  weapon_type?: string | null;
  weapon_confidence?: number | null;
  location: string;
  timestamp: string;
  snapshot_path?: string;
}

export interface TelemetryData {
  camera_id: string;
  persons_count: number;
  activity: string;
  status: 'SUSPICIOUS' | 'NORMAL';
  fps: number;
  inference_ms: number;
  timestamp: string;
  active_alert: ActiveAlert | null;
  detected_persons: DetectedPerson[];
  detected_weapons?: DetectedWeapon[];
}

export interface SystemSettings {
  id?: number;
  confidence_threshold: number;
  alert_cooldown: number;
  loitering_threshold: number;
  alert_enabled: boolean;
  sound_enabled: boolean;
  active_camera_id: string;
  weapon_detection_enabled?: boolean;
  weapon_confidence_threshold?: number;
  weapon_confirmation_frames?: number;
}

export interface DistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface AnalyticsDistribution {
  total_events: number;
  distribution: DistributionItem[];
}
