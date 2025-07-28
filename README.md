# Spotify Music Graph

A web application that visualizes music taste relationships between Spotify users in an interactive node graph similar to Obsidian's graph view.

## 🎵 Features

- **Interactive Node Graph**: Visualize Spotify users as nodes with connections based on music taste similarity
- **Spotify OAuth Integration**: Secure authentication using Spotify Web API
- **Music Taste Analysis**: Advanced algorithms to calculate similarity between users based on:
  - Top tracks and artists (short, medium, long term)
  - Audio features (danceability, energy, valence, etc.)
  - Recently played tracks
  - Genre preferences
- **Real-time Dashboard**: View your music statistics and listening habits
- **Dark Theme**: Obsidian-inspired dark interface with glowing animations
- <img width="1527" height="857" alt="image" src="https://github.com/user-attachments/assets/ad4db8eb-ea1f-4c8d-a759-1ceb1da2795a" />
- <img width="1527" height="857" alt="image" src="https://github.com/user-attachments/assets/81d24ad3-a09b-4bed-b748-d618af59ac4c" />
- <img width="1527" height="857" alt="image" src="https://github.com/user-attachments/assets/a8e76f18-9a9f-4748-9f9f-9a8e36bbd0ef" />




## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Spotify Developer Account**: 
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Note down your Client ID and Client Secret
   - Add `http://localhost:3000/api/auth/callback` to your app's redirect URIs

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <your-repo-url>
   cd spotify-music-graph
   npm run install:all
   ```

2. **Configure Spotify API credentials**:
   ```bash
   cp backend/.env.example backend/.env
   ```
   
   Edit `backend/.env` and add your Spotify credentials:
   ```env
   SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
   SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback
   
   PORT=3000
   NODE_ENV=development
   SESSION_SECRET=your-session-secret-change-this-in-production
   
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start the development servers**:
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:3000`
   - Frontend development server on `http://localhost:5173`

4. **Open your browser** and go to `http://localhost:5173`

## 🏗️ Project Structure

```
spotify-music-graph/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript interfaces
│   │   └── index.ts        # Server entry point
│   ├── .env.example        # Environment variables template
│   └── package.json
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   └── main.tsx        # App entry point
│   └── package.json
└── package.json           # Root package with dev scripts
```

## 🔧 API Endpoints

### Authentication
- `GET /api/auth/health` - Check backend and Spotify configuration status
- `GET /api/auth/login` - Get Spotify authorization URL
- `GET /api/auth/callback` - Handle Spotify OAuth callback
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout current user

### Music Data
- `GET /api/auth/top-tracks` - Get user's top tracks
- `GET /api/auth/top-artists` - Get user's top artists  
- `GET /api/auth/recently-played` - Get recently played tracks

Query parameters:
- `time_range`: `short_term` (4 weeks) | `medium_term` (6 months) | `long_term` (all time)
- `limit`: Number of items to return (max 50)

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev  # Start with nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Start Vite dev server
```

### Build for Production
```bash
npm run build  # Builds both frontend and backend
```

## 🔐 Environment Variables

### Backend (.env)
- `SPOTIFY_CLIENT_ID` - Your Spotify app's client ID (required)
- `SPOTIFY_CLIENT_SECRET` - Your Spotify app's client secret (required)
- `SPOTIFY_REDIRECT_URI` - OAuth callback URL (default: http://localhost:3000/api/auth/callback)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)
- `SESSION_SECRET` - Secret for session encryption (change in production!)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5173)

### Frontend (.env)
- `VITE_API_URL` - Backend API URL (default: http://localhost:3000/api)

## 🐛 Troubleshooting

### Common Issues

1. **"Spotify credentials not configured" error**:
   - Make sure you've created the `.env` file in the backend directory
   - Verify your Client ID and Client Secret are correct
   - Restart the backend server after changing environment variables

2. **"Backend Connection Error"**:
   - Ensure the backend server is running on port 3000
   - Check that no other service is using port 3000
   - Verify CORS settings if frontend is on a different port

3. **Authentication fails**:
   - Check that the redirect URI in your Spotify app matches exactly: `http://localhost:3000/api/auth/callback`
   - Ensure your Spotify app has the correct permissions/scopes

4. **"Cannot find module" errors**:
   - Run `npm run install:all` from the root directory
   - If issues persist, delete `node_modules` folders and reinstall

### Debug Mode

Enable detailed logging by setting `NODE_ENV=development` in your backend `.env` file.

## 📝 Next Steps

This initial setup focuses on Spotify authentication and basic music data fetching. The next phase will include:

1. **Graph Visualization**: Implement D3.js or vis-network for interactive node graphs
2. **Similarity Algorithm**: Calculate music taste similarity between users
3. **AI Recommendations**: Machine learning for personalized recommendations
4. **Collaborative Playlists**: Generate playlists based on user similarity
5. **Database Integration**: Store user data and relationships
6. **Real-time Updates**: WebSocket connections for live graph updates

## 🔑 Spotify App Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create App"
3. Fill in app details:
   - App name: "Music Graph" (or your preferred name)
   - App description: "Music taste visualization app"
   - Website: http://localhost:5173 (or your domain)
   - Redirect URI: http://localhost:3000/api/auth/callback
4. Save your Client ID and Client Secret to the backend `.env` file

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Note**: This is the initial authentication setup. The graph visualization and similarity analysis features will be implemented in subsequent phases. 
