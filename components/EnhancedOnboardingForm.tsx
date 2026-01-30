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
import { HealthProfile } from '@/types';

interface EnhancedOnboardingFormProps {
  onComplete: (
    age: number,
    gender: 'male' | 'female' | 'other',
    healthProfile: HealthProfile
  ) => void;
}

type Gender = 'male' | 'female' | 'other';
type StepType = 'age' | 'goals' | 'exercise' | 'work' | 'family' | 'eating' | 'sleep' | 'review';

const STRESS_LEVELS: Array<HealthProfile['workEnvironment']['stressLevel']> = [
  'low',
  'moderate',
  'moderate-high',
  'high',
];

export function EnhancedOnboardingForm({ onComplete }: EnhancedOnboardingFormProps) {
  const [step, setStep] = useState<StepType>('age');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [error, setError] = useState('');

  // Health Profile state
  const [injuries, setInjuries] = useState('');
  const [conditions, setConditions] = useState('');
  const [medications, setMedications] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [secondaryGoals, setSecondaryGoals] = useState<string[]>([]);

  const [exerciseLikes, setExerciseLikes] = useState('');
  const [exerciseDislikes, setExerciseDislikes] = useState('');
  const [exerciseFrequency, setExerciseFrequency] = useState('');

  const [workType, setWorkType] = useState('');
  const [stressLevel, setStressLevel] = useState<HealthProfile['workEnvironment']['stressLevel']>('moderate');
  const [avgMeetings, setAvgMeetings] = useState('');
  const [deskWork, setDeskWork] = useState<boolean | null>(null);

  const [hasYoungChildren, setHasYoungChildren] = useState<boolean | null>(null);
  const [numberOfChildren, setNumberOfChildren] = useState('');
  const [childrenAges, setChildrenAges] = useState('');

  const [fruitsVeggies, setFruitsVeggies] = useState('');
  const [waterIntake, setWaterIntake] = useState('');
  const [supplements, setSupplements] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');

  const [avgBedtime, setAvgBedtime] = useState('');
  const [avgWakeTime, setAvgWakeTime] = useState('');
  const [sleepDifficulties, setSleepDifficulties] = useState('');

  const [stressTriggers, setStressTriggers] = useState('');

  const steps: StepType[] = ['age', 'goals', 'exercise', 'work', 'family', 'eating', 'sleep', 'review'];
  const currentStepIndex = steps.indexOf(step);

  const handleNext = () => {
    // Validation logic for each step
    if (step === 'age') {
      const ageNum = parseInt(age, 10);
      if (!age || isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
        setError('Please enter a valid age between 18 and 100');
        return;
      }
      if (!gender) {
        setError('Please select your biological sex');
        return;
      }
    }

    if (step === 'goals' && !primaryGoal.trim()) {
      setError('Please enter your primary goal');
      return;
    }

    setError('');
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
      setError('');
    }
  };

  const handleComplete = () => {
    const healthProfile: HealthProfile = {
      injuries: injuries.split(',').map((s) => s.trim()).filter(Boolean),
      conditions: conditions.split(',').map((s) => s.trim()).filter(Boolean),
      medications: medications.split(',').map((s) => s.trim()).filter(Boolean),
      primaryGoal,
      secondaryGoals,
      exercisePreferences: {
        likes: exerciseLikes.split(',').map((s) => s.trim()).filter(Boolean),
        dislikes: exerciseDislikes.split(',').map((s) => s.trim()).filter(Boolean),
        currentFrequency: exerciseFrequency,
      },
      workEnvironment: {
        type: workType,
        stressLevel,
        avgMeetingsPerDay: parseInt(avgMeetings, 10) || 0,
        deskWork: deskWork || false,
      },
      familySituation: {
        hasYoungChildren: hasYoungChildren || false,
        numberOfChildren: parseInt(numberOfChildren, 10) || 0,
        childrenAges: childrenAges.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n)),
      },
      eatingHabits: {
        fruitsVeggiesPerDay: parseInt(fruitsVeggies, 10) || 0,
        waterIntakeLiters: parseFloat(waterIntake) || 0,
        supplements: supplements.split(',').map((s) => s.trim()).filter(Boolean),
        dietaryRestrictions: dietaryRestrictions.split(',').map((s) => s.trim()).filter(Boolean),
      },
      sleepPatterns: {
        avgBedtime,
        avgWakeTime,
        difficulties: sleepDifficulties.split(',').map((s) => s.trim()).filter(Boolean),
      },
      stressTriggers: stressTriggers.split(',').map((s) => s.trim()).filter(Boolean),
    };

    onComplete(parseInt(age, 10), gender!, healthProfile);
  };

  const toggleSecondaryGoal = (goal: string) => {
    setSecondaryGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const renderProgressDots = () => (
    <View style={styles.progressDots}>
      {steps.map((_, index) => (
        <View
          key={index}
          style={[styles.dot, index <= currentStepIndex && styles.dotActive]}
        />
      ))}
    </View>
  );

  const renderStepContent = () => {
    switch (step) {
      case 'age':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Let's personalize your experience</Text>
            <Text style={styles.subtitle}>Tell us about yourself</Text>

            <Text style={styles.label}>How old are you?</Text>
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

            <Text style={styles.label}>Biological sex</Text>
            <View style={styles.optionsContainer}>
              {(['male', 'female', 'other'] as Gender[]).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.option, gender === g && styles.optionSelected]}
                  onPress={() => setGender(g)}
                >
                  <Text style={styles.optionText}>
                    {g === 'male' ? 'Male' : g === 'female' ? 'Female' : 'Other'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        );

      case 'goals':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Your HRV Goals</Text>
            <Text style={styles.subtitle}>What would you like to achieve?</Text>

            <Text style={styles.label}>Primary goal</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., Increase HRV and reduce stress"
              value={primaryGoal}
              onChangeText={setPrimaryGoal}
              multiline
            />

            <Text style={styles.label}>Secondary goals (tap to select)</Text>
            <View style={styles.multiSelectContainer}>
              {[
                'Better sleep quality',
                'Improved athletic performance',
                'Stress management',
                'Weight management',
                'Energy optimization',
              ].map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.multiSelectOption,
                    secondaryGoals.includes(goal) && styles.multiSelectOptionSelected,
                  ]}
                  onPress={() => toggleSecondaryGoal(goal)}
                >
                  <Text
                    style={[
                      styles.multiSelectText,
                      secondaryGoals.includes(goal) && styles.multiSelectTextSelected,
                    ]}
                  >
                    {goal}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        );

      case 'exercise':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Exercise Preferences</Text>
            <Text style={styles.subtitle}>Help us recommend the right activities</Text>

            <Text style={styles.label}>Activities you enjoy</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., cycling, swimming, yoga (comma-separated)"
              value={exerciseLikes}
              onChangeText={setExerciseLikes}
              multiline
            />

            <Text style={styles.label}>Activities you don't enjoy</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., running, high-impact sports"
              value={exerciseDislikes}
              onChangeText={setExerciseDislikes}
              multiline
            />

            <Text style={styles.label}>Current exercise frequency</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., 3-4 times per week"
              value={exerciseFrequency}
              onChangeText={setExerciseFrequency}
            />
          </View>
        );

      case 'work':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Work Environment</Text>
            <Text style={styles.subtitle}>Understanding your daily stress</Text>

            <Text style={styles.label}>Type of work</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., desk job, remote, active/physical"
              value={workType}
              onChangeText={setWorkType}
            />

            <Text style={styles.label}>Stress level</Text>
            <View style={styles.optionsContainer}>
              {STRESS_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.option, stressLevel === level && styles.optionSelected]}
                  onPress={() => setStressLevel(level)}
                >
                  <Text style={styles.optionText}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Average meetings per day</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="E.g., 4"
              value={avgMeetings}
              onChangeText={setAvgMeetings}
              maxLength={2}
            />

            <Text style={styles.label}>Do you work at a desk?</Text>
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[styles.option, deskWork === true && styles.optionSelected]}
                onPress={() => setDeskWork(true)}
              >
                <Text style={styles.optionText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.option, deskWork === false && styles.optionSelected]}
                onPress={() => setDeskWork(false)}
              >
                <Text style={styles.optionText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'family':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Family Situation</Text>
            <Text style={styles.subtitle}>Understanding your recovery constraints</Text>

            <Text style={styles.label}>Do you have young children?</Text>
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[styles.option, hasYoungChildren === true && styles.optionSelected]}
                onPress={() => setHasYoungChildren(true)}
              >
                <Text style={styles.optionText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.option, hasYoungChildren === false && styles.optionSelected]}
                onPress={() => setHasYoungChildren(false)}
              >
                <Text style={styles.optionText}>No</Text>
              </TouchableOpacity>
            </View>

            {hasYoungChildren === true && (
              <>
                <Text style={styles.label}>Number of children</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  placeholder="E.g., 2"
                  value={numberOfChildren}
                  onChangeText={setNumberOfChildren}
                  maxLength={2}
                />

                <Text style={styles.label}>Children's ages (comma-separated)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="E.g., 3, 5"
                  value={childrenAges}
                  onChangeText={setChildrenAges}
                />
              </>
            )}
          </View>
        );

      case 'eating':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Eating Habits</Text>
            <Text style={styles.subtitle}>Nutrition impacts HRV significantly</Text>

            <Text style={styles.label}>Servings of fruits/vegetables per day</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="E.g., 5"
              value={fruitsVeggies}
              onChangeText={setFruitsVeggies}
              maxLength={2}
            />

            <Text style={styles.label}>Water intake (liters per day)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="E.g., 2.5"
              value={waterIntake}
              onChangeText={setWaterIntake}
            />

            <Text style={styles.label}>Supplements (comma-separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., vitamin D, magnesium"
              value={supplements}
              onChangeText={setSupplements}
              multiline
            />

            <Text style={styles.label}>Dietary restrictions (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., vegetarian, gluten-free"
              value={dietaryRestrictions}
              onChangeText={setDietaryRestrictions}
              multiline
            />
          </View>
        );

      case 'sleep':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Sleep Patterns</Text>
            <Text style={styles.subtitle}>Sleep is crucial for HRV recovery</Text>

            <Text style={styles.label}>Average bedtime</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., 10:30 PM"
              value={avgBedtime}
              onChangeText={setAvgBedtime}
            />

            <Text style={styles.label}>Average wake time</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., 6:30 AM"
              value={avgWakeTime}
              onChangeText={setAvgWakeTime}
            />

            <Text style={styles.label}>Sleep difficulties (comma-separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., trouble falling asleep, frequent waking"
              value={sleepDifficulties}
              onChangeText={setSleepDifficulties}
              multiline
            />

            <Text style={styles.label}>Stress triggers (comma-separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., work deadlines, financial concerns"
              value={stressTriggers}
              onChangeText={setStressTriggers}
              multiline
            />
          </View>
        );

      case 'review':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Review Your Profile</Text>
            <Text style={styles.subtitle}>Almost done!</Text>

            <View style={styles.reviewContainer}>
              <Text style={styles.reviewSection}>Age: {age}, Gender: {gender}</Text>
              <Text style={styles.reviewSection}>Primary Goal: {primaryGoal}</Text>
              {secondaryGoals.length > 0 && (
                <Text style={styles.reviewSection}>
                  Secondary Goals: {secondaryGoals.join(', ')}
                </Text>
              )}
              <Text style={styles.reviewSection}>Exercise: {exerciseFrequency}</Text>
              <Text style={styles.reviewSection}>Work: {workType} ({stressLevel} stress)</Text>
              {hasYoungChildren && (
                <Text style={styles.reviewSection}>
                  Children: {numberOfChildren} (ages: {childrenAges})
                </Text>
              )}
            </View>

            <Text style={styles.explanation}>
              Next, we'll sync your WHOOP data to give you personalized insights.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderStepContent()}

        {renderProgressDots()}

        <View style={styles.buttonContainer}>
          {currentStepIndex > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, currentStepIndex === 0 && styles.buttonFull]}
            onPress={step === 'review' ? handleComplete : handleNext}
          >
            <Text style={styles.buttonText}>
              {step === 'review' ? 'Complete' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
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
    padding: 24,
  },
  stepContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  optionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  optionText: {
    fontSize: 14,
  },
  multiSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  multiSelectOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  multiSelectOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  multiSelectText: {
    fontSize: 13,
    color: '#333',
  },
  multiSelectTextSelected: {
    color: '#fff',
  },
  reviewContainer: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  reviewSection: {
    fontSize: 14,
    marginBottom: 8,
  },
  explanation: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 24,
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonFull: {
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#e74c3c',
    marginTop: 8,
    fontSize: 14,
  },
});
