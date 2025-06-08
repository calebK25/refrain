import React, { useEffect, useRef, useState, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import ForceGraph2D from 'react-force-graph-2d';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotifyTrack, SpotifyArtist } from '../services/spotifyApi';
import * as THREE from 'three';

interface GraphNode {
  id: string;
  name: string;
  type: 'track' | 'artist' | 'genre';
  size: number;
  color: string;
  data?: any;
}

interface GraphLink {
  source: string;
  target: string;
  type: 'artist-track' | 'genre-artist' | 'similarity';
  value: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface MusicGraphProps {
  tracks: SpotifyTrack[];
  artists: SpotifyArtist[];
  recentTracks?: SpotifyTrack[];
  width?: number;
  height?: number;
}

const MusicGraph: React.FC<MusicGraphProps> = ({ 
  tracks, 
  artists, 
  recentTracks = [],
  width = 1200, 
  height = 800 
}) => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [is3D, setIs3D] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const fgRef = useRef<any>();

  useEffect(() => {
    if (tracks.length > 0 || artists.length > 0) {
      const data = buildAdvancedGraphData(tracks, artists, recentTracks);
      setGraphData(data);
      console.log('Advanced graph data built:', data);
    }
  }, [tracks, artists, recentTracks]);

  // Configure D3 forces for better 2D spacing
  useEffect(() => {
    if (fgRef.current && !is3D) {
      const fg = fgRef.current;
      
      // Wait a bit for the graph to initialize
      setTimeout(() => {
        // Configure forces for better spacing
        fg.d3Force('charge')
          .strength(-300) // Strong repulsion
          .distanceMax(400); // Limit repulsion distance
        
        fg.d3Force('link')
          .distance(100) // Longer links
          .strength(0.8); // Strong link force
        
        fg.d3Force('center')
          .strength(0.1); // Weak centering force
        
        // Restart simulation with new forces
        fg.d3ReheatSimulation();
      }, 100);
    }
  }, [is3D, graphData]);

  const buildAdvancedGraphData = (tracks: SpotifyTrack[], artists: SpotifyArtist[], recentTracks: SpotifyTrack[]): GraphData => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeIds = new Set<string>();

    console.log('Building advanced graph with:', { tracks: tracks.length, artists: artists.length });

    // Add artist nodes first with better styling
    artists.slice(0, 25).forEach((artist) => {
      const nodeId = `artist-${artist.id}`;
      if (!nodeIds.has(nodeId)) {
        nodes.push({
          id: nodeId,
          name: artist.name,
          type: 'artist',
          size: Math.max(6, Math.min(12, artist.popularity * 0.1 + 6)),
          color: '#E2E8F0', // Light neutral gray
          data: artist
        });
        nodeIds.add(nodeId);
      }
    });

    // Add track nodes and connect to artists
    tracks.slice(0, 30).forEach((track) => {
      const trackId = `track-${track.id}`;
      if (!nodeIds.has(trackId)) {
        nodes.push({
          id: trackId,
          name: track.name,
          type: 'track',
          size: Math.max(4, Math.min(8, track.popularity * 0.08 + 4)),
          color: '#93C5FD', // Light blue
          data: track
        });
        nodeIds.add(trackId);

        // Create links to artists
        track.artists.forEach((artist) => {
          const artistId = `artist-${artist.id}`;
          if (nodeIds.has(artistId)) {
            links.push({
              source: trackId,
              target: artistId,
              type: 'artist-track',
              value: 2
            });
          }
        });
      }
    });

    // Add recent tracks with different color
    recentTracks.slice(0, 15).forEach((track) => {
      const trackId = `recent-${track.id}`;
      if (!nodeIds.has(trackId) && !nodeIds.has(`track-${track.id}`)) {
        nodes.push({
          id: trackId,
          name: track.name,
          type: 'track',
          size: 4,
          color: '#F0ABFC', // Light purple for recent
          data: track
        });
        nodeIds.add(trackId);

        track.artists.forEach((artist) => {
          const artistId = `artist-${artist.id}`;
          if (nodeIds.has(artistId)) {
            links.push({
              source: trackId,
              target: artistId,
              type: 'artist-track',
              value: 1
            });
          }
        });
      }
    });

