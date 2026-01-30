import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { MorningContext } from '@/types';
import { Ionicons } from '@expo/vector-icons';

interface MorningContextFormProps {
  onComplete: (context: MorningContext) => void;
  onBack?: () => void;
}

export function MorningContextForm({ onComplete, onBack }: MorningContextFormProps) {
  const [sleepRating, setSleepRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [energyLevel, setEnergyLevel] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (sleepRating && energyLevel) {
      onComplete({
        sleepRating,
        energyLevel,
        notes,
      });
    }
  };

  const canSubmit = sleepRating !== null && energyLevel !== null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>How are you feeling?</Text>
        <Text style={styles.subtitle}>Quick morning check-in</Text>
      </View>

      {/* Sleep Rating */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How did you sleep?</Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <TouchableOpacity
              key={rating}
              style={[styles.ratingButton, sleepRating === rating && styles.ratingButtonActive]}
              onPress={() => setSleepRating(rating as 1 | 2 | 3 | 4 | 5)}
            >
              <Ionicons
                name={getSleepIcon(rating)}
                size={32}
                color={sleepRating === rating ? '#FF6B35' : '#999'}
              />
              <Text
                style={[
                  styles.ratingLabel,
                  sleepRating === rating && styles.ratingLabelActive,
                ]}
              >
                {getSleepLabel(rating)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Energy Level */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How's your energy?</Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <TouchableOpacity
              key={rating}
              style={[styles.ratingButton, energyLevel === rating && styles.ratingButtonActive]}
              onPress={() => setEnergyLevel(rating as 1 | 2 | 3 | 4 | 5)}
            >
              <Ionicons
                name={getEnergyIcon(rating)}
                size={32}
                color={energyLevel === rating ? '#FF6B35' : '#999'}
              />
              <Text
                style={[
                  styles.ratingLabel,
                  energyLevel === rating && styles.ratingLabelActive,
                ]}
              >
                {getEnergyLabel(rating)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Anything else? (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="E.g., Woke up with a headache, feeling stressed about work..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.footer}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.continueButton, !canSubmit && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getSleepIcon(rating: number): keyof typeof Ionicons.glyphMap {
  const icons: (keyof typeof Ionicons.glyphMap)[] = [
    'sad-outline',
    'alert-circle-outline',
    'remove-circle-outline',
    'happy-outline',
    'checkmark-circle-outline',
  ];
  return icons[rating - 1];
}

function getSleepLabel(rating: number): string {
  const labels = ['Poor', 'Below Avg', 'Average', 'Good', 'Excellent'];
  return labels[rating - 1];
}

function getEnergyIcon(rating: number): keyof typeof Ionicons.glyphMap {
  const icons: (keyof typeof Ionicons.glyphMap)[] = [
    'battery-dead-outline',
    'battery-charging-outline',
    'battery-half-outline',
    'battery-full-outline',
    'flash-outline',
  ];
  return icons[rating - 1];
}

function getEnergyLabel(rating: number): string {
  const labels = ['Drained', 'Low', 'Moderate', 'Good', 'Energized'];
  return labels[rating - 1];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    flex: 1,
    marginHorizontal: 4,
  },
  ratingButtonActive: {
    backgroundColor: '#FFF5F0',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  ratingLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  ratingLabelActive: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    backgroundColor: '#F8F9FA',
    minHeight: 100,
  },
  footer: {
    marginTop: 'auto',
    gap: 12,
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
  continueButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
});
