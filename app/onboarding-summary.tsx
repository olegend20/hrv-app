import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '@/stores/userStore';
import { useHealthProfileStore } from '@/stores/healthProfileStore';
import { useHrvStore } from '@/stores/hrvStore';
import { useAIPlanStore } from '@/stores/aiPlanStore';

interface OnboardingAnalysis {
  insights: string[];
  opportunities: string[];
  considerations: string[];
  initialRecommendations: string[];
}

export default function OnboardingSummaryScreen() {
  const [analysis, setAnalysis] = useState<OnboardingAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const profile = useUserStore((state) => state.profile);
  const healthProfile = useHealthProfileStore((state) => state.healthProfile);
  const readings = useHrvStore((state) => state.readings);
  const setOnboardingInsights = useAIPlanStore((state) => state.setOnboardingInsights);

  useEffect(() => {
    generateAnalysis();
  }, []);

  const generateAnalysis = async () => {
    try {
      setLoading(true);
      setError('');

      if (!profile || !healthProfile) {
        throw new Error('Missing profile data');
      }

      // Calculate HRV stats if we have data
      let hrvStats = null;
      if (readings.length > 0) {
        const avgHRV =
          readings.reduce((sum, r) => sum + r.hrvMs, 0) / readings.length;

        // Simple percentile calculation (would be more accurate with age-specific data)
        const currentPercentile = calculatePercentile(avgHRV, profile.age);

        hrvStats = {
          avgHRV: Math.round(avgHRV),
          currentPercentile,
          trend: 'stable',
          daysOfData: readings.length,
        };
      }

      // Call the onboarding analysis API
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/ai/onboarding-analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userProfile: {
              age: profile.age,
              gender: profile.gender,
            },
            healthProfile,
            hrvStats,
            correlations: [],
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate analysis');
      }

      const data = await response.json();
      setAnalysis(data);

      // Store in AI plan store for future reference
      setOnboardingInsights(data);

      setLoading(false);
    } catch (err) {
      console.error('Error generating analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate analysis');
      setLoading(false);
    }
  };

  const calculatePercentile = (hrv: number, age: number): number => {
    // Simplified percentile calculation
    // In production, this would use proper age/gender-specific norms
    if (age < 30) {
      if (hrv >= 70) return 75;
      if (hrv >= 60) return 50;
      return 25;
    } else if (age < 50) {
      if (hrv >= 60) return 75;
      if (hrv >= 50) return 50;
      return 25;
    } else {
      if (hrv >= 50) return 75;
      if (hrv >= 40) return 50;
      return 25;
    }
  };

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Analyzing your profile...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={generateAnalysis}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleContinue}
          >
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>♥</Text>
          <Text style={styles.title}>Here's what we learned about you</Text>
        </View>

        {analysis && (
          <>
            {analysis.insights.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Key Insights</Text>
                {analysis.insights.map((insight, index) => (
                  <View key={index} style={styles.item}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.itemText}>{insight}</Text>
                  </View>
                ))}
              </View>
            )}

            {analysis.opportunities.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Opportunities</Text>
                {analysis.opportunities.map((opportunity, index) => (
                  <View key={index} style={styles.item}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.itemText}>{opportunity}</Text>
                  </View>
                ))}
              </View>
            )}

            {analysis.considerations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Important Considerations</Text>
                {analysis.considerations.map((consideration, index) => (
                  <View key={index} style={styles.item}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.itemText}>{consideration}</Text>
                  </View>
                ))}
              </View>
            )}

            {analysis.initialRecommendations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your First Steps</Text>
                {analysis.initialRecommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <View style={styles.recommendationNumber}>
                      <Text style={styles.recommendationNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.recommendationText}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {readings.length > 0 && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Current HRV</Text>
            <Text style={styles.statsValue}>
              {Math.round(
                readings.reduce((sum, r) => sum + r.hrvMs, 0) / readings.length
              )}
              ms
            </Text>
            <Text style={styles.statsSubtitle}>
              Based on {readings.length} days of data
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Start Your First Day</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 64,
    color: '#e74c3c',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 48,
    color: '#e74c3c',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  item: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 8,
    marginTop: 2,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  recommendationNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  recommendationNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  recommendationText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  statsCard: {
    backgroundColor: '#f0f8ff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  statsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#007AFF',
  },
});