    // Add genre nodes
    const genreCount = new Map<string, number>();
    const genreArtists = new Map<string, string[]>();
    
    artists.slice(0, 25).forEach(artist => {
      artist.genres.forEach(genre => {
        genreCount.set(genre, (genreCount.get(genre) || 0) + 1);
        if (!genreArtists.has(genre)) genreArtists.set(genre, []);
        genreArtists.get(genre)?.push(`artist-${artist.id}`);
      });
    });

    const genreColors = ['#FDE68A', '#FCA5A5', '#A7F3D0', '#DDD6FE', '#FBBF24'];
    
    Array.from(genreCount.entries())
      .filter(([_, count]) => count >= 2)
      .slice(0, 10)
      .forEach(([genre, count], index) => {
        const genreId = `genre-${genre}`;
        nodes.push({
          id: genreId,
          name: genre,
          type: 'genre',
          size: Math.max(8, Math.min(16, count * 3 + 8)),
          color: genreColors[index % genreColors.length],
          data: { name: genre, count }
        });
        nodeIds.add(genreId);

        // Connect genres to artists
        genreArtists.get(genre)?.forEach(artistId => {
          if (nodeIds.has(artistId)) {
            links.push({
              source: genreId,
              target: artistId,
              type: 'genre-artist',
              value: 1
            });
          }
        });
      });

