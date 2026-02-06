import { Skeleton } from "./ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="pb-6 border-b border-gray-200">
          <div className="flex items-center gap-6">
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
            <div>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-5 w-40" />
            </div>
          </div>
        </div>

        {/* Fields Skeleton */}
        <div className="space-y-6">
          <div>
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-5 w-20 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-5 w-12 mb-2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>

        {/* Button Skeleton */}
        <div className="pt-4">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
