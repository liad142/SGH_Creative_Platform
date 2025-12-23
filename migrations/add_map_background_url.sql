-- Migration: add_map_background_url.sql
-- Description: Add map_background_url column to seasons table for visual map feature
-- Date: 2025-12-23

-- Add the new column for storing the season's background map image URL
ALTER TABLE public.seasons 
ADD COLUMN IF NOT EXISTS map_background_url TEXT;

-- Note: The existing RLS policy "Allow public read access on seasons" 
-- already covers SELECT on all columns, so no policy update is needed.
