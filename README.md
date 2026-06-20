# SubVoid

SubVoid is a subscription tooling application built with Next.js, React, Tailwind CSS, shadcn-style components, Zustand, date-fns, SQLite, and JWT localStorage authentication. The current codebase implements a lightweight authenticated home page, a subconverter link generator, remote configuration management, Clash configuration generation, theme support, authenticated access, and persistent storage.

## Tech Stack

- Runtime: Node.js 20+
- Package manager: pnpm
- Framework: Next.js 16 App Router
- UI runtime: React 19
- Language: TypeScript 5 with `strict` enabled
- Styling: Tailwind CSS 4, CSS variables, `tw-animate-css`
- Component system: shadcn/base-ui style components under `components/ui`
- Icons: Hugeicons
- State: Zustand
- Dates: date-fns
- Storage: SQLite through `better-sqlite3`
- Auth: JWT stored in localStorage and sent with `Authorization: Bearer`
- Deployment target: local/self-hosted Node.js runtime

## Getting Started

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and a long random `JWT_SECRET`. The default `DATABASE_PATH` stores the SQLite file under `data/`, which is ignored by git.

For subscription conversion, set `NEXT_PUBLIC_SUBCONVERTER_DEFAULT_BACKEND` if the default `http://127.0.0.1:25500/sub?` backend is not correct for your environment.

For Clash configuration generation, set `PUBLIC_URL` to the public base URL used when issuing persistent subscription links, for example `https://subvoid.example.com`. `APP_URL` and `NEXT_PUBLIC_APP_URL` remain supported as fallbacks.

Run the development server:

```bash
pnpm dev
```

Build for production:

```bash
pnpm build
```

Docker build and release instructions are documented in `docs/DOCKER.md`.

Run lint checks:

```bash
pnpm lint
```

## Project Structure

```text
app/                  Next.js App Router routes and global styles
components/ui/        Reusable design-system primitives
features/clash/       Clash configuration generation, templates, and subscription domain
hooks/                Shared React hooks
lib/                  Shared utilities
store/                Client-side application stores
docs/                 Project specifications and architecture notes
public/               Static assets
```

## Development Rules

- Keep product-specific behavior in feature folders, `store`, or domain-specific modules.
- Keep generic UI primitives in `components/ui`; do not add business logic there.
- Use the `@/*` path alias for local imports.
- Prefer server components by default in `app`; add `"use client"` only when a component needs client state, effects, browser APIs, or event handlers.
- Use Zustand for cross-component client state. Keep local component state local.
- Use date-fns for date math and formatting. Do not hand-roll calendar arithmetic.
- Use Tailwind utility classes and existing CSS variables. Add global CSS only for tokens, resets, or truly shared behavior.
- Preserve accessible labels, keyboard behavior, focus states, and contrast when changing UI.
- Do not commit generated folders such as `.next`, `node_modules`, `coverage`, or deployment caches.

## Quality Bar

Before handing off a change:

1. Run `pnpm lint`.
2. Run `pnpm build` when routing, data loading, metadata, or shared configuration changes.
3. Manually inspect desktop and mobile layouts for UI changes.
4. Verify dark and light theme behavior when touching colors or tokens.
5. Update documentation when a change affects project conventions, setup, or architecture.

## Current Product Scope

The app currently focuses on authenticated subscription tooling:

- Minimal authenticated home page at `/`
- Theme switching
- Subscription conversion at `/converter`
- Remote configuration management at `/remote-configs`
- Clash configuration generation at `/clash`
- Clash template management at `/clash/templates`
- Persistent Clash subscriptions at `/clash/subscriptions`

Persistence is SQLite based and exposed through domain/API code. Components should not import database clients directly.

Authentication uses a localStorage JWT. Page access is guarded client-side and API routes enforce the token server-side through the `Authorization` header.
