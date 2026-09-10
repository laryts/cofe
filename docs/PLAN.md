# co-fe — Product & Engineering Plan

> Status: **living document**. Written before implementation started; §17 records what was actually
> built. Last revised: 2026-09-10.

---

## 1. Product overview

**co-fe** is an open source map for finding cafés where you can *actually* work.

The name joins **co**work with cof**fe**e. It is always written lowercase in the interface: `co-fe`.

It is not a café review site and not a Google Maps clone. Ratings for espresso quality, ambience or
service are already well covered elsewhere. co-fe adds a single missing layer: **the practical
conditions that decide whether you can open a laptop, sit down and get something done.**

The product exists to answer one question, fast:

> *"Where near me can I comfortably work right now?"*

---

## 2. Problem

Remote and hybrid work made the café a default workplace, but cafés were never designed to be one,
and they vary enormously in how well they serve that use:

- Wi-Fi ranges from fibre to captive-portal-that-drops-every-10-minutes.
- Power outlets may be plentiful, hidden behind a sofa, or deliberately taped over.
- Tables can be a proper desk height or a 30cm round marble disc that fits one cup.
- Noise ranges from library-quiet to a grinder running beside a speaker playing techno.
- Some cafés genuinely welcome people staying three hours. Some want the table back in twenty minutes.
- Whether you can take a video call without being glared at is almost never stated anywhere.

None of this information is discoverable before you arrive. You find out after you have bought a
coffee, sat down, and opened your laptop. The cost of a bad guess is a wasted hour and a wasted trip.

Existing sources do not solve it:

- **Google/Apple Maps** optimise for "is this a good café", not "can I work here". Attributes like
  "Good for working on laptop" exist inconsistently and are not filterable in a useful way.
- **OpenStreetMap** has `internet_access` tags but coverage is thin and there is no notion of
  seating comfort, noise, or long-stay tolerance.
- **Word of mouth / Reddit threads / Notion docs** are unstructured, city-specific, and go stale.

The gap is a *structured, filterable, explainable* dataset about work conditions — and a community
willing to maintain it. That is what co-fe is.

---

## 3. Target users

co-fe is explicitly **not** a developer tool. The shared trait is "needs a table, power and a few
uninterrupted hours", not "writes code".

**Primary**

- Remote and hybrid workers escaping the home desk
- Freelancers and consultants without a fixed office
- Students studying outside campus/library hours

**Also served**

- Designers, writers, researchers, translators
- Founders and small teams doing informal working sessions
- People between meetings needing a quiet 45 minutes and a socket
- Travellers and digital nomads in an unfamiliar city — the highest-stakes case, since they have
  zero local knowledge to fall back on

**Contributors** (a distinct audience with distinct needs)

- People who already know their neighbourhood's cafés and want the knowledge to exist somewhere
- Developers who want to contribute code to a small, well-scoped, well-documented OSS project

Design consequence: language stays plain. "Wi-Fi", "power outlets", "noise" — never "connectivity
SLA" or "workspace telemetry". A student should read the café page as easily as a staff engineer.

---

## 4. MVP

The guiding constraint: **the MVP is small, and it must actually run and be useful.** A beautiful
architecture with no working screen is a failure.

### In scope

| # | Capability | Notes |
|---|---|---|
| 1 | **Discovery by location** | Browser geolocation, with graceful fallback to search |
| 2 | **Location search** | Free-text: neighbourhood, city, address ("Vila Mariana", "Lisbon") |
| 3 | **Map + list, side by side** | Synchronised; hovering/selecting in one highlights the other |
| 4 | **Work-condition filters** | Wi-Fi, outlets, calls, quiet, laptop-friendly tables, long stay, A/C, restroom |
| 5 | **Café detail page** | Full work profile, opening hours, community notes, data freshness |
| 6 | **Work Friendly Score** | Computed, **explainable**, with an honest confidence signal |
| 7 | **Score explanation** | A dedicated page + inline breakdown; no black boxes |
| 8 | **Contribute pathway** | Structured GitHub issue template — see the decision below |
| 9 | **Demo dataset** | Seed data, unmistakably labelled as demo, never presented as real |

### Explicitly out of scope for MVP

| Not building | Why |
|---|---|
| **User accounts / auth** | Nothing in the MVP read path needs identity. Adding auth now costs days and buys nothing yet. |
| **In-app review submission** | See "The contribution decision" below — this is the one deliberately contrarian call in this plan. |
| **Moderation tooling** | Follows auth. Without in-app writes there is nothing to moderate. |
| **Photos / uploads** | Storage, moderation, EXIF-stripping, copyright. Large surface, small MVP payoff. |
| **Check-ins, occupancy, "people here now"** | Requires a user base that does not exist yet. Cold-start death. |
| **Favourites, badges, gamification, profiles** | All depend on auth. All are retention features for a product with no users yet. |
| **Automated OSM import** | Needs a dedupe/conflation strategy and licence review first. See §9. |
| **i18n** | English-only copy, but **no hardcoded strings in JSX** — all UI text lives in a message module so translation is a swap, not a rewrite. |
| **Native mobile app** | The API boundary is built now; the Expo client comes later. |
| **AI anything** | Explicitly excluded from scoring. A score you cannot audit is a score nobody trusts. |

### The contribution decision (needs your attention)

