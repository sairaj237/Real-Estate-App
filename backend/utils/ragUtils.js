import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { Document } from 'langchain/document';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Listing from '../models/listing.model.js';
import { pipeline } from '@xenova/transformers';

// Database connection helper
async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    console.log('Using existing database connection');
    return;
  }

  try {
    const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/real-estate';
    console.log('Connecting to MongoDB...', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Load environment variables directly in this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load .env from multiple locations
const envPaths = [
  resolve(__dirname, '../../.env'),
  resolve(__dirname, '.env'),
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '..', '.env')
];

let envLoaded = false;
for (const path of envPaths) {
  try {
    const result = config({ path, override: true });
    if (result.parsed) {
      console.log(`✅ Loaded .env from: ${path}`);
      envLoaded = true;
      break;
    }
  } catch (error) {
    console.error(`❌ Error loading ${path}:`, error.message);
  }
}

if (!envLoaded) {
  console.warn('⚠️  No .env file loaded. Falling back to process environment.');
}

// Using local embeddings with Xenova Transformers
class LocalEmbeddings {
  constructor() {
    this.model = 'Xenova/all-MiniLM-L6-v2'; // Small but effective model
    this.dimensions = 384; // Correct dimension for all-MiniLM-L6-v2
    this.pipe = null;
  }

  async initialize() {
    if (!this.pipe) {
      console.log('Loading local embedding model...');
      // @ts-ignore - We know this is a valid pipeline
      this.pipe = await pipeline('feature-extraction', this.model);
      console.log('Local embedding model loaded');
    }
    return this.pipe;
  }

  async embedQuery(text) {
    return this.embedDocuments([text]).then(embeddings => embeddings[0]);
  }

  async embedDocuments(texts) {
    try {
      await this.initialize();
      console.log(`Generating embeddings locally with model: ${this.model}`);
      
      // Process texts in batches to avoid memory issues
      const batchSize = 10;
      const allEmbeddings = [];
      
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchEmbeddings = await Promise.all(
          batch.map(text => 
            this.pipe(text, { pooling: 'mean', normalize: true })
          )
        );
        
        // Convert Float32Array to regular array and ensure proper format
        const processedBatch = batchEmbeddings.map(embedding => {
          // Handle Float32Array or regular array
          const vector = Array.isArray(embedding) ? 
            embedding : 
            Array.from(embedding.data || embedding);
            
          if (!vector || vector.length !== this.dimensions) {
            throw new Error(`Invalid embedding dimension: expected ${this.dimensions}, got ${vector?.length}`);
          }
          
          // Ensure all values are numbers
          return vector.map(v => Number(v));
        });
        
        allEmbeddings.push(...processedBatch);
      }

      return allEmbeddings;
    } catch (error) {
      console.error('Error in embedDocuments:', error);
      throw error;
    }
  }
}

export class RAGService {
  constructor() {
    console.log('Initializing RAG Service...');
    
    // Debug: Log all environment variables
    console.log('=== Environment Variables in RAG Service ===');
    console.log('PINECONE_API_KEY:', process.env.PINECONE_API_KEY ? '***' : 'Not found');
    console.log('PINECONE_ENVIRONMENT:', process.env.PINECONE_ENVIRONMENT || 'Not found');
    console.log('PINECONE_INDEX:', process.env.PINECONE_INDEX || 'Not found');
    console.log('Available environment variables:', Object.keys(process.env).join(', '));
    
    // Verify environment variables
    const requiredVars = ['PINECONE_API_KEY'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      const errorMsg = `Missing required environment variables: ${missingVars.join(', ')}`;
      console.error('RAG Service Initialization Error:', errorMsg);
      console.error('Current process.env:', JSON.stringify(process.env, null, 2));
      throw new Error(errorMsg);
    }

    console.log('Pinecone Configuration:', {
      indexName: process.env.PINECONE_INDEX || 'real-estate',
      apiKey: process.env.PINECONE_API_KEY ? '***' : 'Not found'
    });

    try {
      // Initialize Pinecone with just the API key
      this.pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
      });
      
