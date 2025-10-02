// backend/index.js

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
// axios is removed as no external API calls are made

import { GoogleGenerativeAI } from "@google/generative-ai";
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

// --- Gemini AI Setup ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY; 
console.log("Loaded AI_API_KEY:", GEMINI_API_KEY ? "✅ Found" : "❌ Missing");

let ai = null;
if (GEMINI_API_KEY) {
    ai = new GoogleGenerativeAI(GEMINI_API_KEY);
}

// --- Tool/Function Definitions and Map ---
const toolFunctions = {
    complainService,
    getNearbyService,
    getAgricultureData, 
    getSchemeAndEducationData, 
};

const toolDefinitions = [
    complainServiceToolDefinition,
    getNearbyServiceToolDefinition,
    getAgricultureDataToolDefinition, 
    getSchemeAndEducationDataToolDefinition, 
];

// --- System Instruction for Context and Persona (Core NLP) ---
const systemInstruction = `You are "Digital Saathi AI", an expert voice-first government service assistant operating in India.
Your primary language is Hindi (Devanagari script), but you are fluent in English.
Your goal is to guide the user through government processes, file complaints (which are saved locally), and provide necessary information using your internal knowledge base and mock data tools.
You DO NOT have access to live external APIs like NCH or OpenWeatherMap, so you must rely on the mock data provided by your tools.

If a query closely matches a 'Canned Response' provided by the user's existing database, prioritize formulating your answer using that response.
If the user asks for a physical service location, use the 'getNearbyService' tool (uses mock data).
If the user asks to file a complaint, use the 'complainService' tool (saves to local database).
If the user asks about farming, weather, mandi prices, or schemes, use the 'getAgricultureData' or 'getSchemeAndEducationData' tool (uses internal mock data).
For all other queries, answer directly.
Maintain a helpful, encouraging, and authoritative tone.`;

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
        const THRESHOLD = 0.4; 

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
        
        // 2. Fallback to Gemini for Tool/General Queries (Core LLM NLP)
        if (!ai) {
             return res.status(500).json({ 
                aiResponse: "माफ़ करना, सामान्य चैट के लिए AI API Key सेट नहीं है।",
                error: "AI API key missing for fallback chat."
            });
        }

        // Find or create conversation and fetch history
        let currentConversationId = conversationId;
        if (!currentConversationId || currentConversationId === 'null') {
            const newConversation = new Conversation({ userId: 'guest_user', title: userMessage.substring(0, 30) });
            await newConversation.save();
            currentConversationId = newConversation._id;
        }

        const history = await Message.find({ conversationId: currentConversationId })
            .sort({ timestamp: 1 })
            .select('role content')
            .lean();

        // Convert Mongoose history to Gemini history format
        const geminiHistory = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        const currentMessages = [...geminiHistory, { role: 'user', parts: [{ text: userMessage }] }];

        const chat = ai.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: systemInstruction,
            config: {
                tools: [{ functionDeclarations: toolDefinitions }]
            }
        });

        let response = await chat.generateContent({ contents: currentMessages });

        // Step 1: Check for function calls (Tool Execution)
        if (response.functionCalls && response.functionCalls.length > 0) {
            const toolResults = [];
            for (const call of response.functionCalls) {
                const func = toolFunctions[call.name];
                if (!func) {
                    throw new Error(`Unknown function call: ${call.name}`);
                }
                
                // NOTE: Passing only Service model, as Axios is no longer used for tools
                const result = await func(call.args, { Service }); 
                toolResults.push({
                    functionCall: call,
                    result: result,
                });
            }

            // Send tool results back to the model for final response generation
            const toolResponseParts = toolResults.map(tr => ({
                functionResponse: {
                    name: tr.functionCall.name,
                    response: tr.result,
                }
            }));
            
            const messagesWithToolResults = [
                ...currentMessages, 
                {
                    role: 'model',
                    parts: response.candidates[0].content.parts
                },
                {
                    role: 'tool',
                    parts: toolResponseParts.map(p => ({ functionResponse: p.functionResponse }))
                }
            ];

            response = await chat.generateContent({ contents: messagesWithToolResults });
        }

        const aiResponse = response.text;

        // 3. Save new messages
        await Message.insertMany([
            { conversationId: currentConversationId, role: 'user', content: userMessage },
            { conversationId: currentConversationId, role: 'ai', content: aiResponse },
        ]);

        res.json({ aiResponse: aiResponse, conversationId: currentConversationId });

    } catch (err) {
        // Error Handling
        console.error("❌ Critical chat processing error:", err);
        
        let customMessage = "माफ़ करना, मेरे AI सिस्टम में कोई तकनीकी समस्या आ गई है।";
        let statusCode = 500;

        if (err.message.includes('MongooseError') || err.message.includes('connect')) {
            customMessage = "डेटाबेस कनेक्शन में समस्या है। कृपया सुनिश्चित करें कि MongoDB चल रहा है।";
        } 
        else if (err.message.includes('quota') || err.message.includes('429')) {
             statusCode = 429;
             customMessage = "माफ़ करना, मेरे AI सिस्टम का **दैनिक कोटा समाप्त** हो गया है या दर सीमा (Rate Limit) पार हो गई है। कृपया API Key की सीमाएँ जाँचें।";
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