-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================
-- IMPORTANT: Storage buckets must be created via Supabase Dashboard
-- This file documents the setup process

-- ============================================
-- STEP 1: Create Storage Bucket (via Dashboard)
-- ============================================
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "Create Bucket"
-- 3. Configure:
--    - Name: recipe-photos
--    - Public: true (for public read access)
--    - File size limit: 5242880 (5MB in bytes)
--    - Allowed MIME types: image/jpeg, image/png, image/webp

-- ============================================
-- STEP 2: Set Up Storage Policies (via Dashboard)
-- ============================================
-- After creating the bucket, go to Storage > recipe-photos > Policies
-- Create the following policies:

-- Policy 1: Public Read Access
-- Name: Public read access for recipe photos
-- Allowed operation: SELECT
-- Policy definition: (bucket_id = 'recipe-photos')
-- Policy check: (bucket_id = 'recipe-photos')

-- Policy 2: Authenticated Upload
-- Name: Authenticated users can upload
-- Allowed operation: INSERT
-- Policy definition: (bucket_id = 'recipe-photos' AND auth.role() = 'authenticated')
-- Policy check: (bucket_id = 'recipe-photos' AND auth.role() = 'authenticated')

-- Policy 3: User Delete Own Files
-- Name: Users can delete own uploads
-- Allowed operation: DELETE
-- Policy definition: (bucket_id = 'recipe-photos' AND auth.role() = 'authenticated')
-- Policy check: (bucket_id = 'recipe-photos' AND auth.role() = 'authenticated')
-- Note: For more security, you could add a check that the file path contains the user's ID
-- Example: (bucket_id = 'recipe-photos' AND (storage.foldername(name))[1] = auth.uid()::text)

-- ============================================
-- ALTERNATIVE: Using Supabase Management API
-- ============================================
-- You can also create the bucket programmatically using the Supabase Management API
-- or Supabase CLI. See the README.md for more details.
