import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { SpotifyUser, spotifyApi } from '../services/spotifyApi';
import { LogOut, Music, Users, Clock, Network, Play, ExternalLink, Sparkles, ChevronDown, ChevronUp, Calendar, TrendingUp } from 'lucide-react';
import MusicGraph from '../components/MusicGraph';
import Recommendations from '../components/Recommendations';

interface DashboardPageProps {
  user: SpotifyUser;
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {
  const [timeRange, setTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('medium_term');
  const [activeTab, setActiveTab] = useState<'overview' | 'graph'>('overview');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    tracks: false,
    artists: false,
    recent: false,
    profile: false
  });
  const headerRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const { data: topTracks, isLoading: tracksLoading } = useQuery({
    queryKey: ['topTracks', timeRange],
    queryFn: () => spotifyApi.getTopTracks(timeRange, 50),
  });

  const { data: topArtists, isLoading: artistsLoading } = useQuery({
    queryKey: ['topArtists', timeRange],
    queryFn: () => spotifyApi.getTopArtists(timeRange, 50),
  });

  const { data: recentlyPlayed, isLoading: recentLoading } = useQuery({
    queryKey: ['recentlyPlayed'],
    queryFn: () => spotifyApi.getRecentlyPlayed(50),
  });

  useEffect(() => {
    // Minimal entrance animations
    const elements = [headerRef.current, statsRef.current];
    gsap.set(elements, { opacity: 0, y: 20 });
    gsap.to(elements, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: "power2.out"
    });
  }, []);

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case 'short_term': return 'Last Month';
      case 'medium_term': return 'Last 6 Months';
      case 'long_term': return 'All Time';
      default: return '';
    }
  };

  const handleTabChange = (tab: 'overview' | 'graph') => {
    setActiveTab(tab);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const openSpotifyLink = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Ultra Minimal Header */}
      <motion.header 
        ref={headerRef}
        className="relative z-10 border-b border-gray-900"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center">
                <div className="w-4 h-4 bg-black rounded"></div>
              </div>
              <div>
                <h1 className="text-xl font-extralight text-white">Refrain</h1>
                <p className="text-gray-600 text-sm">Musical Universe</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                {user.images && user.images.length > 0 && (
                  <img
                    src={user.images[0].url}
                    alt={user.display_name}
                    className="w-8 h-8 rounded-full border border-gray-800"
                  />
                )}
                <div>
                  <p className="text-white font-light text-sm">{user.display_name}</p>
                  <p className="text-gray-600 text-xs">{user.followers.total.toLocaleString()} followers</p>
                </div>
              </div>
              
              <motion.button
                onClick={() => setShowRecommendations(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-all text-sm font-medium"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Discover</span>
              </motion.button>
              
              <motion.button
                onClick={onLogout}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-950 hover:bg-gray-900 text-white rounded-lg transition-all text-sm border border-gray-800"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Ultra Minimal Stats Grid */}
        <motion.div 
          ref={statsRef}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {[
            { icon: Users, label: 'Followers', value: user.followers.total.toLocaleString() },
            { icon: Music, label: 'Top Tracks', value: topTracks?.items.length || 0 },
            { icon: TrendingUp, label: 'Top Artists', value: topArtists?.items.length || 0 },
            { icon: Clock, label: 'Recent Plays', value: recentlyPlayed?.items?.length || 0 }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-gray-950/30 border border-gray-900 rounded-xl p-4 hover:bg-gray-950/50 transition-all"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              whileHover={{ y: -1 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-light uppercase tracking-wide">{stat.label}</p>
                  <p className="text-white text-2xl font-extralight mt-1">{stat.value}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <stat.icon className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Minimal Tab Navigation */}
        <motion.div 
          className="flex justify-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="flex space-x-1 bg-gray-950/30 border border-gray-900 rounded-xl p-1">
            {[
              { id: 'overview', label: 'Overview', icon: Music },
              { id: 'graph', label: 'Universe', icon: Network }
            ].map(tab => (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as 'overview' | 'graph')}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-all text-sm font-light ${
                  activeTab === tab.id
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' ? (
            <motion.div
              key="overview"
              className="space-y-6"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
            >
              {/* Time Range Selector */}
              <div className="flex justify-center">
                <div className="flex space-x-1 bg-gray-950/30 border border-gray-900 rounded-xl p-1">
                  {['short_term', 'medium_term', 'long_term'].map((range) => (
                    <motion.button
                      key={range}
                      onClick={() => setTimeRange(range as any)}
                      className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                        timeRange === range
                          ? 'bg-white text-black'
                          : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {getTimeRangeLabel(range)}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Expandable Sections */}
              <div className="space-y-6">
                {/* Top Tracks Section */}
                <motion.div className="bg-gray-950/30 border border-gray-900 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('tracks')}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-950/50 transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <h2 className="text-white text-lg font-light">Top Tracks</h2>
                      <span className="text-gray-500 text-sm">
                        {getTimeRangeLabel(timeRange)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400 text-sm">
                        {expandedSections.tracks ? 'Show less' : `Show all ${topTracks?.items.length || 0}`}
                      </span>
                      {expandedSections.tracks ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {(expandedSections.tracks || (!expandedSections.tracks && topTracks?.items)) && (
                      <motion.div
                        initial={{ height: expandedSections.tracks ? 0 : 'auto', opacity: expandedSections.tracks ? 0 : 1 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-900"
                      >
                        <div className="p-6 space-y-1">
                          {tracksLoading ? (
                            <div className="flex items-center justify-center h-32">
                              <div className="w-6 h-6 bg-white rounded-xl animate-pulse flex items-center justify-center">
                                <div className="w-3 h-3 bg-black rounded"></div>
                              </div>
                            </div>
                          ) : (
                            topTracks?.items.slice(0, expandedSections.tracks ? 50 : 5).map((track, index) => (
                              <motion.div 
                                key={track.id} 
                                className="flex items-center space-x-4 p-3 rounded-lg hover:bg-white/5 transition-all group cursor-pointer"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.02 }}
                                onClick={() => openSpotifyLink(track.external_urls.spotify)}
                              >
                                <span className="text-gray-600 text-xs w-8 font-mono text-right">
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                                {track.album.images && track.album.images.length > 0 && (
                                  <img
                                    src={track.album.images[track.album.images.length - 1].url}
                                    alt={track.album.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-light truncate group-hover:text-gray-300 transition-colors">
                                    {track.name}
                                  </p>
                                  <p className="text-gray-500 text-sm truncate">
                                    {track.artists.map(artist => artist.name).join(', ')}
                                  </p>
                                </div>
                                <div className="text-gray-600 text-xs">
                                  ♫ {track.popularity}%
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </motion.div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Top Artists Section */}
                <motion.div className="bg-gray-950/30 border border-gray-900 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('artists')}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-950/50 transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <h2 className="text-white text-lg font-light">Top Artists</h2>
                      <span className="text-gray-500 text-sm">
                        {getTimeRangeLabel(timeRange)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400 text-sm">
                        {expandedSections.artists ? 'Show less' : `Show all ${topArtists?.items.length || 0}`}
                      </span>
                      {expandedSections.artists ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {(expandedSections.artists || (!expandedSections.artists && topArtists?.items)) && (
                      <motion.div
                        initial={{ height: expandedSections.artists ? 0 : 'auto', opacity: expandedSections.artists ? 0 : 1 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-900"
                      >
                        <div className="p-6 space-y-1">
                          {artistsLoading ? (
                            <div className="flex items-center justify-center h-32">
                              <div className="w-6 h-6 bg-white rounded-xl animate-pulse flex items-center justify-center">
                                <div className="w-3 h-3 bg-black rounded"></div>
                              </div>
                            </div>
                          ) : (
                            topArtists?.items.slice(0, expandedSections.artists ? 50 : 5).map((artist, index) => (
                              <motion.div 
                                key={artist.id} 
                                className="flex items-center space-x-4 p-3 rounded-lg hover:bg-white/5 transition-all group cursor-pointer"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.02 }}
                                onClick={() => openSpotifyLink(artist.external_urls.spotify)}
                              >
                                <span className="text-gray-600 text-xs w-8 font-mono text-right">
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                                {artist.images && artist.images.length > 0 && (
                                  <img
                                    src={artist.images[artist.images.length - 1].url}
                                    alt={artist.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-light truncate group-hover:text-gray-300 transition-colors">
                                    {artist.name}
                                  </p>
                                  <p className="text-gray-500 text-sm truncate">
                                    {artist.genres.slice(0, 3).join(', ') || 'No genres listed'}
                                  </p>
                                </div>
                                <div className="text-gray-600 text-xs">
                                  ♫ {artist.popularity}%
                                </div>
                                <div className="text-gray-600 text-xs">
                                  {artist.followers.total.toLocaleString()} followers
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </motion.div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Recently Played Section */}
                <motion.div className="bg-gray-950/30 border border-gray-900 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('recent')}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-950/50 transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <h2 className="text-white text-lg font-light">Recently Played</h2>
                      <span className="text-gray-500 text-sm">
                        Last 50 tracks
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400 text-sm">
                        {expandedSections.recent ? 'Show less' : `Show all ${recentlyPlayed?.items?.length || 0}`}
                      </span>
                      {expandedSections.recent ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {(expandedSections.recent || (!expandedSections.recent && recentlyPlayed?.items)) && (
                      <motion.div
                        initial={{ height: expandedSections.recent ? 0 : 'auto', opacity: expandedSections.recent ? 0 : 1 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-900"
                      >
                        <div className="p-6 space-y-1">
                          {recentLoading ? (
                            <div className="flex items-center justify-center h-32">
                              <div className="w-6 h-6 bg-white rounded-xl animate-pulse flex items-center justify-center">
                                <div className="w-3 h-3 bg-black rounded"></div>
                              </div>
                            </div>
                          ) : (
                            recentlyPlayed?.items?.slice(0, expandedSections.recent ? 50 : 8).map((item: any, index: number) => (
                              <motion.div 
                                key={`${item.track.id}-${index}`} 
                                className="flex items-center space-x-4 p-3 rounded-lg hover:bg-white/5 transition-all group cursor-pointer"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.02 }}
                                onClick={() => openSpotifyLink(item.track.external_urls.spotify)}
                              >
                                {item.track.album.images && item.track.album.images.length > 0 && (
                                  <img
                                    src={item.track.album.images[item.track.album.images.length - 1].url}
                                    alt={item.track.album.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-light truncate group-hover:text-gray-300 transition-colors">
                                    {item.track.name}
                                  </p>
                                  <p className="text-gray-500 text-sm truncate">
                                    {item.track.artists.map((artist: any) => artist.name).join(', ')}
                                  </p>
                                </div>
                                <div className="text-gray-600 text-xs">
                                  {new Date(item.played_at).toLocaleDateString()}
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </motion.div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* User Profile Section */}
                <motion.div className="bg-gray-950/30 border border-gray-900 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('profile')}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-950/50 transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <h2 className="text-white text-lg font-light">Profile Details</h2>
                      <span className="text-gray-500 text-sm">
                        Account information
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400 text-sm">
                        {expandedSections.profile ? 'Hide details' : 'Show details'}
                      </span>
                      {expandedSections.profile ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {expandedSections.profile && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-900"
                      >
                        <div className="p-6">
                          <div className="flex items-start space-x-6">
                            {user.images && user.images.length > 0 && (
                              <img
                                src={user.images[0].url}
                                alt={user.display_name}
                                className="w-24 h-24 rounded-2xl object-cover border border-gray-800"
                              />
                            )}
                            <div className="flex-1 space-y-4">
                              <div>
                                <p className="text-gray-500 text-xs uppercase tracking-wide">Display Name</p>
                                <p className="text-white font-light text-lg">{user.display_name}</p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-gray-500 text-xs uppercase tracking-wide">Followers</p>
                                  <p className="text-white font-light">{user.followers.total.toLocaleString()}</p>
                                  <p className="text-gray-600 text-xs mt-1">
                                    Note: Spotify doesn't provide access to your followers list for privacy reasons
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs uppercase tracking-wide">Country</p>
                                  <p className="text-white font-light">{user.country || 'Not specified'}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs uppercase tracking-wide">Account Type</p>
                                  <p className="text-white font-light">Spotify Premium</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs uppercase tracking-wide">Spotify Profile</p>
                                <button
                                  onClick={() => openSpotifyLink(`https://open.spotify.com/user/${user.id}`)}
                                  className="flex items-center space-x-2 mt-2 text-green-400 hover:text-green-300 transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  <span className="text-sm">View on Spotify</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="graph"
              className="w-full"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-full h-[800px] bg-gray-950/30 border border-gray-900 rounded-xl p-6">
                <MusicGraph 
                  tracks={topTracks?.items || []} 
                  artists={topArtists?.items || []}
                  recentTracks={recentlyPlayed?.items?.map((item: any) => item.track) || []}
                  width={1200}
                  height={700}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Recommendations Modal */}
      {showRecommendations && (
        <Recommendations onClose={() => setShowRecommendations(false)} />
      )}
    </div>
  );
};

export default DashboardPage; 