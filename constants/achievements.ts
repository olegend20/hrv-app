export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'streak' | 'progress' | 'data' | 'milestone';
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Data achievements
  {
    id: 'data_pioneer',
    name: 'Data Pioneer',
    description: 'Import your first HRV data',
    emoji: '🚀',
    category: 'data',
  },
  {
    id: 'week_tracked',
    name: 'Week Tracked',
    description: 'Have 7 days of HRV data',
    emoji: '📊',
    category: 'data',
  },
  {
    id: 'month_tracked',
    name: 'Month Tracked',
    description: 'Have 30 days of HRV data',
    emoji: '📈',
    category: 'data',
  },

  // Streak achievements
  {
    id: 'streak_7',
    name: '7-Day Streak',
    description: 'Log habits for 7 consecutive days',
    emoji: '🔥',
    category: 'streak',
  },
  {
    id: 'streak_14',
    name: '14-Day Streak',
    description: 'Log habits for 14 consecutive days',
    emoji: '🔥🔥',
    category: 'streak',
  },
  {
    id: 'streak_30',
    name: '30-Day Streak',
    description: 'Log habits for 30 consecutive days',
    emoji: '🔥🔥🔥',
    category: 'streak',
  },

  // Progress achievements
  {
    id: 'on_target_7',
    name: 'On Target',
    description: 'Reach your HRV goal for 7 consecutive days',
    emoji: '🎯',
    category: 'progress',
  },
  {
    id: 'hrv_improver_10',
    name: 'HRV Improver',
    description: 'Improve your 7-day average HRV by 10%',
    emoji: '📈',
    category: 'progress',
  },
  {
    id: 'insights_unlocked',
    name: 'Insights Unlocked',
    description: 'Log enough data to unlock personalized insights',
    emoji: '💡',
    category: 'milestone',
  },

  // Milestone achievements
  {
    id: 'first_habit',
    name: 'First Steps',
    description: 'Log your first habit entry',
    emoji: '👣',
    category: 'milestone',
  },
  {
    id: 'goal_setter',
    name: 'Goal Setter',
    description: 'Set your first HRV goal',
    emoji: '🎯',
    category: 'milestone',
  },
];

export function getAchievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
