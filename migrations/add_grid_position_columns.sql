-- Migration: add_grid_position_columns.sql
-- Description: Add 3D positioning columns to chapter_tasks for isometric grid placement
-- Date: 2025-12-23

-- Add spatial coordinates for 3D grid positioning
ALTER TABLE public.chapter_tasks
ADD COLUMN IF NOT EXISTS grid_x INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS grid_y INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS grid_z INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS rotation INT DEFAULT 0;

-- Column Descriptions:
-- grid_x: Row/Depth position on the isometric grid
-- grid_y: Column/Horizontal position on the isometric grid  
-- grid_z: Elevation/Stacking order (for layering objects)
-- rotation: Facing direction in degrees (0, 90, 180, 270)

-- Note: The existing RLS policy "Allow public read access on chapter_tasks"
-- already covers SELECT on all columns, so no policy update is needed.
