import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Mic, 
  Send, 
  Volume2, 
  Minimize2, 
  MicOff, 
  ChevronUp, 
  ChevronDown 
} from 'lucide-react';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
}

// --- NEW LANGUAGE DETECTION FUNCTION ---
const detectContentLanguage = (text: string): 'hi-IN' | 'en-US' => {
  const hindiChars = /[\u0900-\u097F]/; 
  return hindiChars.test(text) ? 'hi-IN' : 'en-US';
};
// ----------------------------------------

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const [isQuickActionsVisible, setIsQuickActionsVisible] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  
  const [voices, setVoices] = useState<{ hi: SpeechSynthesisVoice | null, en: SpeechSynthesisVoice | null }>({ hi: null, en: null });


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isQuickActionsVisible]); 

  // Initialize Speech Synthesis and Speech Recognition
  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;

      const loadVoices = () => {
        const availableVoices = synthRef.current?.getVoices();
        
        const hiVoice = availableVoices?.find(voice =>
          voice.lang.includes('hi') || voice.lang.includes('IN')
        ) || availableVoices?.find(voice => voice.lang.includes('en-IN') || voice.lang.includes('en-US'));

        const enVoice = availableVoices?.find(voice =>
            voice.lang.includes('en-US') || voice.lang.includes('en-GB')
        );

        setVoices({ hi: hiVoice || null, en: enVoice || null });
      };

      loadVoices();
      synthRef.current.onvoiceschanged = loadVoices;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (SpeechRecognition) {
      setVoiceSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'hi-IN';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
        setTimeout(() => {
          handleSendMessage(transcript, true);
        }, 500);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        const errorMessage = getErrorMessage(event.error);
        console.error(`Voice input error: ${errorMessage}`);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setVoiceSupported(false);
    }

    if (isOpen && messages.length === 0) {
      const initialMessage: Message = {
        id: 'welcome-1',
        type: 'ai',
        content: 'नमस्कार! मैं आपका Digital Saathi हूं। आपको किस चीज़ में मदद चाहिए? आप बोल सकते हैं या लिख सकते हैं।',
        timestamp: new Date()
      };
      setMessages([initialMessage]);
      setTimeout(() => {
        speakText(initialMessage.content);
      }, 1000);
    }
  }, [isOpen]);

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'no-speech':
        return 'कोई आवाज़ नहीं सुनाई दी। कृपया फिर से कोशिश करें।';
      case 'audio-capture':
        return 'माइक्रोफोन की अनुमति दें और फिर कोशिश करें।';
      case 'not-allowed':
        return 'माइक्रोफोन की अनुमति दें। Settings में जाकर microphone को allow करें।';
      default:
        return 'Voice recognition में समस्या है। कृपया फिर कोशिश करें।';
    }
  };

  const speakText = (text: string) => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      
      const langCode = detectContentLanguage(text); 
      
      utterance.lang = langCode;
      
      if (langCode === 'hi-IN' && voices.hi) {
        utterance.voice = voices.hi;
      } else if (langCode === 'en-US' && voices.en) {
        utterance.voice = voices.en;
      }
      
      utterance.rate = 1.0; 
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setIsSpeaking(false);
      };
      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleVoiceInput = () => {
    if (!voiceSupported) {
      console.error('आपका browser voice recognition support नहीं करता। कृपया Chrome, Firefox या Edge का उपयोग करें।');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        setIsListening(true);
        recognitionRef.current?.start();
      } catch (error) {
        console.error('Error starting voice recognition:', error);
        setIsListening(false);
        console.error('Voice recognition start करने में समस्या है। कृपया microphone की permission check करें।');
      }
    }
  };

  const handleSendMessage = async (messageText?: string, isVoiceMessage = false) => {
    const text = messageText || inputValue;
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date(),
      isVoice: isVoiceMessage,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    const typingMessage: Message = {
      id: 'typing',
      type: 'ai',
      content: 'टाइप कर रहा है...',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'guest_user', 
          message: text,
          conversationId: conversationId,
        }),
      });

      const data = await response.json();
      
      if (response.status !== 200) {
        throw new Error(data.error || "Backend server returned an error status.");
      }

      setConversationId(data.conversationId);

      setMessages(prev => {
        const newMessages = prev.filter(msg => msg.id !== 'typing');
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: data.aiResponse,
          timestamp: new Date(),
        };
        return [...newMessages, aiMessage];
      });

      setTimeout(() => {
        speakText(data.aiResponse);
      }, 500);

    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `मैं आपकी मदद नहीं कर पा रहा हूं। कृपया कुछ समय बाद फिर कोशिश करें। (Error: ${error instanceof Error ? error.message.substring(0, 50) + '...' : 'Unknown'})`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