The brief lists *"I want to contribute information about a café"* as a user story, and makes Phase 6
conditional on whether contributions stay in the MVP. **My recommendation: ship the contribution
*pathway* in the MVP, but not an in-app write form.**

Reasoning:

1. An unauthenticated public write endpoint is a spam magnet from day one. The realistic minimum to
   ship it safely is auth + rate limiting + a moderation queue + an admin UI. That is comfortably
   larger than the entire rest of the MVP, and it would push the core experience weeks out.
2. This is an open source project. The community that shows up first are people comfortable with
   GitHub. A **structured issue template** ("Add a café" / "Update café data") captures exactly the
   same fields, gets human review for free, produces a public audit trail, and costs one YAML file.
3. Every schema, aggregation path and provenance field needed for real contributions **is built in
   the MVP** — `cafe_reports` is a real append-only table, the aggregation is real, `source`
   distinguishes seed/import/community. Turning on in-app writes in V1 is then an auth integration
   plus one form, not a re-architecture.

So the user story is satisfied ("I can contribute"), the data model is ready, and we do not spend the
MVP building a moderation system for a site with no traffic. If you would rather ship the in-app form
in the MVP, say so — it is roughly +1 week and pulls auth and moderation forward with it.

---

## 5. User stories

**Discovery**

- As a visitor, I want to see cafés near me so I can pick one without research.
- As a visitor, I want to search a neighbourhood or city so I can plan before I travel there.
- As a visitor, I want to pan the map and re-search that area so I can explore beyond my start point.
- As a visitor, I want the list and the map to stay in sync so I never lose track of what I'm looking at.

**Deciding**

- As a visitor, I want to know at a glance whether a café is workable, so I can decide in seconds.
- As a visitor, I want to know if there is Wi-Fi and whether it is any good.
- As a visitor, I want to know if there are power outlets, because my battery decides my afternoon.
- As a visitor, I want to know if I can take a call without disturbing people or being glared at.
- As a visitor, I want to know if I can stay for a few hours without being pushed out.
- As a visitor, I want to know how noisy it is, because I need to concentrate.
- As a visitor, I want to know if the tables actually fit a laptop.
- As a visitor, I want to see opening hours so I don't arrive at a closed door.

**Trusting**

- As a visitor, I want to understand *why* a café scored what it did, so I can weigh it myself.
- As a visitor, I want to know how many people reported this and how recently, so I know how much to trust it.
- As a sceptical visitor, I want to see when data is thin, rather than a confident-looking number built on one opinion.

**Filtering**

- As a visitor who takes calls all day, I want to see only cafés where calls are acceptable.
- As a visitor who needs silence, I want to filter for quiet rooms.
- As a visitor with a dying laptop, I want to filter for guaranteed outlets.

**Contributing**

- As a local, I want to add a café I know so others can find it.
- As a local, I want to correct outdated information when a café changes.
- As a developer, I want to run the project locally in minutes and understand the codebase quickly.

**Accessibility & context**

- As a keyboard-only user, I want to reach every café and filter without a mouse.
- As a screen reader user, I want the map to have a usable list equivalent.
- As a mobile user on the street, I want the whole thing to work one-handed on a phone.

---

## 6. Architecture

### Shape: modular monolith

One Next.js application, internally partitioned by **layer**, with a dependency rule enforced by
lint. No microservices, no packages/monorepo, no DDD ceremony, no repository interfaces with a single
implementation.

```
src/
├── app/                    # Next.js App Router — routing, RSC, route handlers
│   ├── (marketing)/        #   homepage
│   ├── explore/            #   map + list experience
│   ├── cafes/[slug]/       #   café detail
│   ├── score/              #   how the score works
│   └── api/v1/             #   public-shaped HTTP API
│
├── components/             # Presentational React. No data fetching, no business rules.
│   ├── ui/                 #   shadcn/ui primitives
│   ├── cafe/               #   café-specific composites
│   └── map/                #   MapLibre wrapper + markers
│
├── domain/                 # ★ Pure TypeScript. No React. No DB. No I/O. Fully unit-testable.
│   ├── cafe/               #   entities, value objects, filter definitions
│   ├── scoring/            #   the Work Friendly Score — the crown jewel of this folder
│   └── geo/                #   coordinates, bounding boxes, haversine
│
├── server/                 # Everything that touches the outside world
│   ├── db/                 #   drizzle schema, client, migrations, seed
│   ├── repositories/       #   SQL lives here and nowhere else
│   ├── services/           #   use cases; orchestrate repositories + domain
│   └── integrations/       #   geocoding and other third-party calls, each behind one module
│
└── lib/                    # env parsing, formatting, generic helpers, i18n messages
```

### The dependency rule

```
app ──▶ server/services ──▶ server/repositories ──▶ server/db
 │              │                     │
 └──────────────┴─────────────────────┴──────────▶ domain  (leaf: imports nothing above)
components ────────────────────────────────────▶ domain
```

Three invariants, enforced with ESLint `no-restricted-imports` rather than trusted to discipline:

1. **`domain/` imports nothing from `app/`, `server/`, or `components/`.** It is pure. If scoring
   logic needs the database, the design is wrong.
2. **`components/` never imports from `server/`.** UI receives data as props/DTOs.
3. **`app/` never imports `server/repositories` or `server/db` directly.** It goes through services.

