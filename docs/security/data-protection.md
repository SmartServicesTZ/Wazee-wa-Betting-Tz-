# Security, Data Protection and Operational Gates

Status: **RECOMMENDED controls — not yet implemented or audited**

## Identity and authorization

- Verify Firebase ID tokens at the Worker boundary: signature, issuer, audience, expiry and subject.
- Treat all browser input as untrusted.
- Resolve roles and seller approval from authoritative server-side records.
- Never authorize based only on a client-supplied `role`, `isAdmin`, `isSeller` or custom UI state.
- Apply least privilege to admin, moderation and seller actions.
- Require re-authentication or stronger verification for sensitive account changes when supported.

## Wallet and payment safety

- Ledger entries are append-only; corrections use compensating entries.
- Derive available, pending and held balances from ledger entries.
- Use idempotency keys and provider transaction IDs to prevent duplicate credits.
- Verify provider callback signatures and reconcile status server-to-server.
- Never trust redirect success pages or client-side payment callbacks.
- No live payment collection, split payment, escrow, commission settlement or mobile-money withdrawal until provider approval and legal/compliance review are documented.

## Data and secrets

- Never commit API keys, service-account JSON, private keys, payment credentials or signing secrets.
- Store secrets only in the dedicated project's server-side secret store.
- Do not share secrets across the legacy Huduma Worker and the new Wazee Worker.
- Avoid storing unnecessary identity/KYC data; define retention and access policies before collecting any.
- Log actor, action, target, timestamp, request correlation ID and outcome for privileged actions, without logging tokens or sensitive payloads.

## Backup and migration

- Existing Firebase production data is out of scope for initial setup.
- Before any later migration: inventory collections, export backup, test restore, define versioned migration, dry-run against a separate test project, and obtain explicit approval.
- Never delete or rename legacy collections as part of this project bootstrap.

## Spark plan constraints

- Keep Firebase project on Spark.
- Do not enable billing or add a payment method.
- Do not depend on Firebase Functions or other paid/Blaze-only capabilities without explicit approval.
- Measure Firestore reads/writes, Storage usage and authentication constraints against current Spark quotas before choosing implementation details.

## Release gates

A feature is not production-ready until its tests, authorization checks, abuse controls, observability, data recovery path and deployment rollback plan are documented and verified.
