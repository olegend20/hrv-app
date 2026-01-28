import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import { ImportButton } from '@/components/ImportButton';
import { parseWhoopCsv, validateWhoopCsv } from '@/lib/whoop/parser';
import { useHrvStore } from '@/stores/hrvStore';

export default function ImportScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    count: number;
    dateRange: { start: string; end: string };
  } | null>(null);

  const importReadings = useHrvStore((state) => state.importReadings);

  const handleFileSelected = async (content: string, fileName: string) => {
    setIsLoading(true);
    setImportResult(null);

    try {
      // Validate the CSV format
      const validation = validateWhoopCsv(content);
      if (!validation.valid) {
        Alert.alert('Invalid File', validation.error);
        setIsLoading(false);
        return;
      }

      // Parse the CSV
      const result = parseWhoopCsv(content);

      if (result.readings.length === 0) {
        Alert.alert(
          'No Data Found',
          'No valid HRV readings found in the file. Please check the file format.'
        );
        setIsLoading(false);
        return;
      }

      // Import the readings
      const importedCount = importReadings(result.readings);

      // Get date range
      const dates = result.readings.map((r) => r.date);
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];

      setImportResult({
        count: result.readings.length,
        dateRange: { start: startDate, end: endDate },
      });

      if (result.skippedRows > 0) {
        console.log(`Skipped ${result.skippedRows} rows with invalid data`);
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Import Failed', 'An error occurred while importing the file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (error: string) => {
    Alert.alert('Error', error);
  };

  const handleViewDashboard = () => {
    router.replace('/(tabs)');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Import Data',
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {!importResult ? (
          <>
            <Text style={styles.title}>Import from WHOOP</Text>

            <View style={styles.instructions}>
              <Text style={styles.instructionTitle}>How to export your WHOOP data:</Text>
              <Text style={styles.step}>1. Open the WHOOP app</Text>
              <Text style={styles.step}>2. Go to Profile → Settings</Text>
              <Text style={styles.step}>3. Tap "Export Data"</Text>
              <Text style={styles.step}>4. Select "Physiological Cycles" and date range</Text>
              <Text style={styles.step}>5. Tap "Export CSV"</Text>
              <Text style={styles.step}>6. Save to Files or share directly</Text>
            </View>

            <ImportButton
              onFileSelected={handleFileSelected}
              onError={handleError}
              isLoading={isLoading}
            />
          </>
        ) : (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>Import Complete!</Text>
            <Text style={styles.successCount}>
              {importResult.count} days of HRV data imported
            </Text>
            <Text style={styles.dateRange}>
              {formatDate(importResult.dateRange.start)} -{' '}
              {formatDate(importResult.dateRange.end)}
            </Text>

            <View style={styles.buttonContainer}>
              <ImportButton
                onFileSelected={handleFileSelected}
                onError={handleError}
                isLoading={isLoading}
              />
              <Text style={styles.orText}>or</Text>
              <View style={styles.viewDashboardButton}>
                <Text style={styles.viewDashboardText} onPress={handleViewDashboard}>
                  View My Dashboard →
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  instructions: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  step: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    paddingLeft: 8,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    fontSize: 64,
    color: '#27ae60',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successCount: {
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
  },
  dateRange: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  orText: {
    marginVertical: 16,
    color: '#666',
  },
  viewDashboardButton: {
    padding: 16,
  },
  viewDashboardText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
