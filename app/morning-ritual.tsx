import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useMorningRitualStore } from '@/stores/morningRitualStore';
import { useAIPlanStore } from '@/stores/aiPlanStore';
import { MorningRitualWizard } from '@/components/MorningRitualWizard';

export default function MorningRitualScreen() {
  const { currentSession, resumeSession, hasHydrated } = useMorningRitualStore();
  const { addPlan } = useAIPlanStore();

  console.log('[MorningRitual] Rendering - hasHydrated:', hasHydrated, 'currentSession:', !!currentSession);

  useEffect(() => {
    console.log('[MorningRitual] useEffect - attempting to resume session');
    // Try to resume existing session for today
    const resumed = resumeSession();
    console.log('[MorningRitual] Resume result:', resumed ? 'session resumed' : 'no session to resume');
  }, []);

  const handleComplete = () => {
    console.log('[MorningRitual] handleComplete called');
    // Save the generated plan
    if (currentSession?.generatedPlan) {
      addPlan(currentSession.generatedPlan);
    }

    // Navigate to the daily plan screen
    router.replace('/daily-plan');
  };

  if (!hasHydrated) {
    console.log('[MorningRitual] Store not hydrated yet, showing loading');
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  console.log('[MorningRitual] Rendering wizard');
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
