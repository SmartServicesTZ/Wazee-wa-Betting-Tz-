# Team Workstreams and Coordination

Status: **PROPOSED**

All work happens on separate branches. No contributor pushes directly to `main`. Every workstream opens a PR and documents tests, changed files, assumptions and any migration impact.

## Manus 1 — Project Lead / Technical Architect
- Own architecture, domain contracts, technical decisions and integration.
- Maintain dependency map and decision log.
- Review all PRs for cross-domain consistency, security and scope.
- Do not merge or deploy without owner approval.

## Manus 2 — UI/UX and Frontend
- Own design tokens, responsive shell, buyer marketplace, seller center, community, sports screens, ticket builder and admin UI.
- Use typed API interfaces and mock fixtures clearly labelled as demo data.
- No direct Firestore writes for wallet, payments, seller approval or admin actions.
- No fabricated real odds, live scores, results, balances or sales metrics.

## Manus 3 — Backend, Database and Security
- Own Worker API, Firebase token verification, authorization middleware, Firestore access layer, ledger model and audit events.
- Begin with threat model and read-only Firebase configuration review.
- No production schema migration, destructive writes, billing change or Functions deployment.
- Provide emulator/unit tests and explicit Spark compatibility notes.

## Manus 4 — Provider Research, Payments and QA
- Research sports data sources and payment providers, including FimiPay, using primary provider documentation and written confirmations where possible.
- Separate verified capabilities from unverified marketing claims.
- No credentials, payment calls, live transactions or provider onboarding without owner approval.
- Own test matrix, API contract tests, mobile/responsive checks and release evidence.

## Shared contracts
- API prefix `/api/v1`; all payloads documented in `docs/architecture/domain-contracts.md`.
- Identity token is Firebase ID token; backend must verify it.
- Seller status and admin role are server-authoritative.
- Wallet ledger is append-only; balances are projections, not client input.
- Sports data must include source and freshness metadata.
- All feature flags that could enable real-money flows default to OFF.

## PR checklist
- Scope and module owner identified.
- No secrets or production data included.
- Tests and commands recorded.
- Spark compatibility assessed.
- No legacy repo or production Firebase changes.
- Screenshots for visual changes.
- Explicit statement whether any external service or billing is required.
