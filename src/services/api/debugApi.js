import apiClient from './apiClient';
import SecureStorage from '../storage/SecureStorage';

const debugApi = {
  // Debug endpoint to inspect both access and ID tokens
  debugTokens: async () => {
    const tokens = await SecureStorage.getTokens();
    
    // Send ID token in custom header
    const response = await apiClient.get('/auth/debug-tokens', {
      headers: {
        'x-id-token': tokens.idToken
      }
    });
    
    return response.data;
  }
};

export default debugApi;