// START of Quick Actions Change
// Updated Quick Actions list as requested
  const quickActions = [
    // Grievance Tool-based (Kept)
    '💡 बिजली की शिकायत करनी है',
    // Education Help (Kept)
    '📚 छात्रवृत्ति की जानकारी',
    // Technical Support (Kept)
    '🖥️ मेरा ऐप काम नहीं कर रहा है',
    // Emergency/Geospatial (Kept)
    '🚨 नजदीकी पुलिस कहाँ है',
    // NEW: Water Problem (Maps to 'Water Problem' service and complainService)
    '💦 पानी नहीं आ रहा है', 
    // NEW: Scheme Lookup (Maps to 'getSchemeAndEducationData' tool)
    '🏘️ पीएम आवास योजना की जानकारी', 
  ];
// END of Quick Actions Change

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-8 max-h-screen overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop: Lightened background dimming */}
        <motion.div
          className="absolute inset-0 bg-gray-500/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Chat Window: Light theme box */}
        <motion.div
          className={`relative bg-backgroundCard border border-gray-300 rounded-none sm:rounded-3xl shadow-2xl w-full max-w-full lg:max-w-4xl xl:max-w-5xl flex flex-col transition-all duration-300 text-textDark`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          {/* Header (Top part) - Light background, dark text */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
            {/* Left side (Avatar and Status) */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <motion.div
                className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary-600 to-accentPrimary-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-xl sm:text-lg text-white">🤖</span>
              </motion.div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-textDark leading-tight">Digital Saathi AI</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  <span className="text-green-600 font-medium text-xs">
                    {voiceSupported ? 'Voice Ready 🎤' : 'Text Only 📝'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right side (Controls) */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              {isSpeaking && (
                <motion.button
                  onClick={stopSpeaking}
                  className="hidden sm:flex items-center space-x-2 bg-red-100 hover:bg-red-200 px-3 sm:px-4 py-1 rounded-full transition-colors"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Volume2 className="w-4 h-4 text-red-600" />
                  <span className="text-red-600 text-sm">बोल रहा है - रोकें</span>
                </motion.button>
              )}
              {/* MINIMIZE button */}
              <motion.button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Minimize2 className="w-5 h-5 sm:w-5 sm:h-5 text-textMuted" />
              </motion.button>
              {/* CLOSE button (across sign) */}
              <motion.button
                onClick={onClose}
                className="p-2 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5 sm:w-5 sm:h-5 text-textMuted" />
              </motion.button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages (The big text chat area) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-backgroundLight"> {/* Light background for chat area */}
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`max-w-xs sm:max-w-lg px-4 sm:px-6 py-3 sm:py-4 rounded-2xl ${
                        // Light theme message bubbles
                        message.type === 'user'
                          ? 'bg-primary-600 text-white' // User text remains white on blue background
                          : message.id === 'typing'
                          ? 'bg-gray-100 text-textMuted border border-gray-300'
                          : 'bg-backgroundCard border border-gray-200 text-textDark'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <div className="flex items-center space-x-2">
                          {message.type === 'user' ? (
                            <span className="text-sm font-medium">आप</span>
                          ) : (
                            <span className="text-sm font-medium text-textDark">🤖 Digital Saathi</span>
                          )}
                          {message.isVoice && (
                            <span className="text-xs bg-black/10 px-2 py-1 rounded-full text-white">🎤 Voice</span>
                          )}
                        </div>
                        {message.type === 'ai' && message.id !== 'typing' && (
                          <button
                            onClick={() => speakText(message.content)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full transition-colors flex items-center space-x-1 text-primary-600"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>सुनें</span>
                          </button>
                        )}
                      </div>
                      {/* Text color based on message type */}
                      <p className={`text-sm sm:text-base leading-relaxed whitespace-pre-line ${message.type === 'ai' ? 'text-textDark' : 'text-white'}`}>{message.content}</p>
                      <p className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-white/80' : 'text-textMuted'
                      }`}>
                        {message.timestamp.toLocaleTimeString('hi-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions (The minimized bottom section) */}
              <div className="px-4 sm:px-6 flex-shrink-0 border-t border-gray-200 pt-2 bg-backgroundCard"> {/* Light background */}
                {/* Quick Actions Header and Toggle */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-textMuted text-sm font-medium">Quick Actions - एक क्लिक में:</p>
                  <motion.button 
                    onClick={() => setIsQuickActionsVisible(!isQuickActionsVisible)}
                    className="text-textDark p-1 rounded-full hover:bg-gray-100 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={isQuickActionsVisible ? "Minimize Quick Actions" : "Expand Quick Actions"}
                  >
                    {isQuickActionsVisible ? (
                      <ChevronDown className="w-5 h-5 text-textMuted" />
                    ) : (
                      <ChevronUp className="w-5 h-5 text-textMuted" />
                    )}
                  </motion.button>
                </div>

                {/* Quick Actions Grid (Collapsed by Default, maximizing chat area) */}
                <AnimatePresence initial={false}>
                  {isQuickActionsVisible && (
                    <motion.div
                      className="pb-4" 
                      key="quick-actions-grid"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {quickActions.map((action, index) => (
                          <motion.button
                            key={index}
                            onClick={() => handleSendMessage(action)}
                            // Light action button style
                            className="bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl px-3 py-2 text-sm text-textDark transition-all duration-300 text-left"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {action}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>


              {/* Input (Fixed size at the bottom) */}
              <div className="px-4 sm:px-6 py-2 pt-0 flex-shrink-0 bg-backgroundCard">
                <div className="flex items-center space-x-4 bg-gray-100 border border-gray-200 rounded-2xl p-3 sm:p-4">
                  <motion.button
                    onClick={handleVoiceInput}
                    // Mic button: Blue to Teal, White icon
                    // CORRECTED CODE
className={`p-3 sm:p-4 rounded-full transition-all duration-300 ${
    isListening
        ? 'bg-red-500 animate-pulse shadow-lg' // If listening
        : voiceSupported
        ? 'bg-gradient-to-r from-primary-600 to-accentPrimary-500 hover:from-primary-700 hover:to-accentPrimary-600' // If not listening AND voice is supported
        : 'bg-gray-400 cursor-not-allowed' // If not listening AND voice is NOT supported
}`}
                    whileHover={voiceSupported ? { scale: 1.1 } : {}}
                    whileTap={voiceSupported ? { scale: 0.9 } : {}}
                    disabled={!voiceSupported}
                  >
                    {isListening ? (
                      <MicOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    ) : (
                      <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    )}
                  </motion.button>

                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={voiceSupported ? "यहाँ लिखें या माइक दबाकर बोलें..." : "यहाँ लिखें..."}
                    className="flex-1 bg-transparent text-textDark placeholder-textMuted focus:outline-none text-sm sm:text-base"
                  />

                  <motion.button
                    onClick={() => handleSendMessage()}
                    // Send button: Blue to Teal
                    className="p-3 sm:p-4 bg-gradient-to-r from-primary-600 to-accentPrimary-500 hover:from-primary-700 hover:to-accentPrimary-600 rounded-full transition-all duration-300 disabled:opacity-50"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    disabled={!inputValue.trim()}
                  >
                    <Send className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </motion.button>
                </div>

                {isListening && (
                  <motion.div
                    className="text-center mt-4"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <p className="text-red-600 text-xl font-bold">🎤 सुन रहा हूं... अब बोलिए</p>
                    <p className="text-textMuted text-sm mt-1">स्पष्ट आवाज़ में बोलें</p>
                    <div className="flex justify-center mt-3">
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-8 bg-red-500 rounded-full"
                            animate={{
                              scaleY: [0.3, 1, 0.3],
                            }}
                            transition={{
                              duration: 0.5,
                              repeat: Infinity,
                              delay: i * 0.1,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {!voiceSupported && (
                  <div className="text-center mt-2">
                    <p className="text-accentSecondary-600 text-sm">
                      ⚠️ Voice feature के लिए Chrome, Firefox या Edge browser का उपयोग करें
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIAssistant;