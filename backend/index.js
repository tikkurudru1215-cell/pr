import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// force dotenv to load the .env file in backend folder
dotenv.config({ path: path.join(__dirname, ".env") });

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

console.log("Loaded OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "✅ Found" : "❌ Missing");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.status(400).json({ reply: "❌ Please provide a message" });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: userMessage }],
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error("OpenAI error:", err.message);
    res.json({ reply: "माफ़ करना, सिस्टम में समस्या आ गई है। बाद में कोशिश करें।" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
