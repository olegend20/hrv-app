import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAIPlanStore } from '@/stores/aiPlanStore';
import { DailyPlan } from '@/types';

export function AICoachCard() {
  const { getTodayPlan } = useAIPlanStore();
  const todayPlan = getTodayPlan();

  if (!todayPlan) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.aiIcon}>🤖</Text>
          <View style={styles.headerText}>
            <Text style={styles.title}>Your AI Coach</Text>
            <Text style={styles.subtitle}>Get personalized daily guidance</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/daily-plan')}
        >
          <Text style={styles.buttonText}>Generate Today's Plan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getFocusAreaColor = (focusArea: DailyPlan['focusArea']) => {
    switch (focusArea) {
      case 'Recovery':
        return '#e74c3c';
      case 'Maintenance':
        return '#f39c12';
      case 'Push':
        return '#27ae60';
      default:
        return '#666';
    }
  };

  const getFocusAreaIcon = (focusArea: DailyPlan['focusArea']) => {
    switch (focusArea) {
      case 'Recovery':
        return '🛀';
      case 'Maintenance':
        return '⚖️';
      case 'Push':
        return '💪';
      default:
        return '📋';
    }
  };

  const topRecommendations = todayPlan.recommendations
    .filter((r) => r.priority === 1)
    .slice(0, 3);

  const completionRate = Math.round(
    (todayPlan.completed.length / todayPlan.recommendations.length) * 100
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.aiIcon}>🤖</Text>
        <View style={styles.headerText}>
          <Text style={styles.title}>Your AI Coach says...</Text>
          <View
            style={[
              styles.focusAreaBadge,
              { backgroundColor: getFocusAreaColor(todayPlan.focusArea) },
            ]}
          >
            <Text style={styles.focusAreaText}>
              {getFocusAreaIcon(todayPlan.focusArea)} {todayPlan.focusArea} Day
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.reasoning}>{todayPlan.reasoning}</Text>

      {topRecommendations.length > 0 && (
        <View style={styles.recommendationsSection}>
          <Text style={styles.recommendationsTitle}>Top Priorities:</Text>
          {topRecommendations.map((rec, index) => {
            const recIndex = todayPlan.recommendations.indexOf(rec);
            const isCompleted = todayPlan.completed.includes(`rec-${recIndex}`);

            return (
              <View key={index} style={styles.recommendationItem}>
                <Text style={styles.recommendationBullet}>
                  {isCompleted ? '✓' : '•'}
                </Text>
                <Text
                  style={[
                    styles.recommendationText,
                    isCompleted && styles.recommendationCompleted,
                  ]}
                >
                  {rec.action}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>Progress: {completionRate}%</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${completionRate}%`,
                  backgroundColor: getFocusAreaColor(todayPlan.focusArea),
                },
              ]}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => router.push('/daily-plan')}
        >
          <Text style={styles.viewButtonText}>View Full Plan →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f8f8ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  aiIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },
  focusAreaBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  focusAreaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  reasoning: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendationsSection: {
    marginBottom: 12,
  },
  recommendationsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  recommendationBullet: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 8,
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  recommendationCompleted: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  footer: {
    marginTop: 8,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  viewButton: {
    alignSelf: 'flex-end',
  },
  viewButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
