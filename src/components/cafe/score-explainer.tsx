import {
  DIMENSION_DESCRIPTIONS,
  DIMENSION_LABELS,
  DIMENSION_WEIGHTS,
  SCORED_DIMENSIONS,
} from "@/domain/scoring";
import { cn } from "@/lib/utils";

/**
 * The weights, shown as a proportional bar per dimension.
 *
 * Deliberately not a pie or donut: the point is comparing five magnitudes, and
 * aligned bars do that far better than angles do.
 */
export function ScoreWeights({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-col gap-3", className)}>
      {SCORED_DIMENSIONS.map((dimension) => {
        const weight = DIMENSION_WEIGHTS[dimension];

        return (
          <li key={dimension} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-foreground text-sm font-medium">
                {DIMENSION_LABELS[dimension]}
              </span>
              <span className="numeric text-muted-foreground text-sm">{weight}%</span>
            </div>

            <div className="bg-surface-sunken h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-accent h-full rounded-full"
                style={{ width: `${weight}%` }}
                aria-hidden="true"
              />
            </div>

            <p className="text-subtle-foreground text-xs">{DIMENSION_DESCRIPTIONS[dimension]}</p>
          </li>
        );
      })}
    </ul>
  );
}
