import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Achievement } from '@/types';
import { getAchievementById } from '@/constants/achievements';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'small' | 'medium' | 'large';
}

export function AchievementBadge({
  achievement,
  size = 'medium',
}: AchievementBadgeProps) {
  const definition = getAchievementById(achievement.id);
  const isUnlocked = !!achievement.unlockedAt;

  const containerSize =
    size === 'small' ? 60 : size === 'medium' ? 80 : 100;
  const emojiSize = size === 'small' ? 24 : size === 'medium' ? 32 : 40;
  const textSize = size === 'small' ? 10 : size === 'medium' ? 12 : 14;

  return (
    <View
      style={[
        styles.container,
        { width: containerSize },
        !isUnlocked && styles.locked,
      ]}
    >
      <View
        style={[
          styles.badge,
          { width: containerSize - 16, height: containerSize - 16 },
          isUnlocked && styles.badgeUnlocked,
        ]}
      >
        <Text style={[styles.emoji, { fontSize: emojiSize }]}>
          {isUnlocked ? definition?.emoji : '🔒'}
        </Text>
      </View>
      <Text
        style={[styles.name, { fontSize: textSize }]}
        numberOfLines={2}
      >
        {achievement.name}
      </Text>
      {achievement.progress !== undefined && achievement.target !== undefined && (
        <Text style={styles.progress}>
          {achievement.progress}/{achievement.target}
        </Text>
      )}
    </View>
  );
}

interface AchievementListProps {
  achievements: Achievement[];
}

export function AchievementList({ achievements }: AchievementListProps) {
  if (achievements.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No achievements yet</Text>
      </View>
    );
  }

  // Separate unlocked and locked
  const unlocked = achievements.filter((a) => a.unlockedAt);
  const locked = achievements.filter((a) => !a.unlockedAt);

  return (
    <View>
      {unlocked.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unlocked</Text>
          <View style={styles.grid}>
            {unlocked.map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </View>
        </View>
      )}

      {locked.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locked</Text>
          <View style={styles.grid}>
            {locked.map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    margin: 8,
  },
  locked: {
    opacity: 0.5,
  },
  badge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  badgeUnlocked: {
    backgroundColor: '#fff3e0',
    borderWidth: 2,
    borderColor: '#f39c12',
  },
  emoji: {
    textAlign: 'center',
  },
  name: {
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
  progress: {
    fontSize: 10,
    color: '#999',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
