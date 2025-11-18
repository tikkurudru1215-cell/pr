// backend/index.js

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import axios from "axios"; 
import { compareTwoStrings } from 'string-similarity'; 
import { format, subMonths, isSameMonth } from 'date-fns'; 

import { complainService, complainServiceToolDefinition } from "./ai/tools/complain-service.js"; 
import { getNearbyService, getNearbyServiceToolDefinition } from "./ai/tools/geospatial-service.js"; 
import { getAgricultureData, getAgricultureDataToolDefinition } from "./ai/tools/agriculture-service.js"; 
import { getSchemeAndEducationData, getSchemeAndEducationDataToolDefinition } from "./ai/tools/finance-education-service.js"; 

import Service from "./models/Service.js";
import Conversation from "./models/Conversation.js";
import Message from "./models/Message.js";

// FIXED: Using .ts extension for mockData import.
import { mockComplaints as importedMockComplaints } from "../src/data/mockData.ts"; 

// --- START NEW LANGUAGE DETECTION DEPENDENCIES (Requires npm i franc langs) ---
import { franc } from "franc"; 
import langs from "langs";
// --- END NEW LANGUAGE DETECTION DEPENDENCIES ---


// --- Setup File Paths and .env ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); 

// --- Database Connection ---
const MONGO_URI = process.env.MONGO_URI;
console.log("Loaded MONGO_URI:", MONGO_URI ? "✅ Found" : "❌ Missing");

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully.'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('   Please ensure your MongoDB server is running on the URI specified in backend/.env');
    });

// --- OpenRouter AI Setup ---
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY; 
const AI_MODEL = process.env.AI_MODEL || "openai/gpt-4o-mini"; 
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

console.log("Loaded AI_API_KEY:", OPENROUTER_API_KEY ? "✅ Found" : "❌ Missing");
console.log(`Using AI MODEL: ${AI_MODEL}`);


// --- Tool/Function Definitions and Map (SINGLE DECLARATION) ---
const toolFunctions = {
    complainService,
    getNearbyService,
    getAgricultureData, 
    getSchemeAndEducationData, 
};

// Map tool definitions to OpenRouter/OpenAI format (type: 'function' required)
const toolDefinitions = [
    complainServiceToolDefinition,
    getNearbyServiceToolDefinition,
    getAgricultureDataToolDefinition, 
    getSchemeAndEducationDataToolDefinition, 
].map(def => ({
    type: 'function',
    function: def,
}));


