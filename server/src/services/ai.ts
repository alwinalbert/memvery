
/**
 * 🤖 AI Service (OpenAI)
 *
 * Handles all AI interactions:
 * - Creating embeddings for transcript chunks (text-embedding-3-small)
 * - Generating chat responses with RAG (gpt-3.5-turbo)
 */

import OpenAI from 'openai';
import { config } from '../config/env';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Create embedding for text using OpenAI's text-embedding-3-small model
 *
 * This model produces 1536-dimensional vectors (vs Gemini's 768)
 * Cost: $0.02 per 1M tokens (very cheap!)
 */
export async function createEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    const embedding = response.data[0].embedding;
    return embedding;
  } catch (error: any) {
    console.error('❌ OpenAI embedding error:', error.message);
    throw new Error(`Failed to create embedding: ${error.message}`);
  }
}

/**
 * Generate chat response using RAG context with GPT-3.5-turbo
 *
 * Cost: ~$0.001 per response
 */
export async function generateChatResponse(params: {
  question: string;
  context: Array<{
    text: string;
    startTime: number;
    endTime: number;
    similarity: number;
  }>;
  videoTitle: string;
}): Promise<string> {
  const { question, context, videoTitle } = params;

  try {
    // Build context from relevant chunks
    const contextText = context
      .map((chunk, i) => {
        const timestamp = formatTimestamp(chunk.startTime);
        return `[${timestamp}] ${chunk.text}`;
      })
      .join('\n\n');

    // Create messages for chat
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are a helpful AI assistant analyzing a YouTube video titled "${videoTitle}".

Your task is to answer questions about the video based ONLY on the provided transcript excerpts.

Guidelines:
- Answer naturally and conversationally
- Include specific timestamp references when citing information (format: [MM:SS] or [HH:MM:SS])
- If the question cannot be answered from the provided context, say so honestly
- Do not make up information not present in the transcript
- Be concise but thorough`,
      },
      {
        role: 'user',
        content: `Here are relevant excerpts from the video transcript with timestamps:

${contextText}

Question: ${question}`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const answer = response.choices[0]?.message?.content || 'Unable to generate response';
    return answer;
  } catch (error: any) {
    console.error('❌ OpenAI chat error:', error.message);
    throw new Error(`Failed to generate response: ${error.message}`);
  }
}

/**
 * Format seconds to timestamp string
 */
function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
