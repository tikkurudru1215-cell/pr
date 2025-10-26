import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import Header from "./components/Header";
import HeroSection from './components/HeroSection';
import ServiceCategories from './components/ServiceCategories';
import HowItWorks from './components/HowItWorks';
import AIAssistant from './components/AIAssistant';
import ParticleBackground from './components/ParticleBackground';

interface Service {
  _id: string;
  name: string;
  description: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState('home');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'services', 'how-it-works'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setCurrentSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/services`);
        setServices(response.data);
        setError('');
      } catch (error) {
        console.error('Failed to fetch services:', error);
        setError('Failed to load services. Please ensure the backend is running and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    // Changed to light background and dark text
    <div className="min-h-screen bg-backgroundLight text-textDark font-poppins relative overflow-x-hidden"> 
      <ParticleBackground />

      <Header
        currentSection={currentSection}
        onAIToggle={() => setIsAIOpen(!isAIOpen)}
      />

      <main className="relative z-10">
        <HeroSection onAIToggle={() => setIsAIOpen(true)} />
        <ServiceCategories
          services={services}
          loading={loading}
          error={error}
          onAIToggle={() => setIsAIOpen(true)}
        />
        <HowItWorks onAIToggle={() => setIsAIOpen(true)} />

        {/* Removed redundant Services List Section from App.tsx */}
      </main>

      <AIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />

      {!isAIOpen && (
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.button
            onClick={() => setIsAIOpen(true)}
            // Clean gradient: Blue to Teal
            className="relative w-16 h-16 bg-gradient-to-r from-primary-600 to-accentPrimary-500 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-all duration-300 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: [
                "0 0 15px rgba(37, 99, 235, 0.4)", // Primary Blue
                "0 0 25px rgba(20, 184, 166, 0.6)", // Accent Teal
                "0 0 15px rgba(37, 99, 235, 0.4)"
              ]
            }}
            transition={{
              boxShadow: { duration: 2, repeat: Infinity },
              scale: { duration: 0.2 }
            }}
          >
            {/* Simplified avatar appearance */}
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-2xl mb-0.5">🤖</span>
            </div>

            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-textDark text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              बोलकर मदद लें
            </div>
          </motion.button>
        </motion.div>
      )}

      {/* Simplified welcome banner */}
      {!isAIOpen && (
        <motion.div
          // Light background/darker text for banner
          className="fixed bottom-24 right-6 z-40 bg-backgroundCard border border-gray-200 rounded-xl p-3 max-w-xs text-textDark shadow-lg" 
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2 }}
        >
          <div className="flex items-center space-x-2">
            {/* Clean logo gradient */}
            <div className="w-7 h-7 bg-gradient-to-r from-primary-600 to-accentPrimary-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white">🤖</span>
            </div>
            <div>
              <p className="font-medium text-textDark text-sm">Digital Saathi</p>
              <p className="text-textMuted text-xs">मदद के लिए क्लिक करें</p>
            </div>
          </div>
          <motion.div
            className="mt-2 text-xs text-primary-600"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🎤 "बिजली की समस्या है" बोलकर देखें
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default App;