// --- START Enhanced Language Detection (Heuristics + Franc) ---
const SUPPORTED_LANGS = {
  hi: { tag: "hi-IN", name: "Hindi" }, mr: { tag: "mr-IN", name: "Marathi" }, ne: { tag: "ne-NP", name: "Nepali" }, doi: { tag: "doi-IN", name: "Dogri" }, kok: { tag: "kok-IN", name: "Konkani" },   mai: { tag: "mai-IN", name: "Maithili" }, sa: { tag: "sa-IN", name: "Sanskrit" }, brx: { tag: "brx-IN", name: "Bodo" },
  bn: { tag: "bn-IN", name: "Bengali" }, as: { tag: "as-IN", name: "Assamese" },
  pa: { tag: "pa-IN", name: "Punjabi" }, gu: { tag: "gu-IN", name: "Gujarati" }, or: { tag: "or-IN", name: "Odia" },
  ta: { tag: "ta-IN", name: "Tamil" }, te: { tag: "te-IN", name: "Telugu" }, kn: { tag: "kn-IN", name: "Kannada" }, ml: { tag: "ml-IN", name: "Malayalam" },
  mni: { tag: "mni-IN", name: "Manipuri" }, sat: { tag: "sat-IN", name: "Santali" },
  ur: { tag: "ur-IN", name: "Urdu" }, sd: { tag: "sd-IN", name: "Sindhi" }, ks: { tag: "ks-IN", name: "Kashmiri" },
  en: { tag: "en-IN", name: "English" },
};
const TAG_TO_NAME = Object.fromEntries(Object.values(SUPPORTED_LANGS).map(v => [v.tag, v.name]));
const NAME_TO_TAG = {
  hindi: "hi-IN", marathi: "mr-IN", nepali: "ne-NP", dogri: "doi-IN", konkani: "kok-IN", maithili: "mai-IN",
  sanskrit: "sa-IN", bodo: "brx-IN", bengali: "bn-IN", assamese: "as-IN", punjabi: "pa-IN", gujarati: "gu-IN",
  odia: "or-IN", tamil: "ta-IN", telugu: "te-IN", kannada: "kn-IN", malayalam: "ml-IN", manipuri: "mni-IN",
  santali: "sat-IN", urdu: "ur-IN", sindhi: "sd-IN", kashmiri: "ks-IN", english: "en-IN",
  "हिंदी": "hi-IN", "मराठी": "mr-IN", "नेपाली": "ne-NP", "डोगरी": "doi-IN", "कोंकणी": "kok-IN", "मैथिली": "mai-IN",
  "संस्कृत": "sa-IN", "बोड़ो": "brx-IN", "বাংলা": "bn-IN", "অসমীয়া": "as-IN", "ਪੰਜਾਬੀ": "pa-IN", "ગુજરાતી": "gu-IN",
  "ଓଡିଆ": "or-IN", "தமிழ்": "ta-IN", "తెలుగు": "te-IN", "ಕನ್ನಡ": "kn-IN", "മലയാളം": "ml-IN", "ꯃꯤꯇꯩ ꯂꯣꯟ": "mni-IN",
  "ᱥᱟᱱᱛᱟᱲᱤ": "sat-IN", "اردو": "ur-IN", "سنڌੀ": "sd-IN", "كٲشُر": "ks-IN", "marathi": "mr-IN", "kannada": "kn-IN", "tamil": "ta-IN",
};
const SCRIPT = {
  ARABIC: /[\u0600-\u06FF]/, DEVANAGARI: /[\u0900-\u097F]/, BENGALI: /[\u0980-\u09FF]/, GURMUKHI: /[\u0A00-\u0A7F]/, GUJARATI: /[\u0A80-\u0AFF]/, ORIYA: /[\u0B00-\u0B7F]/, TAMIL: /[\u0B80-\u0BFF]/, TELUGU: /[\u0C00-\u0C7F]/, KANNADA: /[\u0C80-\u0CFF]/, MALAYALAM: /[\u0D00-\u0D7F]/, MEETEI_MAYEK: /[\uABC0-\uABFF]/, OL_CHIKI: /[\u1C50-\u1C7F]/,
};
const SINDHI_UNIQUES = /[ٻ ٽ ڄ ڏ ڃ ڦ ڪ ڳ ڱ ءٔ]/; 
export function resolveLanguageOverride(text = "") { 
  const t = (text || "").trim();
  const mEn = t.toLowerCase().match(/\b(?:in|reply in|answer in|write in|respond in)\s+([a-z]+)\b/);
  if (mEn && NAME_TO_TAG[mEn[1]]) return NAME_TO_TAG[mEn[1]];
  const mDev = t.match(/([\p{Script=Devanagari}]+)\s*(?:में|मध्ये)/iu);
  if (mDev) {
    const name = mDev[1];
    if (NAME_TO_TAG[name]) return NAME_TO_TAG[name];
  }
  const mTa = t.match(/([\p{Script=Tamil}]+)(?:இல்|ல்)\b/u);
  if (mTa) {
    const name = mTa[1];
    if (NAME_TO_TAG[name]) return NAME_TO_TAG[name];
  }
  const mMl = t.match(/([\p{Script=Malayalam}]+)(?:യിൽ|ൽ)\b/u);
  if (mMl) {
    const name = mMl[1];
    if (NAME_TO_TAG[name]) return NAME_TO_TAG[name];
  }
  const plain = t.replace(/[^\p{L}\s]/gu, "").trim().toLowerCase();
  if (NAME_TO_TAG[plain]) return NAME_TO_TAG[plain];
  return null;
}
export async function detectLanguageEnhanced(text = "") {
  const trimmed = String(text).trim();
  if (!trimmed) return SUPPORTED_LANGS.en;
  try {
    const francIso3 = franc(trimmed, { minLength: 6 }); 
    if (francIso3 && francIso3 !== "und") {
      const m = langs.where("3", francIso3); 
      if (m && m["1"] && SUPPORTED_LANGS[m["1"]]) {
        return SUPPORTED_LANGS[m["1"]];
      }
      if (SUPPORTED_LANGS[francIso3]) return SUPPORTED_LANGS[francIso3];
    }
  } catch (e) {}
  if (SCRIPT.MEETEI_MAYEK.test(trimmed)) return SUPPORTED_LANGS.mni;
  if (SCRIPT.OL_CHIKI.test(trimmed)) return SUPPORTED_LANGS.sat;
  if (SCRIPT.TAMIL.test(trimmed)) return SUPPORTED_LANGS.ta;
  if (SCRIPT.TELUGU.test(trimmed)) return SUPPORTED_LANGS.te;
  if (SCRIPT.KANNADA.test(trimmed)) return SUPPORTED_LANGS.kn;
  if (SCRIPT.MALAYALAM.test(trimmed)) return SUPPORTED_LANGS.ml;
  if (SCRIPT.GUJARATI.test(trimmed)) return SUPPORTED_LANGS.gu;
  if (SCRIPT.GURMUKHI.test(trimmed)) return SUPPORTED_LANGS.pa;
  if (SCRIPT.ORIYA.test(trimmed)) return SUPPORTED_LANGS.or;
  if (SCRIPT.BENGALI.test(trimmed)) {
    if (/[ৰ ৱ য়]/.test(trimmed)) return SUPPORTED_LANGS.as;
    return SUPPORTED_LANGS.bn;
  }
  if (SCRIPT.DEVANAGARI.test(trimmed)) {
    if (/आहे|काय|तुम्ही|होणार|पाहिजे/.test(trimmed)) return SUPPORTED_LANGS.mr; 
    if (/छैन|भएको|योगदान|काठमाडौं|नेपाल/.test(trimmed)) return SUPPORTED_LANGS.ne; 
    if (/छुई|अस्सी|डोगरी|इक्खा/.test(trimmed)) return SUPPORTED_LANGS.doi; 
    if (/ꣳ|ॐ|नामः|त्वमेव|नमः/.test(trimmed)) return SUPPORTED_LANGS.sa; 
    return SUPPORTED_LANGS.hi;
  }
  if (SCRIPT.ARABIC.test(trimmed)) {
    if (SINDHI_UNIQUES.test(trimmed)) return SUPPORTED_LANGS.sd; 
    return SUPPORTED_LANGS.ur;
  }
  return SUPPORTED_LANGS.en;
}
async function ensureTargetLanguage({ answer, detectedCode, detectedLangName, headers, }) {
  try {
    const outGuess = await detectLanguageEnhanced(answer);
    if (outGuess?.tag === detectedCode) return answer;
    const sysClamp = [
      `You are a strict formatter.`,
      `Output ONLY the provided content rewritten in ${detectedLangName} (${detectedCode}).`,
      `No explanations, no translations into other languages, no romanization.`,
      `Preserve meaning; use native script of ${detectedLangName}.`,
    ].join(" ");
    const body2 = {
      model: AI_MODEL,
      temperature: 0,
      messages: [
        { role: "system", content: sysClamp },
        {
          role: "user",
          content:
            `Rewrite the following answer strictly in ${detectedLangName} (${detectedCode}) native script, with no extra text:\n\n` +
            answer,
        },
      ],
      extra_body: { prompt_language: detectedCode },
    };
    const resp2 = await axios.post(OPENROUTER_URL, body2, {
        headers,
        timeout: 20000,
    });
    const fixed = resp2?.data?.choices?.[0]?.message?.content?.trim() || answer;
    const fixedGuess = await detectLanguageEnhanced(fixed);
    if (fixedGuess?.tag === detectedCode) return fixed;
    return answer;
  } catch {
    return answer;
  }
}

