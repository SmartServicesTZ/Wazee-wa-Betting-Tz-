# Domain and API Contract Boundaries

Status: **PROPOSED — contracts are conceptual until reviewed and tested**

## API conventions

- Base path: `/api/v1`
- JSON request/response envelopes; timestamps are ISO-8601 UTC.
- Every authenticated request carries `Authorization: Bearer <Firebase-ID-token>`.
- Worker verifies token cryptographically and resolves current permissions server-side.
- Mutating requests accept an idempotency key where retries could duplicate effects.
- Errors use stable codes; never expose secrets, provider credentials or internal stack traces.

## Domain ownership

| Domain | Owns | Must not own |
|---|---|---|
| Identity | user identity, profile basics, account state | wallet balances, seller approval |
| Seller | seller application, approval state, public seller profile | admin role assignment |
| Marketplace | tip listings, price metadata, publication status | payment settlement |
| Social | posts, comments, reactions, follows, reports | seller earnings |
| Sports | competitions, fixtures, markets, odds snapshots, results and source metadata | invented fallback data |
| Ticket builder | selections and shareable ticket representation | guaranteed outcome claims |
| Ledger | immutable entries, holds, reversals, balance projections | direct client balance writes |
| Payments | provider intents, callbacks, reconciliation | unsupported split payouts |
| Admin | moderation and privileged decisions | client-controlled permissions |
| Notifications | delivery intents and preferences | authoritative transaction state |

## Initial endpoint map

### Identity and profiles
- `GET /api/v1/me`
- `PATCH /api/v1/me/profile`

### Sellers
- `POST /api/v1/seller-applications`
- `GET /api/v1/seller-applications/me`
- `GET /api/v1/admin/seller-applications`
- `POST /api/v1/admin/seller-applications/:id/decision`

### Marketplace
- `GET /api/v1/listings`
- `GET /api/v1/listings/:id`
- `POST /api/v1/seller/listings`
- `PATCH /api/v1/seller/listings/:id`
- `POST /api/v1/admin/listings/:id/moderation`

### Community
- `GET /api/v1/community/feed`
- `POST /api/v1/community/posts`
- `POST /api/v1/community/posts/:id/comments`
- `PUT /api/v1/community/posts/:id/reaction`
- `PUT /api/v1/community/users/:id/follow`
- `POST /api/v1/community/reports`

### Sports
- `GET /api/v1/sports/competitions`
- `GET /api/v1/sports/fixtures`
- `GET /api/v1/sports/fixtures/:id/markets`
- `GET /api/v1/sports/results`

### Wallet (sandbox only until approval)
- `GET /api/v1/wallet/summary`
- `GET /api/v1/wallet/entries`
- `POST /api/v1/admin/wallet/adjustments` (admin-only, audited, disabled by default)

No public endpoint may accept an arbitrary balance, seller commission, payment-success flag, or result status from a client.

## Commission and withdrawals

- Proposed platform commission: 10% of a successfully settled eligible sale.
- Commission is calculated server-side from the immutable sale amount.
- Proposed minimum withdrawal: TSh 2,000.
- These are business rules to validate and implement only after provider, legal and accounting review.
- Withdrawal endpoints and all real-money paths remain disabled.

## Sports source contract

Every fixture, market, odds snapshot and result must preserve provider/source identifier, external event identifier, retrieval time, provider update time (if available), and status. UI must show stale/unavailable states rather than fabricate values.
