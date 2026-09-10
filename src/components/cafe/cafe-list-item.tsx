"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";

import { DemoBadge } from "@/components/cafe/demo-badge";
import { ScoreBadge } from "@/components/cafe/score-badge";
import { FILTER_ICONS } from "@/components/cafe/amenity-icons";
import type { CafeSummary } from "@/domain/cafe";
import { formatDistance } from "@/domain/geo";
import { scoreBand, scoreBandLabel } from "@/domain/scoring";
import { cn } from "@/lib/utils";

interface CafeListItemProps {
  cafe: CafeSummary;
  isSelected?: boolean;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
}

/**
 * A row in the café list.
 *
 * A list row rather than a card, per the design direction: the explore view is
 * a list of places, not fourteen floating boxes with shadows.
 */
export function CafeListItem({ cafe, isSelected, onHover, onSelect }: CafeListItemProps) {
  const { profile } = cafe;
  const band = scoreBand(profile.workFriendlyScore);

  return (
    <li
      className={cn(
        "border-border border-b transition-colors",
        isSelected ? "bg-accent-soft/60" : "hover:bg-surface-sunken",
      )}
      onMouseEnter={() => onHover?.(cafe.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <Link
        href={`/cafes/${cafe.slug}`}
        className="flex items-start gap-3 px-4 py-4"
        onFocus={() => onHover?.(cafe.id)}
        onBlur={() => onHover?.(null)}
        onClick={() => onSelect?.(cafe.id)}
      >
        <ScoreBadge score={profile.workFriendlyScore} confidence={profile.confidence} />

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-foreground truncate font-medium">{cafe.name}</span>
            <DemoBadge source={cafe.source} />
          </span>

          <span className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 text-sm">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="truncate">
              {cafe.neighborhood ? `${cafe.neighborhood}, ${cafe.city}` : cafe.city}
            </span>
            {cafe.distanceKm !== null && (
              <span className="numeric text-subtle-foreground">
                · {formatDistance(cafe.distanceKm)}
              </span>
            )}
          </span>

          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span
              className={cn(
                "text-xs font-medium",
                band === "high" && "text-score-high",
                band === "mid" && "text-score-mid",
                band === "low" && "text-score-low",
                band === "unknown" && "text-subtle-foreground",
              )}
            >
              {scoreBandLabel(band)}
            </span>
            <AmenityHints cafe={cafe} />
          </span>
        </span>
      </Link>
    </li>
  );
}

/** Compact confirmed-amenity row. Only ever shows facts someone reported. */
function AmenityHints({ cafe }: { cafe: CafeSummary }) {
  const hints: { key: string; icon: keyof typeof FILTER_ICONS; label: string }[] = [];

  if (cafe.profile.allowsCalls === true) {
    hints.push({ key: "calls", icon: "phone", label: "Calls allowed" });
  }
  if (cafe.profile.hasAirConditioning === true) {
    hints.push({ key: "ac", icon: "snowflake", label: "Air conditioning" });
  }
  if (cafe.profile.hasRestroom === true) {
    hints.push({ key: "restroom", icon: "door", label: "Restroom" });
  }

  if (hints.length === 0) return null;

  return (
    <span className="text-subtle-foreground flex items-center gap-2">
      {hints.map((hint) => {
        const Icon = FILTER_ICONS[hint.icon];
        return (
          <span key={hint.key} title={hint.label}>
            <Icon aria-hidden="true" className="size-3.5" />
            <span className="sr-only">{hint.label}</span>
          </span>
        );
      })}
    </span>
  );
}
