import { Skeleton } from "./ui/skeleton";

export function RecipeFormSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-6">
        {/* Title */}
        <div>
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Description */}
        <div>
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-20 w-full" />
        </div>

        {/* Ingredients */}
        <div>
          <Skeleton className="h-5 w-28 mb-2" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div>
          <Skeleton className="h-5 w-28 mb-2" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>

        {/* Cooking Time and Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Category */}
        <div>
          <Skeleton className="h-5 w-20 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Buttons */}
        <div className="mt-8 flex gap-4">
          <Skeleton className="h-11 w-32" />
          <Skeleton className="h-11 w-24" />
        </div>
      </div>
    </div>
  );
}
