/**
 * 📺 YouTube Service
 *
 * Handles fetching YouTube video transcripts using our Python microservice
 */

export interface TranscriptSegment {
  text: string;
  offset: number; // milliseconds
  duration: number; // milliseconds
}

export interface VideoTranscript {
  videoId: string;
  title: string;
  channelTitle: string;
  duration: number; // seconds
  segments: TranscriptSegment[];
  fullText: string;
}

export interface TranscriptChunk {
  text: string;
  startTime: number; // seconds
  endTime: number; // seconds
}

const TRANSCRIPT_SERVICE_URL = process.env.TRANSCRIPT_SERVICE_URL || 'http://localhost:8000';

/**
 * Extract YouTube video ID from URL
 */
export function extractVideoId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  throw new Error('Invalid YouTube URL');
}

/**
 * Fetch video transcript using Python microservice
 */
export async function getVideoTranscript(youtubeUrl: string): Promise<VideoTranscript> {
  const videoId = extractVideoId(youtubeUrl);

  console.log(`🔍 Fetching transcript for video: ${videoId}`);
  console.log(`📡 Calling transcript service: ${TRANSCRIPT_SERVICE_URL}`);

  try {
    // Call Python microservice
    const response = await fetch(`${TRANSCRIPT_SERVICE_URL}/transcript`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: youtubeUrl,
        languages: ['en'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transcript service error: ${response.status} - ${errorText}`);
    }

    const data: any = await response.json();

    console.log(`📊 Received ${data.transcript.length} transcript segments`);
    console.log(`📺 Video: ${data.title}`);
    console.log(`👤 Channel: ${data.channel}`);

    // Convert Python API format to our format
    const segments: TranscriptSegment[] = data.transcript.map((item: any) => ({
      text: item.text,
      offset: Math.round(item.start * 1000), // seconds to milliseconds
      duration: Math.round(item.duration * 1000),
    }));

    // Combine all segments into full text
    const fullText = segments.map(s => s.text).join(' ').trim();

    console.log(`✅ Full transcript length: ${fullText.length} characters`);
    console.log(`⏱️  Duration: ${data.duration} seconds`);

    return {
      videoId,
      title: data.title,
      channelTitle: data.channel,
      duration: data.duration,
      segments,
      fullText,
    };
  } catch (error: any) {
    console.error('❌ Transcript fetch error:', error.message);
    throw error;
  }
}

/**
 * Chunk transcript into pieces for embedding
 * Tries to chunk at sentence boundaries when possible
 */
export function chunkTranscript(
  transcript: VideoTranscript,
  maxChunkSize: number = 1000
): TranscriptChunk[] {
  const chunks: TranscriptChunk[] = [];
  let currentChunk = '';
  let chunkStartTime = 0;
  let chunkEndTime = 0;

  for (const segment of transcript.segments) {
    const segmentText = segment.text + ' ';
    const segmentStartTime = segment.offset / 1000; // ms to seconds
    const segmentEndTime = segmentStartTime + segment.duration / 1000;

    // If adding this segment would exceed max size, save current chunk
    if (currentChunk.length + segmentText.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        startTime: chunkStartTime,
        endTime: chunkEndTime,
      });

      // Start new chunk
      currentChunk = segmentText;
      chunkStartTime = segmentStartTime;
      chunkEndTime = segmentEndTime;
    } else {
      // Add to current chunk
      if (currentChunk.length === 0) {
        chunkStartTime = segmentStartTime;
      }
      currentChunk += segmentText;
      chunkEndTime = segmentEndTime;
    }
  }

  // Add final chunk
  if (currentChunk.length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      startTime: chunkStartTime,
      endTime: chunkEndTime,
    });
  }

  return chunks;
}

/**
 * Format seconds to timestamp string (MM:SS or HH:MM:SS)
 */
export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
