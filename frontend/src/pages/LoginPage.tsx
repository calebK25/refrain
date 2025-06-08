import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { motion } from 'framer-motion';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const orbsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const tl = gsap.timeline();
    
    // Set initial states
    gsap.set([titleRef.current, subtitleRef.current, buttonRef.current], {
      opacity: 0,
      y: 30
    });

    // Animate entrance
    tl.to(titleRef.current, {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: "power3.out"
    })
    .to(subtitleRef.current, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out"
    }, "-=0.8")
    .to(buttonRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.6");

    // Subtle floating orbs animation
    orbsRef.current.forEach((orb, index) => {
      if (orb) {
        gsap.to(orb, {
          y: "random(-15, 15)",
          x: "random(-15, 15)",
          duration: "random(4, 8)",
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
          delay: index * 0.8
        });
      }
    });

    return () => {
      tl.kill();
    };
  }, []);

  const handleLogin = () => {
    // Subtle button press animation
    gsap.to(buttonRef.current, {
      scale: 0.98,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
      onComplete: () => {
        onLogin();
      }
    });
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen relative overflow-hidden bg-black"
    >
      {/* Subtle Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            ref={el => el && (orbsRef.current[i] = el)}
            className={`absolute rounded-full blur-3xl opacity-[0.03] ${
              i % 4 === 0 ? 'bg-blue-200' : 
              i % 4 === 1 ? 'bg-pink-200' : 
              i % 4 === 2 ? 'bg-purple-200' : 'bg-green-200'
            }`}
            style={{
              width: `${Math.random() * 400 + 200}px`,
              height: `${Math.random() * 400 + 200}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Noise Texture */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <motion.div 
          className="max-w-lg w-full text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        >
          {/* Minimal Logo */}
          <motion.div 
            className="mb-16"
            whileHover={{ rotate: 45 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white flex items-center justify-center shadow-xl">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <h1 
            ref={titleRef}
            className="text-6xl md:text-7xl font-extralight text-white mb-6 tracking-tight"
          >
            Refrain
          </h1>

          {/* Subtitle */}
          <p 
            ref={subtitleRef}
            className="text-lg text-gray-400 mb-16 font-light leading-relaxed max-w-md mx-auto"
          >
            Visualize your musical universe.<br />
            <span className="text-gray-500">A minimalist approach to music discovery.</span>
          </p>

          {/* Connect Button */}
          <motion.button
            ref={buttonRef}
            onClick={handleLogin}
            className="group relative px-8 py-3 bg-white text-black font-medium rounded-full transition-all duration-300 hover:bg-gray-100 border border-gray-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10 flex items-center justify-center space-x-3">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.062 14.615a.625.625 0 01-.862.213c-2.36-1.44-5.33-.72-6.594-.48a.625.625 0 11-.312-1.213c1.532-.292 4.99-1.068 7.555.618a.625.625 0 01.213.862zm1.23-2.74a.781.781 0 01-1.077.265c-2.695-1.644-6.792-.877-8.148-.548a.781.781 0 11-.39-1.514c1.643-.398 6.247-1.296 9.35.72a.781.781 0 01.265 1.077zm.106-2.854c-3.235-1.92-8.57-.948-10.222-.598a.938.938 0 11-.468-1.816c1.94-.412 7.684-1.416 11.547.69a.938.938 0 01-.857 1.724z"/>
              </svg>
              <span>Connect with Spotify</span>
            </span>
          </motion.button>

          {/* Features - Minimal */}
          <motion.div 
            className="mt-20 grid grid-cols-3 gap-8 text-center max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 1 }}
          >
            {[
              { label: 'Interactive', color: 'blue' },
              { label: 'Intelligent', color: 'pink' },
              { label: 'Realtime', color: 'purple' }
            ].map((feature, i) => (
              <div key={feature.label} className="space-y-3">
                <div className={`w-2 h-2 mx-auto rounded-full ${
                  feature.color === 'blue' ? 'bg-blue-300' :
                  feature.color === 'pink' ? 'bg-pink-300' : 'bg-purple-300'
                }`}></div>
                <p className="text-gray-500 text-sm font-light">{feature.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage; 