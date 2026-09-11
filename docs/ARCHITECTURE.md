# Architecture

How co-fe is put together, and where to add things.

For *why* these choices were made, see [PLAN.md](PLAN.md). This document is the practical map.

---

## Shape

One Next.js application, partitioned by layer, with a dependency rule enforced by lint. Not
microservices, not a monorepo, no repository interfaces with a single implementation.

```
src/
├── app/                    Next.js App Router — routing, RSC, route handlers
│   ├── explore/            map + list experience
│   ├── cafes/[slug]/       cafe detail (the SEO surface)
│   ├── score/              how the score works
│   ├── contribute/         contribution routes
│   └── api/v1/             public-shaped HTTP API
│
├── components/             presentational React — no data fetching, no business rules
│   ├── ui/                 primitives (button, input, badge, sheet, skeleton)
│   ├── cafe/               cafe-specific composites
│   ├── map/                MapLibre wrapper
│   └── layout/             header, footer, logo
│
├── domain/                 ★ pure TypeScript. No React, no DB, no I/O.
│   ├── cafe/               entities, filter definitions
│   ├── scoring/            the Work Friendly Score
│   └── geo/                coordinates, bounding boxes, haversine
│
├── server/                 everything that touches the outside world
│   ├── db/                 drizzle schema, client, migrations, seed, aggregation
│   ├── repositories/       SQL lives here and nowhere else
│   ├── services/           use cases; orchestrate repositories + domain
│   └── integrations/       third-party calls, each behind one module
│
├── hooks/                  client-side React hooks
└── lib/                    env parsing, formatting, i18n messages, utils
```

## The dependency rule

```
app ──▶ server/services ──▶ server/repositories ──▶ server/db
 │              │                     │
 └──────────────┴─────────────────────┴──────────▶ domain  (leaf: imports nothing above)
components ────────────────────────────────────▶ domain
```

Three invariants, enforced by `no-restricted-imports` in `eslint.config.mjs` rather than trusted to
discipline:

| Rule | Why |
| --- | --- |
| `domain/` imports nothing from `app/`, `server/`, `components/`, React or Next | Keeps business rules reusable by the API, tests and a future mobile client, and unit-testable without booting a framework |
| `components/` never imports `server/` | UI receives data as props; fetching belongs in a Server Component |
| `app/` never imports `server/repositories` or `server/db` | Use cases stay reusable and testable outside the request lifecycle |

Violating one is a lint error with an explanatory message, not a code-review conversation.

## Where things live

| I want to… | Go to |
| --- | --- |
| Change how the score is calculated | `src/domain/scoring/score.ts` |
| Change the score weights or thresholds | `src/domain/scoring/weights.ts` |
| Add or change a filter | `src/domain/cafe/filters.ts`, then `filterConditions()` in the repository |
| Change how "nearby" is computed | `src/server/repositories/cafe-repository.ts` + `src/domain/geo/` |
| Add a database column | `src/server/db/schema.ts`, then `pnpm db:generate` |
| Add an API endpoint | `src/app/api/v1/…/route.ts` + a service function |
| Change user-facing copy | `src/lib/i18n/messages/en.ts` — never inline in JSX |
| Change colours, spacing or type | `src/app/globals.css` (design tokens) |
| Add demo cafés | `src/server/db/seed/data.ts` |
| Change what a contributor may submit | `src/domain/cafe/submission.ts` |
| Change moderation behaviour | `src/server/services/submission-service.ts` |
| Change who may do what | `src/domain/auth/permissions.ts` |
| Work offline (no tile host) | Set `NEXT_PUBLIC_MAP_STYLE_URL=/dev-map-style.json` |

## Data flow

### Reading

```
Server Component  ──▶  service  ──▶  repository  ──▶  Postgres
      │                   │              │
      │                   │              └── bounding box + haversine
      │                   └── Zod validation of inputs
      └── passes DTOs down to presentational components as props
```

The web UI calls services in-process from React Server Components rather than going over HTTP to its
own API. That is a performance detail, not an architectural one — `/api/v1` serves the identical
DTOs, which is what makes the future mobile client a real plan rather than an aspiration.

### Writing (V1, not in the MVP)

```
report insert  ──▶  recomputeWorkProfile()  ──▶  cafe_work_profiles
                          │
                          └── domain/scoring (pure)
```

## The scoring model

`src/domain/scoring/` is pure, dependency-free and the most heavily tested module in the codebase,
because it is the one thing users have to trust.

Three properties worth preserving if you change it:

1. **Explainable.** The per-dimension contributions must sum to the headline number, so a reader can
   check it by hand. `/score` imports its constants from this module, so the published method cannot
   drift from the implementation.
2. **Shrunk.** Thin evidence is pulled toward a neutral prior. One 5★ report yields 62.5, not 100.
3. **Honest about uncertainty.** Confidence is reported separately, never folded into the number, and
   below `MIN_REPORTS_FOR_SCORE` no score is published at all.

## Database design

**Reports are the source of truth; work profiles are derived.**

```
cafe_reports          append-only, immutable, soft-deleted via retracted_at
      │
      │  aggregated: shrunk mean per dimension + majority vote per amenity
      ▼
cafe_work_profiles    derived cache, recomputed in the same transaction
      │
      ▼
cafes                 the place itself
```

`cafe_work_profiles` is the one place normalisation is deliberately broken. The justification is
concrete: the map view needs score plus amenity booleans for ~100 cafés in a single indexed query,
and computing that from the report log per request would mean aggregating over every report in the
viewport on every pan. Because it is recomputed in the same transaction as a report insert, it cannot
drift.

