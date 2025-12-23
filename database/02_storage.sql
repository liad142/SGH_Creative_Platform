-- Migration: 02_storage.sql
-- Description: Setup Storage Buckets and Policies

-- 1. Create Buckets
-- Public bucket for static templates
INSERT INTO storage.buckets (id, name, public)
VALUES ('sgh-assets', 'sgh-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Private bucket for AI-generated output
INSERT INTO storage.buckets (id, name, public)
VALUES ('sgh-generated', 'sgh-generated', false)
ON CONFLICT (id) DO NOTHING;


-- 2. Define Policies
-- We need to act on the 'storage.objects' table.

-- A) Policies for 'sgh-assets' (Public Read)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Access sgh-assets' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Public Access sgh-assets"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'sgh-assets' );
    END IF;
END $$;

-- B) Policies for 'sgh-generated' (Private)
-- Backend (Service Role) typically bypasses RLS.
-- Frontend can read (via signed URLs usually, but if direct auth access is needed):
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Authenticated Read sgh-generated' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Authenticated Read sgh-generated"
        ON storage.objects FOR SELECT
        TO authenticated
        USING ( bucket_id = 'sgh-generated' );
    END IF;
END $$;
