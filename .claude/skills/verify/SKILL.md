---
name: verify
description: How to run and verify CineScope changes end-to-end (dev stack, auth email flows, browser driving)
---

# Verifying CineScope changes

## Dev stack

- API: `npm run dev:server` → Fastify on :3001 (tsx watch, hot-reloads server changes)
- Web: `npm run dev` → Vite on :5173, proxies `/api` → :3001
- The owner usually has BOTH already running — probe the ports before booting
  your own (`curl -s -o /dev/null -w "%{http_code}" localhost:3001/api/auth/refresh -X POST`
  → 401 means it's up). EADDRINUSE on boot = their stack is live and already
  serving your code via tsx watch.

## Email flows (verification / password reset)

`.env.local` holds REAL SMTP credentials — anything that sends mail through
the :3001 instance sends real email. For flows that mail links, boot an
isolated instance with SMTP disabled; the mailer then logs the links:

```bash
PORT=3999 SMTP_HOST="" SMTP_USER="" npx tsx server/index.ts > server.log
# grep "verification link for <email>" / "password reset link for <email>" in the log
```

The DB is shared (DATABASE_URL in .env.local), so tokens minted on :3999 are
honored by :3001/:5173 — useful for driving emailed-link pages in the browser.
Safe forgot/reset submissions through :3001: use a nonexistent identifier
(matches no account → nothing sent).

## Browser driving

Cypress is configured (`src/tests/cypress/e2e`), but the cached binary on this
machine is broken (`bad option: --no-sandbox`; `cypress install --force` did
not fix it, 2026-07). Fallback that works: Playwright from a scratch dir —
`npm i playwright@1.49.1 && npx playwright install chromium`, then drive
http://localhost:5173 headless with `[data-test-id=...]` selectors.

## Cleanup

Delete throwaway accounts from the project root (postgres pkg resolves there):

```bash
node -e "import('postgres').then(async ({default: postgres}) => {
  (await import('dotenv')).config({ path: ['.env.local', '.env'] });
  const sql = postgres(process.env.DATABASE_URL);
  console.log(await sql\`delete from users where email like 'verify-%@example.com' returning email\`);
  await sql.end(); });"
```
