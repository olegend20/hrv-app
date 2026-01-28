import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { HabitForm } from '@/components/HabitForm';
import { HabitCalendar } from '@/components/HabitCalendar';
import { useHabitStore, calculateStreak } from '@/stores/habitStore';
import { HabitEntry } from '@/types';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export default function HabitsScreen() {
  const [isLogging, setIsLogging] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [showCalendar, setShowCalendar] = useState(false);

  const entries = useHabitStore((state) => state.entries);
  const addEntry = useHabitStore((state) => state.addEntry);
  const getEntryByDate = useHabitStore((state) => state.getEntryByDate);

  const todayEntry = getEntryByDate(getTodayDate());
  const selectedEntry = getEntryByDate(selectedDate);
  const streak = calculateStreak(entries);
  const isToday = selectedDate === getTodayDate();

  const handleSubmit = (data: Omit<HabitEntry, 'id'>) => {
    addEntry(data);
    setIsLogging(false);

    if (isToday) {
      Alert.alert(
        'Habits Logged!',
        `Day ${streak + (todayEntry ? 0 : 1)} of your streak. Keep it up!`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Saved', `Habits for ${formatDate(selectedDate)} saved.`);
    }
  };

  const handleCancel = () => {
    setIsLogging(false);
  };

  const handleDayPress = (date: string) => {
    setSelectedDate(date);
    const entry = getEntryByDate(date);
    if (entry) {
      // Show entry details or option to edit
      Alert.alert(
        formatDate(date),
        `Sleep: ${entry.sleep.hours}hrs\nExercise: ${entry.exercise ? 'Yes' : 'No'}\nMeditation: ${entry.meditation.practiced ? 'Yes' : 'No'}\nAlcohol: ${entry.alcohol.consumed ? 'Yes' : 'No'}`,
        [
          { text: 'Edit', onPress: () => setIsLogging(true) },
          { text: 'Close', style: 'cancel' },
        ]
      );
    } else if (date <= getTodayDate()) {
      Alert.alert(
        formatDate(date),
        'No habits logged for this day.',
        [
          { text: 'Log Now', onPress: () => setIsLogging(true) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Daily Habits</Text>

      {/* Streak Display */}
      <View style={styles.streakCard}>
        <Text style={styles.streakEmoji}>🔥</Text>
        <Text style={styles.streakNumber}>{streak}</Text>
        <Text style={styles.streakLabel}>day streak</Text>
      </View>

      {/* Calendar Toggle */}
      <TouchableOpacity
        style={styles.calendarToggle}
        onPress={() => setShowCalendar(!showCalendar)}
      >
        <Text style={styles.calendarToggleText}>
          {showCalendar ? '▼ Hide Calendar' : '▶ Show Calendar'}
        </Text>
      </TouchableOpacity>

      {/* Calendar */}
      {showCalendar && (
        <View style={styles.calendarContainer}>
          <HabitCalendar
            entries={entries}
            onDayPress={handleDayPress}
            selectedDate={selectedDate}
          />
        </View>
      )}

      {/* Today's Status */}
      {todayEntry ? (
        <View style={styles.todayCard}>
          <Text style={styles.todayTitle}>Today's Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>😴</Text>
              <Text style={styles.summaryValue}>{todayEntry.sleep.hours}h</Text>
              <Text style={styles.summaryLabel}>Sleep</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>🏃</Text>
              <Text style={styles.summaryValue}>
                {todayEntry.exercise ? `${todayEntry.exercise.durationMins}m` : '—'}
              </Text>
              <Text style={styles.summaryLabel}>Exercise</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>🧘</Text>
              <Text style={styles.summaryValue}>
                {todayEntry.meditation.practiced ? `${todayEntry.meditation.durationMins}m` : '—'}
              </Text>
              <Text style={styles.summaryLabel}>Meditate</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>🍷</Text>
              <Text style={styles.summaryValue}>
                {todayEntry.alcohol.consumed ? todayEntry.alcohol.units : '0'}
              </Text>
              <Text style={styles.summaryLabel}>Alcohol</Text>
            </View>
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
    marginBottom: 20,
  },
  streakCard: {
    backgroundColor: '#fff3e0',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
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
  calendarToggle: {
    padding: 12,
    marginBottom: 8,
  },
  calendarToggleText: {
    color: '#007AFF',
    fontSize: 16,
  },
  calendarContainer: {
    marginBottom: 20,
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
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  editButton: {
    alignSelf: 'center',
    paddingVertical: 8,
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
