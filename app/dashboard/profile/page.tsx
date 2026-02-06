"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ProfileSkeleton } from "@/components/ProfileSkeleton";

type Profile = {
  id: string;
  user_name: string;
  full_name: string | null;
  bio: string | null;
  created_at: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userName, setUserName] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [recipeCount, setRecipeCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function loadProfile() {
      // Check if user is authenticated
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push("/auth?mode=signin");
        return;
      }

      setUser(currentUser);

      // Fetch user's profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setError("Error loading profile. Please try again.");
      } else if (profileData) {
        setProfile(profileData);
        setUserName(profileData.user_name);
        setFullName(profileData.full_name || "");
        setBio(profileData.bio || "");
      }

      // Fetch recipe count
      const { count, error: countError } = await supabase
        .from("recipes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", currentUser.id);

      if (!countError && count !== null) {
        setRecipeCount(count);
      }

      // Fetch saved (liked) recipe count
      const { count: savedCountVal, error: savedError } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", currentUser.id);

      if (!savedError && savedCountVal !== null) {
        setSavedCount(savedCountVal);
      }

      setIsLoading(false);
    }

    loadProfile();
  }, [router, supabase]);

  async function handleSave() {
    if (!userName.trim()) {
      setError("Username is required.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          user_name: userName.trim(),
          full_name: fullName.trim() || null,
          bio: bio.trim() || null,
        })
        .eq("id", user.id);

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
        // Reload profile data
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profileData) {
          setProfile(profileData);
          setUserName(profileData.user_name);
          setFullName(profileData.full_name || "");
          setBio(profileData.bio || "");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    if (profile) {
      setUserName(profile.user_name);
      setFullName(profile.full_name || "");
      setBio(profile.bio || "");
    }
    setIsEditing(false);
    setError(null);
    setSuccess(null);
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
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <ProfileSkeleton />
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Error loading profile.</div>
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
                Dashboard
              </Link>
              <Link
                href="/dashboard/saved"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Saved
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your profile information</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Profile Stats */}
            <div className="pb-6 border-b border-gray-200">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-sm text-gray-600">Recipes Created</p>
                  <p className="text-2xl font-bold text-gray-900">{recipeCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Saved Recipes</p>
                  <Link
                    href="/dashboard/saved"
                    className="text-2xl font-bold text-orange-600 hover:text-orange-700"
                  >
                    {savedCount}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="user_name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <input
                  id="user_name"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="username"
                  required
                />
              ) : (
                <p className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {profile.user_name}
                </p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Name
              </label>
              {isEditing ? (
                <input
                  id="full_name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Your full name"
                />
              ) : (
                <p className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {profile.full_name || "Not set"}
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Bio
              </label>
              {isEditing ? (
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 min-h-[60px]">
                  {profile.bio || "No bio yet. Click 'Edit Profile' to add one."}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center gap-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="text-gray-600 hover:text-gray-900 px-6 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
