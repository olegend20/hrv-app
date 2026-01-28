import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { HabitEntry } from '@/types';

interface HabitCalendarProps {
  entries: HabitEntry[];
  onDayPress: (date: string) => void;
  selectedDate?: string;
}

export function HabitCalendar({ entries, onDayPress, selectedDate }: HabitCalendarProps) {
  const today = new Date().toISOString().split('T')[0];

  // Build marked dates object
  const markedDates: Record<string, any> = {};

  // Mark all logged days
  for (const entry of entries) {
    markedDates[entry.date] = {
      marked: true,
      dotColor: '#27ae60',
    };
  }

  // Mark selected date
  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: '#007AFF',
    };
  }

  // Mark today
  markedDates[today] = {
    ...markedDates[today],
    today: true,
  };

  const handleDayPress = (day: DateData) => {
    onDayPress(day.dateString);
  };

  return (
    <View style={styles.container}>
      <Calendar
        current={today}
        onDayPress={handleDayPress}
        markedDates={markedDates}
        markingType="dot"
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#666',
          selectedDayBackgroundColor: '#007AFF',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#007AFF',
          dayTextColor: '#333',
          textDisabledColor: '#ccc',
          dotColor: '#27ae60',
          selectedDotColor: '#ffffff',
          arrowColor: '#007AFF',
          monthTextColor: '#333',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
        }}
        style={styles.calendar}
      />
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#27ae60' }]} />
          <Text style={styles.legendText}>Logged</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#007AFF' }]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  calendar: {
    borderRadius: 12,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});
