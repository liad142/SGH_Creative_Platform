-- Migration: 06_add_grid_positions.sql
-- Description: Add grid position columns for isometric editor and missing columns

-- Add grid position columns to chapter_tasks for isometric placement
ALTER TABLE public.chapter_tasks 
ADD COLUMN IF NOT EXISTS grid_x INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS grid_y INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS grid_z INTEGER DEFAULT 0;

-- Add storage_path column for reference to original file
ALTER TABLE public.chapter_tasks 
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Add 3D model URL column for GLB/GLTF assets
ALTER TABLE public.chapter_tasks 
ADD COLUMN IF NOT EXISTS asset_model_url TEXT;

-- Add 3D model thumbnail URL
ALTER TABLE public.chapter_tasks 
ADD COLUMN IF NOT EXISTS model_thumbnail_url TEXT;

-- Add map_background_url to seasons table
ALTER TABLE public.seasons
ADD COLUMN IF NOT EXISTS map_background_url TEXT;

-- Add index for faster grid queries
CREATE INDEX IF NOT EXISTS idx_chapter_tasks_grid_position 
ON public.chapter_tasks (grid_x, grid_y, grid_z);

-- Comment on columns for documentation
COMMENT ON COLUMN public.chapter_tasks.grid_x IS 'X position on the isometric grid (0 to N)';
COMMENT ON COLUMN public.chapter_tasks.grid_y IS 'Y position on the isometric grid (0 to N)';
COMMENT ON COLUMN public.chapter_tasks.grid_z IS 'Z (height/elevation) position on the isometric grid';
COMMENT ON COLUMN public.chapter_tasks.storage_path IS 'Path to the asset in Supabase storage';
COMMENT ON COLUMN public.chapter_tasks.asset_model_url IS 'URL to the 3D model file (GLB/GLTF format)';
COMMENT ON COLUMN public.seasons.map_background_url IS 'URL to the generated season map background image';
