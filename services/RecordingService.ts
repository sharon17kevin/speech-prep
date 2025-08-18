import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { RecordingItem } from '@/types/Recording';

export class RecordingService {
  private recordingsDirectory: string;

  constructor() {
    if (Platform.OS !== 'web') {
      this.recordingsDirectory = FileSystem.documentDirectory + 'recordings/';
      this.ensureDirectoryExists();
    } else {
      this.recordingsDirectory = '';
    }
  }

  private async ensureDirectoryExists(): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }
    
    const dirInfo = await FileSystem.getInfoAsync(this.recordingsDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.recordingsDirectory, { intermediates: true });
    }
  }

  async startRecording(): Promise<Audio.Recording> {
    if (Platform.OS === 'web') {
      throw new Error('Recording is not supported on web platform');
    }
    
    const recording = new Audio.Recording();
    
    try {
      const recordingOptions = Audio.RecordingOptionsPresets.HIGH_QUALITY;
      await recording.prepareToRecordAsync(recordingOptions);
      await recording.startAsync();
      return recording;
    } catch (error) {
      console.error('Failed to start recording', error);
      throw error;
    }
  }

  async saveRecording(uri: string, duration: number): Promise<RecordingItem> {
    if (Platform.OS === 'web') {
      throw new Error('Saving recordings is not supported on web platform');
    }
    
    try {
      const timestamp = new Date().toISOString();
      const fileName = `recording_${Date.now()}.m4a`;
      const newUri = this.recordingsDirectory + fileName;
      
      // Move the recording to our recordings directory
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(newUri);
      
      const recordingItem: RecordingItem = {
        id: Date.now().toString(),
        name: `Recording ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        uri: newUri,
        duration,
        createdAt: timestamp,
        size: fileInfo.size || 0,
      };

      // Save to AsyncStorage
      const recordings = await this.getRecordings();
      recordings.unshift(recordingItem);
      await AsyncStorage.setItem('recordings', JSON.stringify(recordings));

      return recordingItem;
    } catch (error) {
      console.error('Failed to save recording', error);
      throw error;
    }
  }

  async getRecordings(): Promise<RecordingItem[]> {
    try {
      const recordingsJson = await AsyncStorage.getItem('recordings');
      if (recordingsJson) {
        return JSON.parse(recordingsJson);
      }
      return [];
    } catch (error) {
      console.error('Failed to get recordings', error);
      return [];
    }
  }

  async deleteRecording(id: string): Promise<void> {
    try {
      const recordings = await this.getRecordings();
      const recording = recordings.find(r => r.id === id);
      
      if (recording) {
        // Delete file from filesystem (only on native platforms)
        if (Platform.OS !== 'web') {
          const fileInfo = await FileSystem.getInfoAsync(recording.uri);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(recording.uri);
          }
        }
        
        // Remove from AsyncStorage
        const updatedRecordings = recordings.filter(r => r.id !== id);
        await AsyncStorage.setItem('recordings', JSON.stringify(updatedRecordings));
      }
    } catch (error) {
      console.error('Failed to delete recording', error);
      throw error;
    }
  }

  async renameRecording(id: string, newName: string): Promise<void> {
    try {
      const recordings = await this.getRecordings();
      const recordingIndex = recordings.findIndex(r => r.id === id);
      
      if (recordingIndex !== -1) {
        recordings[recordingIndex].name = newName;
        await AsyncStorage.setItem('recordings', JSON.stringify(recordings));
      }
    } catch (error) {
      console.error('Failed to rename recording', error);
      throw error;
    }
  }
}