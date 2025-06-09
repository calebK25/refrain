import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { spotifyApi, SpotifyUser } from './services/spotifyApi';
import LoginPage from './pages/LoginPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
// CallbackPage removed - OAuth callback now handled by backend redirect
import './App.css';

const queryClient = new QueryClient();

function App() {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendHealth, setBackendHealth] = useState<{
    status: string;
    spotify_configured: boolean;
  } | null>(null);

  useEffect(() => {
    checkBackendHealth();
    handleTokenExchange();
    handleUrlParams();
  }, []);

  const handleUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error) {
      let errorMessage = 'Authentication failed';
      switch (error) {
        case 'authorization_denied':
          errorMessage = 'You denied access to Spotify. Please try again.';
          break;
        case 'missing_code':
          errorMessage = 'Authorization code was missing. Please try again.';
          break;
        case 'missing_state':
          errorMessage = 'Security parameter was missing. Please try again.';
          break;
        case 'authentication_failed':
          errorMessage = 'Authentication failed. Please try again.';
          break;
      }
      alert(errorMessage);
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const checkBackendHealth = async () => {
    try {
      const health = await spotifyApi.checkHealth();
      setBackendHealth(health);
    } catch (error) {
      console.error('Backend health check failed:', error);
      setBackendHealth({ status: 'error', spotify_configured: false });
    }
  };

  const handleTokenExchange = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      try {
        console.log('Found token in URL, exchanging for session...');
        const response = await spotifyApi.exchangeToken(token);
        setUser(response.user);
        console.log('Token exchange successful, user authenticated');
        
        // Clear the token from URL
        window.history.replaceState({}, document.title, '/dashboard');
      } catch (error) {
        // Silently handle token exchange failure
        window.history.replaceState({}, document.title, '/');
      } finally {
        setLoading(false);
      }
    } else {
      // No token, check if already authenticated
      await checkAuthStatus();
    }
  };

  const checkAuthStatus = async () => {
    try {
      const response = await spotifyApi.getCurrentUser();
      setUser(response.user);
    } catch (error) {
      console.log('User not authenticated');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    console.log('handleLogin called');
    try {
      console.log('Calling spotifyApi.startAuth()...');
      const authResponse = await spotifyApi.startAuth();
      console.log('Auth response received:', authResponse);
      console.log('Redirecting to:', authResponse.authUrl);
      window.location.href = authResponse.authUrl;
    } catch (error) {
      console.error('Login failed:', error);
      alert(`Login failed: ${error instanceof Error ? error.message : String(error)}. Please try again.`);
    }
  };

  const handleLogout = async () => {
    try {
      await spotifyApi.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
            <div className="w-4 h-4 bg-black rounded-lg animate-pulse"></div>
          </div>
          <div className="text-white text-lg font-light">Loading...</div>
        </div>
      </div>
    );
  }

  // Show backend connection error
  if (!backendHealth || backendHealth.status !== 'ok') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-gray-950/80 backdrop-blur border border-gray-900 rounded-xl p-8 max-w-md text-center">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 bg-black rounded-lg"></div>
          </div>
          <h2 className="text-white text-xl font-light mb-4">Connection Error</h2>
          <p className="text-gray-400 mb-4 font-light">
            Cannot connect to the backend server.
          </p>
          <button
            onClick={checkBackendHealth}
            className="bg-white hover:bg-gray-100 text-black px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Show Spotify configuration error
  if (!backendHealth.spotify_configured) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-gray-950/80 backdrop-blur border border-gray-900 rounded-xl p-8 max-w-md text-center">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 bg-black rounded-lg"></div>
          </div>
          <h2 className="text-white text-xl font-light mb-4">Configuration Missing</h2>
          <p className="text-gray-400 mb-4 font-light">
            Spotify API credentials are not configured.
          </p>
          <button
            onClick={checkBackendHealth}
            className="bg-white hover:bg-gray-100 text-black px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-900">
          <Routes>
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LoginPage onLogin={handleLogin} />
                )
              }
            />
            {/* Callback route removed - OAuth handled by backend redirect */}
            <Route
              path="/dashboard"
              element={
                user ? (
                  <DashboardPage user={user} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App; 