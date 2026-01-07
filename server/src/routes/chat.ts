import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { supabaseAdmin as supabase } from '../config/supabase';
import { createEmbedding, generateChatResponse } from '../services/ai';
import { getJobById } from '../services/database';
import { formatTimestamp } from '../services/youtube';

const router = Router();

/**
 * Send a chat message
 * POST /api/chat/message
 * Protected route - requires authentication
 */
router.post('/message', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { message, videoId } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
      });
    }

    if (!videoId) {
      return res.status(400).json({
        error: 'Video ID is required',
      });
    }

    console.log(`💬 Chat query: "${message}"`);
    console.log(`📹 Video ID: ${videoId}`);

    // Get job details
    const job = await getJobById(videoId);
    if (!job) {
      return res.status(404).json({
        error: 'Video not found',
      });
    }

    // Create embedding for user's question using OpenAI
    console.log(`🤖 Creating query embedding with OpenAI...`);
    const queryEmbedding = await createEmbedding(message);

    // Search for relevant chunks using pgvector similarity search
    console.log(`🔍 Searching for relevant context...`);
    const { data: results, error: searchError } = await supabase.rpc(
      'search_embeddings',
      {
        query_embedding: queryEmbedding,
        match_count: 5,
        filter_job_id: videoId,
      }
    );

    if (searchError) {
      console.error('❌ Search error:', searchError);
      throw new Error(`Failed to search embeddings: ${searchError.message}`);
    }

    if (!results || results.length === 0) {
      return res.json({
        success: true,
        data: {
          conversationId: `conv_${Date.now()}`,
          response: `I couldn't find relevant information in the video to answer your question. This might be because:
- The video doesn't cover this topic
- The question is too specific
- The transcript quality is limited

Try asking a more general question about the video content.`,
          sources: [],
          timestamp: new Date().toISOString(),
        },
      });
    }

    console.log(`✅ Found ${results.length} relevant chunks`);

    // Format context for AI
    const context = results.map((r: any) => ({
      text: r.text,
      startTime: r.start_time,
      endTime: r.end_time,
      similarity: r.similarity,
    }));

    // Generate response using OpenAI with RAG context
    console.log(`🤖 Generating AI response with GPT-3.5-turbo...`);
    const aiResponse = await generateChatResponse({
      question: message,
      context,
      videoTitle: job.title,
    });

    console.log(`✅ Response generated`);

    // Format sources with timestamps
    const sources = context.map((c: any) => ({
      timestamp: formatTimestamp(c.startTime),
      startTime: c.startTime,
      similarity: c.similarity,
    }));

    res.json({
      success: true,
      data: {
        conversationId: `conv_${Date.now()}`,
        response: aiResponse,
        sources,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Chat message error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process message',
    });
  }
});

/**
 * Get chat history for a specific content
 * GET /api/chat/history/:contentId
 * Protected route - requires authentication
 */
router.get('/history/:contentId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { contentId } = req.params;

    // TODO: Fetch chat history from database

    // Placeholder response
    res.json({
      success: true,
      data: {
        contentId,
        messages: [
          {
            id: '1',
            role: 'assistant',
            content: 'Hello! I can help you search and understand the content from your submitted videos.',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      error: 'Failed to fetch chat history',
    });
  }
});

export default router;
