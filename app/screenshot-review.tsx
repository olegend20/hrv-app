import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useScreenshotStore } from '@/stores/screenshotStore';
import { useHrvStore } from '@/stores/hrvStore';
import * as FileSystem from 'expo-file-system/legacy';

export default function ScreenshotReviewScreen() {
  const params = useLocalSearchParams();

  const imageUrisStr = params.imageUris as string;
  const imageUris = JSON.parse(imageUrisStr);
  const date = params.date as string;
  const userContext = params.userContext as string;
  const extractedDataStr = params.extractedData as string;
  const confidence = parseFloat(params.confidence as string);
  const notes = params.notes as string;
  const rawAIResponse = params.rawAIResponse as string;

  const extractedData = JSON.parse(extractedDataStr);

  const [hrv, setHrv] = useState(extractedData.hrv?.toString() || '');
  const [recoveryScore, setRecoveryScore] = useState(
    extractedData.recoveryScore?.toString() || ''
  );
  const [sleepHours, setSleepHours] = useState(
    extractedData.sleepHours?.toString() || ''
  );
  const [sleepQuality, setSleepQuality] = useState(
    extractedData.sleepQuality?.toString() || ''
  );
  const [strain, setStrain] = useState(extractedData.strain?.toString() || '');
  const [restingHR, setRestingHR] = useState(extractedData.restingHR?.toString() || '');

  const addScreenshot = useScreenshotStore((state) => state.addScreenshot);
  const importReadings = useHrvStore((state) => state.importReadings);

  const handleConfirm = async () => {
    try {
      // Validate required fields
      if (!hrv) {
        Alert.alert('Error', 'HRV is required');
        return;
      }

      const hrvValue = parseFloat(hrv);
      if (isNaN(hrvValue) || hrvValue <= 0) {
        Alert.alert('Error', 'Please enter a valid HRV value');
        return;
      }

      // Create screenshot records for each uploaded screenshot (without images for privacy)
      imageUris.forEach((img: { uri: string; type: 'recovery' | 'sleep' }) => {
        const screenshotId = `screenshot-${Date.now()}-${img.type}`;
        addScreenshot({
          id: screenshotId,
          date,
          type: img.type,
          uploadedAt: new Date(),
          extractedData: {
            hrv: hrvValue,
            recoveryScore: recoveryScore ? parseFloat(recoveryScore) : undefined,
            sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
            sleepQuality: sleepQuality ? parseFloat(sleepQuality) : undefined,
            strain: strain ? parseFloat(strain) : undefined,
            restingHR: restingHR ? parseFloat(restingHR) : undefined,
          },
          rawAIResponse,
          userContext,
        });
      });

      // Add HRV reading to main HRV store
      importReadings([{
        id: `hrv-${Date.now()}`,
        date,
        hrvMs: hrvValue,
        restingHR: restingHR ? parseFloat(restingHR) : 0,
        recoveryScore: recoveryScore ? parseFloat(recoveryScore) : undefined,
        source: 'manual',
      }]);

      // Delete the image files for privacy
      for (const img of imageUris) {
        if (img.uri && img.uri.startsWith('file://')) {
          try {
            await FileSystem.deleteAsync(img.uri, { idempotent: true });
          } catch (error) {
            console.error('Failed to delete image file:', error);
          }
        }
      }

      // Navigate to habit questions to complete daily logging
      router.push({
        pathname: '/habit-questions',
        params: {
          date,
          hrv: hrvValue.toString(),
          sleepHours: sleepHours || '',
          sleepQuality: sleepQuality || '',
          recoveryScore: recoveryScore || '',
        },
      });
    } catch (error) {
      console.error('Error saving screenshot data:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save data'
      );
    }
  };

  const getConfidenceColor = () => {
    if (confidence >= 0.9) return '#4CAF50';
    if (confidence >= 0.7) return '#FFA726';
    return '#e74c3c';
  };

  const getConfidenceLabel = () => {
    if (confidence >= 0.9) return 'High Confidence';
    if (confidence >= 0.7) return 'Medium Confidence';
    return 'Low Confidence - Please Review';
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Review Extracted Data</Text>
          <View
            style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor() }]}
          >
            <Text style={styles.confidenceText}>{getConfidenceLabel()}</Text>
          </View>
        </View>

        {notes && (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>AI Notes:</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Please review and edit if needed:</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              HRV (ms) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="e.g., 42"
              value={hrv}
              onChangeText={setHrv}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recovery Score (%)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="e.g., 68"
              value={recoveryScore}
              onChangeText={setRecoveryScore}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sleep Hours</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="e.g., 7.5"
              value={sleepHours}
              onChangeText={setSleepHours}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sleep Quality (%)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="e.g., 82"
              value={sleepQuality}
              onChangeText={setSleepQuality}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Strain</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="e.g., 14.3"
              value={strain}
              onChangeText={setStrain}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Resting Heart Rate (bpm)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="e.g., 58"
              value={restingHR}
              onChangeText={setRestingHR}
            />
          </View>
        </View>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyText}>
            🔒 Your screenshot will be deleted after saving for privacy.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonTextSecondary}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !hrv && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={!hrv}
        >
          <Text style={styles.buttonText}>Confirm & Save</Text>
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  confidenceBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  confidenceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  notesCard: {
    backgroundColor: '#fff8e1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#FFA726',
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  notesText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  form: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  required: {
    color: '#e74c3c',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  privacyNote: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  privacyText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
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
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 2,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
});
