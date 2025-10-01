// backend/index.js
const express = require('express');
const mongoose = require('mongoose'); // <-- CRITICAL FIX: The missing import is restored here
const dotenv = require('dotenv');
const cors = require('cors');

// Import your existing Service model and new Conversation and Message models
const Service = require('./models/Service');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

// Import your AI tools
const { complainService, complainServiceToolDefinition } = require('./ai/tools/complain-service');

// Import the Google Generative AI SDK
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// ==========================================================
// *** CORRECTED MONGOOSE CONNECTION ***
// This uses the standard Mongoose connect method, pointing to 
// your local MongoDB server via the MONGO_URI in your .env file.
// ==========================================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));


// Initialize the AI model with API key and tool definitions
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  tools: [complainServiceToolDefinition]
});

// GET all services (existing endpoint)
app.get('/api/services', async (req, res) => {
  try {
    const services = await Service.find({});
    res.json(services);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).send('Server error');
  }
});

// POST add new service (existing endpoint, can be used by the AI tool)
app.post('/api/services', async (req, res) => {
  try {
    const { name, description } = req.body;
    const newService = new Service({ name, description });
    const service = await newService.save();
    res.status(201).json(service);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

/**
 * NEW CHAT API ENDPOINT
 */
app.post('/api/chat', async (req, res) => {
  const { userId, message, conversationId } = req.body;

  try {
    let convId = conversationId;
    if (!convId) {
      // Create a new conversation if no ID is provided
      const newConversation = new Conversation({ userId: userId || 'guest' });
      const savedConversation = await newConversation.save();
      convId = savedConversation._id;
    }

    // Save the user's message to the database
    const userMessage = new Message({
      conversationId: convId,
      role: 'user',
      content: message,
    });
    await userMessage.save();

    // Fetch previous messages for context
    const history = await Message.find({ conversationId: convId })
      .sort({ timestamp: 1 })
      .limit(20);

    // Prepare the message history for the AI model
    const chatHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Start a new chat session with the model
    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(message);
    const response = result.response;

    // Check if the AI wants to call a tool
    if (response.toolCalls && response.toolCalls.length > 0) {
      const toolCall = response.toolCalls[0];
      const toolName = toolCall.name;
      const toolArgs = toolCall.args;

      if (toolName === 'complainService') {
        const toolResult = await complainService(toolArgs);

        // Send the tool's output back to the model as a new message
        const followUpResponse = await chat.sendMessage([
          {
            toolResponse: {
              name: toolName,
              response: toolResult,
            },
          },
        ]);
        const finalResponseText = followUpResponse.response.text();

        // Save and send the AI's final response
        const aiMessage = new Message({
          conversationId: convId,
          role: 'ai',
          content: finalResponseText,
        });
        await aiMessage.save();
        res.json({ conversationId: convId, aiResponse: finalResponseText });

      } else {
        res.status(500).json({ error: 'AI tried to use an unknown tool.' });
      }
    } else {
      // If no tool call, get the AI's text response directly
      const aiResponseContent = response.text();

      // Save and send the AI's response
      const aiMessage = new Message({
        conversationId: convId,
        role: 'ai',
        content: aiResponseContent,
      });
      await aiMessage.save();
      res.json({ conversationId: convId, aiResponse: aiResponseContent });
    }

  } catch (err) {
    console.error('Error handling chat:', err);
    res.status(500).send('Server error');
  }
});

// Status check endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'Backend is running fine!' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});