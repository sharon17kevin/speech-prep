import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface WaveformVisualizationProps {
  audioLevels: number[];
  isRecording: boolean;
  width: number;
  height: number;
}

export function WaveformVisualization({ audioLevels, isRecording, width, height }: WaveformVisualizationProps) {
  const animatedValues = useRef<Animated.Value[]>([]).current;
  
  // Initialize animated values for bars
  useEffect(() => {
    const barCount = Math.floor(width / 6); // 4px bar width + 2px spacing
    if (animatedValues.length !== barCount) {
      animatedValues.splice(0);
      for (let i = 0; i < barCount; i++) {
        animatedValues.push(new Animated.Value(0.1));
      }
    }
  }, [width]);

  // Animate bars based on audio levels
  useEffect(() => {
    if (isRecording && audioLevels.length > 0) {
      const latestLevel = audioLevels[audioLevels.length - 1] || 0;
      const normalizedLevel = Math.min(Math.max(latestLevel / 100, 0.1), 1);
      
      // Animate random bars to simulate real-time audio
      const numberOfBarsToAnimate = Math.floor(animatedValues.length * 0.3);
      for (let i = 0; i < numberOfBarsToAnimate; i++) {
        const randomIndex = Math.floor(Math.random() * animatedValues.length);
        const randomHeight = Math.random() * normalizedLevel;
        
        Animated.timing(animatedValues[randomIndex], {
          toValue: randomHeight,
          duration: 150,
          useNativeDriver: false,
        }).start();
      }
    } else if (!isRecording) {
      // Reset all bars when not recording
      animatedValues.forEach(animValue => {
        Animated.timing(animValue, {
          toValue: 0.1,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [audioLevels, isRecording]);

  const renderBars = () => {
    return animatedValues.map((animValue, index) => (
      <Animated.View
        key={index}
        style={[
          styles.bar,
          {
            height: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [4, height * 0.8],
              extrapolate: 'clamp',
            }),
            backgroundColor: isRecording ? '#3B82F6' : '#E5E7EB',
          },
        ]}
      />
    ));
  };

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.waveform}>
        {renderBars()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 2,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    minHeight: 4,
  },
});