import Image from "next/image";

// Placeholder data - will be replaced with Supabase data later
const placeholderRecipes = [
  {
    id: "1",
    title: "Classic Chocolate Chip Cookies",
    author: "Sarah Chen",
    prepTime: 15,
    cookTime: 12,
    image: "/next.svg", // Placeholder - will use recipe photos later
  },
  {
    id: "2",
    title: "Mediterranean Quinoa Bowl",
    author: "Marcus Johnson",
    prepTime: 20,
    cookTime: 25,
    image: "/next.svg",
  },
  {
    id: "3",
    title: "Spicy Thai Green Curry",
    author: "Priya Patel",
    prepTime: 30,
    cookTime: 20,
    image: "/next.svg",
  },
  {
    id: "4",
    title: "Homemade Margherita Pizza",
    author: "Luca Rossi",
    prepTime: 45,
    cookTime: 15,
    image: "/next.svg",
  },
  {
    id: "5",
    title: "Avocado Toast Deluxe",
    author: "Emma Wilson",
    prepTime: 10,
    cookTime: 5,
    image: "/next.svg",
  },
  {
    id: "6",
    title: "Beef Stir Fry with Vegetables",
    author: "David Kim",
    prepTime: 25,
    cookTime: 15,
    image: "/next.svg",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-orange-600">RecipeShare</h1>
            </div>
            <nav className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Sign In
              </button>
              <button className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors">
                Sign Up
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Discover Amazing Recipes
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Share your favorite recipes and explore culinary creations from home cooks around the world
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search recipes, ingredients, or tags..."
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
            </div>
          </div>

          {/* Filters */}
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                All Recipes
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                Quick (&lt; 30 min)
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                Vegetarian
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                Vegan
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                Dessert
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                Dinner
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Recipe Feed */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-gray-900">Recent Recipes</h3>
        </div>

        {/* Recipe Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {placeholderRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Recipe Image */}
              <div className="relative h-48 bg-gray-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Recipe Photo</span>
                </div>
              </div>

              {/* Recipe Info */}
              <div className="p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {recipe.title}
                </h4>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
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
                    {recipe.author}
                  </span>
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
                    {recipe.prepTime + recipe.cookTime} min
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex-1 bg-orange-50 text-orange-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-100 transition-colors">
                    View Recipe
                  </button>
                  <button className="p-2 text-gray-400 hover:text-orange-600 transition-colors">
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
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        <div className="mt-8 text-center">
          <button className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Load More Recipes
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 text-sm">
            <p>© 2024 RecipeShare. Share your culinary journey with the world.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
