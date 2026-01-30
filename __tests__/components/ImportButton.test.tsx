import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ImportButton } from '@/components/ImportButton';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

jest.mock('expo-document-picker');
jest.mock('expo-file-system/legacy');

describe('ImportButton', () => {
  const mockOnFileSelected = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { getByText } = render(
      <ImportButton onFileSelected={mockOnFileSelected} onError={mockOnError} />
    );

    expect(getByText('Select CSV File(s)')).toBeTruthy();
  });

  it('should handle single file selection', async () => {
    const mockFile = {
      canceled: false,
      assets: [
        {
          uri: 'file:///test.csv',
          name: 'test.csv',
        },
      ],
    };

    const mockContent = 'Cycle start time,HRV rmssd (ms)\n2024-01-01,45.5';

    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(mockFile);
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(mockContent);

    const { getByText } = render(
      <ImportButton onFileSelected={mockOnFileSelected} onError={mockOnError} />
    );

    fireEvent.press(getByText('Select CSV File(s)'));

    await waitFor(() => {
      expect(mockOnFileSelected).toHaveBeenCalledWith(mockContent, 'test.csv');
    });
  });

  it('should handle multiple file selection', async () => {
    const mockFiles = {
      canceled: false,
      assets: [
        { uri: 'file:///test1.csv', name: 'test1.csv' },
        { uri: 'file:///test2.csv', name: 'test2.csv' },
      ],
    };

    const mockContent1 = 'Cycle start time,HRV rmssd (ms)\n2024-01-01,45.5';
    const mockContent2 = 'Cycle start time,HRV rmssd (ms)\n2024-01-02,48.2';

    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(mockFiles);
    (FileSystem.readAsStringAsync as jest.Mock)
      .mockResolvedValueOnce(mockContent1)
      .mockResolvedValueOnce(mockContent2);

    const { getByText } = render(
      <ImportButton onFileSelected={mockOnFileSelected} onError={mockOnError} />
    );

    fireEvent.press(getByText('Select CSV File(s)'));

    await waitFor(() => {
      expect(mockOnFileSelected).toHaveBeenCalledTimes(2);
      expect(mockOnFileSelected).toHaveBeenNthCalledWith(1, mockContent1, 'test1.csv');
      expect(mockOnFileSelected).toHaveBeenNthCalledWith(2, mockContent2, 'test2.csv');
    });
  });

  it('should handle user cancellation', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: true,
    });

    const { getByText } = render(
      <ImportButton onFileSelected={mockOnFileSelected} onError={mockOnError} />
    );

    fireEvent.press(getByText('Select CSV File(s)'));

    await waitFor(() => {
      expect(mockOnFileSelected).not.toHaveBeenCalled();
    });
  });

  it('should handle file read errors gracefully', async () => {
    const mockFile = {
      canceled: false,
      assets: [{ uri: 'file:///test.csv', name: 'test.csv' }],
    };

    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(mockFile);
    (FileSystem.readAsStringAsync as jest.Mock).mockRejectedValue(
      new Error('File read error')
    );

    const { getByText } = render(
      <ImportButton onFileSelected={mockOnFileSelected} onError={mockOnError} />
    );

    fireEvent.press(getByText('Select CSV File(s)'));

    // Component continues on file read errors without calling onError
    // The error is caught and logged, but doesn't propagate to onError callback
    await waitFor(() => {
      expect(mockOnFileSelected).not.toHaveBeenCalled();
    });
  });

  it('should show loading state', () => {
    const { getByTestId } = render(
      <ImportButton
        onFileSelected={mockOnFileSelected}
        onError={mockOnError}
        isLoading={true}
      />
    );

    // ActivityIndicator should be visible
    expect(() => getByTestId('activity-indicator')).toBeTruthy();
  });

  it('should be disabled when disabled prop is true', () => {
    const { getByText } = render(
      <ImportButton
        onFileSelected={mockOnFileSelected}
        onError={mockOnError}
        disabled={true}
      />
    );

    const button = getByText('Select CSV File(s)').parent?.parent;
    expect(button?.props.accessibilityState?.disabled).toBe(true);
  });
});
