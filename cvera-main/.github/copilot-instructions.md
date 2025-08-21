      
  const axios = require('axios');
  
  const api_key = '6882894b855f5678d36484c8';
  const url = 'https://api.scrapingdog.com/linkedin';
  
  const params = {
    api_key: api_key,
    type: 'profile',
    linkId: 'musayevcreate',
    premium: 'false',
  };
  
  axios
    .get(url, { params: params })
    .then(function (response) {
      if (response.status === 200) {
        const data = response.data;
        console.log(data);
      } else {
        console.log('Request failed with status code: ' + response.status);
      }
    })
    .catch(function (error) {
      console.error('Error making the request: ' + error.message);
    });