import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Correlation } from '@/types';

interface CorrelationCardProps {
  correlation: Correlation;
}

export function CorrelationCard({ correlation }: CorrelationCardProps) {
  const isPositive = correlation.percentageDiff >= 0;
  const color = isPositive ? '#27ae60' : '#e74c3c';

  const getBadgeColor = () => {
    switch (correlation.significance) {
      case 'high':
        return '#27ae60';
      case 'medium':
        return '#f39c12';
      default:
        return '#95a5a6';
    }
  };

  const getBadgeText = () => {
    switch (correlation.significance) {
      case 'high':
        return 'Strong';
      case 'medium':
        return 'Moderate';
      default:
        return 'Weak';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{correlation.habitLabel}</Text>
        <View style={[styles.badge, { backgroundColor: getBadgeColor() }]}>
          <Text style={styles.badgeText}>{getBadgeText()}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={[styles.percentage, { color }]}>
          {isPositive ? '+' : ''}{correlation.percentageDiff}%
        </Text>
        <Text style={styles.comparison}>
          {correlation.avgHrvWith}ms vs {correlation.avgHrvWithout}ms
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.sampleSize}>
          Based on {correlation.sampleSize} days
        </Text>
        <Text style={styles.coefficient}>
          r = {correlation.coefficient.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    marginBottom: 12,
  },
  percentage: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  comparison: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sampleSize: {
    fontSize: 12,
    color: '#999',
  },
  coefficient: {
    fontSize: 12,
    color: '#999',
  },
});
