# Wazee wa Betting TZ — Hybrid Marketplace

**Live website:** https://wazee-wa-betting-tz.pages.dev/

**Backend API:** https://wazee-wa-betting-tz.stewardjackson999.workers.dev

**Repository:** https://github.com/SmartServicesTZ/Wazee-wa-Betting-Tz-

## Product direction

An independent hybrid marketplace combining:
- Buyer marketplace for seller-approved, reviewed tips
- Social community with public posts, likes, comments and follows
- Sports fixtures, odds, results and ticket builder
- Seller applications, listing creation and moderation
- Admin dashboard and audit trail
- Future wallet and payouts, disabled until legal/provider approval

## Live platform foundation

- Responsive React + TypeScript interface on Cloudflare Pages
- Firebase phone/password registration and login; no Google login
- Cloudflare Worker API verifies Firebase ID tokens
- Cloudflare D1 database with the initial marketplace, identity, social, sports and ledger tables
- Public marketplace listing feed
- Authenticated community post creation
- Authenticated seller applications
- Seller role granted only after Admin approval
- Seller listing submissions enter pending review; Admin publication is required
- Server-side admin authorization and audit events for moderation
- No fabricated fixtures, odds, results, tips, seller ratings or wallet balances

## Owner actions still required

1. **First Admin:** create/sign in to the intended owner account, then confirm the Firebase UID so it can be promoted to Admin through a controlled, audited D1 operation. No account is automatically promoted.
2. **Sports provider:** create an API-Football free account, test Tanzanian/CAF league and odds coverage, then provide the API key through Cloudflare Worker secrets. Do not send the key in chat or commit it to Git.
3. **Payments and regulation:** obtain written provider approval and Tanzanian regulatory/legal clarification before enabling paid tips, checkout, commission collection, wallet funding or withdrawals.

## Payment and compliance safety

- No live money movement, checkout, buyer purchases, deposits, commission deductions, seller payouts or withdrawals are enabled.
- The proposed 10% platform commission and TSh 2,000 minimum withdrawal are not active transaction rules.
- FimiPay public terms require enhanced review and prior written approval for marketplace/multi-seller settlement; acceptance of paid betting-tip marketplaces is not verified.
- Firebase remains on Spark; no billing upgrade or payment method has been added.
- No production Firestore writes or migrations are performed.
- No changes are made to the legacy repository or its data.

## Infrastructure

- Cloudflare Pages project: `wazee-wa-betting-tz`
- Cloudflare Worker: `wazee-wa-betting-tz`
- Cloudflare D1: `wazee-wa-betting-tz-db`
- Firebase Auth project: `wazee-wa-betting-tz-e7183`
- Worker configuration: `wrangler.jsonc`
- D1 schema: `worker/migrations/0001_initial.sql`

## Quality gates

Changes are developed on feature branches. CI runs TypeScript typecheck, Worker syntax validation and production build. Production deployment is verified separately from CI. Never claim a feature is live until its production deployment has been confirmed.
