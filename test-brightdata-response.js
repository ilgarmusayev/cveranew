const axios = require('axios');

async function testBrightDataAPI() {
  try {
    console.log('🧪 Testing BrightData API...');

    const api_key = 'da77d05e80aa038856c04cb0e96d34a267be39e89a46c03ed15e68b38353eaae';
    const url = 'https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_l1viktl72bvl7bjuj0&include_errors=true';

    const requestBody = [
      {
        "url": "https://www.linkedin.com/in/musayevcreate/"
      }
    ];

    const headers = {
      'Authorization': `Bearer ${api_key}`,
      'Content-Type': 'application/json'
    };

    console.log('📡 Making BrightData API request...');
    console.log('🔧 URL:', url);
    console.log('🔧 Request body:', JSON.stringify(requestBody, null, 2));
    console.log('🔧 Headers:', { ...headers, Authorization: `Bearer ${api_key.substring(0, 8)}***` });

    const response = await axios.post(url, requestBody, {
      headers: headers,
      timeout: 30000
    });

    console.log('✅ BrightData API Response Status:', response.status);
    console.log('✅ Response Headers:', response.headers);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      console.log('🎉 BrightData API working!');

      // Check if response contains actual data or just job ID
      if (response.data && typeof response.data === 'object') {
        if (response.data.snapshot_id || response.data.job_id) {
          console.log('⚠️ BrightData returned job ID - this is async API');
          console.log('📝 Job/Snapshot ID:', response.data.snapshot_id || response.data.job_id);

          // BrightData might be async, we need to check status later
          if (response.data.snapshot_id) {
            console.log('🔄 Checking snapshot status...');
            await checkSnapshotStatus(response.data.snapshot_id, api_key);
          }
        } else {
          console.log('✅ BrightData returned direct data');
        }
      }

      return true;
    } else {
      console.log('❌ BrightData API failed with status:', response.status);
      return false;
    }

  } catch (error) {
    console.error('❌ BrightData API test failed:', error.message);
    if (error.response) {
      console.error('📊 Error response status:', error.response.status);
      console.error('📊 Error response data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function checkSnapshotStatus(snapshotId, apiKey) {
  try {
    console.log(`🔍 Checking snapshot status for: ${snapshotId}`);

    const statusUrl = `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}`;

    const response = await axios.get(statusUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Snapshot status:', response.data);

    if (response.data.status === 'running') {
      console.log('⏳ Snapshot still running, waiting...');
      setTimeout(() => checkSnapshotStatus(snapshotId, apiKey), 5000);
    } else if (response.data.status === 'ready') {
      console.log('✅ Snapshot ready! Getting data...');
      await getSnapshotData(snapshotId, apiKey);
    }
  } catch (error) {
    console.error('❌ Error checking snapshot status:', error.message);
  }
}

async function getSnapshotData(snapshotId, apiKey) {
  try {
    console.log(`📥 Getting snapshot data for: ${snapshotId}`);

    const dataUrl = `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}/download?format=json`;

    const response = await axios.get(dataUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    console.log('🎉 Snapshot data received:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error getting snapshot data:', error.message);
  }
}

testBrightDataAPI();
