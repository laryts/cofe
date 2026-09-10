import { CafeListSkeleton } from "@/components/cafe/cafe-list";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExploreLoading() {
  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      <div className="border-border border-b px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
          <Skeleton className="h-12 w-full" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-11 w-32 rounded-full" />
            ))}
          </div>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(360px,420px)_1fr]">
        <div className="min-h-0 flex-1 overflow-hidden">
          <CafeListSkeleton />
        </div>
        <Skeleton className="hidden rounded-none lg:block" />
      </div>
    </div>
  );
}
