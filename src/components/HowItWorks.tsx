import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Mic, Brain, FileCheck, CheckCircle } from 'lucide-react';

interface HowItWorksProps {
  onAIToggle: () => void;
}

const HowItWorks: React.FC<HowItWorksProps> = ({ onAIToggle }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const steps = [
    {
      step: 1,
      icon: Mic,
      title: 'User Just Speaks',
      description: 'बस अपनी आवाज़ में बताएं कि आपको क्या चाहिए',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      step: 2,
      icon: Brain,
      title: 'AI Understands',
      description: 'AI आपकी बात समझकर पुष्टि करता है',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      step: 3,
      icon: FileCheck,
      title: 'AI Takes Action',
      description: 'AI फॉर्म भरता है या शिकायत दर्ज करता है',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10'
    },
    {
      step: 4,
      icon: CheckCircle,
      title: 'Confirmation',
      description: 'AI बताता है कि क्या किया गया है',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          ref={ref}
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
              यह कैसे काम करता है
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Simple 4-step process to get your work done without any hassle
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative"
            >
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary-500/50 to-purple-500/50 transform translate-x-4 z-0" />
              )}

              <motion.div
                className={`relative ${step.bgColor} backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center group hover:scale-105 transition-all duration-300 z-10`}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
                }}
              >
                {/* Step number */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className={`w-8 h-8 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                    {step.step}
                  </div>
                </div>

                {/* Icon */}
                <motion.div
                  className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-all duration-300`}
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.5
                  }}
                >
                  <step.icon className="w-8 h-8 text-white" />
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-white transition-colors">
                  {step.title}
                </h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                  {step.description}
                </p>

                {/* Animated background */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  animate={{
                    opacity: [0, 0.05, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.7
                  }}
                />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Demo Section */}
        <motion.div
          className="mt-20 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Try It Now! 
            </h3>
            <p className="text-gray-300">
              Experience the power of voice-first AI assistance
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">1</span>
                  </div>
                  <span className="text-white font-medium">Say:</span>
                </div>
                <p className="text-primary-300 italic">"मुझे बिजली कनेक्शन के लिए फॉर्म भरना है"</p>
              </div>
              
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">2</span>
                  </div>
                  <span className="text-white font-medium">AI responds:</span>
                </div>
                <p className="text-purple-300 italic">"बिल्कुल! मैं आपकी बिजली कनेक्शन का फॉर्म भरने में मदद करूंगा..."</p>
              </div>
            </div>

            <motion.button
              onClick={onAIToggle}
              className="bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 px-8 py-6 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center space-x-3 w-full transition-all duration-300"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 0 50px rgba(59, 130, 246, 0.5)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              <Mic className="w-6 h-6" />
              <span>Start Demo</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🎤
              </motion.div>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;