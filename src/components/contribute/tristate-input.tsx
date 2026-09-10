"use client";

import { cn } from "@/lib/utils";

interface TristateInputProps {
  label: string;
  hint?: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}

const OPTIONS: { label: string; value: boolean | null }[] = [
  { label: "Yes", value: true },
  { label: "No", value: false },
  { label: "Not sure", value: null },
];

/**
 * Yes / No / Not sure.
 *
 * Three states, not a checkbox, because "unknown" is a real and common answer.
 * A checkbox would silently record "no" for anything a contributor did not
 * check, and the aggregate treats a reported `false` very differently from an
 * absence of information — see docs/PLAN.md §7.
 */
export function TristateInput({ label, hint, value, onChange }: TristateInputProps) {
  return (
    <fieldset>
      <legend className="text-foreground text-sm font-medium">{label}</legend>
      {hint && <p className="text-subtle-foreground mt-0.5 text-xs">{hint}</p>}

      <div className="mt-2 flex gap-2">
        {OPTIONS.map((option) => {
          const selected = value === option.value;

          return (
            <label
              key={option.label}
              className={cn(
                "inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm transition-colors",
                selected
                  ? "border-accent bg-accent text-accent-foreground font-medium"
                  : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
              )}
            >
              <input
                type="radio"
                name={`tristate-${label}`}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
