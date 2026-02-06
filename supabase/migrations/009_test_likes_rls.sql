-- ============================================
-- TEST LIKES RLS POLICY
-- ============================================
-- Run this to verify likes RLS is working correctly
-- This will help diagnose why likes aren't showing up

-- 1. Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'likes';

-- 2. List all policies on likes table
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
WHERE tablename = 'likes'
ORDER BY policyname;

-- 3. Check if there are any likes in the table
SELECT COUNT(*) as total_likes FROM likes;

-- 4. Check likes per recipe
SELECT 
  recipe_id,
  COUNT(*) as like_count
FROM likes
GROUP BY recipe_id
ORDER BY like_count DESC;

-- 5. Test query that should work with RLS (as authenticated user)
-- This simulates what the app does
SELECT 
  user_id,
  recipe_id,
  created_at
FROM likes
LIMIT 10;

-- 6. If the above queries work but the app doesn't, check:
--    - Are you logged in as a user in the app?
--    - Does the user have a profile in the profiles table?
--    - Is auth.uid() matching profiles.id?

-- Check user profiles
SELECT 
  p.id as profile_id,
  p.user_name,
  p.full_name,
  COUNT(l.recipe_id) as likes_given
FROM profiles p
LEFT JOIN likes l ON p.id = l.user_id
GROUP BY p.id, p.user_name, p.full_name
ORDER BY likes_given DESC
LIMIT 10;
