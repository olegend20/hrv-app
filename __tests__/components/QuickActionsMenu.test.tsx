import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuickActionsMenu } from '@/components/QuickActionsMenu';
import { router } from 'expo-router';

jest.mock('expo-router');

describe('QuickActionsMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render correctly', () => {
      const { getByText } = render(<QuickActionsMenu />);

      expect(getByText('Quick Actions')).toBeTruthy();
    });

    it('should render all quick action buttons', () => {
      const { getByText } = render(<QuickActionsMenu />);

      expect(getByText('Upload Screenshot')).toBeTruthy();
      expect(getByText("Today's Plan")).toBeTruthy();
      expect(getByText('Ask AI Coach')).toBeTruthy();
      expect(getByText('Log Habits')).toBeTruthy();
    });

    it('should render action descriptions', () => {
      const { getByText } = render(<QuickActionsMenu />);

      expect(getByText('Add WHOOP data')).toBeTruthy();
      expect(getByText('View daily guidance')).toBeTruthy();
      expect(getByText('Get personalized advice')).toBeTruthy();
      expect(getByText('Track daily habits')).toBeTruthy();
    });

    it('should render action icons', () => {
      const { getByText } = render(<QuickActionsMenu />);

      expect(getByText('📸')).toBeTruthy();
      expect(getByText('📋')).toBeTruthy();
      expect(getByText('💬')).toBeTruthy();
      expect(getByText('📊')).toBeTruthy();
    });
  });

  describe('Navigation - Upload Screenshot', () => {
    it('should log button press for Upload Screenshot', () => {
      const { getByText } = render(<QuickActionsMenu />);

      fireEvent.press(getByText('Upload Screenshot'));

      expect(console.log).toHaveBeenCalledWith(
        '[QuickActionsMenu] Button pressed:',
        'Upload Screenshot',
        'Route:',
        '/screenshot-upload'
      );
    });

    it('should navigate to screenshot upload screen', () => {
      const { getByText } = render(<QuickActionsMenu />);

      fireEvent.press(getByText('Upload Screenshot'));

      expect(router.push).toHaveBeenCalledWith('/screenshot-upload');
    });

    it('should log navigation trigger for screenshot upload', () => {
      const { getByText } = render(<QuickActionsMenu />);

      fireEvent.press(getByText('Upload Screenshot'));

      expect(console.log).toHaveBeenCalledWith(
        '[QuickActionsMenu] Navigation triggered for:',
        '/screenshot-upload'
      );
    });

    it('should call navigation functions in correct order', () => {
      const { getByText } = render(<QuickActionsMenu />);

      fireEvent.press(getByText('Upload Screenshot'));

      const logCalls = (console.log as jest.Mock).mock.calls;
      expect(logCalls[0][0]).toContain('Button pressed');
      expect(logCalls[1][0]).toContain('Navigation triggered');
    });
  });

  describe('Navigation - Other Actions', () => {
    it('should navigate to daily plan screen', () => {
      const { getByText } = render(<QuickActionsMenu />);

      fireEvent.press(getByText("Today's Plan"));

      expect(console.log).toHaveBeenCalledWith(
        '[QuickActionsMenu] Button pressed:',
        "Today's Plan",
        'Route:',
        '/daily-plan'
      );
      expect(router.push).toHaveBeenCalledWith('/daily-plan');
    });

    it('should navigate to chat screen', () => {
      const { getByText } = render(<QuickActionsMenu />);

      fireEvent.press(getByText('Ask AI Coach'));

      expect(console.log).toHaveBeenCalledWith(
        '[QuickActionsMenu] Button pressed:',
        'Ask AI Coach',
        'Route:',
        '/(tabs)/chat'
      );
      expect(router.push).toHaveBeenCalledWith('/(tabs)/chat');
    });

    it('should navigate to habits screen', () => {
      const { getByText } = render(<QuickActionsMenu />);

      fireEvent.press(getByText('Log Habits'));

      expect(console.log).toHaveBeenCalledWith(
        '[QuickActionsMenu] Button pressed:',
        'Log Habits',
        'Route:',
        '/(tabs)/habits'
      );
      expect(router.push).toHaveBeenCalledWith('/(tabs)/habits');
    });
  });

  describe('Button interaction', () => {
    it('should handle multiple button presses', () => {
      const { getByText } = render(<QuickActionsMenu />);

      fireEvent.press(getByText('Upload Screenshot'));
      fireEvent.press(getByText("Today's Plan"));
      fireEvent.press(getByText('Ask AI Coach'));

      expect(router.push).toHaveBeenCalledTimes(3);
      expect(router.push).toHaveBeenNthCalledWith(1, '/screenshot-upload');
      expect(router.push).toHaveBeenNthCalledWith(2, '/daily-plan');
      expect(router.push).toHaveBeenNthCalledWith(3, '/(tabs)/chat');
    });

    it('should handle rapid consecutive presses', () => {
      const { getByText } = render(<QuickActionsMenu />);

      const uploadButton = getByText('Upload Screenshot');
      fireEvent.press(uploadButton);
      fireEvent.press(uploadButton);
      fireEvent.press(uploadButton);

      expect(router.push).toHaveBeenCalledTimes(3);
      expect(router.push).toHaveBeenCalledWith('/screenshot-upload');
    });
  });

  describe('Accessibility', () => {
    it('should render touchable buttons', () => {
      const { getByText } = render(<QuickActionsMenu />);

      const uploadButton = getByText('Upload Screenshot').parent?.parent;
      expect(uploadButton).toBeTruthy();
      expect(uploadButton?.props.accessible).not.toBe(false);
    });

    it('should have pressable action cards', () => {
      const { getAllByText } = render(<QuickActionsMenu />);

      const quickActions = getAllByText(/Upload Screenshot|Today's Plan|Ask AI Coach|Log Habits/);
      expect(quickActions.length).toBeGreaterThan(0);
    });
  });

  describe('Layout', () => {
    it('should render in a scrollable container', () => {
      const { getByText } = render(<QuickActionsMenu />);

      const title = getByText('Quick Actions');
      expect(title).toBeTruthy();

      // Verify all actions are present (they should be in a ScrollView)
      expect(getByText('Upload Screenshot')).toBeTruthy();
      expect(getByText("Today's Plan")).toBeTruthy();
      expect(getByText('Ask AI Coach')).toBeTruthy();
      expect(getByText('Log Habits')).toBeTruthy();
    });
  });

  describe('Error handling', () => {
    it('should handle navigation errors gracefully', () => {
      (router.push as jest.Mock).mockImplementation(() => {
        throw new Error('Navigation error');
      });

      const { getByText } = render(<QuickActionsMenu />);

      expect(() => {
        fireEvent.press(getByText('Upload Screenshot'));
      }).toThrow('Navigation error');
    });

    it('should still log before navigation error occurs', () => {
      (router.push as jest.Mock).mockImplementation(() => {
        throw new Error('Navigation error');
      });

      const { getByText } = render(<QuickActionsMenu />);

      try {
        fireEvent.press(getByText('Upload Screenshot'));
      } catch (e) {
        // Error expected
      }

      expect(console.log).toHaveBeenCalledWith(
        '[QuickActionsMenu] Button pressed:',
        'Upload Screenshot',
        'Route:',
        '/screenshot-upload'
      );
    });
  });

  describe('Integration', () => {
    it('should render consistent button count', () => {
      const { getAllByText } = render(<QuickActionsMenu />);

      // Get all elements that contain emoji icons (one per action)
      const icons = getAllByText(/📸|📋|💬|📊/);
      expect(icons.length).toBe(4);
    });

    it('should maintain action order', () => {
      const { getAllByText } = render(<QuickActionsMenu />);

      const labels = getAllByText(/Upload Screenshot|Today's Plan|Ask AI Coach|Log Habits/);

      // Verify order by checking text content
      expect(labels[0].props.children).toBe('Upload Screenshot');
      expect(labels[1].props.children).toBe("Today's Plan");
      expect(labels[2].props.children).toBe('Ask AI Coach');
      expect(labels[3].props.children).toBe('Log Habits');
    });
  });
});
