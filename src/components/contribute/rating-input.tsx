"use client";

import { X } from "lucide-react";

import {
  DIMENSION_DESCRIPTIONS,
  DIMENSION_LABELS,
  MAX_RATING,
  MIN_RATING,
  RATING_ANCHORS,
  type ScoredDimension,
} from "@/domain/scoring";
import { cn } from "@/lib/utils";

interface RatingInputProps {
  dimension: ScoredDimension;
  value: number | null;
  onChange: (value: number | null) => void;
}

const LEVELS = Array.from(
  { length: MAX_RATING - MIN_RATING + 1 },
  (_, index) => MIN_RATING + index,
);

/**
 * A single 1–5 rating.
 *
 * Radio semantics via a labelled group rather than stars. Two reasons: stars
 * invite wildly inconsistent scoring, which is why every level here carries the
 * written anchor from the scoring model; and a star widget is difficult to
 * operate with a keyboard or a screen reader, while radios are understood by
 * everything for free.
 *
 * Leaving it blank is a first-class answer — the model handles gaps properly,
 * and an honest gap beats a guess. That is why "clear" is visible rather than
 * hidden behind a reset.
 */
export function RatingInput({ dimension, value, onChange }: RatingInputProps) {
  const anchors = RATING_ANCHORS[dimension];
  const groupId = `rating-${dimension}`;

  return (
    <fieldset className="border-border border-t pt-5">
      <legend className="sr-only">{DIMENSION_LABELS[dimension]}</legend>

      <div className="flex items-baseline justify-between gap-3">
        <p className="text-foreground font-medium" id={`${groupId}-label`}>
          {DIMENSION_LABELS[dimension]}
        </p>

        {value !== null && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-subtle-foreground hover:text-foreground -mr-1 inline-flex min-h-11 items-center gap-1 px-1 text-xs"
          >
            <X aria-hidden="true" className="size-3.5" />
            Clear
          </button>
        )}
      </div>

      <p className="text-subtle-foreground mt-1 text-sm">{DIMENSION_DESCRIPTIONS[dimension]}</p>

      <div
        role="radiogroup"
        aria-labelledby={`${groupId}-label`}
        className="mt-3 flex flex-col gap-1.5"
      >
        {LEVELS.map((level) => {
          const selected = value === level;

          return (
            <label
              key={level}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
                selected
                  ? "border-accent bg-accent-soft text-foreground"
                  : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
              )}
            >
              <input
                type="radio"
                name={groupId}
                value={level}
                checked={selected}
                onChange={() => onChange(level)}
                className="sr-only"
              />

              <span
                aria-hidden="true"
                className={cn(
                  "numeric flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                  selected
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border-strong",
                )}
              >
                {level}
              </span>

              <span className="text-pretty">{anchors[level]}</span>
            </label>
          );
        })}
      </div>

      {value === null && (
        <p className="text-subtle-foreground mt-2 text-xs">
          Not sure? Leave it blank — blanks are handled properly and never count against a café.
        </p>
      )}
    </fieldset>
  );
}
