import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { HRVChart } from '@/components/HRVChart';
import { StatsCard } from '@/components/StatsCard';
import { LogTodayPrompt } from '@/components/LogTodayPrompt';
import { useHrvStore } from '@/stores/hrvStore';
import { useUserStore } from '@/stores/userStore';
import { useHabitStore } from '@/stores/habitStore';
import { calculateStatistics, calculateChange, getReadingsForLastDays } from '@/lib/hrv/statistics';
import { getPercentile, getOrdinalSuffix } from '@/lib/hrv/percentile';
import { getBenchmark } from '@/constants/benchmarks';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export default function DashboardScreen() {
  const readings = useHrvStore((state) => state.readings);
  const profile = useUserStore((state) => state.profile);
  const getHabitByDate = useHabitStore((state) => state.getEntryByDate);

  const todayHabitLogged = !!getHabitByDate(getTodayDate());

  const stats = calculateStatistics(readings);

  // Get benchmark for user's profile
  const benchmark = profile ? getBenchmark(profile.age, profile.gender) : null;

  // Get percentile if we have data and profile
  const percentileResult =
    stats.current !== null && profile
      ? getPercentile(stats.current, profile.age, profile.gender)
      : null;

  // Calculate change from yesterday
  const last2Days = getReadingsForLastDays(readings, 2);
  const changeFromYesterday =
    last2Days.length >= 2
      ? calculateChange(last2Days[1].hrvMs, last2Days[0].hrvMs)
      : null;

  const hasData = readings.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Dashboard</Text>

      {!hasData ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>♥</Text>
          <Text style={styles.emptyTitle}>Welcome to HRV Optimizer</Text>
          <Text style={styles.emptyText}>
            Import your WHOOP data to start tracking your heart rate variability
          </Text>
          <Link href="/import" asChild>
            <TouchableOpacity style={styles.importButton}>
              <Text style={styles.importButtonText}>Import WHOOP Data</Text>
            </TouchableOpacity>
          </Link>
        </View>
      ) : (
        <>
          {/* Log Today Prompt */}
          {!todayHabitLogged && <LogTodayPrompt />}

          {/* Current HRV Card */}
          <View style={styles.currentHrvCard}>
            <Text style={styles.currentHrvLabel}>Your HRV Today</Text>
            <Text style={styles.currentHrvValue}>
              {stats.current ?? '—'} <Text style={styles.currentHrvUnit}>ms</Text>
            </Text>
            {changeFromYesterday && (
              <Text
                style={[
                  styles.change,
                  {
                    color:
                      changeFromYesterday.direction === 'up'
                        ? '#27ae60'
                        : changeFromYesterday.direction === 'down'
                        ? '#e74c3c'
                        : '#666',
                  },
                ]}
              >
                {changeFromYesterday.direction === 'up' ? '▲' : changeFromYesterday.direction === 'down' ? '▼' : '─'}{' '}
                {changeFromYesterday.value}% vs yesterday
              </Text>
            )}
            {percentileResult && (
              <Text style={styles.percentile}>
                {getOrdinalSuffix(percentileResult.percentile)} percentile for your age
              </Text>
            )}
          </View>

          {/* HRV Chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HRV Trend (Last 30 Days)</Text>
            <HRVChart
              readings={readings}
              benchmarkLine={benchmark?.p50}
              goalLine={profile?.targetPercentile ? getBenchmark(profile.age, profile.gender).p75 : undefined}
            />
          </View>

          {/* Stats Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Stats</Text>
            <View style={styles.statsRow}>
              <StatsCard
                label="7-Day Avg"
                value={stats.average7Day}
                trend={stats.trend === 'improving' ? 'up' : stats.trend === 'declining' ? 'down' : 'same'}
              />
              <View style={styles.statsSpacer} />
              <StatsCard label="30-Day Avg" value={stats.average30Day} />
              <View style={styles.statsSpacer} />
              <StatsCard
                label="Best Day"
                value={stats.max}
                subtitle={stats.max ? `↑ from ${stats.min}ms` : undefined}
              />
            </View>
          </View>

          {/* Import More Data Link */}
          <Link href="/import" asChild>
            <TouchableOpacity style={styles.importMoreButton}>
              <Text style={styles.importMoreText}>Import More Data</Text>
            </TouchableOpacity>
          </Link>
        </>
      )}
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    color: '#e74c3c',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  importButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  currentHrvCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  currentHrvLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  currentHrvValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  currentHrvUnit: {
    fontSize: 20,
    fontWeight: 'normal',
    color: '#666',
  },
  change: {
    fontSize: 14,
    marginTop: 8,
  },
  percentile: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statsSpacer: {
    width: 12,
  },
  importMoreButton: {
    alignItems: 'center',
    padding: 16,
  },
  importMoreText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