// --- NEW: CONTENT CLEANUP FUNCTION TO FIX 400 BAD REQUEST ---
const cleanContent = (content) => {
    if (!content) return "";
    let cleaned = String(content);
    
    // 1. Remove all control characters and zero-width spaces that break JSON payloads
    // \u0000-\u001F (ASCII controls), \u007F-\u009F (C1 controls), \uFEFF (BOM/ZWNJ), \u200B (ZWSP)
    cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F\uFEFF\u200B]/g, ""); 
    
    // 2. Explicitly replace non-breaking spaces (U+00A0) and other complex whitespace with standard space
    cleaned = cleaned.replace(/\u00A0/g, ' '); 
    cleaned = cleaned.replace(/[\u2000-\u200A\u202F\u205F\u3000]/g, ' '); // General Unicode spaces
    
    // 3. Collapse multiple spaces and newlines into a single standard space, then trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
};
// --- END CLEANUP FUNCTION ---


async function callOpenRouterAPI(messages, toolDefinitions, forcedTag = null) {
    if (!OPENROUTER_API_KEY) {
        throw new Error("OpenRouter API Key is missing.");
    }
    const userMsg = messages[messages.length - 1]?.content || "";
    const detected = await detectLanguageEnhanced(userMsg);
    const targetTag = forcedTag || detected.tag;
    const targetName = forcedTag ? (TAG_TO_NAME[forcedTag] || "Unknown") : detected.name;
    console.log(`🌐 Target language: ${targetName} (${targetTag}) | detected from text: ${detected.name} (${detected.tag})`);
    
    // Applying CLEANUP during message mapping to ensure every piece of content is valid JSON
    const openRouterMessages = messages.map((msg) => {
      // NOTE: tool_call_id is needed for tool messages, but content is cleaned.
      if (msg.role === "tool") {
          return { 
              role: "tool", 
              tool_call_id: msg.tool_call_id, 
              content: cleanContent(msg.content) 
          };
      }
      return { 
          role: msg.role === 'ai' ? 'assistant' : msg.role, 
          content: cleanContent(msg.content) 
      };
    });

    // --- SYSTEM MESSAGES ---
    const sys1 = `You are Digital Saathi AI for Indian government services. Always write ONLY in the user's language. Target: ${targetName} (${targetTag}). Keep answers accurate, concise, and in the native script.`;
    const sys2 = `STRICT LANGUAGE RULES: 1) Output language: ${targetName} (${targetTag}) ONLY. 2) Use native script; never include English or Hindi unless explicitly requested.`;
    
    const messagesToSend = [
      { role: "system", content: sys1 },
      { role: "system", content: sys2 },
      ...openRouterMessages,
    ];
    // --- END FIX ---

    const body = {
        model: AI_MODEL,
        messages: messagesToSend,
        tools: toolDefinitions,
        temperature: 0.2,
        extra_body: {
            "prompt_language": targetTag 
        }
    };
    const headers = {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "digital-saathi-ai.app",
        "X-Title": "Digital Saathi AI",
    };
    const response = await axios.post(OPENROUTER_URL, body, {
        headers,
        timeout: 25000,
    });
    const rawAnswer = response?.data?.choices?.[0]?.message?.content || "";
    const fixedAnswer = await ensureTargetLanguage({
      answer: rawAnswer,
      detectedCode: targetTag, 
      detectedLangName: targetName, 
      headers,
    });
    if (fixedAnswer !== rawAnswer) {
      console.log(`✅ Language fixed to ${targetTag} via formatter pass.`);
      response.data.choices[0].message.content = fixedAnswer;
    }
    const looksAsciiOnly =
        /[A-Za-z]/.test(response.data.choices[0].message.content) &&
        !/[\u0900-\u0D7F\u0600-\u06FF\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\uABC0-\uABFF\u1C50-\u1C7F]/.test(
            response.data.choices[0].message.content
        );
    if (looksAsciiOnly && targetTag !== "en-IN") {
        console.warn(`⚠️ Output may still not be in ${targetName}. Consider switching AI_MODEL via .env.`);
    }
    return response.data;
}
async function performGoogleSearch(query) {
    try {
        return "";
    } catch (error) {
        console.error("❌ Google Search Fallback failed:", error);
        return "";
    }
}
// --- Helper to convert Service to Complaint format and analyze sentiment/priority ---
const analyzeAndFormatComplaint = (service) => {
    // Simple mock analysis logic is duplicated here for the backend to calculate analytics data.
    const analyzeSentiment = (text) => {
        const positiveWords = ['good', 'excellent', 'great', 'amazing', 'wonderful', 'fantastic', 'appreciate', 'thank', 'helpful', 'professional'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'urgent', 'emergency', 'damaged', 'broken', 'contaminated', 'sick', 'dangerous'];
        const lowerText = text.toLowerCase();
        const positiveScore = positiveWords.filter(word => lowerText.includes(word)).length;
        const negativeScore = negativeWords.filter(word => lowerText.includes(word)).length;
        if (positiveScore > negativeScore) return 'positive';
        if (negativeScore > positiveScore) return 'negative';
        return 'neutral';
    };

    const classifyComplaint = (text) => {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('power') || lowerText.includes('electricity') || lowerText.includes('outage')) return 'electricity';
        if (lowerText.includes('water') || lowerText.includes('supply') || lowerText.includes('contaminated')) return 'water';
        if (lowerText.includes('hospital') || lowerText.includes('health') || lowerText.includes('medical')) return 'healthcare';
        if (lowerText.includes('road') || lowerText.includes('pothole') || lowerText.includes('street')) return 'roads';
        if (lowerText.includes('school') || lowerText.includes('education') || lowerText.includes('teacher')) return 'education';
        if (lowerText.includes('waste') || lowerText.includes('garbage') || lowerText.includes('trash')) return 'waste-management';
        if (lowerText.includes('transport') || lowerText.includes('bus') || lowerText.includes('train')) return 'transportation';
        return 'other';
    };

    const predictPriority = (text) => {
        const lowerText = text.toLowerCase();
        const urgentWords = ['urgent', 'emergency', 'dangerous', 'life-threatening', 'immediate'];
        const highWords = ['serious', 'major', 'significant', 'important', 'critical'];
        const mediumWords = ['moderate', 'concerning', 'needs attention'];
        if (urgentWords.some(word => lowerText.includes(word))) return 'urgent';
        if (highWords.some(word => lowerText.includes(word))) return 'high';
        if (mediumWords.some(word => lowerText.includes(word))) return 'medium';
        return 'low';
    };

    // Extract user/complaint details from the 'Service' model
    const description = service.description.replace('User complained about: ', '');
    const title = service.name.replace('Complaint: ', '');
    
    // Mock fixed details
    const fixedUserId = 'live_user';
    const fixedUserName = 'App User'; 
    const fixedLocation = { district: 'Unknown', coordinates: [0, 0] };
    const fixedStatus = (Math.random() < 0.3) ? 'resolved' : 'in-progress'; 

    return {
        id: service._id.toString(),
        title: title,
        description: description,
        category: classifyComplaint(description),
        location: fixedLocation,
        // Ensure timestamp is a Date object for comparison
        timestamp: new Date(service.date),
        sentiment: analyzeSentiment(description), 
        priority: predictPriority(description),
        status: fixedStatus,
        userId: fixedUserId,
        userName: fixedUserName,
    };
};
// --- END Helper ---


