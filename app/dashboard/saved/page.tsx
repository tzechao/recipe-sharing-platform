"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { RecipeCardSkeleton } from "@/components/RecipeCardSkeleton";

type Recipe = {
  id: string;
  title: string;
  description?: string | null;
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

export default function SavedPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function loadSavedRecipes() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push("/auth?mode=signin");
        return;
      }

      // Fetch user's liked recipe IDs (ordered by most recently liked)
      const { data: likesData, error: likesError } = await supabase
        .from("likes")
        .select("recipe_id, created_at")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (likesError) {
        console.error("Error fetching likes:", likesError);
        setError("Error loading saved recipes.");
        setIsLoading(false);
        return;
      }

      if (!likesData || likesData.length === 0) {
        setRecipes([]);
        setIsLoading(false);
        return;
      }

      const recipeIds = likesData.map((l) => l.recipe_id);

      // Fetch recipes
      const { data: recipesData, error: recipesError } = await supabase
        .from("recipes")
        .select("*")
        .in("id", recipeIds);

      if (recipesError) {
        console.error("Error fetching recipes:", recipesError);
        setError("Error loading saved recipes.");
        setIsLoading(false);
        return;
      }

      if (!recipesData || recipesData.length === 0) {
        setRecipes([]);
        setIsLoading(false);
        return;
      }

      // Preserve order from likes (most recently liked first)
      const recipeMap = new Map(recipesData.map((r) => [r.id, r]));
      const orderedRecipes = recipeIds
        .map((id) => recipeMap.get(id))
        .filter(Boolean) as typeof recipesData;

      // Fetch profiles for recipe authors
      const userIds = [...new Set(orderedRecipes.map((r) => r.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, user_name, full_name")
        .in("id", userIds);

      const recipesWithProfiles = orderedRecipes.map((recipe) => ({
        ...recipe,
        profiles: profilesData?.find((p) => p.id === recipe.user_id) || null,
      }));

      setRecipes(recipesWithProfiles);
      setIsLoading(false);
    }

    loadSavedRecipes();
  }, [router, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
          </div>

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
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/profile"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Profile
              </Link>
              <Link
                href="/dashboard/saved"
                className="text-orange-600 hover:text-orange-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Saved
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push("/");
                }}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Recipes</h1>
          <p className="text-gray-600">
            Recipes you&apos;ve liked — {recipes.length}{" "}
            {recipes.length === 1 ? "recipe" : "recipes"} saved
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {recipes.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 mb-4">No saved recipes yet.</p>
            <p className="text-sm text-gray-500 mb-4">
              Like recipes from the dashboard to save them here.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              Browse Recipes
            </Link>
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
