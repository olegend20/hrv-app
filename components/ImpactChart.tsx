import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { Correlation } from '@/types';

interface ImpactChartProps {
  correlations: Correlation[];
  maxItems?: number;
}

const screenWidth = Dimensions.get('window').width;
const MAX_BAR_WIDTH = (screenWidth - 120) / 2; // Half width for positive/negative

export function ImpactChart({ correlations, maxItems = 6 }: ImpactChartProps) {
  const items = correlations.slice(0, maxItems);

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data to display</Text>
      </View>
    );
  }

  // Find max absolute percentage for scaling
  const maxPct = Math.max(...items.map((c) => Math.abs(c.percentageDiff)));
  const scale = maxPct > 0 ? MAX_BAR_WIDTH / maxPct : 1;

  return (
    <View style={styles.container}>
      {items.map((correlation) => {
        const isPositive = correlation.percentageDiff >= 0;
        const barWidth = Math.abs(correlation.percentageDiff) * scale;

        return (
          <View key={correlation.habitKey} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>
              {correlation.habitLabel}
            </Text>
            <View style={styles.barContainer}>
              {/* Negative bar (left side) */}
              <View style={styles.negativeArea}>
                {!isPositive && (
                  <View
                    style={[
                      styles.bar,
                      styles.negativeBar,
                      { width: barWidth },
                    ]}
                  />
                )}
              </View>
              {/* Center line */}
              <View style={styles.centerLine} />
              {/* Positive bar (right side) */}
              <View style={styles.positiveArea}>
                {isPositive && (
                  <View
                    style={[
                      styles.bar,
                      styles.positiveBar,
                      { width: barWidth },
                    ]}
                  />
                )}
              </View>
            </View>
            <Text
              style={[
                styles.value,
                { color: isPositive ? '#27ae60' : '#e74c3c' },
              ]}
            >
              {isPositive ? '+' : ''}{Math.round(correlation.percentageDiff)}%
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    width: 80,
    fontSize: 12,
    color: '#333',
  },
  barContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  negativeArea: {
    flex: 1,
    alignItems: 'flex-end',
  },
  positiveArea: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerLine: {
    width: 1,
    height: 24,
    backgroundColor: '#ddd',
  },
  bar: {
    height: 16,
    borderRadius: 4,
  },
  positiveBar: {
    backgroundColor: '#27ae60',
    marginLeft: 2,
  },
  negativeBar: {
    backgroundColor: '#e74c3c',
    marginRight: 2,
  },
  value: {
    width: 50,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
});
