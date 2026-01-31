import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useMorningRitualStore } from '@/stores/morningRitualStore';
import { useAIPlanStore } from '@/stores/aiPlanStore';
import { useHrvStore } from '@/stores/hrvStore';
import { useUserStore } from '@/stores/userStore';
import { useHealthProfileStore } from '@/stores/healthProfileStore';
import { MorningWelcome } from './MorningWelcome';
import { MultiScreenshotUpload } from './MultiScreenshotUpload';
import { MorningContextForm } from './MorningContextForm';
import { YesterdayPlanReviewComponent } from './YesterdayPlanReview';
import { AnalysisLoadingAnimation } from './AnalysisLoadingAnimation';
import { HabitForm } from './HabitForm';
import {
  generateSmartDefaults,
  convertToHabitEntry,
  type OldHabitFormData,
} from '@/lib/habits/smartDefaults';
import type {
  ScreenshotData,
  MorningContext,
  YesterdayPlanReview,
  HabitEntry,
  MorningAnalysisRequest,
} from '@/types';

interface MorningRitualWizardProps {
  onComplete: () => void;
}

export function MorningRitualWizard({ onComplete }: MorningRitualWizardProps) {
  const {
    currentSession,
    startSession,
    setCurrentStep,
    setScreenshots,
    setMorningContext,
    setYesterdayReview,
    setHabitData,
    setGeneratedPlan,
    completeSession,
    goToNextStep,
    hasHydrated,
    clearSession,
  } = useMorningRitualStore();

  const { getYesterdayPlan } = useAIPlanStore();
  const { profile } = useUserStore();
  const { healthProfile } = useHealthProfileStore();
  const { getRecentReadings, getAverageHRV, getTrend } = useHrvStore();

  const yesterdayPlan = getYesterdayPlan();
  const todayPlan = useAIPlanStore((state) => state.getTodayPlan)();

  // Prevent starting if today's plan already exists
  useEffect(() => {
    if (todayPlan) {
      Alert.alert(
        'Already Completed',
        "You've already completed your morning ritual for today! Check back tomorrow.",
        [
          {
            text: 'View Today\'s Plan',
            onPress: () => router.replace('/daily-plan'),
          },
          {
            text: 'Go to Dashboard',
            onPress: () => router.replace('/(tabs)'),
            style: 'cancel',
          },
        ]
      );
    }
  }, [todayPlan]);

  // Clear completed sessions immediately
  useEffect(() => {
    if (currentSession && currentSession.completedAt) {
      console.log('[MorningRitualWizard] Clearing completed session from:', currentSession.date);
      clearSession();
    }
  }, [currentSession]);

  // Auto-trigger analysis if resuming at analysis step with habit data but no plan
  useEffect(() => {
    if (!currentSession || currentSession.completedAt) return;

    const hasRequiredData =
      currentSession.screenshots &&
      (currentSession.screenshots.recovery || currentSession.screenshots.sleep) &&
      currentSession.morningContext &&
      currentSession.habitData;

    const shouldTriggerAnalysis =
      currentSession.currentStep === 'analysis' &&
      hasRequiredData &&
      !currentSession.generatedPlan;

    if (shouldTriggerAnalysis) {
      console.log('[MorningRitualWizard] Resuming analysis from saved session');
      performAnalysis(currentSession.habitData!);
    } else if (currentSession.currentStep === 'analysis' && !hasRequiredData) {
      // Session is at analysis but missing data - reset to beginning
      console.error('[MorningRitualWizard] Analysis step missing required data, resetting to screenshots');
      Alert.alert(
        'Session Error',
        'Your saved session is missing required data. Please start over.',
        [{ text: 'OK', onPress: () => setCurrentStep('screenshots') }]
      );
    }
  }, [currentSession?.currentStep, currentSession?.habitData, currentSession?.generatedPlan]);

  const handleStart = () => {
    // Check if health profile exists before starting
    if (!healthProfile || !healthProfile.primaryGoal) {
      Alert.alert(
        'Complete Your Profile First',
        'Please complete your health profile to get personalized recommendations. This includes your goals, exercise preferences, and health information.',
        [
          {
            text: 'Complete Profile',
            onPress: () => router.push('/onboarding'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    startSession();
    // Use setTimeout to ensure state update completes before navigation
    setTimeout(() => {
      setCurrentStep('screenshots');
    }, 0);
  };

  // Show loading while store is hydrating
  if (!hasHydrated) {
    return (
      <View style={styles.container}>
        <AnalysisLoadingAnimation message="Loading..." />
      </View>
    );
  }

  const handleScreenshotsComplete = (screenshots: {
    recovery: ScreenshotData | null;
    sleep: ScreenshotData | null;
  }) => {
    setScreenshots(screenshots);
    goToNextStep(); // Move to context
  };

  const handleContextComplete = (context: MorningContext) => {
    setMorningContext(context);
    goToNextStep(); // Move to yesterday review or habits
  };

  const handleYesterdayReviewComplete = (review: YesterdayPlanReview) => {
    setYesterdayReview(review);
    goToNextStep(); // Move to habits
  };

  const handleYesterdayReviewSkip = () => {
    // Skip yesterday review - don't set to null, just move to next step
    goToNextStep(); // Move to habits
  };

  const handleHabitsComplete = async (formData: any) => {
    // HabitForm returns data in old format, so we cast it
    const oldFormData = formData as Omit<OldHabitFormData, 'id'>;

    // Convert old form format to comprehensive HabitEntry
    const habitData = convertToHabitEntry(oldFormData);

    // Generate ID for habit entry
    const fullHabitEntry: HabitEntry = {
      id: `habit-${Date.now()}`,
      ...habitData,
    };

    setHabitData(fullHabitEntry);
    setCurrentStep('analysis');

    // Trigger analysis
    await performAnalysis(fullHabitEntry);
  };

  // Generate smart defaults for habit form
  const habitDefaults = useMemo(() => {
    if (!currentSession) return {} as any;
    return generateSmartDefaults(currentSession.screenshots, currentSession.morningContext) as any;
  }, [currentSession?.screenshots, currentSession?.morningContext]);

  const performAnalysis = async (habitData: HabitEntry) => {
    console.log('[MorningRitualWizard] Starting performAnalysis');
    console.log('[MorningRitualWizard] Has currentSession:', !!currentSession);
    console.log('[MorningRitualWizard] Has profile:', !!profile);
    console.log('[MorningRitualWizard] Has habitData:', !!habitData);

    if (!currentSession || !profile) {
      console.error('Missing required data for analysis - session or profile missing');
      Alert.alert(
        'Error',
        'Missing user profile data. Please complete your profile setup.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }

    try {
      // Extract biometrics from screenshots
      const recoveryData = currentSession.screenshots.recovery?.extractedData;
      const sleepData = currentSession.screenshots.sleep?.extractedData;

      console.log('[MorningRitualWizard] Has recoveryData:', !!recoveryData);
      console.log('[MorningRitualWizard] Has sleepData:', !!sleepData);
      console.log('[MorningRitualWizard] Has morningContext:', !!currentSession.morningContext);

      if (!recoveryData && !sleepData) {
        console.error('No biometric data extracted from screenshots');
        Alert.alert(
          'Error',
          'Could not extract data from screenshots. Please try again with clearer images.',
          [{ text: 'OK' }]
        );
        setCurrentStep('screenshots');
        return;
      }

      const todayBiometrics = {
        hrv: recoveryData?.hrv || 50,
        recoveryScore: recoveryData?.recoveryScore || 50,
        sleepHours: sleepData?.sleepHours || 7,
        sleepQuality: sleepData?.sleepQuality || 70,
        restingHR: recoveryData?.restingHR || 60,
        yesterdayStrain: recoveryData?.strain,
      };

      // Get historical data
      const recentReadings = getRecentReadings(30);
      const avg7Day = getAverageHRV(7);
      const avg30Day = getAverageHRV(30);
      const trend = getTrend(30);

      // Build analysis request with default health profile if missing
      const defaultHealthProfile = {
        injuries: [],
        conditions: [],
        medications: [],
        primaryGoal: 'Improve overall HRV and recovery',
        secondaryGoals: [],
        exercisePreferences: {
          likes: [],
          dislikes: [],
          currentFrequency: 'moderate',
        },
        workEnvironment: {
          type: 'desk job',
          stressLevel: 'moderate' as const,
          avgMeetingsPerDay: 3,
          deskWork: true,
        },
        familySituation: {
          hasYoungChildren: false,
          numberOfChildren: 0,
          childrenAges: [],
        },
        eatingHabits: {
          fruitsVeggiesPerDay: 3,
          waterIntakeLiters: 2,
          supplements: [],
          dietaryRestrictions: [],
        },
        sleepPatterns: {
          avgBedtime: '23:00',
          avgWakeTime: '07:00',
          difficulties: [],
        },
        stressTriggers: [],
      };

      const analysisRequest: MorningAnalysisRequest = {
        date: new Date().toISOString().split('T')[0],
        todayBiometrics,
        morningContext: currentSession.morningContext!,
        yesterdayPlanReview: currentSession.yesterdayReview,
        habitData,
        historical: {
          avg7Day,
          avg30Day,
          trend,
          correlations: [],
        },
        userProfile: profile,
        healthProfile: healthProfile || defaultHealthProfile,
      };

      // Call morning analysis API
      const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/ai/morning-analysis`;
      console.log('[MorningRitualWizard] Calling morning analysis API');
      console.log('[MorningRitualWizard] API URL:', apiUrl);
      console.log('[MorningRitualWizard] EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);

      if (!process.env.EXPO_PUBLIC_API_URL) {
        throw new Error('API URL not configured. Please set EXPO_PUBLIC_API_URL environment variable.');
      }

      const response = await fetch(
        apiUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(analysisRequest),
        }
      );

      console.log('[MorningRitualWizard] API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('[MorningRitualWizard] API error response:', errorData);
        const errorMessage = errorData?.error || errorData?.message || 'Failed to generate analysis';
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data || !data.analysis) {
        throw new Error('Invalid response from analysis API');
      }

      // Create daily plan from analysis
      const dailyPlan = {
        id: `plan-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        generatedAt: new Date(),
        todayRecovery: {
          hrv: todayBiometrics.hrv,
          recoveryScore: todayBiometrics.recoveryScore,
          sleepHours: todayBiometrics.sleepHours,
        },
        userContext: currentSession.morningContext!.notes,
        focusArea: data.analysis.focusArea,
        reasoning: data.analysis.reasoning,
        recommendations: data.analysis.recommendations,
        estimatedEndOfDayHRV: data.analysis.estimatedEndOfDayHRV,
        previousDayAnalysis: currentSession.yesterdayReview
          ? {
              planId: currentSession.yesterdayReview.planId,
              adherenceRate:
                (currentSession.yesterdayReview.completedActions.length /
                  currentSession.yesterdayReview.totalActions) *
                100,
              successfulActions: currentSession.yesterdayReview.completedActions,
              learnedInsights: data.analysis.previousDayLearnings,
            }
          : undefined,
        goalAlignment: data.analysis.goalProgress
          ? {
              primaryGoal: healthProfile.primaryGoal,
              progressToGoal: data.analysis.goalProgress.onTrack
                ? 'On track'
                : 'Needs focus',
              recommendationsAligned: data.analysis.recommendations.filter(
                (r: any) => r.category === 'Goal Progress'
              ).length,
            }
          : undefined,
        completed: [],
      };

      setGeneratedPlan(dailyPlan);
      completeSession();
      goToNextStep(); // Move to plan
      onComplete();
    } catch (error) {
      console.error('Error performing analysis:', error);

      // Show detailed error for debugging
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
        });
      }

      Alert.alert(
        'Analysis Failed',
        `Error: ${errorMessage}\n\nPlease check the console for more details or try again.`,
        [
          {
            text: 'Retry',
            onPress: () => {
              setCurrentStep('habits');
            },
          },
          {
            text: 'Cancel',
            onPress: () => router.back(),
            style: 'cancel',
          },
        ]
      );
    }
  };

  // Only use session if it's valid (not completed, and for today)
  const today = new Date().toISOString().split('T')[0];
  const validSession =
    currentSession &&
    !currentSession.completedAt &&
    currentSession.date === today
      ? currentSession
      : null;

  if (!validSession) {
    return (
      <View style={styles.container}>
        <MorningWelcome onStartRitual={handleStart} />
      </View>
    );
  }

  // Render based on current step
  switch (validSession.currentStep) {
    case 'welcome':
      return (
        <View style={styles.container}>
          <MorningWelcome onStartRitual={handleStart} />
        </View>
      );

    case 'screenshots':
      return (
        <View style={styles.container}>
          <MultiScreenshotUpload onComplete={handleScreenshotsComplete} />
        </View>
      );

    case 'context':
      return (
        <View style={styles.container}>
          <MorningContextForm onComplete={handleContextComplete} />
        </View>
      );

    case 'yesterday-review':
      if (yesterdayPlan) {
        return (
          <View style={styles.container}>
            <YesterdayPlanReviewComponent
              plan={yesterdayPlan}
              onComplete={handleYesterdayReviewComplete}
              onSkip={handleYesterdayReviewSkip}
            />
          </View>
        );
      } else {
        // Skip to habits if no yesterday plan - show loading while transitioning
        setTimeout(() => handleYesterdayReviewSkip(), 0);
        return (
          <View style={styles.container}>
            <AnalysisLoadingAnimation message="Loading..." />
          </View>
        );
      }

    case 'habits':
      return (
        <View style={styles.container}>
          <HabitForm
            date={new Date().toISOString().split('T')[0]}
            initialData={habitDefaults}
            onSubmit={handleHabitsComplete}
          />
        </View>
      );

    case 'analysis':
      return (
        <View style={styles.container}>
          <AnalysisLoadingAnimation message="Creating your personalized plan..." />
        </View>
      );

    case 'plan':
      // Plan screen will be shown after onComplete() is called
      return (
        <View style={styles.container}>
          <AnalysisLoadingAnimation message="Loading your plan..." />
        </View>
      );

    default:
      // Fallback - show welcome screen
      return (
        <View style={styles.container}>
          <MorningWelcome onStartRitual={handleStart} />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
