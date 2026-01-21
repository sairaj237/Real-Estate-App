import express from 'express';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import path from 'path';
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import listingRouter from './routes/listing.route.js';
import documentRouter from './routes/documents.js';
import cookieParser from 'cookie-parser';
import chatRouter from './routes/chat.js';
import cors from 'cors';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables - try multiple locations
const envPaths = [
  resolve(__dirname, '.env'),
  resolve(__dirname, '..', '.env'),
  resolve(process.cwd(), '.env')
];

console.log('Trying to load .env from:');
let envLoaded = false;
for (const path of envPaths) {
  console.log(`- ${path}`);
  try {
    const result = config({ path, override: true });
    if (result.parsed) {
      console.log(`✅ Successfully loaded from: ${path}`);
      envLoaded = true;
      break;
    }
  } catch (error) {
    console.log(`❌ Error loading ${path}:`, error.message);
  }
}

if (!envLoaded) {
  console.error('Failed to load .env file from any location');
  process.exit(1);
}

// Debug environment variables
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PINECONE_API_KEY: process.env.PINECONE_API_KEY ? '***' : 'Not found',
  PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT || 'Not found',
  PINECONE_INDEX: process.env.PINECONE_INDEX || 'Not found',
  JWT_SECRET: process.env.JWT_SECRET ? '***' : 'Not found',
  MONGO_URI: process.env.MONGO_URI ? '***' : 'Not found'
});

// Check required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGO_URI', 'PINECONE_API_KEY', 'PINECONE_ENVIRONMENT'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('FATAL ERROR: Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('Current working directory:', process.cwd());

console.log('MongoDB URI:', process.env.MONGO_URI ? 'Found' : 'Not found');

mongoose
  // .connect(process.env.MONGO)
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB!');
  })
  .catch((err) => {
    console.log(err);
  });


const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/listing', listingRouter);
app.use('/api/chat', chatRouter);
app.use('/api/documents', documentRouter);

// Static files and SPA fallback - must come after API routes
// Only serve static files for non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  express.static(path.join(__dirname, '../frontend/dist'))(req, res, next);
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}!`);
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});