This is the whole of the "architecture". It is deliberately thin. It gives us the one thing that
matters: the business rules — what makes a café workable, how a score is computed — live in plain
TypeScript functions that a mobile app, a CLI, a public API or a test can call without booting React
or Next.js.

### Why this satisfies "ready for Expo later"

The future mobile app does not import `domain/` directly (that would couple two deployables). It
calls `/api/v1/*`, which is already the exact same DTO the web app consumes. The web UI happens to
short-circuit HTTP by calling services in-process from React Server Components — a performance
detail, not an architectural one. Both consume identical shapes, validated by identical Zod schemas.

### Rendering strategy

- **Homepage** — static. Fast, cacheable, SEO-critical.
- **Café detail** — server-rendered and cached per slug, revalidated on data change. SEO-critical:
  "café to work in Vila Mariana" is exactly the query we want to win.
- **Explore (map + list)** — server-rendered shell with an interactive client island. The map itself
  is client-only and dynamically imported: MapLibre is ~200KB gzipped and must never block first paint.
- **Filters and map movement** — reflected in the URL query string. Every view is shareable and
  back-button-correct. This is free with `useSearchParams` and it is the single highest-value UX
  detail in a map product.

---

## 7. Data model

Design goals, in priority order: (1) provenance of every fact, (2) cheap list/map reads, (3) history
for free, (4) a clean path to moderation and external import.

### Core principle: reports are the source of truth, profiles are derived

```
                    append-only, never edited
   cafe_reports ─────────────────────────────────┐
        │                                        │
        │  aggregated (shrunk mean + majority)   │  ← history and audit trail for free
        ▼                                        │
   cafe_work_profiles  (derived, recomputed)  ◀──┘
        │
        │  read by list/map/detail in one indexed query
        ▼
      cafes
```

Every rating and amenity fact is an immutable row in `cafe_reports`. `cafe_work_profiles` is a
**deliberately denormalised cache** of the aggregate. This is the one place normalisation is broken
on purpose, and the justification is concrete: the map view needs score + amenity booleans for ~100
cafés in a single indexed query. Computing that from the report log per request would mean an
aggregate over every report in the viewport on every pan. The cache is recomputed in the same
transaction as a report insert, so it cannot drift.

The append-only log also means "history of changes" and "moderation" need no new tables later —
retracting a bad report is a soft-delete flag plus a recompute.

### Tables

**`cafes`** — the place itself

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `slug` | text unique | `nomad-coffee-vila-mariana` — stable public identifier |
| `name` | text | |
| `description` | text null | Short, factual, human-written |
| `latitude` | double precision | |
| `longitude` | double precision | |
| `address` | text null | Street-level |
| `neighborhood` | text null | Drives the "Vila Mariana" search case |
| `city` | text | |
| `country_code` | char(2) | ISO 3166-1 alpha-2 |
| `website` | text null | |
| `opening_hours` | text null | **OSM `opening_hours` syntax**, stored verbatim — see below |
| `osm_type` / `osm_id` | enum null / bigint null | Dedupe key for future import; unique together |
| `source` | enum | `seed` \| `community` \| `osm` — provenance, always visible in the UI |
| `status` | enum | `published` \| `pending` \| `hidden` — moderation hook, present from day one |
| `created_at` / `updated_at` | timestamptz | |

Indexes: `(latitude, longitude)` composite for the bounding-box scan; `(city)`; GIN trigram on
`name` for fuzzy search; unique on `slug`; unique on `(osm_type, osm_id)` where not null.

*On `opening_hours`:* stored as the OSM string format (`Mo-Fr 08:00-19:00; Sa 09:00-14:00`) rather
than a parsed table. It is the de-facto standard, it round-trips with OSM losslessly, and it handles
the ugly real cases (holidays, seasonal hours, `off`) that a naive `day/open/close` table cannot.
Parsing for display is a rendering concern; if it becomes a bottleneck we add a parsed projection.

**`cafe_reports`** — one community contribution; append-only

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `cafe_id` | uuid fk → cafes | cascade delete |
| `wifi_rating` … `long_stay_rating` | smallint null (1–5) | The five scored dimensions; each nullable so a contributor can rate only what they observed |
| `allows_calls` | boolean null | Fit attribute, **not** scored — see §8 |
| `has_air_conditioning` / `has_restroom` | boolean null | Amenity votes |
| `comment` | text null | Free-text note |
| `contributor_handle` | text null | GitHub handle or display name; no account required |
| `source` | enum | `seed` \| `community` \| `import` |
| `visited_at` | date null | When they were actually there — the basis for freshness |
| `retracted_at` | timestamptz null | Soft delete; excluded from aggregation. Moderation hook. |
| `created_at` / `updated_at` | timestamptz | |

Index: `(cafe_id, retracted_at)`.

**`cafe_work_profiles`** — derived aggregate, one row per café

| Column | Type | Notes |
|---|---|---|
| `cafe_id` | uuid pk fk → cafes | |
| `wifi_score` … `long_stay_score` | real null | Per-dimension shrunk score, 0–100 |
| `work_friendly_score` | real null | Weighted total, 0–100. **Null when data is insufficient** |
| `confidence` | enum | `none` \| `low` \| `medium` \| `high` |
| `report_count` | integer | |
| `allows_calls` / `has_air_conditioning` / `has_restroom` | boolean null | Majority vote; null when unknown |
| `last_reported_at` | timestamptz null | Powers "last updated" and freshness |
| `computed_at` | timestamptz | |

