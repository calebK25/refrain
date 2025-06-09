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

// Last.fm interfaces
interface LastFmArtist {
  name: string;
  mbid?: string;
  match?: number;
  url?: string;
  image?: Array<{ size: string; '#text': string }>;
}

interface LastFmTrack {
  name: string;
  artist: {
    name: string;
    mbid?: string;
    url?: string;
  };
  mbid?: string;
  match?: number;
  url?: string;
  image?: Array<{ size: string; '#text': string }>;
}

interface LastFmSimilarArtistsResponse {
  similarartists: {
    artist: LastFmArtist[];
    '@attr': { artist: string };
  };
}

interface LastFmSimilarTracksResponse {
  similartracks: {
    track: LastFmTrack[];
    '@attr': { artist: string; track: string };
  };
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  tracks: { total: number };
  images: Array<{ url: string; height: number; width: number }>;
  owner: { display_name: string };
}

interface UserMusicProfile {
  likedTracks: SpotifyTrack[];
  playlists: SpotifyPlaylist[];
  playlistTracks: { [playlistId: string]: SpotifyTrack[] };
  recentTracks: SpotifyTrack[];
  audioFeatures: { [trackId: string]: AudioFeatures };
  userTasteProfile: TasteProfile;
}

interface TasteProfile {
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

interface TrackRecommendation {
  track: SpotifyTrack;
  audioFeatures: AudioFeatures;
  similarityScore: number;
  reasons: string[];
  sourceType: 'content-based' | 'collaborative' | 'hybrid';
}

// Last.fm API service
class LastFmService {
  private baseUrl = 'http://ws.audioscrobbler.com/2.0/';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.LASTFM_API_KEY || '';
  }

  public isConfigured(): boolean {
    return !!this.apiKey;
  }

  async getSimilarArtists(artistName: string, limit = 30): Promise<LastFmArtist[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          method: 'artist.getSimilar',
          artist: artistName,
          api_key: this.apiKey,
          format: 'json',
          limit,
          autocorrect: 1
        }
      });

      return response.data.similarartists?.artist || [];
    } catch (error: any) {
      console.error(`Last.fm error getting similar artists for ${artistName}:`, error.response?.data || error.message);
      return [];
    }
  }

  async getSimilarTracks(artistName: string, trackName: string, limit = 30): Promise<LastFmTrack[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          method: 'track.getSimilar',
          artist: artistName,
          track: trackName,
          api_key: this.apiKey,
          format: 'json',
          limit,
          autocorrect: 1
        }
      });

      return response.data.similartracks?.track || [];
    } catch (error: any) {
      console.error(`Last.fm error getting similar tracks for ${artistName} - ${trackName}:`, error.response?.data || error.message);
      return [];
    }
  }

  async getTopTracksForTag(tag: string, limit = 50): Promise<LastFmTrack[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          method: 'tag.getTopTracks',
          tag: tag,
          api_key: this.apiKey,
          format: 'json',
          limit
        }
      });

      return response.data.tracks?.track || [];
    } catch (error: any) {
      console.error(`Last.fm error getting top tracks for tag ${tag}:`, error.response?.data || error.message);
      return [];
    }
  }
}

