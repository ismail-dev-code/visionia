# Visionia setup and deployment

This guide is based on the checked-in application, Prisma schema, and migration history. Visionia is a Next.js 16 app using Prisma 6 and PostgreSQL. The repository has no Dockerfile, Compose file, VPS service definition, or Google OAuth provider, so those are not presented as ready-made deployments or features.

## 1. Prerequisites

- Node.js 22.14.0 or newer (the checked-in `.nvmrc` selects 22.14.0).
- pnpm 10.17.0, matching `package.json`.
- Git.
- A PostgreSQL database. Supabase PostgreSQL is the documented hosted option; a local PostgreSQL instance also works.
- `psql` is optional and is only needed if you want to run the demo SQL from a terminal. Supabase's SQL Editor is an alternative.

Check the installed tools:

```sh
node --version
pnpm --version
```

## 2. Get the project and install dependencies

```sh
git clone <YOUR_REPOSITORY_URL>
cd Visionia
corepack enable
corepack prepare pnpm@10.17.0 --activate
pnpm install --frozen-lockfile
```

Keep `pnpm-lock.yaml` with the project and use the frozen install in CI/deployment so package versions remain consistent.

## 3. Configure PostgreSQL

### Supabase

1. Create a Supabase project and wait for its PostgreSQL database to be ready.
2. In the Supabase dashboard, copy the PostgreSQL connection strings. Use a pooled connection for `DATABASE_URL` when appropriate for the app runtime, and a direct or session-mode connection for `DIRECT_URL` for Prisma schema and migration operations.
3. Keep the two URLs private. URL-encode special characters in the database password. Use the exact host, port, username, and query parameters supplied for your Supabase project.
4. Confirm the database's network access settings allow the app host to connect.

`prisma/schema.prisma` reads both variables. A local PostgreSQL database can use its connection string for both values.

## 4. Set environment variables

Copy the root `.env.example` to `.env` and replace placeholders with values for your environment. Keep `.env` out of source control; it is ignored by `.gitignore`. A root `.env` is read by both Next.js and the Prisma CLI.

Required for the app and Prisma:

- `DATABASE_URL`: PostgreSQL connection used by the app.
- `DIRECT_URL`: direct/session PostgreSQL connection used by Prisma operations.
- `AUTH_SECRET`: private Auth.js signing/encryption secret. Generate a unique, random value, for example with `openssl rand -base64 32`.

The payment callback URL variables are optional unless you enable SSLCommerz. `NEXT_PUBLIC_SITE_URL` is the preferred setting. `AUTH_URL` and `NEXTAUTH_URL` are fallback values in the payment URL resolver; they do not enable a login provider.

`NEXT_DEPLOYMENT_ID` is optional for self-hosted deployments and can be set to a unique release identifier. Vercel supplies `VERCEL_DEPLOYMENT_ID` automatically. `NODE_ENV` is set by Next.js; do not normally set it in `.env`.

## 5. Generate Prisma Client and apply migrations

For a fresh database or an existing database that needs the committed migrations:

```sh
pnpm exec prisma validate
pnpm exec prisma generate
pnpm db:migrate
```

The repository includes migrations for the schema. `migrate deploy` applies pending migrations without resetting data. For local schema development, use `pnpm exec prisma migrate dev` to create and apply a migration, then commit that migration with the schema change. Do not use `prisma migrate reset` on a database with data you need, and do not use `prisma db push` as a substitute for the checked-in production migration history.

The root `database/schema.sql` is generated from `prisma/schema.prisma` and is intended for a brand-new, disposable database when applying SQL directly. Do not apply it to a database that already has these tables, or mix it with `migrate deploy` on the same database unless you deliberately baseline the schema first. For normal app setup, prefer the migrations above.

## 6. Start local development

After setting `.env` and applying the migrations:

```sh
pnpm dev
```

Visit <http://localhost:3000>. Stop the development server with `Ctrl+C`.

Useful project scripts:

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Next.js development server |
| `pnpm build` | Generate Prisma Client and build the app |
| `pnpm start` | Serve a production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run the TypeScript check |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:migrate` | Apply committed Prisma migrations with `migrate deploy` |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:seed` | Sync official categories and initialize the product SKU counter |

The existing `pnpm db:seed` script does not add demo products or an admin. It also deactivates categories whose slugs are not among the five official categories; review that behavior before running it on a database with custom categories.

## 7. Add safe demo catalog data

`database/seed.sql` inserts the five official electronics categories, ten sample products with BDT prices, and the SKU counter. It creates no users, passwords, orders, or payment records. Its fixed IDs and `ON CONFLICT` handling make it safe to rerun against the same demo database.

First create the schema either by applying the migrations in section 5 (recommended), or by running `database/schema.sql` against a new, empty demo database. Then run the seed using Supabase SQL Editor, or from a terminal where `DIRECT_URL` is available:

```sh
psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f database/seed.sql
```

For PowerShell, use:

```powershell
psql "$env:DIRECT_URL" -v ON_ERROR_STOP=1 -f database/seed.sql
```

Do not run the schema file against a database containing application data.

## 8. Create the first ADMIN account

There is no admin-creation CLI or seeded admin account. Public registration assigns the `CUSTOMER` role. To create the first administrator safely:

1. Start the app and register using the normal `/register` page with an email account you control.
2. In Supabase SQL Editor (or a trusted PostgreSQL session), confirm the exact account exists and is still a customer:

   ```sql
   SELECT "id", "email", "role"
   FROM "User"
   WHERE lower("email") = lower('your-registered-email@example.com');
   ```

