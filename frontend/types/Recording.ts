export interface RecordingItem {
  id: string;
  name: string;
  uri: string;
  duration: number; // in milliseconds
  createdAt: string; // ISO string
  size?: number; // in bytes
}

export interface RecordingSettings {
  highQuality: boolean;
  autoSave: boolean;
  maxRecordingLength: number; // in seconds
}