import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getVideoTranscript } from '../services/youtube';
import { createJobRecord, updateJobStatus } from '../services/database';

const router = Router();

/**
 * Submit YouTube URL for processing
 * POST /api/content/submit
 * Protected route - requires authentication
 */
router.post('/submit', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        error: 'URL is required',
      });
    }

    console.log(`📥 Processing YouTube URL: ${url}`);
    console.log(`👤 User ID: ${req.user?.id}`);

    // Fetch transcript from YouTube using Python service
    const transcript = await getVideoTranscript(url);

    console.log(`✅ Transcript fetched: ${transcript.segments.length} segments`);
    console.log(`📺 Video: ${transcript.title}`);

    // Create job record in database with OpenAI embeddings
    const job = await createJobRecord({
      userId: req.user!.id,
      videoId: transcript.videoId,
      title: transcript.title,
      channelTitle: transcript.channelTitle,
      duration: transcript.duration,
      url,
      transcript: transcript.fullText,
      segments: transcript.segments,
    });

    console.log(`💾 Job created: ${job.id}`);

    // Update status to completed
    await updateJobStatus(job.id, 'completed');

    res.json({
      success: true,
      message: 'Video processed successfully',
      data: {
        id: job.id,
        videoId: transcript.videoId,
        title: transcript.title,
        status: 'completed',
        createdAt: job.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Submit content error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit content',
    });
  }
});

/**
 * Get user's submitted content/jobs
 * GET /api/content/jobs
 * Protected route - requires authentication
 */
router.get('/jobs', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // TODO: Fetch jobs from database filtered by user ID

    // Placeholder response with mock data
    res.json({
      success: true,
      data: [
        {
          id: '1',
          url: 'https://youtube.com/watch?v=example1',
          type: 'video',
          status: 'ready',
          userId: req.user?.id,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          url: 'https://youtube.com/@examplechannel',
          type: 'channel',
          status: 'processing',
          userId: req.user?.id,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          url: 'https://youtube.com/watch?v=example2',
          type: 'video',
          status: 'queued',
          userId: req.user?.id,
          createdAt: new Date().toISOString(),
        },
      ],
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      error: 'Failed to fetch jobs',
    });
  }
});

export default router;
