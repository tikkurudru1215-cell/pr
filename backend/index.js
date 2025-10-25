// backend/index.js

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import axios from "axios"; 
import { compareTwoStrings } from 'string-similarity'; 

import { complainService, complainServiceToolDefinition } from "./ai/tools/complain-service.js"; 
import { getNearbyService, getNearbyServiceToolDefinition } from "./ai/tools/geospatial-service.js"; 
import { getAgricultureData, getAgricultureDataToolDefinition } from "./ai/tools/agriculture-service.js"; 
import { getSchemeAndEducationData, getSchemeAndEducationDataToolDefinition } from "./ai/tools/finance-education-service.js"; 

import Service from "./models/Service.js";
import Conversation from "./models/Conversation.js";
import Message from "./models/Message.js";

// --- Setup File Paths and .env ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

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
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const AI_MODEL = "openai/gpt-4o-mini"; 

console.log("Loaded AI_API_KEY:", OPENROUTER_API_KEY ? "✅ Found" : "❌ Missing");

// --- Tool/Function Definitions and Map ---
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


// --- OpenRouter API Call Handler (Finalized for Guaranteed Language Detection) ---
async function callOpenRouterAPI(messages, toolDefinitions) {
    if (!OPENROUTER_API_KEY) {
        throw new Error("OpenRouter API Key is missing.");
    }

    // --- 1️⃣ Language Detection Function (Simple heuristic) ---
    function detectLanguage(text) {
        const hindiChars = /[\u0900-\u097F]/; // Unicode range for Devanagari
        return hindiChars.test(text) ? "hi" : "en";
    }

    // Detect language of the latest user message
    const userMsg = messages[messages.length - 1]?.content || "";
    const detectedLang = detectLanguage(userMsg);

    // --- 2️⃣ Prepare message array for OpenRouter ---
    const openRouterMessages = messages.map(msg => {
        if (msg.role === "ai") {
            return { role: "assistant", content: msg.content };
        } else if (msg.role === "tool") {
            return msg; // Already formatted
        }
        return msg; // user messages unchanged
    });

    // --- 3️⃣ Build the system instruction dynamically (Kept for tool calls) ---
    let systemInstruction = `You are "Digital Saathi AI", an intelligent bilingual government service assistant operating in India.
You are fluent in both Hindi (Devanagari script) and English.
You must always detect the user's query language and respond *entirely* in that same language.
Never default to Hindi or English; mirror the language of the user's latest query.
If the query is in Hindi, respond in Hindi only.
If the query is in English, respond in English only.
If the query is mixed, respond in the dominant language of the text.
Be clear, helpful, and factual about Indian government services and information.`;

    // Optional hint to model (helps ensure consistency)
    if (detectedLang === "hi") {
        systemInstruction += `\n\nThe user's latest message is in Hindi. Respond only in Hindi.`;
    } else {
        systemInstruction += `\n\nThe user's latest message is in English. Respond only in English.`;
    }

    // --- 4️⃣ Create request body (WITH explicit prompt_language toggle) ---
    const body = {
        model: AI_MODEL,
        messages: [
            { role: "system", content: systemInstruction },
            ...openRouterMessages,
        ],
        tools: toolDefinitions,
        temperature: 0.2,
        extra_body: {
            // This explicitly forces the model's output language at the API level.
            "prompt_language": detectedLang === "hi" ? "hi-IN" : "en-IN"
        }
    };

    // --- 5️⃣ Headers ---
    const headers = {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "digital-saathi-ai.app",
        "X-Title": "Digital Saathi AI",
    };

    // --- 6️⃣ Make the API call with timeout ---
    const response = await axios.post(OPENROUTER_URL, body, {
        headers,
        timeout: 25000,
    });

    return response.data;
}


// --- NEW: Google Search Handler for General Queries ---
/**
 * Performs a Google Search and returns a formatted snippet of the top result.
 * This acts as the "Real Search Tool" fallback.
 * @param {string} query The user's message to search for.
 * @returns {Promise<string>} A formatted string with the search snippet, or an empty string.
 */
async function performGoogleSearch(query) {
    // The Google Search tool is available in this environment
    try {
        const searchResults = await google.search({ queries: [query] });
        
        if (searchResults.results && searchResults.results.length > 0) {
            const topResult = searchResults.results[0];
            let snippet = topResult.snippet || topResult.title;

            // Append the search result to the AI's response for contextually new/fresh information
            return `\n\n🔎 **Real-time Search Result**: ${snippet} (Source: ${topResult.source_title || topResult.source})`;
        }
        return "";
    } catch (error) {
        // Log the error but don't fail the entire request
        console.error("❌ Google Search Fallback failed:", error);
        return "";
    }
}


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
        let messages = history.map(msg => {
             if (msg.role === 'tool') {
                 // msg.content is the stringified JSON object of the DB result
                 const dbResult = JSON.parse(msg.content); 
                 return {
                     role: 'tool',
                     tool_call_id: dbResult.tool_call_id,
                     content: dbResult.response_content,
                 };
             }
             return { role: msg.role === 'ai' ? 'assistant' : msg.role, content: msg.content };
        });
        
        // Add current user message
        messages.push({ role: 'user', content: userMessage });

        // --- NEW LOGIC: Call the revised API handler ---
        let response = await callOpenRouterAPI(messages, toolDefinitions);
        // --- END NEW LOGIC ---
        
        let aiResponse = response.choices[0].message.content;
        let toolCalls = response.choices[0].message.tool_calls;
        let finalAIResponse = aiResponse;
        let searchAppend = "";
        
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
                    content: toolContentString, 
                });
            }

            // Call OpenRouter again with tool results appended
            response = await callOpenRouterAPI(messages, toolDefinitions);
            finalAIResponse = response.choices[0].message.content;
            
        } else if (aiResponse?.length > 0) {
            // Step 2b: No tool call, LLM provided a direct answer. Augment with search if it's a general query.
            
            const isToolQuery = Object.values(toolDefinitions).some(def => 
                userMessage.toLowerCase().includes(def.function.name.toLowerCase()) || 
                userMessage.toLowerCase().includes(def.function.description.toLowerCase())
            );

            // If the LLM gives a direct answer and it wasn't a tool/service query, use search fallback.
            const isGeneralQuery = !isToolQuery; 
            
            if (isGeneralQuery) {
                searchAppend = await performGoogleSearch(userMessage);
                finalAIResponse = aiResponse + searchAppend;
            } else {
                finalAIResponse = aiResponse;
            }
        }
        
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

        // Check for common Axios/HTTP errors
        if (axios.isAxiosError(err) && err.response) {
            statusCode = err.response.status;
            if (statusCode === 401) {
                 customMessage = "OpenRouter API Key अमान्य है। कृपया अपनी Key और Billing (बिलिंग) जांचें।";
            } else if (statusCode === 429) {
                 customMessage = "OpenRouter की दर सीमा (Rate Limit) पार हो गई है।";
            } else {
                 customMessage = `OpenRouter से कनेक्ट करने में HTTP त्रुटि (${statusCode})।`;
            }
        }
        // Handle timeout error
        else if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
             customMessage = "क्षमा करें, AI मॉडल से जवाब आने में बहुत देर हो गई।";
             statusCode = 504; 
        }
        // Specific tool execution error handling (Includes the error the user is seeing)
        // If the error message is related to property reading, it means a structural error.
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