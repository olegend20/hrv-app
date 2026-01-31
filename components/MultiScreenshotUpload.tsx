import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ScreenshotData } from '@/types';

interface SelectedImage {
  uri: string;
  type: 'recovery' | 'sleep';
}

interface MultiScreenshotUploadProps {
  onComplete: (screenshots: { recovery: ScreenshotData | null; sleep: ScreenshotData | null }) => void;
  onBack?: () => void;
}

export function MultiScreenshotUpload({ onComplete, onBack }: MultiScreenshotUploadProps) {
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const pickImageFromGallery = async (type: 'recovery' | 'sleep') => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need photo library permission to select screenshots.'
        );
        return;
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setImages((prev) => {
          const filtered = prev.filter((img) => img.type !== type);
          return [...filtered, { uri: result.assets[0].uri, type }];
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const takePhoto = async (type: 'recovery' | 'sleep') => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need camera permission to take photos.');
        return;
      }
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setImages((prev) => {
          const filtered = prev.filter((img) => img.type !== type);
          return [...filtered, { uri: result.assets[0].uri, type }];
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const analyzeScreenshots = async () => {
    if (images.length === 0) {
      Alert.alert('Required', 'Please upload at least one screenshot');
      return;
    }

    setAnalyzing(true);

    try {
      // Convert images to base64
      const imageData = await Promise.all(
        images.map(async (img) => {
          const response = await fetch(img.uri);
          const blob = await response.blob();

          const reader = new FileReader();
          reader.readAsDataURL(blob);

          await new Promise((resolve, reject) => {
            reader.onloadend = resolve;
            reader.onerror = reject;
          });

          const base64Image = (reader.result as string).split(',')[1];

          return {
            type: img.type,
            imageBase64: `data:image/jpeg;base64,${base64Image}`,
          };
        })
      );

      // Call screenshot analysis API - try new format first
      let apiResponse = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/ai/screenshot-analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images: imageData,
            date: new Date().toISOString().split('T')[0],
          }),
        }
      );

      // If API returns error about missing imageBase64, use old format (single image)
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => null);
        if (errorData?.error?.includes('imageBase64')) {
          console.log('[MultiScreenshotUpload] Falling back to old API format (single image)');
          // Use first image only for old API
          apiResponse = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/ai/screenshot-analysis`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                imageBase64: imageData[0].imageBase64,
                date: new Date().toISOString().split('T')[0],
              }),
            }
          );
        }
      }

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to analyze screenshots');
      }

      const data = await apiResponse.json();

      // Create ScreenshotData objects
      const recoveryImg = images.find((img) => img.type === 'recovery');
      const sleepImg = images.find((img) => img.type === 'sleep');

      const screenshots: { recovery: ScreenshotData | null; sleep: ScreenshotData | null } = {
        recovery: recoveryImg
          ? {
              id: `screenshot-${Date.now()}-recovery`,
              date: new Date().toISOString(),
              type: 'recovery',
              uploadedAt: new Date(),
              imageUri: recoveryImg.uri,
              extractedData: data.extractedData || {},
              rawAIResponse: JSON.stringify(data),
            }
          : null,
        sleep: sleepImg
          ? {
              id: `screenshot-${Date.now()}-sleep`,
              date: new Date().toISOString(),
              type: 'sleep',
              uploadedAt: new Date(),
              imageUri: sleepImg.uri,
              extractedData: data.extractedData || {},
              rawAIResponse: JSON.stringify(data),
            }
          : null,
      };

      onComplete(screenshots);
    } catch (error) {
      console.error('Error analyzing screenshots:', error);
      Alert.alert(
        'Analysis Failed',
        error instanceof Error ? error.message : 'Failed to analyze screenshots'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const recoveryImage = images.find((img) => img.type === 'recovery');
  const sleepImage = images.find((img) => img.type === 'sleep');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Screenshots</Text>
        <Text style={styles.subtitle}>
          Upload your WHOOP Recovery and Sleep screenshots
        </Text>
      </View>

      {/* Recovery Screenshot */}
      <View style={styles.screenshotSection}>
        <Text style={styles.sectionTitle}>Recovery Screenshot</Text>
        <Text style={styles.sectionSubtitle}>HRV, Recovery Score, Resting HR</Text>

        {recoveryImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: recoveryImage.uri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => setImages((prev) => prev.filter((img) => img.type !== 'recovery'))}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadOptions}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => takePhoto('recovery')}
            >
              <Text style={styles.uploadIcon}>📷</Text>
              <Text style={styles.uploadButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickImageFromGallery('recovery')}
            >
              <Text style={styles.uploadIcon}>🖼️</Text>
              <Text style={styles.uploadButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Sleep Screenshot */}
      <View style={styles.screenshotSection}>
        <Text style={styles.sectionTitle}>Sleep Screenshot (Optional)</Text>
        <Text style={styles.sectionSubtitle}>Sleep Hours, Sleep Quality</Text>

        {sleepImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: sleepImage.uri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => setImages((prev) => prev.filter((img) => img.type !== 'sleep'))}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadOptions}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => takePhoto('sleep')}
            >
              <Text style={styles.uploadIcon}>📷</Text>
              <Text style={styles.uploadButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickImageFromGallery('sleep')}
            >
              <Text style={styles.uploadIcon}>🖼️</Text>
              <Text style={styles.uploadButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.continueButton,
            (images.length === 0 || analyzing) && styles.buttonDisabled,
          ]}
          onPress={analyzeScreenshots}
          disabled={images.length === 0 || analyzing}
        >
          {analyzing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.continueButtonText}>Analyze & Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  screenshotSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  imageContainer: {
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'contain',
    backgroundColor: '#f0f0f0',
  },
  removeButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingVertical: 24,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  uploadButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  footer: {
    marginTop: 'auto',
    gap: 12,
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
  continueButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
});
