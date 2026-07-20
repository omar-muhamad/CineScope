---
name: verify
description: How to run and verify CineScope changes end-to-end (dev stack, magic-link auth flows, browser driving)
---

# Verifying CineScope changes

## Dev stack

- Primary: `npm run dev` → `vercel dev` on :3000 — one origin serving the Vite
  SPA, the two serverless functions (`api/auth/[...all].ts`, `api/saved.ts`),
  and the vercel.json rewrites (incl. the `/api/saved/:list/:media/:id` DELETE
  mapping). Requires a linked Vercel project (`vercel login` + `vercel link`,
  one-time, interactive — only the owner can do it).
- UI-only fallback: `npm run dev:web` → Vite on :5173, proxies `/api` → :3000.
  The DELETE rewrite does NOT exist in this mode; full API testing happens on
  :3000.
- No linked Vercel project? The functions are plain web handlers — mount
  `auth.handler` and the `api/saved.ts` GET/POST/DELETE exports on a scratch
  `node:http` server on :3000 (reproduce the DELETE rewrite) and drive that.
- Probe before booting your own: `curl -s localhost:3000/api/auth/ok` →
  `{"ok":true}` means a stack is already up.

## Auth email flows (magic link / change email)

`.env.local` holds REAL Gmail SMTP credentials — anything that sends mail
through a normally-booted stack sends real email. To test flows that mail
links, boot with SMTP disabled; the mailer then logs the links to the
terminal:

```bash
SMTP_HOST="" npm run dev
# grep "magic link for <email>" / "verification link for <email>" in the output
```

Opening the logged `magic-link/verify` URL in a browser (or curl with a cookie
jar) completes sign-in; `verify-email?token=...` confirms an email change.
POSTs to `/api/auth/*` need an `origin: http://localhost:3000` header (CSRF
check). Rate limit: 5 magic-link sends / 15 min per IP, stored in the
`rate_limit` table — delete its rows if a test run exhausts the bucket.

## Browser driving

Cypress is configured (`src/tests/cypress/e2e`, expects :3000), but the cached
binary on this machine is broken (`bad option: --no-sandbox`;
`cypress install --force` did not fix it, 2026-07). Fallback that works:
Playwright from a scratch dir — `npm i playwright@1.49.1 && npx playwright
install chromium`, then drive http://localhost:3000 headless with
`[data-test-id=...]` selectors.

## Cleanup

Delete throwaway accounts from the project root (postgres pkg resolves there;
the Better Auth user table is singular `user`, sessions/accounts cascade):

```bash
node -e "import('postgres').then(async ({default: postgres}) => {
  (await import('dotenv')).config({ path: ['.env.local', '.env'] });
  const sql = postgres(process.env.DATABASE_URL);
  console.log(await sql\`delete from \"user\" where email like 'verify-%@example.com' returning email\`);
  await sql.end(); });"
```
