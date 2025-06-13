import { StreamVideoClient } from '@stream-io/video-react-native-sdk';

// Stream configuration - Replace with your actual Stream API key
const STREAM_CONFIG = {
  apiKey: 'v6u8szvh8ahb', // Replace with your actual Stream API key from dashboard
  // Never put your API secret here - it should only be on your backend server
};

class StreamVideoService {
  constructor() {
    this.client = null;
    this.currentCall = null;
  }

  // Initialize the Stream client with user credentials
  async initializeClient(user) {
    try {
      if (this.client) {
        await this.client.disconnectUser();
      }

              // For authenticated Supabase users, we need a proper token
        const userId = user.id.toString();
        
        let clientConfig = {
          apiKey: STREAM_CONFIG.apiKey,
          user: {
            id: userId,
            name: user.full_name || user.name || `User ${userId}`,
            image: user.avatar_url || `https://getstream.io/random_svg/?id=${userId}`,
          },
        };

        // Get token from your backend for authenticated users
        const token = await this.getAuthToken(userId);
        clientConfig.token = token;
        
        this.client = new StreamVideoClient(clientConfig);
        console.log('Stream client initialized with token for user:', userId);
        return this.client;
    } catch (error) {
      console.error('Failed to initialize Stream client:', error);
      throw error;
    }
  }

  // Get authentication token from your backend
  async getAuthToken(userId) {
    // This method calls your backend API to get a proper JWT token for authenticated Supabase users
    
    try {
      // Replace this URL with your actual backend endpoint
      // You'll need to create this endpoint in your backend (Supabase Edge Functions, Vercel, etc.)
      const response = await fetch('https://fgarksnsdfvkclhzahmq.supabase.co/functions/v1/stream-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include Supabase auth header if needed
          'Authorization': `Bearer ${await this.getSupabaseAuthToken()}`,
        },
        body: JSON.stringify({ 
          userId: userId,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.token;
      } else {
        throw new Error(`Failed to get token: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to get token from backend:', error.message);
      throw new Error('Authentication failed - please try logging in again');
    }
  }

  // Get Supabase auth token for backend requests
  async getSupabaseAuthToken() {
    // Import supabase here or pass it as parameter
    const supabase = require('./supabaseService').default;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }

  // Create a development token (NOT for production use)
  createDevToken(userId) {
    try {
      // Create a minimal JWT header
      const header = {
        alg: 'HS256',
        typ: 'JWT'
      };
      
      // Create a minimal payload
      const payload = {
        user_id: userId.toString(),
        iss: 'stream-video-dev',
        sub: userId.toString(),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
      };
      
      // Base64 encode header and payload
      const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
      const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
      
      // Create a dev signature (not cryptographically secure)
      const signature = this.base64UrlEncode('dev-signature');
      
      return `${encodedHeader}.${encodedPayload}.${signature}`;
    } catch (error) {
      console.error('Failed to create dev token:', error);
      return undefined;
    }
  }

  // Base64 URL encode helper
  base64UrlEncode(str) {
    const base64 = btoa(str);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  // Create a video call
  async createCall(callId, callType = 'default') {
    try {
      if (!this.client) {
        throw new Error('Stream client not initialized');
      }

      this.currentCall = this.client.call(callType, callId);
      return this.currentCall;
    } catch (error) {
      console.error('Failed to create call:', error);
      throw error;
    }
  }

  // Join a video call
  async joinCall(call, options = {}) {
    try {
      // Join call with create: true - Stream will automatically create users as needed
      await call.join({ 
        create: true,
        ...options 
      });
      return call;
    } catch (error) {
      console.error('Failed to join call:', error);
      throw error;
    }
  }

  // Leave the current call
  async leaveCall() {
    try {
      if (this.currentCall) {
        await this.currentCall.leave();
        this.currentCall = null;
      }
    } catch (error) {
      console.error('Failed to leave call:', error);
    }
  }

  // End the call for all participants
  async endCall() {
    try {
      if (this.currentCall) {
        await this.currentCall.endCall();
        this.currentCall = null;
      }
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  }

  // Generate a unique call ID
  generateCallId(prefix = 'healthcare') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Disconnect the client
  async disconnect() {
    try {
      if (this.currentCall) {
        await this.leaveCall();
      }
      if (this.client) {
        await this.client.disconnectUser();
        this.client = null;
      }
    } catch (error) {
      console.error('Failed to disconnect Stream client:', error);
    }
  }

  // Get the current client
  getClient() {
    return this.client;
  }

  // Get the current call
  getCurrentCall() {
    return this.currentCall;
  }
}

// Export a singleton instance
export default new StreamVideoService(); 