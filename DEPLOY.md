# Deploying CineScope on Vercel

One Vercel project deploys everything from this repo:

| Layer    | What Vercel builds                                                 |
| -------- | ------------------------------------------------------------------ |
| Frontend | Vite build of `src/`, served from Vercel's CDN                     |
| Backend  | Two serverless functions in `api/`: the Better Auth catch-all      |
|          | (`api/auth/[...all].ts`) and the saved-lists CRUD (`api/saved.ts`) |

The SPA and the API share one origin, so Better Auth's httpOnly session
cookie is first-party with no CORS or proxy configuration. [vercel.json](vercel.json)
adds two rewrites: the path-style saved-lists DELETE URL → query params, and
the SPA fallback (everything except `/api/*` → `index.html`). The database is
[Neon](https://neon.tech) Postgres; auth emails go out via SMTP (Gmail).

## One-time setup

### 1. Link the repo

Vercel dashboard → **Add New → Project** → import this GitHub repo (framework
preset: Vite — auto-detected). Or from the CLI: `npx vercel link`.

### 2. Environment variables (Production)

Project → **Settings → Environment Variables**:

| Var                       | Value                                                           |
| ------------------------- | --------------------------------------------------------------- |
| `DATABASE_URL`            | Neon **pooled** connection string (host has a `-pooler` suffix) |
| `BETTER_AUTH_SECRET`      | `openssl rand -base64 32`                                       |
| `BETTER_AUTH_URL`         | The deployed URL, e.g. `https://cine-scope-one.vercel.app`      |
| `GOOGLE_CLIENT_ID`        | Google OAuth web client ID                                      |
| `GOOGLE_CLIENT_SECRET`    | Google OAuth web client secret                                  |
| `SMTP_HOST`               | e.g. `smtp.gmail.com` (leave empty to log email links instead)  |
| `SMTP_PORT`               | `587` (use `465` for implicit-TLS providers)                    |
| `SMTP_USER` / `SMTP_PASS` | SMTP credentials (for Gmail: an app password)                   |
| `MAIL_FROM`               | From address (blank = send as `SMTP_USER`)                      |
| `VITE_TMDB_READ_TOKEN`    | TMDB API read access token (baked in at build time)             |
| `VITE_APP_OMDB_API_KEY`   | OMDb API key (baked in at build time)                           |

Preview deployments (optional): leave `BETTER_AUTH_URL` unset there — it falls
back to `VERCEL_URL`, so magic-link auth works on previews. Google sign-in
won't (its redirect URI isn't registered per-preview); that's expected.

### 3. Google OAuth redirect URIs

Google Cloud Console → APIs & Services → Credentials → the OAuth **web**
client → **Authorized redirect URIs** — add both:

- `http://localhost:3000/api/auth/callback/google` (local `vercel dev`)
- `https://<your-prod-domain>/api/auth/callback/google`

Copy the **client secret** from the same page into `GOOGLE_CLIENT_SECRET`
(locally in `.env.local` and in the Vercel dashboard).

### 4. Migrate the database, then deploy

Migrations run from your machine — **never** in the Vercel build (preview
builds share the Production env and would migrate the real database):

```sh
npm run db:migrate   # applies drizzle/ against DATABASE_URL_UNPOOLED (or DATABASE_URL)
git push             # Vercel deploys code matching the already-migrated schema
```

### 5. Verify

1. Open the deployed URL — the SPA loads on any deep link (e.g. `/login`),
   proving the SPA-fallback rewrite works.
2. Request a magic link — the email arrives with an `https://<prod-domain>`
   link; opening it signs you in and (first time) starts onboarding.
3. Sign in with Google — round-trips through the registered redirect URI.
4. Save a favorite, reload — the session survives (cookie is `Secure`,
   first-party) and the list persists.
5. `curl https://<prod-domain>/api/auth/ok` → `{"ok":true}`.

## Day-to-day

- Push to the production branch → Vercel builds and deploys; PRs get preview
  URLs automatically.
- Schema changes: `npm run db:generate` → review + commit the migration →
  `npm run db:migrate` → push. (Changing `additionalFields` in
  `server/auth.ts` also needs `npm run auth:schema` first.)
- Env var changes in the dashboard require a redeploy to take effect.

## Limits worth knowing (Hobby plan)

- 12 serverless functions per deployment (this repo ships 2).
- 4.5 MB request bodies — far above the ~50 KB avatar data-URLs.
- Gmail SMTP: ~500 mails/day and 1–3 s per send; fine at this scale.
- Neon scale-to-zero: the first auth call after idle can take 1–3 s while the
  database resumes (the server's `connect_timeout` covers it).
