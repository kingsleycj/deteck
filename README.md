# DETECK

Medicine verification for Nigeria. Anyone can check a pack's serial number against the records its manufacturer shared, see the pack's recorded journey and recall status, report a suspected fake and, in the beta, compare photos of the pack with the manufacturer's packaging. Manufacturers, pharmacies and distributors keep the records; the DETECK team reviews and corrects them.

**New here? Read [docs/START-HERE.md](docs/START-HERE.md) first.** Then [docs/TESTING-GUIDE.md](docs/TESTING-GUIDE.md) to test every flow, [docs/SETUP-KEYS.md](docs/SETUP-KEYS.md) for the outside accounts and [docs/DEPLOY.md](docs/DEPLOY.md) to deploy. Everything else is in [docs/reference/](docs/reference/).

## Layout

| Folder          | What it is                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| `apps/web`      | The SvelteKit website: public pages, manufacturer workspace, pharmacy portal, DETECK console, REST API |
| `apps/worker`   | Background jobs: imports, emails, webhooks, recall alerts, hourly maintenance                          |
| `packages/core` | Domain logic, database schema and migrations, wording in five languages, tests and scripts             |

Stack: SvelteKit 3 (Svelte 5, adapter-node), TypeScript run directly by Node 24, Postgres 18 with Drizzle, Better Auth (organisations, TOTP), pg-boss, Cloudflare R2, Resend, Claude for the packaging check, Vitest and Playwright. pnpm workspaces.

## Local setup

Needs Node 24, pnpm 10 and Docker.

```sh
pnpm install                  # also installs the git hooks
cp .env.example .env          # fill the three secrets: openssl rand -base64 32
pnpm db:start                 # Postgres 18 on localhost:5435 (deteck, deteck_test, deteck_e2e)
pnpm db:reset --yes           # migrations, demo data and a demo account for every role
pnpm dev                      # http://localhost:5173 (JOBS_IN_WEB=true runs jobs in the website)
pnpm demo:code                # the current two-step sign-in code of every demo account
```

The demo accounts (password `Demo-pass-2026!`), their API keys and backup codes are in `.data/demo-accounts.json`; the table is in [docs/TESTING-GUIDE.md](docs/TESTING-GUIDE.md). Demo serials: `7K4M9QX2TB8D` (valid, full journey), `3M8P41KD7Q2X` (expired), `A7R2C9L4E1DX` (recalled), `TW1N2026PACK` (asks for the batch: `ML-2604`), `ZZZZ8888ZZZZ` (unrecognised). The full list prints at the end of `pnpm db:reset`. Emails print in the terminal while `EMAIL_DRIVER=log`. Test spreadsheets, delivery codes, photos and code images are in `test-data/`.

Switches: `FEATURE_REPORTS="on"` brings back "Report a suspected fake" (off for now). `SHOWREEL_URL` puts the DETECK film on the landing page (a file in `apps/web/static/media/`; until then the page shows a placeholder).

Packaging check locally: set `FEATURE_PACKAGING_AI=pilot` and `PILOT_ACCESS_CODE`, then open `/pilot/<code>` once. Without `ANTHROPIC_API_KEY` it always answers "Can't tell" (a stub), so the flow works with no API cost.

## Commands

| Command                                     | What it does                                                                                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev` / `pnpm dev:worker`              | Website (and, if `JOBS_IN_WEB=false`, the worker) in development                                                                             |
| `pnpm build` / `pnpm start` / `pnpm worker` | Build and run the website; run the worker                                                                                                    |
| `pnpm check`                                | Type check every package                                                                                                                     |
| `pnpm lint` / `pnpm format`                 | Prettier and ESLint                                                                                                                          |
| `pnpm test:unit`                            | Unit tests, including that every language has every sentence                                                                                 |
| `pnpm test:db`                              | Database tests against `TEST_DATABASE_URL`, rebuilt from the migrations each run                                                             |
| `pnpm test:e2e`                             | Playwright on a fresh `E2E_DATABASE_URL`: public pages on mobile and desktop, the business, pharmacy and API flows, axe accessibility checks |
| `pnpm screenshots`                          | Re-captures the walkthrough screenshots in `docs/reference/walkthrough/img/`                                                                 |
| `pnpm budget`                               | Page-weight budgets against a running server: `BASE_URL=http://localhost:4173 pnpm budget`                                                   |
| `pnpm db:generate` / `pnpm db:migrate`      | Create a migration from schema changes / apply migrations                                                                                    |
| `pnpm db:reset --yes`                       | Local only: rebuild the database with demo data and demo accounts                                                                            |
| `pnpm demo:accounts` / `pnpm demo:code`     | Local only: create the demo accounts / print their current sign-in codes                                                                     |
| `pnpm backup` / `pnpm restore`              | Copy the database to the backup bucket (or `--dir`) / load a backup into an empty database (DEPLOY.md, "Backups")                            |
| `pnpm loadtest -- --url <address>`          | Many checks at once, then throughput and answer times (`scripts/load-test.js`)                                                               |
| `pnpm eval:scan <dir>`                      | Packaging-check accuracy across Claude models (below)                                                                                        |

