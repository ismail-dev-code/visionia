# Visionia

**Visionia** is a modern electronics accessories e-commerce website built with Next.js, TypeScript, Tailwind CSS, Prisma, and Supabase PostgreSQL.

Visionia aims to provide customers with a smooth shopping experience and administrators with powerful tools to manage products, categories, orders, and store operations.

## Features

### Customer Features

- Browse products and categories.
- View detailed product information.
- Search, filter, and sort products.
- Add products to cart.
- Buy Now functionality.
- Update cart quantities and remove products.
- SSLCommerz hosted online payments with the official `sslcommerz-lts` Node.js SDK and server-side transaction validation.
- Cash on delivery with a ৳50 advance when shipping is charged; the advance is credited toward the delivery balance.
- Wishlist management.
- Customer registration and login.
- Signed-in customers can view their own order confirmation pages.
- Responsive design for mobile, tablet, and desktop.

### Admin Features

- Secure Admin Dashboard.
- Role-based access control.
- Add, edit, and delete products.
- Manage product images with externally hosted HTTPS URLs.
- Manage product categories.
- Manage inventory and stock.
- Manage customer orders.
- Manage customers.
- Manage banners and promotions.
- Manage coupons and discounts.

### Multilingual Support

Visionia is designed to support four languages:

- English (en)
- Bengali (bn)
- Arabic (ar)
- Hindi (hi)

Additional internationalization features:

- Language selector.
- Locale-aware navigation.
- Arabic Right-to-Left (RTL) support.
- Translated customer-facing content.
- Locale-aware date and number formatting.

## Technology Stack

| Technology          | Purpose                        |
| ------------------- | ------------------------------ |
| Next.js             | Frontend and backend framework |
| TypeScript          | Type safety                    |
| Tailwind CSS        | Styling                        |
| pnpm                | Package manager                |
| Prisma              | ORM                            |
| Supabase PostgreSQL | Database                       |
| NextAuth / Auth.js  | Authentication, if configured  |
| Lucide React        | Icons                          |

## Getting Started

### Prerequisites

Make sure you have installed:

- Node.js 22.14.0 (see `.nvmrc`)
- pnpm 10.17.0
- Git
- A PostgreSQL database (Supabase is supported)

Check your versions:

```bash
node --version
pnpm --version
```

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd visionia
```

### 2. Install Dependencies

```bash
pnpm install --frozen-lockfile
```

`pnpm-lock.yaml` is the authoritative lockfile. Although an npm `package-lock.json` is included for tooling compatibility, npm does not apply the repository's SSLCommerz SDK patch; use pnpm for supported installs and deployments.

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and replace the required placeholders. In PowerShell, use `Copy-Item .env.example .env`.

Example:

```env
# Required PostgreSQL connection strings
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"

# Required Auth.js secret; generate a unique value with `openssl rand -base64 32`.
AUTH_SECRET="replace-with-a-random-secret"

# Optional callback origin and URL fallbacks
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"

# Optional: configure only when enabling SSLCommerz payments
SSLCOMMERZ_STORE_ID="replace-with-your-store-id"
SSLCOMMERZ_STORE_PASSWORD="replace-with-your-store-password"
SSLCOMMERZ_IS_SANDBOX="true"

# Optional: use a unique ID for self-hosted deployments; Vercel sets its own.
NEXT_DEPLOYMENT_ID="replace-with-a-unique-deployment-id"
VERCEL_DEPLOYMENT_ID=""

