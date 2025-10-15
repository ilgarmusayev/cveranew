import { getBrightDataApiKey } from '@/lib/api-service';

export class BrightDataLinkedInService {
  private readonly BRIGHTDATA_BASE_URL = 'https://api.brightdata.com';
  
  /**
   * REAL BrightData API call - NO MOCK DATA
   * Scrape LinkedIn profile using BrightData collector
   */
  async scrapeLinkedInProfile(profileUrl: string): Promise<any> {
    console.log('🚀 REAL BrightData API call başlayır (NO MOCK)');
    console.log('🔗 Profile URL:', profileUrl);
    
    try {
      // Get real API key
      const apiKey = await getBrightDataApiKey();
      if (!apiKey) {
        throw new Error('BrightData API key not found in database');
      }
      
      console.log('🔑 Real API key alındı:', apiKey ? `${apiKey.substring(0, 8)}...` : 'No key');
      
      // Step 1: Trigger real BrightData scraping
      console.log('📡 Step 1: REAL API trigger edilir...');
      const triggerResponse = await this.triggerRealScraping(profileUrl, apiKey);
      console.log('✅ Real API triggered:', triggerResponse);
      
      // Step 2: Wait for real results or get direct data
      console.log('⏳ Step 2: REAL results handling...');
      const results = await this.waitForRealResults(triggerResponse, apiKey);
      console.log('✅ REAL results alındı!');
      
      // Step 3: Return real data (NO transformation to avoid issues)
      console.log('📊 REAL BrightData data keys:', Object.keys(results || {}));
      console.log('📊 REAL data sample:', {
        name: results?.name,
        first_name: results?.first_name,
        last_name: results?.last_name,
        position: results?.position,
        experience_count: results?.experience?.length || 0
      });
      
      return results; // Return raw real data directly
      
    } catch (error) {
      console.error('❌ REAL BrightData API error:', error);
      throw error;
    }
  }
  
