import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { router } from 'expo-router';
import { OnboardingForm } from '@/components/OnboardingForm';
import { useUserStore } from '@/stores/userStore';

export default function OnboardingScreen() {
  const setProfile = useUserStore((state) => state.setProfile);

  const handleComplete = (age: number, gender: 'male' | 'female' | 'other') => {
    setProfile(age, gender);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>♥</Text>
        <Text style={styles.appName}>HRV Optimizer</Text>
      </View>
      <OnboardingForm onComplete={handleComplete} />
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
