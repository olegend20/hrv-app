import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AnalysisLoadingAnimationProps {
  message?: string;
}

export function AnalysisLoadingAnimation({
  message = 'Analyzing your data...',
}: AnalysisLoadingAnimationProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
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
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const stages = [
    { icon: 'analytics-outline' as const, label: 'Analyzing HRV & Recovery', delay: 0 },
    { icon: 'time-outline' as const, label: 'Reviewing yesterday', delay: 500 },
    { icon: 'trending-up-outline' as const, label: 'Finding patterns', delay: 1000 },
    { icon: 'bulb-outline' as const, label: 'Generating insights', delay: 1500 },
    { icon: 'checkmark-circle-outline' as const, label: 'Creating your plan', delay: 2000 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.animationContainer}>
        <Animated.View
          style={[
            styles.circle,
            {
              transform: [{ scale: pulseAnim }, { rotate }],
            },
          ]}
        >
          <Ionicons name="sparkles" size={48} color="#FF6B35" />
        </Animated.View>
      </View>

      <Text style={styles.mainMessage}>{message}</Text>

      <View style={styles.stagesContainer}>
        {stages.map((stage, index) => (
          <StageItem key={index} icon={stage.icon} label={stage.label} delay={stage.delay} />
        ))}
      </View>

      <Text style={styles.subMessage}>
        We're analyzing your biometrics, habits, and yesterday's performance to create your
        personalized daily plan
      </Text>
    </View>
  );
}

interface StageItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  delay: number;
}

function StageItem({ icon, label, delay }: StageItemProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Animated.View style={[styles.stageItem, { opacity: fadeAnim }]}>
      <Ionicons name={icon} size={20} color="#666" />
      <Text style={styles.stageLabel}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  animationContainer: {
    marginBottom: 32,
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainMessage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 32,
    textAlign: 'center',
  },
  stagesContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  stageLabel: {
    fontSize: 15,
    color: '#666',
  },
  subMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
});
