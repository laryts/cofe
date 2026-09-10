## What does this change?

<!-- A sentence or two. The diff shows what; explain why. -->

## Why?

<!-- Link an issue if there is one: Closes #123 -->

## Checklist

- [ ] `pnpm check` passes (typecheck, lint, tests)
- [ ] `pnpm build` passes
- [ ] No `any` or `@ts-ignore` introduced
- [ ] User-facing strings are in `src/lib/i18n/messages/en.ts`, not inline in JSX

### For UI changes

- [ ] Screenshots below, light **and** dark mode
- [ ] Checked at phone width (~390px)
- [ ] Keyboard reachable, with a visible focus ring
- [ ] Touch targets are at least 44px

### For scoring changes

- [ ] Per-dimension contributions still sum to the headline number
- [ ] Shrinkage still prevents a single report producing an extreme score
- [ ] Tests updated, and the effect on the demo dataset noted below

### For schema changes

- [ ] Migration generated with `pnpm db:generate` and committed
- [ ] `pnpm db:seed` still works

## Screenshots

<!-- Before / after for anything visual. -->
