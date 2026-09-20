import axios from 'axios';
import type { Camera, EventItem, SystemSettings, AnalyticsDistribution } from '../types/surveillance';

const API_HOST = `${window.location.hostname}:8000`;
const API_BASE_URL = `http://${API_HOST}/api`;
const WS_URL = `ws://${API_HOST}/ws/surveillance`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getCameras = async (): Promise<Camera[]> => {
  const res = await api.get('/cameras');
  return res.data;
};

export const createCamera = async (cameraData: {
  camera_id: string;
  name: string;
  location: string;
  source: string;
  status?: string;
}): Promise<Camera> => {
  const res = await api.post('/cameras', cameraData);
  return res.data;
};

export const deleteCamera = async (cameraId: string): Promise<void> => {
  await api.delete(`/cameras/${cameraId}`);
};

export const getEvents = async (params?: {
  activity?: string;
  status?: string;
  camera_id?: string;
  search?: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}): Promise<EventItem[]> => {
  const res = await api.get('/events', { params });
  return res.data;
};

export const getEventDetail = async (eventId: string): Promise<EventItem> => {
  const res = await api.get(`/events/${eventId}`);
  return res.data;
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  await api.delete(`/events/${eventId}`);
};

export const getActivityDistribution = async (): Promise<AnalyticsDistribution> => {
  const res = await api.get('/analytics/distribution');
  return res.data;
};

export const getRecentSnapshots = async (limit = 6): Promise<EventItem[]> => {
  const res = await api.get('/analytics/snapshots', { params: { limit } });
  return res.data;
};

export const getSettings = async (): Promise<SystemSettings> => {
  const res = await api.get('/settings');
  return res.data;
};

export const updateSettings = async (settings: SystemSettings): Promise<SystemSettings> => {
  const res = await api.post('/settings', settings);
  return res.data;
};

export const getExportCsvUrl = (): string => {
  return `${API_BASE_URL}/events/export/csv`;
};

export const connectWebSocket = (onMessage: (data: any) => void): WebSocket => {
  const socket = new WebSocket(WS_URL);
  
  socket.onopen = () => {
    console.log("WebSocket connected to Smart Surveillance stream.");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error("Failed to parse WebSocket message:", e);
    }
  };

  socket.onerror = (err) => {
    console.warn("WebSocket error:", err);
  };

  return socket;
};
