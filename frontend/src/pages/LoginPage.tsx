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

  useEffect(() => {
    // Minimal entrance animation
    const elements = [titleRef.current, subtitleRef.current, buttonRef.current];
    
    gsap.set(elements, { opacity: 0, y: 20 });
    
    gsap.to(elements, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "power2.out"
    });
  }, []);

  const handleLogin = () => {
    onLogin();
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen relative overflow-hidden bg-black"
    >
      {/* Ultra Minimal Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/[0.01] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/[0.01] rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <motion.div 
          className="max-w-lg w-full text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        >
          {/* Ultra Minimal Logo */}
          <motion.div 
            className="mb-20"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="w-12 h-12 mx-auto rounded-xl bg-white flex items-center justify-center">
              <div className="w-6 h-6 bg-black rounded-lg"></div>
            </div>
          </motion.div>

          {/* Title */}
          <h1 
            ref={titleRef}
            className="text-5xl md:text-6xl font-extralight text-white mb-8 tracking-wide"
          >
            Refrain
          </h1>

          {/* Subtitle */}
          <p 
            ref={subtitleRef}
            className="text-base text-gray-500 mb-20 font-extralight leading-relaxed max-w-xs mx-auto"
          >
            Musical universe visualization
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

          {/* Ultra Minimal Features */}
          <motion.div 
            className="mt-24 flex justify-center space-x-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 1 }}
          >
            {['Intelligent', 'Minimal', 'Real-time'].map((feature, i) => (
              <div key={feature} className="space-y-3">
                <div className="w-1 h-1 mx-auto rounded-full bg-white/30"></div>
                <p className="text-gray-600 text-xs font-extralight tracking-wide">{feature}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage; 