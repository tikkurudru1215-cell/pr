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
      // Light background, dark text
      className="fixed top-0 left-0 right-0 z-40 bg-backgroundCard/95 backdrop-blur-md border-b border-gray-200 text-textDark"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <motion.div 
          className="flex items-center space-x-3"
          whileHover={{ scale: 1.05 }}
        >
          {/* Logo: Blue to Teal */}
          <div className="w-9 h-9 bg-gradient-to-r from-primary-600 to-accentPrimary-500 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            {/* Title text is dark */}
            <h1 className="text-lg font-bold text-textDark">
              Digital Saathi AI
            </h1>
            <p className="text-xs text-textMuted">आपका डिजिटल सहायक</p>
          </div>
        </motion.div>

        <nav className="hidden md:flex items-center space-x-6">
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'services', label: 'Services', icon: Grid3X3 },
            { id: 'how-it-works', label: 'How It Works', icon: HelpCircle },
          ].map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => scrollToSection(id)}
              className={`flex items-center space-x-2 px-3 py-1 rounded-full transition-all duration-300 ${
                // Highlight button using core blue
                currentSection === id
                  ? 'bg-primary-600 text-white' // Solid color highlight
                  : 'text-textMuted hover:text-textDark hover:bg-gray-100' // Light hover state
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
          // Primary Action Button: Blue to Teal
          className="bg-gradient-to-r from-primary-600 to-accentPrimary-500 hover:from-primary-700 hover:to-accentPrimary-600 px-5 py-2 rounded-full font-semibold shadow-md flex items-center space-x-2 transition-all duration-300 text-white" // Text is white on dark button
          whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(37, 99, 235, 0.3)" }}
          whileTap={{ scale: 0.95 }}
        >
          <Mic className="w-4 h-4" />
          <span className="hidden sm:inline">Start AI Help</span>
          <span className="sm:hidden">AI</span>
        </motion.button>
      </div>
    </motion.header>
  );
};

export default Header;