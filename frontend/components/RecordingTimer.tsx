import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';

interface RecordingTimerProps {
  duration: number; // in milliseconds
  isRunning: boolean;
}

export function RecordingTimer({ duration, isRunning }: RecordingTimerProps) {
  const [displayTime, setDisplayTime] = useState('00:00');

  useEffect(() => {
    const formatTime = (milliseconds: number): string => {
      const totalSeconds = Math.floor(milliseconds / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    setDisplayTime(formatTime(duration));
  }, [duration]);

  return (
    <View style={styles.container}>
      <View style={styles.timerContent}>
        <Clock size={20} color={isRunning ? '#EF4444' : '#6B7280'} />
        <Text style={[styles.timerText, { color: isRunning ? '#EF4444' : '#6B7280' }]}>
          {displayTime}
        </Text>
      </View>
      {isRunning && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>REC</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  recordingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 1,
  },
});