/**
 * 💾 Database Service
 *
 * Handles all database operations for video processing jobs
 * using Supabase with pgvector for embeddings
 */

import { supabaseAdmin as supabase } from '../config/supabase';
import { TranscriptSegment } from './youtube';
import { createEmbedding } from './ai';
import { chunkTranscript } from './youtube';

/**
 * Job record in database
 */
export interface JobRecord {
  id: string;
  userId: string;
  videoId: string;
  title: string;
  channelTitle: string;
  duration: number;
  url: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new job record and store embeddings
 */
export async function createJobRecord(params: {
  userId: string;
  videoId: string;
  title: string;
  channelTitle: string;
  duration: number;
  url: string;
  transcript: string;
  segments: TranscriptSegment[];
}): Promise<JobRecord> {
  const {
    userId,
    videoId,
    title,
    channelTitle,
    duration,
    url,
    transcript,
    segments,
  } = params;

  console.log(`💾 Creating job record for video: ${videoId}`);

  // Insert job record
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      user_id: userId,
      video_id: videoId,
      title,
      channel_title: channelTitle,
      duration,
      url,
      status: 'processing',
    })
    .select()
    .single();

  if (jobError || !job) {
    throw new Error(`Failed to create job: ${jobError?.message}`);
  }

  console.log(`✅ Job created: ${job.id}`);

  // Chunk transcript for embedding
  console.log(`🔪 Chunking transcript...`);
  const chunks = chunkTranscript(
    { videoId, title, channelTitle, duration, segments, fullText: transcript },
    1000
  );

  console.log(`📊 Created ${chunks.length} chunks`);

  // Create embeddings for each chunk
  console.log(`🤖 Creating embeddings with OpenAI...`);
  const embeddingRecords = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    try {
      // Create embedding using OpenAI
      const embedding = await createEmbedding(chunk.text);

      embeddingRecords.push({
        job_id: job.id,
        video_id: videoId,
        chunk_index: i,
        text: chunk.text,
        start_time: chunk.startTime,
        end_time: chunk.endTime,
        embedding,
      });

      // Show progress
      if ((i + 1) % 5 === 0 || i === chunks.length - 1) {
        console.log(`  ⏳ ${i + 1}/${chunks.length} embeddings created`);
      }
    } catch (error: any) {
      console.error(`❌ Failed to create embedding for chunk ${i}:`, error.message);
      throw error;
    }
  }

  // Insert all embeddings in batch
  console.log(`💾 Storing ${embeddingRecords.length} embeddings...`);
  const { error: embeddingError } = await supabase
    .from('embeddings')
    .insert(embeddingRecords);

  if (embeddingError) {
    throw new Error(`Failed to store embeddings: ${embeddingError.message}`);
  }

  console.log(`✅ All embeddings stored successfully`);

  return {
    id: job.id,
    userId: job.user_id,
    videoId: job.video_id,
    title: job.title,
    channelTitle: job.channel_title,
    duration: job.duration,
    url: job.url,
    status: job.status,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
  };
}

/**
 * Update job status
 */
export async function updateJobStatus(
  jobId: string,
  status: 'queued' | 'processing' | 'completed' | 'failed',
  error?: string
): Promise<void> {
  const { error: updateError } = await supabase
    .from('jobs')
    .update({
      status,
      error,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (updateError) {
    throw new Error(`Failed to update job status: ${updateError.message}`);
  }

  console.log(`✅ Job ${jobId} status updated to: ${status}`);
}

/**
 * Get job by ID
 */
export async function getJobById(jobId: string): Promise<JobRecord | null> {
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error || !job) {
    return null;
  }

  return {
    id: job.id,
    userId: job.user_id,
    videoId: job.video_id,
    title: job.title,
    channelTitle: job.channel_title,
    duration: job.duration,
    url: job.url,
    status: job.status,
    error: job.error,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
  };
}

/**
 * Get all jobs for a user
 */
export async function getUserJobs(userId: string): Promise<JobRecord[]> {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch jobs: ${error.message}`);
  }

  return (jobs || []).map(job => ({
    id: job.id,
    userId: job.user_id,
    videoId: job.video_id,
    title: job.title,
    channelTitle: job.channel_title,
    duration: job.duration,
    url: job.url,
    status: job.status,
    error: job.error,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
  }));
}
