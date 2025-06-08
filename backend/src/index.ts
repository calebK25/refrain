// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:5175',
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-this-in-production',
  resave: false,
  saveUninitialized: true, // Changed to true to allow cross-domain sessions
  name: 'spotify-auth-session',
  cookie: {
    secure: false, // Set to false for development to work with HTTP and HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Allow cross-site requests for OAuth
  }
}));

// Debug middleware to track sessions
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Session ID: ${req.sessionID}`);
  console.log('Session data exists:', Object.keys(req.session).length > 0);
  console.log('Cookies received:', Object.keys(req.cookies));
  next();
});

// Routes
app.use('/api/auth', authRoutes);

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎵 Spotify Client ID: ${process.env.SPOTIFY_CLIENT_ID ? 'Configured' : 'Not configured'}`);
  console.log(`🔐 Spotify Client Secret: ${process.env.SPOTIFY_CLIENT_SECRET ? 'Configured' : 'Not configured'}`);
  
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    console.warn('⚠️  Warning: Spotify credentials are not configured. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.');
  }
}); 