export class SpotifyService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private baseUrl = 'https://api.spotify.com/v1';
  private authUrl = 'https://accounts.spotify.com/api/token';
  private authorizeUrl = 'https://accounts.spotify.com/authorize';
  private lastFmService: LastFmService;

  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID || '';
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';
    this.lastFmService = new LastFmService();

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

  private async makeRequest(endpoint: string, accessToken: string, params?: any) {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error(`Spotify API error for ${endpoint}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async getLikedTracks(accessToken: string, limit = 50, offset = 0): Promise<{ items: Array<{ track: SpotifyTrack }> }> {
    return this.makeRequest('/me/tracks', accessToken, { limit, offset });
  }

  async getAllLikedTracks(accessToken: string): Promise<SpotifyTrack[]> {
    const allTracks: SpotifyTrack[] = [];
    let offset = 0;
    const limit = 50;

    while (true) {
      const response = await this.getLikedTracks(accessToken, limit, offset);
      const tracks = response.items.map(item => item.track);
      allTracks.push(...tracks);

      if (tracks.length < limit) break;
      offset += limit;
    }

    console.log(`Retrieved ${allTracks.length} liked tracks`);
    return allTracks;
  }

  async getUserPlaylists(accessToken: string, limit = 50): Promise<{ items: SpotifyPlaylist[] }> {
    return this.makeRequest('/me/playlists', accessToken, { limit });
  }

  async getPlaylistTracks(accessToken: string, playlistId: string, limit = 100): Promise<{ items: Array<{ track: SpotifyTrack }> }> {
    return this.makeRequest(`/playlists/${playlistId}/tracks`, accessToken, { limit });
  }

  async getTrackAudioFeatures(accessToken: string, trackId: string): Promise<AudioFeatures> {
    return this.makeRequest(`/audio-features/${trackId}`, accessToken);
  }

  async searchTracks(accessToken: string, query: string, limit = 50): Promise<{ tracks: { items: SpotifyTrack[] } }> {
    return this.makeRequest('/search', accessToken, { q: query, type: 'track', limit });
  }

  async getSpotifyRecommendations(
    accessToken: string, 
    seedTracks?: string[], 
    seedArtists?: string[], 
    seedGenres?: string[],
    audioFeatureTargets?: Partial<AudioFeatures>,
    limit = 20
  ): Promise<{ tracks: SpotifyTrack[] }> {
    const params: any = { limit: Math.min(limit, 100) }; // API max limit is 100
    
    // Ensure we have at least one seed (required by API)
    let totalSeeds = 0;
    
    if (seedTracks?.length) {
      params.seed_tracks = seedTracks.slice(0, 5).join(',');
      totalSeeds += seedTracks.slice(0, 5).length;
    }
    
    if (seedArtists?.length && totalSeeds < 5) {
      const allowedArtists = 5 - totalSeeds;
      params.seed_artists = seedArtists.slice(0, allowedArtists).join(',');
      totalSeeds += seedArtists.slice(0, allowedArtists).length;
    }
    
    if (seedGenres?.length && totalSeeds < 5) {
      const allowedGenres = 5 - totalSeeds;
      params.seed_genres = seedGenres.slice(0, allowedGenres).join(',');
      totalSeeds += seedGenres.slice(0, allowedGenres).length;
    }
    
    // API requires at least one seed
    if (totalSeeds === 0) {
      throw new Error('Spotify recommendations API requires at least one seed (track, artist, or genre)');
    }
    
    // Add audio feature targets (optional)
    if (audioFeatureTargets) {
      Object.entries(audioFeatureTargets).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Validate audio feature values are within 0-1 range (except tempo)
          if (key !== 'tempo' && typeof value === 'number' && (value < 0 || value > 1)) {
            console.warn(`Invalid audio feature value for ${key}: ${value}. Must be 0-1.`);
            return;
          }
          params[`target_${key}`] = value;
        }
      });
    }

    console.log('Spotify recommendations request params:', params);
    console.log('Full URL will be:', `${this.baseUrl}/recommendations`);
    console.log('Total seeds:', totalSeeds);

    return this.makeRequest('/recommendations', accessToken, params);
  }

  // New Last.fm-based recommendations method
  async getLastFmRecommendations(
    accessToken: string,
    userProfile: UserMusicProfile,
    limit = 20
  ): Promise<TrackRecommendation[]> {
    if (!this.lastFmService.isConfigured()) {
      console.warn('Last.fm API key not configured, falling back to search-based recommendations');
      return this.getSearchBasedRecommendations(accessToken, userProfile, limit);
    }

    console.log('Getting Last.fm-based recommendations...');
    const recommendations: TrackRecommendation[] = [];
    const seenTracks = new Set<string>();

    // Add user's tracks to seen set to avoid duplicates
    userProfile.likedTracks.forEach(track => seenTracks.add(`${track.artists[0]?.name}-${track.name}`.toLowerCase()));
    userProfile.recentTracks.forEach(track => seenTracks.add(`${track.artists[0]?.name}-${track.name}`.toLowerCase()));

    try {
      // Get similar artists based on user's top artists
      const preferredArtists = userProfile.userTasteProfile.preferredArtists.slice(0, 5);
      
      for (const { artistId } of preferredArtists) {
        // Find the artist name from recent tracks or liked tracks
        const artistName = this.findArtistNameById(artistId, userProfile);
        if (!artistName) continue;

        console.log(`Getting similar artists for: ${artistName}`);
        const similarArtists = await this.lastFmService.getSimilarArtists(artistName, 10);
        
        for (const lastFmArtist of similarArtists.slice(0, 3)) {
          // Get top tracks for this similar artist via Spotify search
          const searchResults = await this.searchTracks(accessToken, `artist:"${lastFmArtist.name}"`, 5);
          
          for (const track of searchResults.tracks.items) {
            const trackKey = `${track.artists[0]?.name}-${track.name}`.toLowerCase();
            if (seenTracks.has(trackKey)) continue;
            
            seenTracks.add(trackKey);
            
            // Get audio features for similarity calculation
            let audioFeatures: AudioFeatures;
            try {
              audioFeatures = await this.getTrackAudioFeatures(accessToken, track.id);
            } catch (error) {
                             // Create mock audio features if failed to fetch
               audioFeatures = {
                 id: track.id,
                 danceability: 0.5,
                 energy: 0.5,
                 valence: 0.5,
                 acousticness: 0.5,
                 instrumentalness: 0.1,
                 liveness: 0.2,
                 speechiness: 0.1,
                 tempo: 120,
                 key: 0,
                 loudness: -10,
                 mode: 1,
                 duration_ms: track.duration_ms || 180000,
                 time_signature: 4
               };
            }

            const similarityScore = this.calculateAudioSimilarity(userProfile.userTasteProfile, audioFeatures);
            const reasons = [
              `Similar to ${artistName} (${Math.round((lastFmArtist.match || 0) * 100)}% match)`,
              'Discovered via Last.fm recommendations'
            ];

            recommendations.push({
              track,
              audioFeatures,
              similarityScore: (lastFmArtist.match || 0.5) * similarityScore,
              reasons,
              sourceType: 'collaborative'
            });

            if (recommendations.length >= limit) break;
          }
          if (recommendations.length >= limit) break;
        }
        if (recommendations.length >= limit) break;
      }

      // If we need more recommendations, get similar tracks for user's favorite tracks
      if (recommendations.length < limit) {
        const favoriteTracksToAnalyze = userProfile.likedTracks.slice(0, 3);
        
        for (const track of favoriteTracksToAnalyze) {
          if (recommendations.length >= limit) break;
          
          const artistName = track.artists[0]?.name;
          const trackName = track.name;
          
          if (!artistName || !trackName) continue;
          
          console.log(`Getting similar tracks for: ${artistName} - ${trackName}`);
          const similarTracks = await this.lastFmService.getSimilarTracks(artistName, trackName, 5);
          
          for (const lastFmTrack of similarTracks) {
            if (recommendations.length >= limit) break;
            
            const trackKey = `${lastFmTrack.artist.name}-${lastFmTrack.name}`.toLowerCase();
            if (seenTracks.has(trackKey)) continue;
            
            seenTracks.add(trackKey);
            
            // Search for this track on Spotify to get full track data
            const searchQuery = `artist:"${lastFmTrack.artist.name}" track:"${lastFmTrack.name}"`;
            const searchResults = await this.searchTracks(accessToken, searchQuery, 1);
            
            if (searchResults.tracks.items.length > 0) {
              const spotifyTrack = searchResults.tracks.items[0];
              
              let audioFeatures: AudioFeatures;
              try {
                audioFeatures = await this.getTrackAudioFeatures(accessToken, spotifyTrack.id);
                             } catch (error) {
                 audioFeatures = {
                   id: spotifyTrack.id,
                   danceability: 0.5,
                   energy: 0.5,
                   valence: 0.5,
                   acousticness: 0.5,
                   instrumentalness: 0.1,
                   liveness: 0.2,
                   speechiness: 0.1,
                   tempo: 120,
                   key: 0,
                   loudness: -10,
                   mode: 1,
                   duration_ms: spotifyTrack.duration_ms || 180000,
                   time_signature: 4
                 };
               }

              const similarityScore = this.calculateAudioSimilarity(userProfile.userTasteProfile, audioFeatures);
              const reasons = [
                `Similar to "${trackName}" by ${artistName} (${Math.round((lastFmTrack.match || 0) * 100)}% match)`,
                'Track-based Last.fm recommendation'
              ];

              recommendations.push({
                track: spotifyTrack,
                audioFeatures,
                similarityScore: (lastFmTrack.match || 0.5) * similarityScore,
                reasons,
                sourceType: 'content-based'
              });
            }
          }
        }
      }

    } catch (error) {
      console.error('Error getting Last.fm recommendations:', error);
    }

    // Shuffle recommendations to ensure variety on refresh
    const shuffledRecommendations = [...recommendations].sort(() => Math.random() - 0.5);
    
    // Sort by similarity score but keep some randomness
    return shuffledRecommendations
      .sort((a, b) => b.similarityScore - a.similarityScore + (Math.random() - 0.5) * 0.2)
      .slice(0, limit);
  }

  private findArtistNameById(artistId: string, userProfile: UserMusicProfile): string | null {
    // Look for artist name in liked tracks
    for (const track of userProfile.likedTracks) {
      const artist = track.artists.find(a => a.id === artistId);
      if (artist) return artist.name;
    }
    
    // Look for artist name in recent tracks
    for (const track of userProfile.recentTracks) {
      const artist = track.artists.find(a => a.id === artistId);
      if (artist) return artist.name;
    }
    
    return null;
  }

  private async getSearchBasedRecommendations(
    accessToken: string,
    userProfile: UserMusicProfile,
    limit: number
  ): Promise<TrackRecommendation[]> {
    console.log('Falling back to genre-based search recommendations...');
    const recommendations: TrackRecommendation[] = [];
    
    // Use preferred genres for search
    const topGenres = userProfile.userTasteProfile.preferredGenres.slice(0, 3);
    
    for (const { genre } of topGenres) {
      if (recommendations.length >= limit) break;
      
      const searchQuery = `genre:"${genre}" year:2020-2024`;
      const searchResults = await this.searchTracks(accessToken, searchQuery, 10);
      
      for (const track of searchResults.tracks.items) {
        if (recommendations.length >= limit) break;
        
                 // Mock audio features and create recommendation
         const audioFeatures: AudioFeatures = {
           id: track.id,
           danceability: 0.7,
           energy: 0.8,
           valence: 0.6,
           acousticness: 0.3,
           instrumentalness: 0.1,
           liveness: 0.2,
           speechiness: 0.1,
           tempo: 120,
           key: 0,
           loudness: -10,
           mode: 1,
           duration_ms: track.duration_ms || 180000,
           time_signature: 4
         };

        recommendations.push({
          track,
          audioFeatures,
          similarityScore: 0.75,
          reasons: [`Based on your interest in ${genre}`, 'Genre-based discovery'],
          sourceType: 'content-based'
        });
      }
    }
    
    return recommendations;
  }

  async buildUserMusicProfile(accessToken: string): Promise<UserMusicProfile> {
    console.log('Building comprehensive user music profile...');

    const [
      likedTracks,
      userPlaylists,
      recentTracksResponse,
      topTracks,
      topArtists
    ] = await Promise.all([
      this.getAllLikedTracks(accessToken).catch(err => {
        console.warn('Error fetching liked tracks:', err.message);
        return [];
      }),
      this.getUserPlaylists(accessToken).catch(err => {
        console.warn('Error fetching playlists:', err.message);
        return { items: [] };
      }),
      this.getRecentlyPlayed(accessToken).catch(err => {
        console.warn('Error fetching recent tracks:', err.message);
        return { items: [] };
      }),
      this.getTopTracks(accessToken, 'medium_term', 50).catch(err => {
        console.warn('Error fetching top tracks:', err.message);
        return { items: [] };
      }),
      this.getTopArtists(accessToken, 'medium_term', 50).catch(err => {
        console.warn('Error fetching top artists:', err.message);
        return { items: [] };
      })
    ]);

    const recentTracks = recentTracksResponse.items.map((item: any) => item.track);

    const playlistTracks: { [playlistId: string]: SpotifyTrack[] } = {};
    const userPlaylists_items = userPlaylists.items.filter(playlist => playlist.owner.display_name !== 'Spotify');
    
    for (const playlist of userPlaylists_items.slice(0, 10)) {
      try {
        const tracks = await this.getPlaylistTracks(accessToken, playlist.id);
        playlistTracks[playlist.id] = tracks.items.map(item => item.track).filter(track => track);
      } catch (error) {
        console.error(`Error getting playlist ${playlist.name}:`, error);
        playlistTracks[playlist.id] = [];
      }
    }

    // Prioritize tracks for audio features analysis
    const priorityTracks = new Set<SpotifyTrack>();
    const allTracks = new Set<SpotifyTrack>();
    
    // Add top tracks first (highest priority)
    topTracks.items.forEach((track: SpotifyTrack) => {
      priorityTracks.add(track);
      allTracks.add(track);
    });
    
    // Add recent tracks (medium priority)
    recentTracks.forEach(track => {
      if (priorityTracks.size < 200) priorityTracks.add(track);
      allTracks.add(track);
    });
    
    // Add some liked tracks (lower priority)
    likedTracks.slice(0, 300).forEach(track => {
      if (priorityTracks.size < 500) priorityTracks.add(track);
      allTracks.add(track);
    });
    
    // Add playlist tracks last
    Object.values(playlistTracks).flat().forEach(track => allTracks.add(track));

    const uniqueTracks = Array.from(allTracks);
    const priorityTrackIds = Array.from(priorityTracks).map(track => track.id).filter(id => id);
    
    console.log(`Total tracks: ${uniqueTracks.length}, Priority tracks for analysis: ${priorityTrackIds.length}`);

    const audioFeatures: { [trackId: string]: AudioFeatures } = {};
    const batchSize = 100;
    
    // Use priority tracks for audio features analysis
    console.log(`Processing audio features for ${priorityTrackIds.length} priority tracks`);
    
    for (let i = 0; i < priorityTrackIds.length; i += batchSize) {
      const batch = priorityTrackIds.slice(i, i + batchSize);
      try {
        const featuresResponse = await this.getAudioFeatures(accessToken, batch);
        featuresResponse.forEach((features: AudioFeatures) => {
          if (features && features.id) {
            audioFeatures[features.id] = features;
          }
        });
        console.log(`✓ Processed audio features batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(priorityTrackIds.length/batchSize)}`);
      } catch (error) {
        console.error(`Error getting audio features for batch ${i}:`, error);
        // Continue with next batch instead of failing completely
      }
    }

    const userTasteProfile = this.calculateTasteProfile(uniqueTracks, audioFeatures, topArtists.items);

    console.log(`Built profile: ${likedTracks.length} liked tracks, ${Object.keys(playlistTracks).length} playlists, ${Object.keys(audioFeatures).length} audio features`);

    return {
      likedTracks,
      playlists: userPlaylists.items,
      playlistTracks,
      recentTracks,
      audioFeatures,
      userTasteProfile
    };
  }

  private calculateTasteProfile(tracks: SpotifyTrack[], audioFeatures: { [trackId: string]: AudioFeatures }, topArtists: SpotifyArtist[]): TasteProfile {
    const validFeatures = tracks
      .map(track => audioFeatures[track.id])
      .filter(features => features);

    console.log(`Calculating taste profile from ${validFeatures.length} tracks with audio features (out of ${tracks.length} total tracks)`);

    if (validFeatures.length === 0) {
      console.warn('No audio features available, using default taste profile');
      // Return a default taste profile instead of throwing an error
      return {
        avgDanceability: 0.5,
        avgEnergy: 0.5,
        avgValence: 0.5,
        avgAcousticness: 0.5,
        avgInstrumentalness: 0.1,
        avgLiveness: 0.2,
        avgSpeechiness: 0.1,
        avgTempo: 120,
        preferredGenres: topArtists.slice(0, 10).flatMap(artist => 
          artist.genres.map(genre => ({ genre, weight: artist.popularity }))
        ).slice(0, 10),
        preferredArtists: topArtists
          .map(artist => ({ artistId: artist.id, weight: artist.popularity }))
          .slice(0, 20)
      };
    }

    const avgDanceability = validFeatures.reduce((sum, f) => sum + f.danceability, 0) / validFeatures.length;
    const avgEnergy = validFeatures.reduce((sum, f) => sum + f.energy, 0) / validFeatures.length;
    const avgValence = validFeatures.reduce((sum, f) => sum + f.valence, 0) / validFeatures.length;
    const avgAcousticness = validFeatures.reduce((sum, f) => sum + f.acousticness, 0) / validFeatures.length;
    const avgInstrumentalness = validFeatures.reduce((sum, f) => sum + f.instrumentalness, 0) / validFeatures.length;
    const avgLiveness = validFeatures.reduce((sum, f) => sum + f.liveness, 0) / validFeatures.length;
    const avgSpeechiness = validFeatures.reduce((sum, f) => sum + f.speechiness, 0) / validFeatures.length;
    const avgTempo = validFeatures.reduce((sum, f) => sum + f.tempo, 0) / validFeatures.length;

    const genreCount: { [genre: string]: number } = {};
    topArtists.forEach(artist => {
      artist.genres.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + artist.popularity;
      });
    });

    const preferredGenres = Object.entries(genreCount)
      .map(([genre, weight]) => ({ genre, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);

    const preferredArtists = topArtists
      .map(artist => ({ artistId: artist.id, weight: artist.popularity }))
      .slice(0, 20);

    return {
      avgDanceability,
      avgEnergy,
      avgValence,
      avgAcousticness,
      avgInstrumentalness,
      avgLiveness,
      avgSpeechiness,
      avgTempo,
      preferredGenres,
      preferredArtists
    };
  }

  async generateAdvancedRecommendations(accessToken: string, userProfile: UserMusicProfile, limit = 20): Promise<TrackRecommendation[]> {
    console.log('Generating advanced recommendations...');

    const userTrackIds = new Set<string>();
    userProfile.likedTracks.forEach(track => userTrackIds.add(track.id));
    Object.values(userProfile.playlistTracks).flat().forEach(track => userTrackIds.add(track.id));
    userProfile.recentTracks.forEach(track => userTrackIds.add(track.id));

    const recommendations: TrackRecommendation[] = [];

    const contentRecommendations = await this.getContentBasedRecommendations(
      accessToken, 
      userProfile, 
      userTrackIds, 
      Math.ceil(limit * 0.6)
    );
    recommendations.push(...contentRecommendations);

    const artistRecommendations = await this.getArtistBasedRecommendations(
      accessToken, 
      userProfile, 
      userTrackIds, 
      Math.ceil(limit * 0.4)
    );
    recommendations.push(...artistRecommendations);

    const uniqueRecommendations = recommendations
      .filter((rec, index, arr) => 
        !userTrackIds.has(rec.track.id) && 
        arr.findIndex(r => r.track.id === rec.track.id) === index
      )
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    console.log(`Generated ${uniqueRecommendations.length} unique recommendations`);
    return uniqueRecommendations;
  }

  private async getContentBasedRecommendations(
    accessToken: string, 
    userProfile: UserMusicProfile, 
    excludeTrackIds: Set<string>, 
    limit: number
  ): Promise<TrackRecommendation[]> {
    const { userTasteProfile } = userProfile;

    const seedArtists = userTasteProfile.preferredArtists.slice(0, 2).map(a => a.artistId);
    const seedGenres = userTasteProfile.preferredGenres.slice(0, 3).map(g => g.genre);

    const spotifyRecs = await this.getSpotifyRecommendations(
      accessToken,
      undefined,
      seedArtists,
      seedGenres,
      {
        danceability: userTasteProfile.avgDanceability,
        energy: userTasteProfile.avgEnergy,
        valence: userTasteProfile.avgValence,
        acousticness: userTasteProfile.avgAcousticness,
        tempo: userTasteProfile.avgTempo
      },
      limit
    );

    const trackIds = spotifyRecs.tracks.map(track => track.id);
    const audioFeaturesResponse = await this.getAudioFeatures(accessToken, trackIds);
    const trackAudioFeatures: { [id: string]: AudioFeatures } = {};
    
    audioFeaturesResponse.forEach((features: AudioFeatures) => {
      if (features && features.id) {
        trackAudioFeatures[features.id] = features;
      }
    });

    const recommendations: TrackRecommendation[] = spotifyRecs.tracks
      .filter(track => !excludeTrackIds.has(track.id) && trackAudioFeatures[track.id])
      .map(track => {
        const features = trackAudioFeatures[track.id];
        const similarityScore = this.calculateAudioSimilarity(userTasteProfile, features);
        
        const reasons = this.generateReasons(userTasteProfile, features, track);

        return {
          track,
          audioFeatures: features,
          similarityScore,
          reasons,
          sourceType: 'content-based' as const
        };
      });

    return recommendations;
  }

  private async getArtistBasedRecommendations(
    accessToken: string, 
    userProfile: UserMusicProfile, 
    excludeTrackIds: Set<string>, 
    limit: number
  ): Promise<TrackRecommendation[]> {
    const recommendations: TrackRecommendation[] = [];

    for (const artistPref of userProfile.userTasteProfile.preferredArtists.slice(0, 5)) {
      try {
        const recs = await this.getSpotifyRecommendations(
          accessToken,
          undefined,
          [artistPref.artistId],
          undefined,
          undefined,
          Math.ceil(limit / 5)
        );

        for (const track of recs.tracks) {
          if (!excludeTrackIds.has(track.id) && recommendations.length < limit) {
            const audioFeatures = await this.getTrackAudioFeatures(accessToken, track.id);
            const similarityScore = this.calculateAudioSimilarity(userProfile.userTasteProfile, audioFeatures);
            
            recommendations.push({
              track,
              audioFeatures,
              similarityScore,
              reasons: [`Similar to your favorite artists`],
              sourceType: 'collaborative' as const
            });
          }
        }
      } catch (error) {
        console.error(`Error getting artist recommendations for ${artistPref.artistId}:`, error);
      }
    }

    return recommendations;
  }

  private calculateAudioSimilarity(userTaste: TasteProfile, trackFeatures: AudioFeatures): number {
    const weights = {
      danceability: 0.15,
      energy: 0.15,
      valence: 0.15,
      acousticness: 0.1,
      instrumentalness: 0.05,
      liveness: 0.05,
      speechiness: 0.05,
      tempo: 0.1
    };

    let totalSimilarity = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([feature, weight]) => {
      const userValue = userTaste[`avg${feature.charAt(0).toUpperCase() + feature.slice(1)}` as keyof TasteProfile] as number;
      const trackValue = feature === 'tempo' 
        ? trackFeatures.tempo / 200
        : trackFeatures[feature as keyof AudioFeatures] as number;

      if (userValue !== undefined && trackValue !== undefined) {
        const difference = Math.abs(userValue - trackValue);
        const similarity = 1 - difference;
        totalSimilarity += similarity * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? (totalSimilarity / totalWeight) : 0;
  }

  private generateReasons(userTaste: TasteProfile, trackFeatures: AudioFeatures, track: SpotifyTrack): string[] {
    const reasons: string[] = [];

    if (Math.abs(userTaste.avgEnergy - trackFeatures.energy) < 0.2) {
      reasons.push(`Matches your energy level (${Math.round(trackFeatures.energy * 100)}%)`);
    }

    if (Math.abs(userTaste.avgDanceability - trackFeatures.danceability) < 0.2) {
      reasons.push(`Perfect danceability for you (${Math.round(trackFeatures.danceability * 100)}%)`);
    }

    if (Math.abs(userTaste.avgValence - trackFeatures.valence) < 0.2) {
      reasons.push(`Matches your mood preferences (${Math.round(trackFeatures.valence * 100)}% positivity)`);
    }

    if (track.popularity > 70) {
      reasons.push('Popular track you might have missed');
    } else if (track.popularity < 30) {
      reasons.push('Hidden gem discovery');
    }

    if (reasons.length === 0) {
      reasons.push('Based on your overall music taste');
    }

    return reasons;
  }
} 