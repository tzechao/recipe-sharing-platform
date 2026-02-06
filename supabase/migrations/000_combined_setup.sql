-- ============================================
-- COMBINED DATABASE SETUP
-- Recipe Sharing Platform - Complete Schema
-- ============================================
-- This file combines all migrations for easy setup
-- You can run this entire file in Supabase SQL Editor
-- Or run the individual migration files in order

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ============================================
-- RECIPES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  prep_minutes INTEGER,
  cook_minutes INTEGER,
  servings INTEGER,
  is_published BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recipes_author_id ON recipes(author_id);
CREATE INDEX IF NOT EXISTS idx_recipes_slug ON recipes(slug);
CREATE INDEX IF NOT EXISTS idx_recipes_is_published ON recipes(is_published);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_recipes_description ON recipes USING gin(to_tsvector('english', description));

-- ============================================
-- RECIPE INGREDIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  quantity TEXT,
  unit TEXT,
  item TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_item ON recipe_ingredients USING gin(to_tsvector('english', item));

-- ============================================
-- RECIPE STEPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS recipe_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);

-- ============================================
-- RECIPE PHOTOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS recipe_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recipe_photos_recipe_id ON recipe_photos(recipe_id);

-- ============================================
-- RECIPE TAGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS recipe_tags (
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (recipe_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe_id ON recipe_tags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag ON recipe_tags(tag);

-- ============================================
-- FAVORITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_recipe_id ON favorites(recipe_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for recipes updated_at
DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'));
  slug := regexp_replace(slug, '\s+', '-', 'g');
  slug := trim(both '-' from slug);
  RETURN slug;
END;
$$ LANGUAGE plpgsql;

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

-- Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

DROP POLICY IF EXISTS "Recipes are viewable by everyone if published, or by author" ON recipes;
DROP POLICY IF EXISTS "Authenticated users can create recipes" ON recipes;
DROP POLICY IF EXISTS "Authors can update own recipes" ON recipes;
DROP POLICY IF EXISTS "Authors can delete own recipes" ON recipes;

DROP POLICY IF EXISTS "Recipe ingredients are viewable by everyone if recipe is published, or by author" ON recipe_ingredients;
DROP POLICY IF EXISTS "Recipe authors can manage ingredients" ON recipe_ingredients;

DROP POLICY IF EXISTS "Recipe steps are viewable by everyone if recipe is published, or by author" ON recipe_steps;
DROP POLICY IF EXISTS "Recipe authors can manage steps" ON recipe_steps;

DROP POLICY IF EXISTS "Recipe photos are viewable by everyone if recipe is published, or by author" ON recipe_photos;
DROP POLICY IF EXISTS "Recipe authors can manage photos" ON recipe_photos;

DROP POLICY IF EXISTS "Recipe tags are viewable by everyone if recipe is published, or by author" ON recipe_tags;
DROP POLICY IF EXISTS "Recipe authors can manage tags" ON recipe_tags;

DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can create own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;

-- PROFILES POLICIES
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RECIPES POLICIES
CREATE POLICY "Recipes are viewable by everyone if published, or by author"
  ON recipes FOR SELECT
  USING (
    is_published = true 
    OR author_id = auth.uid()
  );

CREATE POLICY "Authenticated users can create recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authors can update own recipes"
  ON recipes FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can delete own recipes"
  ON recipes FOR DELETE
  USING (author_id = auth.uid());

-- RECIPE INGREDIENTS POLICIES
CREATE POLICY "Recipe ingredients are viewable by everyone if recipe is published, or by author"
  ON recipe_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND (recipes.is_published = true OR recipes.author_id = auth.uid())
    )
  );

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

-- RECIPE STEPS POLICIES
CREATE POLICY "Recipe steps are viewable by everyone if recipe is published, or by author"
  ON recipe_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_steps.recipe_id
      AND (recipes.is_published = true OR recipes.author_id = auth.uid())
    )
  );

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

-- RECIPE PHOTOS POLICIES
CREATE POLICY "Recipe photos are viewable by everyone if recipe is published, or by author"
  ON recipe_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_photos.recipe_id
      AND (recipes.is_published = true OR recipes.author_id = auth.uid())
    )
  );

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

-- RECIPE TAGS POLICIES
CREATE POLICY "Recipe tags are viewable by everyone if recipe is published, or by author"
  ON recipe_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND (recipes.is_published = true OR recipes.author_id = auth.uid())
    )
  );

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

-- FAVORITES POLICIES
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);
