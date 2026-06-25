## **RAG Flow When Owner Publishes a Property**

### **1. Property Creation & Storage**
When an owner creates a listing via `POST /api/listings/create`:
- The property data is **saved directly to MongoDB** (the Listing collection)
- Data includes: name, description, address, price, bedrooms, bathrooms, type, features, etc.
- The listing is stored in the database and immediately available for queries

```javascript
// api/controllers/listing.controller.js
export const createListing = async (req, res, next) => {
  const listing = await Listing.create(req.body);  // Saved to MongoDB
  return res.status(201).json(listing);
};
```

### **2. Property Discovery During Chat (RAG Retrieval)**
When a user searches for properties via the chat interface:

**Hybrid Search Process:**
1. **User Query** → `POST /api/chat` with message: *"Show me 2-bedroom properties in Sunnyvale"*

2. **RAG Service Search** performs **dual search**:
   
   **MongoDB Search (First Priority):**
   - Tries exact matches on name/address
   - Uses `$text` search index if available
   - Falls back to regex pattern matching on fields: `name`, `description`, `address`, `type`
   - Handles numeric queries for bedrooms, price ranges
   - **This is where published listings are found**

   ```javascript
   mongoResults = await Listing.find({
     name: { $regex: query, $options: 'i' },
     description: { $regex: query, $options: 'i' },
     address: { $regex: query, $options: 'i' }
   })
   ```

   **Pinecone Vector Search (Secondary):**
   - Searches stored document embeddings for semantic matches
   - Only works if documents were previously uploaded via `POST /api/documents/ingest`

3. **Deduplication & Formatting:**
   - Combines results from both sources using a Map (by listing ID)
   - Formats results using `formatListing()` method
   - Returns top k results

4. **LLM Response:**
   - Retrieved property data is injected into system prompt
   - OpenRouter Qwen model generates natural language response
   - User gets: *"Here are 2 properties matching your search..."*

### **Key Difference: Published vs. Uploaded Documents**

| Source | How It Works | Storage |
|--------|------------|---------|
| **Published Listings** | Owner fills form → Direct DB save | MongoDB (Listing collection) |
| **Document Upload** | Admin uploads `.txt`/`.md` file → Text chunks created → Embeddings generated | Pinecone (vector DB) |

### **When RAG Actually Powers Searches**
- ✅ Finding published listings by **semantic meaning** (Pinecone + MongoDB hybrid)
- ✅ Handling natural language queries like *"cozy apartments near the park"*
- ✅ Combining exact matches (MongoDB) with semantic matches (Pinecone)
- ✅ Providing intelligent responses via the LLM

The published listings are **always** in MongoDB and retrieved via the RAG hybrid search every time a user queries them through chat!

### **Visual Flow Diagram**

```
User Query
   ↓
"2-bedroom apartments under $500k in Sunnyvale"
   ↓
[Backend JavaScript - NOT LLM]
   ├─ Regex pattern: Extract "2" → bedrooms = 2
   ├─ Regex pattern: Extract "$500000" → price <= 500000
   ├─ String contains "Sunnyvale" → address search
   ↓
MongoDB Query (Mongoose JavaScript, NOT SQL):
   ├─ { bedrooms: 2 }
   ├─ { regularPrice: { $lte: 500000 } }
   ├─ { address: { $regex: "Sunnyvale", $options: "i" } }
   ↓
Database Returns Matched Documents
   ↓
formatListing() - Convert to readable text
   ↓
Inject into System Prompt for LLM
   ↓
LLM generates natural response
```
