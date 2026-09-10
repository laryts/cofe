import type { DimensionBreakdown } from "@/domain/scoring";
import { DIMENSION_LABELS } from "@/domain/scoring";
import { messages } from "@/lib/i18n";

/**
 * The full arithmetic behind a café's score.
 *
 * ★ This is the explainability guarantee made in docs/PLAN.md §8: every
 * dimension's score, its weight, how many reports back it, and the points it
 * contributed. The Points column sums to the headline number, so a sceptical
 * reader can check the total by hand.
 */
export function ScoreBreakdown({
  breakdown,
  total,
}: {
  breakdown: readonly DimensionBreakdown[];
  total: number | null;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[26rem] border-collapse text-sm">
        <caption className="sr-only">
          Work Friendly Score breakdown by dimension, showing weight, rating count and points
          contributed.
        </caption>
        <thead>
          <tr className="text-muted-foreground border-border border-b text-left">
            <th scope="col" className="py-2 pr-4 font-medium">
              Dimension
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">
              Rating
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">
              {messages.cafe.weight}
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              {messages.cafe.contribution}
            </th>
          </tr>
        </thead>

        <tbody>
          {breakdown.map((entry) => (
            <tr key={entry.dimension} className="border-border border-b last:border-b-0">
              <th scope="row" className="text-foreground py-3 pr-4 text-left font-normal">
                {DIMENSION_LABELS[entry.dimension]}
                <span className="text-subtle-foreground numeric ml-2 text-xs">
                  {entry.ratingCount > 0
                    ? messages.cafe.reportCount(entry.ratingCount)
                    : messages.cafe.noRating}
                </span>
              </th>

              <td className="numeric text-foreground py-3 pr-4 text-right">
                {entry.score === null ? (
                  <span className="text-subtle-foreground">—</span>
                ) : (
                  Math.round(entry.score)
                )}
              </td>

              <td className="numeric text-muted-foreground py-3 pr-4 text-right">
                {entry.weight}%
              </td>

              <td className="numeric text-foreground py-3 text-right font-medium">
                {entry.contribution > 0 ? entry.contribution.toFixed(1) : "—"}
              </td>
            </tr>
          ))}
        </tbody>

        {total !== null && (
          <tfoot>
            <tr className="border-border border-t-2">
              <th scope="row" className="text-foreground py-3 pr-4 text-left font-medium">
                Work Friendly Score
              </th>
              <td />
              <td />
              <td className="numeric font-display text-foreground py-3 text-right text-lg">
                {total.toFixed(1)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
