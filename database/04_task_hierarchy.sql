-- Migration: 04_task_hierarchy.sql
-- Description: Implement Season -> Chapter -> Task hierarchy

-- Ensure uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Seasons (The Theme)
CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theme_name TEXT NOT NULL,
  status TEXT DEFAULT 'generating', -- 'generating', 'completed' (from previous step)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for seasons
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

-- 2. Chapters (The Location - 12 per season)
CREATE TABLE IF NOT EXISTS public.season_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
  chapter_index INT NOT NULL, -- 1-12
  title TEXT NOT NULL, -- e.g., "Space Station"
  cover_image_url TEXT, -- Optional: The background for this location
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for season_chapters
ALTER TABLE public.season_chapters ENABLE ROW LEVEL SECURITY;

-- 3. Tasks (The Buildable Items - 6-9 per chapter)
CREATE TABLE IF NOT EXISTS public.chapter_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID REFERENCES public.season_chapters(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL, -- e.g., "Main Antenna"
  
  -- Step 1: The Full Object
  full_asset_url TEXT, 
  
  -- Step 2: The Parts (Generated later)
  part_1_url TEXT,
  part_2_url TEXT,
  part_3_url TEXT,
  
  status TEXT DEFAULT 'pending', -- 'pending', 'full_ready', 'parts_ready'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for chapter_tasks
ALTER TABLE public.chapter_tasks ENABLE ROW LEVEL SECURITY;

-- -- POLICIES (Idempotent) -- --

DO $$
BEGIN
    -- Seasons Policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access on seasons') THEN
        CREATE POLICY "Allow public read access on seasons" ON public.seasons FOR SELECT USING (true);
    END IF;

    -- Chapters Policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access on season_chapters') THEN
        CREATE POLICY "Allow public read access on season_chapters" ON public.season_chapters FOR SELECT USING (true);
    END IF;

    -- Tasks Policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access on chapter_tasks') THEN
        CREATE POLICY "Allow public read access on chapter_tasks" ON public.chapter_tasks FOR SELECT USING (true);
    END IF;
END $$;
