-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Anyone can view profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (though trigger handles this)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- RECIPES POLICIES
-- ============================================

-- Anyone can view published recipes, authors can view their own (published or not)
CREATE POLICY "Recipes are viewable by everyone if published, or by author"
  ON recipes FOR SELECT
  USING (
    is_published = true 
    OR author_id = auth.uid()
  );

-- Only authenticated users can create recipes
CREATE POLICY "Authenticated users can create recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only authors can update their own recipes
CREATE POLICY "Authors can update own recipes"
  ON recipes FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Only authors can delete their own recipes
CREATE POLICY "Authors can delete own recipes"
  ON recipes FOR DELETE
  USING (author_id = auth.uid());

-- ============================================
-- RECIPE INGREDIENTS POLICIES
-- ============================================

-- Anyone can view ingredients for published recipes, authors can view their own
CREATE POLICY "Recipe ingredients are viewable by everyone if recipe is published, or by author"
  ON recipe_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND (recipes.is_published = true OR recipes.author_id = auth.uid())
    )
  );

-- Only recipe authors can manage ingredients
CREATE POLICY "Recipe authors can manage ingredients"
  ON recipe_ingredients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.author_id = auth.uid()
    )
  );

-- ============================================
-- RECIPE STEPS POLICIES
-- ============================================

-- Anyone can view steps for published recipes, authors can view their own
CREATE POLICY "Recipe steps are viewable by everyone if recipe is published, or by author"
  ON recipe_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_steps.recipe_id
      AND (recipes.is_published = true OR recipes.author_id = auth.uid())
    )
  );

-- Only recipe authors can manage steps
CREATE POLICY "Recipe authors can manage steps"
  ON recipe_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_steps.recipe_id
      AND recipes.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_steps.recipe_id
      AND recipes.author_id = auth.uid()
    )
  );

-- ============================================
-- RECIPE PHOTOS POLICIES
-- ============================================

-- Anyone can view photos for published recipes, authors can view their own
CREATE POLICY "Recipe photos are viewable by everyone if recipe is published, or by author"
  ON recipe_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_photos.recipe_id
      AND (recipes.is_published = true OR recipes.author_id = auth.uid())
    )
  );

-- Only recipe authors can manage photos
CREATE POLICY "Recipe authors can manage photos"
  ON recipe_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_photos.recipe_id
      AND recipes.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_photos.recipe_id
      AND recipes.author_id = auth.uid()
    )
  );

-- ============================================
-- RECIPE TAGS POLICIES
-- ============================================

-- Anyone can view tags for published recipes, authors can view their own
CREATE POLICY "Recipe tags are viewable by everyone if recipe is published, or by author"
  ON recipe_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND (recipes.is_published = true OR recipes.author_id = auth.uid())
    )
  );

-- Only recipe authors can manage tags
CREATE POLICY "Recipe authors can manage tags"
  ON recipe_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND recipes.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND recipes.author_id = auth.uid()
    )
  );

-- ============================================
-- FAVORITES POLICIES
-- ============================================

-- Users can only view their own favorites
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create their own favorites
CREATE POLICY "Users can create own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);
