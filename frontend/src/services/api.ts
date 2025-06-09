const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string; height: number; width: number }>;
  followers: { total: number };
  country: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  popularity: number;
  preview_url: string | null;
  external_urls: { spotify: string };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers: { total: number };
  images: Array<{ url: string; height: number; width: number }>;
  external_urls: { spotify: string };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  tracks: { total: number };
  images: Array<{ url: string; height: number; width: number }>;
  owner: { display_name: string };
}

export interface AudioFeatures {
  id: string;
  danceability: number;
  energy: number;
  key: number;
  loudness: number;
  mode: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
  duration_ms: number;
  time_signature: number;
}

export interface TasteProfile {
  avgDanceability: number;
  avgEnergy: number;
  avgValence: number;
  avgAcousticness: number;
  avgInstrumentalness: number;
  avgLiveness: number;
  avgSpeechiness: number;
  avgTempo: number;
  preferredGenres: { genre: string; weight: number }[];
  preferredArtists: { artistId: string; weight: number }[];
}

export interface UserMusicProfile {
  likedTracks: SpotifyTrack[];
  playlists: SpotifyPlaylist[];
  playlistTracks: { [playlistId: string]: SpotifyTrack[] };
  recentTracks: SpotifyTrack[];
  audioFeatures: { [trackId: string]: AudioFeatures };
  userTasteProfile: TasteProfile;
}

export interface TrackRecommendation {
  track: SpotifyTrack;
  audioFeatures: AudioFeatures;
  similarityScore: number;
  reasons: string[];
  sourceType: 'content-based' | 'collaborative' | 'hybrid' | 'custom';
}

export interface RecommendationResponse {
  success: boolean;
  data: {
    recommendations: TrackRecommendation[];
    userTasteProfile: TasteProfile;
    stats: {
      totalRecommendations: number;
      contentBasedCount: number;
      collaborativeCount: number;
      avgSimilarityScore: number;
    };
  };
}

export interface UserProfileResponse {
  success: boolean;
  data: UserMusicProfile & {
    stats: {
      totalLikedTracks: number;
      totalPlaylists: number;
      totalPlaylistTracks: number;
      totalRecentTracks: number;
      audioFeaturesCount: number;
    };
  };
}

export class ApiService {
  static getAccessToken(): string {
    return localStorage.getItem('spotify_access_token') || '';
  }

  static setAccessToken(token: string): void {
    localStorage.setItem('spotify_access_token', token);
  }

  static getRefreshToken(): string {
    return localStorage.getItem('spotify_refresh_token') || '';
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem('spotify_refresh_token', token);
  }

  static clearTokens(): void {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
  }

  static async isSpotifyConfigured(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/spotify/configured`);
      const data = await response.json();
      return data.configured;
    } catch (error) {
      console.error('Error checking Spotify configuration:', error);
      return false;
    }
  }

  static async getSpotifyAuthUrl(state?: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/spotify/auth-url${state ? `?state=${state}` : ''}`);
    const data = await response.json();
    return data.authUrl;
  }

  static async exchangeCodeForTokens(code: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/spotify/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const data = await response.json();
    this.setAccessToken(data.access_token);
    this.setRefreshToken(data.refresh_token);
  }

  static async refreshAccessToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/spotify/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json();
    this.setAccessToken(data.access_token);
    if (data.refresh_token) {
      this.setRefreshToken(data.refresh_token);
    }
  }

  static async getUserProfile(): Promise<SpotifyUser> {
    const response = await fetch(`${API_BASE_URL}/spotify/me`, {
      headers: {
        'Authorization': `Bearer ${this.getAccessToken()}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.getUserProfile();
      }
      throw new Error('Failed to fetch user profile');
    }

    return response.json();
  }

  static async getTopTracks(timeRange: string = 'medium_term', limit: number = 20): Promise<{ items: SpotifyTrack[] }> {
    const response = await fetch(`${API_BASE_URL}/spotify/top/tracks?time_range=${timeRange}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${this.getAccessToken()}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.getTopTracks(timeRange, limit);
      }
      throw new Error('Failed to fetch top tracks');
    }

    return response.json();
  }

  static async getTopArtists(timeRange: string = 'medium_term', limit: number = 20): Promise<{ items: SpotifyArtist[] }> {
    const response = await fetch(`${API_BASE_URL}/spotify/top/artists?time_range=${timeRange}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${this.getAccessToken()}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.getTopArtists(timeRange, limit);
      }
      throw new Error('Failed to fetch top artists');
    }

    return response.json();
  }

  static async getRecentlyPlayed(limit: number = 20): Promise<{ items: Array<{ track: SpotifyTrack; played_at: string }> }> {
    const response = await fetch(`${API_BASE_URL}/spotify/recently-played?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${this.getAccessToken()}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.getRecentlyPlayed(limit);
      }
      throw new Error('Failed to fetch recently played tracks');
    }

    return response.json();
  }

  static async getAudioFeatures(trackIds: string[]): Promise<{ audio_features: AudioFeatures[] }> {
    const response = await fetch(`${API_BASE_URL}/spotify/audio-features?ids=${trackIds.join(',')}`, {
      headers: {
        'Authorization': `Bearer ${this.getAccessToken()}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.getAudioFeatures(trackIds);
      }
      throw new Error('Failed to fetch audio features');
    }

    return response.json();
  }

  // NEW: Get user's comprehensive music profile
  static async getUserMusicProfile(): Promise<UserProfileResponse> {
    const response = await fetch(`${API_BASE_URL}/spotify/profile`, {
      credentials: 'include', // Use session-based auth
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user music profile');
    }

    return response.json();
  }

  // NEW: Get advanced recommendations
  static async getAdvancedRecommendations(limit: number = 20): Promise<RecommendationResponse> {
    const response = await fetch(`${API_BASE_URL}/spotify/recommendations?limit=${limit}`, {
      credentials: 'include', // Use session-based auth
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recommendations');
    }

    return response.json();
  }

  // NEW: Get custom recommendations based on audio features
  static async getCustomRecommendations(params: {
    audioFeatureTargets?: Partial<AudioFeatures>;
    seedGenres?: string[];
    seedArtists?: string[];
    limit?: number;
  }): Promise<RecommendationResponse> {
    const response = await fetch(`${API_BASE_URL}/spotify/recommendations/custom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Use session-based auth
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch custom recommendations');
    }

    return response.json();
  }

  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/spotify/test`, {
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.testConnection();
      }

      const data = await response.json();
      return data.connected;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
} 