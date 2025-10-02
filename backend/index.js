import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import OpenAI from "openai";
import mongoose from "mongoose";
import Service from "./models/Service.js"; // Clean ESM import
import { compareTwoStrings } from 'string-similarity'; // Clean ESM import


// backend/index.js



// ... (other imports follow)

// --- Setup File Paths and .env ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FIX: Load .env file from the PROJECT ROOT (one level up from backend)
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// ... (rest of the file remains the same)

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

// --- OpenAI Setup ---
console.log("Loaded OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "✅ Found" : "❌ Missing");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// --- Main Logic: Chat Endpoint (/api/chat) ---
app.post("/api/chat", async (req, res) => {
    const userMessage = req.body.message;
    const conversationId = req.body.conversationId; 
    
    if (!userMessage) {
        return res.status(400).json({ aiResponse: "❌ Please provide a message" });
    }

    try {
        // 1. Service Matching Logic (Primary fix for contextual responses)
        const services = await Service.find({}).lean();
        let bestMatch = null;
        let maxSimilarity = 0;

        // Iterate through all services to find the best keyword match
        for (const service of services) {
            // Include service name and description in the keyword matching
            const allMatchableTerms = [service.name, service.description, ...service.keywords];

            for (const term of allMatchableTerms) {
                const similarity = compareTwoStrings(userMessage.toLowerCase(), term.toLowerCase());
                
                if (similarity > maxSimilarity) {
                    maxSimilarity = similarity;
                    bestMatch = service;
                }
            }
        }

        // Set a high threshold (0.4) to ensure relevance before returning a canned response
        const THRESHOLD = 0.4; 

        if (bestMatch && maxSimilarity > THRESHOLD) {
            console.log(`✅ Matched service: ${bestMatch.name} (Similarity: ${maxSimilarity.toFixed(2)}). Returning canned response.`);
            
            // Return the predefined initial response 
            return res.json({ 
                aiResponse: bestMatch.response,
                serviceMatched: bestMatch.name,
                conversationId: conversationId 
            });
        }
        
        // 2. Fallback to OpenAI for General/Unmatched Queries
        console.log(`🟡 No clear service match found (Max similarity: ${maxSimilarity.toFixed(2)}). Calling OpenAI for general response.`);
        
        if (!process.env.OPENAI_API_KEY) {
             return res.status(500).json({ 
                aiResponse: "माफ़ करना, सामान्य चैट के लिए AI API Key सेट नहीं है।",
                error: "OpenAI API key missing for fallback chat."
            });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: userMessage }],
        });

        const aiResponse = completion.choices[0].message.content;

        res.json({ aiResponse: aiResponse, conversationId: conversationId });

    } catch (err) {
        // This catches MongoDB errors or OpenAI API errors
        console.error("❌ Critical chat processing error:", err.message);
        
        let customMessage = "माफ़ करना, मेरे AI सिस्टम में कोई तकनीकी समस्या आ गई है।";

        if (err.message.includes('MongooseError') || err.message.includes('connect')) {
            customMessage = "डेटाबेस कनेक्शन में समस्या है। कृपया सुनिश्चित करें कि MongoDB चल रहा है।";
        }
        
        res.status(500).json({ 
            aiResponse: `${customMessage} (Error: ${err.message.substring(0, 50)}...)`,
            error: err.message 
        });
    }
});


// --- Services Endpoint (/api/services) ---
app.get('/api/services', async (req, res) => {
    try {
        // Service is imported directly
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