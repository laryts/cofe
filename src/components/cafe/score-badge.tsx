import { scoreBand, type Confidence } from "@/domain/scoring";
import { messages } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const BAND_STYLES = {
  high: "text-score-high border-score-high/35 bg-score-high/10",
  mid: "text-score-mid border-score-mid/35 bg-score-mid/10",
  low: "text-score-low border-score-low/35 bg-score-low/10",
  unknown: "text-score-unknown border-border bg-surface-sunken",
} as const;

interface ScoreBadgeProps {
  score: number | null;
  confidence: Confidence;
  size?: "sm" | "lg";
  className?: string;
}

/**
 * The score, as a numeral.
 *
 * Colour is never the only signal — the number and, at large size, the
 * confidence word carry the meaning for anyone who cannot distinguish the hues.
 */
export function ScoreBadge({ score, confidence, size = "sm", className }: ScoreBadgeProps) {
  const band = scoreBand(score);
  const isUnknown = score === null;

  const label = isUnknown
    ? messages.cafe.notEnoughData
    : `Work Friendly Score ${Math.round(score)} out of 100`;

  return (
    <span
      className={cn(
        "numeric inline-flex shrink-0 items-center justify-center rounded-lg border font-medium",
        BAND_STYLES[band],
        size === "lg" ? "h-16 w-16 flex-col gap-0" : "h-9 min-w-9 px-2",
        className,
      )}
      aria-label={label}
      title={isUnknown ? messages.cafe.notEnoughDataHint : undefined}
    >
      {isUnknown ? (
        <span aria-hidden="true" className={size === "lg" ? "text-xl" : "text-sm"}>
          —
        </span>
      ) : (
        <>
          <span className={size === "lg" ? "font-display text-2xl leading-none" : "text-sm"}>
            {Math.round(score)}
          </span>
          {size === "lg" && (
            <span className="mt-0.5 text-[0.6rem] tracking-wide uppercase opacity-70">
              {confidenceShort(confidence)}
            </span>
          )}
        </>
      )}
    </span>
  );
}

function confidenceShort(confidence: Confidence): string {
  switch (confidence) {
    case "high":
      return "solid";
    case "medium":
      return "fair";
    case "low":
      return "thin";
    case "none":
      return "new";
  }
}
