# Production URLs and Worker API

- Public website: https://wazee-wa-betting-tz.pages.dev/
- API Worker: https://wazee-wa-betting-tz.stewardjackson999.workers.dev
- Cloudflare Pages project: `wazee-wa-betting-tz`
- Worker entry point: `worker/preview.js`
- Firebase Auth client module: `src/lib/firebase.ts`
- D1 binding: `DB` → `wazee-wa-betting-tz-db`
- Firebase ID-token audience/project: `wazee-wa-betting-tz-e7183`

The Worker verifies Firebase ID-token signature, issuer, audience and expiry against Google's published JWK set. It does not use a Firebase service-account key. Firebase web API configuration values are public client configuration and must not be confused with server secrets.

## Implemented API endpoints

- `GET /health` — Worker health.
- `GET /api/health` — D1 connectivity and schema table count.
- `GET /api/v1/listings` — published listings with public teaser text only.
- `GET /api/v1/sports/providers` — public provider health/status metadata.
- `GET /api/v1/sports/fixtures` — stored fixtures with provider and freshness metadata.
- `GET /api/v1/sports/results` — stored results with source metadata.
- `GET /api/v1/sports/odds?fixture_id=:id` — odds snapshots for a fixture.
- `GET /api/v1/community/posts` — public community feed; authenticated requests include current follow state.
- `GET /api/v1/users/:id/profile` — public member profile and aggregate counters.
- `PUT /api/v1/me/profile` — authenticated profile edit (display name, bio, HTTPS avatar URL).
- `GET /api/v1/me` — authenticated profile bootstrap.
- `POST /api/v1/community/posts` — authenticated post creation.
- `PUT /api/v1/community/posts/:id/like` — authenticated like toggle.
- `GET /api/v1/community/posts/:id/comments` — comments for a post.
- `POST /api/v1/community/posts/:id/comments` — authenticated comment creation.
- `PUT /api/v1/users/:id/follow` — authenticated follow toggle.
- `POST /api/v1/seller-applications` — authenticated seller application.
- `GET /api/v1/seller-applications/me` — authenticated application status.
- `GET /api/v1/seller/listings/me` — seller's own listings.
- `POST /api/v1/seller/listings` — seller-only listing submission with up to 30 match selections; status starts as `pending_review`.
- `GET /api/v1/seller/listings/me` — seller's own listings and saved selections.
- `GET /api/v1/admin/summary` — admin-only system counters.
- `GET /api/v1/admin/users` — admin-only user directory.
- `POST /api/v1/admin/users/:id/status` — suspend/reactivate buyer or seller accounts; Admin accounts and self-suspension are blocked.
- `GET /api/v1/admin/audit-events` — admin-only recent audit events.
- `GET /api/v1/admin/wallet/ledger` — admin-only read-only ledger audit view; no balance mutation or money movement.
- `GET /api/v1/admin/seller-applications` — admin-only seller queue.
- `POST /api/v1/admin/seller-applications/:id/decision` — admin-only approve/reject.
- `GET /api/v1/admin/listings` — admin-only pending listing queue, including full descriptions and selections for moderation.
- `POST /api/v1/admin/listings/:id/decision` — admin-only publish/reject.

All protected endpoints require `Authorization: Bearer <Firebase ID token>`. The Worker resolves user roles from D1 and never trusts a client-supplied role. Moderation decisions are audited.

## Deployment

- Frontend: Cloudflare Pages Git-connected project, production branch `main`, build `npm run build`, output `dist`.
- API: Cloudflare Worker `wazee-wa-betting-tz`, D1 binding `DB`.
- Keep provider credentials and other secrets in Cloudflare Worker secrets only.
- No production schema migration or Firebase Firestore write is part of this deployment.

## Current safety boundaries

- D1 is a new, separate database; no legacy Firestore data was imported.
- No checkout, deposits, purchases, wallet balance mutation, commission collection, seller payout or withdrawal endpoint is enabled.
- The wallet ledger schema is a future accounting foundation only.
- Sports fixtures, odds and results are not fabricated; provider credentials and coverage tests remain pending.
