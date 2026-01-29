import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

interface ImportButtonProps {
  onFileSelected: (content: string, fileName: string) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ImportButton({
  onFileSelected,
  onError,
  isLoading = false,
  disabled = false,
}: ImportButtonProps) {
  const handlePress = async () => {
    try {
      console.log('Import button pressed');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
        copyToCacheDirectory: true,
      });

      console.log('Document picker result:', result);

      if (result.canceled) {
        console.log('User cancelled file picker');
        return;
      }

      const file = result.assets[0];
      if (!file.uri) {
        onError('Could not access file');
        return;
      }

      const content = await FileSystem.readAsStringAsync(file.uri);
      onFileSelected(content, file.name);
    } catch (error) {
      console.error('Error picking document:', error);
      onError('Failed to read file. Please try again.');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.buttonText}>Select CSV File</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
