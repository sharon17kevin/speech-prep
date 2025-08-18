import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Slider } from 'react-native';
import { Audio } from 'expo-av';
import { Play, Pause } from 'lucide-react-native';

interface AudioPlayerProps {
  uri: string;
  duration: number;
  onPlaybackStatusUpdate?: (status: any) => void;
}

export function AudioPlayer({ uri, duration, onPlaybackStatusUpdate }: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const loadAndPlaySound = async () => {
    try {
      setIsLoading(true);
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, progressUpdateIntervalMillis: 100 }
      );
      
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis || 0);
          setIsPlaying(status.isPlaying);
          
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPosition(0);
          }
          
          onPlaybackStatusUpdate?.(status);
        }
      });
    } catch (error) {
      console.error('Error loading sound:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pauseSound = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const resumeSound = async () => {
    if (sound) {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const seekTo = async (value: number) => {
    if (sound) {
      await sound.setPositionAsync(value);
      setPosition(value);
    }
  };

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!sound) {
      loadAndPlaySound();
    } else if (isPlaying) {
      pauseSound();
    } else {
      resumeSound();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.playButton, isLoading && styles.playButtonDisabled]}
        onPress={handlePlayPause}
        disabled={isLoading}
      >
        {isPlaying ? (
          <Pause size={16} color="#FFFFFF" />
        ) : (
          <Play size={16} color="#FFFFFF" />
        )}
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>{formatTime(position)}</Text>
        <Slider
          style={styles.slider}
          value={position}
          maximumValue={duration}
          minimumValue={0}
          onValueChange={seekTo}
          minimumTrackTintColor="#3B82F6"
          maximumTrackTintColor="#E5E7EB"
          thumbStyle={styles.sliderThumb}
        />
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 20,
  },
  sliderThumb: {
    width: 16,
    height: 16,
    backgroundColor: '#3B82F6',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
    minWidth: 40,
  },
});