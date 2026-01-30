import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { syncWhoopData } from '@/lib/whoop/api';
import { useWhoopAuthStore } from '@/stores/whoopAuthStore';

export default function WhoopSyncScreen() {
  const [status, setStatus] = useState<'syncing' | 'success' | 'error'>('syncing');
  const [errorMessage, setErrorMessage] = useState('');
  const [syncedCount, setSyncedCount] = useState(0);
  const accessToken = useWhoopAuthStore((state) => state.accessToken);

  useEffect(() => {
    performSync();
  }, []);

  const performSync = async () => {
    try {
      setStatus('syncing');
      setErrorMessage('');

      if (!accessToken) {
        // User hasn't connected WHOOP yet
        setStatus('error');
        setErrorMessage('Please connect your WHOOP account first');
        return;
      }

      // Sync last 180 days of data
      const readings = await syncWhoopData(accessToken, 180);
      setSyncedCount(readings.length);
      setStatus('success');

      // Auto-navigate to onboarding summary after 2 seconds
      setTimeout(() => {
        router.replace('/onboarding-summary');
      }, 2000);
    } catch (error) {
      console.error('WHOOP sync error:', error);
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to sync WHOOP data'
      );
    }
  };

  const handleSkip = () => {
    router.replace('/onboarding-summary');
  };

  const handleRetry = () => {
    performSync();
  };

  const handleConnectWhoop = () => {
    router.push('/whoop-setup');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>♥</Text>
        <Text style={styles.title}>
          {status === 'syncing' && 'Importing your WHOOP history...'}
          {status === 'success' && 'Successfully synced!'}
          {status === 'error' && 'Sync failed'}
        </Text>

        {status === 'syncing' && (
          <>
            <ActivityIndicator size="large" color="#007AFF" style={styles.spinner} />
            <Text style={styles.message}>
              This may take a moment. We're fetching your last 6 months of data.
            </Text>
          </>
        )}

        {status === 'success' && (
          <>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.message}>
              Imported {syncedCount} days of HRV data. Generating your personalized
              insights...
            </Text>
          </>
        )}

        {status === 'error' && (
          <>
            <Text style={styles.errorIcon}>⚠</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>

            <View style={styles.buttonContainer}>
              {!accessToken ? (
                <>
                  <TouchableOpacity style={styles.button} onPress={handleConnectWhoop}>
                    <Text style={styles.buttonText}>Connect WHOOP</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={handleSkip}
                  >
                    <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                      Skip for now
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={styles.button} onPress={handleRetry}>
                    <Text style={styles.buttonText}>Retry</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={handleSkip}
                  >
                    <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                      Skip for now
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 64,
    color: '#e74c3c',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 32,
  },
  spinner: {
    marginVertical: 24,
  },
  successIcon: {
    fontSize: 64,
    color: '#4CAF50',
    marginVertical: 16,
  },
  errorIcon: {
    fontSize: 64,
    color: '#e74c3c',
    marginVertical: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 32,
    gap: 12,
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
