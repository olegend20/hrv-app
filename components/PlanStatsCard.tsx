import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAIPlanStore } from '@/stores/aiPlanStore';
import { useHrvStore } from '@/stores/hrvStore';

export function PlanStatsCard() {
  const { plans, getAverageAdherence, getCompletionStats } = useAIPlanStore();
  const readings = useHrvStore((state) => state.readings);

  const stats = getCompletionStats();
  const adherence7Days = getAverageAdherence(7);
  const adherence30Days = getAverageAdherence(30);

  // Calculate HRV improvement for users following plans
  const calculateHRVImprovement = () => {
    if (plans.length < 2 || readings.length < 2) return null;

    const plansWithOutcome = plans.filter((p) => p.outcome?.followedPlan);
    if (plansWithOutcome.length === 0) return null;

    // Get HRV readings for days with completed plans
    const datesWithPlans = plansWithOutcome.map((p) => p.date);
    const readingsWithPlans = readings.filter((r) => datesWithPlans.includes(r.date));

    if (readingsWithPlans.length < 2) return null;

    // Calculate average HRV improvement
    const avgBefore =
      readingsWithPlans.slice(0, Math.floor(readingsWithPlans.length / 2))
        .reduce((sum, r) => sum + r.hrvMs, 0) /
      Math.floor(readingsWithPlans.length / 2);

    const avgAfter =
      readingsWithPlans.slice(Math.floor(readingsWithPlans.length / 2))
        .reduce((sum, r) => sum + r.hrvMs, 0) /
      Math.ceil(readingsWithPlans.length / 2);

    return Math.round(avgAfter - avgBefore);
  };

  const hrvImprovement = calculateHRVImprovement();

  if (plans.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Daily Plans</Text>
        <Text style={styles.emptyText}>
          Start tracking your daily plans to see insights here
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/daily-plan')}
        >
          <Text style={styles.buttonText}>Generate Today's Plan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Plan Adherence</Text>
        <TouchableOpacity onPress={() => router.push('/daily-plan')}>
          <Text style={styles.linkText}>View Today →</Text>
        </TouchableOpacity>
      </View>

      {/* Overall Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalPlans}</Text>
          <Text style={styles.statLabel}>Plans</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.round(adherence7Days)}%</Text>
          <Text style={styles.statLabel}>7-Day Rate</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.round(adherence30Days)}%</Text>
          <Text style={styles.statLabel}>30-Day Rate</Text>
        </View>
      </View>

      {/* HRV Improvement */}
      {hrvImprovement !== null && (
        <View
          style={[
            styles.improvementCard,
            hrvImprovement > 0 ? styles.improvementPositive : styles.improvementNegative,
          ]}
        >
          <Text style={styles.improvementValue}>
            {hrvImprovement > 0 ? '+' : ''}
            {hrvImprovement}ms
          </Text>
          <Text style={styles.improvementLabel}>
            HRV change on days you followed plans
          </Text>
        </View>
      )}

      {/* Insights */}
      <View style={styles.insightsSection}>
        <Text style={styles.insightsTitle}>Key Insights</Text>

        {adherence7Days >= 75 && (
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>🔥</Text>
            <Text style={styles.insightText}>
              You've followed plans {Math.round(adherence7Days)}% of the time this week.
              Keep it up!
            </Text>
          </View>
        )}

        {adherence7Days < 50 && (
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>💡</Text>
            <Text style={styles.insightText}>
              Try to follow more recommendations to see better HRV improvements
            </Text>
          </View>
        )}

        {hrvImprovement && hrvImprovement > 5 && (
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>📈</Text>
            <Text style={styles.insightText}>
              Your HRV has improved by {hrvImprovement}ms! Your plans are working.
            </Text>
          </View>
        )}

        {stats.totalPlans >= 30 && adherence30Days >= 60 && (
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>🏆</Text>
            <Text style={styles.insightText}>
              30-day streak of consistent planning! You're building great habits.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  improvementCard: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  improvementPositive: {
    backgroundColor: '#e8f5e9',
  },
  improvementNegative: {
    backgroundColor: '#ffebee',
  },
  improvementValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 4,
  },
  improvementLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  insightsSection: {
    marginTop: 8,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});
