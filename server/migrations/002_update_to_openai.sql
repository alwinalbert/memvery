-- Migration to update from Gemini (768-dim) to OpenAI (1536-dim) embeddings

-- Drop existing embeddings table and recreate with new vector size
DROP TABLE IF EXISTS embeddings CASCADE;

-- Recreate embeddings table with OpenAI dimensions
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  start_time REAL NOT NULL,
  end_time REAL NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small produces 1536-dimensional vectors
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recreate indexes
CREATE INDEX idx_embeddings_job_id ON embeddings(job_id);
CREATE INDEX idx_embeddings_video_id ON embeddings(video_id);

-- Create HNSW index for fast vector similarity search
CREATE INDEX idx_embeddings_vector ON embeddings
USING hnsw (embedding vector_cosine_ops);

-- Drop existing search function if it exists
DROP FUNCTION IF EXISTS search_embeddings(vector, integer, uuid);

-- Recreate search function with new vector size
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  filter_job_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  job_id UUID,
  video_id TEXT,
  chunk_index INTEGER,
  text TEXT,
  start_time REAL,
  end_time REAL,
  similarity DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id AS id,
    e.job_id AS job_id,
    e.video_id AS video_id,
    e.chunk_index AS chunk_index,
    e.text AS text,
    e.start_time AS start_time,
    e.end_time AS end_time,
    (1 - (e.embedding <=> query_embedding)) AS similarity
  FROM embeddings e
  WHERE (filter_job_id IS NULL OR e.job_id = filter_job_id)
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Enable RLS
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view embeddings for their jobs"
  ON embeddings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = embeddings.job_id
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert embeddings"
  ON embeddings FOR INSERT
  WITH CHECK (true);
