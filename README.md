<div align="center">

# co-fe

**Find a café where you can actually work.**

An open, community-maintained map of cafés that are genuinely good to work from —
Wi-Fi, power outlets, quiet, comfortable tables and long stays.

[Plan](docs/PLAN.md) · [Architecture](docs/ARCHITECTURE.md) · [Contributing](CONTRIBUTING.md)

</div>

---

## The problem

Remote work made the café a default workplace, but cafés were never designed to be one.

Wi-Fi ranges from fibre to a captive portal that drops every ten minutes. Sockets may be plentiful,
hidden behind a sofa, or deliberately taped over. Tables can be a proper working height or a 30cm
marble disc that fits one cup. Some cafés genuinely welcome you staying three hours; some want the
table back in twenty minutes. Whether you can take a video call without being glared at is almost
never written down anywhere.

You find all of this out *after* you have bought a coffee, sat down and opened your laptop.

Existing maps optimise for "is this a good café", not "can I work here". **co-fe adds the missing
layer** — a structured, filterable, openly licensed dataset about work conditions.

## What it does

- **Find cafés near you**, or search a neighbourhood or city before you travel there
- **See them on a map and in a list**, kept in sync
- **Filter by what you actually need** — reliable Wi-Fi, sockets, quiet, laptop-friendly tables,
  long stays, calls allowed, air conditioning, a restroom
- **Read a Work Friendly Score you can check by hand** — every dimension, weight and point
  contribution is shown, and the parts add up to the whole
- **Know how much to trust it** — confidence is reported separately, and below two reports no score
  is published at all

## Screenshots

> Placeholder — add real screenshots once a city has real data. The screenshots below would show the
> homepage, the explore view and a café page. Contributions welcome.

## The Work Friendly Score

One number from 0–100, built from five things anyone can observe:

| Dimension | Weight | What it measures |
| --- | --- | --- |
| Wi-Fi | 25% | Reliable enough to work on, not merely present |
| Power outlets | 20% | Reachable from a seat |
| Seating & tables | 20% | Suits a laptop for more than twenty minutes |
| Long stay | 20% | Staying hours is welcomed, not just tolerated |
| Noise | 15% | Easy to concentrate at a typical busy moment |

Three deliberate choices, explained in full at `/score` and in [docs/PLAN.md](docs/PLAN.md#8-work-friendly-score):

- **No "overall experience" term.** A catch-all cannot be justified to someone asking why a café
  scored what it did, which defeats the point of publishing a number.
- **"Calls allowed" is a filter, not a score input.** People want opposite things from it — a silent
  café is perfect for a writer and useless for someone in back-to-back meetings.
- **Ratings shrink toward a neutral prior.** A single 5★ report yields 62.5, not 100. The number
  earns its extremity as evidence accumulates, so one enthusiastic visit cannot manufacture a 98.

**No AI is involved, and none is planned.** The whole value of the score is that you can audit it.

## Stack

| | |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript, `strict` plus `noUncheckedIndexedAccess` |
| Styling | Tailwind CSS 4, shadcn/ui-style components on Radix |
| Database | PostgreSQL 16 + Drizzle ORM |
| Maps | MapLibre GL JS, OpenStreetMap data |
| Validation | Zod |
| Tests | Vitest |

**No PostGIS required.** Proximity uses an indexed bounding-box prefilter plus haversine, which runs
on any stock Postgres — including `postgres:16-alpine` and free managed tiers. That keeps setup to
one command, and the [upgrade path](docs/PLAN.md#9-map-geo-and-data-sources) to `earthdistance` or
PostGIS is documented and confined to a single module.

## Running locally

**Requirements:** Node 20.9+, pnpm 10+, and Docker (or any PostgreSQL 16 you already have).

```bash
git clone https://github.com/laryts/cofe.git
cd cofe
pnpm install

cp .env.example .env          # defaults match docker-compose
docker compose up -d db       # plain postgres:16-alpine, no extensions

pnpm db:migrate               # create the schema
pnpm db:seed                  # load the demo dataset
pnpm dev                      # http://localhost:3000
```

That is the whole setup. If it takes you more than five minutes, that is a bug —
[please open an issue](https://github.com/laryts/cofe/issues/new).

### Using your own Postgres

Point `DATABASE_URL` at any PostgreSQL 16+ database and run the migration. No extensions, no
superuser, no special image.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | **yes** | PostgreSQL connection string |
| `NEXT_PUBLIC_MAP_STYLE_URL` | no | MapLibre style. Defaults to key-free demo tiles — fine for development, **not for production** |
| `NEXT_PUBLIC_SITE_URL` | no | Canonical origin for metadata |
| `GEOCODING_USER_AGENT` | no | Identifies your instance to the geocoder. **Change this before running in public** |
| `GEOCODING_BASE_URL` | no | Geocoding endpoint; point at a self-hosted Nominatim if you have one |

All are validated with Zod at startup, so a mistake fails immediately with a readable message.

### Scripts

```bash
pnpm dev            # development server
pnpm build          # production build
pnpm check          # typecheck + lint + tests — run this before opening a PR
pnpm test           # unit tests
pnpm db:generate    # generate a migration after changing the schema
pnpm db:migrate     # apply migrations
pnpm db:seed        # reload demo data (only touches source = 'seed' rows)
pnpm db:studio      # Drizzle Studio
```

## About the demo data

The seed dataset is **entirely invented**. The café names are fictional, the ratings were written by
hand to exercise the interface, and the notes are illustrative examples — not quotes from real people
about real places.

Every seed record is marked `source = 'seed'` and carries a visible **Demo data** badge. Presenting
invented data as real community reporting is the one thing this project must never do, so when real
data arrives, seed data is deleted rather than blended in.

## Contributing

co-fe only works if people who know their neighbourhood fill it in. No algorithm knows whether the
chairs are comfortable — someone has to have sat in them.

- **[Add a café](https://github.com/laryts/cofe/issues/new?template=add-cafe.yml)** — a structured
  form, no coding needed
- **[Correct something](https://github.com/laryts/cofe/issues/new?template=update-cafe.yml)** — cafés
  change, and stale data is worse than none
- **[Contribute code](CONTRIBUTING.md)** — small codebase, documented architecture, five-minute setup

Issues labelled `good first issue` are a reasonable place to start.

## Roadmap

**Now (MVP)** — discovery, map and list, filters, café pages, the explainable score, demo data,
contribution via issue templates.

**V1** — accounts, in-app report submission, moderation queue, city landing pages, first real OSM
import, score time-decay.

**V2** — photos, favourites, contributor reputation, "open now", personalised weighting, public API,
PWA with offline lists, pt-BR and es.

**Under consideration** — check-ins and live occupancy, café owner accounts, an Expo mobile app,
AI-generated summaries of community notes (as summaries, never as score inputs).

Full detail in [docs/PLAN.md](docs/PLAN.md#15-roadmap).

## Licence

**Code: [MIT](LICENSE).** **Data: [ODbL 1.0](DATA-LICENSE).**

The split is deliberate. OpenStreetMap data carries ODbL share-alike, so licensing our database the
same way avoids a conflict the moment we import from OSM — and avoids ever needing to relicense a
dataset contributed by hundreds of people, which is close to impossible after the fact.

Map data © OpenStreetMap contributors.

## Acknowledgements

Built on [OpenStreetMap](https://www.openstreetmap.org/), [MapLibre](https://maplibre.org/),
[Next.js](https://nextjs.org/) and [Drizzle](https://orm.drizzle.team/).
