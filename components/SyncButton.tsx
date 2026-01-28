import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useHrvStore } from '@/stores/hrvStore';
import { useWhoopAuthStore } from '@/stores/whoopAuthStore';

interface SyncButtonProps {
  compact?: boolean;
}

export function SyncButton({ compact = false }: SyncButtonProps) {
  const isWhoopConnected = useWhoopAuthStore((state) => state.isAuthenticated);
  const isSyncing = useHrvStore((state) => state.isSyncing);
  const lastSyncTime = useHrvStore((state) => state.lastSyncTime);
  const syncError = useHrvStore((state) => state.syncError);
  const syncWhoopData = useHrvStore((state) => state.syncWhoopData);

  const handleSync = async () => {
    try {
      const importedCount = await syncWhoopData(30);
      Alert.alert(
        'Sync Complete',
        `${importedCount} new HRV reading${importedCount !== 1 ? 's' : ''} imported from WHOOP`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to sync';
      Alert.alert('Sync Failed', errorMessage);
    }
  };

  const getLastSyncText = () => {
    if (!lastSyncTime) return 'Never synced';

    const now = Date.now();
    const diff = now - lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!isWhoopConnected) {
    return null;
  }

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactButton}
        onPress={handleSync}
        disabled={isSyncing}
      >
        {isSyncing ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Text style={styles.compactButtonText}>↻ Sync</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isSyncing && styles.buttonDisabled]}
        onPress={handleSync}
        disabled={isSyncing}
      >
        {isSyncing ? (
          <>
            <ActivityIndicator color="#fff" />
            <Text style={styles.buttonText}>Syncing...</Text>
          </>
        ) : (
          <Text style={styles.buttonText}>↻ Sync WHOOP Data</Text>
        )}
      </TouchableOpacity>

      <View style={styles.statusContainer}>
        {syncError ? (
          <Text style={styles.errorText}>⚠ {syncError}</Text>
        ) : (
          <Text style={styles.statusText}>Last sync: {getLastSyncText()}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    fontSize: 12,
    color: '#e74c3c',
  },
  compactButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  compactButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
