import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

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
        multiple: true, // Allow multiple file selection
      });

      console.log('Document picker result:', result);

      if (result.canceled) {
        console.log('User cancelled file picker');
        return;
      }

      // Process all selected files
      for (const file of result.assets) {
        if (!file.uri) {
          console.warn('Skipping file without URI:', file.name);
          continue;
        }

        try {
          // Read file with explicit encoding
          const content = await FileSystem.readAsStringAsync(file.uri, {
            encoding: 'utf8',
          });
          onFileSelected(content, file.name);
        } catch (fileError) {
          console.error('Error reading file:', file.name, fileError);
          // Continue with other files even if one fails
        }
      }

      if (result.assets.length > 1) {
        console.log(`Processed ${result.assets.length} files`);
      }
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
        <Text style={styles.buttonText}>Select CSV File(s)</Text>
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
