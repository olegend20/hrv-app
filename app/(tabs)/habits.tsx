import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { HabitForm } from '@/components/HabitForm';
import { useHabitStore, calculateStreak } from '@/stores/habitStore';
import { HabitEntry } from '@/types';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export default function HabitsScreen() {
  const [isLogging, setIsLogging] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  const entries = useHabitStore((state) => state.entries);
  const addEntry = useHabitStore((state) => state.addEntry);
  const getEntryByDate = useHabitStore((state) => state.getEntryByDate);

  const todayEntry = getEntryByDate(getTodayDate());
  const streak = calculateStreak(entries);

  const handleSubmit = (data: Omit<HabitEntry, 'id'>) => {
    addEntry(data);
    setIsLogging(false);
    Alert.alert(
      'Habits Logged!',
      `Day ${streak + 1} of your streak. Keep it up!`,
      [{ text: 'OK' }]
    );
  };

  const handleCancel = () => {
    setIsLogging(false);
    setSelectedDate(getTodayDate());
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLogging) {
    return (
      <HabitForm
        date={selectedDate}
        initialData={getEntryByDate(selectedDate)}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Habits</Text>

      {/* Streak Display */}
      <View style={styles.streakCard}>
        <Text style={styles.streakEmoji}>🔥</Text>
        <Text style={styles.streakNumber}>{streak}</Text>
        <Text style={styles.streakLabel}>day streak</Text>
      </View>

      {/* Today's Status */}
      {todayEntry ? (
        <View style={styles.todayCard}>
          <Text style={styles.todayTitle}>Today's Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryItem}>
              😴 {todayEntry.sleep.hours} hrs (quality {todayEntry.sleep.quality}/5)
            </Text>
          </View>
          {todayEntry.exercise && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryItem}>
                🏃 {todayEntry.exercise.durationMins} min {todayEntry.exercise.type.toLowerCase()}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryItem}>
              🧘 {todayEntry.meditation.practiced ? `${todayEntry.meditation.durationMins} min` : 'No'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryItem}>
              🍷 {todayEntry.alcohol.consumed ? `${todayEntry.alcohol.units} units` : 'None'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryItem}>
              😰 Stress: {todayEntry.stressLevel}/5
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setSelectedDate(getTodayDate());
              setIsLogging(true);
            }}
          >
            <Text style={styles.editButtonText}>Edit Today's Entry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Log Today's Habits</Text>
          <Text style={styles.emptyText}>
            Track your sleep, exercise, and other habits to see how they affect
            your HRV.
          </Text>
        </View>
      )}

      {/* Log Button */}
      <TouchableOpacity
        style={styles.logButton}
        onPress={() => {
          setSelectedDate(getTodayDate());
          setIsLogging(true);
        }}
      >
        <Text style={styles.logButtonText}>
          {todayEntry ? 'Update Today' : '+ Log Today\'s Habits'}
        </Text>
      </TouchableOpacity>

      {/* Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Your Progress</Text>
        <Text style={styles.statsText}>
          {entries.length} days logged total
        </Text>
        {entries.length >= 14 ? (
          <Text style={styles.statsHighlight}>
            ✓ You have enough data for insights!
          </Text>
        ) : (
          <Text style={styles.statsProgress}>
            Log {14 - entries.length} more days to unlock personalized insights
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  streakCard: {
    backgroundColor: '#fff3e0',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  streakEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#e65100',
  },
  streakLabel: {
    fontSize: 16,
    color: '#e65100',
  },
  todayCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    marginBottom: 8,
  },
  summaryItem: {
    fontSize: 14,
    color: '#333',
  },
  editButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  logButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    padding: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1565c0',
  },
  statsText: {
    fontSize: 14,
    color: '#1565c0',
    marginBottom: 4,
  },
  statsHighlight: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '500',
  },
  statsProgress: {
    fontSize: 14,
    color: '#666',
  },
});
