import mongoose from 'mongoose';
import Listing from '../models/listing.model.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try multiple possible .env file locations
const envPaths = [
  resolve(__dirname, '../../.env'),
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '..', '.env')
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
  MONGO_URI: process.env.MONGO_URI ? '***' : 'Not found',
  PINECONE_API_KEY: process.env.PINECONE_API_KEY ? '***' : 'Not found',
  PINECONE_INDEX: process.env.PINECONE_INDEX || 'Not found'
});

async function ensureTextIndex() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI environment variable is not set');
    console.log('Available environment variables:', Object.keys(process.env).join(', '));
    process.exit(1);
  }

  try {
    console.log('Attempting to connect to MongoDB...');
    
    // Connect to MongoDB with options
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Successfully connected to MongoDB');

    // Check if the collection exists
    const collections = await mongoose.connection.db.listCollections({ name: 'listings' }).toArray();
    if (collections.length === 0) {
      console.log('Listings collection does not exist. Creating it...');
      await mongoose.connection.createCollection('listings');
    }

    console.log('Creating text index on Listings collection...');
    
    // Create text index on searchable fields
    await mongoose.connection.db.collection('listings').createIndex(
      {
        name: 'text',
        description: 'text',
        address: 'text',
        type: 'text'
      },
      {
        name: 'text_search_index',
        weights: {
          name: 10,
          address: 5,
          description: 2,
          type: 5
        },
        default_language: 'english'
      }
    );
    
    console.log('✅ Text index created successfully on Listings collection');
    
  } catch (error) {
    console.error('❌ Error creating text index:', error.message);
    if (error.code === 85) {
      console.log('Note: The index already exists with a different configuration.');
      console.log('To fix this, you may need to drop the existing index and recreate it.');
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
    process.exit(0);
  }
}

ensureTextIndex();