      // Use local embeddings
      this.embeddings = new LocalEmbeddings();
      this.indexName = process.env.PINECONE_INDEX || 'real-estate';
      console.log('RAG Service initialized successfully with index:', this.indexName);
    } catch (error) {
      console.error('Failed to initialize RAG Service:', error);
      throw error;
    }
  }

  // Initialize the vector store
  async initVectorStore() {
    const pineconeIndex = this.pinecone.Index(this.indexName);
    
    this.vectorStore = await PineconeStore.fromExistingIndex(
      this.embeddings,
      { pineconeIndex }
    );
  }

  // Add documents to the vector store
  async addDocuments(documents) {
    try {
      if (!this.vectorStore) {
        await this.initVectorStore();
      }

      // Generate embeddings for the documents
      const texts = documents.map(doc => doc.pageContent || doc);
      const embeddings = await this.embeddings.embedDocuments(texts);

      // Create document objects for Pinecone
      const formattedVectors = texts.map((text, i) => ({
        id: `doc-${Date.now()}-${i}`,
        values: embeddings[i], // Already processed by embedDocuments
        metadata: {
          text: text,
          timestamp: new Date().toISOString()
        }
      }));

      // Add to Pinecone in batches
      const BATCH_SIZE = 10;
      for (let i = 0; i < formattedVectors.length; i += BATCH_SIZE) {
        const batch = formattedVectors.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${i / BATCH_SIZE + 1}, vector length: ${batch[0]?.values?.length || 0}`);
        
        await this.vectorStore.addVectors(
          batch.map(v => v.values),
          batch.map(v => ({
            pageContent: v.metadata.text,
            metadata: v.metadata
          }))
        );
      }
      
      console.log(`Added ${formattedVectors.length} documents to the vector store`);
      return { success: true, count: formattedVectors.length };
    } catch (error) {
      console.error('Error adding documents:', error);
      throw error;
    }
  }

  // Helper method to format listing
  formatListing(listing) {
    const features = [
      listing.furnished ? 'Furnished' : null,
      listing.parking ? 'Parking' : null,
      listing.offer ? 'Special Offer' : null
    ].filter(Boolean).join(', ');
    
    return `Property: ${listing.name || 'N/A'}\n` +
           `Address: ${listing.address || 'N/A'}\n` +
           `Price: $${listing.regularPrice || '0'}${
             listing.discountPrice > 0 && listing.discountPrice < listing.regularPrice ? 
             ` (Discounted from $${listing.regularPrice})` : ''}\n` +
           `${listing.bedrooms || 'N/A'} beds | ${listing.bathrooms || 'N/A'} baths\n` +
           `Type: ${listing.type || 'N/A'}\n` +
           `Description: ${listing.description || 'No description available.'}\n` +
           (features ? `Features: ${features}` : '');
  }

  // Helper method to search by numeric fields
  async searchByNumericFields(query, limit) {
    const numericQuery = {};
    const bedroomsMatch = query.match(/(\d+)\s*bed|bedroom/i);
    const priceMatch = query.match(/\$?(\d+[,\d]*)/);
    
    if (bedroomsMatch) {
      numericQuery.bedrooms = parseInt(bedroomsMatch[1]);
    }
    if (priceMatch) {
      const price = parseInt(priceMatch[1].replace(/,/g, ''));
      if (price > 1000) {
        numericQuery.regularPrice = { $lte: price };
      }
    }
    
    return Object.keys(numericQuery).length > 0
      ? await Listing.find(numericQuery).limit(limit).lean()
      : [];
  }

  // Check if query is a general request for all properties
  isGeneralQuery(query) {
    const generalQueries = [
      'show all', 'list all', 'all properties', 'all listings',
      'properties', 'listings', 'show properties', 'list properties'
    ];
    const queryLower = query.toLowerCase().trim();
    return generalQueries.some(term => queryLower.includes(term));
  }

  // Search for relevant documents from both Pinecone and MongoDB
  async search(query, k = 10) {  // Increased default limit for better results
    try {
      // Ensure database connection
      await connectToDatabase();
      
      if (!this.vectorStore) await this.initVectorStore();
      
      const allResults = new Map(); // Using Map to deduplicate by listing ID
      
      // Handle general queries (e.g., "show all properties")
      if (this.isGeneralQuery(query)) {
        console.log('Handling general query - returning all properties');
        const allListings = await Listing.find({}).limit(50).lean();
        return allListings.length > 0 
          ? allListings.map(listing => this.formatListing(listing)).join('\n\n---\n\n')
          : 'No properties found in the database.';
      }
      
      // 1. Get results from MongoDB first (more reliable)
      try {
        console.log('Searching MongoDB for:', query);
        
        let mongoResults = [];
        
        // First try exact match for property name or address
        mongoResults = await Listing.find({
          $or: [
            { name: { $regex: `^${query}$`, $options: 'i' } },
            { address: { $regex: `^${query}$`, $options: 'i' } }
          ]
        }).limit(k * 2).lean();
        
        // If no exact matches, try partial matches
        if (mongoResults.length === 0) {
          try {
            mongoResults = await Listing.find(
              { $text: { $search: query } },
              { score: { $meta: 'textScore' } }
            )
            .sort({ score: { $meta: 'textScore' } })
            .limit(k * 2)
            .lean();
            console.log(`Found ${mongoResults.length} results from MongoDB text search`);
          } catch (e) {
            // Fall back to regex search if text index fails
            console.log('Falling back to regex search:', e.message);
            mongoResults = await Listing.find({
              $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { address: { $regex: query, $options: 'i' } },
                { type: { $regex: query, $options: 'i' } }
              ]
            })
            .limit(k * 2)
            .lean();
            console.log(`Found ${mongoResults.length} results from MongoDB regex search`);
          }
        }
        
        // Process numeric queries
        if (query.match(/\d+/)) {
          console.log('Processing numeric query:', query);
          const numericResults = await this.searchByNumericFields(query, k * 2);
          console.log(`Found ${numericResults.length} results from numeric search`);
          
          mongoResults = [...new Map([...mongoResults, ...numericResults].map(item => 
            [item._id.toString(), item]
          )).values()];
        }
        
        // Add MongoDB results to combined results
        mongoResults.forEach(listing => {
          allResults.set(listing._id.toString(), {
            source: 'mongodb',
            content: this.formatListing(listing)
          });
        });
        
      } catch (mongoError) {
        console.error('Error searching MongoDB:', mongoError);
      }
      
      // 2. Get results from Pinecone vector store (as fallback)
      try {
        console.log('Searching Pinecone vector store...');
        const vectorResults = await this.vectorStore.similaritySearch(query, k);
        console.log(`Found ${vectorResults?.length || 0} results from Pinecone`);
        
        if (vectorResults?.length > 0) {
          vectorResults.forEach(doc => {
            if (doc.metadata?.listingId) {
              allResults.set(doc.metadata.listingId, {
                source: 'pinecone',
                content: doc.pageContent
              });
            } else if (doc.metadata?._id) {
              // Handle case where the ID field might be _id
              allResults.set(doc.metadata._id, {
                source: 'pinecone',
                content: doc.pageContent
              });
            }
          });
        }
      } catch (vectorError) {
        console.error('Error searching vector store:', vectorError);
      }
      
      // 2. Get relevant listings from MongoDB
      try {
        // First try text search
        let mongoResults = [];
        try {
          mongoResults = await Listing.find(
            { $text: { $search: query } },
            { score: { $meta: 'textScore' } }
          )
          .sort({ score: { $meta: 'textScore' } })
          .limit(k * 2) // Get more results since we'll deduplicate
          .lean();
        } catch (e) {
          // Fall back to regex search if text index fails
          mongoResults = await Listing.find({
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
              { address: { $regex: query, $options: 'i' } },
              { type: { $regex: query, $options: 'i' } }
            ]
          })
          .limit(k * 2) // Get more results since we'll deduplicate
          .lean();
        }
        
        // Process numeric queries
        if (query.match(/\d+/)) {
          const numericResults = await this.searchByNumericFields(query, k * 2);
          mongoResults = [...new Map([...mongoResults, ...numericResults].map(item => 
            [item._id.toString(), item]
          )).values()];
        }
        
        // Add MongoDB results to combined results
        mongoResults.forEach(listing => {
          allResults.set(listing._id.toString(), {
            source: 'mongodb',
            content: this.formatListing(listing)
          });
        });
        
      } catch (mongoError) {
        console.error('Error searching MongoDB:', mongoError);
      }
      
      // Convert Map to array and take top k results
      const finalResults = Array.from(allResults.values())
        .slice(0, k)
        .map(item => `=== From ${item.source === 'pinecone' ? 'Property Documents' : 'Property Listings'} ===\n${item.content}`);
      
      return finalResults.length > 0 
        ? finalResults.join('\n\n---\n\n')
        : 'No relevant properties found.';
        
    } catch (error) {
      console.error('Error in RAG search:', error);
      return 'Error processing your request. Please try again later.';
    }
  }
}

export const ragService = new RAGService();
