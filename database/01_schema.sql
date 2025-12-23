-- Migration: 01_schema.sql
-- Description: Create initial schema for Seasons, Chapters, and Assets Queue

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. seasons_registry
CREATE TABLE IF NOT EXISTS public.seasons_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seasons_registry ENABLE ROW LEVEL SECURITY;

-- Policy: Public Read
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'seasons_registry' AND policyname = 'Allow public read access on seasons_registry'
    ) THEN
        CREATE POLICY "Allow public read access on seasons_registry"
            ON public.seasons_registry FOR SELECT USING (true);
    END IF;
END $$;


-- 2. chapters_config
CREATE TABLE IF NOT EXISTS public.chapters_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES public.seasons_registry(id) ON DELETE CASCADE,
    chapter_type TEXT NOT NULL,
    scale TEXT NOT NULL CHECK (scale IN ('S', 'M', 'L')),
    total_tasks INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chapters_config ENABLE ROW LEVEL SECURITY;

-- Policy: Public Read
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chapters_config' AND policyname = 'Allow public read access on chapters_config'
    ) THEN
        CREATE POLICY "Allow public read access on chapters_config"
            ON public.chapters_config FOR SELECT USING (true);
    END IF;
END $$;


-- 3. assets_queue
CREATE TABLE IF NOT EXISTS public.assets_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES public.chapters_config(id) ON DELETE CASCADE,
    stage TEXT NOT NULL CHECK (stage IN ('S1', 'S2', 'S3', 'S4', 'S5')),
    prompt_used TEXT,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assets_queue ENABLE ROW LEVEL SECURITY;

-- Policy: Public Read
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'assets_queue' AND policyname = 'Allow public read access on assets_queue'
    ) THEN
        CREATE POLICY "Allow public read access on assets_queue"
            ON public.assets_queue FOR SELECT USING (true);
    END IF;
END $$;