// --- NEW: Analytics Endpoint (/api/analytics) ---
app.get('/api/analytics', async (req, res) => {
    try {
        const rawComplaints = await Service.find({ name: { $regex: /^Complaint: / } }).lean();

        // Combine live complaints with mock data (MOCK DATA RESTORED)
        const liveComplaints = rawComplaints.map(analyzeAndFormatComplaint);
        const allComplaints = [
            ...importedMockComplaints, 
            ...liveComplaints,
        ];

        // 1. Calculations
        const totalComplaints = allComplaints.length;
        const resolvedComplaints = allComplaints.filter(c => c.status === 'resolved').length;
        const pendingComplaints = allComplaints.filter(c => c.status !== 'resolved').length;
        
        // 2. Category Breakdown
        const categoryBreakdown = allComplaints.reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + 1;
            return acc;
        }, {}); 
        
        // 3. Priority Breakdown
        const priorityBreakdown = allComplaints.reduce((acc, curr) => {
            acc[curr.priority] = (acc[curr.priority] || 0) + 1;
            return acc;
        }, {});

        // 4. Monthly Trends (Last 7 months)
        const trends = [];
        for (let i = 6; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const monthName = format(date, 'MMM');
            
            const complaintsInMonth = allComplaints.filter(c => isSameMonth(new Date(c.timestamp), date));
            const resolvedInMonth = complaintsInMonth.filter(c => c.status === 'resolved').length;

            trends.push({
                month: monthName,
                complaints: complaintsInMonth.length,
                resolved: resolvedInMonth,
            });
        }


        // 5. Build Final Analytics Data (Without Sentiment Breakdown)
        const analyticsData = {
            totalComplaints,
            resolvedComplaints,
            pendingComplaints,
            categoryBreakdown,
            priorityBreakdown,
            monthlyTrends: trends,
        };

        res.json(analyticsData);
    } catch (error) {
        console.error('❌ Error fetching analytics:', error.message);
        res.status(500).json({ message: 'Failed to load analytics data.' });
    }
});


