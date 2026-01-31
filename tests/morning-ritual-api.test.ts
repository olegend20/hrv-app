/**
 * Morning Ritual API Integration Tests
 * Run with: npx ts-node tests/morning-ritual-api.test.ts
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  response?: any;
}

const results: TestResult[] = [];

async function testEndpointExists() {
  console.log('\n🧪 Test 1: Check if morning-analysis endpoint exists');
  
  try {
    const response = await fetch(`${API_URL}/api/ai/morning-analysis`, {
      method: 'GET', // Should return 405 Method Not Allowed, not 404
    });
    
    const isNotFound = response.status === 404;
    const isMethodNotAllowed = response.status === 405;
    
    if (isNotFound) {
      results.push({
        name: 'Endpoint Exists',
        passed: false,
        error: `404 Not Found - Endpoint doesn't exist on server`,
        response: { status: response.status, url: `${API_URL}/api/ai/morning-analysis` },
      });
      return false;
    }
    
    if (isMethodNotAllowed) {
      results.push({
        name: 'Endpoint Exists',
        passed: true,
        response: { status: 405, message: 'Endpoint exists (returns 405 for GET as expected)' },
      });
      return true;
    }
    
    results.push({
      name: 'Endpoint Exists',
      passed: false,
      error: `Unexpected status: ${response.status}`,
      response: { status: response.status },
    });
    return false;
  } catch (error) {
    results.push({
      name: 'Endpoint Exists',
      passed: false,
      error: error instanceof Error ? error.message : 'Network error',
    });
    return false;
  }
}

async function testMissingFields() {
  console.log('\n🧪 Test 2: Test API validation (missing required fields)');
  
  try {
    const response = await fetch(`${API_URL}/api/ai/morning-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    
    const data = await response.json().catch(() => null);
    
    if (response.status === 400 && data?.error?.includes('Missing required fields')) {
      results.push({
        name: 'API Validation',
        passed: true,
        response: { status: 400, message: 'Correctly validates required fields' },
      });
      return true;
    }
    
    results.push({
      name: 'API Validation',
      passed: false,
      error: `Expected 400 with validation error, got ${response.status}`,
      response: { status: response.status, data },
    });
    return false;
  } catch (error) {
    results.push({
      name: 'API Validation',
      passed: false,
      error: error instanceof Error ? error.message : 'Request failed',
    });
    return false;
  }
}

async function testFullRequest() {
  console.log('\n🧪 Test 3: Test API with valid data');
  
  const mockRequest = {
    date: new Date().toISOString().split('T')[0],
    todayBiometrics: {
      hrv: 65,
      recoveryScore: 75,
      sleepHours: 7.5,
      sleepQuality: 80,
      restingHR: 55,
    },
    morningContext: {
      sleepRating: 4,
      energyLevel: 4,
      notes: 'Test morning ritual',
    },
    habitData: {
      id: 'test-habit',
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      userId: 'test-user',
      exercise: { type: 'light cardio', duration: 30 },
      stress: { level: 3, triggers: [] },
      nutrition: { quality: 4, meals: [] },
      hydration: { litersConsumed: 2.5 },
      recovery: { quality: 4 },
      sleep: { hoursLastNight: 7.5, quality: 4 },
      mindfulness: { practiced: true, duration: 10 },
      alcohol: { consumed: false },
      caffeine: { cups: 1, lastTime: '08:00' },
      screenTime: { hoursBeforeBed: 1 },
      social: { quality: 4 },
      illness: { symptoms: false },
      temperature: { exposure: 'moderate' },
    },
    historical: {
      avg7Day: 63,
      avg30Day: 61,
      trend: 'improving' as const,
      correlations: [],
    },
    userProfile: {
      id: 'test-user',
      name: 'Test User',
      age: 30,
      gender: 'male' as const,
    },
    healthProfile: {
      primaryGoal: 'Improve HRV and recovery',
      injuries: [],
      conditions: [],
      medications: [],
      secondaryGoals: [],
      exercisePreferences: {
        likes: ['running'],
        dislikes: [],
        currentFrequency: 'moderate' as const,
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
    },
  };
  
  try {
    const response = await fetch(`${API_URL}/api/ai/morning-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockRequest),
    });
    
    const data = await response.json().catch(() => null);
    
    if (response.status === 200 && data?.analysis) {
      results.push({
        name: 'Full API Request',
        passed: true,
        response: { 
          status: 200, 
          hasAnalysis: !!data.analysis,
          hasFocusArea: !!data.analysis.focusArea,
          hasRecommendations: !!data.analysis.recommendations,
        },
      });
      return true;
    }
    
    results.push({
      name: 'Full API Request',
      passed: false,
      error: `Expected 200 with analysis, got ${response.status}`,
      response: { status: response.status, data },
    });
    return false;
  } catch (error) {
    results.push({
      name: 'Full API Request',
      passed: false,
      error: error instanceof Error ? error.message : 'Request failed',
    });
    return false;
  }
}

function printResults() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`\n${icon} Test ${index + 1}: ${result.name}`);
    
    if (result.passed) {
      console.log(`   ${JSON.stringify(result.response, null, 2)}`);
    } else {
      console.log(`   ERROR: ${result.error}`);
      if (result.response) {
        console.log(`   Response: ${JSON.stringify(result.response, null, 2)}`);
      }
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log('='.repeat(60) + '\n');
  
  return failed === 0;
}

async function runTests() {
  console.log('🚀 Starting Morning Ritual API Tests');
  console.log(`📍 API URL: ${API_URL}`);
  
  await testEndpointExists();
  await testMissingFields();
  await testFullRequest();
  
  const allPassed = printResults();
  
  if (!allPassed) {
    console.log('\n🔧 DEBUGGING SUGGESTIONS:');
    const firstFailure = results.find(r => !r.passed);
    
    if (firstFailure?.name === 'Endpoint Exists') {
      console.log('1. Check Vercel deployment - endpoint may not be deployed');
      console.log('2. Verify API_URL is correct:', API_URL);
      console.log('3. Check api/ai/morning-analysis.ts exists in git');
      console.log('4. Look at Vercel function logs for errors');
    }
    
    if (firstFailure?.error?.includes('Network')) {
      console.log('1. Check internet connection');
      console.log('2. Verify EXPO_PUBLIC_API_URL is set correctly');
      console.log('3. Check if API server is running');
    }
    
    process.exit(1);
  } else {
    console.log('🎉 All tests passed! API is working correctly.\n');
    process.exit(0);
  }
}

runTests();
