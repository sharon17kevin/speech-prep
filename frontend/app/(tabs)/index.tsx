import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Mic, Square, Play, Pause } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RecordingService } from '@/services/RecordingService';
import { WaveformVisualization } from '@/components/WaveformVisualization';
import { RecordingTimer } from '@/components/RecordingTimer';

const { width } = Dimensions.get('window');

export default function RecordScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([]);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingService = new RecordingService();

  useEffect(() => {
    if (isRecording && !isPaused) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        const permission = await requestPermission();
        if (permission.status !== 'granted') {
          Alert.alert('Permission required', 'Please grant microphone access to record audio.');
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = await recordingService.startRecording();
      setRecording(newRecording);
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      setAudioLevels([]);

      // Update recording status
      newRecording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          setDuration(status.durationMillis || 0);
          if (status.metering !== undefined) {
            setAudioLevels(prev => [...prev.slice(-50), Math.max(0, (status.metering || -100) + 100)]);
          }
        }
      });
    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const pauseRecording = async () => {
    if (recording) {
      try {
        await recording.pauseAsync();
        setIsPaused(true);
      } catch (error) {
        console.error('Failed to pause recording', error);
      }
    }
  };

  const resumeRecording = async () => {
    if (recording && isPaused) {
      try {
        await recording.startAsync();
        setIsPaused(false);
      } catch (error) {
        console.error('Failed to resume recording', error);
      }
    }
  };

  const stopRecording = async () => {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        
        if (uri) {
          await recordingService.saveRecording(uri, duration);
          Alert.alert('Success', 'Recording saved successfully!');
        }
        
        setRecording(null);
        setIsRecording(false);
        setIsPaused(false);
        setDuration(0);
        setAudioLevels([]);
      } catch (error) {
        console.error('Failed to stop recording', error);
        Alert.alert('Error', 'Failed to save recording.');
      }
    }
  };

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Recorder</Text>
        <Text style={styles.subtitle}>
          {isRecording ? (isPaused ? 'Paused' : 'Recording...') : 'Ready to record'}
        </Text>
      </View>

      <View style={styles.visualizationContainer}>
        <WaveformVisualization 
          audioLevels={audioLevels} 
          isRecording={isRecording && !isPaused}
          width={width - 40}
          height={120}
        />
      </View>

      <View style={styles.timerContainer}>
        <RecordingTimer duration={duration} isRunning={isRecording && !isPaused} />
      </View>

      <View style={styles.controlsContainer}>
        {!isRecording ? (
          <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
            <Animated.View style={[styles.recordButtonInner, { transform: [{ scale: pulseAnim }] }]}>
              <Mic size={32} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={isPaused ? resumeRecording : pauseRecording}
            >
              {isPaused ? (
                <Play size={24} color="#3B82F6" />
              ) : (
                <Pause size={24} color="#3B82F6" />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
              <Square size={20} color="#FFFFFF" fill="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {isRecording 
            ? `Recording: ${formatDuration(duration)}`
            : 'Tap the microphone to start recording'
          }
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  visualizationContainer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  controlsContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stopButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
});