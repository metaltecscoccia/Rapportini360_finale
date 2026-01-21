<!-- Help AI agents get productive in this repository. Keep updates concise. -->
# Copilot instructions — Rapportini360 (DailyReportify2)

Purpose: provide focused, actionable context so an AI coding agent can be immediately productive.

- **Big picture / architecture**
  - Backend: Express app in `server/` — entry `server/index.ts`. API routes are registered in `server/routes.ts` and rely on the `storage` abstraction implemented in `server/storage.ts`.
  - Database: PostgreSQL accessed via `drizzle-orm` in `server/db.ts`. Schemas and Zod validation live in `shared/schema.ts` (types + `createInsertSchema` usage).
  - Frontend/mobile: Vite-based client in `client/` with Capacitor integration under `android/`. Mobile build hooks exist in `package.json` (`mobile:build`, `mobile:run`).
  - Object storage & media: Cloudinary configured in `server/routes.ts` and `@google-cloud/storage` is available in deps.

- **Where to make changes**
  - API surface and validation: `server/routes.ts` (handlers) + `shared/schema.ts` (drizzle table defs + zod schemas). Prefer changing types/validation in `shared/schema.ts` and update route parsing accordingly.
  - DB logic and transactional rules: `server/storage.ts` (single canonical place for DB operations). Modify here for queries/cascade deletes and business logic.
  - DB connection/migration: `server/db.ts` (constructs DATABASE_URL from env if missing). Use `npm run db:push` for drizzle-kit push.

- **Important developer workflows / commands**
  - Dev server (fast feedback): `npm run dev` — runs `tsx server/index.ts` (no build step).
  - Full build: `npm run build` — runs Vite build for client and bundles server via `esbuild` into `dist/`.
  - Start production: `npm run start` — runs `node dist/index.js` (expects `DATABASE_URL`, `SESSION_SECRET`).
  - Typecheck: `npm run check` (runs `tsc`).
  - DB migrations: `npm run db:push` (drizzle-kit).
  - Mobile: `npm run mobile:build` / `npm run mobile:run` (Vite + Capacitor sync/run).

- **Environment & deployment notes**
  - Required in production: `DATABASE_URL`, `SESSION_SECRET`. `server/index.ts` will exit if missing.
  - `server/db.ts` will build a connection string from `PGHOST/PGUSER/PGPASSWORD/PGDATABASE` if `DATABASE_URL` is not set. Neon/managed DBs require SSL (`ssl.rejectUnauthorized=false` in pool).
  - Sessions: `express-session` with `connect-pg-simple` in production (Postgres-backed); memory store in dev.
  - CSP / security headers and rate limiting are enforced in `server/index.ts` and `server/routes.ts`.

- **Project-specific conventions & gotchas**
  - Validation-first: routes validate with Zod schemas exported from `shared/schema.ts` (e.g., `insertDailyReportSchema`). Update Zod schemas there, don't duplicate validation in routes.
  - `organizationId` is derived from session in APIs: most insert schemas omit `organizationId` and route/storage functions set it from `req.session.organizationId`.
  - Dates: daily-report dates are stored as `YYYY-MM-DD` strings. Storage code often parses dates at noon to avoid timezone issues (see `server/storage.ts`). Follow that pattern for new date utilities.
  - Hours & numeric fields: many insert schemas accept strings or numbers and transform to canonical string/numeric forms (see `insertOperationSchema`, `insertFuelRefillSchema` in `shared/schema.ts`). When adding fields, mirror this tolerant pattern.
  - Language & domain: API messages and enums use Italian values (e.g., status values "In attesa" / "Approvato", absence codes `A, F, P, M, CP, L104`). Preserve these when editing domain logic.
  - Photos: `operations.photos` is an array of photo paths stored in object storage; uploads use multer memory storage and Cloudinary in `server/routes.ts`.

- **Integration points external to repo**
  - Cloudinary: `CLOUDINARY_*` env vars used in `server/routes.ts`.
  - Google Cloud Storage: `@google-cloud/storage` is in dependencies (see `server/objectStorage.ts`).
  - Hosting: repository references Railway/Neon style databases; expect `DATABASE_URL` with SSL.

- **Examples of common code edits**
  - Add a new API endpoint: update `server/routes.ts`, validate with a Zod schema added to `shared/schema.ts`, and implement DB logic in `server/storage.ts`.
  - Change a DB column/type: update `shared/schema.ts` (drizzle table def + insert/update schemas), then add/adjust migration via `drizzle-kit` and `npm run db:push`.

- **Quick file links**
  - Backend entry: [server/index.ts](server/index.ts)
  - Routes & handlers: [server/routes.ts](server/routes.ts)
  - DB + ORM: [server/db.ts](server/db.ts)
  - Storage abstraction: [server/storage.ts](server/storage.ts)
  - Shared schema + Zod: [shared/schema.ts](shared/schema.ts)
  - Project scripts: [package.json](package.json)

If anything here is unclear or you want more detail on a specific area (auth flows, photo handling, or mobile build), tell me which area and I'll expand the doc or add short examples.
