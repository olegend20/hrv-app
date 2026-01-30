import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { DailyPlan, YesterdayPlanReview } from '@/types';
import { Ionicons } from '@expo/vector-icons';

interface YesterdayPlanReviewProps {
  plan: DailyPlan;
  onComplete: (review: YesterdayPlanReview) => void;
  onSkip: () => void;
  onBack?: () => void;
}

export function YesterdayPlanReviewComponent({
  plan,
  onComplete,
  onSkip,
  onBack,
}: YesterdayPlanReviewProps) {
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [overallRating, setOverallRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [notes, setNotes] = useState('');

  const toggleAction = (actionIndex: number) => {
    const actionId = `rec-${actionIndex}`;
    setCompletedActions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    if (overallRating !== null) {
      onComplete({
        planId: plan.id,
        completedActions: Array.from(completedActions),
        totalActions: plan.recommendations.length,
        overallRating,
        notes,
      });
    }
  };

  const canSubmit = overallRating !== null;
  const completionPercentage =
    plan.recommendations.length > 0
      ? Math.round((completedActions.size / plan.recommendations.length) * 100)
      : 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Yesterday's Plan Review</Text>
          <Text style={styles.subtitle}>
            This feedback helps the AI learn what works for you
          </Text>
        </View>

        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={styles.focusBadge}>
              <Text style={styles.focusText}>{plan.focusArea}</Text>
            </View>
            <Text style={styles.planDate}>
              {new Date(plan.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          {plan.reasoning && <Text style={styles.reasoning}>{plan.reasoning}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Which actions did you complete?</Text>
          <Text style={styles.sectionSubtitle}>Check off what you did</Text>

          <View style={styles.actionsList}>
            {plan.recommendations.map((rec, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionItem}
                onPress={() => toggleAction(index)}
              >
                <View
                  style={[
                    styles.checkbox,
                    completedActions.has(`rec-${index}`) && styles.checkboxChecked,
                  ]}
                >
                  {completedActions.has(`rec-${index}`) && (
                    <Ionicons name="checkmark" size={18} color="white" />
                  )}
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionText}>{rec.action}</Text>
                  {rec.timing && <Text style={styles.actionTiming}>{rec.timing}</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>Completion Rate</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {completedActions.size} of {plan.recommendations.length} completed (
              {completionPercentage}%)
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall, how was your day?</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.ratingButton,
                  overallRating === rating && styles.ratingButtonActive,
                ]}
                onPress={() => setOverallRating(rating as 1 | 2 | 3 | 4 | 5)}
              >
                <Ionicons
                  name={getDayIcon(rating)}
                  size={32}
                  color={overallRating === rating ? '#FF6B35' : '#999'}
                />
                <Text
                  style={[
                    styles.ratingLabel,
                    overallRating === rating && styles.ratingLabelActive,
                  ]}
                >
                  {getDayLabel(rating)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Any insights? (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="E.g., The meditation really helped, but didn't have time for the walk..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>Submit Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getDayIcon(rating: number): keyof typeof Ionicons.glyphMap {
  const icons: (keyof typeof Ionicons.glyphMap)[] = [
    'sad-outline',
    'alert-circle-outline',
    'remove-circle-outline',
    'happy-outline',
    'star-outline',
  ];
  return icons[rating - 1];
}

function getDayLabel(rating: number): string {
  const labels = ['Poor', 'Below Avg', 'Average', 'Good', 'Excellent'];
  return labels[rating - 1];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
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
  planCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  focusBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  focusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  planDate: {
    fontSize: 14,
    color: '#666',
  },
  reasoning: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  actionsList: {
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  actionContent: {
    flex: 1,
  },
  actionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  actionTiming: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: '#F0F7FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#666',
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
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
});
