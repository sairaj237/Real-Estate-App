import express from 'express';
import multer from 'multer';
import { ragService } from '../utils/ragUtils.js';
import winston from 'winston';

const router = express.Router();
const upload = multer();

// Add documents to the RAG system
router.post('/ingest', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse the file content (assuming text/plain or text/markdown)
    const textContent = req.file.buffer.toString('utf-8');
    
    // Split into chunks (simple approach - you might want more sophisticated chunking)
    const chunks = textContent
      .split(/\n\s*\n/) // Split by double newlines
      .filter(chunk => chunk.trim().length > 0);

    // Add to vector store
    await ragService.addDocuments(chunks);
    
    winston.info(`Ingested ${chunks.length} document chunks`);
    
    res.json({ 
      success: true, 
      message: 'Document ingested successfully',
      chunks: chunks.length
    });
    
  } catch (error) {
    winston.error('Error ingesting document', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to process document',
      details: error.message 
    });
  }
});

// Get statistics about the RAG system
router.get('/stats', async (req, res) => {
  try {
    // This is a placeholder - you'll need to implement getStats() in ragUtils
    const stats = await ragService.getStats();
    res.json(stats);
  } catch (error) {
    winston.error('Error getting RAG stats', { error: error.message });
    res.status(500).json({ error: 'Failed to get RAG stats' });
  }
});

export default router;
