import { cn } from "@/lib/utils";

/** Shimmering placeholder. Always give it a size that matches the real content. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("shimmer rounded-md", className)} aria-hidden="true" {...props} />;
}
