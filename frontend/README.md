# AI GRC — frontend (Milestone 1)

React 18 + TypeScript + Vite SPA, Tailwind CSS, React Router, TanStack Query. API contract: `../docs/api-m1.md`.

- `npm install` — install dependencies (Node 22).
- `npm run dev` — dev server on http://localhost:5173; `/api` is proxied to `http://localhost:8000`.
- `npm run build` — type-check (`tsc --noEmit`) and build the static site into `dist/`.
- `npm run typecheck` — type-check only. `npm run preview` — serve the built site locally.
- `docker build -t aigrc-frontend .` — nginx image serving `dist/` on port 80, proxying `/api/` to `http://backend:8000`.

Layout: `src/lib` (typed API client, auth, preferences, workspace context), `src/components/ui` (hand-written primitives),
`src/components/layout` (shell), `src/pages` (one folder or file per route). The typed API client is `src/lib/api.ts`.
