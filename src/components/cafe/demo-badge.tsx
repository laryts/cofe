import { FlaskConical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { CafeSource } from "@/domain/cafe";
import { messages } from "@/lib/i18n";

/**
 * Marks a record as development data.
 *
 * Rendered wherever a seed-sourced café appears. Presenting invented data as
 * though it were real community reporting is the one thing this project
 * genuinely must not do — see docs/PLAN.md §16.
 */
export function DemoBadge({ source }: { source: CafeSource }) {
  if (source !== "seed") return null;

  return (
    <Badge variant="outline" title={messages.demo.tooltip} className="shrink-0">
      <FlaskConical aria-hidden="true" />
      {messages.demo.badge}
    </Badge>
  );
}
