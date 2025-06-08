import express, { Request, Response } from 'express';
import { SpotifyService } from '../services/spotifyService';

const router = express.Router();
const spotifyService = new SpotifyService();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    spotify_configured: spotifyService.isConfigured(),
    timestamp: new Date().toISOString()
  });
});

// Get authorization URL
router.get('/login', (req: Request, res: Response) => {
  try {
    if (!spotifyService.isConfigured()) {
      return res.status(500).json({ 
        error: 'Spotify credentials not configured',
        message: 'Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables'
      });
    }

    const state = Math.random().toString(36).substring(7);
    const authUrl = spotifyService.getAuthUrl(state);
    
    // Store state in session for verification
    req.session.state = state;
    
    res.json({ authUrl, state });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

// Handle callback from Spotify
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (error) {
      return res.redirect(`${frontendUrl}/?error=authorization_denied&details=${encodeURIComponent(error as string)}`);
    }

    if (!code || typeof code !== 'string') {
      return res.redirect(`${frontendUrl}/?error=missing_code`);
    }

    if (!state || typeof state !== 'string') {
      return res.redirect(`${frontendUrl}/?error=missing_state`);
    }

    // For development with ngrok, we'll skip strict state verification
    // In production, implement proper state storage (Redis) for security
    console.log('Callback - State from Spotify:', state);
    console.log('Callback - Session state:', req.session.state);
    
    // Skip state verification for development with ngrok
    // This is a temporary workaround for cross-domain session issues

    // Exchange code for tokens
    console.log('Exchanging code for tokens...');
    const tokenResponse = await spotifyService.getAccessToken(code);
    console.log('Token response received, getting user profile...');
    
    // Get user profile
    const userProfile = await spotifyService.getUserProfile(tokenResponse.access_token);
    console.log('User profile received:', userProfile.display_name);
    
    // Create a temporary token to pass user data through the redirect
    const tempToken = Math.random().toString(36).substring(7);
    const userData = {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      user: userProfile,
      tokenExpiry: Date.now() + (tokenResponse.expires_in * 1000)
    };
    
    // Store temporarily (in production, use Redis with expiration)
    (global as any).tempTokens = (global as any).tempTokens || {};
    (global as any).tempTokens[tempToken] = userData;
    
    // Clean up after 5 minutes
    setTimeout(() => {
      delete (global as any).tempTokens[tempToken];
    }, 5 * 60 * 1000);
    
    console.log('User data stored with temp token:', tempToken);

    // Clear the state
    delete req.session.state;

    // Redirect to frontend with temp token
    res.redirect(`${frontendUrl}/dashboard?token=${tempToken}`);
  } catch (error) {
    console.error('Error in callback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/?error=authentication_failed`);
  }
});

// Exchange temp token for session
router.post('/exchange-token', (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }
    
    const tempTokens = (global as any).tempTokens || {};
    const userData = tempTokens[token];
    
    if (!userData) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Store in session
    req.session.accessToken = userData.accessToken;
    req.session.refreshToken = userData.refreshToken;
    req.session.user = userData.user;
    req.session.tokenExpiry = userData.tokenExpiry;
    
    // Clean up temp token
    delete tempTokens[token];
    
    console.log('Token exchanged successfully for user:', userData.user.display_name);
    res.json({ success: true, user: userData.user });
  } catch (error) {
    console.error('Error exchanging token:', error);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

// Get current user info
router.get('/me', async (req: Request, res: Response) => {
  try {
    console.log('GET /me called, session ID:', req.sessionID);
    console.log('Session exists:', !!req.session);
    console.log('Access token in session:', !!req.session?.accessToken);
    
    if (!req.session.accessToken) {
      console.log('No access token found - user not authenticated');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if token is expired
    if (req.session.tokenExpiry && Date.now() > req.session.tokenExpiry) {
      // Try to refresh token
      if (req.session.refreshToken) {
        try {
          const tokenResponse = await spotifyService.refreshAccessToken(req.session.refreshToken);
          req.session.accessToken = tokenResponse.access_token;
          req.session.tokenExpiry = Date.now() + (tokenResponse.expires_in * 1000);
          
          // Update refresh token if provided
          if (tokenResponse.refresh_token) {
            req.session.refreshToken = tokenResponse.refresh_token;
          }
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          return res.status(401).json({ error: 'Token refresh failed, please re-authenticate' });
        }
      } else {
        return res.status(401).json({ error: 'Token expired, please re-authenticate' });
      }
    }

    // Get fresh user profile
    const userProfile = await spotifyService.getUserProfile(req.session.accessToken);
    req.session.user = userProfile;

    console.log('Successfully authenticated user:', userProfile.display_name);
    res.json({ user: userProfile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err: any) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Get user's top tracks
router.get('/top-tracks', async (req: Request, res: Response) => {
  try {
    if (!req.session.accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { time_range = 'medium_term', limit = 20 } = req.query;
    const timeRange = time_range as 'short_term' | 'medium_term' | 'long_term';
    const trackLimit = Math.min(parseInt(limit as string) || 20, 50);

    const topTracks = await spotifyService.getTopTracks(req.session.accessToken, timeRange, trackLimit);
    res.json(topTracks);
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    res.status(500).json({ error: 'Failed to fetch top tracks' });
  }
});

// Get user's top artists
router.get('/top-artists', async (req: Request, res: Response) => {
  try {
    if (!req.session.accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { time_range = 'medium_term', limit = 20 } = req.query;
    const timeRange = time_range as 'short_term' | 'medium_term' | 'long_term';
    const artistLimit = Math.min(parseInt(limit as string) || 20, 50);

    const topArtists = await spotifyService.getTopArtists(req.session.accessToken, timeRange, artistLimit);
    res.json(topArtists);
  } catch (error) {
    console.error('Error fetching top artists:', error);
    res.status(500).json({ error: 'Failed to fetch top artists' });
  }
});

// Get recently played tracks
router.get('/recently-played', async (req: Request, res: Response) => {
  try {
    if (!req.session.accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { limit = 20 } = req.query;
    const trackLimit = Math.min(parseInt(limit as string) || 20, 50);

    const recentlyPlayed = await spotifyService.getRecentlyPlayed(req.session.accessToken, trackLimit);
    res.json(recentlyPlayed);
  } catch (error) {
    console.error('Error fetching recently played tracks:', error);
    res.status(500).json({ error: 'Failed to fetch recently played tracks' });
  }
});

// Extend Express Session interface
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