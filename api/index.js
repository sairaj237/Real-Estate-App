import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import listingRouter from './routes/listing.route.js';
import cookieParser from 'cookie-parser';
import path from 'path';
import chatRouter from './routes/chat.js';
import cors from 'cors';


import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
// Update this line in api/index.js
dotenv.config({ path: resolve(process.cwd(), '.env') });

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

// Debug logs
console.log('Environment file:', resolve(__dirname, '.env'));
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

// Static files and SPA fallback - must come after API routes
app.use(express.static(path.join(__dirname, '/client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
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
