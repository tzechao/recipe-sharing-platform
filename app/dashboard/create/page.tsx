"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { RecipeFormSkeleton } from "@/components/RecipeFormSkeleton";

export default function CreateRecipePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<string[]>(["", "", ""]);
  const [instructions, setInstructions] = useState<string[]>(["", "", ""]);
  const [cookingTime, setCookingTime] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push("/auth?mode=signin");
        return;
      }

      setUser(currentUser);
    }

    checkAuth();
  }, [router, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!title.trim()) {
      setError("Recipe title is required.");
      return;
    }

    const validIngredients = ingredients.filter(ing => ing.trim() !== "");
    if (validIngredients.length === 0) {
      setError("At least one ingredient is required.");
      return;
    }

    const validInstructions = instructions.filter(inst => inst.trim() !== "");
    if (validInstructions.length === 0) {
      setError("At least one instruction step is required.");
      return;
    }

    if (cookingTime && (isNaN(parseInt(cookingTime)) || parseInt(cookingTime) < 1)) {
      setError("Cooking time must be a positive number.");
      return;
    }

    if (!user) {
      setError("You must be logged in to create a recipe.");
      return;
    }

    setIsLoading(true);

    try {
      // Get user's profile to get the user_id
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        setError("Error fetching your profile. Please try again.");
        setIsLoading(false);
        return;
      }

      // Combine ingredients array into a string (one per line)
      const ingredientsString = ingredients
        .filter(ing => ing.trim() !== "")
        .map(ing => ing.trim())
        .join("\n");

      // Combine instructions array into a string (one per line)
      const instructionsString = instructions
        .filter(inst => inst.trim() !== "")
        .map(inst => inst.trim())
        .join("\n");

      // Insert the recipe
      const { error: insertError } = await supabase.from("recipes").insert({
        user_id: profile.id,
        title: title.trim(),
        description: description.trim() || null,
        ingredients: ingredientsString,
        instructions: instructionsString,
        cooking_time: cookingTime ? parseInt(cookingTime) : null,
        difficulty: difficulty || null,
        category: category.trim() || null,
      });

      if (insertError) {
        setError(insertError.message);
      } else {
        setSuccess(true);
        // Redirect to dashboard after a brief delay to show success message
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!user) {
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
                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="h-9 w-64 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-5 w-80 bg-gray-200 rounded animate-pulse" />
          </div>
          <RecipeFormSkeleton />
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
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Back to Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Recipe</h1>
          <p className="text-gray-600">
            Share your favorite recipe with the community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                Recipe created successfully! Redirecting to dashboard...
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Recipe Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Classic Chocolate Chip Cookies"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="A brief description of your recipe. What makes it special? What's the story behind it?"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional: Share what makes this recipe special or any helpful context
              </p>
            </div>

            {/* Ingredients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingredients <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) => {
                        const newIngredients = [...ingredients];
                        newIngredients[index] = e.target.value;
                        setIngredients(newIngredients);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder={`Ingredient ${index + 1} (e.g., 2 cups flour)`}
                    />
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newIngredients = ingredients.filter((_, i) => i !== index);
                          setIngredients(newIngredients);
                        }}
                        className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                        aria-label="Remove ingredient"
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
                ))}
                <button
                  type="button"
                  onClick={() => setIngredients([...ingredients, ""])}
                  className="mt-2 px-4 py-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border border-orange-200 rounded-lg transition-colors text-sm font-medium"
                >
                  + Add Ingredient
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Include quantities and measurements for each ingredient
              </p>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="mt-2.5 text-sm font-medium text-gray-500 min-w-[30px]">
                        {index + 1}.
                      </span>
                      <input
                        type="text"
                        value={instruction}
                        onChange={(e) => {
                          const newInstructions = [...instructions];
                          newInstructions[index] = e.target.value;
                          setInstructions(newInstructions);
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder={`Step ${index + 1} (e.g., Preheat oven to 350°F)`}
                      />
                    </div>
                    {instructions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newInstructions = instructions.filter((_, i) => i !== index);
                          setInstructions(newInstructions);
                        }}
                        className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                        aria-label="Remove step"
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
                ))}
                <button
                  type="button"
                  onClick={() => setInstructions([...instructions, ""])}
                  className="mt-2 px-4 py-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border border-orange-200 rounded-lg transition-colors text-sm font-medium"
                >
                  + Add Step
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Write clear, numbered steps that are easy to follow
              </p>
            </div>

            {/* Cooking Time and Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="cooking_time"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Cooking Time (minutes)
                </label>
                <input
                  id="cooking_time"
                  type="number"
                  min="1"
                  value={cookingTime}
                  onChange={(e) => setCookingTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="30"
                />
              </div>
              <div>
                <label
                  htmlFor="difficulty"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select difficulty</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select a category (optional)</option>
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Dessert">Dessert</option>
                <option value="Snack">Snack</option>
                <option value="Appetizer">Appetizer</option>
                <option value="Beverage">Beverage</option>
                <option value="Other">Other</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Help others find your recipe by categorizing it
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex items-center gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Creating..." : "Create Recipe"}
            </button>
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
