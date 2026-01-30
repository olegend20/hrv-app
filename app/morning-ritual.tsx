import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useMorningRitualStore } from '@/stores/morningRitualStore';
import { useAIPlanStore } from '@/stores/aiPlanStore';
import { MorningRitualWizard } from '@/components/MorningRitualWizard';

export default function MorningRitualScreen() {
  const { currentSession, resumeSession } = useMorningRitualStore();
  const { addPlan } = useAIPlanStore();

  useEffect(() => {
    // Try to resume existing session for today
    resumeSession();
  }, []);

  const handleComplete = () => {
    // Save the generated plan
    if (currentSession?.generatedPlan) {
      addPlan(currentSession.generatedPlan);
    }

    // Navigate to the daily plan screen
    router.replace('/daily-plan');
  };

  return (
    <View style={styles.container}>
      <MorningRitualWizard onComplete={handleComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
