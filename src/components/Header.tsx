import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Home, Grid3X3, HelpCircle, Mic } from 'lucide-react';

interface HeaderProps {
  currentSection: string;
  onAIToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentSection, onAIToggle }) => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-40 bg-white/10 backdrop-blur-xl border-b border-white/20"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <motion.div 
          className="flex items-center space-x-3"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
              Digital Saathi AI
            </h1>
            <p className="text-xs text-gray-300">आपका डिजिटल सहायक</p>
          </div>
        </motion.div>

        <nav className="hidden md:flex items-center space-x-8">
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'services', label: 'Services', icon: Grid3X3 },
            { id: 'how-it-works', label: 'How It Works', icon: HelpCircle },
          ].map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => scrollToSection(id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
                currentSection === id
                  ? 'bg-white/20 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{label}</span>
            </motion.button>
          ))}
        </nav>

        <motion.button
          onClick={onAIToggle}
          className="bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 px-6 py-3 rounded-full font-semibold shadow-lg flex items-center space-x-2 transition-all duration-300"
          whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)" }}
          whileTap={{ scale: 0.95 }}
        >
          <Mic className="w-5 h-5" />
          <span className="hidden sm:inline">Start AI Help</span>
          <span className="sm:hidden">AI</span>
        </motion.button>
      </div>
    </motion.header>
  );
};

export default Header;