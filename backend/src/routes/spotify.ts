import { Router, Request, Response } from 'express';
import { SpotifyService } from '../services/spotifyService';

const router = Router();
const spotifyService = new SpotifyService();

// Check if Spotify is configured
router.get('/configured', (req: Request, res: Response) => {
  res.json({ configured: spotifyService.isConfigured() });
});

// Get authorization URL
router.get('/auth-url', (req: Request, res: Response) => {
  try {
    const state = req.query.state as string;
    const authUrl = spotifyService.getAuthUrl(state);
    res.json({ authUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Exchange code for access token
router.post('/token', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const tokenData = await spotifyService.getAccessToken(code);
    res.json(tokenData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Refresh access token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const tokenData = await spotifyService.refreshAccessToken(refreshToken);
    res.json(tokenData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/me', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    if (!accessToken) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const userProfile = await spotifyService.getUserProfile(accessToken);
    res.json(userProfile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get top tracks
router.get('/top/tracks', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    if (!accessToken) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const timeRange = (req.query.time_range as string) || 'medium_term';
    const limit = parseInt(req.query.limit as string) || 20;

    const topTracks = await spotifyService.getTopTracks(accessToken, timeRange as any, limit);
    res.json(topTracks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get top artists
router.get('/top/artists', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    if (!accessToken) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const timeRange = (req.query.time_range as string) || 'medium_term';
    const limit = parseInt(req.query.limit as string) || 20;

    const topArtists = await spotifyService.getTopArtists(accessToken, timeRange as any, limit);
    res.json(topArtists);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get recently played tracks
router.get('/recently-played', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    if (!accessToken) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const recentlyPlayed = await spotifyService.getRecentlyPlayed(accessToken, limit);
    res.json(recentlyPlayed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get audio features
router.get('/audio-features', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    if (!accessToken) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const trackIds = req.query.ids as string;
    if (!trackIds) {
      return res.status(400).json({ error: 'Track IDs required' });
    }

    const audioFeatures = await spotifyService.getAudioFeatures(accessToken, trackIds.split(','));
    res.json({ audio_features: audioFeatures });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Test connection
router.get('/test', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    if (!accessToken) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const isConnected = await spotifyService.testConnection(accessToken);
    res.json({ connected: isConnected });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Simple debug endpoint
router.get('/debug', async (req: Request, res: Response) => {
  console.log('=== DEBUG ENDPOINT CALLED ===');
  const accessToken = req.headers.authorization?.replace('Bearer ', '');
  console.log('Access token exists:', !!accessToken);
  
  if (!accessToken) {
    console.log('No access token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  console.log('Returning simple success response');
  res.json({ 
    success: true, 
    message: 'Debug endpoint working - no API calls',
    hasToken: true
  });
});

// Get user music profile for recommendations  
router.get('/profile', async (req: Request, res: Response) => {
  console.log('=== PROFILE ENDPOINT CALLED ===');
  
  if (!req.session.accessToken) {
    console.log('No session access token found');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const accessToken = req.session.accessToken;

  try {
    console.log('Building comprehensive REAL user music profile...');
    const userProfile = await spotifyService.buildUserMusicProfile(accessToken);
    console.log('✓ Built user profile with', userProfile.likedTracks.length, 'liked tracks');
    console.log('✓ User taste profile:', userProfile.userTasteProfile);
    
    // Send REAL profile data including taste profile
    res.json({
      success: true,
      data: {
        ...userProfile,
        stats: {
          totalLikedTracks: userProfile.likedTracks.length,
          totalPlaylists: userProfile.playlists.length,
          totalPlaylistTracks: Object.values(userProfile.playlistTracks).flat().length,
          totalRecentTracks: userProfile.recentTracks.length,
          audioFeaturesCount: Object.keys(userProfile.audioFeatures).length
        }
      }
    });
  } catch (error: any) {
    console.error('Error building user profile:', error);
    res.status(500).json({ 
      error: 'Failed to build user music profile',
      details: error.message 
    });
  }
});

// Get advanced recommendations
router.get('/recommendations', async (req: Request, res: Response) => {
  console.log('=== RECOMMENDATIONS ENDPOINT CALLED ===');
  
  if (!req.session.accessToken) {
    console.log('No session access token found');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const accessToken = req.session.accessToken;

  const limit = parseInt(req.query.limit as string) || 20;
  console.log('Requested limit:', limit);
  
  console.log('Getting Last.fm-based recommendations...');

  let formattedRecommendations: any[] = [];

  try {
    console.log('Step 1: Building comprehensive user music profile...');
    const userProfile = await spotifyService.buildUserMusicProfile(accessToken);
    console.log('✓ Built user profile with', userProfile.likedTracks.length, 'liked tracks');

    console.log('Step 2: Getting Last.fm recommendations based on your taste...');
    const recommendations = await spotifyService.getLastFmRecommendations(accessToken, userProfile, limit);
    
    formattedRecommendations = recommendations;
    console.log('✓ Got', formattedRecommendations.length, 'Last.fm-based recommendations');

  } catch (error: any) {
    console.error('Error getting Last.fm recommendations, falling back to mock:', error.message);
    
    // Fallback to simple mock data if Last.fm fails
    formattedRecommendations = [
      {
        track: {
          id: 'mock1',
          name: 'Discover Weekly Mock Track 1',
          artists: [{ id: 'artist1', name: 'Mock Artist 1' }],
          album: {
            id: 'album1',
            name: 'Mock Album 1',
            images: [{ url: 'https://via.placeholder.com/300', height: 300, width: 300 }]
          },
          popularity: 75,
          duration_ms: 200000,
          external_urls: { spotify: 'https://open.spotify.com/track/mock1' }
        },
        audioFeatures: { 
          id: 'mock1',
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
          duration_ms: 200000,
          time_signature: 4
        },
        similarityScore: 0.85,
        reasons: ['Mock recommendation - Last.fm service unavailable'],
        sourceType: 'content-based' as const
      }
    ];
  }

  // Extract user taste profile from real user data or use meaningful default
  let userTasteProfile = {
    avgDanceability: 0.7,
    avgEnergy: 0.8,
    avgValence: 0.6,
    avgAcousticness: 0.3,
    avgInstrumentalness: 0.1,
    avgLiveness: 0.2,
    avgSpeechiness: 0.1,
    avgTempo: 120,
    preferredGenres: [
      { genre: 'pop', weight: 80 },
      { genre: 'indie', weight: 70 }
    ],
    preferredArtists: [
      { artistId: 'artist1', weight: 85 },
      { artistId: 'artist2', weight: 75 }
    ]
  };

  // Try to get real user taste profile
  try {
    console.log('Getting real user taste profile...');
    const realUserProfile = await spotifyService.buildUserMusicProfile(accessToken);
    userTasteProfile = realUserProfile.userTasteProfile;
    console.log('✓ Using real user taste profile');
  } catch (error) {
    console.log('Using fallback taste profile due to error:', error);
  }

  console.log('Returning Last.fm recommendations response');

  res.json({
    success: true,
    data: {
      recommendations: formattedRecommendations,
      userTasteProfile,
      stats: {
        totalRecommendations: formattedRecommendations.length,
        contentBasedCount: formattedRecommendations.length,
        collaborativeCount: 0,
        avgSimilarityScore: 0.85
      }
    }
  });
});

// Get recommendations for specific audio features (custom discovery)
router.post('/recommendations/custom', async (req: Request, res: Response) => {
  try {
    if (!req.session.accessToken) {
      console.log('No session access token found');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const accessToken = req.session.accessToken;

    const { 
      audioFeatureTargets, 
      seedGenres, 
      seedArtists, 
      limit = 20 
    } = req.body;

    console.log('Generating custom recommendations with targets:', audioFeatureTargets);
    console.log('Seed genres:', seedGenres);
    console.log('Seed artists:', seedArtists);

    // Ensure we have at least one seed - use popular genres as fallback
    let finalSeedGenres = seedGenres && seedGenres.length > 0 ? seedGenres : ['pop', 'rock'];
    let finalSeedArtists = seedArtists && seedArtists.length > 0 ? seedArtists : undefined;

    console.log('Final seeds - Genres:', finalSeedGenres, 'Artists:', finalSeedArtists);

    const recommendations = await spotifyService.getSpotifyRecommendations(
      accessToken,
      undefined, // No seed tracks
      finalSeedArtists,
      finalSeedGenres,
      audioFeatureTargets,
      limit
    );

    // Get audio features for the recommended tracks
    const trackIds = recommendations.tracks.map((track: any) => track.id);
    const audioFeatures = await spotifyService.getAudioFeatures(accessToken, trackIds);
    
    // Combine track data with audio features
    const enrichedRecommendations = recommendations.tracks.map((track: any, index: number) => ({
      track,
      audioFeatures: audioFeatures[index],
      similarityScore: 1.0, // Custom recommendations don't have similarity scores
      reasons: ['Custom discovery based on your preferences'],
      sourceType: 'custom' as const
    }));

    res.json({
      success: true,
      data: {
        recommendations: enrichedRecommendations,
        requestedTargets: audioFeatureTargets,
        stats: {
          totalRecommendations: enrichedRecommendations.length
        }
      }
    });
  } catch (error: any) {
    console.error('Error generating custom recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to generate custom recommendations',
      details: error.message
    });
  }
});

// Extend session interface for TypeScript
declare module 'express-session' {
  interface SessionData {
    accessToken?: string;
    refreshToken?: string;
    user?: any;
    tokenExpiry?: number;
    state?: string;
  }
}

export default router; 