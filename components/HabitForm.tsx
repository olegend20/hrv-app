import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { HabitEntry } from '@/types';

interface HabitFormProps {
  date: string;
  initialData?: Partial<HabitEntry>;
  onSubmit: (data: Omit<HabitEntry, 'id'>) => void;
  onCancel?: () => void;
}

const EXERCISE_TYPES = [
  'Running',
  'Walking',
  'Cycling',
  'Strength Training',
  'Yoga',
  'Swimming',
  'HIIT',
  'Other',
];

export function HabitForm({ date, initialData, onSubmit, onCancel }: HabitFormProps) {
  // Sleep
  const [sleepHours, setSleepHours] = useState(initialData?.sleep?.hours ?? 7);
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5>(
    initialData?.sleep?.quality ?? 3
  );

  // Exercise
  const [didExercise, setDidExercise] = useState(!!initialData?.exercise);
  const [exerciseType, setExerciseType] = useState(
    initialData?.exercise?.type ?? 'Running'
  );
  const [exerciseDuration, setExerciseDuration] = useState(
    initialData?.exercise?.durationMins?.toString() ?? '30'
  );
  const [exerciseIntensity, setExerciseIntensity] = useState<'low' | 'medium' | 'high'>(
    initialData?.exercise?.intensity ?? 'medium'
  );

  // Alcohol
  const [didDrink, setDidDrink] = useState(initialData?.alcohol?.consumed ?? false);
  const [alcoholUnits, setAlcoholUnits] = useState(
    initialData?.alcohol?.units?.toString() ?? '2'
  );

  // Meditation
  const [didMeditate, setDidMeditate] = useState(
    initialData?.meditation?.practiced ?? false
  );
  const [meditationDuration, setMeditationDuration] = useState(
    initialData?.meditation?.durationMins?.toString() ?? '15'
  );

  // Stress & Cold
  const [stressLevel, setStressLevel] = useState<1 | 2 | 3 | 4 | 5>(
    initialData?.stressLevel ?? 3
  );
  const [coldExposure, setColdExposure] = useState(initialData?.coldExposure ?? false);

  // Notes
  const [notes, setNotes] = useState(initialData?.notes ?? '');

  const handleSubmit = () => {
    const entry: Omit<HabitEntry, 'id'> = {
      date,
      sleep: {
        hours: sleepHours,
        quality: sleepQuality,
      },
      exercise: didExercise
        ? {
            type: exerciseType,
            durationMins: parseInt(exerciseDuration, 10) || 30,
            intensity: exerciseIntensity,
          }
        : undefined,
      alcohol: {
        consumed: didDrink,
        units: didDrink ? parseInt(alcoholUnits, 10) || 0 : undefined,
      },
      meditation: {
        practiced: didMeditate,
        durationMins: didMeditate ? parseInt(meditationDuration, 10) || 0 : undefined,
      },
      stressLevel,
      coldExposure,
      notes: notes.trim() || undefined,
    };

    onSubmit(entry);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const qualityEmojis = ['😫', '😕', '😐', '🙂', '😴'];
  const stressEmojis = ['😌', '🙂', '😐', '😟', '😫'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.dateHeader}>{formatDate(date)}</Text>

      {/* Sleep Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>😴 Sleep</Text>

        <Text style={styles.label}>Hours of sleep</Text>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={12}
            step={0.5}
            value={sleepHours}
            onValueChange={setSleepHours}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#ddd"
          />
          <Text style={styles.sliderValue}>{sleepHours} hours</Text>
        </View>

        <Text style={styles.label}>Sleep quality</Text>
        <View style={styles.ratingRow}>
          {([1, 2, 3, 4, 5] as const).map((rating) => (
            <TouchableOpacity
              key={rating}
              style={[
                styles.ratingButton,
                sleepQuality === rating && styles.ratingButtonSelected,
              ]}
              onPress={() => setSleepQuality(rating)}
            >
              <Text style={styles.ratingEmoji}>{qualityEmojis[rating - 1]}</Text>
              <Text style={styles.ratingNumber}>{rating}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Exercise Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏃 Exercise</Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Did you exercise today?</Text>
          <Switch value={didExercise} onValueChange={setDidExercise} />
        </View>

        {didExercise && (
          <>
            <Text style={styles.label}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {EXERCISE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chip,
                      exerciseType === type && styles.chipSelected,
                    ]}
                    onPress={() => setExerciseType(type)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        exerciseType === type && styles.chipTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.label}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={exerciseDuration}
              onChangeText={setExerciseDuration}
              placeholder="30"
            />

            <Text style={styles.label}>Intensity</Text>
            <View style={styles.intensityRow}>
              {(['low', 'medium', 'high'] as const).map((intensity) => (
                <TouchableOpacity
                  key={intensity}
                  style={[
                    styles.intensityButton,
                    exerciseIntensity === intensity && styles.intensitySelected,
                  ]}
                  onPress={() => setExerciseIntensity(intensity)}
                >
                  <Text
                    style={[
                      styles.intensityText,
                      exerciseIntensity === intensity && styles.intensityTextSelected,
                    ]}
                  >
                    {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      {/* Alcohol Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🍷 Alcohol</Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Did you drink alcohol?</Text>
          <Switch value={didDrink} onValueChange={setDidDrink} />
        </View>

        {didDrink && (
          <>
            <Text style={styles.label}>Units consumed</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={alcoholUnits}
              onChangeText={setAlcoholUnits}
              placeholder="2"
            />
          </>
        )}
      </View>

      {/* Meditation Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧘 Meditation</Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Did you meditate?</Text>
          <Switch value={didMeditate} onValueChange={setDidMeditate} />
        </View>

        {didMeditate && (
          <>
            <Text style={styles.label}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={meditationDuration}
              onChangeText={setMeditationDuration}
              placeholder="15"
            />
          </>
        )}
      </View>

      {/* Stress Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>😰 Stress Level</Text>
        <Text style={styles.label}>How stressed did you feel today?</Text>
        <View style={styles.ratingRow}>
          {([1, 2, 3, 4, 5] as const).map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.ratingButton,
                stressLevel === level && styles.ratingButtonSelected,
              ]}
              onPress={() => setStressLevel(level)}
            >
              <Text style={styles.ratingEmoji}>{stressEmojis[level - 1]}</Text>
              <Text style={styles.ratingNumber}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Cold Exposure Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧊 Cold Exposure</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Cold shower, ice bath, etc?</Text>
          <Switch value={coldExposure} onValueChange={setColdExposure} />
        </View>
      </View>

      {/* Notes Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
          placeholder="How did you feel today?"
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Save</Text>
      </TouchableOpacity>

      {onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
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
    paddingBottom: 40,
  },
  dateHeader: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 12,
  },
  sliderContainer: {
    alignItems: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginHorizontal: 4,
  },
  ratingButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  ratingEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  ratingNumber: {
    fontSize: 12,
    color: '#666',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 16,
  },
  chipRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  intensityRow: {
    flexDirection: 'row',
  },
  intensityButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  intensitySelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  intensityText: {
    color: '#333',
  },
  intensityTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
