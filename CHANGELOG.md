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
- English, Bengali, Arabic, and Hindi message dictionaries, locale-aware navigation, and Arabic right-to-left layout support.
- Product and category image references through externally hosted URLs.

### Planned

- No future roadmap items are specified in the checked-in project. No unimplemented feature is listed here as completed.

### Scope notes

- Google OAuth and outbound email delivery are not configured in the current authentication implementation.
- Docker, VPS, and hosting-provider deployment configuration are not included in the repository.
