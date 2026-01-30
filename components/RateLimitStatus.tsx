import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useUserStore } from '@/stores/userStore';

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  resetTimeFormatted: string;
}

export function RateLimitStatus() {
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const profile = useUserStore((state) => state.profile);

  useEffect(() => {
    fetchRateLimitStatus();
  }, []);

  const fetchRateLimitStatus = async () => {
    try {
      setLoading(true);
      const userId = profile?.id || 'anonymous';

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/ai/rate-limit-status?userId=${userId}`
      );

      if (response.ok) {
        const data = await response.json();
        setRateLimitInfo(data);
      }
    } catch (error) {
      console.error('Error fetching rate limit status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }

  if (!rateLimitInfo) {
    return null;
  }

  const percentage = (rateLimitInfo.remaining / rateLimitInfo.limit) * 100;
  const resetDate = new Date(rateLimitInfo.resetTime);
  const now = new Date();
  const hoursUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Usage</Text>
        <Text style={styles.badge}>
          {rateLimitInfo.remaining}/{rateLimitInfo.limit}
        </Text>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${percentage}%`,
              backgroundColor: percentage > 50 ? '#27ae60' : percentage > 20 ? '#f39c12' : '#e74c3c',
            },
          ]}
        />
      </View>

      <Text style={styles.subtitle}>
        {rateLimitInfo.remaining > 0
          ? `${rateLimitInfo.remaining} AI questions remaining today`
          : `Resets in ${hoursUntilReset}h`}
      </Text>

      {rateLimitInfo.remaining <= 3 && rateLimitInfo.remaining > 0 && (
        <Text style={styles.warning}>
          ⚠️ You're running low on AI questions. Use them wisely!
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  badge: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  warning: {
    fontSize: 11,
    color: '#f39c12',
    marginTop: 8,
    fontWeight: '500',
  },
});
