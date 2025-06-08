import axios, { AxiosResponse } from 'axios';
import * as querystring from 'querystring';
import {
  SpotifyTokenResponse,
  SpotifyUser,
  SpotifyTrack,
  SpotifyArtist,
  AudioFeatures,
  SpotifyTopItems,
  RecentlyPlayedResponse
} from '../types/spotify';

export class SpotifyService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private baseUrl = 'https://api.spotify.com/v1';
  private authUrl = 'https://accounts.spotify.com/api/token';
  private authorizeUrl = 'https://accounts.spotify.com/authorize';

  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID || '';
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';

    if (!this.clientId || !this.clientSecret) {
      console.error('Missing Spotify credentials. Please check your environment variables.');
      console.error('Required: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET');
      console.error('Optional: SPOTIFY_REDIRECT_URI (defaults to http://localhost:3000/api/auth/callback)');
    }
  }

  // Check if credentials are properly configured
  public isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  // Generate authorization URL for OAuth flow
  public getAuthUrl(state?: string): string {
    if (!this.isConfigured()) {
      throw new Error('Spotify credentials not properly configured');
    }

    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'user-read-recently-played',
      'user-library-read',
      'playlist-read-private',
      'playlist-read-collaborative'
    ].join(' ');

    const params = querystring.stringify({
      response_type: 'code',
      client_id: this.clientId,
      scope: scopes,
      redirect_uri: this.redirectUri,
      state: state || 'some-state-value'
    });

    return `${this.authorizeUrl}?${params}`;
  }

  // Exchange authorization code for access token
  public async getAccessToken(code: string): Promise<SpotifyTokenResponse> {
    if (!this.isConfigured()) {
      throw new Error('Spotify credentials not properly configured');
    }

    try {
      const authOptions = {
        method: 'POST',
        url: this.authUrl,
        data: querystring.stringify({
          code: code,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code'
        }),
        headers: {
          'Authorization': 'Basic ' + Buffer.from(this.clientId + ':' + this.clientSecret).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      const response: AxiosResponse<SpotifyTokenResponse> = await axios(authOptions);
      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw new Error('Failed to exchange authorization code for access token');
    }
  }

  // Refresh access token using refresh token
  public async refreshAccessToken(refreshToken: string): Promise<SpotifyTokenResponse> {
    if (!this.isConfigured()) {
      throw new Error('Spotify credentials not properly configured');
    }

    try {
      const authOptions = {
        method: 'POST',
        url: this.authUrl,
        data: querystring.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }),
        headers: {
          'Authorization': 'Basic ' + Buffer.from(this.clientId + ':' + this.clientSecret).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      const response: AxiosResponse<SpotifyTokenResponse> = await axios(authOptions);
      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  // Get user profile
  public async getUserProfile(accessToken: string): Promise<SpotifyUser> {
    try {
      const response: AxiosResponse<SpotifyUser> = await axios.get(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  // Get user's top tracks
  public async getTopTracks(
    accessToken: string, 
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
    limit: number = 20
  ): Promise<SpotifyTopItems<SpotifyTrack>> {
    try {
      const response: AxiosResponse<SpotifyTopItems<SpotifyTrack>> = await axios.get(
        `${this.baseUrl}/me/top/tracks`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          params: {
            time_range: timeRange,
            limit: Math.min(limit, 50)
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching top tracks:', error);
      throw new Error('Failed to fetch top tracks');
    }
  }

  // Get user's top artists
  public async getTopArtists(
    accessToken: string,
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
    limit: number = 20
  ): Promise<SpotifyTopItems<SpotifyArtist>> {
    try {
      const response: AxiosResponse<SpotifyTopItems<SpotifyArtist>> = await axios.get(
        `${this.baseUrl}/me/top/artists`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          params: {
            time_range: timeRange,
            limit: Math.min(limit, 50)
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching top artists:', error);
      throw new Error('Failed to fetch top artists');
    }
  }

  // Get recently played tracks
  public async getRecentlyPlayed(
    accessToken: string,
    limit: number = 20
  ): Promise<RecentlyPlayedResponse> {
    try {
      const response: AxiosResponse<RecentlyPlayedResponse> = await axios.get(
        `${this.baseUrl}/me/player/recently-played`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          params: {
            limit: Math.min(limit, 50)
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching recently played tracks:', error);
      throw new Error('Failed to fetch recently played tracks');
    }
  }

  // Get audio features for tracks
  public async getAudioFeatures(
    accessToken: string,
    trackIds: string[]
  ): Promise<AudioFeatures[]> {
    try {
      const response: AxiosResponse<{ audio_features: AudioFeatures[] }> = await axios.get(
        `${this.baseUrl}/audio-features`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          params: {
            ids: trackIds.slice(0, 100).join(',') // API limit is 100 IDs
          }
        }
      );
      return response.data.audio_features.filter((feature: AudioFeatures | null) => feature !== null);
    } catch (error) {
      console.error('Error fetching audio features:', error);
      throw new Error('Failed to fetch audio features');
    }
  }

  // Test API connection
  public async testConnection(accessToken: string): Promise<boolean> {
    try {
      await this.getUserProfile(accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }
} 