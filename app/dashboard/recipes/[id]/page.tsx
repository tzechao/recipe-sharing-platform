"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { RecipeDetailSkeleton } from "@/components/RecipeDetailSkeleton";

type Recipe = {
  id: string;
  title: string;
  description: string | null;
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

type Comment = {
  id: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles: {
    user_name: string;
    full_name: string | null;
  } | null;
};

export default function RecipeDetailPage() {
  const params = useParams();
  const recipeId = params.id as string;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function loadRecipe() {
      // Check if user is authenticated
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push("/auth?mode=signin");
        return;
      }

      setUser(currentUser);

      // Fetch recipe first
      const { data: recipeData, error: fetchError } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId)
        .single();

      if (fetchError) {
        console.error("Error fetching recipe:", fetchError);
        setError("Recipe not found or you don't have permission to view it.");
        setIsLoading(false);
        return;
      }

      if (!recipeData) {
        setError("Recipe not found.");
        setIsLoading(false);
        return;
      }

      // Fetch profile for the recipe author
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, user_name, full_name")
        .eq("id", recipeData.user_id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        // Still show recipe even if profile fetch fails
      }

      // Merge recipe with profile data
      const recipeWithProfile = {
        ...recipeData,
        profiles: profileData || null,
      };

      setRecipe(recipeWithProfile);
      // Check if current user is the owner
      setIsOwner(recipeData.user_id === currentUser.id);

      // Fetch likes
      await loadLikes(recipeId, currentUser.id);

      // Fetch comments
      await loadComments(recipeId);

      setIsLoading(false);
    }

    if (recipeId) {
      loadRecipe();
    }
  }, [recipeId, router, supabase]);

  async function loadLikes(recipeId: string, userId: string) {
    console.log("Loading likes for recipe:", recipeId, "user:", userId);
    
    // Fetch all likes for this recipe - RLS policy allows everyone to view
    // This is more reliable than count queries with RLS
    const { data: allLikes, error: likesError } = await supabase
      .from("likes")
      .select("user_id, recipe_id")
      .eq("recipe_id", recipeId);

    if (likesError) {
      console.error("Error fetching likes:", likesError);
      console.error("Error details:", JSON.stringify(likesError, null, 2));
      setLikeCount(0);
      setIsLiked(false);
      return;
    }

    console.log("Fetched likes:", allLikes);
    
    if (allLikes && Array.isArray(allLikes)) {
      // Count total likes
      const count = allLikes.length;
      console.log("Like count:", count);
      setLikeCount(count);
      
      // Check if current user has liked this recipe
      const userLiked = allLikes.some((like) => like.user_id === userId);
      console.log("User liked:", userLiked);
      setIsLiked(userLiked);
    } else {
      console.log("No likes found or invalid data");
      setLikeCount(0);
      setIsLiked(false);
    }
  }

  async function loadComments(recipeId: string) {

    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        *,
        profiles (
          user_name,
          full_name
        )
      `
      )
      .eq("recipe_id", recipeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching comments:", error);
    } else if (data) {
      setComments(data as Comment[]);
    }
  }

  async function handleToggleLike() {
    if (!user || !recipeId || isTogglingLike) return;

    setIsTogglingLike(true);
    setError(null);

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("recipe_id", recipeId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error unliking:", error);
          setError(error.message);
        } else {
          // Reload likes to get accurate count
          await loadLikes(recipeId, user.id);
        }
      } else {
        // Like
        const { error } = await supabase
          .from("likes")
          .insert({ recipe_id: recipeId, user_id: user.id });

        if (error) {
          console.error("Error liking:", error);
          setError(error.message);
        } else {
          // Reload likes to get accurate count
          await loadLikes(recipeId, user.id);
        }
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsTogglingLike(false);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !recipeId || !newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    setError(null);

    try {
      const { error } = await supabase.from("comments").insert({
        recipe_id: recipeId,
        user_id: user.id,
        comment_text: newComment.trim(),
      });

      if (error) {
        setError(error.message);
      } else {
        setNewComment("");
        await loadComments(recipeId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleEditComment(commentId: string, newText: string) {
    if (!newText.trim()) return;

    const { error } = await supabase
      .from("comments")
      .update({ comment_text: newText.trim(), updated_at: new Date().toISOString() })
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) {
      setError(error.message);
    } else {
      setEditingCommentId(null);
      setEditCommentText("");
      await loadComments(recipeId);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) {
      setError(error.message);
    } else {
      await loadComments(recipeId);
    }
  }

  // Parse ingredients from newline-separated string
  const ingredientsList = recipe?.ingredients
    ? recipe.ingredients.split("\n").filter((ing) => ing.trim() !== "")
    : [];

  // Parse instructions from newline-separated string
  const instructionsList = recipe?.instructions
    ? recipe.instructions.split("\n").filter((inst) => inst.trim() !== "")
    : [];

  async function handleDelete() {
    if (!recipe || !isOwner) return;

    setIsDeleting(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipe.id);

      if (deleteError) {
        setError(deleteError.message);
        setIsDeleting(false);
      } else {
        // Success - redirect to dashboard
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsDeleting(false);
    }
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
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <RecipeDetailSkeleton />
        </main>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/dashboard" className="text-2xl font-bold text-orange-600">
                RecipeShare
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-red-600 mb-4">{error || "Recipe not found"}</p>
            <Link
              href="/dashboard"
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              ← Back to Dashboard
            </Link>
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Recipe Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{recipe.title}</h1>
              {recipe.description && (
                <p className="text-lg text-gray-600 mb-4">{recipe.description}</p>
              )}
            </div>
          </div>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-2">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="font-medium">
                {recipe.profiles?.full_name || recipe.profiles?.user_name || "Unknown"}
              </span>
            </div>
            {recipe.cooking_time && (
              <div className="flex items-center gap-2">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{recipe.cooking_time} minutes</span>
              </div>
            )}
            {recipe.difficulty && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                {recipe.difficulty}
              </span>
            )}
            {recipe.category && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                {recipe.category}
              </span>
            )}
          </div>

          {/* Like Button */}
          <div className="mb-6">
            <button
              onClick={handleToggleLike}
              disabled={isTogglingLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isLiked
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <svg
                className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`}
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>{likeCount} {likeCount === 1 ? "Like" : "Likes"}</span>
            </button>
          </div>
        </div>

        {/* Recipe Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ingredients */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ingredients</h2>
            <ul className="space-y-3">
              {ingredientsList.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-1 text-orange-600 font-medium min-w-[24px]">
                    {index + 1}.
                  </span>
                  <span className="text-gray-700">{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
            <ol className="space-y-4">
              {instructionsList.map((instruction, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-1 flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 leading-relaxed">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Recipe Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Created on{" "}
              {new Date(recipe.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            {isOwner && (
              <div className="flex gap-4">
                <Link
                  href={`/dashboard/recipes/${recipe.id}/edit`}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Edit Recipe
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 hover:text-red-700 font-medium"
                  disabled={isDeleting}
                >
                  Delete Recipe
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="mb-8">
            <div className="flex gap-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmittingComment}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start"
              >
                {isSubmittingComment ? "Posting..." : "Post"}
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {comment.profiles?.full_name ||
                          comment.profiles?.user_name ||
                          "Unknown"}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      {comment.updated_at !== comment.created_at && (
                        <span className="text-xs text-gray-400">(edited)</span>
                      )}
                    </div>
                    {(comment.user_id === user?.id || isOwner) && (
                      <div className="flex gap-2">
                        {editingCommentId === comment.id ? (
                          comment.user_id === user?.id ? (
                            <>
                              <button
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditCommentText("");
                                }}
                                className="text-sm text-gray-600 hover:text-gray-900"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() =>
                                  handleEditComment(comment.id, editCommentText)
                                }
                                className="text-sm text-orange-600 hover:text-orange-700"
                              >
                                Save
                              </button>
                            </>
                          ) : null
                        ) : (
                          <>
                            {comment.user_id === user?.id && (
                              <button
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditCommentText(comment.comment_text);
                                }}
                                className="text-sm text-gray-600 hover:text-gray-900"
                              >
                                Edit
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {editingCommentId === comment.id ? (
                    <textarea
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {comment.comment_text}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Delete Recipe?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{recipe.title}"? This action cannot be undone.
              </p>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setError(null);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
