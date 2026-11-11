# Worker API and deployment

Production preview URL: https://wazee-wa-betting-tz.stewardjackson999.workers.dev

## Runtime
- Entry point: `worker/preview.js`
- Auth client module: `worker/auth.js`
- D1 binding: `DB` → `wazee-wa-betting-tz-db`
- Firebase ID-token audience/project: `wazee-wa-betting-tz-e7183`
- No Firebase service-account key is used; the Worker verifies Firebase ID tokens with Google's published JWK set.
- Secrets are not stored in source. The Firebase project ID and Firebase web API key are public client configuration values.

## Endpoints
- `GET /health` — Worker health.
- `GET /api/health` — D1 connectivity and schema table count.
- `GET /api/v1/listings` — published listings only.
- `GET /api/v1/community/posts` — public community feed.
- `GET /api/v1/me` — authenticated profile bootstrap.
- `POST /api/v1/community/posts` — authenticated post creation.
- `POST /api/v1/seller-applications` — authenticated seller application.
- `GET /api/v1/seller-applications/me` — authenticated seller application status.

All protected endpoints require `Authorization: Bearer <Firebase ID token>`. Admin review, listing creation, sports-provider ingestion and wallet mutation routes are not enabled yet.

## Deployment
Use the Wrangler config in `wrangler.jsonc`. Deployment requires an authorized Cloudflare session or a project-scoped API token stored as a GitHub Actions secret. Never put the token in the repository.

## Current safety boundaries
- D1 contains no imported legacy Firestore data.
- No Firebase Firestore production writes.
- No live payments, purchases, seller payouts or withdrawals.
- No sports fixtures, odds or results are generated without a verified provider.
- The wallet ledger schema exists but has no live money movement endpoints.
