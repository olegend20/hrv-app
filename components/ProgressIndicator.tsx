import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface ProgressIndicatorProps {
  current: number;
  goal: number;
  label: string;
}

export function ProgressIndicator({ current, goal, label }: ProgressIndicatorProps) {
  const progress = Math.min((current / goal) * 100, 100);
  const isAtGoal = current >= goal;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.status, isAtGoal && styles.statusAchieved]}>
          {isAtGoal ? '✓ Goal Met!' : `${Math.round(progress)}%`}
        </Text>
      </View>

      <View style={styles.barContainer}>
        <View
          style={[
            styles.barFill,
            { width: `${progress}%` },
            isAtGoal && styles.barFillAchieved,
          ]}
        />
        <View style={[styles.goalMarker, { left: '100%' }]} />
      </View>

      <View style={styles.values}>
        <Text style={styles.current}>{current} ms</Text>
        <Text style={styles.goal}>Goal: {goal} ms</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  status: {
    fontSize: 14,
    color: '#666',
  },
  statusAchieved: {
    color: '#27ae60',
    fontWeight: '600',
  },
  barContainer: {
    height: 12,
    backgroundColor: '#ddd',
    borderRadius: 6,
    overflow: 'visible',
    position: 'relative',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  barFillAchieved: {
    backgroundColor: '#27ae60',
  },
  goalMarker: {
    position: 'absolute',
    top: -4,
    width: 2,
    height: 20,
    backgroundColor: '#333',
    marginLeft: -1,
  },
  values: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  current: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  goal: {
    fontSize: 14,
    color: '#666',
  },
});
