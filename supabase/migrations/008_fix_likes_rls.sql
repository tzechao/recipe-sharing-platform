-- ============================================
-- FIX LIKES RLS POLICY
-- ============================================
-- This ensures the likes table allows public viewing
-- Run this if likes aren't showing up for all users
-- IMPORTANT: Run this in Supabase SQL Editor

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own likes" ON likes;
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
DROP POLICY IF EXISTS "Users can like recipes" ON likes;
DROP POLICY IF EXISTS "Users can unlike recipes" ON likes;
DROP POLICY IF EXISTS "Public can view likes" ON likes;

-- Ensure RLS is enabled
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone (including anonymous users) can view likes
-- This is needed for public like counts
-- Using (true) means no restrictions - everyone can see all likes
CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert likes
-- user_id must match auth.uid() (which equals profiles.id)
CREATE POLICY "Users can like recipes"
  ON likes FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND auth.uid() = user_id
  );

-- Policy: Users can delete their own likes
CREATE POLICY "Users can unlike recipes"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'likes';