// --- NEW: Complaints Endpoint (/api/complaints) ---
app.get('/api/complaints', async (req, res) => {
    try {
        const rawComplaints = await Service.find({ name: { $regex: /^Complaint: / } })
            .sort({ date: -1 })
            .lean();

        const liveComplaints = rawComplaints.map(analyzeAndFormatComplaint);
        
        // Combine live complaints with mock data and re-sort by timestamp (descending)
        const allComplaints = [
            ...importedMockComplaints, 
            ...liveComplaints,
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); 

        res.json(allComplaints); 
    } catch (error) {
        console.error('❌ Error fetching all complaints:', error.message);
        res.status(500).json({ message: 'Failed to load complaints data.' });
    }
});


// --- Main Logic: Chat Endpoint (/api/chat) ---
app.post("/api/chat", async (req, res) => {
    const { message: userMessage, conversationId } = req.body;
    
    if (!userMessage) {
        return res.status(400).json({ aiResponse: "❌ Please provide a message" });
    }

    try {
        // 1. Service Matching Logic (Canned Responses - Fast NLP Filter)
        const services = await Service.find({}).lean();
        let cannedResponse = null;
        const THRESHOLD = 0.7; 

        for (const service of services) {
            const allMatchableTerms = [service.name, service.description, ...service.keywords];

            for (const term of allMatchableTerms) {
                const similarity = compareTwoStrings(userMessage.toLowerCase(), term.toLowerCase());
                
                if (similarity > THRESHOLD) {
                    cannedResponse = service;
                    break;
                }
            }
            if (cannedResponse) break;
        }

        if (cannedResponse) {
            return res.json({ 
                aiResponse: cannedResponse.response,
                serviceMatched: cannedResponse.name,
                conversationId: conversationId 
            });
        }
        
        // 2. Fallback to OpenRouter for Tool/General Queries (Core LLM NLP)
        if (!OPENROUTER_API_KEY) {
             return res.status(500).json({ 
                aiResponse: "माफ़ करना, सामान्य चैट के लिए OpenRouter API Key सेट नहीं है।",
                error: "OpenRouter API key missing for fallback chat."
            });
        }

        // Find or create conversation and fetch history
        let currentConversationId = conversationId;
        if (!currentConversationId || currentConversationId === 'null') {
            const newConversation = new Conversation({ userId: 'guest_user', title: userMessage.substring(0, 30) });
            await newConversation.save();
            currentConversationId = newConversation._id;
        }

        let history = await Message.find({ conversationId: currentConversationId })
            .sort({ timestamp: 1 })
            .select('role content')
            .lean();

        // CRITICAL FIX LOCATION 1: Convert MongoDB history messages to OpenRouter API format
        // APPLYING CLEANUP HERE TO REMOVE PROBLEM CHARACTERS AND WHITESPACE
        let messages = history.map(msg => {
             if (msg.role === 'tool') {
                 // msg.content is the stringified JSON object of the DB result
                 const dbResult = JSON.parse(msg.content); 
                 return {
                     role: 'tool',
                     tool_call_id: dbResult.tool_call_id,
                     content: cleanContent(dbResult.response_content), // CLEAN TOOL OUTPUT CONTENT
                 };
             }
             return { role: msg.role === 'ai' ? 'assistant' : msg.role, content: cleanContent(msg.content) }; // CLEAN ASSISTANT/USER MESSAGE CONTENT
        });
        
        // Add current user message
        messages.push({ role: 'user', content: cleanContent(userMessage) }); // CLEAN CURRENT USER MESSAGE
        
        // --- NEW: Resolve Language Override ---
        const forcedTag = resolveLanguageOverride(userMessage);

        // --- Call the revised API handler ---
        let response = await callOpenRouterAPI(messages, toolDefinitions, forcedTag);
        // --- END API CALL ---
        
        let aiResponse = response.choices[0].message.content;
        let toolCalls = response.choices[0].message.tool_calls;
        let finalAIResponse = aiResponse;
        
        // Step 2a: Check for function calls (Tool Execution)
        if (toolCalls && toolCalls.length > 0) {
            
            // Add the model's message requesting tool execution to messages array for the next call
            messages.push({
                role: 'assistant',
                tool_calls: toolCalls,
                content: aiResponse || null 
            });
            
            for (const call of toolCalls) {
                const func = toolFunctions[call.function.name];
                if (!func) {
                    throw new Error(`Unknown function call: ${call.function.name}`);
                }
                
                const args = JSON.parse(call.function.arguments);
                const result = await func(args, { Service }); 
                
                // CRITICAL FIX: The content sent back to the model MUST be the stringified JSON object of the tool result.
                const toolContentString = JSON.stringify(result); 

                // Prepare DB save object
                const dbToolResult = {
                     tool_call_id: call.id,
                     response_content: toolContentString, // Store the final content string (JSON.stringify(result))
                };

                // Save tool call/result to history immediately
                await Message.create({ 
                    conversationId: currentConversationId, 
                    role: 'tool', 
                    content: JSON.stringify(dbToolResult), 
                });

                // CRITICAL FIX LOCATION 2: Prepare the EPHEMERAL message for the second API call
                messages.push({
                    role: 'tool',
                    tool_call_id: call.id, 
                    content: cleanContent(toolContentString), // CLEAN TOOL STRING BEFORE SENDING TO API
                });
            }

            // Call OpenRouter again with tool results appended
            response = await callOpenRouterAPI(messages, toolDefinitions, forcedTag); // Pass forcedTag to second call
            finalAIResponse = response.choices[0].message.content;
            
        } else if (aiResponse?.length > 0) {
            finalAIResponse = aiResponse;
        }

        // --- START AI REFUSAL OVERRIDE (UX Fix: Final Clamping) ---
        const { name: detectedLangName } = await detectLanguageEnhanced(userMessage);
        
        // Pattern updated to catch common English refusal phrases
        const refusalPhrase = /I'm sorry, but I can only (?:assist|respond) in (?:English or Hindi|Hindi or English)|I am unable to (?:answer|provide assistance) in this language|apologize|unable to provide assistance in this language|मैं केवल हिंदी या अंग्रेजी में जवाब दे सकता हूं/i;
        
        if (refusalPhrase.test(finalAIResponse)) {
            const languageRefusalMessages = {
                Hindi: "क्षमस्व! AI मॉडल की प्रोग्रामिंग में फिलहाल हिंदी और अंग्रेजी का प्राथमिकता है। कृपया अपना प्रश्न पुनः पूछें, मैं उत्तर देने का पूरा प्रयास करूँगा।",
                Marathi: "क्षमस्व! AI मॉडेलच्या प्रोग्रामिंगमध्ये सध्या फक्त हिंदी आणि इंग्रजीलाच प्राधान्य आहे। कृपया तुमचा प्रश्न पुन्हा विचारा, मी उत्तर देण्याचा पूर्ण प्रयत्न करेन।",
                Tamil: "மன்னிக்கவும்! AI மாதிரியின் புரோகிராমিंगில் தற்போது இந்தி மற்றும் ஆங்கிலத்திற்கு மட்டுமே முன்னুন্নूरिमान्यता है। உங்கள் கேள்வியை மீண்டும் கேட்கவும், பதிலளிக்க நான் முழு முயற்சி செய்வேன்।",
                Kannada: "ಕ್ಷಮಿಸಿ! AI ಮಾದರಿಯ ಪ್ರೋಗ್ರಾಮಿಂಗ್‌ನಲ್ಲಿ ಸದ್ಯಕ್ಕೆ ಹಿಂದಿ ಮತ್ತು ಇಂಗ್ಲಿಷ್‌ಗೆ ಮಾತ್ರ ಆದ್ಯತೆ ಇದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಮತ್ತೆ ಕೇಳಿ, ನಾನು ಉತ್ತರಿಸಲು ಪೂರ್ಣ ಪ್ರಯತ್ನ ಮಾಡುತ್ತೇನೆ।",
                Bengali: "দুঃখিত! এআই মডেলের প্রোগ্রামিংয়ে বর্তমানে হিন্দি এবং ইংরেজিকে অগ্রাধিকার দেওয়া হয়েছে। অনুগ্রহ করে আপনার প্রশ্নটি আবার জিজ্ঞাসা করুন, আমি উত্তর দেওয়ার জন্য যথাসাধ্য চেষ্টা করব।",
                Punjabi: "ਮਾਫ਼ ਕਰਨਾ! AI ਮਾਡਲ ਦੀ ਪ੍ਰੋਗਰਾਮਿੰਗ ਵਿੱਚ ਵਰਤਮਾਨ ਵਿੱਚ ਹਿੰਦੀ ਅਤੇ ਅੰਗਰੇਜ਼ੀ ਨੂੰ ਤਰਜੀਹ ਦਿੱਤੀ ਗਈ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਸਵਾਲ ਦੁਬਾਰਾ ਪੁੱਛੋ, ਮੈਂ ਜਵਾਬ ਦੇਣ ਦੀ ਪੂਰੀ ਕੋਸ਼ਿਸ਼ ਕਰਾਂਗਾ।",
                Odia: "ଦୁଃଖିତ! AI ମଡେଲର ପ୍ରୋଗ୍ରାମିଂରେ ବର୍ତ୍ତମାନ ହିନ୍ଦୀ ଏବଂ ଇଂରାଜୀକୁ ପ୍ରାଧାନ୍ୟ ଦିଆଯାଇଛି। ଦୟାକରି ଆପଣଙ୍କ ପ୍ରଶ୍ନ ପୁନର୍ବାର ପଚାରନ୍ତୁ, ମୁଁ ଉତ୍ତର ଦେବାକୁ ପୂରା ଚେଷ୍ଟା କରିବି।",
                Urdu: "معذرت! AI ماڈل کی پروگرامنگ میں فی الحال ہندی اور انگریزی کو ترجیح دی گئی ہے۔ براہ کرم اپنا سوال دوبارہ پوچھیں، میں جواب دینے کی پوری کوشش کروں گا۔",
                English: "I apologize, but the AI model's internal constraints currently prioritize Hindi and English. Please rephrase your query, and I will try my best to answer it.",
                Default: "I apologize, but I am unable to respond in this specific language right now. Please rephrase your query, and I will try my best to answer it."
            };
            
            let overrideMessage = languageRefusalMessages[detectedLangName] || languageRefusalMessages.Default;
            finalAIResponse = overrideMessage;
            console.warn(`✅ AI Refusal Successfully Overridden in ${detectedLangName}.`);
        }
        // --- END AI REFUSAL OVERRIDE ---
        
        // 3. Save new messages
        await Message.insertMany([
            { conversationId: currentConversationId, role: 'user', content: userMessage },
            { conversationId: currentConversationId, role: 'ai', content: finalAIResponse },
        ]);

        res.json({ aiResponse: finalAIResponse, conversationId: currentConversationId });

    } catch (err) {
        // Error Handling
        console.error("❌ Critical chat processing error:", err);
        
        let customMessage = "माफ़ करना, मेरे AI सिस्टम में कोई तकनीकी समस्या आ गई है।";
        let statusCode = 500;

        if (axios.isAxiosError(err) && err.response) {
            statusCode = err.response.status;
            // Specific message for 400 Bad Request 
            if (statusCode === 400) {
                 customMessage = "क्षमा करें, आपके पिछले चैट इतिहास में तकनीकी त्रुटि के कारण AI सर्वर अनुरोध संसाधित (process) नहीं कर पाया। कृपया एक नई चैट शुरू करें।";
            }
            else if (statusCode === 401) {
                 customMessage = "OpenRouter API Key अमान्य है। कृपया अपनी Key और Billing (बिलिंग) जांचें।";
            } else if (statusCode === 429) {
                 customMessage = "OpenRouter की दर सीमा (Rate Limit) पार हो गई है।";
            } else {
                 customMessage = `OpenRouter से कनेक्ट करने में HTTP त्रुटि (${statusCode})।`;
            }
        }
        else if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
             customMessage = "क्षमा करें, AI मॉडल से जवाब आने में बहुत देर हो गई है।";
             statusCode = 504; 
        }
        else if (err.message.includes("Cannot read properties of undefined") || 
                 err.message.includes("tool_call_id") || 
                 err.message.includes("functionResponse")) {
             customMessage = "क्षमा करें, टूल के आउटपुट को संसाधित (process) करने में एक आंतरिक त्रुटि हुई।";
             statusCode = 500;
        }
        else if (err.message.includes('MongooseError') || err.message.includes('connect')) {
            customMessage = "डेटाबेस कनेक्शन में समस्या है। कृपया सुनिश्चित करें कि MongoDB चल रहा है।";
        }
        
        res.status(statusCode).json({ 
            aiResponse: `${customMessage} (Error: ${err.message.substring(0, 50)}...)`,
            error: err.message 
        });
    }
});


// --- Services Endpoint (/api/services) ---
app.get('/api/services', async (req, res) => {
    try {
        const services = await Service.find({}).lean(); 
        res.json(services);
    } catch (error) {
        console.error('❌ Error fetching services:', error.message);
        res.status(500).json({ message: 'Failed to load services. Check backend connectivity and seed data.' });
    }
}
);


app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
});