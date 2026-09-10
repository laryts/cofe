import {
  Clock,
  DoorOpen,
  Laptop,
  Phone,
  Plug,
  Snowflake,
  Volume2,
  Wifi,
  type LucideIcon,
} from "lucide-react";

import type { CafeFilterDefinition } from "@/domain/cafe";

/** Single mapping from the domain's icon names to concrete components. */
export const FILTER_ICONS: Record<CafeFilterDefinition["icon"], LucideIcon> = {
  wifi: Wifi,
  plug: Plug,
  volume: Volume2,
  laptop: Laptop,
  clock: Clock,
  phone: Phone,
  snowflake: Snowflake,
  door: DoorOpen,
};
