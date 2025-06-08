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
        console.error('Token exchange failed:', error);
        alert('Authentication failed. Please try logging in again.');
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show backend connection error
  if (!backendHealth || backendHealth.status !== 'ok') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-900 border border-red-700 rounded-lg p-6 max-w-md">
          <h2 className="text-red-200 text-xl font-bold mb-4">Backend Connection Error</h2>
          <p className="text-red-300 mb-4">
            Cannot connect to the backend server. Please make sure:
          </p>
          <ul className="text-red-300 list-disc list-inside space-y-1 mb-4">
            <li>Backend server is running on port 3000</li>
            <li>CORS is properly configured</li>
            <li>Network connection is available</li>
          </ul>
          <button
            onClick={checkBackendHealth}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-6 max-w-md">
          <h2 className="text-yellow-200 text-xl font-bold mb-4">Spotify Configuration Missing</h2>
          <p className="text-yellow-300 mb-4">
            Spotify API credentials are not configured. Please:
          </p>
          <ul className="text-yellow-300 list-disc list-inside space-y-1 mb-4">
            <li>Set SPOTIFY_CLIENT_ID environment variable</li>
            <li>Set SPOTIFY_CLIENT_SECRET environment variable</li>
            <li>Restart the backend server</li>
          </ul>
          <button
            onClick={checkBackendHealth}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
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