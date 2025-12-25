-- Migration: 05_final_seasons_schema.sql
-- Description: Final 3-tier hierarchy for Seasons, Chapters, and Tasks, and public storage setup.

-- 1. STORAGE SETUP
-- Ensure public bucket named `sgh-generated` exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('sgh-generated', 'sgh-generated', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure public bucket named `sgh-assets` exists (from previous tasks)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sgh-assets', 'sgh-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for storage
DO $$
BEGIN
    -- Public Access for sgh-generated
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Access sgh-generated' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Public Access sgh-generated"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'sgh-generated' );
    END IF;

    -- Public Access for sgh-assets
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Access sgh-assets' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Public Access sgh-assets"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'sgh-assets' );
    END IF;
END $$;


-- 2. DATABASE SCHEMA (The 3-Tier Hierarchy)

-- Ensure uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- LEVEL 1: Seasons (The Theme Container)
CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theme_name TEXT NOT NULL, -- e.g. "Underwater Atlantis"
  status TEXT DEFAULT 'planning',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LEVEL 2: Chapters (The 12 Locations)
CREATE TABLE IF NOT EXISTS public.season_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
  chapter_index INT NOT NULL, -- 1 to 12
  title TEXT NOT NULL, -- e.g. "Coral Reef Outpost"
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LEVEL 3: Tasks (The 6-9 Buildable Game Assets)
CREATE TABLE IF NOT EXISTS public.chapter_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID REFERENCES public.season_chapters(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL, -- e.g. "Seahorse Mailbox"
  task_type TEXT, -- 'structure', 'prop', 'nature'
  
  -- Generation State
  status TEXT DEFAULT 'pending', -- 'pending', 'generated', 'completed'
  
  -- The AI Prompts (For debugging/refining)
  prompt_used TEXT, 
  
  -- The Assets
  full_asset_url TEXT, -- The main "Step 1" image
  part_1_url TEXT,     -- "Step 2" decomposition
  part_2_url TEXT,
  part_3_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_tasks ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES (Public Read)
DO $$
BEGIN
    -- Seasons Policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'seasons' AND policyname = 'Allow public read access on seasons') THEN
        CREATE POLICY "Allow public read access on seasons" ON public.seasons FOR SELECT USING (true);
    END IF;

    -- Chapters Policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'season_chapters' AND policyname = 'Allow public read access on season_chapters') THEN
        CREATE POLICY "Allow public read access on season_chapters" ON public.season_chapters FOR SELECT USING (true);
    END IF;

    -- Tasks Policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access on chapter_tasks') THEN
        CREATE POLICY "Allow public read access on chapter_tasks" ON public.chapter_tasks FOR SELECT USING (true);
    END IF;
END $$;