The append-only log means history, provenance and a moderation hook need no additional tables.

### Contribution and moderation

```
/add  ──▶  POST /api/v1/cafes  ──▶  status: pending   (invisible, unscored)
                                          │
                                    /moderate  ──▶  approve  ──▶  published + recompute
                                                └─▶  reject   ──▶  hidden, kept for the record
```

Three rules hold this together, and breaking any one of them breaks the safety of an open form:

1. **Pending is invisible and inert.** Read queries filter on `status = 'published'`, and the score
   aggregation counts only published reports. A pending submission must never move a number.
2. **Server Actions re-check authorisation.** The page gates rendering, but an action is a public
   endpoint — anyone can invoke it directly. Every moderation action calls `requireModerator()`
   itself; a hidden button is not an access control.
3. **Moderation fails closed.** With Clerk unconfigured every visitor is anonymous, so the queue is
   unavailable rather than open — and the rest of the app keeps working, because neither browsing
   nor contributing needs an account.

Where things live: `domain/cafe/submission.ts` (what may be submitted), `domain/auth/permissions.ts`
(who may do what), `server/services/submission-service.ts` (submit, approve, reject),
`server/auth.ts` (the Clerk bridge), `server/rate-limit.ts`, `app/add/`, `app/moderate/`.

### Identity vs. authorisation

```
Clerk            ──▶  "who is this person"   (sign-in, email, sessions)
users table      ──▶  "what may they do"     (role: user | moderator | admin)
domain/auth      ──▶  the rules, as pure testable functions
```

Roles are stored in our own database rather than in Clerk metadata. That keeps authorisation
testable without a network call, and means changing auth provider would not take the permission
model with it. `src/proxy.ts` attaches the session and nothing more — every privileged surface
checks `canModerate` where the work happens, because a route matcher is easy to get subtly wrong.

Clerk is optional at the deployment level: with no publishable key the proxy passes requests
straight through, `ClerkProvider` is not mounted, and the app runs with accounts disabled.

### Connecting lazily

`src/server/db/client.ts` defers connection setup to the first query rather than
creating it at module scope. This is load-bearing, not a micro-optimisation:
Next.js imports **every route module** while collecting page data during
`next build`, so a client constructed at import time throws whenever
`DATABASE_URL` is absent — the normal state of a preview or CI environment.
Wrapping call sites in `try`/`catch` does not help, because the failure happens
at import time, before any of that code runs.

CI builds once with a database and once without, so this cannot regress.

If you add a module that touches the database, keep the work inside functions.
Module-level side effects that need configuration will break the build.

### Geospatial

No PostGIS. `latitude` and `longitude` are plain columns behind a composite index. A query for
"cafés within N km" becomes:

1. Compute a bounding box that fully contains the circle (`domain/geo`)
2. Let Postgres narrow to the box using `cafes_lat_lng_idx` — this is the indexable part
3. Filter and order the survivors by exact haversine distance

This runs on any stock Postgres, which keeps contributor setup to one command. The upgrade ladder —
`cube`/`earthdistance`, then PostGIS `geography` — is documented in [PLAN.md §9](PLAN.md#9-map-geo-and-data-sources)
and is confined to the repository plus `domain/geo`.

## Frontend conventions

- **URL is the state.** Filters, search and map centre live in the query string, so every view is
  shareable and the back button behaves. See `src/hooks/use-explore-state.ts`.
- **Server Components by default.** `"use client"` only where interaction genuinely requires it.
- **The map is dynamically imported.** MapLibre touches `window` at import time and is large; it must
  never block first paint.
- **No client data-fetching library.** Filtering navigates, which re-runs the server query. There is
  no second copy of filtering logic in the browser and no cache to invalidate.
- **Copy lives in `lib/i18n`.** English-only for now, but no strings inlined in JSX.

## Accessibility

Requirements, not aspirations:

- Map markers are real `<button>` elements with a 44×44px hit area, so they are focusable
- **The list is a peer of the map, not a fallback** — a canvas is inaccessible to screen readers
- Filter results are announced via a live region, so toggling a filter is perceivable
- All interactive targets ≥44px; visible keyboard focus rings; WCAG AA contrast
- `prefers-reduced-motion` respected globally

## Testing

`pnpm test` runs Vitest over `src/**/*.test.ts`.

The domain layer is pure, so it is tested directly with no mocks, no database and no React. That is
the main practical payoff of the dependency rule. Scoring has the deepest coverage: zero reports, one
report, missing dimensions, out-of-range values, and the ranking properties that must hold (a
well-evidenced good café must outrank a single rave review).

## Adding a feature: worked example

*"Show whether a café has outdoor seating."*

1. **Schema** — add `has_outdoor_seating` to `cafeReports` and `cafeWorkProfiles`; `pnpm db:generate`
2. **Aggregation** — add it to the majority vote in `profile-aggregation.ts`
3. **Domain** — add it to `CafeAmenities`, and a filter definition in `filters.ts`
4. **Repository** — add the filter condition
5. **API** — add the field to the DTOs
6. **UI** — add it to `WorkProfileGrid`, and a label to `lib/i18n/messages/en.ts`
7. **Seed** — add values to the demo data
8. `pnpm check`

Note what did *not* happen: no new abstraction, no new layer, and the scoring model was untouched —
because outdoor seating is an amenity, not a measure of work-friendliness.
