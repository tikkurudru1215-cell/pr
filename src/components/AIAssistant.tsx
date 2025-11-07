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

// Helper to determine the language for Text-to-Speech voice selection
const detectContentLanguage = (text: string): string => {
  // Checks for Devanagari characters (Hindi)
  const hindiChars = /[\u0900-\u097F]/; 
  return hindiChars.test(text) ? 'hi-IN' : 'en-US'; 
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');
  
  const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
  const [voiceSupported, setVoiceSupported] = useState(!!SpeechRecognition);
  
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
  }, [messages, isQuickActionsVisible, liveTranscription]); 

  // Initialize Native Speech Synthesis and Voice Collection (Most Robust Logic)
  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;

      const loadVoices = () => {
        const availableVoices = synthRef.current?.getVoices();
        
        // Priority 1: Dedicated Hindi or Indian language voice
        let hiVoice = availableVoices?.find(voice =>
          voice.lang.includes('hi') || voice.lang.includes('IN')
        ); 
        
        // Standard English voice
        const enVoice = availableVoices?.find(voice =>
            voice.lang.includes('en-US') || voice.lang.includes('en-GB')
        );
        
        // --- ULTIMATE FALLBACK LOGIC ---
        // If no explicit Hindi voice is found (hiVoice is null):
        // 1. Try Indian English (en-IN).
        // 2. Fallback to any found Standard English voice (enVoice).
        // 3. Fallback to the very first voice in the list (ultimateFallbackVoice).
        const ultimateFallbackVoice = availableVoices?.[0] || null;
        
        if (!hiVoice) {
            hiVoice = availableVoices?.find(voice => voice.lang.includes('en-IN'));
        }
        
        const finalHiVoice = hiVoice || enVoice || ultimateFallbackVoice;
        // -----------------------------

        setVoices({ hi: finalHiVoice || null, en: enVoice || null });
        
        console.log("TTS Voices Loaded:");
        console.log(`  - Hindi Voice (hi): ${finalHiVoice ? finalHiVoice.name : 'Not Found (Using Browser Default)'}`);
        console.log(`  - English Voice (en): ${enVoice ? enVoice.name : 'Not Found'}`);
      };

      loadVoices();
      synthRef.current.onvoiceschanged = loadVoices;
    }

    if (SpeechRecognition) {
      setVoiceSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; 
      recognitionRef.current.interimResults = true; 
      
      // Set VTT to Hindi-India for transcription priority
      recognitionRef.current.lang = 'hi-IN'; 

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setLiveTranscription('🎤 सुन रहा हूं... अब बोलिए'); 
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setLiveTranscription(interimTranscript || '...'); 
        
        if (finalTranscript.trim()) {
            recognitionRef.current?.stop(); 
            setInputValue(finalTranscript);
            setLiveTranscription(finalTranscript); 
            setTimeout(() => {
                setLiveTranscription('');
                handleSendMessage(finalTranscript, true);
            }, 500);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setLiveTranscription(getErrorMessage('hi'));
        setTimeout(() => setLiveTranscription(''), 3000);
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
        content: 'नमस्कार! मैं आपका डिजिटल साथी हूं। मैं हिंदी में बात कर सकता हूं और समझ सकता हूं। मैं आपकी कैसे मदद कर सकता हूं?',
        timestamp: new Date()
      };
      setMessages([initialMessage]);
      setTimeout(() => {
        speakText(initialMessage.content);
      }, 1000);
    }
  }, [isOpen]);

  // Updated error message function for Hindi focus
  const getErrorMessage = (lang: 'en' | 'hi') => {
    return 'माफ़ करना, माइक में कोई समस्या है। अनुमति जांचें और फिर प्रयास करें।';
  };

  /**
   * TTS FIX: Segments text by language and reads sequentially using correct voices.
   */
  const speakText = (text: string) => {
    if (!synthRef.current) return;

    synthRef.current.cancel();
    setIsSpeaking(true);

    // Simple robust segmentation logic: split by Devanagari characters
    // This allows us to apply the hi-IN lang code to the Hindi parts and en-US to the English parts.
    const chunks = text.split(/([\u0900-\u097F]+)/g).filter(chunk => chunk.length > 0);

    const combinedSegments: { text: string, lang: string }[] = [];

    for (const chunk of chunks) {
        const langCode = detectContentLanguage(chunk);
        combinedSegments.push({ text: chunk.trim(), lang: langCode });
    }

    let segmentIndex = 0;

    const speakNext = () => {
      if (segmentIndex >= combinedSegments.length) {
        setIsSpeaking(false);
        return;
      }

      const segment = combinedSegments[segmentIndex];
      segmentIndex++;

      if (segment.text.length === 0) {
          speakNext(); // Skip empty segments
          return;
      }

      const utterance = new SpeechSynthesisUtterance(segment.text);
      
      // CRITICAL: Set the correct language code for the segment
      utterance.lang = segment.lang;
      
      // Select the voice. voices.hi now has a non-null value due to the fallback.
      const voice = segment.lang === 'hi-IN' ? voices.hi : voices.en;

      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.rate = 1.0; 
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = speakNext; // CRITICAL: Chain the next segment here
      utterance.onerror = (event) => {
          console.error(`Speech synthesis error on segment (${segment.lang}):`, event.error);
          speakNext(); 
      };
      
      synthRef.current!.speak(utterance);
    };

    // Start speaking the first segment
    speakNext();
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleVoiceInput = () => {
    if (!voiceSupported) {
      console.error('Your browser does not support voice recognition.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        setInputValue(''); 
        setLiveTranscription(''); 
        recognitionRef.current?.start();
      } catch (error) {
        console.error('वॉयस रिकग्निशन शुरू करने में त्रुटि:', error);
        setIsListening(false);
        setLiveTranscription('वॉयस रिकग्निशन शुरू करने में त्रुटि।');
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
      // AI के टाइपिंग संदेश को हिंदी में सेट करें
      content: 'टाइप कर रहा है...',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, typingMessage]);
    scrollToBottom();

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
      
      // हमेशा हिंदी त्रुटि संदेश दिखाएँ
      const errorMessageText = `मैं आपकी मदद नहीं कर पा रहा हूं। कृपया कुछ समय बाद फिर कोशिश करें। (त्रुटि: ${error instanceof Error ? error.message.substring(0, 30) + '...' : 'अज्ञात'})`;
        
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: errorMessageText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      speakText(errorMessage.content);
    }
  };

  // त्वरित क्रियाओं को हिंदी में बदलें
  const quickActions = [
    '💡 बिजली की शिकायत करनी है',
    '📚 छात्रवृत्ति की जानकारी',
    '🖥️ मेरा ऐप काम नहीं कर रहा है',
    '🚨 नजदीकी पुलिस कहाँ है',
    '💦 पानी की समस्या की शिकायत', 
    '🏘️ पीएम आवास योजना की जानकारी', 
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-8 max-h-screen overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-gray-500/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        <motion.div
          className={`relative bg-backgroundCard border border-gray-300 rounded-none sm:rounded-3xl shadow-2xl w-full max-w-full lg:max-w-4xl xl:max-w-5xl flex flex-col transition-all duration-300 text-textDark`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <motion.div
                className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary-600 to-accentPrimary-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-xl sm:text-lg text-white">🤖</span>
              </motion.div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-textDark leading-tight">डिजिटल साथी AI</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  <span className="text-green-600 font-medium text-xs">
                    {voiceSupported ? 'वॉयस रेडी 🎤' : 'केवल टेक्स्ट 📝'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              {isSpeaking && (
                <motion.button
                  onClick={stopSpeaking}
                  className="hidden sm:flex items-center space-x-2 bg-red-100 hover:bg-red-200 px-3 sm:px-4 py-1 rounded-full transition-colors"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Volume2 className="w-4 h-4 text-red-600" />
                  <span className="text-red-600 text-sm">बोलना रोकें</span>
                </motion.button>
              )}
              <motion.button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Minimize2 className="w-5 h-5 sm:w-5 sm:h-5 text-textMuted" />
              </motion.button>
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
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-backgroundLight">
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
                        message.type === 'user'
                          ? 'bg-primary-600 text-white' 
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
                            <span className="text-sm font-medium text-textDark">🤖 डिजिटल साथी</span>
                          )}
                          {message.isVoice && (
                            <span className="text-xs bg-black/10 px-2 py-1 rounded-full text-white">🎤 वॉयस</span>
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
                      <p className={`text-sm sm:text-base leading-relaxed whitespace-pre-line ${message.type === 'ai' ? 'text-textDark' : 'text-white'}`}>{message.content}</p>
                      <p className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-white/80' : 'text-textMuted'
                      }`}>
                        {/* समय प्रारूप हिंदी या अंग्रेजी पर आधारित है */}
                        {message.timestamp.toLocaleTimeString(detectContentLanguage(message.content), {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              <div className="px-4 sm:px-6 flex-shrink-0 border-t border-gray-200 pt-2 bg-backgroundCard">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-textMuted text-sm font-medium">त्वरित क्रियाएँ - एक क्लिक में:</p>
                  <motion.button 
                    onClick={() => setIsQuickActionsVisible(!isQuickActionsVisible)}
                    className="text-textDark p-1 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label={isQuickActionsVisible ? "त्वरित क्रियाएँ छिपाएँ" : "त्वरित क्रियाएँ दिखाएँ"}
                  >
                    {isQuickActionsVisible ? (
                      <ChevronDown className="w-5 h-5 text-textMuted" />
                    ) : (
                      <ChevronUp className="w-5 h-5 text-textMuted" />
                    )}
                  </motion.button>
                </div>

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


              {/* Input */}
              <div className="px-4 sm:px-6 py-2 pt-0 flex-shrink-0 bg-backgroundCard">
                
                {/* --- Live Transcription Bar --- */}
                <AnimatePresence>
                {liveTranscription && (
                    <motion.div
                      className={`text-center py-2 px-4 rounded-lg mb-2 ${
                        isListening 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                      } font-medium text-sm`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                        {liveTranscription}
                    </motion.div>
                  )}
                  </AnimatePresence>

                <div className="flex items-center space-x-4 bg-gray-100 border border-gray-200 rounded-2xl p-3 sm:p-4">
                  <motion.button
                    onClick={handleVoiceInput}
                    className={`p-3 sm:p-4 rounded-full transition-all duration-300 ${
                        isListening
                            ? 'bg-red-500 animate-pulse shadow-lg' 
                            : voiceSupported
                            ? 'bg-gradient-to-r from-primary-600 to-accentPrimary-500 hover:from-primary-700 hover:to-accentPrimary-600' 
                            : 'bg-gray-400 cursor-not-allowed' 
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
                    placeholder={voiceSupported ? "बोलिए या यहाँ लिखें..." : "यहाँ लिखें..."}
                    className="flex-1 bg-transparent text-textDark placeholder-textMuted focus:outline-none text-sm sm:text-base"
                  />

                  <motion.button
                    onClick={() => handleSendMessage()}
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
                    >
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
                      ⚠️ वॉयस फीचर के लिए Chrome, Firefox, या Edge जैसे ब्राउज़र का उपयोग करें।
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