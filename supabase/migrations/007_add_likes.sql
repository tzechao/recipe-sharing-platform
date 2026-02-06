-- ============================================
-- LIKES TABLE
-- ============================================
-- Note: This is separate from favorites
-- Favorites = saving recipes for later
-- Likes = quick appreciation/reaction

CREATE TABLE IF NOT EXISTS likes (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, recipe_id)
);

-- Indexes for likes
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_recipe_id ON likes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR LIKES
-- ============================================

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (drop all possible policy names)
DROP POLICY IF EXISTS "Users can view own likes" ON likes;
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
DROP POLICY IF EXISTS "Users can like recipes" ON likes;
DROP POLICY IF EXISTS "Users can unlike recipes" ON likes;

-- Anyone can view likes (needed for counting likes per recipe)
-- This allows public like counts while still maintaining security
CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  USING (true);

-- Authenticated users can like recipes
CREATE POLICY "Users can like recipes"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike recipes (delete their own likes)
CREATE POLICY "Users can unlike recipes"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);
