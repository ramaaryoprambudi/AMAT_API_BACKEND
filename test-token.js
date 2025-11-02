const axios = require('axios');

const API_BASE = 'http://localhost:8080/api';

async function testTokenGeneration() {
  try {
    console.log('🧪 Testing Token Generation...\n');
    
    // Test register
    console.log('1. Testing Register...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      nama: `Test User ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'testpassword123'
    });
    
    console.log('✅ Register successful!');
    console.log('Token:', registerResponse.data.data.token.substring(0, 50) + '...');
    console.log('Expires in:', registerResponse.data.data.expires_in);
    
    const registerToken = registerResponse.data.data.token;
    
    // Test debug token endpoint
    console.log('\n2. Testing Debug Token...');
    const debugResponse = await axios.get(`${API_BASE}/auth/debug-token`, {
      headers: {
        'Authorization': `Bearer ${registerToken}`
      }
    });
    
    console.log('✅ Debug token successful!');
    console.log('Token Debug Info:');
    console.log('- Issued At:', debugResponse.data.data.debug_info.issued_at);
    console.log('- Expires At:', debugResponse.data.data.debug_info.expires_at);
    console.log('- Is Expired:', debugResponse.data.data.debug_info.is_expired);
    console.log('- Time Difference (seconds):', debugResponse.data.data.debug_info.time_difference);
    console.log('- Time to Expiry (seconds):', debugResponse.data.data.debug_info.time_to_expiry);
    
    // Test verify token
    console.log('\n3. Testing Verify Token...');
    const verifyResponse = await axios.get(`${API_BASE}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${registerToken}`
      }
    });
    
    console.log('✅ Verify token successful!');
    console.log('Token Info:');
    console.log('- Issued At:', verifyResponse.data.data.token_info.issued_at);
    console.log('- Expires At:', verifyResponse.data.data.token_info.expires_at);
    console.log('- Time to Expiry (hours):', verifyResponse.data.data.token_info.time_to_expiry_hours);
    
    console.log('\n🎉 All token tests passed! Token generation is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testTokenGeneration();