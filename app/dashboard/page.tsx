"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { RecipeCardSkeleton } from "@/components/RecipeCardSkeleton";

type Recipe = {
  id: string;
  title: string;
  ingredients: string;
  instructions: string;
  cooking_time: number | null;
  difficulty: string | null;
  category: string | null;
  created_at: string;
  profiles: {
    user_name: string;
    full_name: string | null;
  } | null;
};

export default function DashboardPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function loadData() {
      // Check if user is authenticated
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push("/auth?mode=signin");
        return;
      }

      setUser(currentUser);

      // Fetch recipes first
      const { data: recipesData, error: recipesError } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (recipesError) {
        console.error("Error fetching recipes:", recipesError);
        setError(recipesError.message);
        setIsLoading(false);
        return;
      }

      if (!recipesData || recipesData.length === 0) {
        setAllRecipes([]);
        setRecipes([]);
        setIsLoading(false);
        return;
      }

      // Fetch profiles for all recipe authors
      const userIds = [...new Set(recipesData.map((r: any) => r.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_name, full_name")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        // Still show recipes even if profile fetch fails
      }

      // Merge recipes with profile data
      const recipesWithProfiles = recipesData.map((recipe: any) => ({
        ...recipe,
        profiles: profilesData?.find((p) => p.id === recipe.user_id) || null,
      }));

      setAllRecipes(recipesWithProfiles);
      setRecipes(recipesWithProfiles);

      setIsLoading(false);
    }

    loadData();
  }, [router, supabase]);

  // Filter recipes based on search query, difficulty, and category
  useEffect(() => {
    let filtered = [...allRecipes];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((recipe) => {
        // Search in title
        if (recipe.title.toLowerCase().includes(query)) return true;
        
        // Search in description
        if (recipe.description && recipe.description.toLowerCase().includes(query)) return true;
        
        // Search in ingredients
        if (recipe.ingredients.toLowerCase().includes(query)) return true;
        
        // Search in instructions
        if (recipe.instructions.toLowerCase().includes(query)) return true;
        
        // Search in category
        if (recipe.category && recipe.category.toLowerCase().includes(query)) return true;
        
        // Search in difficulty
        if (recipe.difficulty && recipe.difficulty.toLowerCase().includes(query)) return true;
        
        // Search in author name
        if (recipe.profiles) {
          const authorName = (recipe.profiles.full_name || recipe.profiles.user_name || "").toLowerCase();
          if (authorName.includes(query)) return true;
        }
        
        return false;
      });
    }

    // Apply difficulty filter
    if (selectedDifficulty) {
      filtered = filtered.filter((recipe) => 
        recipe.difficulty === selectedDifficulty
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((recipe) => 
        recipe.category === selectedCategory
      );
    }

    setRecipes(filtered);
  }, [searchQuery, selectedDifficulty, selectedCategory, allRecipes]);

  // Get unique categories and difficulties for filter options
  const categories = Array.from(
    new Set(allRecipes.map((r) => r.category).filter(Boolean))
  ).sort();

  const difficulties = Array.from(
    new Set(allRecipes.map((r) => r.difficulty).filter(Boolean))
  ).sort();

  function clearFilters() {
    setSearchQuery("");
    setSelectedDifficulty("");
    setSelectedCategory("");
  }

  const hasActiveFilters = searchQuery || selectedDifficulty || selectedCategory;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link href="/dashboard" className="text-2xl font-bold text-orange-600">
                  RecipeShare
                </Link>
              </div>
              <nav className="flex items-center gap-4">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-11 w-32 bg-gray-200 rounded-lg animate-pulse" />
          </div>

          {/* Search and Filters Skeleton */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-3">
              <div className="h-12 w-full max-w-2xl bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex gap-3">
                <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-10 w-36 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>

          {/* Recipe Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-orange-600">
                RecipeShare
              </Link>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/dashboard/profile"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Profile
              </Link>
              <Link
                href="/dashboard/saved"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Saved
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">
              Discover recipes shared by the community
            </p>
          </div>
          <Link
            href="/dashboard/create"
            className="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors shadow-sm hover:shadow-md"
          >
            Create Recipe
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          {/* Search Bar and Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-3">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-2xl w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes by title, ingredients, author, category..."
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Difficulty Filter */}
              <div className="flex items-center gap-2">
                <label htmlFor="difficulty-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Difficulty:
                </label>
                <select
                  id="difficulty-filter"
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-w-[120px]"
                >
                  <option value="">All</option>
                  {difficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <label htmlFor="category-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Category:
                </label>
                <select
                  id="category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-w-[140px]"
                >
                  <option value="">All</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Results Count */}
          {hasActiveFilters && (
            <p className="text-sm text-gray-600">
              Showing {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
              {searchQuery && ` matching "${searchQuery}"`}
              {selectedDifficulty && ` with difficulty "${selectedDifficulty}"`}
              {selectedCategory && ` in category "${selectedCategory}"`}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              Error loading recipes: {error}
            </p>
          </div>
        )}

        {/* Recipes Grid */}
        {recipes.length === 0 && !isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            {searchQuery ? (
              <>
                <p className="text-gray-600 mb-4">No recipes found matching "{searchQuery}"</p>
                <p className="text-sm text-gray-500 mb-4">
                  Try a different search term or{" "}
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    clear your search
                  </button>
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">No recipes yet.</p>
                <p className="text-sm text-gray-500">
                  Be the first to share a recipe!
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/dashboard/recipes/${recipe.id}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow block"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                    {recipe.title}
                  </h3>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      {recipe.profiles
                        ? recipe.profiles.full_name || recipe.profiles.user_name
                        : "Unknown"}
                    </span>
                    {recipe.cooking_time && (
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {recipe.cooking_time} min
                      </span>
                    )}
                  </div>

                  {recipe.category && (
                    <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded mb-3">
                      {recipe.category}
                    </span>
                  )}

                  {recipe.difficulty && (
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded ml-2 mb-3">
                      {recipe.difficulty}
                    </span>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                      <span className="font-medium">Ingredients:</span>{" "}
                      {recipe.ingredients}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      <span className="font-medium">Instructions:</span>{" "}
                      {recipe.instructions}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
