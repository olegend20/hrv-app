import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useUserStore } from '@/stores/userStore';
import { useAIPlanStore } from '@/stores/aiPlanStore';
import { Ionicons } from '@expo/vector-icons';

interface MorningWelcomeProps {
  onStartRitual: () => void;
}

export function MorningWelcome({ onStartRitual }: MorningWelcomeProps) {
  const { profile } = useUserStore();
  const { getYesterdayPlan } = useAIPlanStore();

  const yesterdayPlan = getYesterdayPlan();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getCompletionPreview = () => {
    if (!yesterdayPlan) {
      return null;
    }

    const totalRecs = yesterdayPlan.recommendations.length;
    const completed = yesterdayPlan.completed.length;
    const percentage = totalRecs > 0 ? Math.round((completed / totalRecs) * 100) : 0;

    return {
      completed,
      total: totalRecs,
      percentage,
    };
  };

  const completionPreview = getCompletionPreview();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sunny-outline" size={48} color="#FF6B35" />
        <Text style={styles.greeting}>{getGreeting()}!</Text>
        {profile && <Text style={styles.subtitle}>Ready to optimize your day?</Text>}
      </View>

      {completionPreview && (
        <View style={styles.yesterdayCard}>
          <Text style={styles.yesterdayTitle}>Yesterday's Progress</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${completionPreview.percentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {completionPreview.completed}/{completionPreview.total}
            </Text>
          </View>
          <Text style={styles.yesterdaySubtext}>
            {completionPreview.percentage >= 70
              ? '🎉 Great adherence!'
              : completionPreview.percentage >= 40
              ? '👍 Good effort!'
              : '💪 Let\'s do better today!'}
          </Text>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Your Morning Check-In</Text>
        <View style={styles.stepsList}>
          <StepItem icon="camera-outline" text="Upload recovery screenshots" />
          <StepItem icon="clipboard-outline" text="Quick morning context" />
          {yesterdayPlan && (
            <StepItem icon="checkmark-circle-outline" text="Review yesterday's plan" />
          )}
          <StepItem icon="list-outline" text="Update habits (pre-filled)" />
          <StepItem icon="sparkles-outline" text="Get personalized plan" />
        </View>
        <Text style={styles.estimatedTime}>Takes about 3-5 minutes</Text>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={onStartRitual}>
        <Text style={styles.startButtonText}>Start Your Morning Check-In</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton}>
        <Text style={styles.skipButtonText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

function StepItem({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.stepItem}>
      <Ionicons name={icon} size={20} color="#666" />
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  yesterdayCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  yesterdayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 40,
  },
  yesterdaySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepText: {
    fontSize: 15,
    color: '#666',
  },
  estimatedTime: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 16,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    padding: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
