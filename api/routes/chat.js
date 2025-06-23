import express from 'express';
import { z } from 'zod';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import fetch from 'node-fetch';

dotenv.config();
const router = express.Router();

// Ensure logs directory exists
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, '../../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Logger setup
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Rate limiting
router.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const systemPrompt = {
  role: 'system',
  content: 'You are a real estate expert. Provide concise, accurate answers about properties, pricing, and the real estate market.',
};

// Validation schema
const messageSchema = z.array(
  z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(10000),
  })
);

router.post('/', async (req, res, next) => {
  try {
    logger.info('Chat request received', { body: req.body });
    
    if (!req.body || !req.body.messages) {
      logger.error('Invalid request body', { body: req.body });
      return res.status(400).json({ error: 'Messages are required' });
    }
    
    const { messages } = req.body;
    
    try {
      messageSchema.parse(messages);
    } catch (validationError) {
      logger.error('Message validation failed', { error: validationError });
      return res.status(400).json({ error: 'Invalid message format', details: validationError.errors });
    }

    if (!OPENROUTER_API_KEY) {
      logger.error('OpenRouter API key is missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    logger.info('Sending request to OpenRouter', { 
      model: 'qwen/qwen3-8b:free',
      messageCount: messages.length + 1 // +1 for system prompt
    });

    const payload = {
      model: 'qwen/qwen3-8b:free',
      messages: [systemPrompt, ...messages],
      max_tokens: 1000,
      temperature: 0.7,
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Real Estate App',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json().catch(e => ({}));
    
    if (!response.ok) {
      logger.error('OpenRouter API error', { 
        status: response.status,
        statusText: response.statusText,
        response: responseData 
      });
      return res.status(response.status).json({ 
        error: 'Failed to process request',
        details: responseData.error?.message || response.statusText
      });
    }

    logger.info('Received response from OpenRouter', { 
      status: response.status,
      model: responseData.model,
      usage: responseData.usage 
    });

    if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
      logger.error('Invalid response format from OpenRouter', { response: responseData });
      return res.status(500).json({ error: 'Invalid response format from AI service' });
    }

    const message = responseData.choices[0].message;
    res.json({ message });
    
  } catch (error) {
    logger.error('Unexpected error in chat endpoint', { 
      error: error.message, 
      stack: error.stack,
      body: req.body 
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Test endpoint to verify OpenRouter connection
router.get('/test', async (req, res) => {
  try {
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenRouter API key is not configured',
        env: process.env.NODE_ENV,
        openRouterKeyConfigured: !!process.env.OPENROUTER_API_KEY
      });
    }

    logger.info('Testing OpenRouter connection...');
    
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Real Estate App - Test',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      logger.error('OpenRouter API test failed', { status: response.status, data });
      return res.status(response.status).json({
        error: 'Failed to connect to OpenRouter',
        status: response.status,
        details: data.error?.message || 'Unknown error'
      });
    }

    logger.info('OpenRouter connection test successful');
    res.json({
      success: true,
      message: 'Successfully connected to OpenRouter',
      availableModels: data.data?.map(m => m.id) || []
    });

  } catch (error) {
    logger.error('OpenRouter test error', { 
      error: error.message, 
      stack: error.stack 
    });
    
    res.status(500).json({
      error: 'Internal server error during OpenRouter test',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;