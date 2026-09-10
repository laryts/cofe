import { Check, Minus, X } from "lucide-react";

import { FILTER_ICONS } from "@/components/cafe/amenity-icons";
import type { CafeWorkProfile } from "@/domain/cafe";
import { messages } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Amenity facts.
 *
 * Three states, not two. "Unknown" is rendered distinctly from "no", because
 * claiming a café has no restroom when nobody has said either way would be
 * inventing a fact — see docs/PLAN.md §7.
 */
export function WorkProfileGrid({ profile }: { profile: CafeWorkProfile }) {
  const items = [
    { key: "calls", icon: "phone" as const, label: "Calls allowed", value: profile.allowsCalls },
    {
      key: "ac",
      icon: "snowflake" as const,
      label: "Air conditioning",
      value: profile.hasAirConditioning,
    },
    { key: "restroom", icon: "door" as const, label: "Restroom", value: profile.hasRestroom },
  ];

  return (
    <ul className="grid gap-2 sm:grid-cols-3">
      {items.map((item) => {
        const Icon = FILTER_ICONS[item.icon];
        const StateIcon = item.value === true ? Check : item.value === false ? X : Minus;

        return (
          <li
            key={item.key}
            className={cn(
              "border-border bg-surface flex items-center gap-3 rounded-lg border px-3 py-3",
              item.value === null && "opacity-70",
            )}
          >
            <Icon aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />

            <span className="min-w-0 flex-1">
              <span className="text-foreground block truncate text-sm">{item.label}</span>
              <span
                className={cn(
                  "block text-xs",
                  item.value === true && "text-score-high",
                  item.value === false && "text-score-low",
                  item.value === null && "text-subtle-foreground",
                )}
              >
                {item.value === true
                  ? messages.cafe.yes
                  : item.value === false
                    ? messages.cafe.no
                    : messages.cafe.unknown}
              </span>
            </span>

            <StateIcon
              aria-hidden="true"
              className={cn(
                "size-4 shrink-0",
                item.value === true && "text-score-high",
                item.value === false && "text-score-low",
                item.value === null && "text-subtle-foreground",
              )}
            />
          </li>
        );
      })}
    </ul>
  );
}
