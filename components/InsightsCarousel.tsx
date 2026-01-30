import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MorningAnalysisResponse } from '@/types';

interface InsightsCarouselProps {
  analysis: MorningAnalysisResponse['analysis'];
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 64;

export function InsightsCarousel({ analysis }: InsightsCarouselProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Key Insights</Text>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
      >
        {/* HRV Status Card */}
        <View style={[styles.card, styles.statusCard]}>
          <View style={styles.cardHeader}>
            <Ionicons name="heart-outline" size={24} color="#FF6B35" />
            <Text style={styles.cardTitle}>HRV Status</Text>
          </View>
          <View style={styles.percentileContainer}>
            <Text style={styles.percentileValue}>{analysis.status.hrvPercentile}%</Text>
            <Text style={styles.percentileLabel}>Percentile for your age</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>vs 7-day avg</Text>
              <Text
                style={[
                  styles.statusValue,
                  analysis.status.vsSevenDay >= 0 ? styles.positive : styles.negative,
                ]}
              >
                {analysis.status.vsSevenDay >= 0 ? '+' : ''}
                {analysis.status.vsSevenDay}ms
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>State</Text>
              <Text style={styles.statusValue}>{analysis.status.recoveryState}</Text>
            </View>
          </View>
        </View>

        {/* Yesterday's Learnings Card */}
        {analysis.previousDayLearnings.length > 0 && (
          <View style={[styles.card, styles.learningsCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="school-outline" size={24} color="#4CAF50" />
              <Text style={styles.cardTitle}>Yesterday's Learnings</Text>
            </View>
            <View style={styles.learningsList}>
              {analysis.previousDayLearnings.map((learning, index) => (
                <View key={index} style={styles.learningItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.learningText}>{learning}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Key Insights Card */}
        {analysis.insights.length > 0 && (
          <View style={[styles.card, styles.insightsCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="bulb-outline" size={24} color="#FFB800" />
              <Text style={styles.cardTitle}>Key Insights</Text>
            </View>
            <View style={styles.insightsList}>
              {analysis.insights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <View style={styles.insightDot} />
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Goal Progress Card */}
        {analysis.goalProgress && (
          <View style={[styles.card, styles.goalCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="trophy-outline" size={24} color="#9C27B0" />
              <Text style={styles.cardTitle}>Goal Progress</Text>
            </View>
            <View style={styles.goalContent}>
              <View style={styles.hrvComparison}>
                <View style={styles.hrvBox}>
                  <Text style={styles.hrvLabel}>Current</Text>
                  <Text style={styles.hrvValue}>{analysis.goalProgress.currentHRV}ms</Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color="#999" />
                <View style={styles.hrvBox}>
                  <Text style={styles.hrvLabel}>Target</Text>
                  <Text style={styles.hrvValue}>{analysis.goalProgress.targetHRV}ms</Text>
                </View>
              </View>
              <View style={styles.goalProgress}>
                <View
                  style={[
                    styles.goalProgressBar,
                    {
                      width: `${Math.min(
                        100,
                        (analysis.goalProgress.currentHRV / analysis.goalProgress.targetHRV) *
                          100
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.goalStatus}>
                {analysis.goalProgress.onTrack
                  ? `🎯 On track! Estimated ${analysis.goalProgress.daysToTarget} days to target`
                  : '💪 Keep going! Stay consistent with your plan'}
              </Text>
            </View>
          </View>
        )}

        {/* Focus Area Card */}
        <View style={[styles.card, styles.focusCard]}>
          <View style={styles.cardHeader}>
            <Ionicons name="flag-outline" size={24} color="#FF6B35" />
            <Text style={styles.cardTitle}>Today's Focus</Text>
          </View>
          <View style={styles.focusBadge}>
            <Text style={styles.focusText}>{analysis.focusArea}</Text>
          </View>
          <Text style={styles.reasoning}>{analysis.reasoning}</Text>
        </View>
      </ScrollView>

      <View style={styles.dotContainer}>
        {[
          true,
          analysis.previousDayLearnings.length > 0,
          analysis.insights.length > 0,
          !!analysis.goalProgress,
          true,
        ]
          .filter(Boolean)
          .map((_, index) => (
            <View key={index} style={styles.dot} />
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  card: {
    width: CARD_WIDTH,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusCard: {
    backgroundColor: '#FFF5F0',
  },
  learningsCard: {
    backgroundColor: '#F0F8F5',
  },
  insightsCard: {
    backgroundColor: '#FFFEF0',
  },
  goalCard: {
    backgroundColor: '#F8F0FF',
  },
  focusCard: {
    backgroundColor: '#F0F7FF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  percentileContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  percentileValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  percentileLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  positive: {
    color: '#4CAF50',
  },
  negative: {
    color: '#F44336',
  },
  learningsList: {
    gap: 12,
  },
  learningItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  learningText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFB800',
    marginTop: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  goalContent: {
    gap: 16,
  },
  hrvComparison: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  hrvBox: {
    alignItems: 'center',
  },
  hrvLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  hrvValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  goalProgress: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalProgressBar: {
    height: '100%',
    backgroundColor: '#9C27B0',
    borderRadius: 4,
  },
  goalStatus: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  focusBadge: {
    alignSelf: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 16,
  },
  focusText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  reasoning: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
  },
});
