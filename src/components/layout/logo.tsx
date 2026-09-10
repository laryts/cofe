import { cn } from "@/lib/utils";

/**
 * The wordmark. Lowercase always, with the hyphen carrying the join between
 * "co" (cowork) and "fe" (coffee) — so it gets the accent colour.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn("font-display text-foreground text-xl leading-none tracking-tight", className)}
    >
      co<span className="text-accent">-</span>fe
    </span>
  );
}
