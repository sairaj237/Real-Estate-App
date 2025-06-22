import OpenAI from 'openai';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const router = express.Router();

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Log OpenAI initialization status
console.log('OpenAI initialized:', openai ? 'Yes' : 'No');
console.log('Environment variables:', {
  hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  keyLength: process.env.OPENAI_API_KEY?.length
});

router.post('/', async (req, res) => {
    try {
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            const error = 'Messages array is required in the request body';
            console.error('Validation error:', error);
            return res.status(400).json({ error });
        }

        console.log('Processing chat request with messages:', messages.length);

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
            temperature: 0.7,
        });

        console.log('OpenAI response received');
        const aiMessage = response.choices[0].message;
        
        const responseData = {
            id: Date.now().toString(),
            role: 'assistant',
            content: aiMessage.content
        };
        
        console.log('Sending response:', JSON.stringify(responseData, null, 2));
        res.json(responseData);

    } catch (error) {
        console.error('Error in chat endpoint:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data
        });
        res.status(500).json({ 
            error: 'Error processing your request',
            details: error.message 
        });
    }
});


export default router;