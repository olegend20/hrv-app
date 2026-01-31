import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAIPlanStore } from '@/stores/aiPlanStore';

interface QuickAction {
  icon: string;
  label: string;
  route: string;
  description: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: '☀️',
    label: 'Morning Check-In',
    route: '/morning-ritual',
    description: 'Complete daily ritual',
  },
  {
    icon: '📋',
    label: "Today's Plan",
    route: '/daily-plan',
    description: 'View daily guidance',
  },
  {
    icon: '💬',
    label: 'Ask AI Coach',
    route: '/(tabs)/chat',
    description: 'Get personalized advice',
  },
  {
    icon: '📊',
    label: 'Log Habits',
    route: '/(tabs)/habits',
    description: 'Track daily habits',
  },
];

export function QuickActionsMenu() {
  const { getTodayPlan } = useAIPlanStore();
  const todayPlan = getTodayPlan();

  const handleActionPress = (action: QuickAction) => {
    console.log('[QuickActionsMenu] Button pressed:', action.label, 'Route:', action.route);
    router.push(action.route as any);
    console.log('[QuickActionsMenu] Navigation triggered for:', action.route);
  };

  // Filter out Morning Check-In if today's plan already exists
  const availableActions = QUICK_ACTIONS.filter((action) => {
    if (action.label === 'Morning Check-In' && todayPlan) {
      return false; // Hide morning ritual if plan exists
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {availableActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionCard}
            onPress={() => handleActionPress(action)}
          >
            <Text style={styles.icon}>{action.icon}</Text>
            <Text style={styles.label}>{action.label}</Text>
            <Text style={styles.description}>{action.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  actionCard: {
    width: 120,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
});
