import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { TodaysFocus } from '@/components/TodaysFocus';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { WhoopAuthButton } from '@/components/WhoopAuthButton';
import { SyncButton } from '@/components/SyncButton';
import { useUserStore } from '@/stores/userStore';
import { useHrvStore } from '@/stores/hrvStore';
import { useHabitStore } from '@/stores/habitStore';
import { useWhoopAuthStore } from '@/stores/whoopAuthStore';
import { analyzeAllHabits, rankByImpact } from '@/lib/correlations/analyzer';
import {
  generateRecommendations,
  getTodaysFocus,
} from '@/lib/recommendations/engine';
import {
  calculateGoalProgress,
  GOAL_PRESETS,
  percentileToTargetHrv,
} from '@/lib/goals/tracker';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export default function ProfileScreen() {
  const profile = useUserStore((state) => state.profile);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const clearProfile = useUserStore((state) => state.clearProfile);

  const readings = useHrvStore((state) => state.readings);
  const habits = useHabitStore((state) => state.entries);
  const getHabitByDate = useHabitStore((state) => state.getEntryByDate);

  const isWhoopConnected = useWhoopAuthStore((state) => state.isAuthenticated);

  const [showGoalPicker, setShowGoalPicker] = useState(false);

  // Calculate correlations and recommendations
  const analysis = useMemo(() => {
    return analyzeAllHabits(habits, readings, false);
  }, [habits, readings]);

  const recommendations = useMemo(() => {
    const ranked = rankByImpact(analysis.correlations);
    return generateRecommendations(ranked, habits);
  }, [analysis.correlations, habits]);

  const todaysFocus = useMemo(() => {
    const todayHabit = getHabitByDate(getTodayDate());
    return getTodaysFocus(recommendations, todayHabit);
  }, [recommendations, getHabitByDate]);

  // Calculate goal progress
  const goalProgress = useMemo(() => {
    if (!profile) return null;
    return calculateGoalProgress(readings, profile);
  }, [readings, profile]);

  const handleSetGoal = (percentile: number) => {
    if (profile) {
      updateProfile({ targetPercentile: percentile });
      setShowGoalPicker(false);
      const targetHrv = percentileToTargetHrv(percentile, profile.age, profile.gender);
      Alert.alert(
        'Goal Set!',
        `Your target HRV is now ${Math.round(targetHrv)} ms (${percentile}th percentile)`
      );
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete your profile and all data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => clearProfile(),
        },
      ]
    );
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.emptyProfileContainer}>
            <Text style={styles.emptyProfileIcon}>👤</Text>
            <Text style={styles.emptyProfileTitle}>No Profile Found</Text>
            <Text style={styles.emptyProfileText}>
              Create your profile to get personalized HRV insights and benchmarks.
            </Text>
            <TouchableOpacity
              style={styles.setupButton}
              onPress={() => {
                // Clear any corrupted data and go to onboarding
                clearProfile();
                router.replace('/onboarding');
              }}
            >
              <Text style={styles.setupButtonText}>Setup Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      {/* Profile Info */}
      <View style={styles.profileCard}>
        <Text style={styles.profileName}>Your Profile</Text>
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Age:</Text>
          <Text style={styles.profileValue}>{profile.age} years</Text>
        </View>
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Gender:</Text>
          <Text style={styles.profileValue}>
            {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
          </Text>
        </View>
      </View>

      {/* WHOOP Connection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>WHOOP Integration</Text>
        <WhoopAuthButton />
        {isWhoopConnected && (
          <>
            <Text style={styles.whoopHint}>
              Your HRV data will sync automatically every 6 hours
            </Text>
            <View style={styles.syncButtonContainer}>
              <SyncButton />
            </View>
          </>
        )}
      </View>

      {/* Today's Focus */}
      {recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Focus</Text>
          <TodaysFocus recommendation={todaysFocus} />
        </View>
      )}

      {/* Goal Progress */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>HRV Goal</Text>
          <TouchableOpacity onPress={() => setShowGoalPicker(!showGoalPicker)}>
            <Text style={styles.editLink}>
              {profile.targetPercentile ? 'Change' : 'Set Goal'}
            </Text>
          </TouchableOpacity>
        </View>

        {showGoalPicker && (
          <View style={styles.goalPicker}>
            {GOAL_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.percentile}
                style={[
                  styles.goalOption,
                  profile.targetPercentile === preset.percentile &&
                    styles.goalOptionSelected,
                ]}
                onPress={() => handleSetGoal(preset.percentile)}
              >
                <Text
                  style={[
                    styles.goalOptionText,
                    profile.targetPercentile === preset.percentile &&
                      styles.goalOptionTextSelected,
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {goalProgress ? (
          <ProgressIndicator
            current={goalProgress.currentHrv}
            goal={goalProgress.targetHrv}
            label={`${goalProgress.daysAtGoal} consecutive days at goal`}
          />
        ) : (
          <View style={styles.noGoalCard}>
            <Text style={styles.noGoalText}>
              {profile.targetPercentile
                ? 'Import HRV data to track progress'
                : 'Set a goal to track your progress'}
            </Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Data</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{readings.length}</Text>
            <Text style={styles.statLabel}>HRV Days</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{habits.length}</Text>
            <Text style={styles.statLabel}>Habits Logged</Text>
          </View>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
          <Text style={styles.dangerButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>HRV Optimizer v1.0.0</Text>
      </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  noProfile: {
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  profileCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  profileLabel: {
    color: '#666',
  },
  profileValue: {
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  editLink: {
    color: '#007AFF',
    fontSize: 14,
  },
  goalPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  goalOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  goalOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  goalOptionText: {
    color: '#333',
    fontSize: 14,
  },
  goalOptionTextSelected: {
    color: '#fff',
  },
  noGoalCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  noGoalText: {
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  dangerButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e74c3c',
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#e74c3c',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  version: {
    color: '#999',
    fontSize: 12,
  },
  whoopHint: {
    marginTop: 12,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  syncButtonContainer: {
    marginTop: 16,
  },
  emptyProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyProfileIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyProfileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyProfileText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  setupButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
