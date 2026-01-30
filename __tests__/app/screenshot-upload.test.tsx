import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ScreenshotUploadScreen from '@/app/screenshot-upload';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Alert, Platform } from 'react-native';

jest.mock('expo-image-picker');
jest.mock('expo-router');

// Create a spy on Alert.alert
const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock Platform to allow testing platform-specific code
const mockPlatform = (os: string) => {
  Object.defineProperty(Platform, 'OS', {
    get: jest.fn(() => os),
    configurable: true,
  });
};

// Mock the screenshot store
jest.mock('@/stores/screenshotStore', () => ({
  useScreenshotStore: jest.fn(() => ({
    addScreenshot: jest.fn(),
  })),
}));

// Mock global fetch
global.fetch = jest.fn();

// Mock FileReader with proper implementation
class MockFileReader {
  result: string | null = null;
  onloadend: (() => void) | null = null;
  onerror: ((error: any) => void) | null = null;

  readAsDataURL() {
    this.result = 'data:image/jpeg;base64,mockBase64Data';
    setTimeout(() => {
      if (this.onloadend) {
        this.onloadend();
      }
    }, 0);
  }
}

global.FileReader = MockFileReader as any;

// Mock Blob
global.Blob = class MockBlob {
  constructor(parts?: any[], options?: any) {}
} as any;

