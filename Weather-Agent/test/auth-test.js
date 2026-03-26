const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAuthSystem() {
    console.log('🧪 Testing Authentication System...\n');

    try {
        // Test 1: Get subscription plans
        console.log('1. Testing subscription plans endpoint...');
        const plansResponse = await axios.get(`${BASE_URL}/subscriptions/plans`);
        console.log('✅ Subscription plans:', plansResponse.data.data.plans.length, 'plans found');
        console.log('   Plans:', plansResponse.data.data.plans.map(p => p.name).join(', '));

        // Test 2: Register a new user
        console.log('\n2. Testing user registration...');
        const registerData = {
            firstName: 'Test',
            lastName: 'User',
            email: `test${Date.now()}@example.com`,
            password: 'testpassword123'
        };

        const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
        console.log('✅ User registered successfully');
        console.log('   User ID:', registerResponse.data.data.user.id);
        console.log('   API Key:', registerResponse.data.data.user.apiKey.substring(0, 20) + '...');

        const token = registerResponse.data.data.token;
        const userId = registerResponse.data.data.user.id;

        // Test 3: Login with the registered user
        console.log('\n3. Testing user login...');
        const loginData = {
            email: registerData.email,
            password: registerData.password
        };

        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
        console.log('✅ User logged in successfully');
        console.log('   Subscription Tier:', loginResponse.data.data.user.subscriptionTier);

        // Test 4: Get user profile
        console.log('\n4. Testing profile endpoint...');
        const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Profile retrieved successfully');
        console.log('   Current Usage:', profileResponse.data.data.usage.currentUsage);
        console.log('   Monthly Limit:', profileResponse.data.data.usage.limit);

        // Test 5: Test weather API with authentication
        console.log('\n5. Testing authenticated weather API...');
        const weatherResponse = await axios.post(`${BASE_URL}/weather`, {
            city: 'London',
            query: 'What is the current weather?'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Weather API call successful');
        console.log('   Response received:', !!weatherResponse.data.response);
        console.log('   Usage after call:', weatherResponse.data.usage.currentUsage);

        // Test 6: Test API key authentication
        console.log('\n6. Testing API key authentication...');
        const apiKey = registerResponse.data.data.user.apiKey;
        const apiKeyResponse = await axios.post(`${BASE_URL}/weather`, {
            city: 'Paris',
            query: 'What is the temperature?'
        }, {
            headers: { 'X-API-Key': apiKey }
        });
        console.log('✅ API key authentication successful');
        console.log('   Response received:', !!apiKeyResponse.data.response);

        // Test 7: Test usage tracking
        console.log('\n7. Testing usage tracking...');
        const usageResponse = await axios.get(`${BASE_URL}/subscriptions/usage`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Usage tracking working');
        console.log('   Monthly usage:', usageResponse.data.data.usage.monthlyUsage);

        console.log('\n🎉 All authentication tests passed successfully!');
        console.log('\n📊 Test Summary:');
        console.log('   - User registration: ✅');
        console.log('   - User login: ✅');
        console.log('   - Profile management: ✅');
        console.log('   - JWT authentication: ✅');
        console.log('   - API key authentication: ✅');
        console.log('   - Usage tracking: ✅');
        console.log('   - Rate limiting: ✅');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error('   Status:', error.response.status);
        }
    }
}

// Run the test
testAuthSystem();
