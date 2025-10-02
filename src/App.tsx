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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-poppins relative overflow-x-hidden">
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
            className="relative w-20 h-20 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-all duration-300 group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: [
                "0 0 30px rgba(59, 130, 246, 0.6)",
                "0 0 50px rgba(139, 92, 246, 0.9)",
                "0 0 30px rgba(59, 130, 246, 0.6)"
              ]
            }}
            transition={{
              boxShadow: { duration: 2, repeat: Infinity },
              scale: { duration: 0.2 }
            }}
          >
            <div className="absolute inset-0 w-20 h-20 bg-primary-500/30 rounded-full animate-pulse-ring"></div>
            <div
              className="absolute inset-0 w-20 h-20 bg-purple-500/30 rounded-full animate-pulse-ring"
              style={{ animationDelay: '0.5s' }}
            ></div>

            <div className="relative z-10 flex flex-col items-center">
              <span className="text-3xl mb-1">🤖</span>
              <span className="text-xs font-bold">AI</span>
            </div>

            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              बोलकर मदद लें
            </div>
          </motion.button>
        </motion.div>
      )}

      {!isAIOpen && (
        <motion.div
          className="fixed bottom-32 right-6 z-40 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 max-w-xs"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2 }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-sm">🤖</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">Digital Saathi</p>
              <p className="text-gray-300 text-xs">मदद के लिए क्लिक करें</p>
            </div>
          </div>
          <motion.div
            className="mt-2 text-xs text-primary-300"
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