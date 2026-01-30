import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useMorningRitualStore } from '@/stores/morningRitualStore';
import { useAIPlanStore } from '@/stores/aiPlanStore';

export function MorningRitualCard() {
  const { currentSession, resumeSession } = useMorningRitualStore();
  const { getTodayPlan } = useAIPlanStore();

  const todayPlan = getTodayPlan();
  const activeSession = resumeSession();

  // Don't show if already completed today
  if (todayPlan && !activeSession) {
    return null;
  }

  const handlePress = () => {
    router.push('/morning-ritual');
  };

  const getProgressText = () => {
    if (!activeSession) {
      return 'Not started';
    }

    const stepLabels = {
      welcome: 'Just started',
      screenshots: 'Uploading screenshots',
      context: 'Adding morning context',
      'yesterday-review': 'Reviewing yesterday',
      habits: 'Logging habits',
      analysis: 'Analyzing...',
      plan: 'Complete!',
    };

    return stepLabels[activeSession.currentStep] || 'In progress';
  };

  const getPercentage = () => {
    if (!activeSession) return 0;

    const stepOrder = ['welcome', 'screenshots', 'context', 'yesterday-review', 'habits', 'analysis', 'plan'];
    const currentIndex = stepOrder.indexOf(activeSession.currentStep);
    return Math.round(((currentIndex + 1) / stepOrder.length) * 100);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.emoji}>☀️</Text>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {activeSession ? 'Continue Morning Ritual' : 'Start Morning Ritual'}
          </Text>
          <Text style={styles.subtitle}>{getProgressText()}</Text>
        </View>
      </View>

      {activeSession && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getPercentage()}%` }]} />
          </View>
          <Text style={styles.progressText}>{getPercentage()}% Complete</Text>
        </View>
      )}

      <View style={styles.steps}>
        <StepIndicator label="Screenshots" completed={false} />
        <StepIndicator label="Analysis" completed={false} />
        <StepIndicator label="Daily Plan" completed={false} />
      </View>

      <View style={styles.ctaContainer}>
        <Text style={styles.ctaText}>
          {activeSession ? 'Resume →' : 'Get Started →'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function StepIndicator({ label, completed }: { label: string; completed: boolean }) {
  return (
    <View style={styles.stepItem}>
      <View style={[styles.stepDot, completed && styles.stepDotCompleted]} />
      <Text style={styles.stepLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF5F0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 36,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#FFE0D6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginBottom: 6,
  },
  stepDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepLabel: {
    fontSize: 11,
    color: '#666',
  },
  ctaContainer: {
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B35',
  },
});
