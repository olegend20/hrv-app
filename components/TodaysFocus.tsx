import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Recommendation } from '@/types';

interface TodaysFocusProps {
  recommendation: Recommendation | null;
  onMarkDone?: () => void;
}

export function TodaysFocus({ recommendation, onMarkDone }: TodaysFocusProps) {
  if (!recommendation) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>
          Log more habits to get personalized recommendations
        </Text>
      </View>
    );
  }

  const isIncrease = recommendation.action === 'increase';
  const emoji = isIncrease ? '🎯' : '⚠️';
  const bgColor = isIncrease ? '#e8f5e9' : '#fff3e0';
  const accentColor = isIncrease ? '#27ae60' : '#e65100';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.title}>Today's Focus</Text>
      </View>

      <Text style={styles.message}>{recommendation.message}</Text>
      <Text style={[styles.impact, { color: accentColor }]}>
        {recommendation.expectedImpact}
      </Text>

      {onMarkDone && isIncrease && (
        <TouchableOpacity style={styles.button} onPress={onMarkDone}>
          <Text style={styles.buttonText}>Mark as Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  message: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  impact: {
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});