Indexes: `(work_friendly_score desc nulls last)`; partial indexes on the amenity booleans for filtering.

**`users`** — **deliberately not created in the MVP.** Introducing it now means an unused table with
an unused FK. When auth arrives in V1 the migration is additive and non-breaking: create `users`, add
a nullable `user_id` FK to `cafe_reports`, backfill nothing. Recorded here so the shape is agreed:
`id`, `handle`, `email`, `display_name`, `avatar_url`, `role` (`user` | `moderator` | `admin`),
`created_at`.

### Why `allows_calls` is not a scored dimension

Calls are the one attribute where **users want opposite things**. A silent café is excellent for a
writer and useless for someone with back-to-back meetings. Folding "calls allowed" into a single
quality number means either penalising great quiet cafés or rewarding loud ones — and it makes the
score unexplainable, because the same number would mean "good" to one user and "bad" to another.

So calls are a **fit filter**, not a quality signal: it filters the set, it never moves the number.
Same reasoning applies to A/C and restrooms — real needs, but not measures of work-friendliness.

---

## 8. Work Friendly Score

The brief's proposed weighting was:

```
Wi-Fi 20 · Outlets 20 · Seating 15 · Noise 15 · Long stay 10 · Calls 10 · Overall experience 10
```

I recommend changing it. Four specific problems, and the fixes:

**Problem 1 — "Overall experience" (10%) is unexplainable.** It is a catch-all that cannot be
justified to a user. If someone asks "why is this 72?", "10% of it is vibes" defeats the entire
premise of a transparent score. **Fix: remove it.** Its weight redistributes to real, observable
attributes.

**Problem 2 — "Calls" (10%) is a fit attribute, not a quality attribute.** Explained in §7. **Fix:
remove from scoring, keep as a filter.**

**Problem 3 — "Long stay" (10%) is underweighted.** Being welcome to stay is arguably *the* defining
property of a work-friendly café — it is the entire premise of the product. Perfect Wi-Fi and
abundant outlets are worthless if the staff want your table back in 25 minutes. **Fix: raise to 20%.**

**Problem 4 (the important one) — there is no confidence handling.** A café with one enthusiastic
report and a café with forty consistent reports would show the same number. That is how rating
systems lose trust permanently. **Fix: shrinkage toward neutral, plus a separately displayed
confidence level.**

### Proposed weights

```
Work Friendly Score
────────────────────────────────────────────
Wi-Fi              25%   can you get online, reliably
Power outlets      20%   can you stay powered
Seating & tables   20%   can you physically work comfortably
Long stay          20%   are you welcome to stay
Noise              15%   can you concentrate
────────────────────────────────────────────
                  100%
```

Every dimension is directly observable, every one is independently ratable, and none of them is
"vibes". Wi-Fi keeps the top weight because it is the most common hard blocker; noise sits lowest
because it is the most subjective and the most easily mitigated (headphones).

### The maths

Contributors rate each dimension 1–5. For dimension *d* on a café with *n* ratings:

**1. Normalise** each rating to 0–100: `(r − 1) / 4 × 100`

**2. Shrink toward the neutral prior** — this is what stops one enthusiastic report producing a 98:

```
              Σ(normalised ratings) + m × PRIOR
score_d  =  ────────────────────────────────────
                        n + m

PRIOR = 50   (neutral)
m     = 3    (smoothing constant)
```

With one 5★ report, the raw 100 becomes `(100 + 150) / 4 = 62.5` — visibly positive, not
authoritative. With ten 5★ reports it reaches `(1000 + 150) / 13 = 88.5`. The number earns its
confidence as evidence accumulates. `m = 3` is a judgement call, set as a named constant, and worth
retuning once there is real data.

**3. Weighted sum**, renormalised over the dimensions that actually have data, so a café missing
noise ratings is not silently penalised:

```
                Σ (weight_d × score_d)
total  =  ───────────────────────────────   for all d with n_d ≥ 1
                    Σ (weight_d)
```

**4. Confidence**, computed and displayed *separately* — never folded into the number:

| Level | Rule |
|---|---|
| `none` | fewer than 2 reports → **no score is shown at all** |
| `low` | 2–4 reports |
| `medium` | 5–14 reports |
| `high` | 15+ reports |

**Below 2 reports we display "Not enough data yet" instead of a number.** Showing a confident-looking
72 derived from one person's opinion is worse than showing nothing — and it is exactly the kind of
false precision that would make this product untrustworthy.

### Explainability

Every café page shows the full arithmetic: each dimension's score, its weight, its contribution in
points, how many reports back it, and when it was last updated. A dedicated `/score` page documents
the formula, the constants and this rationale. The user can always reconstruct the number by hand.

`domain/scoring/` is pure, dependency-free TypeScript with unit tests covering the edge cases —
zero reports, one report, missing dimensions, all-5s, all-1s. It is the most heavily tested module in
the codebase, because it is the one thing users have to trust.

### Explicitly not in the MVP

- **No AI.** Per the brief, and because an unauditable score is a worthless score.
- **No time decay.** Stale data is a real problem — 2023's Wi-Fi rating says little about today — but
  weighting by recency makes the arithmetic much harder to explain. MVP shows `last_reported_at`
  prominently and lets the reader judge. Half-life decay is a V1 candidate, once there is enough data
  for staleness to actually bite.
