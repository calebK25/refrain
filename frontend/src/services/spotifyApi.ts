import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  followers: {
    total: number;
  };
  country: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  popularity: number;
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  followers: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
}

export interface AuthResponse {
  authUrl: string;
  state: string;
}

export interface UserResponse {
  user: SpotifyUser;
}

export interface TopTracksResponse {
  items: SpotifyTrack[];
  total: number;
  limit: number;
  offset: number;
}

export interface TopArtistsResponse {
  items: SpotifyArtist[];
  total: number;
  limit: number;
  offset: number;
}

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;

class SpotifyApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Check backend health and configuration
  async checkHealth(): Promise<{ status: string; spotify_configured: boolean }> {
    try {
      const response: AxiosResponse<{ status: string; spotify_configured: boolean }> = 
        await axios.get(`${this.baseUrl}/auth/health`);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('Backend service is not available');
    }
  }

  // Start authentication flow
  async startAuth(): Promise<AuthResponse> {
    console.log('SpotifyApiService.startAuth() called');
    console.log('Base URL:', this.baseUrl);
    try {
      console.log('Making request to:', `${this.baseUrl}/auth/login`);
      const response: AxiosResponse<AuthResponse> = await axios.get(`${this.baseUrl}/auth/login`);
      console.log('Response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Auth start failed:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
      throw new Error('Failed to start authentication');
    }
  }

  // Handle authentication callback
  async handleCallback(code: string, state: string): Promise<UserResponse> {
    try {
      const response: AxiosResponse<UserResponse> = await axios.get(
        `${this.baseUrl}/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
      );
      return response.data;
    } catch (error) {
      console.error('Auth callback failed:', error);
      throw new Error('Authentication callback failed');
    }
  }

  // Exchange temp token for session
  async exchangeToken(token: string): Promise<UserResponse> {
    try {
      const response: AxiosResponse<UserResponse> = await axios.post(`${this.baseUrl}/auth/exchange-token`, { token });
      return response.data;
    } catch (error) {
      // Silently handle token exchange failure
      throw new Error('Authentication expired');
    }
  }

  // Get current user
  async getCurrentUser(): Promise<UserResponse> {
    try {
      const response: AxiosResponse<UserResponse> = await axios.get(`${this.baseUrl}/auth/me`);
      return response.data;
    } catch (error) {
      console.error('Get current user failed:', error);
      throw new Error('Failed to get current user');
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/auth/logout`);
    } catch (error) {
      console.error('Logout failed:', error);
      throw new Error('Logout failed');
    }
  }

  // Get top tracks
  async getTopTracks(
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
    limit: number = 20
  ): Promise<TopTracksResponse> {
    try {
      const response: AxiosResponse<TopTracksResponse> = await axios.get(
        `${this.baseUrl}/auth/top-tracks?time_range=${timeRange}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Get top tracks failed:', error);
      throw new Error('Failed to get top tracks');
    }
  }

  // Get top artists
  async getTopArtists(
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
    limit: number = 20
  ): Promise<TopArtistsResponse> {
    try {
      const response: AxiosResponse<TopArtistsResponse> = await axios.get(
        `${this.baseUrl}/auth/top-artists?time_range=${timeRange}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Get top artists failed:', error);
      throw new Error('Failed to get top artists');
    }
  }

  // Get recently played tracks
  async getRecentlyPlayed(limit: number = 20): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/auth/recently-played?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Get recently played failed:', error);
      throw new Error('Failed to get recently played tracks');
    }
  }
}

export const spotifyApi = new SpotifyApiService(); 