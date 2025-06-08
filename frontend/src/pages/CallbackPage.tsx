import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { spotifyApi, SpotifyUser } from '../services/spotifyApi';
import { Loader, AlertCircle, CheckCircle } from 'lucide-react';

interface CallbackPageProps {
  onSuccess: (user: SpotifyUser) => void;
  onError: () => void;
}

const CallbackPage: React.FC<CallbackPageProps> = ({ onSuccess, onError }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setError(`Authentication was denied: ${error}`);
        setStatus('error');
        return;
      }

      if (!code || !state) {
        setError('Missing authorization code or state parameter');
        setStatus('error');
        return;
      }

      // Call backend to handle the callback
      const response = await spotifyApi.handleCallback(code, state);
      
      setStatus('success');
      onSuccess(response.user);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Callback error:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
      setStatus('error');
      onError();
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full p-8">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader className="h-12 w-12 text-green-500 mx-auto mb-4 animate-spin" />
              <h2 className="text-white text-xl font-semibold mb-2">
                Connecting to Spotify...
              </h2>
              <p className="text-gray-400">
                Please wait while we authenticate your account.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-white text-xl font-semibold mb-2">
                Successfully Connected!
              </h2>
              <p className="text-gray-400">
                Redirecting to your dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-white text-xl font-semibold mb-2">
                Authentication Failed
              </h2>
              <p className="text-gray-400 mb-4">
                {error}
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallbackPage; 