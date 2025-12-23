-- Add columns for prompt and storage path to chapter_tasks table
-- Run this in your Supabase SQL Editor

ALTER TABLE chapter_tasks 
ADD COLUMN IF NOT EXISTS prompt_used TEXT,
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Comment describing columns
COMMENT ON COLUMN chapter_tasks.prompt_used IS 'The prompt sent to the AI to generate this image';
COMMENT ON COLUMN chapter_tasks.storage_path IS 'The storage bucket path for the image file';
