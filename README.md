# Wazee wa Betting TZ — Hybrid Marketplace

Live preview: https://wazee-wa-betting-tz.stewardjackson999.workers.dev

Repository: https://github.com/SmartServicesTZ/Wazee-wa-Betting-Tz-

## Product direction

An independent hybrid marketplace combining:
- Buyer marketplace for verified tipsters and published tips
- Social community and profiles
- Sports fixtures, odds, results and ticket builder
- Seller applications and seller listings
- Admin moderation and reporting
- Future wallet and payouts, disabled until legal/provider approval

## Current live capabilities

- Light-first responsive interface and navigation
- Firebase phone/password registration and login using the existing Firebase project
- Cloudflare Worker API with Firebase ID-token verification
- Cloudflare D1 database with 15 initial tables
- Authenticated community post creation and public feed
- Authenticated seller applications
- Seller/listing moderation API contracts and admin role gate
- No fabricated fixtures, odds, results, tips, seller ratings or wallet balances

## Current limitations / owner gates

- Sports API key and league coverage verification are pending.
- The first admin Firebase UID must be confirmed by the owner and promoted safely in D1.
- Paid tips, wallet funding, marketplace purchases, 10% commission collection and withdrawals remain disabled pending written provider approval and Tanzanian regulatory clarification.
- FimiPay's public terms require prior written approval for marketplaces/multi-seller settlement and restrict unlicensed gambling/betting. See docs/compliance/payments-and-tanzania.md.
- The Cloudflare Pages GitHub integration is created but has not produced a deployment; the active public preview is served by the dedicated Worker URL above.

## Infrastructure

- Cloudflare Worker: wazee-wa-betting-tz
- Cloudflare D1: wazee-wa-betting-tz-db
- Firebase Auth project: wazee-wa-betting-tz-e7183
- Worker config: wrangler.jsonc
- D1 schema: worker/migrations/0001_initial.sql

## Safety

- The legacy repository and its Firebase Firestore data are untouched.
- Firebase remains on Spark; no billing was enabled and no payment method was added.
- No real-money payment or withdrawal endpoints are enabled.
- No production Firebase Firestore writes or migrations.
- Secrets must never be committed to this repository.
