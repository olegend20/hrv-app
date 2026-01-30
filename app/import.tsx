import React, { useState, useRef } from 'react';
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
    filesProcessed: number;
  } | null>(null);
  const [accumulatedReadings, setAccumulatedReadings] = useState<any[]>([]);
  const [filesProcessedCount, setFilesProcessedCount] = useState(0);
  const finalizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasFinalized = useRef(false);

  const importReadings = useHrvStore((state) => state.importReadings);

  const handleFileSelected = async (content: string, fileName: string) => {
    if (!isLoading) {
      setIsLoading(true);
      setImportResult(null);
      setAccumulatedReadings([]);
      setFilesProcessedCount(0);
      hasFinalized.current = false;
    }

    try {
      console.log(`Processing file: ${fileName}`);

      // Validate the CSV format
      const validation = validateWhoopCsv(content);
      if (!validation.valid) {
        console.warn(`Skipping invalid file ${fileName}:`, validation.error);
        return; // Skip this file but continue with others
      }

      // Parse the CSV
      const result = parseWhoopCsv(content);

      if (result.readings.length === 0) {
        console.warn(`No valid HRV readings found in ${fileName}`);
        return; // Skip this file but continue with others
      }

      // Accumulate readings from this file
      setAccumulatedReadings(prev => [...prev, ...result.readings]);
      setFilesProcessedCount(prev => prev + 1);

      console.log(`Successfully processed ${fileName}: ${result.readings.length} readings`);

      if (result.skippedRows > 0) {
        console.log(`Skipped ${result.skippedRows} rows with invalid data in ${fileName}`);
      }

      // Clear any existing timeout and set a new one
      // This ensures finalization only happens after all files are done
      if (finalizeTimeoutRef.current) {
        clearTimeout(finalizeTimeoutRef.current);
      }
      finalizeTimeoutRef.current = setTimeout(() => {
        finalizeImport();
      }, 1500);
    } catch (error) {
      console.error(`Import error for ${fileName}:`, error);
      // Don't stop the entire import, just log the error
    }
  };

  const finalizeImport = () => {
    // Prevent multiple finalizations
    if (hasFinalized.current) {
      return;
    }
    hasFinalized.current = true;

    // Use functional state update to get the latest values
    setAccumulatedReadings((currentReadings) => {
      setFilesProcessedCount((currentFileCount) => {
        if (currentReadings.length === 0) {
          Alert.alert(
            'No Data Found',
            'No valid HRV readings found in the selected files. Please check the file format.'
          );
          setIsLoading(false);
          return currentFileCount;
        }

        // Import all accumulated readings
        const importedCount = importReadings(currentReadings);

        // Get date range from all readings
        const dates = currentReadings.map((r) => r.date).sort();
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];

        setImportResult({
          count: currentReadings.length,
          dateRange: { start: startDate, end: endDate },
          filesProcessed: currentFileCount,
        });

        setIsLoading(false);
        return currentFileCount;
      });
      return currentReadings;
    });
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
              <Text style={styles.stepNote}>
                💡 You can select multiple CSV files at once!
              </Text>
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
            {importResult.filesProcessed > 1 && (
              <Text style={styles.filesProcessed}>
                from {importResult.filesProcessed} files
              </Text>
            )}
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
  stepNote: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
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
  filesProcessed: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
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
