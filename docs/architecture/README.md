# Hybrid Marketplace Architecture Blueprint

Status: **PROPOSED — not yet implemented or production-verified**

## Product boundaries

The new repository is independent from the legacy Wazee wa Betting TZ repository. The legacy application, Firebase collections, Firebase rules, Cloud Functions, and deployed site must remain unchanged.

The product is a hybrid marketplace with six primary domains:

1. **Buyer marketplace** — discover tipsters and published tips, view listing details, purchase only after a future approved payment design.
2. **Seller center** — seller application, admin approval, listing lifecycle, sales and earnings views.
3. **Social community** — profiles, posts, likes, comments, follows, reporting and moderation.
4. **Sports data** — fixtures, competitions, odds, results, source attribution, freshness and provider health.
5. **Ticket builder** — build and share selections from sourced fixtures/markets; no invented odds or results.
6. **Admin control plane** — users, seller approvals, listings, moderation, sports providers, audit events and reports.

## Proposed technical shape

- Web client: React + TypeScript + Vite, responsive mobile-first UI, light theme by default.
- API: a dedicated Cloudflare Worker for this project only; it must not reuse the Huduma za Mtandaoni Worker.
- Identity: Firebase Authentication may be reused after a configuration and compatibility review. Clients send Firebase ID tokens; the Worker verifies token signature, issuer, audience, expiry and subject.
- Data: Firebase Firestore may be reused within Spark quotas after a read-only audit. Sensitive marketplace and ledger writes must go through trusted server-side API paths, not client-writable documents.
- Media: evaluate Firebase Storage Spark limits and Cloudflare R2 separately before choosing the upload path.
- Scheduled jobs: prefer GitHub Actions or Cloudflare Cron only after quotas, reliability and operational ownership are documented. Do not assume Firebase Functions are available.
- Payments: disabled in the initial implementation. Build interfaces/contracts only after provider acceptance, compliance and payout capabilities are verified.

## Trust boundaries

- Browser is untrusted.
- Firebase ID token proves identity, not role or seller status.
- Worker validates identity and loads authoritative role/permissions from trusted storage.
- Admin and seller permissions are checked server-side on every protected operation.
- Wallet balances are derived from an append-only ledger; never trust a client-supplied balance.
- Payment callbacks must be authenticated, idempotent and reconciled before any future credit.
- All privileged actions produce audit events.

## Delivery sequence

1. Repository foundation, UX system and architecture contracts.
2. Read-only review of existing Firebase configuration, quotas and legacy data model.
3. Authentication and profile foundation.
4. Sports provider abstraction and source/freshness model.
5. Social community and moderation.
6. Seller application and listing lifecycle (no money movement).
7. Wallet ledger in sandbox/test mode only.
8. Payment-provider due diligence and legal approval gate.
9. Admin reporting, security hardening and release readiness.

## Explicit non-goals until separately approved

- No production Firebase writes or schema migration.
- No deletion or replacement of legacy code/data/functions.
- No billing-plan change or payment method.
- No real-money collection, marketplace purchases, seller payouts or withdrawals.
- No production deployment.
