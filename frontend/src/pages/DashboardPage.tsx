import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { SpotifyUser, spotifyApi } from '../services/spotifyApi';
import { LogOut, Music, Users, Clock, Network, Play, ExternalLink } from 'lucide-react';
import MusicGraph from '../components/MusicGraph';

interface DashboardPageProps {
  user: SpotifyUser;
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {
  const [timeRange, setTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('medium_term');
  const [activeTab, setActiveTab] = useState<'overview' | 'graph'>('overview');
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
    // Subtle entrance animations
    const tl = gsap.timeline();
    
    if (headerRef.current && statsRef.current) {
      gsap.set([headerRef.current, statsRef.current], { opacity: 0, y: 15 });
      
      tl.to(headerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
      })
      .to(statsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out"
      }, "-=0.4");
    }
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

  return (
    <div className="min-h-screen bg-black">
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 overflow-hidden opacity-[0.02]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      {/* Minimal Header */}
      <motion.header 
        ref={headerRef}
        className="relative z-10 border-b border-gray-900"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <div className="w-4 h-4 bg-black rounded"></div>
              </div>
              <div>
                <h1 className="text-xl font-light text-white">Refrain</h1>
                <p className="text-gray-500 text-sm">Musical Universe</p>
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
                  <p className="text-white font-medium text-sm">{user.display_name}</p>
                  <p className="text-gray-500 text-xs">{user.followers.total.toLocaleString()} followers</p>
                </div>
              </div>
              
              <motion.button
                onClick={onLogout}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all text-sm border border-gray-800"
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
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Minimal Stats Cards */}
        <motion.div 
          ref={statsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {[
            { icon: Users, label: 'Followers', value: user.followers.total.toLocaleString(), color: 'blue' },
            { icon: Music, label: 'Top Tracks', value: topTracks?.items.length || 0, color: 'pink' },
            { icon: Clock, label: 'Recent Tracks', value: recentlyPlayed?.items?.length || 0, color: 'purple' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-gray-950/50 border border-gray-900 rounded-lg p-6 hover:bg-gray-950/70 transition-all"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              whileHover={{ y: -1 }}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  stat.color === 'pink' ? 'bg-pink-100 text-pink-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
                  <p className="text-white text-xl font-light">{stat.value}</p>
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
          <div className="flex space-x-1 bg-gray-950/50 border border-gray-900 rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview', icon: Music },
              { id: 'graph', label: 'Universe', icon: Network }
            ].map(tab => (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as 'overview' | 'graph')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all text-sm ${
                  activeTab === tab.id
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' ? (
            <motion.div
              key="overview"
              className="tab-content"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
            >
              {/* Time Range Selector */}
              <div className="flex justify-center mb-8">
                <div className="flex space-x-1 bg-gray-950/50 border border-gray-900 rounded-lg p-1">
                  {['short_term', 'medium_term', 'long_term'].map((range) => (
                    <motion.button
                      key={range}
                      onClick={() => setTimeRange(range as any)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        timeRange === range
                          ? 'bg-white text-black'
                          : 'text-gray-400 hover:text-white hover:bg-gray-900'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {getTimeRangeLabel(range)}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Top Tracks */}
                <motion.div 
                  className="bg-gray-950/30 border border-gray-900 rounded-lg p-6"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-white text-lg font-light mb-6 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
                    <span>Top Tracks</span>
                  </h2>
                  {tracksLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="w-6 h-6 border-2 border-gray-800 border-t-white rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {topTracks?.items.map((track, index) => (
                        <motion.div 
                          key={track.id} 
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-900/50 transition-all group"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          whileHover={{ x: 2 }}
                        >
                          <span className="text-gray-600 text-xs w-6 font-mono">{String(index + 1).padStart(2, '0')}</span>
                          {track.album.images && track.album.images.length > 0 && (
                            <img
                              src={track.album.images[track.album.images.length - 1].url}
                              alt={track.album.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate group-hover:text-pink-300 transition-colors">{track.name}</p>
                            <p className="text-gray-500 text-xs truncate">
                              {track.artists.map(artist => artist.name).join(', ')}
                            </p>
                          </div>
                          <ExternalLink className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Top Artists */}
                <motion.div 
                  className="bg-gray-950/30 border border-gray-900 rounded-lg p-6"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-white text-lg font-light mb-6 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                    <span>Top Artists</span>
                  </h2>
                  {artistsLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="w-6 h-6 border-2 border-gray-800 border-t-white rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {topArtists?.items.map((artist, index) => (
                        <motion.div 
                          key={artist.id} 
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-900/50 transition-all group"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          whileHover={{ x: 2 }}
                        >
                          <span className="text-gray-600 text-xs w-6 font-mono">{String(index + 1).padStart(2, '0')}</span>
                          {artist.images && artist.images.length > 0 && (
                            <img
                              src={artist.images[artist.images.length - 1].url}
                              alt={artist.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate group-hover:text-blue-300 transition-colors">{artist.name}</p>
                            <p className="text-gray-500 text-xs">
                              {artist.genres.slice(0, 2).join(', ')}
                            </p>
                          </div>
                          <ExternalLink className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Recently Played */}
              <motion.div 
                className="mt-8 bg-gray-950/30 border border-gray-900 rounded-lg p-6"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-white text-lg font-light mb-6 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                  <span>Recently Played</span>
                </h2>
                {recentLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-6 h-6 border-2 border-gray-800 border-t-white rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentlyPlayed?.items?.slice(0, 6).map((item: any, index: number) => (
                      <motion.div 
                        key={`${item.track.id}-${index}`} 
                        className="bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/50 transition-all group"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.08 }}
                        whileHover={{ y: -1 }}
                      >
                        <div className="flex items-center space-x-3">
                          {item.track.album.images && item.track.album.images.length > 0 && (
                            <img
                              src={item.track.album.images[item.track.album.images.length - 1].url}
                              alt={item.track.album.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate group-hover:text-purple-300 transition-colors">{item.track.name}</p>
                            <p className="text-gray-500 text-xs truncate">
                              {item.track.artists.map((artist: any) => artist.name).join(', ')}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="graph"
              className="tab-content"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-full h-[800px]">
                <MusicGraph 
                  tracks={topTracks?.items || []} 
                  artists={topArtists?.items || []}
                  recentTracks={recentlyPlayed?.items?.map((item: any) => item.track) || []}
                  width={1200}
                  height={800}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default DashboardPage; 