- **No personalised weights.** "Weight noise higher for me" is a good V2 feature and a bad MVP one:
  it would mean the score in a shared link differs per viewer.

---

## 9. Map, geo and data sources

### Geospatial queries: no PostGIS in the MVP

**Verified in this environment:** PostGIS is *not* installed (`postgresql-16-postgis-3` is available
via apt but absent). `cube`, `earthdistance`, `pg_trgm` and `unaccent` *are* available as standard
contrib.

**Decision: plain `latitude`/`longitude` columns, with a bounding-box prefilter and haversine ordering
in SQL.** No extension required.

Rationale:

- Every query the MVP performs is "cafés within N km of a point" or "cafés inside this viewport".
  A bounding box on an indexed `(latitude, longitude)` pair answers both, and haversine orders the
  handful of survivors. At the scale of thousands-to-low-tens-of-thousands of cafés this is
  comfortably sub-millisecond.
- **Contributor experience is the deciding factor.** Requiring PostGIS means every contributor needs
  a PostGIS-enabled Postgres. Plain columns run on `postgres:16-alpine`, on a stock local install, on
  a Neon free tier — `docker compose up` and go. For an open source project trying to attract
  contributors, that is worth more than an index we do not yet need.
- PostGIS is a genuinely better tool at scale. We adopt it when scale justifies it, not before.

**Upgrade ladder, documented so the decision is reversible:**

| Stage | Approach | Trigger |
|---|---|---|
| MVP | bbox + haversine, no extension | now |
| Next | `cube` + `earthdistance`, GiST on `ll_to_earth()` | slow radius queries |
| Later | PostGIS `geography(Point,4326)` + GiST | isochrones, polygons, routing, real scale |

All of it is contained in **one module** (`server/repositories/cafe-repository.ts`) plus
`domain/geo/`. Migrating is a migration file and one function body — not a refactor. Nothing above the
repository layer knows how proximity is computed.

### Map rendering

**MapLibre GL JS** (BSD-3, no vendor lock-in, no API-key requirement in the library itself).

The genuinely hard part is not the library, it is **tiles**. MapLibre renders vector tiles; it does
not provide them. The realistic options:

| Option | Trade-off |
|---|---|
| MapLibre `demotiles` | Fine for development. Explicitly not for production. |
| MapTiler / Stadia / Protomaps hosted | Production-quality, requires an API key and has a free-tier ceiling |
| Self-hosted Protomaps PMTiles | No per-request cost, no key; needs a one-off extract and static hosting |
| `tile.openstreetmap.org` raster | **Not an option** — the OSMF tile policy does not permit third-party apps to use it as a general tile source |

**Decision:** the style URL is an environment variable, `NEXT_PUBLIC_MAP_STYLE_URL`, defaulting to a
key-free style so `git clone && pnpm dev` shows a working map with no signup. Production points it at
a properly licensed source. One env var, zero code change, no provider baked into the codebase.

Attribution — `© OpenStreetMap contributors` — is rendered permanently in the map control, not
tucked into a footer, regardless of provider.

### Geocoding

Search ("Vila Mariana") needs place-name → coordinates. **Nominatim**, the OSM geocoder, is the
obvious choice for an OSS project.

It is called **only from the server**, via `server/integrations/geocoding/`, never from the browser.
That single choke point is what lets us guarantee: one descriptive `User-Agent`, request throttling,
and a cache layer that keeps repeated searches for the same city off the upstream service entirely.
It also means swapping providers is a one-file change.

### ⚠️ Requires verification before any public launch

**I could not verify the following from this environment** — `operations.osmfoundation.org` is
blocked by the network egress proxy. These are stated as *what must be checked*, not as fact. Do not
treat the parenthetical recollections as authoritative:

1. **Nominatim usage policy** — <https://operations.osmfoundation.org/policies/nominatim/>
   Confirm the current rate limit, `User-Agent`/`Referer` requirements, caching expectations, and the
   rules on bulk/automated geocoding. *(My recollection is roughly 1 request/second with a required
   identifying User-Agent and bulk geocoding discouraged — this must be confirmed, and self-hosting
   Nominatim is the correct answer if traffic ever becomes non-trivial.)*
2. **OSM tile usage policy** — <https://operations.osmfoundation.org/policies/tiles/>
   Only relevant if raster tiles are ever considered. Current plan avoids this entirely.
3. **ODbL 1.0 obligations for derived databases** — <https://opendatacommons.org/licenses/odbl/>
   Specifically: if we import OSM data into our database, what does share-alike require of the
   *result*? This directly determines the data-licence decision in §11 and should be settled before
   the first import, not after.
4. **Tile provider free-tier terms** — whichever provider is chosen; check request ceilings and
   whether attribution requirements go beyond OSM's.

Each item is tracked as a GitHub issue at repo creation rather than left in a document nobody rereads.

### Importing OSM data

Not in the MVP, but the schema is ready: `osm_type` + `osm_id` on `cafes` gives a stable dedupe key,
and `source` keeps imported records distinguishable from community ones forever.

The strategy, when we do it: query Overpass for `amenity=cafe` in a target city, import only the
**factual** fields (name, location, address, website, `opening_hours`, `internet_access`), and never
synthesise work-condition ratings from it. OSM knows where cafés are; it does not know whether the
chairs are comfortable. Those two datasets stay separate, and the licence question in item 3 above is
answered before the first row lands.

---

