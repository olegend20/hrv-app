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
    console.log(`[MultiScreenshotUpload] Picking ${type} image from gallery`);

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
      console.log(`[MultiScreenshotUpload] Launching image picker for ${type}`);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8, // Reduced quality to prevent memory issues
        base64: false,
      });

      console.log(`[MultiScreenshotUpload] Image picker result for ${type}:`, {
        canceled: result.canceled,
        hasAssets: !!result.assets?.[0],
      });

      if (!result.canceled && result.assets[0]) {
        console.log(`[MultiScreenshotUpload] Adding ${type} image to state`);
        setImages((prev) => {
          const filtered = prev.filter((img) => img.type !== type);
          const newImages = [...filtered, { uri: result.assets[0].uri, type }];
          console.log(`[MultiScreenshotUpload] Total images after adding ${type}:`, newImages.length);
          return newImages;
        });
      }
    } catch (error) {
      console.error(`[MultiScreenshotUpload] Error picking ${type} image:`, error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const takePhoto = async (type: 'recovery' | 'sleep') => {
    console.log(`[MultiScreenshotUpload] Taking ${type} photo with camera`);

    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need camera permission to take photos.');
        return;
      }
    }

    try {
      console.log(`[MultiScreenshotUpload] Launching camera for ${type}`);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8, // Reduced quality to prevent memory issues
        base64: false,
      });

      console.log(`[MultiScreenshotUpload] Camera result for ${type}:`, {
        canceled: result.canceled,
        hasAssets: !!result.assets?.[0],
      });

      if (!result.canceled && result.assets[0]) {
        console.log(`[MultiScreenshotUpload] Adding ${type} photo to state`);
        setImages((prev) => {
          const filtered = prev.filter((img) => img.type !== type);
          const newImages = [...filtered, { uri: result.assets[0].uri, type }];
          console.log(`[MultiScreenshotUpload] Total images after adding ${type}:`, newImages.length);
          return newImages;
        });
      }
    } catch (error) {
      console.error(`[MultiScreenshotUpload] Error taking ${type} photo:`, error);
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
      console.log('[MultiScreenshotUpload] Starting analysis of', images.length, 'screenshots');

      // Convert images to base64 with timeout and better error handling
      const imageData = await Promise.all(
        images.map(async (img, index) => {
          console.log(`[MultiScreenshotUpload] Converting image ${index + 1} (${img.type}) to base64`);

          try {
            // Add timeout to fetch
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const response = await fetch(img.uri, { signal: controller.signal });
            clearTimeout(timeoutId);

            const blob = await response.blob();
            console.log(`[MultiScreenshotUpload] Image ${index + 1} blob size:`, blob.size);

            const reader = new FileReader();
            reader.readAsDataURL(blob);

            await new Promise((resolve, reject) => {
              const timeoutId = setTimeout(() => {
                reject(new Error('FileReader timeout after 30 seconds'));
              }, 30000);

              reader.onloadend = () => {
                clearTimeout(timeoutId);
                resolve(undefined);
              };
              reader.onerror = () => {
                clearTimeout(timeoutId);
                reject(reader.error);
              };
            });

            const base64Image = (reader.result as string).split(',')[1];
            console.log(`[MultiScreenshotUpload] Image ${index + 1} converted successfully`);

            return {
              type: img.type,
              imageBase64: `data:image/jpeg;base64,${base64Image}`,
            };
          } catch (error) {
            console.error(`[MultiScreenshotUpload] Error converting image ${index + 1}:`, error);
            throw new Error(`Failed to convert ${img.type} screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        })
      );

      console.log('[MultiScreenshotUpload] All images converted successfully');

      // Call screenshot analysis API - try new format first with timeout
      console.log('[MultiScreenshotUpload] Calling screenshot-analysis API');

      const controller = new AbortController();
      const apiTimeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

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
          signal: controller.signal,
        }
      ).catch((error) => {
        clearTimeout(apiTimeoutId);
        if (error.name === 'AbortError') {
          throw new Error('API request timed out after 60 seconds. Please try again.');
        }
        throw error;
      });

      clearTimeout(apiTimeoutId);
      console.log('[MultiScreenshotUpload] API response status:', apiResponse.status);

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
