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
- Wishlist management.
- Customer registration and login.
- Google authentication.
- Email verification.
- Customer profile and order history.
- Responsive design for mobile, tablet, and desktop.

### Admin Features

- Secure Admin Dashboard.
- Role-based access control.
- Add, edit, and delete products.
- Upload product images.
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

- Node.js
- pnpm
- Git
- Supabase account

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
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root.

Example:

```env
# Database
DATABASE_URL="YOUR_SUPABASE_DATABASE_URL"
DIRECT_URL="YOUR_SUPABASE_DIRECT_DATABASE_URL"

# Authentication
AUTH_SECRET="YOUR_AUTH_SECRET"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Email Service
RESEND_API_KEY=""
EMAIL_FROM=""

# Supabase Storage (if configured)
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
```

**Important:**

- Replace placeholder values with your actual credentials.
- Never commit `.env` to GitHub.
- Never expose database passwords or secret API keys.
- Use the exact environment variable names required by your application.

## Database Setup

Visionia uses Prisma with Supabase PostgreSQL.

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
pnpm exec prisma migrate deploy
```

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

Product images should be stored using persistent cloud storage.

If using Supabase Storage:

1. Create a storage bucket.
2. Configure appropriate access policies.
3. Upload images through an authorized server-side process.
4. Validate image type and file size.
5. Store image URLs or paths in the database.

Never expose the Supabase service-role key in client-side code.

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
- Use expiring, single-use email verification tokens.

Google authentication requires valid OAuth credentials and configured callback URLs.

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
5. Configure Google OAuth callback URLs.
6. Configure email delivery.
7. Apply database migrations:

```bash
pnpm exec prisma migrate deploy
```

8. Deploy the application.
9. Test authentication, product management, image uploads, cart, checkout, and admin access.

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

### Google Login Not Working

Verify:

- Google Client ID.
- Google Client Secret.
- OAuth callback URL.
- Authentication provider configuration.

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
