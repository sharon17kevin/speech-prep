import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Settings as SettingsIcon,
  Mic,
  FileAudio,
  Trash2,
  Info,
  ChevronRight,
} from 'lucide-react-native';
import { RecordingService } from '@/services/RecordingService';

export default function SettingsScreen() {
  const [highQuality, setHighQuality] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [storageUsed, setStorageUsed] = useState('0 MB');
  const [totalRecordings, setTotalRecordings] = useState(0);

  const recordingService = new RecordingService();

  useEffect(() => {
    loadSettings();
    loadStorageInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const qualitySetting = await AsyncStorage.getItem('highQuality');
      const autoSaveSetting = await AsyncStorage.getItem('autoSave');
      
      if (qualitySetting !== null) {
        setHighQuality(JSON.parse(qualitySetting));
      }
      if (autoSaveSetting !== null) {
        setAutoSave(JSON.parse(autoSaveSetting));
      }
    } catch (error) {
      console.error('Failed to load settings', error);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const recordings = await recordingService.getRecordings();
      setTotalRecordings(recordings.length);
      
      const totalSize = recordings.reduce((sum, recording) => sum + (recording.size || 0), 0);
      setStorageUsed(formatFileSize(totalSize));
    } catch (error) {
      console.error('Failed to load storage info', error);
    }
  };

  const saveSettings = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save settings', error);
    }
  };

  const handleHighQualityToggle = (value: boolean) => {
    setHighQuality(value);
    saveSettings('highQuality', value);
  };

  const handleAutoSaveToggle = (value: boolean) => {
    setAutoSave(value);
    saveSettings('autoSave', value);
  };

  const clearAllRecordings = () => {
    Alert.alert(
      'Clear All Recordings',
      'Are you sure you want to delete all recordings? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const recordings = await recordingService.getRecordings();
              for (const recording of recordings) {
                await recordingService.deleteRecording(recording.id);
              }
              loadStorageInfo();
              Alert.alert('Success', 'All recordings have been deleted.');
            } catch (error) {
              console.error('Failed to delete recordings', error);
              Alert.alert('Error', 'Failed to delete recordings.');
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const showRecordingInfo = () => {
    Alert.alert(
      'Recording Quality',
      'High Quality: Records at 44.1kHz with higher bitrate for better sound quality but larger file sizes.\n\nStandard Quality: Records at 22kHz with lower bitrate for smaller file sizes.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Configure your recording preferences</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recording Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <View style={styles.settingHeader}>
              <Mic size={20} color="#3B82F6" />
              <Text style={styles.settingTitle}>High Quality Recording</Text>
            </View>
            <Text style={styles.settingDescription}>
              Enable for better audio quality (larger file size)
            </Text>
          </View>
          <View style={styles.settingControl}>
            <TouchableOpacity onPress={showRecordingInfo} style={styles.infoButton}>
              <Info size={16} color="#6B7280" />
            </TouchableOpacity>
            <Switch
              value={highQuality}
              onValueChange={handleHighQualityToggle}
              trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
              thumbColor={highQuality ? '#3B82F6' : '#9CA3AF'}
            />
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <View style={styles.settingHeader}>
              <FileAudio size={20} color="#3B82F6" />
              <Text style={styles.settingTitle}>Auto-save Recordings</Text>
            </View>
            <Text style={styles.settingDescription}>
              Automatically save recordings when stopped
            </Text>
          </View>
          <Switch
            value={autoSave}
            onValueChange={handleAutoSaveToggle}
            trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
            thumbColor={autoSave ? '#3B82F6' : '#9CA3AF'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>
        
        <View style={styles.storageInfo}>
          <View style={styles.storageItem}>
            <Text style={styles.storageLabel}>Total Recordings</Text>
            <Text style={styles.storageValue}>{totalRecordings}</Text>
          </View>
          <View style={styles.storageItem}>
            <Text style={styles.storageLabel}>Storage Used</Text>
            <Text style={styles.storageValue}>{storageUsed}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.clearButton} onPress={clearAllRecordings}>
          <Trash2 size={20} color="#EF4444" />
          <Text style={styles.clearButtonText}>Clear All Recordings</Text>
          <ChevronRight size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.aboutInfo}>
          <Text style={styles.aboutText}>Voice Recorder & Analysis</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          <Text style={styles.aboutDescription}>
            Professional audio recording app with basic analysis features.
            Record high-quality audio and manage your recordings with ease.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  settingInfo: {
    flex: 1,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  settingControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoButton: {
    padding: 4,
  },
  storageInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  storageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  storageLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  storageValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  clearButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  clearButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  aboutInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  aboutText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});