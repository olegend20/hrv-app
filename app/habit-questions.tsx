import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useHabitStore } from '@/stores/habitStore';
import { HabitEntry } from '@/types';
import { HABIT_CATEGORIES, QUICK_LOG_PRESETS, getPresetById } from '@/constants/habitCategories';

export default function HabitQuestionsScreen() {
  const params = useLocalSearchParams();

  // Data from screenshot analysis
  const date = params.date as string;
  const extractedHrv = params.hrv ? parseFloat(params.hrv as string) : undefined;
  const extractedSleepHours = params.sleepHours ? parseFloat(params.sleepHours as string) : undefined;
  const extractedSleepQuality = params.sleepQuality ? parseFloat(params.sleepQuality as string) : undefined;
  const extractedRecoveryScore = params.recoveryScore ? parseFloat(params.recoveryScore as string) : undefined;

  const addEntry = useHabitStore((state) => state.addEntry);

  // State for expanded categories
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['sleep']);
  const [showQuickLog, setShowQuickLog] = useState(true);

  // State for all habit data
  const [habitData, setHabitData] = useState<Partial<Omit<HabitEntry, 'id' | 'date'>>>({
    // Pre-fill sleep from screenshot data
    sleep: {
      hours: extractedSleepHours || 7,
      quality: Math.round((extractedSleepQuality || 70) / 20) as 1 | 2 | 3 | 4 | 5,
    },
    stress: {
      overallLevel: 3,
      mood: 3,
    },
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const applyQuickLogPreset = (presetId: string) => {
    const preset = getPresetById(presetId);
    if (preset) {
      setHabitData({
        ...habitData,
        ...preset.values,
        // Keep sleep data from screenshots
        sleep: habitData.sleep,
      });
      setShowQuickLog(false);
      Alert.alert('Applied!', `${preset.name} preset applied. You can still customize any fields.`);
    }
  };

  const handleSave = () => {
    // Validate required fields
    if (!habitData.sleep?.hours) {
      Alert.alert('Missing Data', 'Please enter sleep hours');
      return;
    }

    if (!habitData.stress?.overallLevel) {
      Alert.alert('Missing Data', 'Please rate your stress level');
      return;
    }

    // Create habit entry
    const entry: Omit<HabitEntry, 'id'> = {
      date,
      sleep: habitData.sleep as HabitEntry['sleep'],
      stress: habitData.stress as HabitEntry['stress'],
      work: habitData.work,
      exercise: habitData.exercise,
      movement: habitData.movement,
      nutrition: habitData.nutrition,
      substances: habitData.substances,
      recovery: habitData.recovery,
      social: habitData.social,
      family: habitData.family,
      environment: habitData.environment,
      health: habitData.health,
      lifestyle: habitData.lifestyle,
      notes: habitData.notes,
      significantEvent: habitData.significantEvent,
    };

    // Save to store
    addEntry(entry);

    // Success and navigate to daily plan
    Alert.alert(
      'Habits Logged!',
      'Your daily data has been saved. Ready to generate your plan?',
      [
        {
          text: 'Generate Plan',
          onPress: () => router.push('/daily-plan'),
        },
        {
          text: 'Go to Dashboard',
          onPress: () => router.replace('/(tabs)'),
        },
      ]
    );
  };

  const coreCategories = HABIT_CATEGORIES.filter((cat) => cat.isCore);
  const optionalCategories = HABIT_CATEGORIES.filter((cat) => !cat.isCore);

  const getCategoryCompletionIcon = (categoryId: string) => {
    // Check if category has any data filled
    const data = habitData[categoryId as keyof typeof habitData];
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return '○'; // Empty
    }
    return '●'; // Has data
  };

  // Render category-specific questions
  const renderCategoryQuestions = (categoryId: string) => {
    const updateCategoryData = (category: string, field: string, value: any) => {
      setHabitData(prev => ({
        ...prev,
        [category]: {
          ...(prev[category as keyof typeof prev] as any),
          [field]: value,
        },
      }));
    };

    const ScaleButton = ({ value, label, selected, onPress }: { value: number; label: string; selected: boolean; onPress: () => void }) => (
      <TouchableOpacity
        style={[styles.scaleButton, selected && styles.scaleButtonSelected]}
        onPress={onPress}
      >
        <Text style={[styles.scaleButtonText, selected && styles.scaleButtonTextSelected]}>{value}</Text>
        <Text style={[styles.scaleButtonLabel, selected && styles.scaleButtonLabelSelected]}>{label}</Text>
      </TouchableOpacity>
    );

    switch (categoryId) {
      case 'sleep':
        return (
          <View>
            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Sleep Hours</Text>
              <TextInput
                style={styles.questionInput}
                keyboardType="decimal-pad"
                placeholder="e.g., 7.5"
                value={habitData.sleep?.hours?.toString() || ''}
                onChangeText={(text) => updateCategoryData('sleep', 'hours', parseFloat(text) || 0)}
              />
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Sleep Quality</Text>
              <Text style={styles.questionHint}>1 = Poor, 5 = Excellent</Text>
              <View style={styles.scaleRow}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <ScaleButton
                    key={val}
                    value={val}
                    label={val === 1 ? 'Poor' : val === 5 ? 'Great' : ''}
                    selected={habitData.sleep?.quality === val}
                    onPress={() => updateCategoryData('sleep', 'quality', val as 1 | 2 | 3 | 4 | 5)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Bedtime (optional)</Text>
              <TextInput
                style={styles.questionInput}
                placeholder="e.g., 22:30"
                value={habitData.sleep?.bedtime || ''}
                onChangeText={(text) => updateCategoryData('sleep', 'bedtime', text)}
              />
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Wake Time (optional)</Text>
              <TextInput
                style={styles.questionInput}
                placeholder="e.g., 06:30"
                value={habitData.sleep?.wakeTime || ''}
                onChangeText={(text) => updateCategoryData('sleep', 'wakeTime', text)}
              />
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Night Interruptions</Text>
              <TextInput
                style={styles.questionInput}
                keyboardType="number-pad"
                placeholder="Number of wake-ups"
                value={habitData.sleep?.interruptions?.toString() || ''}
                onChangeText={(text) => updateCategoryData('sleep', 'interruptions', parseInt(text) || 0)}
              />
            </View>
          </View>
        );

      case 'work':
        return (
          <View>
            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Working Hours</Text>
              <TextInput
                style={styles.questionInput}
                keyboardType="decimal-pad"
                placeholder="e.g., 8"
                value={habitData.work?.workingHours?.toString() || ''}
                onChangeText={(text) => updateCategoryData('work', 'workingHours', parseFloat(text) || 0)}
              />
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Number of Meetings</Text>
              <TextInput
                style={styles.questionInput}
                keyboardType="number-pad"
                placeholder="e.g., 4"
                value={habitData.work?.meetings?.toString() || ''}
                onChangeText={(text) => updateCategoryData('work', 'meetings', parseInt(text) || 0)}
              />
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Deadline Pressure</Text>
              <Text style={styles.questionHint}>1 = None, 5 = Extreme</Text>
              <View style={styles.scaleRow}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <ScaleButton
                    key={val}
                    value={val}
                    label={val === 1 ? 'None' : val === 5 ? 'Extreme' : ''}
                    selected={habitData.work?.deadlinePressure === val}
                    onPress={() => updateCategoryData('work', 'deadlinePressure', val as 1 | 2 | 3 | 4 | 5)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Mental Fatigue</Text>
              <Text style={styles.questionHint}>1 = Fresh, 5 = Exhausted</Text>
              <View style={styles.scaleRow}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <ScaleButton
                    key={val}
                    value={val}
                    label={val === 1 ? 'Fresh' : val === 5 ? 'Exhausted' : ''}
                    selected={habitData.work?.mentalFatigue === val}
                    onPress={() => updateCategoryData('work', 'mentalFatigue', val as 1 | 2 | 3 | 4 | 5)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Commute Time (minutes)</Text>
              <TextInput
                style={styles.questionInput}
                keyboardType="number-pad"
                placeholder="e.g., 30"
                value={habitData.work?.commuteTime?.toString() || ''}
                onChangeText={(text) => updateCategoryData('work', 'commuteTime', parseInt(text) || 0)}
              />
            </View>
          </View>
        );

      case 'exercise':
        return (
          <View>
            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Exercise Type</Text>
              <View style={styles.optionGrid}>
                {['cardio', 'strength', 'yoga', 'sports', 'walking', 'none'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionButton,
                      habitData.exercise?.type === type && styles.optionButtonSelected,
                    ]}
                    onPress={() => updateCategoryData('exercise', 'type', type)}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      habitData.exercise?.type === type && styles.optionButtonTextSelected,
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {habitData.exercise?.type && habitData.exercise.type !== 'none' && (
              <>
                <View style={styles.questionGroup}>
                  <Text style={styles.questionLabel}>Duration (minutes)</Text>
                  <TextInput
                    style={styles.questionInput}
                    keyboardType="number-pad"
                    placeholder="e.g., 45"
                    value={habitData.exercise?.durationMins?.toString() || ''}
                    onChangeText={(text) => updateCategoryData('exercise', 'durationMins', parseInt(text) || 0)}
                  />
                </View>

                <View style={styles.questionGroup}>
                  <Text style={styles.questionLabel}>Intensity</Text>
                  <View style={styles.optionGrid}>
                    {['light', 'moderate', 'vigorous', 'high-intensity'].map((intensity) => (
                      <TouchableOpacity
                        key={intensity}
                        style={[
                          styles.optionButton,
                          habitData.exercise?.intensity === intensity && styles.optionButtonSelected,
                        ]}
                        onPress={() => updateCategoryData('exercise', 'intensity', intensity)}
                      >
                        <Text style={[
                          styles.optionButtonText,
                          habitData.exercise?.intensity === intensity && styles.optionButtonTextSelected,
                        ]}>
                          {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>
        );

      case 'nutrition':
        return (
          <View>
            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Diet Quality</Text>
              <Text style={styles.questionHint}>1 = Poor, 5 = Excellent</Text>
              <View style={styles.scaleRow}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <ScaleButton
                    key={val}
                    value={val}
                    label={val === 1 ? 'Poor' : val === 5 ? 'Excellent' : ''}
                    selected={habitData.nutrition?.dietQuality === val}
                    onPress={() => updateCategoryData('nutrition', 'dietQuality', val as 1 | 2 | 3 | 4 | 5)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Hydration (liters)</Text>
              <TextInput
                style={styles.questionInput}
                keyboardType="decimal-pad"
                placeholder="e.g., 2.5"
                value={habitData.nutrition?.hydration?.toString() || ''}
                onChangeText={(text) => updateCategoryData('nutrition', 'hydration', parseFloat(text) || 0)}
              />
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Vegetable Servings</Text>
              <TextInput
                style={styles.questionInput}
                keyboardType="number-pad"
                placeholder="e.g., 5"
                value={habitData.nutrition?.vegetables?.toString() || ''}
                onChangeText={(text) => updateCategoryData('nutrition', 'vegetables', parseInt(text) || 0)}
              />
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Number of Meals</Text>
              <TextInput
                style={styles.questionInput}
                keyboardType="number-pad"
                placeholder="e.g., 3"
                value={habitData.nutrition?.meals?.toString() || ''}
                onChangeText={(text) => updateCategoryData('nutrition', 'meals', parseInt(text) || 0)}
              />
            </View>
          </View>
        );

      case 'substances':
        return (
          <View>
            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Alcohol Consumed?</Text>
              <View style={styles.binaryRow}>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    habitData.substances?.alcohol?.consumed === false && styles.binaryButtonSelected,
                  ]}
                  onPress={() => {
                    setHabitData(prev => ({
                      ...prev,
                      substances: {
                        ...prev.substances,
                        alcohol: { consumed: false },
                      },
                    }));
                  }}
                >
                  <Text style={[
                    styles.binaryButtonText,
                    habitData.substances?.alcohol?.consumed === false && styles.binaryButtonTextSelected,
                  ]}>
                    No
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    habitData.substances?.alcohol?.consumed === true && styles.binaryButtonSelected,
                  ]}
                  onPress={() => {
                    setHabitData(prev => ({
                      ...prev,
                      substances: {
                        ...prev.substances,
                        alcohol: { consumed: true, drinks: 1 },
                      },
                    }));
                  }}
                >
                  <Text style={[
                    styles.binaryButtonText,
                    habitData.substances?.alcohol?.consumed === true && styles.binaryButtonTextSelected,
                  ]}>
                    Yes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {habitData.substances?.alcohol?.consumed && (
              <View style={styles.questionGroup}>
                <Text style={styles.questionLabel}>Number of Drinks</Text>
                <TextInput
                  style={styles.questionInput}
                  keyboardType="number-pad"
                  placeholder="e.g., 2"
                  value={habitData.substances?.alcohol?.drinks?.toString() || ''}
                  onChangeText={(text) => {
                    setHabitData(prev => ({
                      ...prev,
                      substances: {
                        ...prev.substances,
                        alcohol: {
                          ...prev.substances?.alcohol,
                          consumed: true,
                          drinks: parseInt(text) || 0,
                        },
                      },
                    }));
                  }}
                />
              </View>
            )}

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Caffeine Consumed?</Text>
              <View style={styles.binaryRow}>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    habitData.substances?.caffeine?.consumed === false && styles.binaryButtonSelected,
                  ]}
                  onPress={() => {
                    setHabitData(prev => ({
                      ...prev,
                      substances: {
                        ...prev.substances,
                        caffeine: { consumed: false },
                      },
                    }));
                  }}
                >
                  <Text style={[
                    styles.binaryButtonText,
                    habitData.substances?.caffeine?.consumed === false && styles.binaryButtonTextSelected,
                  ]}>
                    No
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    habitData.substances?.caffeine?.consumed === true && styles.binaryButtonSelected,
                  ]}
                  onPress={() => {
                    setHabitData(prev => ({
                      ...prev,
                      substances: {
                        ...prev.substances,
                        caffeine: { consumed: true, cups: 1, afternoon: false },
                      },
                    }));
                  }}
                >
                  <Text style={[
                    styles.binaryButtonText,
                    habitData.substances?.caffeine?.consumed === true && styles.binaryButtonTextSelected,
                  ]}>
                    Yes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {habitData.substances?.caffeine?.consumed && (
              <>
                <View style={styles.questionGroup}>
                  <Text style={styles.questionLabel}>Cups of Coffee/Tea</Text>
                  <TextInput
                    style={styles.questionInput}
                    keyboardType="number-pad"
                    placeholder="e.g., 3"
                    value={habitData.substances?.caffeine?.cups?.toString() || ''}
                    onChangeText={(text) => {
                      setHabitData(prev => ({
                        ...prev,
                        substances: {
                          ...prev.substances,
                          caffeine: {
                            ...prev.substances?.caffeine,
                            consumed: true,
                            cups: parseInt(text) || 0,
                          },
                        },
                      }));
                    }}
                  />
                </View>

                <View style={styles.questionGroup}>
                  <Text style={styles.questionLabel}>Any After 2 PM?</Text>
                  <View style={styles.binaryRow}>
                    <TouchableOpacity
                      style={[
                        styles.binaryButton,
                        habitData.substances?.caffeine?.afternoon === false && styles.binaryButtonSelected,
                      ]}
                      onPress={() => {
                        setHabitData(prev => ({
                          ...prev,
                          substances: {
                            ...prev.substances,
                            caffeine: {
                              ...prev.substances?.caffeine,
                              consumed: true,
                              afternoon: false,
                            },
                          },
                        }));
                      }}
                    >
                      <Text style={[
                        styles.binaryButtonText,
                        habitData.substances?.caffeine?.afternoon === false && styles.binaryButtonTextSelected,
                      ]}>
                        No
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.binaryButton,
                        habitData.substances?.caffeine?.afternoon === true && styles.binaryButtonSelected,
                      ]}
                      onPress={() => {
                        setHabitData(prev => ({
                          ...prev,
                          substances: {
                            ...prev.substances,
                            caffeine: {
                              ...prev.substances?.caffeine,
                              consumed: true,
                              afternoon: true,
                            },
                          },
                        }));
                      }}
                    >
                      <Text style={[
                        styles.binaryButtonText,
                        habitData.substances?.caffeine?.afternoon === true && styles.binaryButtonTextSelected,
                      ]}>
                        Yes
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        );

      case 'stress':
        return (
          <View>
            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Overall Stress Level</Text>
              <Text style={styles.questionHint}>1 = Calm, 5 = Overwhelmed</Text>
              <View style={styles.scaleRow}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <ScaleButton
                    key={val}
                    value={val}
                    label={val === 1 ? 'Calm' : val === 5 ? 'Overwhelmed' : ''}
                    selected={habitData.stress?.overallLevel === val}
                    onPress={() => updateCategoryData('stress', 'overallLevel', val as 1 | 2 | 3 | 4 | 5)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Mood</Text>
              <Text style={styles.questionHint}>1 = Very Low, 5 = Great</Text>
              <View style={styles.scaleRow}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <ScaleButton
                    key={val}
                    value={val}
                    label={val === 1 ? 'Low' : val === 5 ? 'Great' : ''}
                    selected={habitData.stress?.mood === val}
                    onPress={() => updateCategoryData('stress', 'mood', val as 1 | 2 | 3 | 4 | 5)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Anxiety Level</Text>
              <Text style={styles.questionHint}>1 = None, 5 = Severe</Text>
              <View style={styles.scaleRow}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <ScaleButton
                    key={val}
                    value={val}
                    label={val === 1 ? 'None' : val === 5 ? 'Severe' : ''}
                    selected={habitData.stress?.anxiety === val}
                    onPress={() => updateCategoryData('stress', 'anxiety', val as 1 | 2 | 3 | 4 | 5)}
                  />
                ))}
              </View>
            </View>
          </View>
        );

      case 'recovery':
        return (
          <View>
            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Meditation</Text>
              <View style={styles.binaryRow}>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    habitData.recovery?.meditation?.practiced === false && styles.binaryButtonSelected,
                  ]}
                  onPress={() => {
                    setHabitData(prev => ({
                      ...prev,
                      recovery: {
                        ...prev.recovery,
                        meditation: { practiced: false },
                      },
                    }));
                  }}
                >
                  <Text style={[
                    styles.binaryButtonText,
                    habitData.recovery?.meditation?.practiced === false && styles.binaryButtonTextSelected,
                  ]}>
                    No
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    habitData.recovery?.meditation?.practiced === true && styles.binaryButtonSelected,
                  ]}
                  onPress={() => {
                    setHabitData(prev => ({
                      ...prev,
                      recovery: {
                        ...prev.recovery,
                        meditation: { practiced: true, durationMins: 10 },
                      },
                    }));
                  }}
                >
                  <Text style={[
                    styles.binaryButtonText,
                    habitData.recovery?.meditation?.practiced === true && styles.binaryButtonTextSelected,
                  ]}>
                    Yes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {habitData.recovery?.meditation?.practiced && (
              <View style={styles.questionGroup}>
                <Text style={styles.questionLabel}>Duration (minutes)</Text>
                <TextInput
                  style={styles.questionInput}
                  keyboardType="number-pad"
                  placeholder="e.g., 20"
                  value={habitData.recovery?.meditation?.durationMins?.toString() || ''}
                  onChangeText={(text) => {
                    setHabitData(prev => ({
                      ...prev,
                      recovery: {
                        ...prev.recovery,
                        meditation: {
                          practiced: true,
                          durationMins: parseInt(text) || 0,
                        },
                      },
                    }));
                  }}
                />
              </View>
            )}

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Breathwork</Text>
              <View style={styles.binaryRow}>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    habitData.recovery?.breathwork?.practiced === false && styles.binaryButtonSelected,
                  ]}
                  onPress={() => {
                    setHabitData(prev => ({
                      ...prev,
                      recovery: {
                        ...prev.recovery,
                        breathwork: { practiced: false },
                      },
                    }));
                  }}
                >
                  <Text style={[
                    styles.binaryButtonText,
                    habitData.recovery?.breathwork?.practiced === false && styles.binaryButtonTextSelected,
                  ]}>
                    No
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    habitData.recovery?.breathwork?.practiced === true && styles.binaryButtonSelected,
                  ]}
                  onPress={() => {
                    setHabitData(prev => ({
                      ...prev,
                      recovery: {
                        ...prev.recovery,
                        breathwork: { practiced: true, durationMins: 5 },
                      },
                    }));
                  }}
                >
                  <Text style={[
                    styles.binaryButtonText,
                    habitData.recovery?.breathwork?.practiced === true && styles.binaryButtonTextSelected,
                  ]}>
                    Yes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {habitData.recovery?.breathwork?.practiced && (
              <View style={styles.questionGroup}>
                <Text style={styles.questionLabel}>Duration (minutes)</Text>
                <TextInput
                  style={styles.questionInput}
                  keyboardType="number-pad"
                  placeholder="e.g., 10"
                  value={habitData.recovery?.breathwork?.durationMins?.toString() || ''}
                  onChangeText={(text) => {
                    setHabitData(prev => ({
                      ...prev,
                      recovery: {
                        ...prev.recovery,
                        breathwork: {
                          practiced: true,
                          durationMins: parseInt(text) || 0,
                        },
                      },
                    }));
                  }}
                />
              </View>
            )}
          </View>
        );

      case 'movement':
        return (
          <View>
            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Sedentary Hours</Text>
              <TextInput
                style={styles.questionInput}
                keyboardType="decimal-pad"
                placeholder="e.g., 8"
                value={habitData.movement?.sedentaryHours?.toString() || ''}
                onChangeText={(text) => updateCategoryData('movement', 'sedentaryHours', parseFloat(text) || 0)}
              />
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Daily Steps</Text>
              <TextInput
                style={styles.questionInput}
                keyboardType="number-pad"
                placeholder="e.g., 8000"
                value={habitData.movement?.steps?.toString() || ''}
                onChangeText={(text) => updateCategoryData('movement', 'steps', parseInt(text) || 0)}
              />
            </View>
          </View>
        );

      case 'social':
        return (
          <View>
            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Social Interaction Level</Text>
              <Text style={styles.questionHint}>1 = Isolated, 5 = Very Social</Text>
              <View style={styles.scaleRow}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <ScaleButton
                    key={val}
                    value={val}
                    label={val === 1 ? 'Isolated' : val === 5 ? 'Social' : ''}
                    selected={habitData.social?.socialInteraction === val}
                    onPress={() => updateCategoryData('social', 'socialInteraction', val as 1 | 2 | 3 | 4 | 5)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Quality Time with Loved Ones?</Text>
              <View style={styles.binaryRow}>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    habitData.social?.qualityTime === false && styles.binaryButtonSelected,
                  ]}
                  onPress={() => updateCategoryData('social', 'qualityTime', false)}
                >
                  <Text style={[
                    styles.binaryButtonText,
                    habitData.social?.qualityTime === false && styles.binaryButtonTextSelected,
                  ]}>
                    No
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    habitData.social?.qualityTime === true && styles.binaryButtonSelected,
                  ]}
                  onPress={() => updateCategoryData('social', 'qualityTime', true)}
                >
                  <Text style={[
                    styles.binaryButtonText,
                    habitData.social?.qualityTime === true && styles.binaryButtonTextSelected,
                  ]}>
                    Yes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 'family':
        return (
          <View>
            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Work-Life Balance</Text>
              <Text style={styles.questionHint}>1 = Poor, 5 = Excellent</Text>
              <View style={styles.scaleRow}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <ScaleButton
                    key={val}
                    value={val}
                    label={val === 1 ? 'Poor' : val === 5 ? 'Great' : ''}
                    selected={habitData.family?.workLifeBalance === val}
                    onPress={() => updateCategoryData('family', 'workLifeBalance', val as 1 | 2 | 3 | 4 | 5)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Parenting Stress (if applicable)</Text>
              <Text style={styles.questionHint}>1 = Low, 5 = High</Text>
              <View style={styles.scaleRow}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <ScaleButton
                    key={val}
                    value={val}
                    label={val === 1 ? 'Low' : val === 5 ? 'High' : ''}
                    selected={habitData.family?.parentingStress === val}
                    onPress={() => updateCategoryData('family', 'parentingStress', val as 1 | 2 | 3 | 4 | 5)}
                  />
                ))}
              </View>
            </View>
          </View>
        );

      case 'environment':
        return (
          <View>
            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Air Quality</Text>
              <Text style={styles.questionHint}>1 = Poor, 5 = Excellent</Text>
              <View style={styles.scaleRow}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <ScaleButton
                    key={val}
                    value={val}
                    label={val === 1 ? 'Poor' : val === 5 ? 'Great' : ''}
                    selected={habitData.environment?.airQuality === val}
                    onPress={() => updateCategoryData('environment', 'airQuality', val as 1 | 2 | 3 | 4 | 5)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Outdoor Time (minutes)</Text>
              <TextInput
                style={styles.questionInput}
                keyboardType="number-pad"
                placeholder="e.g., 60"
                value={habitData.environment?.outdoorTime?.toString() || ''}
                onChangeText={(text) => updateCategoryData('environment', 'outdoorTime', parseInt(text) || 0)}
              />
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Nature Exposure?</Text>
              <View style={styles.binaryRow}>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    habitData.environment?.natureExposure === false && styles.binaryButtonSelected,
                  ]}
                  onPress={() => updateCategoryData('environment', 'natureExposure', false)}
                >
                  <Text style={[
                    styles.binaryButtonText,
                    habitData.environment?.natureExposure === false && styles.binaryButtonTextSelected,
                  ]}>
                    No
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    habitData.environment?.natureExposure === true && styles.binaryButtonSelected,
                  ]}
                  onPress={() => updateCategoryData('environment', 'natureExposure', true)}
                >
                  <Text style={[
                    styles.binaryButtonText,
                    habitData.environment?.natureExposure === true && styles.binaryButtonTextSelected,
                  ]}>
                    Yes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 'health':
        return (
          <View>
            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Feeling Sick or Fighting Illness?</Text>
              <View style={styles.binaryRow}>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    habitData.health?.illness === false && styles.binaryButtonSelected,
                  ]}
                  onPress={() => updateCategoryData('health', 'illness', false)}
                >
                  <Text style={[
                    styles.binaryButtonText,
                    habitData.health?.illness === false && styles.binaryButtonTextSelected,
                  ]}>
                    No
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    habitData.health?.illness === true && styles.binaryButtonSelected,
                  ]}
                  onPress={() => updateCategoryData('health', 'illness', true)}
                >
                  <Text style={[
                    styles.binaryButtonText,
                    habitData.health?.illness === true && styles.binaryButtonTextSelected,
                  ]}>
                    Yes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Pain Present?</Text>
              <View style={styles.binaryRow}>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    habitData.health?.pain?.present === false && styles.binaryButtonSelected,
                  ]}
                  onPress={() => {
                    setHabitData(prev => ({
                      ...prev,
                      health: {
                        ...prev.health,
                        pain: { present: false },
                      },
                    }));
                  }}
                >
                  <Text style={[
                    styles.binaryButtonText,
                    habitData.health?.pain?.present === false && styles.binaryButtonTextSelected,
                  ]}>
                    No
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    habitData.health?.pain?.present === true && styles.binaryButtonSelected,
                  ]}
                  onPress={() => {
                    setHabitData(prev => ({
                      ...prev,
                      health: {
                        ...prev.health,
                        pain: { present: true, level: 3 },
                      },
                    }));
                  }}
                >
                  <Text style={[
                    styles.binaryButtonText,
                    habitData.health?.pain?.present === true && styles.binaryButtonTextSelected,
                  ]}>
                    Yes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {habitData.health?.pain?.present && (
              <View style={styles.questionGroup}>
                <Text style={styles.questionLabel}>Pain Level</Text>
                <Text style={styles.questionHint}>1 = Mild, 5 = Severe</Text>
                <View style={styles.scaleRow}>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <ScaleButton
                      key={val}
                      value={val}
                      label={val === 1 ? 'Mild' : val === 5 ? 'Severe' : ''}
                      selected={habitData.health?.pain?.level === val}
                      onPress={() => {
                        setHabitData(prev => ({
                          ...prev,
                          health: {
                            ...prev.health,
                            pain: {
                              present: true,
                              level: val as 1 | 2 | 3 | 4 | 5,
                            },
                          },
                        }));
                      }}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        );

      case 'lifestyle':
        return (
          <View>
            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Screen Time (hours)</Text>
              <TextInput
                style={styles.questionInput}
                keyboardType="decimal-pad"
                placeholder="e.g., 6"
                value={habitData.lifestyle?.screenTime?.toString() || ''}
                onChangeText={(text) => updateCategoryData('lifestyle', 'screenTime', parseFloat(text) || 0)}
              />
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Evening Blue Light Exposure?</Text>
              <View style={styles.binaryRow}>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    habitData.lifestyle?.blueLight?.evening === false && styles.binaryButtonSelected,
                  ]}
                  onPress={() => {
                    setHabitData(prev => ({
                      ...prev,
                      lifestyle: {
                        ...prev.lifestyle,
                        blueLight: { evening: false },
                      },
                    }));
                  }}
                >
                  <Text style={[
                    styles.binaryButtonText,
                    habitData.lifestyle?.blueLight?.evening === false && styles.binaryButtonTextSelected,
                  ]}>
                    No
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    habitData.lifestyle?.blueLight?.evening === true && styles.binaryButtonSelected,
                  ]}
                  onPress={() => {
                    setHabitData(prev => ({
                      ...prev,
                      lifestyle: {
                        ...prev.lifestyle,
                        blueLight: { evening: true, hoursBeforeBed: 2 },
                      },
                    }));
                  }}
                >
                  <Text style={[
                    styles.binaryButtonText,
                    habitData.lifestyle?.blueLight?.evening === true && styles.binaryButtonTextSelected,
                  ]}>
                    Yes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Morning Sunlight?</Text>
              <View style={styles.binaryRow}>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    habitData.lifestyle?.morningLight === false && styles.binaryButtonSelected,
                  ]}
                  onPress={() => updateCategoryData('lifestyle', 'morningLight', false)}
                >
                  <Text style={[
                    styles.binaryButtonText,
                    habitData.lifestyle?.morningLight === false && styles.binaryButtonTextSelected,
                  ]}>
                    No
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    habitData.lifestyle?.morningLight === true && styles.binaryButtonSelected,
                  ]}
                  onPress={() => updateCategoryData('lifestyle', 'morningLight', true)}
                >
                  <Text style={[
                    styles.binaryButtonText,
                    habitData.lifestyle?.morningLight === true && styles.binaryButtonTextSelected,
                  ]}>
                    Yes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      default:
        return (
          <View>
            <Text style={styles.comingSoon}>
              Questions for this category coming soon...
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yesterday's Habits</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Date & Context */}
        <View style={styles.dateCard}>
          <Text style={styles.dateText}>{new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}</Text>
          <Text style={styles.contextText}>
            Answer questions about yesterday's activities to get personalized HRV insights
          </Text>
        </View>

        {/* Quick Log Presets */}
        {showQuickLog && (
          <View style={styles.quickLogCard}>
            <Text style={styles.quickLogTitle}>Quick Log</Text>
            <Text style={styles.quickLogSubtitle}>Tap a preset to auto-fill common patterns:</Text>

            <View style={styles.presetGrid}>
              {QUICK_LOG_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={styles.presetButton}
                  onPress={() => applyQuickLogPreset(preset.id)}
                >
                  <Text style={styles.presetIcon}>{preset.icon}</Text>
                  <Text style={styles.presetName}>{preset.name}</Text>
                  <Text style={styles.presetDesc}>{preset.description}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={() => setShowQuickLog(false)}>
              <Text style={styles.dismissText}>Or fill manually ↓</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Core Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>★ CORE FACTORS</Text>
          <Text style={styles.sectionSubtitle}>High impact on HRV</Text>

          {coreCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => toggleCategory(category.id)}
            >
              <View style={styles.categoryHeader}>
                <View style={styles.categoryLeft}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryDesc}>{category.description}</Text>
                  </View>
                </View>
                <Text style={styles.categoryStatus}>
                  {getCategoryCompletionIcon(category.id)} {expandedCategories.includes(category.id) ? '▼' : '▶'}
                </Text>
              </View>

              {expandedCategories.includes(category.id) && (
                <View style={styles.categoryContent}>
                  {renderCategoryQuestions(category.id)}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Optional Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OPTIONAL FACTORS</Text>
          <Text style={styles.sectionSubtitle}>Moderate impact - expand to track</Text>

          {optionalCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryCard, styles.categoryCardOptional]}
              onPress={() => toggleCategory(category.id)}
            >
              <View style={styles.categoryHeader}>
                <View style={styles.categoryLeft}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryDesc}>{category.description}</Text>
                  </View>
                </View>
                <Text style={styles.categoryStatus}>
                  {getCategoryCompletionIcon(category.id)} {expandedCategories.includes(category.id) ? '▼' : '▶'}
                </Text>
              </View>

              {expandedCategories.includes(category.id) && (
                <View style={styles.categoryContent}>
                  {renderCategoryQuestions(category.id)}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <Text style={styles.notesPlaceholder}>
            Any other significant events or observations? (Coming soon)
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Fixed Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButtonLarge} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Habits & Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  dateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  contextText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  quickLogCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  quickLogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  quickLogSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  presetButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  presetIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  presetDesc: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  dismissText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  categoryCardOptional: {
    backgroundColor: '#fafafa',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  categoryDesc: {
    fontSize: 12,
    color: '#666',
  },
  categoryStatus: {
    fontSize: 16,
    color: '#999',
  },
  categoryContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  comingSoon: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  notesPlaceholder: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButtonLarge: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  questionGroup: {
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  questionHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  questionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  scaleButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scaleButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  scaleButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
    marginBottom: 4,
  },
  scaleButtonTextSelected: {
    color: '#007AFF',
  },
  scaleButtonLabel: {
    fontSize: 10,
    color: '#999',
  },
  scaleButtonLabelSelected: {
    color: '#007AFF',
  },
  binaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  binaryButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  binaryButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  binaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  binaryButtonTextSelected: {
    color: '#007AFF',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  optionButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  optionButtonTextSelected: {
    color: '#007AFF',
  },
});
