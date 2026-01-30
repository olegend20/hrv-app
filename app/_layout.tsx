import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useUserStore } from '@/stores/userStore';

export {
  ErrorBoundary,
} from 'expo-router';

// Removed initialRouteName - navigation is handled by useEffect below

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  const profile = useUserStore((state) => state.profile);
  const hasHydrated = useUserStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';
    const inImport = segments[0] === 'import';

    // Whitelist screens that should be accessible outside tabs
    const allowedScreens = [
      'screenshot-upload',
      'screenshot-review',
      'daily-plan',
      'morning-ritual',
      'whoop-sync',
      'onboarding-summary',
      'modal',
    ];
    const inAllowedScreen = allowedScreens.includes(segments[0]);

    // If no profile, redirect to onboarding
    if (!profile && !inOnboarding) {
      router.replace('/onboarding');
    }
    // If has profile but in onboarding, go to tabs
    else if (profile && inOnboarding) {
      router.replace('/(tabs)');
    }
    // If has profile and not in allowed location, go to tabs
    else if (profile && !inTabs && !inOnboarding && !inImport && !inAllowedScreen) {
      router.replace('/(tabs)');
    }
  }, [profile, hasHydrated, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