## 10. API

Route handlers under `/api/v1/`, versioned from the first commit. Zod validates every input and
every response DTO — the same schemas the future Expo client will import.

### MVP endpoints

```http
GET /api/v1/cafes
```
Query: `lat`, `lng`, `radius` (km) — or `bbox=minLng,minLat,maxLng,maxLat` — plus `q`, `limit`,
`cursor`, and filter flags `wifi`, `outlets`, `calls`, `quiet`, `laptopTables`, `longStay`,
`airConditioning`, `restroom`, `minScore`.
Returns a paginated list of `CafeSummary` (identity, coordinates, score, confidence, amenity booleans)
— deliberately lean, because this powers both the map and the list.

```http
GET /api/v1/cafes/{slug}
```
Returns `CafeDetail`: everything in the summary, plus the full per-dimension score breakdown with
weights and contributions, community notes, provenance and freshness.

```http
GET /api/v1/geocode?q={query}
```
Server-side proxy to the geocoding provider. Cached, throttled, correctly user-agented. Returns
normalised `{ name, latitude, longitude, boundingBox, type }`.

```http
GET /api/v1/health
```
Liveness plus database connectivity. Two lines of code, saves an hour the first time a deploy misbehaves.

### V1 (post-MVP, shape agreed now)

```http
POST   /api/v1/cafes/{id}/reports      # submit a report        (auth)
POST   /api/v1/cafes                   # propose a new café     (auth)
PATCH  /api/v1/cafes/{id}              # propose a correction   (auth)
GET    /api/v1/cities/{slug}           # city landing pages     (SEO)
```

### Conventions

- Errors are a consistent envelope: `{ error: { code, message, details? } }`. Codes are a closed
  union, not free-form strings.
- All list endpoints are cursor-paginated. Offset pagination on a moving dataset is a bug waiting to happen.
- Responses carry explicit `Cache-Control`. Café data changes hourly at most; it should not be
  revalidated per request.
- No endpoint returns a raw Drizzle row. Every response is an explicit DTO, so a schema change cannot
  silently alter the public API — or silently leak a column.

---

## 11. Licence

**Code: MIT.** Permissive, universally understood, zero friction for contributors and for anyone
wanting to run their own instance. It is the default expectation in this ecosystem and the least
likely to make a would-be contributor close the tab.

**Data: ODbL 1.0** — and this distinction matters more than it first appears.

If community-contributed data were MIT while imported OSM data carries ODbL share-alike, the combined
database sits in a genuinely awkward position the moment we import anything from OSM. Aligning our
data licence with OSM's from day one avoids ever having to relicense a dataset contributed by hundreds
of people — a thing that is, in practice, close to impossible once it has happened.

So: `LICENSE` (MIT, code) and `DATA-LICENSE` (ODbL 1.0, database contents), each stating clearly what
it covers, with the split explained in the README and in `CONTRIBUTING.md`. See §9 item 3 — the
precise ODbL obligations should be confirmed before the first OSM import.

---

## 12. Design direction

The brief is clear about what to avoid: corporate dashboard, card soup, generic SaaS, over-technical.
The target is *coffee discovery + remote work utility* — something with the warmth of a good café
guide and the precision of a good tool.

**Reference points:** the typography of a well-made city guide; the calm of a paper map; the density
of a field notebook. Not a fintech dashboard, not a startup landing page.

### Visual language

- **Palette** — warm neutrals from paper and espresso: bone/cream grounds, deep espresso brown text,
  a single muted terracotta accent for interaction. The map is the only place saturated colour
  appears, and even there it stays desaturated so markers read clearly against it. Full dark mode,
  because half of this audience works at night.
- **Type** — an editorial serif for display (headlines, café names, score numerals) against a clean
  sans for UI and body. The serif is what stops this looking like every other SaaS product; the sans
  is what keeps it readable at 13px. Numbers are tabular-figure so scores align in a list.
- **Space** — 8px grid throughout. Generous whitespace. The instinct in a listing product is to cram;
  the discipline is to resist it.
- **Motion** — restrained and purposeful. Map-to-list highlight, panel transitions, skeletons on load.
  Nothing decorative. `prefers-reduced-motion` respected everywhere.
- **Cards** — used sparingly, per the brief. The café list is a *list* with clear separators, not
  fourteen floating boxes with shadows.

### Component strategy

shadcn/ui provides the primitives that are genuinely tedious and genuinely easy to get wrong —
Dialog, Popover, Select, Sheet, Toggle — and gives us Radix's accessibility for free. Because shadcn
copies source into the repo rather than installing a black box, we restyle them to co-fe's tokens
directly. What we do *not* do is wrap everything in a generic `<Card>`; café-specific composites
(`CafeListItem`, `ScoreBreakdown`, `WorkProfileGrid`) are purpose-built for their content.

### Accessibility, treated as a requirement

- WCAG AA contrast on all text, verified rather than assumed.
- Every interactive target ≥44×44px — this product gets used one-handed, standing on a street.
- Full keyboard navigation, visible focus rings that survive the design pass.
- **The map has a complete list equivalent.** A canvas-rendered map is fundamentally inaccessible to
  screen readers; the list is not a fallback, it is a peer.
- Filter state announced via live region so screen reader users know the result count changed.

---

## 13. Homepage