3. Only after verifying that row, promote that exact account:

   ```sql
   UPDATE "User"
   SET "role" = 'ADMIN'
   WHERE lower("email") = lower('your-registered-email@example.com')
     AND "role" = 'CUSTOMER'
   RETURNING "id", "email", "role";
   ```

   Confirm that exactly one expected row is returned. If no row or an unexpected row is returned, stop and investigate rather than changing another account.
4. Sign out and sign back in so the new role is reflected in the Auth.js session.

Do not add an admin password directly to SQL: the registration flow hashes passwords before storing them. Keep admin promotion restricted to trusted database operators.

## 9. Optional Google authentication

Google sign-in is **not implemented in the current authentication configuration**. The configured Auth.js provider is credentials-based. Adding Google credentials in the environment alone will not enable Google login.

## 10. Optional SSLCommerz payments

The app implements hosted SSLCommerz payments, server-side transaction validation, and admin payment/refund operations. The credentials are optional for development without online payments.

For sandbox testing, obtain sandbox merchant credentials and set:

```dotenv
SSLCOMMERZ_STORE_ID="your-sandbox-store-id"
SSLCOMMERZ_STORE_PASSWORD="your-sandbox-store-password"
SSLCOMMERZ_IS_SANDBOX="true"
NEXT_PUBLIC_SITE_URL="https://your-public-test-origin.example"
```

The callback origin must be an absolute URL. The payment gateway must be able to reach the callback routes; plain `localhost` is not reachable by the gateway. In production, the app enforces HTTPS for this URL. Store secrets only in the server's environment/secret manager, never in client code or source control.
The app constructs its success, failure, cancellation, and IPN callback URLs under `/api/payment/sslcommerz/`. These are the only configured callback routes.

For live payments, use the merchant's approved live credentials, set `SSLCOMMERZ_IS_SANDBOX="false"`, and use the production HTTPS site origin. Verify the merchant account and callback behavior before accepting real payments. Do not mix sandbox credentials with live mode or vice versa.

## 11. Production deployment on a VPS

There is no VPS deployment configuration committed in this repository. A self-managed deployment is a manual operational setup, not a preconfigured or validated one-click deployment. The app does include the standard `pnpm build` and `pnpm start` scripts.

At a high level:

1. Provision a supported Linux VPS with Node.js 22.14.0 or newer, pnpm 10.17.0, and a network path to PostgreSQL. Use a dedicated, non-root service account.
2. Clone a reviewed release of the repository and install dependencies with `pnpm install --frozen-lockfile`.
3. Configure the production environment outside Git. Set `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, and `NEXT_PUBLIC_SITE_URL` to production values. Add the SSLCommerz variables only if live payments are enabled.
4. Apply the committed migrations and build:

   ```sh
   pnpm exec prisma migrate deploy
   pnpm build
   ```

5. Run `pnpm start` under a process manager such as systemd or a managed Node.js service. Configure the process manager to start in the project directory and load the protected environment. Keep the app bound behind a reverse proxy rather than exposing the Node port directly.
6. Configure Nginx or another reverse proxy with TLS, forwarding to the Next.js server, and point the domain's HTTPS origin at the app. Set `NEXT_PUBLIC_SITE_URL` to that exact origin so payment callbacks use it.
7. Test registration/login, admin access, catalog, checkout, payment callbacks (sandbox first), and backups/restore procedures before launch.

The process manager, reverse proxy, TLS certificates, firewall, backups, and monitoring are host-specific and are not supplied here. Review current Next.js and hosting-provider deployment guidance for the chosen VPS.

## 12. Docker deployment

Docker is **not configured in this repository**: there is no Dockerfile or `docker-compose.yml`. No Docker deployment is claimed or documented as a working setup. A container deployment would first need an intentionally designed and tested container configuration, including runtime environment handling and Prisma migration execution.

## 13. Branding

- Replace `public/visionia-logo.png` with your own logo while preserving the referenced asset path, or update the component that uses it.
- Update the site title and description in `app/layout.tsx`.
- Update translated storefront text in `messages/en.json`, `messages/bn.json`, `messages/ar.json`, and `messages/hi.json`.
- Update the official categories in `lib/constants/categories.ts`; update `database/seed.sql` too if the demo catalog should use the same category set.
- Adjust the storefront styles in `app/globals.css` and the relevant components. Product images are entered as externally hosted HTTPS URLs in the admin; the app does not upload image files.

## 14. Troubleshooting

| Symptom | Checks |
| --- | --- |
| Prisma reports a missing `DATABASE_URL` or `DIRECT_URL` | Confirm both are present in the root `.env`, have valid PostgreSQL URL syntax, and point to the intended project. |
| Database connection timeout/authentication failure | Check the Supabase host/port, URL-encoded password, network restrictions, and whether the connection mode matches the URL. |
| Relation/table does not exist | Run `pnpm exec prisma migrate status` and `pnpm exec prisma migrate deploy` against the intended database. Do not reset a database to fix a connection or migration-target mistake. |
| Prisma Client is stale or generation fails on Windows | Stop the dev server and other Node processes that may lock Prisma files, then run `pnpm exec prisma generate` again. |
| SSLCommerz is unavailable | Check that both merchant credentials are set, `SSLCOMMERZ_IS_SANDBOX` is exactly `true` or `false`, and `NEXT_PUBLIC_SITE_URL` is absolute. Production requires HTTPS and the callback host must be reachable from the gateway. |
| Admin page redirects away | Confirm the registered user's database role is `ADMIN`, then sign out and back in to refresh the JWT session. |

## 15. Final validation

Run these checks before deployment:

```sh
pnpm exec prisma validate
pnpm exec prisma migrate status
pnpm typecheck
pnpm lint
pnpm build
```

Then manually test the critical storefront and admin workflows using a non-production/demo database.
