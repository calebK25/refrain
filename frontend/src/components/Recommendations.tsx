import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music4, 
  Sparkles, 
  Target, 
  Heart, 
  ExternalLink, 
  Play,
  Pause,
  BarChart3,
  Brain,
  Users,
  Shuffle,
  RefreshCw,
  Plus,
  Minus,
  Sliders,
  Filter,
  TrendingUp,
  Volume2,
  RotateCcw
} from 'lucide-react';
import { ApiService, TrackRecommendation, TasteProfile, UserMusicProfile } from '../services/api';

interface RecommendationsProps {
  onClose?: () => void;
}

interface AudioFeatureSlider {
  key: keyof TasteProfile;
  label: string;
  value: number;
  color: string;
  description: string;
}

interface CustomParams {
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  speechiness: number;
  tempo: number;
  selectedGenres: string[];
  selectedArtists: string[];
}

const AVAILABLE_GENRES = [
  'pop', 'rock', 'hip-hop', 'jazz', 'classical', 'electronic', 'country', 'r-n-b',
  'reggae', 'blues', 'folk', 'metal', 'punk', 'disco', 'funk', 'soul',
  'alternative', 'indie', 'techno', 'house', 'ambient', 'experimental', 'world',
  'latin', 'reggaeton', 'k-pop', 'j-pop', 'trap', 'dubstep', 'drum-and-bass'
];

