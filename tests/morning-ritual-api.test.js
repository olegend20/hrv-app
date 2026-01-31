/**
 * Morning Ritual API Integration Tests
 * Run with: node tests/morning-ritual-api.test.js
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const results = [];

async function testEndpointExists() {
  console.log('\n🧪 Test 1: Check if morning-analysis endpoint exists');
  
  try {
    const response = await fetch(`${API_URL}/api/ai/morning-analysis`, {
      method: 'GET',
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
      error: error.message || 'Network error',
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
      error: error.message || 'Request failed',
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
  
  if (results[0]?.passed) {
    await testMissingFields();
  }
  
  const allPassed = printResults();
  
  if (!allPassed) {
    console.log('\n🔧 NEXT STEPS TO FIX:');
    const firstFailure = results.find(r => !r.passed);
    
    if (firstFailure?.name === 'Endpoint Exists') {
      console.log('❌ The API endpoint is returning 404 - it is NOT deployed to Vercel');
      console.log('\n✅ SOLUTIONS:');
      console.log('1. Check Vercel dashboard deployment status');
      console.log('2. Manually redeploy in Vercel if needed');
      console.log('3. Check Vercel function logs for build errors');
      console.log(`4. Test URL directly: ${API_URL}/api/ai/morning-analysis`);
    }
    
    process.exit(1);
  } else {
    console.log('🎉 All tests passed! API is deployed and working.\n');
    process.exit(0);
  }
}

runTests();
