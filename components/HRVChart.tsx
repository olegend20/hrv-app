import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { HRVReading } from '@/types';
import { calculateRollingAverage } from '@/lib/hrv/statistics';

interface HRVChartProps {
  readings: HRVReading[];
  benchmarkLine?: number;
  goalLine?: number;
  daysToShow?: number;
}

const screenWidth = Dimensions.get('window').width;

export function HRVChart({
  readings,
  benchmarkLine,
  goalLine,
  daysToShow = 30,
}: HRVChartProps) {
  if (readings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No HRV data yet</Text>
        <Text style={styles.emptySubtext}>Import your WHOOP data to see your chart</Text>
      </View>
    );
  }

  // Get the last N days of readings
  const sortedReadings = [...readings].sort((a, b) => a.date.localeCompare(b.date));
  const recentReadings = sortedReadings.slice(-daysToShow);

  // Prepare data for the chart
  const hrvData = recentReadings.map((r, index) => ({
    value: r.hrvMs,
    dataPointText: index === recentReadings.length - 1 ? `${r.hrvMs}` : undefined,
    label: index % 7 === 0 ? formatDateShort(r.date) : '',
  }));

  // Calculate 7-day rolling average
  const rollingAvg = calculateRollingAverage(recentReadings, 7);
  const avgData = rollingAvg.map((r) => ({
    value: r.value,
  }));

  // Calculate Y-axis bounds
  const allValues = recentReadings.map((r) => r.hrvMs);
  const minVal = Math.min(...allValues, benchmarkLine ?? Infinity, goalLine ?? Infinity);
  const maxVal = Math.max(...allValues, benchmarkLine ?? 0, goalLine ?? 0);
  const yMin = Math.max(0, Math.floor(minVal / 10) * 10 - 10);
  const yMax = Math.ceil(maxVal / 10) * 10 + 10;

  return (
    <View style={styles.container}>
      <LineChart
        data={hrvData}
        data2={avgData.length > 0 ? avgData : undefined}
        width={screenWidth - 80}
        height={180}
        spacing={(screenWidth - 100) / Math.min(recentReadings.length, 30)}
        initialSpacing={10}
        endSpacing={10}
        thickness={2}
        thickness2={3}
        color="#007AFF"
        color2="#007AFF"
        dataPointsColor="#007AFF"
        dataPointsRadius={3}
        hideDataPoints2
        curved
        yAxisTextStyle={styles.axisText}
        xAxisLabelTextStyle={styles.axisText}
        yAxisOffset={yMin}
        maxValue={yMax - yMin}
        noOfSections={4}
        rulesColor="#eee"
        rulesType="solid"
        showReferenceLine1={!!benchmarkLine}
        referenceLine1Position={benchmarkLine ? benchmarkLine - yMin : 0}
        referenceLine1Config={{
          color: '#aaa',
          dashWidth: 5,
          dashGap: 5,
          thickness: 1,
        }}
        showReferenceLine2={!!goalLine}
        referenceLine2Position={goalLine ? goalLine - yMin : 0}
        referenceLine2Config={{
          color: '#27ae60',
          dashWidth: 3,
          dashGap: 3,
          thickness: 1,
        }}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#007AFF' }]} />
          <Text style={styles.legendText}>HRV / 7-day avg</Text>
        </View>
        {benchmarkLine && (
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: '#aaa' }]} />
            <Text style={styles.legendText}>50th percentile</Text>
          </View>
        )}
        {goalLine && (
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: '#27ae60' }]} />
            <Text style={styles.legendText}>Goal</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  axisText: {
    fontSize: 10,
    color: '#666',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendLine: {
    width: 16,
    height: 2,
    marginRight: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
});
