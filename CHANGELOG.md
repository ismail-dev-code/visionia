# Changelog

This changelog starts at the package's current `1.0.0` version and records only behavior and features found in the repository.

## [1.0.0] - 2026-11-06

### Completed

- Next.js storefront for browsing categories and products, searching, viewing product details, and managing a cart and wishlist.
- Customer registration and credentials-based login with password hashing and server-side role checks for admin routes and actions.
- Checkout with buy-now/cart flows, BDT pricing, cash on delivery, and the configured shipping/advance rules.
- Optional SSLCommerz hosted payments with server-side transaction validation and admin payment/refund operations.
- Admin pages for products, categories, orders, customers, banners, coupons, reviews, newsletter subscribers, and store settings.
- Prisma/PostgreSQL data models and committed migrations for catalog, accounts, carts, checkout, orders, payments, and related records.
- Added indexes for remaining PostgreSQL foreign-key columns, with a matching migration and regenerated empty-database SQL.
- English, Bengali, Arabic, and Hindi message dictionaries, locale-aware navigation, and Arabic right-to-left layout support.
- Product and category image references through externally hosted URLs.
- Server-side authorization on admin data services, fresh database-role checks, owner-scoped cart/order access, and verified idempotent SSLCommerz callbacks.
- Duplicate SSLCommerz callback aliases removed; the configured canonical callback path is `/api/payment/sslcommerz/*`.
- Credentials-based registration no longer returns a distinct response for an already-registered email.
- Auth.js beta dependency pinned to the lockfile's exact version; redundant bcrypt type stubs removed and production dependency advisories patched.
- `pnpm audit --prod` reports no known production dependency vulnerabilities after the patches.
- Documented Node.js 22.14.0, frozen-lockfile installation, and the migration deployment command.

### Planned

- No future roadmap items are specified in the checked-in project. No unimplemented feature is listed here as completed.

### Scope notes

- Google OAuth and outbound email delivery are not configured in the current authentication implementation.
- Docker, VPS, and hosting-provider deployment configuration are not included in the repository.
- Auth.js remains on a pinned beta release; the audit does not claim it is a stable release.
