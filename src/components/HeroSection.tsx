import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onAIToggle: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onAIToggle }) => {
  const [isListening, setIsListening] = useState(false);

  const handleVoiceClick = () => {
    setIsListening(!isListening);
    onAIToggle();
  };

  const examples = [
    "बिजली की समस्या है",
    "फॉर्म भरना है", 
    "दवाई चाहिए",
    "पानी की शिकायत करनी है"
  ];

  return (
    <section id="home" className="min-h-screen flex items-center justify-center px-4 pt-20">
      <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Text Content */}
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="space-y-4">
            <motion.div
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-500/20 to-purple-500/20 backdrop-blur-sm border border-primary-500/30 rounded-full px-4 py-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-primary-400 font-medium">AI-Powered Assistant</span>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                बस बोलिए,
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-secondary-400 bg-clip-text text-transparent">
                आपकी मदद तैयार है
              </span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-gray-300 max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              No typing. No confusion. Just your voice.
            </motion.p>
          </div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-gray-400 font-medium">Try saying:</p>
            <div className="flex flex-wrap gap-3">
              {examples.map((example, index) => (
                <motion.span
                  key={index}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm text-gray-300 hover:bg-white/20 transition-all duration-300 cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  "{example}"
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Right Side - AI Entry */}
        <motion.div
          className="flex flex-col items-center space-y-8"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Large Mic Button */}
          <motion.div
            className="relative"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.button
              onClick={handleVoiceClick}
              className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-r from-primary-500 to-purple-600 flex items-center justify-center shadow-2xl transition-all duration-300 ${
                isListening ? 'animate-pulse' : ''
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  "0 0 40px rgba(59, 130, 246, 0.5)",
                  "0 0 80px rgba(139, 92, 246, 0.8)",
                  "0 0 40px rgba(59, 130, 246, 0.5)"
                ]
              }}
              transition={{ 
                boxShadow: { duration: 3, repeat: Infinity },
                scale: { duration: 0.2 }
              }}
            >
              <Mic className="w-12 h-12 md:w-16 md:h-16 text-white" />
              
              {/* Pulse rings */}
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full bg-primary-500/30 animate-pulse-ring" />
                  <div className="absolute inset-0 rounded-full bg-purple-500/30 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
                </>
              )}
            </motion.button>
          </motion.div>

          {/* AI Avatar */}
          <motion.div
            className="w-20 h-20 bg-gradient-to-r from-secondary-400 to-primary-400 rounded-full flex items-center justify-center shadow-xl"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-3xl">🤖</span>
          </motion.div>

          {/* AI Chat Preview */}
          <motion.div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-sm">🤖</span>
              </div>
              <div>
                <p className="font-semibold text-white">Digital Saathi</p>
                <p className="text-xs text-green-400 flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Online
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="bg-primary-500/20 rounded-lg p-3">
                <p className="text-sm text-white">आपको किस चीज़ में मदद चाहिए?</p>
              </div>
              
              <div className="flex space-x-2">
                <button className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-2 text-xs text-white transition-all duration-300 flex items-center justify-center space-x-1">
                  <Mic className="w-3 h-3" />
                  <span>बोलकर बताएं</span>
                </button>
                <button className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-2 text-xs text-white transition-all duration-300">
                  या लिखें
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;