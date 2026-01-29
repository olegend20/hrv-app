import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  View,
} from 'react-native';
import { useWhoopAuthStore } from '@/stores/whoopAuthStore';
import { startWhoopAuth } from '@/lib/whoop/auth';

interface WhoopAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function WhoopAuthButton({ onSuccess, onError }: WhoopAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isAuthenticated = useWhoopAuthStore((state) => state.isAuthenticated);
  const setTokens = useWhoopAuthStore((state) => state.setTokens);
  const clearTokens = useWhoopAuthStore((state) => state.clearTokens);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      console.log('Starting WHOOP auth...');
      const tokens = await startWhoopAuth();

      if (tokens) {
        console.log('Tokens received successfully');
        setTokens(tokens.access_token, tokens.refresh_token, tokens.expires_in);
        Alert.alert('Success', 'Connected to WHOOP successfully!');
        onSuccess?.();
      } else {
        console.log('Auth returned null (cancelled)');
        Alert.alert('Cancelled', 'WHOOP authentication was cancelled');
      }
    } catch (error) {
      console.error('WHOOP connection error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to connect to WHOOP';
      console.error('Error message:', errorMessage);
      Alert.alert('Connection Failed', errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect WHOOP',
      'Are you sure you want to disconnect your WHOOP account? You can always reconnect later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            clearTokens();
            Alert.alert('Disconnected', 'Your WHOOP account has been disconnected');
          },
        },
      ]
    );
  };

  if (isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.connectedBadge}>
          <Text style={styles.connectedText}>✓ Connected to WHOOP</Text>
        </View>
        <TouchableOpacity
          style={[styles.button, styles.disconnectButton]}
          onPress={handleDisconnect}
          disabled={isLoading}
        >
          <Text style={styles.disconnectButtonText}>Disconnect</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, styles.connectButton]}
      onPress={handleConnect}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Text style={styles.buttonText}>Connect WHOOP</Text>
          <Text style={styles.buttonSubtext}>
            Auto-sync your HRV data daily
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  connectButton: {
    backgroundColor: '#6A1B9A', // WHOOP purple
  },
  disconnectButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  disconnectButtonText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
  },
  connectedBadge: {
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  connectedText: {
    color: '#155724',
    fontSize: 14,
    fontWeight: '600',
  },
});