```
┌────────────────────────────────────────────────────────┐
│  co-fe                              Explore · Contribute│
│                                                        │
│        Find a café where you can actually work.        │
│                                                        │
│   Wi-Fi, power, quiet and a table that fits a laptop.  │
│   Community-checked, openly licensed.                  │
│                                                        │
│   ┌──────────────────────────────────┐ ┌────────────┐  │
│   │ Search cafés, neighborhoods...   │ │ Find cafés │  │
│   └──────────────────────────────────┘ └────────────┘  │
│              or use my current location                │
├────────────────────────────────────────────────────────┤
│  Nearby / featured cafés — score, key amenities        │
├────────────────────────────────────────────────────────┤
│  How the Work Friendly Score works  →  /score          │
│  Wi-Fi 25 · Power 20 · Seating 20 · Stay 20 · Noise 15 │
├────────────────────────────────────────────────────────┤
│  Know a good one? Add a café.        →  contribute     │
└────────────────────────────────────────────────────────┘
```

The hero is copy and a search field — no illustration, no gradient mesh, no product screenshot. The
proposition is a sentence, and the sentence is doing the work.

The score explainer sits on the homepage rather than buried in an about page, because transparency is
the product's differentiator and the moment to establish it is before the visitor has any reason to
trust us.

Copy is English-only for now, but every string lives in `lib/i18n/messages/en.ts` rather than inline
in JSX. Adding `pt-BR` later is then a file, not an archaeology project.

---

## 14. Open source strategy

The project should be contributable on day one, not after a "we'll tidy it up later" that never comes.

| File | Purpose |
|---|---|
| `README.md` | What it is, the problem, stack, local setup, contributing, roadmap, licence |
| `CONTRIBUTING.md` | Setup, project structure, conventions, commit style, PR flow, **how to contribute café data** |
| `CODE_OF_CONDUCT.md` | Contributor Covenant 2.1 |
| `SECURITY.md` | Private disclosure route and response expectations |
| `LICENSE` / `DATA-LICENSE` | MIT (code) / ODbL 1.0 (data) — see §11 |
| `docs/PLAN.md` | This document |
| `docs/ARCHITECTURE.md` | Layers, dependency rule, data flow, where to add things |
| `.github/ISSUE_TEMPLATE/` | `add-cafe.yml`, `update-cafe.yml`, `bug.yml`, `feature.yml` |
| `.github/pull_request_template.md` | Checklist: typecheck, lint, tests, screenshots for UI |
| `.github/workflows/ci.yml` | typecheck + lint + test + build on every PR |

**The two structured data templates are the contribution product.** `add-cafe.yml` asks exactly the
fields the schema needs, with the rating scales explained inline, so a non-technical local can
contribute knowledge through a web form and a maintainer can turn it into a seed entry without a
conversation.

`good first issue` labels are applied from the start, and the README says plainly which parts of the
codebase are easiest to enter.

### Local development

The bar: **clone to running app in under five minutes, with one command.**

```bash
git clone … && cd cofe
pnpm install
cp .env.example .env
docker compose up -d db     # postgres:16-alpine — no PostGIS, no extensions
pnpm db:migrate
pnpm db:seed                # demo data, clearly labelled
pnpm dev
```

`.env.example` is committed and complete. Environment variables are parsed and validated through Zod
at startup (`lib/env.ts`) so a missing variable fails immediately with a readable message, instead of
surfacing as `undefined` three layers deep at runtime.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string |
| `NEXT_PUBLIC_MAP_STYLE_URL` | no | MapLibre style; key-free default for dev |
| `NEXT_PUBLIC_SITE_URL` | no | Canonical URL for SEO/metadata |
| `GEOCODING_USER_AGENT` | no | Identifies this instance to the geocoder, per policy |

### Demo data — honesty rule

Per the brief, and it is worth restating because it is easy to violate accidentally:

> **No invented café data is ever presented as real.**

Seed cafés use unmistakably fictional names, `source = 'seed'`, and the UI renders a persistent
"Demo data" badge whenever seed records are shown. Community notes on seed records are written as
illustrative examples, never as fabricated quotes from imaginary people. When real data arrives, seed
data is removed rather than quietly blended in.

---

## 15. Roadmap

**MVP — a working vertical slice**
Foundation · database · discovery (search, nearby, filter) · map + list · café detail · explainable
score · demo seed · contribution via issue templates · responsive, accessible, documented.

**V1 — the community turns on**
Auth (GitHub OAuth — the audience already has an account) · in-app report submission · moderation
queue · café submission and corrections · city landing pages for SEO · first real OSM import for one
city · score time-decay.

**V2 — depth**
Photos with moderation · favourites · contributor profiles and reputation · richer opening-hours
handling with "open now" · personalised score weighting · stable public API with keys · PWA + offline
café lists (genuinely useful when travelling) · pt-BR and es localisation.

**Future — under consideration, not committed**
Check-ins and "people working here now" · occupancy and best-time-to-work · café owner accounts and
verification · badges and gamification · Expo mobile app · notifications · AI-generated summaries of
community notes (as a *summary*, never as a score input) · personalised recommendations · Google
Places or similar as a supplementary source.

Two notes on that list. **Occupancy features are cold-start-fatal** — "people here now" showing zero
forever is worse than not having it; it needs a real user base first. And **AI stays out of scoring
permanently**, not just in the MVP: the moment the number is not hand-checkable, the product's main
differentiator is gone.

---

