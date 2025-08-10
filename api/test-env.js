import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try loading .env from different locations
const envPaths = [
  resolve(__dirname, '.env'),
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '..', '.env')
];

console.log('Trying to load .env from:');
for (const path of envPaths) {
  console.log(`- ${path}`);
  try {
    const result = config({ path, override: true });
    if (result.parsed) {
      console.log(`✅ Successfully loaded from: ${path}`);
      break;
    }
  } catch (error) {
    console.log(`❌ Error loading ${path}:`, error.message);
  }
}

// Display environment variables
console.log('\nEnvironment Variables:');
console.log('---------------------');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
console.log(`PINECONE_API_KEY: ${process.env.PINECONE_API_KEY ? '***' : 'Not found'}`);
console.log(`PINECONE_ENVIRONMENT: ${process.env.PINECONE_ENVIRONMENT || 'Not found'}`);
console.log(`PINECONE_INDEX: ${process.env.PINECONE_INDEX || 'Not found'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '***' : 'Not found'}`);
console.log(`MONGO_URI: ${process.env.MONGO_URI ? '***' : 'Not found'}`);

// Check for required variables
const requiredVars = ['JWT_SECRET', 'MONGO_URI', 'PINECONE_API_KEY', 'PINECONE_ENVIRONMENT'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('\n❌ Missing required environment variables:', missingVars.join(', '));
} else {
  console.log('\n✅ All required environment variables are present');
}