Schema changes: edit `packages/core/src/server/db/schema.ts`, run `pnpm db:generate`, review the SQL in `packages/core/drizzle/`, then `pnpm db:migrate`. The tables `pack`, `custody_event`, `check_event` and `audit_log` are append-only: database triggers reject updates and deletes, and corrections are new records.

Translations: `packages/core/src/messages/dict/<code>.ts`, checked with `node packages/core/scripts/check-translations.ts`. See [docs/reference/translation-review.md](docs/reference/translation-review.md).

## Deploying (Render + Cloudflare)

Not deployed yet. [render.yaml](render.yaml) describes the website (which also runs the background jobs, for now), a nightly backup and Postgres in Frankfurt, for $7 a month ([docs/COSTS.md](docs/COSTS.md)). [docs/DEPLOY.md](docs/DEPLOY.md) is the order of things; [docs/SETUP-KEYS.md](docs/SETUP-KEYS.md) goes through every account. In short: create the Blueprint, add the keys listed at the top of `render.yaml` to the `deteck-shared` group by hand, save `SERIAL_HMAC_KEY` and `BETTER_AUTH_SECRET` somewhere safe, deploy the website, put Cloudflare in front (DNS only until Render issues the certificate, then proxied, TLS Full (strict), and the `EDGE_SECRET` header), run `node packages/core/scripts/create-staff.ts` from your computer against the database's external address (the free plan has no Render shell), and point uptime monitors at `/healthz` and `/healthz/jobs`.

**Git hooks** (husky): before a commit, the staged files are formatted and linted, translations checked, and anything that looks like a secret or a `.env` file is refused. Before a push: type check, lint, unit tests, database tests (when Postgres is running) and `pnpm audit`.

## Operations runbook

| Situation                                 | What to do                                                                                                                                                                                                                                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Site down                                 | Check Render events and logs, and Sentry. `/healthz` returns 503 when the database can't be reached. Roll back with Render's "Rollback" on the last good deploy                                                                                                                                         |
| A batch is recalled                       | A manufacturer admin (workspace or API), or a DETECK admin in the console, sets the batch to Recalled with the reason and source. New checks show it at once, people signed up for alerts are told, and pharmacies that received it see it in their portal. Only DETECK can reactivate a recalled batch |
| A record is wrong                         | Console → Drugs → the drug → the batch: fix the lot or dates, void a serial, or correct or cancel a supply chain record. Every correction is audited and sent to the manufacturer                                                                                                                       |
| Wrong data went live widely               | Suspend the manufacturer: its checks show "Can't confirm" while it fixes its data (it can still import). Reinstate when it's fixed                                                                                                                                                                      |
| A report of a fake comes in               | Console → Reports of fakes: assign it, refer it to NAFDAC if needed, close it with what was found                                                                                                                                                                                                       |
| Someone lost their phone and backup codes | Their company admin resets their two-step sign-in on the team page (DETECK admins can too, from the console). Confirm who is asking first                                                                                                                                                               |
| Someone is hammering the checker          | Rate limits answer 429 per device and per IP, and offer the Turnstile check. Tighten `RATE_LIMIT_*` in Render, or add a Cloudflare rule for `POST /check`                                                                                                                                               |
| Jobs stopped (`/healthz/jobs` fails)      | Render → deteck-web → Logs (deteck-worker, once there is one), then Restart. Emails, alerts and imports wait in the queue and continue                                                                                                                                                                  |
| Data lost or damaged                      | Restore the latest nightly backup into a new, empty database (`pnpm restore -- --s3 backups/<date>/`), check it on staging, then point production at it. See DEPLOY.md, "Backups and recovery"                                                                                                          |
| AI costs or answers look wrong            | Set `FEATURE_PACKAGING_AI=off` and redeploy. Serial checks are unaffected. Keep a monthly spend limit in the Anthropic console. Console → Packaging scans shows AI errors                                                                                                                               |
| An import is stuck                        | Each import is one transaction. An interrupted one is marked failed when the worker restarts, and can be run again                                                                                                                                                                                      |
| A staff member leaves                     | Console → Team → remove. Their sessions end at once; they can be restored later                                                                                                                                                                                                                         |
| Restore drill (monthly)                   | Restore Render's backup into a new database, point a preview service at it, check a known serial                                                                                                                                                                                                        |

Hourly maintenance (in whichever process runs the jobs: the website, for now) deletes expired results, old rate-limit rows, check events older than 13 months, scan photos past their retention, import files older than 90 days, expired alert addresses and old report contact details, and sends "checked unusually often" webhooks.

## Packaging-check evaluation

The packaging check stays a beta behind `FEATURE_PACKAGING_AI` until it passes the accuracy gate (D-10, R-14). Build a labelled set as described at the top of [packages/core/scripts/eval-scan.ts](packages/core/scripts/eval-scan.ts), then:

```sh
pnpm eval:scan path/to/set --stub                    # checks the set loads, no API calls
pnpm eval:scan path/to/set --out report.json         # Haiku 5.5, Sonnet 5.5 and Opus 5.5
pnpm eval:scan path/to/set --models claude-sonnet-5-5
```

It reports false alarms, misses and "can't tell" rates with 95% intervals, latency, cost per check, and a sweep of the confidence floor. Each run calls the Claude API and costs money. Reviewer verdicts in Console → Packaging scans give a second, real-world accuracy figure.