## 16. Summary of decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | Modular monolith, layers enforced by lint | Simple, testable; the rule is checked, not trusted |
| 2 | **No PostGIS in MVP** — bbox + haversine | Not installed here; contributor setup stays trivial; documented upgrade ladder |
| 3 | Reports append-only, profiles derived | Provenance, history and moderation for free; fast reads |
| 4 | **Score reweighted**; drop "overall experience" and "calls" | Every component must be observable and explainable |
| 5 | **Shrinkage + confidence; no score below 2 reports** | The single biggest trust improvement over the original design |
| 6 | Calls/A-C/restroom are filters, not score inputs | Users want opposite things; folding them in breaks explainability |
| 7 | **Contribution via GitHub issue templates in MVP** | Real contribution path without auth + moderation; schema ready for V1 |
| 8 | No `users` table until auth exists | An unused table is not "preparation", it is dead weight |
| 9 | `/api/v1` from commit one, Zod DTOs | Makes the Expo/public-API story real at near-zero cost |
| 10 | Map style URL as env var | Works key-free in dev; no provider baked in |
| 11 | Geocoding server-side only, cached | One choke point for rate limits, User-Agent and provider swaps |
| 12 | MIT for code, **ODbL for data** | Avoids a licence conflict that becomes unfixable after the fact |
| 13 | `opening_hours` in OSM syntax, unparsed | Handles the real-world cases; round-trips with OSM |
| 14 | Filters and viewport in the URL | Shareable, back-button-correct — cheap, high-value |
| 15 | i18n-ready strings, English-only copy | Translation becomes a file, not a rewrite |

## 17. Implementation status

The MVP described above is **built and running**. What shipped, and where it departed from the plan:

| MVP capability | Status |
| --- | --- |
| Discovery by location, search, filters | ✅ Built, verified against a live database |
| Map + list, synchronised | ✅ Built |
| Café detail with explainable breakdown | ✅ Built — points column verified to sum to the headline |
| Work Friendly Score with shrinkage + confidence | ✅ Built, 34 unit tests |
| Demo dataset, clearly marked | ✅ 12 invented cafés, 51 reports, `source = 'seed'` |
| Contribution via issue templates | ✅ Built |
| Open source docs, licences, CI | ✅ Built |

### Two changes made during implementation

Both came from looking at the running application rather than from the plan:

1. **Map tile failure needed its own error state.** When tiles do not load, the map degraded into a
   blank white area with floating markers and no explanation — which reads as a broken page. It now
   says what is missing and keeps the list fully usable. This is a real production case (expired
   key, provider outage, offline user); it surfaced here because the development environment blocked
   the tile host.

2. **Mobile filters became a sheet.** The inline filter chips cost roughly 300px of vertical space on
   a phone, pushing every result below the fold — so the first thing a mobile visitor saw was a
   control panel rather than a café. Below 640px they now collapse behind a single button: four
   cafés are visible above the fold instead of one, and filters stay one tap away.

### Verified, not assumed

- Migrate + seed on a completely fresh database: **2 seconds**, so the README's setup claim is measured.
- The score breakdown's points column sums exactly to the headline number in the rendered HTML.
- The single-report café publishes **no score at all**, end to end.
- Map markers really do have a 44px hit area (clicks register to ±21px from centre).
- The architectural boundary lint rules genuinely fire, with their intended messages.

### Deferred from this plan

Nothing in the MVP scope was dropped. Section 4's "out of scope" list is unchanged.

---

## 18. Risks and open questions

| Risk | Severity | Mitigation |
|---|---|---|
| **Cold start — an empty map is a dead product** | **High** | Seed one city properly at launch rather than ten badly. Depth beats coverage; a visitor in the seeded city has a real experience, and that is what gets shared. |
| **Data staleness** — cafés change Wi-Fi, furniture, policy | High | Show `last_reported_at` prominently; confidence decay in V1; make correcting a café trivially easy |
| **OSM licence obligations for imports** | Medium | §9 item 3 — settle *before* the first import, not after |
| **Tile provider cost at scale** | Medium | Env-var style URL; self-hosted PMTiles is the escape hatch |
| **Nominatim rate limits** | Medium | Server-side proxy + aggressive cache from day one; self-host if traffic grows |
| **Score gaming / spam once writes open** | Medium | Deferred with in-app writes; shrinkage already limits single-report impact |
| **Subjectivity of "quiet" and "comfortable"** | Medium | Anchored 1–5 scales with written descriptions per level, not bare stars |
| **Bleeding-edge dependency versions** | Low | Next 16 / React 19.3 / Tailwind 4.3 / TS 7 are all newer than my training data. Mitigation: scaffold with official tooling, pin exact versions, verify with typecheck + lint + build after every phase rather than assuming API shapes. |
| Contributor drop-off from setup friction | Low | One-command setup, committed `.env.example`, no extensions required |

**Open questions for you**

1. **Contributions in the MVP** — I recommend the issue-template path (§4). If you want the in-app
   form in the MVP instead, it pulls auth and moderation forward by roughly a week.
2. **Which city to seed first?** São Paulo is implied by the "Vila Mariana" example. Seeding one city
   deeply is the single highest-leverage launch decision.
3. **Score weights** — §8 is my recommendation, argued but not sacred. Worth a second opinion before
   it is baked into a public number.
4. **Tile provider for production** — dev works key-free; production needs a choice.
