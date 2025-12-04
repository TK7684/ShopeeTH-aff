const http = require('http');
const { URL } = require('url');

// Test configuration
const config = {
  baseUrl: 'http://localhost:3000', // Adjust if your dev server runs on a different port
  cronEndpoint: '/api/cron'
};

// Helper function to make HTTP request
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, config.baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Test function
async function testCronEndpoint() {
  try {
    console.log('🧪 Testing cron endpoint locally...');
    console.log(`📍 Endpoint: ${config.baseUrl}${config.cronEndpoint}`);

    const startTime = Date.now();
    const response = await makeRequest(config.cronEndpoint);
    const elapsedTime = Date.now() - startTime;

    console.log(`⏱️  Response time: ${elapsedTime}ms`);
    console.log(`📊 Status code: ${response.statusCode}`);

    if (response.statusCode === 200) {
      console.log('✅ Cron endpoint executed successfully!');
      console.log('📋 Response data:');
      console.log(JSON.stringify(response.data, null, 2));

      // Check for expected response structure
      const expectedFields = ['message', 'fetched', 'filtered', 'uploaded'];
      const hasExpectedFields = expectedFields.every(field => field in response.data);

      if (hasExpectedFields) {
        console.log('✅ Response has expected structure');
      } else {
        console.log('⚠️  Response structure may not match expected format');
      }
    } else {
      console.log('❌ Cron endpoint returned an error');
      console.log('📋 Error response:');
      console.log(JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error testing cron endpoint:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your development server is running with:');
      console.log('   npm run dev');
      console.log(`\n   Or adjust the baseUrl in this script (currently: ${config.baseUrl})`);
    }
  }
}

// Run the test
testCronEndpoint();
