# Supabase Database Setup

This directory contains SQL migration files for setting up the Recipe Sharing Platform database.

## Setup Instructions

### Quick Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of **001_simple_schema.sql** into the editor
4. Click **Run** to execute the migration

## Database Schema

### Tables

#### `profiles`
- `id` (UUID, Primary Key, references auth.users)
- `user_name` (TEXT, Unique, Required)
- `full_name` (TEXT, Optional)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### `recipes`
- `id` (UUID, Primary Key)
- `created_at` (TIMESTAMPTZ)
- `user_id` (UUID, Foreign Key to profiles.id)
- `title` (TEXT, Required)
- `ingredients` (TEXT, Required)
- `instructions` (TEXT, Required)
- `cooking_time` (INTEGER, Optional - in minutes)
- `difficulty` (TEXT, Optional)
- `category` (TEXT, Optional)

### Key Features

- **Automatic Profile Creation**: When a user signs up, a profile is automatically created via database trigger
- **Row Level Security**: All tables have RLS enabled with appropriate policies
- **Indexes**: Created for performance on common queries (user_name, user_id, created_at, category)

### Security Policies

- **Profiles**: Anyone can view, users can only update their own
- **Recipes**: Anyone can view, authenticated users can create, users can only update/delete their own

## Testing the Setup

After running the migration:

1. **Profile Creation**: Sign up a new user and verify a profile is created automatically
2. **RLS Policies**: Try querying recipes as an unauthenticated user (should work for SELECT)
3. **Create Recipe**: As an authenticated user, try creating a recipe

## Next Steps

After database setup is complete:

1. Install Supabase client library: `npm install @supabase/supabase-js`
2. Create environment variables for Supabase URL and keys
3. Set up Supabase client in your Next.js app
4. Connect the homepage to fetch real recipes from the database