const Recommendations: React.FC<RecommendationsProps> = ({ onClose }) => {
  const [recommendations, setRecommendations] = useState<TrackRecommendation[]>([]);
  const [userTasteProfile, setUserTasteProfile] = useState<TasteProfile | null>(null);
  const [userProfile, setUserProfile] = useState<(UserMusicProfile & { stats: any }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<TrackRecommendation | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'profile' | 'custom'>('recommendations');
  const [customLoading, setCustomLoading] = useState(false);
  const [recommendationLimit, setRecommendationLimit] = useState(30);
  const [showMore, setShowMore] = useState(false);

  // Custom discovery parameters
  const [customParams, setCustomParams] = useState<CustomParams>({
    danceability: 0.5,
    energy: 0.5,
    valence: 0.5,
    acousticness: 0.5,
    instrumentalness: 0.5,
    liveness: 0.5,
    speechiness: 0.5,
    tempo: 120,
    selectedGenres: [],
    selectedArtists: []
  });

  useEffect(() => {
    loadRecommendations();
  }, []);

  useEffect(() => {
    // Initialize custom params from user taste profile when available
    if (userTasteProfile && customParams.danceability === 0.5) {
      setCustomParams(prev => ({
        ...prev,
        danceability: userTasteProfile.avgDanceability,
        energy: userTasteProfile.avgEnergy,
        valence: userTasteProfile.avgValence,
        acousticness: userTasteProfile.avgAcousticness,
        instrumentalness: userTasteProfile.avgInstrumentalness,
        liveness: userTasteProfile.avgLiveness,
        speechiness: userTasteProfile.avgSpeechiness,
        tempo: userTasteProfile.avgTempo
      }));
    }
  }, [userTasteProfile]);

  const loadRecommendations = async (limit: number = 30, _timestamp?: number) => {
    try {
      setLoading(true);
      setError(null);

      // Load recommendations and user profile in parallel
      const [recommendationsResponse, profileResponse] = await Promise.all([
        ApiService.getAdvancedRecommendations(limit),
        ApiService.getUserMusicProfile()
      ]);

      setRecommendations(recommendationsResponse.data.recommendations);
      setUserTasteProfile(recommendationsResponse.data.userTasteProfile);
      setStats(recommendationsResponse.data.stats);
      setUserProfile(profileResponse.data);
    } catch (err: any) {
      setError('Please log in again to access recommendations');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreRecommendations = async () => {
    const newLimit = recommendationLimit + 20;
    setRecommendationLimit(newLimit);
    await loadRecommendations(newLimit);
    setShowMore(true);
  };

  const refreshRecommendations = async () => {
    console.log('🔄 Refreshing recommendations...');
    setRecommendations([]);
    setStats(null);
    setUserTasteProfile(null);
    
    // Force fresh data with timestamp
    await loadRecommendations(recommendationLimit, Date.now());
  };

  const loadCustomRecommendations = async () => {
    try {
      setCustomLoading(true);
      setError(null);
      
      console.log('🎛️ Loading custom recommendations with params:', {
        audioFeatureTargets: {
          danceability: customParams.danceability,
          energy: customParams.energy,
          valence: customParams.valence,
          acousticness: customParams.acousticness,
          instrumentalness: customParams.instrumentalness,
          liveness: customParams.liveness,
          speechiness: customParams.speechiness,
          tempo: customParams.tempo
        },
        seedGenres: customParams.selectedGenres,
        seedArtists: customParams.selectedArtists,
        limit: 50
      });

      const customResponse = await ApiService.getCustomRecommendations({
        audioFeatureTargets: {
          danceability: customParams.danceability,
          energy: customParams.energy,
          valence: customParams.valence,
          acousticness: customParams.acousticness,
          instrumentalness: customParams.instrumentalness,
          liveness: customParams.liveness,
          speechiness: customParams.speechiness,
          tempo: customParams.tempo
        },
        seedGenres: customParams.selectedGenres,
        seedArtists: customParams.selectedArtists,
        limit: 50
      });

      console.log('✅ Custom recommendations loaded:', customResponse.data.recommendations.length, 'tracks');
      setRecommendations(customResponse.data.recommendations);
      setStats(customResponse.data.stats);
    } catch (err: any) {
      console.error('❌ Custom recommendations error:', err);
      setError('Failed to load custom recommendations: ' + (err.message || 'Unknown error'));
    } finally {
      setCustomLoading(false);
    }
  };

  const handlePlayTrack = (trackId: string, previewUrl: string | null) => {
    if (!previewUrl) return;
    
    if (playingTrack === trackId) {
      setPlayingTrack(null);
    } else {
      setPlayingTrack(trackId);
    }
  };

  const openSpotifyTrack = (track: TrackRecommendation) => {
    window.open(track.track.external_urls.spotify, '_blank');
  };

  const getFeatureSliders = (): AudioFeatureSlider[] => {
    if (!userTasteProfile) return [];
    
    return [
      { 
        key: 'avgDanceability', 
        label: 'Danceability', 
        value: userTasteProfile.avgDanceability, 
        color: '#10b981',
        description: 'How suitable a track is for dancing'
      },
      { 
        key: 'avgEnergy', 
        label: 'Energy', 
        value: userTasteProfile.avgEnergy, 
        color: '#f59e0b',
        description: 'The perceived intensity and power of the track'
      },
      { 
        key: 'avgValence', 
        label: 'Positivity', 
        value: userTasteProfile.avgValence, 
        color: '#3b82f6',
        description: 'The musical positivity conveyed by the track'
      },
      { 
        key: 'avgAcousticness', 
        label: 'Acoustic', 
        value: userTasteProfile.avgAcousticness, 
        color: '#8b5cf6',
        description: 'Whether the track is acoustic'
      },
      { 
        key: 'avgInstrumentalness', 
        label: 'Instrumental', 
        value: userTasteProfile.avgInstrumentalness, 
        color: '#ef4444',
        description: 'Whether a track contains no vocals'
      },
      { 
        key: 'avgLiveness', 
        label: 'Live Performance', 
        value: userTasteProfile.avgLiveness, 
        color: '#06b6d4',
        description: 'Whether the track was performed live'
      },
      { 
        key: 'avgSpeechiness', 
        label: 'Speechiness', 
        value: userTasteProfile.avgSpeechiness, 
        color: '#84cc16',
        description: 'The presence of spoken words in the track'
      }
    ];
  };

  const updateCustomParam = (key: keyof CustomParams, value: any) => {
    setCustomParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleGenre = (genre: string) => {
    setCustomParams(prev => ({
      ...prev,
      selectedGenres: prev.selectedGenres.includes(genre)
        ? prev.selectedGenres.filter(g => g !== genre)
        : [...prev.selectedGenres, genre].slice(0, 5) // Max 5 genres
    }));
  };

  const getSimilarityColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getSimilarityLabel = (score: number): string => {
    if (score >= 0.8) return 'Perfect Match';
    if (score >= 0.6) return 'Good Match';
    return 'Interesting Discovery';
  };

  const resetCustomParams = () => {
    if (userTasteProfile) {
      setCustomParams({
        danceability: userTasteProfile.avgDanceability,
        energy: userTasteProfile.avgEnergy,
        valence: userTasteProfile.avgValence,
        acousticness: userTasteProfile.avgAcousticness,
        instrumentalness: userTasteProfile.avgInstrumentalness,
        liveness: userTasteProfile.avgLiveness,
        speechiness: userTasteProfile.avgSpeechiness,
        tempo: userTasteProfile.avgTempo,
        selectedGenres: [],
        selectedArtists: []
      });
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <motion.div 
          className="bg-gray-950/80 backdrop-blur border border-gray-900 rounded-xl p-8 text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 bg-black rounded-lg animate-pulse"></div>
          </div>
          <h3 className="text-xl font-light text-white mb-2">Analyzing Your Music DNA</h3>
          <p className="text-gray-500 font-light">Building your personalized recommendations...</p>
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-center text-sm text-gray-500">
              <Music4 className="w-4 h-4 mr-2" />
              Scanning your music library
            </div>
            <div className="flex items-center justify-center text-sm text-gray-500">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analyzing audio features
            </div>
            <div className="flex items-center justify-center text-sm text-gray-500">
              <Sparkles className="w-4 h-4 mr-2" />
              Finding perfect matches
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <motion.div 
          className="bg-gray-950/80 backdrop-blur border border-gray-900 rounded-xl p-8 text-center max-w-md"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 bg-black rounded-lg"></div>
          </div>
          <h3 className="text-xl font-light text-white mb-2">Oops!</h3>
          <p className="text-gray-500 mb-4 font-light">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={refreshRecommendations}
              className="flex-1 bg-white hover:bg-gray-100 text-black py-2 px-4 rounded-lg transition-colors font-medium"
            >
              Try Again
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 bg-gray-950 hover:bg-gray-900 border border-gray-800 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 overflow-hidden">
      <motion.div 
        className="h-full bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <div className="bg-gray-950/50 backdrop-blur border-b border-gray-900 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 bg-black rounded-lg"></div>
              </div>
              <div>
                <h1 className="text-2xl font-light text-white">AI Music Discovery</h1>
                <p className="text-gray-500 font-light">Powered by Last.fm and advanced audio analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshRecommendations}
                className="p-2 hover:bg-gray-900 rounded-lg transition-colors border border-gray-800"
                disabled={loading || customLoading}
              >
                <RefreshCw className={`w-5 h-5 text-gray-400 ${(loading || customLoading) ? 'animate-spin' : ''}`} />
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Stats */}
          {stats && (
            <div className="mt-6 grid grid-cols-4 gap-4">
              <div className="bg-gray-950/70 border border-gray-900 rounded-lg p-3 text-center">
                <div className="text-2xl font-light text-white">{stats.totalRecommendations}</div>
                <div className="text-xs text-gray-500">New Tracks</div>
              </div>
              <div className="bg-gray-950/70 border border-gray-900 rounded-lg p-3 text-center">
                <div className="text-2xl font-light text-white">{stats.contentBasedCount}</div>
                <div className="text-xs text-gray-500">Last.fm Based</div>
              </div>
              <div className="bg-gray-950/70 border border-gray-900 rounded-lg p-3 text-center">
                <div className="text-2xl font-light text-white">{userProfile?.stats.totalLikedTracks || 0}</div>
                <div className="text-xs text-gray-500">Your Tracks</div>
              </div>
              <div className="bg-gray-950/70 border border-gray-900 rounded-lg p-3 text-center">
                <div className="text-2xl font-light text-white">{userProfile?.stats.totalRecentTracks || 0}</div>
                <div className="text-xs text-gray-500">Recent</div>
              </div>
            </div>
          )}

          {/* Enhanced Tabs */}
          <div className="mt-6 flex gap-1 bg-gray-950/70 border border-gray-900 rounded-lg p-1">
            {[
              { id: 'recommendations', label: 'Recommendations', icon: Target },
              { id: 'profile', label: 'Your Taste Profile', icon: Brain },
              { id: 'custom', label: 'Custom Discovery', icon: Sliders }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-black' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100vh-260px)] overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'recommendations' && (
              <motion.div
                key="recommendations"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Load More Button */}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-light text-white">
                    Showing {recommendations.length} recommendations
                  </h2>
                  <button
                    onClick={loadMoreRecommendations}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-950 hover:bg-gray-900 border border-gray-800 text-white rounded-lg transition-colors font-light"
                  >
                    <Plus className="w-4 h-4" />
                    Load 20 More
                  </button>
                </div>

                {recommendations.map((rec, index) => (
                  <motion.div
                    key={rec.track.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-gray-950/50 border border-gray-900 rounded-xl p-4 hover:bg-gray-950/80 transition-all cursor-pointer group"
                    onClick={() => setSelectedTrack(rec)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Album Art */}
                      <div className="relative">
                        <img
                          src={rec.track.album.images[0]?.url || '/placeholder-album.jpg'}
                          alt={rec.track.album.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayTrack(rec.track.id, rec.track.preview_url);
                          }}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                        >
                          {playingTrack === rec.track.id ? (
                            <Pause className="w-6 h-6 text-white" />
                          ) : (
                            <Play className="w-6 h-6 text-white" />
                          )}
                        </button>
                      </div>

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-light text-white truncate text-lg">{rec.track.name}</h3>
                        <p className="text-gray-400 truncate">
                          {rec.track.artists.map(a => a.name).join(', ')}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{rec.track.album.name}</p>
                        
                        {/* Enhanced Reasons */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {rec.reasons.slice(0, 3).map((reason, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-white/10 border border-gray-800 text-gray-300 text-xs rounded-full"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Track Source Info */}
                      <div className="text-right">
                        <div className="text-sm font-light text-gray-300">
                          {rec.sourceType === 'content-based' ? 'Last.fm' : 
                           rec.sourceType === 'collaborative' ? 'Artist Based' : 
                           rec.sourceType === 'hybrid' ? 'Hybrid' : 'Custom'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ♫ {rec.track.popularity}/100
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openSpotifyTrack(rec);
                          }}
                          className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === 'profile' && userTasteProfile && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Enhanced Audio Features */}
                <div className="bg-gray-950/50 border border-gray-900 rounded-xl p-6">
                  <h3 className="text-xl font-light text-white mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Your Audio Preferences
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {getFeatureSliders().map(feature => (
                      <div key={feature.key} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-gray-300 font-medium">{feature.label}</span>
                            <p className="text-gray-500 text-xs mt-1">{feature.description}</p>
                          </div>
                          <span className="text-gray-400 font-mono text-sm">{Math.round(feature.value * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-3">
                          <div
                            className="h-3 rounded-full transition-all duration-500"
                            style={{
                              width: `${feature.value * 100}%`,
                              backgroundColor: feature.color
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enhanced Preferred Genres */}
                <div className="bg-gray-950/50 border border-gray-900 rounded-xl p-6">
                  <h3 className="text-xl font-light text-white mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Favorite Genres
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {userTasteProfile.preferredGenres.slice(0, 12).map((genre, index) => (
                      <div
                        key={genre.genre}
                        className="flex items-center justify-between p-3 bg-white/5 border border-gray-800 rounded-lg"
                      >
                        <span className="text-gray-300 text-sm">{genre.genre}</span>
                        <span className="text-gray-500 text-xs font-mono">
                          {Math.round(genre.weight * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Music Collection Stats */}
                {userProfile && (
                  <div className="bg-gray-950/50 border border-gray-900 rounded-xl p-6">
                    <h3 className="text-xl font-light text-white mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Your Music Collection
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-light text-white">{userProfile.likedTracks.length}</div>
                        <div className="text-sm text-gray-500">Liked Songs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-light text-white">{userProfile.playlists.length}</div>
                        <div className="text-sm text-gray-500">Playlists</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-light text-white">
                          {Object.values(userProfile.playlistTracks).flat().length}
                        </div>
                        <div className="text-sm text-gray-500">Playlist Tracks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-light text-white">{userProfile.recentTracks.length}</div>
                        <div className="text-sm text-gray-500">Recent Plays</div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'custom' && (
              <motion.div
                key="custom"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Custom Discovery Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-light text-white">Custom Discovery</h2>
                    <p className="text-gray-500 text-sm">Fine-tune your recommendations</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={resetCustomParams}
                      className="px-4 py-2 bg-gray-950 hover:bg-gray-900 border border-gray-800 text-white rounded-lg transition-colors font-light"
                    >
                      Reset to Profile
                    </button>
                    <button
                      onClick={loadCustomRecommendations}
                      disabled={customLoading}
                      className="px-6 py-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors font-medium flex items-center gap-2"
                    >
                      {customLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Filter className="w-4 h-4" />
                      )}
                      Generate
                    </button>
                  </div>
                </div>

                {/* Audio Feature Sliders */}
                <div className="bg-gray-950/50 border border-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-light text-white mb-6 flex items-center gap-2">
                    <Sliders className="w-5 h-5" />
                    Audio Features
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { key: 'danceability', label: 'Danceability', description: 'How suitable for dancing' },
                      { key: 'energy', label: 'Energy', description: 'Intensity and power' },
                      { key: 'valence', label: 'Positivity', description: 'Musical positivity' },
                      { key: 'acousticness', label: 'Acoustic', description: 'Acoustic vs electric' },
                      { key: 'instrumentalness', label: 'Instrumental', description: 'No vocals' },
                      { key: 'liveness', label: 'Live Performance', description: 'Performed live' },
                      { key: 'speechiness', label: 'Speechiness', description: 'Spoken words' }
                    ].map(({ key, label, description }) => (
                      <div key={key} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-gray-300 font-medium">{label}</span>
                            <p className="text-gray-500 text-xs">{description}</p>
                          </div>
                          <span className="text-gray-400 font-mono text-sm">
                            {Math.round(customParams[key as keyof CustomParams] as number * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={customParams[key as keyof CustomParams] as number}
                          onChange={(e) => updateCustomParam(key as keyof CustomParams, parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                    ))}
                    
                    {/* Tempo Slider */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-gray-300 font-medium">Tempo</span>
                          <p className="text-gray-500 text-xs">Beats per minute</p>
                        </div>
                        <span className="text-gray-400 font-mono text-sm">{Math.round(customParams.tempo)} BPM</span>
                      </div>
                      <input
                        type="range"
                        min="60"
                        max="200"
                        step="1"
                        value={customParams.tempo}
                        onChange={(e) => updateCustomParam('tempo', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>
                </div>

                {/* Genre Selection */}
                <div className="bg-gray-950/50 border border-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-light text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Genre Seeds (Max 5)
                  </h3>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {AVAILABLE_GENRES.map(genre => (
                      <button
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        disabled={!customParams.selectedGenres.includes(genre) && customParams.selectedGenres.length >= 5}
                        className={`p-2 rounded-lg text-sm transition-all ${
                          customParams.selectedGenres.includes(genre)
                            ? 'bg-white text-black'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                  {customParams.selectedGenres.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-gray-400 text-sm">Selected:</span>
                      {customParams.selectedGenres.map(genre => (
                        <span
                          key={genre}
                          className="px-2 py-1 bg-white/10 border border-gray-800 text-gray-300 text-xs rounded-full flex items-center gap-1"
                        >
                          {genre}
                          <button
                            onClick={() => toggleGenre(genre)}
                            className="hover:text-white"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <div className="bg-gray-950/50 border border-gray-900 rounded-xl p-6 text-center">
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={loadCustomRecommendations}
                      disabled={customLoading}
                      className="flex items-center gap-2 bg-white hover:bg-gray-100 disabled:bg-gray-700 text-black disabled:text-gray-400 py-3 px-8 rounded-lg transition-colors font-medium"
                    >
                      {customLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate Custom Recommendations
                        </>
                      )}
                    </button>
                    <button
                      onClick={resetCustomParams}
                      className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded-lg transition-colors font-medium"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset to Profile
                    </button>
                  </div>
                  <p className="text-gray-500 text-sm mt-3">
                    Adjust the sliders and select genres to customize your discovery
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Enhanced Track Detail Modal */}
      <AnimatePresence>
        {selectedTrack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4"
            onClick={() => setSelectedTrack(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-950/90 backdrop-blur border border-gray-900 rounded-xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <img
                  src={selectedTrack.track.album.images[0]?.url || '/placeholder-album.jpg'}
                  alt={selectedTrack.track.album.name}
                  className="w-40 h-40 rounded-xl mx-auto mb-4 object-cover"
                />
                <h3 className="text-2xl font-light text-white">{selectedTrack.track.name}</h3>
                <p className="text-gray-400 text-lg">{selectedTrack.track.artists.map(a => a.name).join(', ')}</p>
                <p className="text-sm text-gray-500">{selectedTrack.track.album.name}</p>
                <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-500">
                  <span>♫ {selectedTrack.track.popularity}/100 popularity</span>
                  <span>•</span>
                  <span className="text-gray-400">
                    {selectedTrack.sourceType === 'content-based' ? 'Last.fm Match' : 
                     selectedTrack.sourceType === 'collaborative' ? 'Artist Based' : 
                     selectedTrack.sourceType === 'hybrid' ? 'Hybrid' : 'Custom Discovery'}
                  </span>
                </div>
              </div>

              {/* Enhanced Reasons */}
              <div className="space-y-3 mb-6">
                <h4 className="font-light text-white">Why This Match?</h4>
                <div className="grid grid-cols-1 gap-2">
                  {selectedTrack.reasons.map((reason, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                      <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                      <span className="text-gray-300 text-sm">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audio Features Preview */}
              {selectedTrack.audioFeatures && (
                <div className="mb-6">
                  <h4 className="font-light text-white mb-3">Audio Features</h4>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="text-center">
                      <div className="text-gray-400">Dance</div>
                      <div className="text-white">{(selectedTrack.audioFeatures.danceability * 10).toFixed(1)}/10</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">Energy</div>
                      <div className="text-white">{(selectedTrack.audioFeatures.energy * 10).toFixed(1)}/10</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">Positive</div>
                      <div className="text-white">{(selectedTrack.audioFeatures.valence * 10).toFixed(1)}/10</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => openSpotifyTrack(selectedTrack)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Spotify
                </button>
                <button
                  onClick={() => setSelectedTrack(null)}
                  className="px-6 py-3 bg-gray-950 hover:bg-gray-900 border border-gray-800 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid #374151;
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid #374151;
        }
      `}</style>
    </div>
  );
};

export default Recommendations; 