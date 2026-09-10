/**
 * Freshness, expressed relative to now.
 *
 * The MVP does not decay scores by age (docs/PLAN.md §8), so showing how old
 * the evidence is does the work instead — it lets the reader discount stale
 * data themselves.
 */
export function formatRelativeDate(date: Date | null, now: Date = new Date()): string {
  if (!date) return "Never";

  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000);

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "1 month ago" : `${months} months ago`;

  const years = Math.floor(days / 365);
  return years === 1 ? "Over a year ago" : `Over ${years} years ago`;
}

/** True when data is old enough that the reader should be warned. */
export function isStale(date: Date | null, now: Date = new Date()): boolean {
  if (!date) return true;
  return now.getTime() - date.getTime() > 365 * 86_400_000;
}