    console.log(`Created ${nodes.length} nodes and ${links.length} links`);
    return { nodes, links };
  };

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    
    if (fgRef.current) {
      if (is3D) {
        // Smoother 3D camera movement
        const distance = 200;
        const targetPos = {
          x: node.x + distance * 0.7,
          y: node.y + distance * 0.7,
          z: node.z + distance
        };
        fgRef.current.cameraPosition(
          targetPos,
          { x: node.x, y: node.y, z: node.z },
          1500
        );
      } else {
        // Better 2D centering
        fgRef.current.centerAt(node.x, node.y, 1000);
        const currentZoom = fgRef.current.zoom();
        if (currentZoom < 2) {
          fgRef.current.zoom(2.5, 1000);
        }
      }
    }
  }, [is3D]);

  const handleNodeHover = useCallback((node: any) => {
    setHoverNode(node);
    
    if (!node) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      return;
    }

    const highlightNodesSet = new Set([node.id]);
    const highlightLinksSet = new Set();

    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
      
      if (sourceId === node.id || targetId === node.id) {
        highlightLinksSet.add(link);
        highlightNodesSet.add(sourceId);
        highlightNodesSet.add(targetId);
      }
    });

    setHighlightNodes(highlightNodesSet);
    setHighlightLinks(highlightLinksSet);
  }, [graphData.links]);

  const getNodeColor = (node: any) => {
    const isHighlighted = highlightNodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;
    
    if (isSelected) return '#6366F1'; // Indigo for selected
    if (isHighlighted) return '#FFFFFF'; // White for highlighted
    
    return node.color;
  };

  const getLinkColor = (link: any) => {
    const isHighlighted = highlightLinks.has(link);
    
    if (isHighlighted) {
      return '#FBBF24'; // Bright yellow for highlighted
    }
    
    // Different colors for different link types
    switch (link.type) {
      case 'artist-track':
        return is3D ? '#94A3B8' : '#1E293B'; // Darker for 2D visibility
      case 'genre-artist':
        return is3D ? '#C084FC' : '#7C3AED'; // Darker purple for 2D
      default:
        return is3D ? '#E2E8F0' : '#374151';
    }
  };

  const getLinkWidth = (link: any) => {
    const isHighlighted = highlightLinks.has(link);
    const baseWidth = is3D ? 1 : 4; // Even thicker for 2D
    return isHighlighted ? baseWidth * 2 : baseWidth;
  };

  const GraphComponent = is3D ? ForceGraph3D : ForceGraph2D;

  return (
    <motion.div 
      className="w-full h-full bg-black rounded-lg border border-gray-800 overflow-hidden relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Enhanced Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/90 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-lg font-light">Musical Universe</h2>
          
          <div className="flex items-center space-x-3">
            {/* 2D/3D Toggle */}
            <div className="flex items-center space-x-1 bg-gray-900 rounded-lg p-1">
              <button
                onClick={() => setIs3D(false)}
                className={`px-3 py-1 text-xs rounded transition-all ${
                  !is3D ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                2D
              </button>
              <button
                onClick={() => setIs3D(true)}
                className={`px-3 py-1 text-xs rounded transition-all ${
                  is3D ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                3D
              </button>
            </div>
            
            {/* Reset Zoom Button */}
            <button
              onClick={() => {
                if (fgRef.current) {
                  fgRef.current.zoomToFit(1000, is3D ? 120 : 100);
                }
              }}
              className="px-3 py-1 text-xs bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-all"
              title="Reset Zoom"
            >
              Reset View
            </button>
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="pt-16 w-full h-full">
        <GraphComponent
          ref={fgRef}
          graphData={graphData}
          width={width}
          height={height - 64}
          backgroundColor="#000000"
          nodeColor={getNodeColor}
          nodeVal={(node: any) => is3D ? node.size : node.size * 0.6} // Smaller nodes in 2D
          nodeLabel={(node: any) => `${node.name} (${node.type})`}
          nodeRelSize={is3D ? 6 : 4} // Much smaller relative size for 2D
          linkColor={getLinkColor}
          linkWidth={getLinkWidth}
          linkOpacity={is3D ? 0.8 : 0.9}
          linkDirectionalParticles={(link: any) => {
            const isHighlighted = highlightLinks.has(link);
            return isHighlighted ? 4 : 0;
          }}
          linkDirectionalParticleSpeed={0.01}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleColor={(link: any) => '#FBBF24'}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onBackgroundClick={() => {
            setSelectedNode(null);
            setHighlightNodes(new Set());
            setHighlightLinks(new Set());
          }}
          enableNodeDrag={true}
          enableNavigationControls={true}
          showNavInfo={false}
          numDimensions={is3D ? 3 : 2}
          // Force configuration for better 2D spacing
          d3AlphaDecay={is3D ? 0.02 : 0.005}
          d3VelocityDecay={is3D ? 0.4 : 0.2}
          cooldownTicks={is3D ? 100 : 300}
          warmupTicks={is3D ? 0 : 100}
          // Use ref to configure forces after initialization
          // 2D Canvas Labels
          nodeCanvasObject={!is3D ? (node: any, ctx: any, globalScale: any) => {
            const label = node.name.length > 15 ? node.name.substring(0, 12) + '...' : node.name;
            const fontSize = Math.max(8, Math.min(12, node.size * globalScale / 6));
            
            // Draw node circle
            ctx.fillStyle = getNodeColor(node);
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI, false);
            ctx.fill();
            
            // Draw text label
            ctx.font = `${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Text background
            const textWidth = ctx.measureText(label).width;
            const padding = 4;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(
              node.x - textWidth/2 - padding, 
              node.y + node.size + 5, 
              textWidth + padding * 2, 
              fontSize + padding
            );
            
            // Text
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(label, node.x, node.y + node.size + fontSize/2 + 8);
          } : undefined}
          
          {...(is3D && {
            nodeThreeObject: (node: any) => {
              const isHighlighted = highlightNodes.has(node.id);
              const isSelected = selectedNode?.id === node.id;
              
              // Create a group to hold both sphere and label
              const group = new THREE.Group();
              
              // Create the sphere
              const geometry = new THREE.SphereGeometry(node.size, 16, 16);
              let material;
              
              if (isSelected) {
                material = new THREE.MeshPhongMaterial({
                  color: '#6366F1',
                  emissive: '#4338CA',
                  emissiveIntensity: 0.3,
                  shininess: 100
                });
              } else if (isHighlighted) {
                material = new THREE.MeshPhongMaterial({
                  color: '#FFFFFF',
                  emissive: '#E5E7EB',
                  emissiveIntensity: 0.2,
                  shininess: 80
                });
              } else {
                material = new THREE.MeshLambertMaterial({
                  color: node.color,
                  transparent: true,
                  opacity: 0.8
                });
              }
              
              const sphere = new THREE.Mesh(geometry, material);
              group.add(sphere);
              
              // Create clean floating text label
              const label = node.name.length > 20 ? node.name.substring(0, 17) + '...' : node.name;
              
              // Create canvas for text with better styling
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              const fontSize = Math.max(24, Math.min(32, node.size * 2.5));
              canvas.width = 400;
              canvas.height = 80;
              
              if (context) {
                // Clear background (transparent)
                context.clearRect(0, 0, canvas.width, canvas.height);
                
                // Subtle text shadow for readability
                context.shadowColor = 'rgba(0, 0, 0, 0.8)';
                context.shadowBlur = 4;
                context.shadowOffsetX = 1;
                context.shadowOffsetY = 1;
                
                // Modern font and text styling
                context.fillStyle = isSelected ? '#60A5FA' : isHighlighted ? '#FBBF24' : '#E5E7EB';
                context.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillText(label, canvas.width / 2, canvas.height / 2);
              }
              
              // Create cleaner sprite
              const texture = new THREE.CanvasTexture(canvas);
              texture.minFilter = THREE.LinearFilter;
              texture.magFilter = THREE.LinearFilter;
              
              const spriteMaterial = new THREE.SpriteMaterial({ 
                map: texture, 
                transparent: true,
                opacity: 1,
                alphaTest: 0.001
              });
              const sprite = new THREE.Sprite(spriteMaterial);
              sprite.scale.set(node.size * 4, node.size * 2, 1);
              sprite.position.set(0, node.size + 12, 0);
              group.add(sprite);
              
              return group;
            }
          })}
          onEngineStop={() => {
            // Only auto-fit once when graph first loads, not on every stop
            if (fgRef.current && graphData.nodes.length > 0) {
              setTimeout(() => {
                if (fgRef.current) {
                  const padding = is3D ? 120 : 100;
                  const duration = 1000;
                  fgRef.current.zoomToFit(duration, padding);
                }
              }, 300);
            }
          }}
        />
      </div>

      {/* Node Details Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-20 right-4 w-72 bg-black/95 backdrop-blur-sm border border-gray-700 rounded-lg p-4 z-20"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-white font-medium leading-tight">{selectedNode.name}</h3>
                <p className="text-gray-400 text-sm capitalize mt-1">{selectedNode.type}</p>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-gray-500 hover:text-white transition-colors ml-2"
              >
                ✕
              </button>
            </div>
            
            {selectedNode.type === 'artist' && selectedNode.data && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Popularity</span>
                  <span className="text-white">{selectedNode.data.popularity}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Followers</span>
                  <span className="text-white">{selectedNode.data.followers?.total?.toLocaleString() || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Genres</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.data.genres?.slice(0, 3).map((genre: string) => (
                      <span key={genre} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {selectedNode.type === 'track' && selectedNode.data && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Album</span>
                  <span className="text-white text-right text-xs">{selectedNode.data.album?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Popularity</span>
                  <span className="text-white">{selectedNode.data.popularity}/100</span>
                </div>
              </div>
            )}
            
            {selectedNode.type === 'genre' && selectedNode.data && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Artists</span>
                  <span className="text-white">{selectedNode.data.count}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Stats */}
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm border border-gray-800 rounded px-3 py-2 text-xs text-white">
        <div className="space-y-1">
          <div>{graphData.nodes.length} nodes • {graphData.links.length} links</div>
          <div className="text-gray-400">
            {is3D ? 'Drag to rotate • Scroll to zoom • Click nodes' : 'Drag to pan • Scroll to zoom • Click nodes'}
          </div>
        </div>
      </div>

      {/* Enhanced Legend */}
      <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm border border-gray-800 rounded p-3 text-xs">
        <h3 className="text-white font-medium mb-2">Legend</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span className="text-gray-300">Artists</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-300"></div>
            <span className="text-gray-300">Top Tracks</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-purple-300"></div>
            <span className="text-gray-300">Recent Tracks</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-300"></div>
            <span className="text-gray-300">Genres</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MusicGraph; 