import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

interface OnboardingFormProps {
  onComplete: (age: number, gender: 'male' | 'female' | 'other') => void;
}

type Gender = 'male' | 'female' | 'other';

export function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const [step, setStep] = useState<'age' | 'gender'>('age');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [error, setError] = useState('');

  const validateAge = (value: string): boolean => {
    const numAge = parseInt(value, 10);
    if (isNaN(numAge) || numAge < 18 || numAge > 100) {
      setError('Please enter an age between 18 and 100');
      return false;
    }
    setError('');
    return true;
  };

  const handleAgeSubmit = () => {
    if (validateAge(age)) {
      setStep('gender');
    }
  };

  const handleGenderSelect = (selectedGender: Gender) => {
    setGender(selectedGender);
  };

  const handleComplete = () => {
    if (gender) {
      onComplete(parseInt(age, 10), gender);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === 'age' ? (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Let's personalize your experience</Text>
            <Text style={styles.subtitle}>How old are you?</Text>
            <Text style={styles.explanation}>
              HRV benchmarks vary by age, so we need this to give you accurate
              comparisons.
            </Text>

            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="Enter your age"
              value={age}
              onChangeText={(text) => {
                setAge(text.replace(/[^0-9]/g, ''));
                setError('');
              }}
              maxLength={3}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.progressDots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleAgeSubmit}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>One more thing...</Text>
            <Text style={styles.subtitle}>What's your biological sex?</Text>
            <Text style={styles.explanation}>
              HRV patterns differ between males and females, especially before
              age 50.
            </Text>

            <View style={styles.genderOptions}>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  gender === 'male' && styles.genderOptionSelected,
                ]}
                onPress={() => handleGenderSelect('male')}
              >
                <View style={styles.radio}>
                  {gender === 'male' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.genderText}>Male</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderOption,
                  gender === 'female' && styles.genderOptionSelected,
                ]}
                onPress={() => handleGenderSelect('female')}
              >
                <View style={styles.radio}>
                  {gender === 'female' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.genderText}>Female</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderOption,
                  gender === 'other' && styles.genderOptionSelected,
                ]}
                onPress={() => handleGenderSelect('other')}
              >
                <View style={styles.radio}>
                  {gender === 'other' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.genderText}>Prefer not to say</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.progressDots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={[styles.dot, styles.dotActive]} />
            </View>

            <TouchableOpacity
              style={[styles.button, !gender && styles.buttonDisabled]}
              onPress={handleComplete}
              disabled={!gender}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep('age')}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  stepContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  explanation: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  error: {
    color: '#e74c3c',
    marginBottom: 16,
  },
  progressDots: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#007AFF',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  genderOptions: {
    width: '100%',
    marginBottom: 24,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 12,
  },
  genderOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  genderText: {
    fontSize: 16,
  },
  backButton: {
    marginTop: 16,
    padding: 12,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
