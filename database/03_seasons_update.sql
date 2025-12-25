-- Migration: 03_seasons_update.sql
-- Description: Refined schema for Seasons and Chapters to support 12-chapter structure

-- Ensure extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. The Season Container
CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theme_name TEXT NOT NULL,
  status TEXT DEFAULT 'generating', -- 'generating', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

-- Policy: Public Read
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'seasons' AND policyname = 'Allow public read access on seasons'
    ) THEN
        CREATE POLICY "Allow public read access on seasons"
            ON public.seasons FOR SELECT USING (true);
    END IF;
END $$;


-- 2. The Chapters (12 per season)
CREATE TABLE IF NOT EXISTS public.season_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
  chapter_index INT NOT NULL, -- 1 to 12
  chapter_title TEXT NOT NULL, -- e.g., "Space Shuttle"
  
  -- The URLs for the images
  original_grid_url TEXT, -- The full 2x2 image
  full_asset_url TEXT,    -- Top-Left (The main result)
  part_1_url TEXT,        -- Top-Right
  part_2_url TEXT,        -- Bottom-Left
  part_3_url TEXT,        -- Bottom-Right
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.season_chapters ENABLE ROW LEVEL SECURITY;

-- Policy: Public Read
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'season_chapters' AND policyname = 'Allow public read access on season_chapters'
    ) THEN
        CREATE POLICY "Allow public read access on season_chapters"
            ON public.season_chapters FOR SELECT USING (true);
    END IF;
END $$;
