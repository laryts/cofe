import { Skeleton } from "@/components/ui/skeleton";

/**
 * Café detail skeleton.
 *
 * Shapes and sizes mirror the real page — score badge, heading, breakdown rows,
 * amenity tiles — so the layout does not jump when content arrives. A generic
 * spinner would be less work and a worse experience: this one tells you what is
 * about to appear.
 */
export default function CafeLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6" aria-busy="true">
      <span className="sr-only">Loading café details</span>

      <Skeleton className="h-4 w-32" />

      <div className="mt-6 flex items-start gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-9 w-3/5" />
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <Skeleton className="size-16 shrink-0 rounded-lg" />
      </div>

      <Skeleton className="mt-6 h-6 w-48" />
      <Skeleton className="mt-2 h-4 w-64" />

      {/* Score breakdown: header row plus five dimensions. */}
      <Skeleton className="mt-10 h-3 w-24" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-4">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-10 h-3 w-24" />
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-14 rounded-lg" />
        ))}
      </div>

      <Skeleton className="mt-10 h-3 w-24" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
