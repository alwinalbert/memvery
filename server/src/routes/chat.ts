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
    const { message, videoId, conversationId } = req.body;

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

    // Get or create conversation
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: req.user!.id,
          job_id: videoId,
          title: message.slice(0, 100),
        })
        .select()
        .single();

      if (convError) {
        console.error('Failed to create conversation:', convError);
      } else {
        activeConversationId = newConv.id;
      }
    }

    // Save user message to database
    if (activeConversationId) {
      await supabase.from('messages').insert({
        conversation_id: activeConversationId,
        role: 'user',
        content: message,
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
      const noResultResponse = `I couldn't find relevant information in the video to answer your question. This might be because:
- The video doesn't cover this topic
- The question is too specific
- The transcript quality is limited

Try asking a more general question about the video content.`;

      // Save assistant response
      if (activeConversationId) {
        await supabase.from('messages').insert({
          conversation_id: activeConversationId,
          role: 'assistant',
          content: noResultResponse,
          sources: [],
        });
      }

      return res.json({
        success: true,
        data: {
          conversationId: activeConversationId,
          response: noResultResponse,
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

    // Save assistant response to database
    if (activeConversationId) {
      await supabase.from('messages').insert({
        conversation_id: activeConversationId,
        role: 'assistant',
        content: aiResponse,
        sources: sources,
      });
    }

    res.json({
      success: true,
      data: {
        conversationId: activeConversationId,
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
 * Get all conversations for current user
 * GET /api/chat/conversations
 * Protected route - requires authentication
 */
router.get('/conversations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        title,
        job_id,
        created_at,
        updated_at,
        jobs (
          title,
          video_id
        )
      `)
      .eq('user_id', req.user!.id)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      data: (conversations || []).map(conv => ({
        id: conv.id,
        title: conv.title,
        jobId: conv.job_id,
        videoTitle: (conv.jobs as any)?.title || null,
        videoId: (conv.jobs as any)?.video_id || null,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
      })),
    });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch conversations',
    });
  }
});

/**
 * Get messages for a specific conversation
 * GET /api/chat/conversations/:id/messages
 * Protected route - requires authentication
 */
router.get('/conversations/:id/messages', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify conversation belongs to user
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select('id, job_id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (convError || !conv) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, role, content, sources, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (msgError) {
      throw new Error(msgError.message);
    }

    res.json({
      success: true,
      data: {
        conversationId: id,
        jobId: conv.job_id,
        messages: (messages || []).map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          sources: msg.sources || [],
          timestamp: msg.created_at,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch messages',
    });
  }
});

/**
 * Delete a conversation
 * DELETE /api/chat/conversations/:id
 * Protected route - requires authentication
 */
router.delete('/conversations/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete conversation',
    });
  }
});

/**
 * Get chat history for a specific content (legacy endpoint)
 * GET /api/chat/history/:contentId
 * Protected route - requires authentication
 */
router.get('/history/:contentId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { contentId } = req.params;

    // Get conversations for this content
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        title,
        created_at,
        messages (
          id,
          role,
          content,
          sources,
          created_at
        )
      `)
      .eq('user_id', req.user!.id)
      .eq('job_id', contentId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    if (!conversations || conversations.length === 0) {
      return res.json({
        success: true,
        data: {
          contentId,
          messages: [],
        },
      });
    }

    const conversation = conversations[0];

    res.json({
      success: true,
      data: {
        contentId,
        conversationId: conversation.id,
        messages: ((conversation.messages as any[]) || [])
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            sources: msg.sources || [],
            timestamp: msg.created_at,
          })),
      },
    });
  } catch (error: any) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch chat history',
    });
  }
});

export default router;
