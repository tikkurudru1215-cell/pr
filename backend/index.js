// backend/index.js

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import axios from "axios"; // NEW IMPORT: Required for direct API calls

// Removed: import { GoogleGenerativeAI } from "@google/generative-ai";

import { complainService, complainServiceToolDefinition } from "./ai/tools/complain-service.js"; 
import { getNearbyService, getNearbyServiceToolDefinition } from "./ai/tools/geospatial-service.js"; 
import { getAgricultureData, getAgricultureDataToolDefinition } from "./ai/tools/agriculture-service.js"; 
import { getSchemeAndEducationData, getSchemeAndEducationDataToolDefinition } from "./ai/tools/finance-education-service.js"; 

import Service from "./models/Service.js";
import Conversation from "./models/Conversation.js";
import Message from "./models/Message.js";
import { compareTwoStrings } from 'string-similarity';

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
const AI_MODEL = "openai/gpt-4o-mini"; // Excellent, fast model supporting tools

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


// --- OpenRouter API Call Handler (Replaces SDK Logic) ---
async function callOpenRouterAPI(messages, toolDefinitions) {
    if (!OPENROUTER_API_KEY) {
        throw new Error("OpenRouter API Key is missing.");
    }
    
    // Convert Mongoose history roles to OpenRouter/OpenAI format
    const openRouterMessages = messages.map(msg => {
        // Handle tool responses from previous steps
        if (msg.role === 'tool') {
             // Extract function response data from the original structure
             const functionResponse = msg.parts[0].functionResponse;
             return {
                 role: 'tool',
                 tool_call_id: functionResponse.call_id, // tool_call_id must be sent back
                 content: JSON.stringify(functionResponse.response),
             };
        }
        // Handle user and model messages
        return {
            role: msg.role === 'ai' ? 'assistant' : msg.role,
            content: msg.content,
        };
    });

    const body = {
        model: AI_MODEL,
        messages: openRouterMessages,
        tools: toolDefinitions,
        temperature: 0.2,
        // Optional attribution headers for OpenRouter visibility
        extra_body: {
             "prompt_language": "hi-IN",
        }
    };
    
    // Add system instruction as the first message
    const systemInstruction = `You are "Digital Saathi AI", an expert voice-first government service assistant operating in India.
Your primary language is Hindi (Devanagari script), but you are fluent in English.
Your goal is to guide the user through government processes, file complaints (which are saved locally), and provide necessary information using your internal knowledge base and mock data tools.
You DO NOT have access to live external APIs like NCH or OpenWeatherMap, so you must rely on the mock data provided by your tools.
For all other queries, answer directly.
Maintain a helpful, encouraging, and authoritative tone.`;

    body.messages.unshift({
        role: 'system',
        content: systemInstruction
    });

    const headers = {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'digital-saathi-ai.app', // Required by OpenRouter for attribution
        'X-Title': 'Digital Saathi AI', 
    };

    const response = await axios.post(OPENROUTER_URL, body, { headers });
    return response.data;
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
        // CORRECTED: Increased threshold from 0.4 to 0.7 for higher confidence matching
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

        // Prepare messages array for API call
        // The OpenRouter API call handler expects objects with { role, content } for user/model and special tool objects.
        let messages = history.map(msg => ({ 
             role: msg.role === 'ai' ? 'assistant' : msg.role, 
             content: msg.content
        }));
        
        messages.push({ role: 'user', content: userMessage });

        let response = await callOpenRouterAPI(messages, toolDefinitions);
        
        let aiResponse = response.choices[0].message.content;
        let toolCalls = response.choices[0].message.tool_calls;
        
        // Step 1: Check for function calls (Tool Execution)
        if (toolCalls && toolCalls.length > 0) {
            const toolResults = [];
            
            // Add the model's message requesting tool execution to history for the next call
            messages.push({
                role: 'assistant',
                tool_calls: toolCalls,
                content: aiResponse || null // Content can be null when tool is called
            });
            
            for (const call of toolCalls) {
                const func = toolFunctions[call.function.name];
                if (!func) {
                    throw new Error(`Unknown function call: ${call.function.name}`);
                }
                
                // Parse the arguments string to a JSON object
                const args = JSON.parse(call.function.arguments);
                const result = await func(args, { Service }); 

                toolResults.push({
                    tool_call_id: call.id, // Pass back the ID from the model
                    output: result,
                });
            }

            // Send tool results back to the model for final response generation
            toolResults.forEach(tr => {
                messages.push({
                    role: 'tool',
                    tool_call_id: tr.tool_call_id,
                    content: JSON.stringify(tr.output),
                });
            });

            // Call OpenRouter again with tool results appended
            response = await callOpenRouterAPI(messages, toolDefinitions);
            aiResponse = response.choices[0].message.content;
        }


        // 3. Save new messages
        await Message.insertMany([
            { conversationId: currentConversationId, role: 'user', content: userMessage },
            // Save the final AI response (text content)
            { conversationId: currentConversationId, role: 'ai', content: aiResponse },
        ]);

        res.json({ aiResponse: aiResponse, conversationId: currentConversationId });

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
});


app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
});