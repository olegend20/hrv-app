import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useScreenshotStore } from '@/stores/screenshotStore';

interface SelectedImage {
  uri: string;
  type: 'recovery' | 'sleep';
}

export default function ScreenshotUploadScreen() {
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [userContext, setUserContext] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const addScreenshot = useScreenshotStore((state) => state.addScreenshot);

  useEffect(() => {
    console.log('[ScreenshotUpload] Screen mounted successfully');
    return () => {
      console.log('[ScreenshotUpload] Screen unmounted');
    };
  }, []);

  const pickImageFromGallery = async (type: 'recovery' | 'sleep') => {
    console.log(`[ScreenshotUpload] Pick ${type} from gallery button pressed`);

    // Request only media library permission
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need photo library permission to select screenshots.'
        );
        console.log('[ScreenshotUpload] Gallery permission denied');
        return;
      }
    }

    try {
      console.log('[ScreenshotUpload] Launching image library');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Disable editing to prevent freezing
        quality: 1, // Use full quality for screenshot analysis
        base64: false,
      });

      console.log('[ScreenshotUpload] Image library result:', result.canceled ? 'canceled' : 'selected');
      if (!result.canceled && result.assets[0]) {
        console.log('[ScreenshotUpload] Image URI set:', result.assets[0].uri);
        setImages(prev => {
          // Remove existing image of this type if any
          const filtered = prev.filter(img => img.type !== type);
          return [...filtered, { uri: result.assets[0].uri, type }];
        });
      }
    } catch (error) {
      console.error('[ScreenshotUpload] Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const takePhoto = async (type: 'recovery' | 'sleep') => {
    console.log(`[ScreenshotUpload] Take ${type} photo button pressed`);

    // Request only camera permission
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need camera permission to take photos.'
        );
        console.log('[ScreenshotUpload] Camera permission denied');
        return;
      }
    }

    try {
      console.log('[ScreenshotUpload] Launching camera');
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false, // Disable editing to prevent freezing
        quality: 1, // Use full quality for screenshot analysis
        base64: false,
      });

      console.log('[ScreenshotUpload] Camera result:', result.canceled ? 'canceled' : 'photo taken');
      if (!result.canceled && result.assets[0]) {
        console.log('[ScreenshotUpload] Photo URI set:', result.assets[0].uri);
        setImages(prev => {
          // Remove existing image of this type if any
          const filtered = prev.filter(img => img.type !== type);
          return [...filtered, { uri: result.assets[0].uri, type }];
        });
      }
    } catch (error) {
      console.error('[ScreenshotUpload] Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const analyzeScreenshot = async () => {
    if (images.length === 0) {
      Alert.alert('Error', 'Please select at least one screenshot');
      return;
    }

    setAnalyzing(true);

    try {
      // Convert all images to base64
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

      // Call screenshot analysis API with all images
      console.log('[ScreenshotUpload] Calling API with', imageData.length, 'images');
      console.log('[ScreenshotUpload] API URL:', `${process.env.EXPO_PUBLIC_API_URL}/api/ai/screenshot-analysis`);

      // Try new API format first (multiple images)
      let apiResponse = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/ai/screenshot-analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images: imageData,
            date,
            userContext,
          }),
        }
      );

      console.log('[ScreenshotUpload] API Response status:', apiResponse.status);

      // If API returns error about missing imageBase64, use old format (single image)
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => null);
        if (errorData?.error?.includes('imageBase64')) {
          console.log('[ScreenshotUpload] Falling back to old API format (single image)');
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
                date,
                userContext,
              }),
            }
          );
          console.log('[ScreenshotUpload] Fallback API Response status:', apiResponse.status);
        }
      }

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => null);
        console.error('API Error Response:', errorData);
        throw new Error(
          errorData?.message || errorData?.error || 'Failed to analyze screenshots'
        );
      }

      const data = await apiResponse.json();

      // Navigate to review screen with the results
      router.push({
        pathname: '/screenshot-review',
        params: {
          imageUris: JSON.stringify(images.map(img => ({ uri: img.uri, type: img.type }))),
          date,
          userContext,
          extractedData: JSON.stringify(data.extractedData),
          confidence: data.confidence,
          notes: data.notes,
          rawAIResponse: JSON.stringify(data),
        },
      });
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Upload WHOOP Screenshots</Text>
          <Text style={styles.subtitle}>
            Upload both your Recovery and Sleep screenshots for complete data extraction
          </Text>
        </View>

        {/* Recovery Screenshot Section */}
        <View style={styles.screenshotSection}>
          <Text style={styles.sectionTitle}>🔴 Recovery Screenshot</Text>
          <Text style={styles.sectionSubtitle}>HRV, Recovery Score, Resting HR, Strain</Text>

          {images.find(img => img.type === 'recovery') ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: images.find(img => img.type === 'recovery')!.uri }}
                style={styles.previewImage}
              />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={() => setImages(prev => prev.filter(img => img.type !== 'recovery'))}
              >
                <Text style={styles.changeImageText}>Remove</Text>
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
                <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sleep Screenshot Section */}
        <View style={styles.screenshotSection}>
          <Text style={styles.sectionTitle}>😴 Sleep Screenshot</Text>
          <Text style={styles.sectionSubtitle}>Sleep Hours, Sleep Quality, Sleep Stages</Text>

          {images.find(img => img.type === 'sleep') ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: images.find(img => img.type === 'sleep')!.uri }}
                style={styles.previewImage}
              />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={() => setImages(prev => prev.filter(img => img.type !== 'sleep'))}
              >
                <Text style={styles.changeImageText}>Remove</Text>
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
                <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.label}>How was your day? (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={userContext}
            onChangeText={setUserContext}
            placeholder="E.g., Slept poorly, lots of meetings today"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What we'll extract:</Text>
          <Text style={styles.infoSubtitle}>From Recovery Screenshot:</Text>
          <Text style={styles.infoItem}>• HRV (Heart Rate Variability)</Text>
          <Text style={styles.infoItem}>• Recovery Score</Text>
          <Text style={styles.infoItem}>• Resting Heart Rate</Text>
          <Text style={styles.infoItem}>• Strain Score (if visible)</Text>

          <Text style={[styles.infoSubtitle, { marginTop: 12 }]}>From Sleep Screenshot:</Text>
          <Text style={styles.infoItem}>• Total Sleep Hours</Text>
          <Text style={styles.infoItem}>• Sleep Quality %</Text>
          <Text style={styles.infoItem}>• Sleep Stages (REM, Deep, Light, Awake)</Text>
          <Text style={styles.infoItem}>• Sleep Efficiency</Text>

          <Text style={styles.infoText}>
            You'll be able to review and edit the data before saving.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.analyzeButton, (images.length === 0 || analyzing) && styles.buttonDisabled]}
          onPress={analyzeScreenshot}
          disabled={images.length === 0 || analyzing}
        >
          <Text style={styles.analyzeButtonText}>
            {analyzing ? 'Analyzing...' : `Analyze Screenshot${images.length > 1 ? 's' : ''}`}
          </Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  screenshotSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  imageContainer: {
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    resizeMode: 'contain',
    backgroundColor: '#f0f0f0',
  },
  changeImageButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  changeImageText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoCard: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  infoSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    color: '#555',
  },
  infoItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
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
  },
  analyzeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
});
