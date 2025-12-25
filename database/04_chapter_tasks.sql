-- Migration: 04_chapter_tasks.sql
-- Description: Updated Schema for Season -> Chapter -> Task Hierarchy

-- Ensure uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Seasons (Theme container)
CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theme_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

-- 2. Chapters (12 per season)
CREATE TABLE IF NOT EXISTS public.season_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
  chapter_index INT NOT NULL,
  title TEXT NOT NULL, -- e.g. "Space Station"
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.season_chapters ENABLE ROW LEVEL SECURITY;

-- 3. Tasks (The buildable items - 6 to 9 per chapter)
CREATE TABLE IF NOT EXISTS public.chapter_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID REFERENCES public.season_chapters(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL, -- e.g. "Antenna"
  
  -- State
  status TEXT DEFAULT 'pending', -- 'pending', 'generated', 'completed'
  
  -- Image URLs
  full_asset_url TEXT,   -- The main image (Step 1)
  part_1_url TEXT,       -- Component A (Step 2)
  part_2_url TEXT,       -- Component B (Step 2)
  part_3_url TEXT,       -- Component C (Step 2)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chapter_tasks ENABLE ROW LEVEL SECURITY;

-- -- POLICIES (Idempotent) -- --

DO $$
BEGIN
    -- Seasons Policy: Public Read
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access on seasons') THEN
        CREATE POLICY "Allow public read access on seasons" ON public.seasons FOR SELECT USING (true);
    END IF;

    -- Chapters Policy: Public Read
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access on season_chapters') THEN
        CREATE POLICY "Allow public read access on season_chapters" ON public.season_chapters FOR SELECT USING (true);
    END IF;

    -- Tasks Policy: Public Read
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access on chapter_tasks') THEN
        CREATE POLICY "Allow public read access on chapter_tasks" ON public.chapter_tasks FOR SELECT USING (true);
    END IF;
END $$;
