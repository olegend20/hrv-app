import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAIPlanStore } from '@/stores/aiPlanStore';
import { useUserStore } from '@/stores/userStore';
import { useHealthProfileStore } from '@/stores/healthProfileStore';
import { useHrvStore } from '@/stores/hrvStore';
import { useScreenshotStore } from '@/stores/screenshotStore';
import { DailyPlan } from '@/types';

export default function DailyPlanScreen() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState('');

  const profile = useUserStore((state) => state.profile);
  const healthProfile = useHealthProfileStore((state) => state.healthProfile);
  const readings = useHrvStore((state) => state.readings);
  const allScreenshots = useScreenshotStore((state) => state.screenshots);
  const getRecentScreenshots = useScreenshotStore((state) => state.getRecentScreenshots);

  // Memoize to avoid infinite loop
  const screenshots = useMemo(() => getRecentScreenshots(1), [allScreenshots, getRecentScreenshots]);

  const {
    getTodayPlan,
    addPlan,
    markRecommendationCompleted,
    markRecommendationIncomplete,
    setOutcome,
    getAverageAdherence,
  } = useAIPlanStore();

  useEffect(() => {
    loadOrGeneratePlan();
  }, []);

  const loadOrGeneratePlan = async () => {
    try {
      setLoading(true);

      // Check if we already have a plan for today
      const existingPlan = getTodayPlan();
      if (existingPlan) {
        setPlan(existingPlan);
        setLoading(false);
        return;
      }

      // Generate new plan
      await generatePlan();
    } catch (error) {
      console.error('Error loading plan:', error);
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    try {
      // Get today's data
      const today = new Date().toISOString().split('T')[0];
      const todayScreenshot = screenshots.find((s) => s.date === today);
      const todayReading = readings.find((r) => r.date === today);

      if (!todayScreenshot && !todayReading) {
        Alert.alert(
          'No Data Available',
          'Please upload a WHOOP screenshot or add HRV data for today first.',
          [
            {
              text: 'Upload Screenshot',
              onPress: () => router.push('/screenshot-upload'),
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        setLoading(false);
        return;
      }

      const todayData = {
        hrv: todayScreenshot?.extractedData.hrv || todayReading?.hrvMs || 0,
        recoveryScore: todayScreenshot?.extractedData.recoveryScore || 0,
        sleepHours: todayScreenshot?.extractedData.sleepHours || 0,
        strain: todayScreenshot?.extractedData.strain,
      };

      // Calculate historical data
      const recentReadings = readings.slice(-7);
      const avg7Day =
        recentReadings.reduce((sum, r) => sum + r.hrvMs, 0) / recentReadings.length;
      const avg30Day =
        readings.slice(-30).reduce((sum, r) => sum + r.hrvMs, 0) /
        Math.min(readings.length, 30);

      const historicalData = {
        avg7Day: Math.round(avg7Day),
        avg30Day: Math.round(avg30Day),
        trend: todayData.hrv > avg7Day ? 'increasing' : 'decreasing',
      };

      // Call daily plan API
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/ai/daily-plan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: today,
            todayData,
            userContext: todayScreenshot?.userContext || '',
            historicalData,
            correlations: [],
            goals: {
              targetHRV: profile?.targetPercentile || 50,
              targetPercentile: profile?.targetPercentile || 50,
            },
            userProfile: profile,
            healthProfile,
            recentPlans: {
              adherenceRate: getAverageAdherence(7),
              successfulRecs: [],
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate daily plan');
      }

      const newPlan = await response.json();
      addPlan(newPlan);
      setPlan(newPlan);
      setLoading(false);
    } catch (error) {
      console.error('Error generating plan:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to generate plan'
      );
      setLoading(false);
    }
  };

  const handleToggleRecommendation = (index: number) => {
    if (!plan) return;

    const recId = `rec-${index}`;
    const isCompleted = plan.completed.includes(recId);

    if (isCompleted) {
      markRecommendationIncomplete(plan.id, index);
    } else {
      markRecommendationCompleted(plan.id, index);
    }

    // Update local state
    setPlan({
      ...plan,
      completed: isCompleted
        ? plan.completed.filter((id) => id !== recId)
        : [...plan.completed, recId],
    });
  };

  const handleSubmitFeedback = () => {
    if (!plan) return;

    const completionRate = plan.completed.length / plan.recommendations.length;

    setOutcome(plan.id, {
      followedPlan: completionRate >= 0.5,
      actualNextDayHRV: 0, // Would be filled in with tomorrow's data
      userNotes: feedbackNotes,
    });

    Alert.alert('Success', 'Thanks for your feedback!', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const getFocusAreaColor = (focusArea: string) => {
    switch (focusArea) {
      case 'Recovery':
        return '#e74c3c';
      case 'Maintenance':
        return '#f39c12';
      case 'Push':
        return '#27ae60';
      default:
        return '#666';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Exercise':
        return '🏃';
      case 'Nutrition':
        return '🥗';
      case 'Stress Management':
        return '🧘';
      case 'Sleep':
        return '😴';
      case 'Hydration':
        return '💧';
      case 'Recovery':
        return '🛀';
      default:
        return '📝';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Generating your personalized plan...</Text>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No plan available</Text>
        <TouchableOpacity style={styles.button} onPress={generatePlan}>
          <Text style={styles.buttonText}>Generate Plan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const completionRate =
    Math.round((plan.completed.length / plan.recommendations.length) * 100) || 0;

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Today's Plan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Focus Area Header */}
        <View
          style={[
            styles.focusAreaCard,
            { backgroundColor: getFocusAreaColor(plan.focusArea) + '20' },
          ]}
        >
          <View
            style={[
              styles.focusAreaBadge,
              { backgroundColor: getFocusAreaColor(plan.focusArea) },
            ]}
          >
            <Text style={styles.focusAreaText}>{plan.focusArea}</Text>
          </View>
          <Text style={styles.reasoning}>{plan.reasoning}</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>Today's Progress</Text>
          <Text style={styles.progressValue}>{completionRate}%</Text>
          <Text style={styles.progressSubtext}>
            {plan.completed.length} of {plan.recommendations.length} completed
          </Text>
        </View>

        {/* Recommendations */}
        <Text style={styles.sectionTitle}>Your Action Plan</Text>

        {/* Group by priority */}
        {[1, 2, 3].map((priority) => {
          const recs = plan.recommendations.filter((r) => r.priority === priority);
          if (recs.length === 0) return null;

          return (
            <View key={priority} style={styles.prioritySection}>
              <Text style={styles.priorityLabel}>
                {priority === 1 ? '🔥 High Priority' : priority === 2 ? '⭐ Medium Priority' : '💡 Nice to Have'}
              </Text>

              {recs.map((rec, idx) => {
                const globalIndex = plan.recommendations.indexOf(rec);
                const isCompleted = plan.completed.includes(`rec-${globalIndex}`);

                return (
                  <TouchableOpacity
                    key={globalIndex}
                    style={[styles.recommendationCard, isCompleted && styles.recommendationCompleted]}
                    onPress={() => handleToggleRecommendation(globalIndex)}
                  >
                    <View style={styles.recommendationHeader}>
                      <View style={styles.checkbox}>
                        {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.categoryIcon}>{getCategoryIcon(rec.category)}</Text>
                      <View style={styles.recommendationContent}>
                        <Text style={[styles.recommendationAction, isCompleted && styles.textCompleted]}>
                          {rec.action}
                        </Text>
                        <Text style={styles.recommendationMeta}>
                          {rec.category} • {rec.timing}
                        </Text>
                        <Text style={styles.expectedImpact}>{rec.expectedImpact}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        {/* End of Day Feedback */}
        {!showFeedback && (
          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={() => setShowFeedback(true)}
          >
            <Text style={styles.feedbackButtonText}>How did it go?</Text>
          </TouchableOpacity>
        )}

        {showFeedback && (
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>End of Day Feedback</Text>
            <Text style={styles.feedbackSubtitle}>
              You completed {completionRate}% of today's plan
            </Text>

            <TextInput
              style={styles.feedbackInput}
              placeholder="How are you feeling? Any notes?"
              value={feedbackNotes}
              onChangeText={setFeedbackNotes}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitFeedback}>
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  headerSpacer: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  focusAreaCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  focusAreaBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  focusAreaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reasoning: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  progressCard: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressSubtext: {
    fontSize: 13,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  prioritySection: {
    marginBottom: 24,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  recommendationCompleted: {
    backgroundColor: '#f0f8ff',
    borderColor: '#007AFF',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkmark: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationAction: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  textCompleted: {
    color: '#999',
  },
  recommendationMeta: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  expectedImpact: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '500',
  },
  feedbackButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  feedbackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackCard: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 12,
    marginTop: 24,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  feedbackSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  feedbackInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