  /**
   * Trigger REAL BrightData scraping with correct API format
   */
  private async triggerRealScraping(profileUrl: string, apiKey: string): Promise<any> {
    console.log('📡 REAL BrightData trigger API call with CORRECT format');
    
    // Real BrightData API format based on the provided example
    const triggerUrl = `${this.BRIGHTDATA_BASE_URL}/datasets/v3/trigger?dataset_id=gd_l1viktl72bvl7bjuj0&include_errors=true`;
    const payload = [
      {"url": profileUrl}
    ];
    
    console.log('📡 REAL API endpoint:', triggerUrl);
    console.log('📋 REAL API payload:', JSON.stringify(payload, null, 2));
    console.log('� API Key preview:', apiKey ? `${apiKey.substring(0, 8)}...` : 'No key');
    
    try {
      const response = await fetch(triggerUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('📊 REAL API response status:', response.status);
      console.log('📊 REAL API response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ REAL API trigger failed:', response.status, errorText);
        throw new Error(`BrightData trigger failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ REAL API trigger SUCCESS with correct format!');
      console.log('📋 Success Response:', JSON.stringify(result, null, 2));
      
      // BrightData usually returns snapshot_id for tracking
      const snapshotId = result.snapshot_id || result.job_id || result.request_id || result.id;
      
      if (snapshotId) {
        return { snapshot_id: snapshotId, format: 'BrightData v3 Datasets API' };
      } else {
        // If direct data is returned
        if (result.data || Array.isArray(result)) {
          console.log('📊 Direct data received from trigger');
          return { direct_data: result, format: 'BrightData v3 Datasets API' };
        }
        
        // Return full result for debugging
        return { raw_response: result, format: 'BrightData v3 Datasets API' };
      }
      
    } catch (error) {
      console.error('❌ REAL trigger API error:', error);
      throw error;
    }
  }
  
  /**
   * Wait for REAL BrightData results or handle direct data
   */
  private async waitForRealResults(triggerResponse: any, apiKey: string): Promise<any> {
    console.log('⏳ REAL BrightData results handling başlayır');
    console.log('📋 Trigger Response:', triggerResponse);
    
    // If we have direct data, return it immediately
    if (triggerResponse.direct_data) {
      console.log('📊 Direct data found, no polling needed');
      return triggerResponse.direct_data;
    }
    
    // If we have snapshot_id, poll for results
    if (triggerResponse.snapshot_id) {
      console.log('📋 Snapshot ID found, polling for results:', triggerResponse.snapshot_id);
      
      // Real BrightData polling URL format
      const resultsUrl = `${this.BRIGHTDATA_BASE_URL}/datasets/v3/snapshot/${triggerResponse.snapshot_id}?format=json`;
      console.log('🔗 REAL polling URL:', resultsUrl);
      
      const pollInterval = 15000; // 15 seconds
      const totalMaxTime = 120000; // 2 minutes total
      
      console.log(`⏳ Polling başlayır: maksimum ${totalMaxTime/1000} saniyə, hər ${pollInterval/1000} saniyədə bir`);
      
      const startTime = Date.now();
      let attempt = 0;
      
      while (true) {
        attempt++;
        const elapsedTime = Date.now() - startTime;
        
        // Check if we've exceeded total time limit
        if (elapsedTime >= totalMaxTime) {
          console.log(`⏰ Total time limit reached: ${Math.round(elapsedTime/1000)}s`);
          break;
        }
        
        try {
          console.log(`📡 REAL polling attempt ${attempt} (${Math.round(elapsedTime/1000)}s elapsed)`);
          
          const response = await fetch(resultsUrl, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('📊 Polling response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('📊 Polling data received!');
            console.log('📊 Data type:', Array.isArray(data) ? 'array' : typeof data);
            console.log('📊 Data structure:', JSON.stringify(data, null, 2));
            
            // Check if snapshot is still running
            if (data.status === 'running' || data.status === 'pending') {
              console.log('⏳ Snapshot still running, waiting before next poll...');
              
              // Wait before next attempt
              const currentElapsed = Date.now() - startTime;
              const remainingTime = totalMaxTime - currentElapsed;
              
              if (remainingTime < pollInterval) {
                console.log(`⏰ Remaining time (${Math.round(remainingTime/1000)}s) less than poll interval`);
                break;
              }
              
              console.log(`⏳ ${pollInterval/1000} saniyə gözləyirik... (qalan: ${Math.round(remainingTime/1000)}s)`);
              await new Promise(resolve => setTimeout(resolve, pollInterval));
              continue; // Go to next iteration
            }
            
            // Check if snapshot failed
            if (data.status === 'failed' || data.status === 'error') {
              console.error('❌ Snapshot failed:', data.message || 'Unknown error');
              throw new Error(`BrightData snapshot failed: ${data.message || 'Unknown error'}`);
            }
            
            // Check for actual LinkedIn profile data
            if (Array.isArray(data) && data.length > 0) {
              console.log('✅ REAL LinkedIn profile data ready!');
              const profileData = data[0];
              console.log('📊 Profile data keys:', Object.keys(profileData || {}));
              console.log('📊 Profile sample:', {
                name: profileData?.name,
                first_name: profileData?.first_name,
                last_name: profileData?.last_name,
                position: profileData?.position,
                about: profileData?.about
              });
              
              // Validate profile data
              if (!profileData.name && !profileData.first_name && !profileData.position && !profileData.headline) {
                console.log('⚠️ LinkedIn profil məlumatları etibarsızdır - boş profil');
                throw new Error('PROFILE_INVALID'); // Special error code
              }
              
              return profileData; // Return first profile
            } else if (data && typeof data === 'object' && Object.keys(data).length > 0 && 
                       !data.status && (data.name || data.first_name || data.position)) {
              console.log('✅ REAL single profile data ready!');
              console.log('📊 Profile data keys:', Object.keys(data));
              console.log('📊 Profile sample:', {
                name: data?.name,
                first_name: data?.first_name,
                last_name: data?.last_name,
                position: data?.position,
                about: data?.about
              });
              
              // Validate profile data
              if (!data.name && !data.first_name && !data.position && !data.headline) {
                console.log('⚠️ LinkedIn profil məlumatları etibarsızdır - boş profil');
                throw new Error('PROFILE_INVALID'); // Special error code
              }
              
              return data;
            } else {
              console.log('⏳ Data not ready yet, status:', data.status);
              console.log('⏳ Continuing to poll...');
            }
          } else if (response.status === 404) {
            console.log('⏳ Snapshot not ready yet (404), continuing...');
          } else {
            const errorText = await response.text();
            console.error(`❌ Polling error: ${response.status} - ${errorText}`);
          }
          
        } catch (error) {
          console.error(`❌ Polling attempt ${attempt} error:`, error);
          
          // If it's a profile validation error, stop immediately
          if (error instanceof Error && error.message === 'PROFILE_INVALID') {
            console.log('🛑 Profile invalid - stopping polling');
            throw new Error('LinkedIn profili tapılmadı və ya etibarsızdır');
          }
          
          // For other errors, continue polling
        }
        
        // Wait before next polling attempt (critical fix)
        const currentElapsed = Date.now() - startTime;
        const remainingTime = totalMaxTime - currentElapsed;
        
        if (remainingTime < pollInterval) {
          console.log(`⏰ Remaining time (${Math.round(remainingTime/1000)}s) less than poll interval`);
          break;
        }
        
        console.log(`⏳ Waiting ${pollInterval/1000}s before next polling attempt...`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      
      const totalElapsed = Date.now() - startTime;
      throw new Error(`REAL BrightData results ${Math.round(totalElapsed/1000)} saniyə sonra hazır olmadı`);
    }
    
    throw new Error('No valid trigger response format received');
  }
}