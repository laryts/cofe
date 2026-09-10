import { messages } from "./messages/en";

/**
 * Single accessor for copy. English-only today; when a second locale lands this
 * becomes a lookup by active locale and nothing at the call sites changes.
 */
export function t() {
  return messages;
}

export { messages };
export type { Messages } from "./messages/en";
