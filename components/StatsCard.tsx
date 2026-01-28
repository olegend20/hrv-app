import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface StatsCardProps {
  label: string;
  value: string | number | null;
  unit?: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'same';
  trendValue?: number;
}

export function StatsCard({
  label,
  value,
  unit = 'ms',
  subtitle,
  trend,
  trendValue,
}: StatsCardProps) {
  const getTrendColor = () => {
    if (trend === 'up') return '#27ae60';
    if (trend === 'down') return '#e74c3c';
    return '#666';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '▲';
    if (trend === 'down') return '▼';
    return '─';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueContainer}>
        <Text style={styles.value}>
          {value !== null ? value : '—'}
          {value !== null && <Text style={styles.unit}>{unit}</Text>}
        </Text>
      </View>
      {trend && trendValue !== undefined && (
        <View style={styles.trendContainer}>
          <Text style={[styles.trend, { color: getTrendColor() }]}>
            {getTrendIcon()} {trendValue}%
          </Text>
        </View>
      )}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: 100,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#666',
  },
  trendContainer: {
    marginTop: 4,
  },
  trend: {
    fontSize: 12,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
});
