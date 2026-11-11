# Wazee wa Betting TZ — Hybrid Marketplace

A new, independent project for the Wazee wa Betting TZ hybrid marketplace.

## Product modules
- Betting tips marketplace
- Social community
- Sports data and bet builder
- Wallet and transaction ledger (initially non-monetary/sandbox only)
- Seller center with admin approval
- Admin control panel

## Safety constraints
- The legacy repository and its Firebase data remain untouched.
- Firebase project `wazee-wa-betting-tz-e7183` stays on the Spark plan; never enable billing or add a payment method without explicit owner approval.
- No real-money transactions, deposits, purchases, or withdrawals during the initial build.
- No production database migrations, destructive changes, or production deployment without explicit approval.
- Secrets must never be committed to this repository.

## Development
All implementation work is carried out on feature branches and reviewed through pull requests. The `main` branch is not a deployment target until separately approved.
