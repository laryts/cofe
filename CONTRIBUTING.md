# Contributing to co-fe

Thanks for being here. co-fe only works if people who know their neighbourhood fill it in — no
algorithm knows whether the chairs are comfortable.

There are two very different ways to contribute, and **both matter equally**.

---

## 1. Contributing café data (no coding required)

This is the most valuable thing you can do, and it needs no technical knowledge.

### Add a café

Use the **[Add a café](https://github.com/laryts/cofe/issues/new?template=add-cafe.yml)** form. It
asks for exactly what the database stores, with each rating scale explained inline.

### Correct something

Use the **[Update a café](https://github.com/laryts/cofe/issues/new?template=update-cafe.yml)** form.
Cafés change constantly — Wi-Fi improves, sockets get taped over, a quiet room becomes a music venue.
**Outdated data is worse than no data**, so corrections are as welcome as additions.

### How to rate honestly

Every rating is 1–5, and every point has a written anchor — see
[the score page](https://github.com/laryts/cofe/blob/main/docs/PLAN.md#8-work-friendly-score) or
`/score` in the running app. A few principles:

- **Rate what you observed**, not what you assume. Leave a dimension blank rather than guessing —
  blanks are handled properly and do not count against a café.
- **Rate a typical moment**, not the best or worst one. A café that is silent at 8am and chaotic at
  1pm is a 3 for noise, not a 5.
- **Negative reports are valuable.** Recording that a place is bad for working saves other people a
  wasted trip. That is the product working, not an attack on the café.
- **Don't rate a place you have not worked in.** Walking past is not enough.

### Please don't

- Copy data from Google Maps, Yelp, or any other proprietary source. It is a licensing problem and
  it makes co-fe legally unusable. Your own first-hand experience is the whole point.
- Add a café that does not exist, or invent reports.
- Use co-fe to promote a business you own — say so if you do have a connection.

## 2. Contributing code

### Setup

```bash
git clone https://github.com/laryts/cofe.git
cd cofe
pnpm install
cp .env.example .env
docker compose up -d db
pnpm db:reset      # migrate, then seed
pnpm dev
```

If this takes more than five minutes, **that is a bug** — please open an issue. Setup friction is the
main reason people bounce off open source projects, and we would rather fix it than lose you.

### Before opening a pull request

```bash
pnpm check     # typecheck + lint + tests
pnpm build     # catches things the dev server tolerates
```

CI runs the same commands. Running them locally first saves a round trip.

### Project structure

Read **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — especially "Where things live", which maps
common tasks to files. The short version:

- `src/domain/` — pure business logic. No React, no database, no I/O.
- `src/server/` — database, repositories, services, third-party integrations
- `src/components/` — presentational React
- `src/app/` — routes and pages

**Layer boundaries are enforced by lint.** If you get a `no-restricted-imports` error, it is not
being pedantic — the message explains which rule you crossed and where the code belongs instead.

### Conventions

- **TypeScript strict.** No `any`, no `@ts-ignore`. Both are lint errors. `@ts-expect-error` is
  allowed *with a description* when you genuinely need it.
- **No business logic in components.** If a component is deciding what a score means, that decision
  belongs in `domain/`.
- **No user-facing strings in JSX.** Copy lives in `src/lib/i18n/messages/en.ts` so translation later
  is a file, not an archaeology expedition.
- **Accessibility is not optional.** 44px minimum touch targets, keyboard reachable, visible focus,
  WCAG AA contrast. PRs that regress this will get review comments.
- **Prefer no dependency.** Before adding one, check whether the platform already does it. We added
  Radix for focus trapping (genuinely hard), and wrote our own toggle buttons (genuinely easy).

### Commit messages

Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.

Say *why*, not just *what* — the diff already shows what changed. Good:

```
fix(scoring): exclude retracted reports from the dimension average

Retracted reports were filtered from the report count but not from the
per-dimension ratings, so retracting a bad report lowered confidence
without changing the score it had distorted.
```

### Pull requests

- One logical change per PR. Small PRs get reviewed; large ones get postponed.
- Include before/after screenshots for UI changes, and check both light and dark mode.
- If you changed scoring, say what the new numbers do to the demo dataset.
- Draft PRs are welcome for feedback on direction.

### Changing the scoring model

The Work Friendly Score is the product's core claim, so changes there get more scrutiny than
anywhere else. Three properties must survive:

1. **Explainability.** Per-dimension contributions must still sum to the headline number. If a user
   cannot check it by hand, it is not shippable.
2. **Shrinkage.** Thin evidence must stay pulled toward neutral. A single report must never produce
   an extreme score.
3. **Separate confidence.** Uncertainty is reported alongside the number, never folded into it.

Open an issue to discuss before writing the code — the weights are a considered proposal, and
changing them is a product decision, not a refactor.

### Adding a dependency

Say in the PR description what it does, why the platform or an existing dependency cannot, and its
install size. Dependencies are a maintenance cost paid forever by everyone.

### Good first issues

Issues labelled [`good first issue`](https://github.com/laryts/cofe/labels/good%20first%20issue) are
scoped to be completable without deep context. Approachable areas:

- **Seed data** — add cafés for a city you know (`src/server/db/seed/data.ts`)
- **Copy** — clearer wording in `src/lib/i18n/messages/en.ts`
- **Empty and error states** — there are always more of these than you think
- **Tests** — `src/domain/` is pure and easy to test

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be decent to each other.

## Licensing your contribution

Code contributions are licensed under [MIT](LICENSE). **Data contributions are licensed under
[ODbL 1.0](DATA-LICENSE)** — the same licence as OpenStreetMap, so the two datasets can coexist.
Opening a PR or a data issue means you agree to this, and that the contribution is your own work.

## Questions

Open a [discussion](https://github.com/laryts/cofe/discussions) or an issue. Questions about how
something works are useful signal — if it was unclear to you, the documentation needs improving.