# Normally set automatically by Next.js
NODE_ENV="development"
```

**Important:**

- `DATABASE_URL`, `DIRECT_URL`, and `AUTH_SECRET` are required for normal setup.
- SSLCommerz credentials and callback origin are optional unless online payments are enabled.
- Never commit `.env` to GitHub.
- Never expose database passwords or secret API keys.
- Use the exact environment variable names required by your application.
- Keep SSLCommerz credentials server-side. Configure sandbox credentials for testing, then switch `SSLCOMMERZ_IS_SANDBOX` to `false` only after the merchant account is approved for live payments.
- Set `NEXT_PUBLIC_SITE_URL` alongside the server credentials (`.env` or `.env.local` for local development). It must be the public HTTPS origin in production so payment callbacks return to the correct site.
- For self-hosted deployments, set `NEXT_DEPLOYMENT_ID` to a unique value for each release so Next.js can refresh clients when Server Action versions change. Vercel deployments use `VERCEL_DEPLOYMENT_ID` automatically.

### SSLCommerz and COD

The checkout can collect the full order total through SSLCommerz or collect a ৳50 advance for COD orders with nonzero shipping. The advance is credited against shipping, and any remaining balance is due at delivery. When shipping is free, COD does not require an advance.

SSLCommerz credentials are not included in the repository. Payment callbacks validate transactions server-side before marking payments paid. Admin order details include protected transaction/session queries and refund initiation/status checks. A submitted refund remains pending until its gateway status is queried and verified.

To enable payments, add the merchant environment variables above and apply pending migrations with `pnpm db:migrate`. Do not use `prisma migrate reset` on a database with existing data.

## Database Setup

Visionia uses Prisma with Supabase PostgreSQL.
The committed Prisma migrations are the source of truth for application setup. `database/schema.sql` is generated from the Prisma schema and is intended only for an empty database; do not apply it to a migrated or populated database.

### Validate Prisma Schema

```bash
pnpm exec prisma validate
```

### Generate Prisma Client

```bash
pnpm exec prisma generate
```

### Apply Development Migrations

```bash
pnpm exec prisma migrate dev
```

### Apply Production Migrations

```bash
pnpm db:migrate
```

For a demo catalog, apply the migrations, then run `database/seed.sql` against a fresh demo database using Supabase SQL Editor or `psql`. This adds categories and sample products only. `pnpm db:seed` initializes official categories and the SKU counter; it does not create products or an admin account.

### Open Prisma Studio

```bash
pnpm exec prisma studio
```

**Database Safety:** Never run `prisma migrate reset` on a database containing data you want to preserve.

## Run the Application

Start the development server:

```bash
pnpm dev
```

Open your browser:

```text
http://localhost:3000
```

To stop the server:

```bash
Ctrl + C
```

For a production run, first configure the production environment and apply the committed migrations, then build and start:

```bash
pnpm db:migrate
pnpm build
pnpm start
```

## Available Commands

| Command                     | Description                    |
| --------------------------- | ------------------------------ |
| `pnpm dev`                  | Start development server       |
| `pnpm build`                | Build production application   |
| `pnpm start`                | Start production server        |
| `pnpm lint`                 | Run lint checks, if configured |
| `pnpm exec tsc --noEmit`    | Check TypeScript types         |
| `pnpm exec prisma validate` | Validate Prisma schema         |
| `pnpm exec prisma generate` | Generate Prisma Client         |
| `pnpm db:migrate`           | Apply committed migrations     |
| `pnpm exec prisma studio`   | Open Prisma Studio             |

Run `pnpm run` to see all available project scripts.

## Internationalization

Visionia supports four planned locales:

| Language | Locale | Direction |
| -------- | ------ | --------- |
| English  | en     | LTR       |
| Bengali  | bn     | LTR       |
| Arabic   | ar     | RTL       |
| Hindi    | hi     | LTR       |

Suggested translation structure:

```text
messages/
├── en.json
├── bn.json
├── ar.json
└── hi.json
```

When adding new website content:

1. Add translation keys to all supported languages.
2. Use the existing translation helper.
3. Avoid hardcoded interface text.
4. Test Arabic RTL layout.
5. Preserve the selected language during navigation.

## Product Image Management

Administrators add product images by entering HTTPS image URLs in the product form. The main and additional image URLs, primary-image selection, and display order are stored as `ProductImage` records in PostgreSQL. Visionia does not upload image files or require an image-hosting API key.

## Authentication and Authorization

Visionia uses two intended user roles:

- `CUSTOMER`
- `ADMIN`

Security requirements:

- New public registrations should receive the CUSTOMER role.
- Only trusted server-side processes can grant ADMIN privileges.
- Protect admin routes and server actions.
- Verify permissions on the server.
- Prevent customers from modifying their own roles.
- Use secure authentication sessions.

The current sign-in provider is email/password credentials. Google OAuth and email verification are not implemented.

## Project Structure

A typical project structure:

```text
visionia/
├── app/
│   ├── admin/
│   ├── shop/
│   ├── cart/
│   ├── checkout/
│   └── ...
├── components/
│   ├── layout/
│   ├── ui/
│   └── ...
├── lib/
├── messages/
│   ├── en.json
│   ├── bn.json
│   ├── ar.json
│   └── hi.json
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   └── visionia-logo.svg
├── .env
├── .env.example
├── package.json
├── pnpm-lock.yaml
└── README.md
```

Actual folders and routes may differ depending on the implementation.

## Responsive Design

Visionia is designed to work across:

- Mobile phones.
- Tablets.
- Laptops.
- Desktop computers.
- Large desktop displays.

All pages, forms, product cards, navigation menus, and checkout components should adapt to different screen sizes.

## Quality Checks

Before deployment, run:

```bash
pnpm exec prisma validate
pnpm exec prisma generate
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

If a script is not configured, use the corresponding command available in `package.json`.

Also test important customer and admin workflows manually.

## Deployment

Recommended deployment workflow:

1. Push the project to GitHub.
2. Connect the repository to Vercel or another Next.js-compatible hosting provider.
3. Configure environment variables.
4. Configure production database access.
5. Apply database migrations:

```bash
pnpm db:migrate
```

6. Build and deploy the application.
7. Test credentials-based authentication, product management, cart, checkout, payment callbacks (sandbox first), and admin access.

Never publish production credentials.

## Security Guidelines

- Keep `.env` private.
- Never expose secret keys.
- Validate user input on the server.
- Calculate product prices on the server.
- Verify stock before order creation.
- Protect admin operations.
- Validate uploaded files.
- Use secure authentication practices.
- Keep dependencies updated.
- Use a trusted payment provider for payment processing.

## Troubleshooting

### Prisma Generate Error on Windows

If Prisma Client generation fails:

1. Stop the Next.js development server.
2. Close other terminals running the project.
3. Close processes locking Prisma files.
4. Run:

```bash
pnpm exec prisma generate
```

### Database Table Does Not Exist

Check your database connection and migration status:

```bash
pnpm exec prisma migrate status
```

Ensure the correct Supabase project is configured and migrations have been applied.

### Environment Variable Changes Not Working

Restart the Next.js development server after updating `.env`.

### Authentication Configuration

The current app supports email/password registration and login only. Google OAuth and email delivery are not implemented; adding OAuth or email environment variables will not enable those features.

## Contributing

1. Create a new feature branch.
2. Implement your changes.
3. Run relevant checks.
4. Test the affected functionality.
5. Submit a pull request with a clear description.

## License

Add the appropriate license before distributing or publishing this project.

---

**Visionia — Smart Electronics. Better Life.**
