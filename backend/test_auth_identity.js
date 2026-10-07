/**
 * WorkFlowX AI - Authentication & User Profile Identity Test Suite
 * Tests Google OAuth metadata extraction, profile persistence, role separation, and /api/auth/me
 * Uses native fetch in Node.js
 */

const API_URL = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('🧪 Starting Authentication & User Profile Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, msg) => {
    if (condition) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      failed++;
    }
  };

  try {
    // -------------------------------------------------------------
    // TEST 1: Google OAuth with user_metadata.full_name
    // -------------------------------------------------------------
    console.log('--- TEST 1: Google OAuth Sign-in with authentic user metadata ---');
    const testGoogleUser = {
      name: 'Divya Gunda',
      email: `divya.gunda.${Date.now()}@gmail.com`,
      user_metadata: {
        full_name: 'Divya Gunda',
        email: `divya.gunda.${Date.now()}@gmail.com`,
      },
    };

    const res1 = await req('/auth/google', { method: 'POST', body: testGoogleUser });
    assert(res1.status === 200, 'POST /api/auth/google returns status 200');
    assert(res1.data.user?.name === 'Divya Gunda', `User name matches authentic Google name: "${res1.data.user?.name}"`);
    assert(res1.data.user?.name !== 'Google User', 'User name is NOT "Google User"');
    assert(res1.data.user?.name !== 'operator', 'User name is NOT "operator"');
    assert(res1.data.user?.role === 'user', `Role is separate from name (role: "${res1.data.user?.role}")`);
    assert(!!res1.data.token, 'JWT token is generated');

    const token = res1.data.token;

    // -------------------------------------------------------------
    // TEST 2: GET /api/auth/me (Current User API)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: GET /api/auth/me Current User Endpoint ---');
    const res2 = await req('/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(res2.status === 200, 'GET /api/auth/me returns status 200');
    assert(res2.data.user?.name === 'Divya Gunda', `Authenticated name from token is: "${res2.data.user?.name}"`);
    assert(res2.data.user?.role === 'user', `Role is correctly preserved as: "${res2.data.user?.role}"`);
    assert(res2.data.user?.email === testGoogleUser.email, `Email is: "${res2.data.user?.email}"`);

    // -------------------------------------------------------------
    // TEST 3: Safe Email Username Fallback (when only email provided)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Google Sign-in with Email Fallback (Clean Capitalization) ---');
    const fallbackEmail = `aarav.sharma.${Date.now()}@gmail.com`;
    const res3 = await req('/auth/google', {
      method: 'POST',
      body: { email: fallbackEmail },
    });
    assert(res3.status === 200, 'Google sign-in with email returns status 200');
    assert(res3.data.user?.name.startsWith('Aarav Sharma'), `Fallback derived authentic formatted name: "${res3.data.user?.name}"`);
    assert(res3.data.user?.name !== 'Google User', 'Does NOT fall back to "Google User"');

    // -------------------------------------------------------------
    // TEST 4: Auto-healing Existing Account with Legacy Placeholder
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Existing User Re-authentication (Placeholder Healing) ---');
    const res4 = await req('/auth/google', {
      method: 'POST',
      body: {
        email: fallbackEmail,
        name: 'Aarav Sharma',
        user_metadata: { full_name: 'Aarav Sharma' },
      },
    });
    assert(res4.data.user?.name === 'Aarav Sharma', `Existing profile retains/heals authentic name: "${res4.data.user?.name}"`);

    // -------------------------------------------------------------
    // TEST 5: Profile Update PUT /api/auth/me
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Profile Update PUT /api/auth/me ---');
    const res5 = await req('/auth/me', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: { name: 'Divya Gunda (Lead Operator)' },
    });
    assert(res5.status === 200, 'PUT /api/auth/me returns status 200');
    assert(res5.data.user?.name === 'Divya Gunda (Lead Operator)', `Updated name: "${res5.data.user?.name}"`);

    const res5Check = await req('/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(res5Check.data.user?.name === 'Divya Gunda (Lead Operator)', 'GET /api/auth/me reflects updated name');

    // -------------------------------------------------------------
    // TEST 6: Standard Email Registration with Real Name
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Standard Registration with Real Name ---');
    const regEmail = `alexander.wright.${Date.now()}@company.com`;
    const res6 = await req('/auth/register', {
      method: 'POST',
      body: {
        name: 'Alexander Wright',
        email: regEmail,
        password: 'SecurePassword123!',
      },
    });
    assert(res6.status === 201, 'POST /api/auth/register returns status 201');
    assert(res6.data.user?.name === 'Alexander Wright', `Registered name: "${res6.data.user?.name}"`);
    assert(res6.data.user?.role === 'user', `Role is separate: "${res6.data.user?.role}"`);

    console.log(`\n======================================================`);
    console.log(`🎯 Test Results: ${passed} passed, ${failed} failed`);
    console.log(`======================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runTests();