describe('ScreenshotUploadScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
    console.log = jest.fn();

    // Default permission mocks
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Screen mounting and navigation', () => {
    it('should render the screen correctly', () => {
      const { getByText } = render(<ScreenshotUploadScreen />);

      expect(getByText('Upload WHOOP Screenshots')).toBeTruthy();
      expect(getByText('Upload both your Recovery and Sleep screenshots for complete data extraction')).toBeTruthy();
      expect(getByText('🔴 Recovery Screenshot')).toBeTruthy();
      expect(getByText('😴 Sleep Screenshot')).toBeTruthy();
    });

    it('should log mount event', () => {
      render(<ScreenshotUploadScreen />);

      expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Screen mounted successfully');
    });

    it('should log unmount event', () => {
      const { unmount } = render(<ScreenshotUploadScreen />);

      unmount();

      expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Screen unmounted');
    });
  });

  describe('Image picker functionality', () => {
    it('should pick recovery image from gallery successfully', async () => {
      const mockResult = {
        canceled: false,
        assets: [
          {
            uri: 'file:///mock-recovery.jpg',
            width: 1920,
            height: 1080,
          },
        ],
      };

      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue(mockResult);

      const { getAllByText } = render(<ScreenshotUploadScreen />);
      const galleryButtons = getAllByText('Choose from Gallery');

      // First button is for recovery screenshot
      fireEvent.press(galleryButtons[0]);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Pick recovery from gallery button pressed');
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Launching image library');
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Image library result:', 'selected');
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Image URI set:', 'file:///mock-recovery.jpg');
      });
    });

    it('should pick sleep image from gallery successfully', async () => {
      const mockResult = {
        canceled: false,
        assets: [
          {
            uri: 'file:///mock-sleep.jpg',
            width: 1920,
            height: 1080,
          },
        ],
      };

      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue(mockResult);

      const { getAllByText } = render(<ScreenshotUploadScreen />);
      const galleryButtons = getAllByText('Choose from Gallery');

      // Second button is for sleep screenshot
      fireEvent.press(galleryButtons[1]);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Pick sleep from gallery button pressed');
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Launching image library');
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Image library result:', 'selected');
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Image URI set:', 'file:///mock-sleep.jpg');
      });
    });

    it('should handle gallery selection cancellation', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      const { getAllByText } = render(<ScreenshotUploadScreen />);
      const galleryButtons = getAllByText('Choose from Gallery');

      fireEvent.press(galleryButtons[0]);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Image library result:', 'canceled');
      });
    });

    it('should take recovery photo successfully', async () => {
      const mockResult = {
        canceled: false,
        assets: [
          {
            uri: 'file:///mock-recovery-photo.jpg',
            width: 1920,
            height: 1080,
          },
        ],
      };

      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue(mockResult);

      const { getAllByText } = render(<ScreenshotUploadScreen />);
      const photoButtons = getAllByText('Take Photo');

      // First button is for recovery screenshot
      fireEvent.press(photoButtons[0]);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Take recovery photo button pressed');
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Launching camera');
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Camera result:', 'photo taken');
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Photo URI set:', 'file:///mock-recovery-photo.jpg');
      });
    });

    it('should take sleep photo successfully', async () => {
      const mockResult = {
        canceled: false,
        assets: [
          {
            uri: 'file:///mock-sleep-photo.jpg',
            width: 1920,
            height: 1080,
          },
        ],
      };

      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue(mockResult);

      const { getAllByText } = render(<ScreenshotUploadScreen />);
      const photoButtons = getAllByText('Take Photo');

      // Second button is for sleep screenshot
      fireEvent.press(photoButtons[1]);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Take sleep photo button pressed');
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Launching camera');
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Camera result:', 'photo taken');
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Photo URI set:', 'file:///mock-sleep-photo.jpg');
      });
    });

    it('should handle camera cancellation', async () => {
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      const { getAllByText } = render(<ScreenshotUploadScreen />);
      const photoButtons = getAllByText('Take Photo');

      fireEvent.press(photoButtons[0]);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Camera result:', 'canceled');
      });
    });

    it('should handle permission requests when taking photo', async () => {
      const { getAllByText } = render(<ScreenshotUploadScreen />);
      const photoButtons = getAllByText('Take Photo');

      fireEvent.press(photoButtons[0]);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Take recovery photo button pressed');
      });

      // Verify permission request functions were called
      expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
    });

    it('should handle permission requests when selecting from gallery', async () => {
      const { getAllByText } = render(<ScreenshotUploadScreen />);
      const galleryButtons = getAllByText('Choose from Gallery');

      fireEvent.press(galleryButtons[0]);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Pick recovery from gallery button pressed');
      });

      // Verify permission request functions were called
      expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
    });
  });

  describe('Image preview and management', () => {
    it('should display image preview after recovery selection', async () => {
      const mockResult = {
        canceled: false,
        assets: [
          {
            uri: 'file:///mock-recovery.jpg',
          },
        ],
      };

      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue(mockResult);

      const { getAllByText, getByText } = render(<ScreenshotUploadScreen />);
      const galleryButtons = getAllByText('Choose from Gallery');

      fireEvent.press(galleryButtons[0]);

      await waitFor(() => {
        expect(getByText('Remove')).toBeTruthy();
      });
    });

    it('should allow removing recovery image after selection', async () => {
      const mockResult = {
        canceled: false,
        assets: [
          {
            uri: 'file:///mock-recovery.jpg',
          },
        ],
      };

      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue(mockResult);

      const { getAllByText, getByText } = render(<ScreenshotUploadScreen />);
      const galleryButtons = getAllByText('Choose from Gallery');

      fireEvent.press(galleryButtons[0]);

      await waitFor(() => {
        expect(getByText('Remove')).toBeTruthy();
      });

      fireEvent.press(getByText('Remove'));

      await waitFor(() => {
        expect(getAllByText('Take Photo').length).toBe(2);
        expect(getAllByText('Choose from Gallery').length).toBe(2);
      });
    });

    it('should handle both recovery and sleep screenshots simultaneously', async () => {
      const recoveryResult = {
        canceled: false,
        assets: [{ uri: 'file:///mock-recovery.jpg' }],
      };

      const sleepResult = {
        canceled: false,
        assets: [{ uri: 'file:///mock-sleep.jpg' }],
      };

      (ImagePicker.launchImageLibraryAsync as jest.Mock)
        .mockResolvedValueOnce(recoveryResult)
        .mockResolvedValueOnce(sleepResult);

      const { getAllByText } = render(<ScreenshotUploadScreen />);
      const galleryButtons = getAllByText('Choose from Gallery');

      // Select recovery screenshot
      fireEvent.press(galleryButtons[0]);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Image URI set:', 'file:///mock-recovery.jpg');
      });

      // Select sleep screenshot
      fireEvent.press(galleryButtons[1]);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('[ScreenshotUpload] Image URI set:', 'file:///mock-sleep.jpg');
      });
    });
  });

  describe('Form inputs', () => {
    it('should update date input', () => {
      const { getByPlaceholderText } = render(<ScreenshotUploadScreen />);

      const dateInput = getByPlaceholderText('YYYY-MM-DD');
      fireEvent.changeText(dateInput, '2024-01-15');

      expect(dateInput.props.value).toBe('2024-01-15');
    });

    it('should update user context input', () => {
      const { getByPlaceholderText } = render(<ScreenshotUploadScreen />);

      const contextInput = getByPlaceholderText('E.g., Slept poorly, lots of meetings today');
      fireEvent.changeText(contextInput, 'Great sleep, feeling energized');

      expect(contextInput.props.value).toBe('Great sleep, feeling energized');
    });

    it('should have default date as today', () => {
      const { getByPlaceholderText } = render(<ScreenshotUploadScreen />);

      const dateInput = getByPlaceholderText('YYYY-MM-DD');
      const today = new Date().toISOString().split('T')[0];

      expect(dateInput.props.value).toBe(today);
    });
  });

  describe('Analyze button', () => {
    it('should render analyze button', () => {
      const { getByText } = render(<ScreenshotUploadScreen />);

      expect(getByText('Analyze Screenshot')).toBeTruthy();
    });

    it('should show plural text when multiple screenshots are selected', async () => {
      const recoveryResult = {
        canceled: false,
        assets: [{ uri: 'file:///mock-recovery.jpg' }],
      };

      const sleepResult = {
        canceled: false,
        assets: [{ uri: 'file:///mock-sleep.jpg' }],
      };

      (ImagePicker.launchImageLibraryAsync as jest.Mock)
        .mockResolvedValueOnce(recoveryResult)
        .mockResolvedValueOnce(sleepResult);

      const { getAllByText, getByText } = render(<ScreenshotUploadScreen />);
      const galleryButtons = getAllByText('Choose from Gallery');

      // Select recovery
      fireEvent.press(galleryButtons[0]);
      await waitFor(() => {
        expect(getByText('Analyze Screenshot')).toBeTruthy();
      });

      // Select sleep
      fireEvent.press(galleryButtons[1]);
      await waitFor(() => {
        expect(getByText('Analyze Screenshots')).toBeTruthy();
      });
    });

    it('should trigger analyze when button is pressed with images', async () => {
      const mockApiResponse = {
        extractedData: {
          hrv: 65,
          recoveryScore: 82,
          sleepHours: 7.5,
          sleepQuality: 85,
        },
        confidence: 0.95,
        notes: 'Test',
      };

      const mockBlob = {};
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          blob: async () => mockBlob,
        })
        .mockResolvedValueOnce({
          blob: async () => mockBlob,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse,
        });

      const recoveryResult = {
        canceled: false,
        assets: [{ uri: 'file:///recovery.jpg' }],
      };

      const sleepResult = {
        canceled: false,
        assets: [{ uri: 'file:///sleep.jpg' }],
      };

      (ImagePicker.launchImageLibraryAsync as jest.Mock)
        .mockResolvedValueOnce(recoveryResult)
        .mockResolvedValueOnce(sleepResult);

      const { getAllByText, getByText } = render(<ScreenshotUploadScreen />);
      const galleryButtons = getAllByText('Choose from Gallery');

      // Select both screenshots
      fireEvent.press(galleryButtons[0]);
      await waitFor(() => {
        expect(getByText('Remove')).toBeTruthy();
      });

      fireEvent.press(galleryButtons[1]);
      await waitFor(() => {
        expect(getAllByText('Remove').length).toBe(2);
      });

      const analyzeButton = getByText('Analyze Screenshots').parent;
      fireEvent.press(analyzeButton!);

      await waitFor(() => {
        expect(router.push).toHaveBeenCalled();
      });
    });
  });

  describe('Screenshot analysis flow', () => {
    beforeEach(() => {
      // Mock successful fetch response with proper blob
      const mockBlob = {};
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
        json: async () => ({
          extractedData: {
            hrv: 65,
            recoveryScore: 82,
            sleepHours: 7.5,
            sleepQuality: 85,
            strain: 12.4,
            restingHR: 48,
          },
          confidence: 0.95,
          notes: 'Successfully extracted all data',
        }),
      });
    });

    it('should navigate to review screen on successful analysis', async () => {
      const recoveryResult = {
        canceled: false,
        assets: [{ uri: 'file:///mock-recovery.jpg' }],
      };

      const sleepResult = {
        canceled: false,
        assets: [{ uri: 'file:///mock-sleep.jpg' }],
      };

      // Mock successful API call
      const mockApiResponse = {
        extractedData: {
          hrv: 65,
          recoveryScore: 82,
          sleepHours: 7.5,
          sleepQuality: 85,
          strain: 12.4,
          restingHR: 48,
        },
        confidence: 0.95,
        notes: 'Successfully extracted all data',
      };

      const mockBlob = {};
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          blob: async () => mockBlob,
        })
        .mockResolvedValueOnce({
          blob: async () => mockBlob,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse,
        });

      (ImagePicker.launchImageLibraryAsync as jest.Mock)
        .mockResolvedValueOnce(recoveryResult)
        .mockResolvedValueOnce(sleepResult);

      const { getAllByText, getByText, getByPlaceholderText } = render(<ScreenshotUploadScreen />);
      const galleryButtons = getAllByText('Choose from Gallery');

      // Select both images
      fireEvent.press(galleryButtons[0]);
      await waitFor(() => {
        expect(getByText('Remove')).toBeTruthy();
      });

      fireEvent.press(galleryButtons[1]);
      await waitFor(() => {
        expect(getAllByText('Remove').length).toBe(2);
      });

      // Update form
      const contextInput = getByPlaceholderText('E.g., Slept poorly, lots of meetings today');
      fireEvent.changeText(contextInput, 'Test context');

      // Trigger analysis
      const analyzeButton = getByText('Analyze Screenshots').parent;
      fireEvent.press(analyzeButton!);

      await waitFor(
        () => {
          expect(router.push).toHaveBeenCalled();
          const callArgs = (router.push as jest.Mock).mock.calls[0][0];
          expect(callArgs.pathname).toBe('/screenshot-review');
          expect(JSON.parse(callArgs.params.imageUris)).toEqual([
            { uri: 'file:///mock-recovery.jpg', type: 'recovery' },
            { uri: 'file:///mock-sleep.jpg', type: 'sleep' }
          ]);
          expect(callArgs.params.userContext).toBe('Test context');
        },
        { timeout: 3000 }
      );
    });

    it('should show analyzing state during analysis', async () => {
      const mockResult = {
        canceled: false,
        assets: [
          {
            uri: 'file:///mock-recovery.jpg',
          },
        ],
      };

      // Make fetch slow
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue(mockResult);

      const { getAllByText, getByText } = render(<ScreenshotUploadScreen />);
      const galleryButtons = getAllByText('Choose from Gallery');

      fireEvent.press(galleryButtons[0]);

      await waitFor(() => {
        expect(getByText('Remove')).toBeTruthy();
      });

      const analyzeButton = getByText('Analyze Screenshot').parent;
      fireEvent.press(analyzeButton!);

      await waitFor(() => {
        expect(getByText('Analyzing...')).toBeTruthy();
      });
    });

    it('should handle API errors gracefully', async () => {
      // Mock console.error to suppress error output in tests
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const mockBlob = {};

      // First fetch for image blob succeeds, second fetch for API fails
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          blob: async () => mockBlob,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

      const mockResult = {
        canceled: false,
        assets: [
          {
            uri: 'file:///mock-recovery.jpg',
          },
        ],
      };

      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue(mockResult);

      const { getAllByText, getByText } = render(<ScreenshotUploadScreen />);
      const galleryButtons = getAllByText('Choose from Gallery');

      fireEvent.press(galleryButtons[0]);

      await waitFor(() => {
        expect(getByText('Remove')).toBeTruthy();
      });

      const analyzeButton = getByText('Analyze Screenshot').parent;
      fireEvent.press(analyzeButton!);

      // Verify the button was pressed and analyzing started
      await waitFor(() => {
        expect(getByText('Analyzing...')).toBeTruthy();
      });

      // Wait for error to be logged
      await waitFor(
        () => {
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error analyzing screenshots:',
            expect.any(Error)
          );
        },
        { timeout: 3000 }
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('UI Information Display', () => {
    it('should display information about data extraction from both screenshots', () => {
      const { getByText } = render(<ScreenshotUploadScreen />);

      expect(getByText("What we'll extract:")).toBeTruthy();

      // Recovery screenshot info
      expect(getByText('From Recovery Screenshot:')).toBeTruthy();
      expect(getByText('• HRV (Heart Rate Variability)')).toBeTruthy();
      expect(getByText('• Recovery Score')).toBeTruthy();
      expect(getByText('• Resting Heart Rate')).toBeTruthy();
      expect(getByText('• Strain Score (if visible)')).toBeTruthy();

      // Sleep screenshot info
      expect(getByText('From Sleep Screenshot:')).toBeTruthy();
      expect(getByText('• Total Sleep Hours')).toBeTruthy();
      expect(getByText('• Sleep Quality %')).toBeTruthy();
      expect(getByText('• Sleep Stages (REM, Deep, Light, Awake)')).toBeTruthy();
      expect(getByText('• Sleep Efficiency')).toBeTruthy();

      expect(getByText("You'll be able to review and edit the data before saving.")).toBeTruthy();
    });
  });
});
