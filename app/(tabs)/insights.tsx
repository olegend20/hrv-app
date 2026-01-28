import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { CorrelationCard } from '@/components/CorrelationCard';
import { ImpactChart } from '@/components/ImpactChart';
import { useHrvStore } from '@/stores/hrvStore';
import { useHabitStore } from '@/stores/habitStore';
import { analyzeAllHabits, rankByImpact } from '@/lib/correlations/analyzer';

export default function InsightsScreen() {
  const readings = useHrvStore((state) => state.readings);
  const habits = useHabitStore((state) => state.entries);

  const analysis = useMemo(() => {
    return analyzeAllHabits(habits, readings, false);
  }, [habits, readings]);

  const rankedCorrelations = useMemo(() => {
    return rankByImpact(analysis.correlations);
  }, [analysis.correlations]);

  // Filter to show meaningful correlations
  const significantCorrelations = rankedCorrelations.filter(
    (c) => c.significance !== 'low' || Math.abs(c.coefficient) >= 0.2
  );

  const positiveCorrelations = significantCorrelations.filter(
    (c) => c.percentageDiff > 0
  );

  const negativeCorrelations = significantCorrelations.filter(
    (c) => c.percentageDiff < 0
  );

  if (!analysis.sufficientData) {
    const daysNeeded = 14 - analysis.totalDays;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Insights</Text>
        <View style={styles.needDataCard}>
          <Text style={styles.needDataIcon}>📊</Text>
          <Text style={styles.needDataTitle}>Need More Data</Text>
          <Text style={styles.needDataText}>
            Log {daysNeeded} more days of habits to unlock personalized insights
            about what affects your HRV.
          </Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(analysis.totalDays / 14) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {analysis.totalDays}/14 days
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Insights</Text>

      <Text style={styles.subtitle}>
        Based on {analysis.totalDays} days of data
      </Text>

      {/* Impact Overview Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Habit Impact Overview</Text>
        <ImpactChart correlations={rankedCorrelations} maxItems={8} />
      </View>

      {/* Positive Impacts */}
      {positiveCorrelations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ✅ Habits That Help Your HRV
          </Text>
          {positiveCorrelations.slice(0, 3).map((correlation) => (
            <CorrelationCard
              key={correlation.habitKey}
              correlation={correlation}
            />
          ))}
        </View>
      )}

      {/* Negative Impacts */}
      {negativeCorrelations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ⚠️ Habits That Hurt Your HRV
          </Text>
          {negativeCorrelations.slice(0, 3).map((correlation) => (
            <CorrelationCard
              key={correlation.habitKey}
              correlation={correlation}
            />
          ))}
        </View>
      )}

      {/* All Correlations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Correlations</Text>
        {rankedCorrelations.map((correlation) => (
          <CorrelationCard
            key={correlation.habitKey}
            correlation={correlation}
          />
        ))}
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Correlations show relationships, not causation. Individual results
          may vary. Consult a healthcare professional for medical advice.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  needDataCard: {
    margin: 20,
    padding: 32,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    alignItems: 'center',
  },
  needDataIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  needDataTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  needDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  disclaimer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 12,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});
