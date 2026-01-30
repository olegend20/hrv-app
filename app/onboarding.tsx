import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { router } from 'expo-router';
import { EnhancedOnboardingForm } from '@/components/EnhancedOnboardingForm';
import { useUserStore } from '@/stores/userStore';
import { useHealthProfileStore } from '@/stores/healthProfileStore';
import { HealthProfile } from '@/types';

export default function OnboardingScreen() {
  const setProfile = useUserStore((state) => state.setProfile);
  const setHealthProfile = useHealthProfileStore((state) => state.setHealthProfile);

  const handleComplete = (
    age: number,
    gender: 'male' | 'female' | 'other',
    healthProfile: HealthProfile
  ) => {
    setProfile(age, gender);
    setHealthProfile(healthProfile);
    // Navigate to WHOOP sync screen (will be created in next bead)
    router.push('/whoop-sync');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>♥</Text>
        <Text style={styles.appName}>HRV Optimizer</Text>
      </View>
      <EnhancedOnboardingForm onComplete={handleComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  logo: {
    fontSize: 48,
    color: '#e74c3c',
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
  },
});
