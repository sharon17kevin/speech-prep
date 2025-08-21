export interface AudioAnalysisResponse {
  transcript: string;
  confidence: number; // 0-100 percentage
  tips: string[];
}

export interface RecordingItem {
  id: string;
  name: string;
  uri: string;
  duration: number;
  createdAt: string;
  size: number;
  analysis?: AudioAnalysisResponse; // Optional, as analysis may fail or not be completed yet
}

export interface RecordingSettings {
  highQuality: boolean;
  autoSave: boolean;
  maxRecordingLength: number; // in seconds
}