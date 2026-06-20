# Agent Working Agreement

This file defines the project rules for AI agents and human contributors working in this repository.

## Project Intent

SubVoid is a focused scheduling product. The UI should feel like a practical work tool: dense, scannable, calm, and fast. Avoid marketing-page patterns, decorative layouts, and large explanatory panels inside the application surface.

## Required Stack

- Next.js 16 App Router
- React 19
- TypeScript with strict checking
- Tailwind CSS 4
- shadcn/base-ui style primitives in `components/ui`
- Hugeicons for iconography
- Zustand for shared client state
- date-fns for date and calendar logic
- pnpm for dependency management

Do not introduce a competing framework or state library without an explicit architectural decision.

## Coding Standards

- Keep TypeScript types explicit at module boundaries.
- Avoid `any`; prefer narrow domain types and discriminated unions where helpful.
- Use pure helpers for date, layout, and filtering logic so behavior can be tested independently.
- Do not place business logic inside reusable UI primitives.
- Do not duplicate calendar math across components; centralize it in `components/calendar/calendar-utils.ts` or a dedicated domain module.
- Keep components small enough that their rendering states are obvious from the file.
- Prefer composition over configuration-heavy components.
- Use concise comments only for non-obvious decisions.

## UI Standards

- Build app screens, not landing pages, unless the task explicitly asks for marketing content.
- Preserve the current dense calendar layout and restrained visual system.
- Use existing tokens from `app/globals.css` and Tailwind utilities before adding new CSS.
- Keep card radii at or below the existing system radius unless a design-system change is intentional.
- Use icon buttons for common tool actions and text buttons for clear commands.
- Ensure text does not overflow buttons, event cards, sidebars, dialogs, or popovers at mobile widths.
- Validate both dark and light themes when changing color, shadow, border, or background styles.
- Do not add decorative gradient blobs, floating orbs, or unrelated illustration.

## State And Data

- Use local state for isolated UI state.
- Use Zustand for state shared across calendar controls, calendar views, dialogs, and sidebar workflows.
- Keep mock data isolated under `mock-data` until a real persistence layer is introduced.
- When adding persistence, expose it through domain functions or hooks; do not bind UI components directly to a database or API SDK.
- Store dates in stable string formats at data boundaries and convert to `Date` objects only where date-fns operations require them.

## File Ownership

- `app`: route composition, metadata, global providers, and global CSS.
- `components/calendar`: calendar product surface and calendar-specific UI.
- `components/ui`: generic primitives only.
- `store`: shared client state.
- `mock-data`: temporary fixture data.
- `lib`: reusable utilities that are not tied to one feature.
- `docs`: specifications, architecture notes, and decisions.

## Verification

Run the smallest meaningful check for the change:

- Always run `pnpm lint` after code changes.
- Run `pnpm build` after changes to routes, Next config, metadata, provider setup, TypeScript config, or dependencies.
- For UI changes, inspect the app in a browser at desktop and mobile widths.
- For calendar logic changes, cover week navigation, event positioning, filtering, and short-event rendering.

## Dependency Policy

- Prefer existing dependencies.
- Add a dependency only when it meaningfully reduces complexity or provides a proven implementation for a hard domain problem.
- Keep `package.json` and `pnpm-lock.yaml` in sync.
- Use pnpm commands for dependency updates.

## Documentation Policy

Update `README.md`, `docs/PROJECT_SPEC.md`, or a focused document under `docs/` when changing:

- setup or scripts
- the required stack
- product scope
- major directory ownership
- data architecture
- design-system conventions
- deployment assumptions
