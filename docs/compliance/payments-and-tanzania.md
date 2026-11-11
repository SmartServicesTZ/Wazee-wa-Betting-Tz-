# Payments and Regulatory Due Diligence (Tanzania)

Status: NO-GO for live money movement until written approvals are obtained.

## FimiPay findings

Official sources reviewed:
- https://fimipay.com/
- https://fimipay.com/terms-and-conditions
- https://fimipay.com/sub-merchant-acceptable-use-policy
- https://fimipay.com/acquirer-service-agreements

### Verified from public material
- FimiPay describes itself as a Tanzania-based ICT/fintech platform that integrates payment infrastructure; its terms explicitly say its ICT licence must not be treated as a PSP, acquiring, banking or e-money licence.
- It advertises M-Pesa, Airtel Money, Mixx by Yas, HaloPesa, cards and other methods, subject to country, partner and merchant eligibility.
- It says merchants can withdraw to mobile money or bank accounts, subject to verification and local rules.
- KYC/KYB, beneficial-owner checks and ongoing risk monitoring may be required.
- Public terms say marketplace/payment aggregation/multiple-seller settlement requires enhanced review and prior written approval from FimiPay and, where needed, its payment partner.
- Its acceptable-use policy prohibits unlicensed gambling/betting and other prohibited activity.

### Not verified publicly
- Acceptance of a marketplace selling betting tips/selections.
- Split payments or automated seller sub-payouts.
- Escrow/holding funds on behalf of multiple sellers.
- Whether a platform-level 10% commission can be deducted before settlement.
- API endpoints and webhooks for Tanzania mobile-money collection and seller disbursements.
- Exact collection/payout fees, settlement SLA, reserves, chargeback fees and transaction limits for this merchant category.

### Decision
Do not integrate FimiPay for buyer purchases, commission deductions or seller payouts until FimiPay and the relevant licensed payment partner give written approval specifically describing:
1. Wazee wa Betting TZ as a multi-seller marketplace for paid betting tips/analysis.
2. Whether this is permitted under their gambling/betting and digital-content rules.
3. Whether they support split settlement, sub-merchant onboarding, platform commission and seller payouts.
4. Which Tanzanian rails are enabled for this merchant account.
5. Fee schedule, settlement windows, rolling reserves, refunds, chargebacks and payout API.
6. KYC/KYB documents and required licences.

The public website advertises mobile-money payouts, but that does not prove automated marketplace split payouts or escrow.

## Tanzania regulatory gate

The Gaming Board of Tanzania (GBT) publishes sports-betting, internet sports-betting and service-provider licence categories. Its Sports Betting Rules state that where betting is conducted, promoted or advertised from a website/mobile application, prior Board approval is required for that betting website/application. Whether a tips marketplace that does not accept wagers itself falls within a regulated category must be confirmed directly with GBT and Tanzanian counsel.

Before charging for tips:
- Obtain written classification from GBT for the exact product: paid betting analysis/tips, seller marketplace, affiliate links, and no wager acceptance.
- Confirm whether any service-provider, advertising, seller/distributor or internet sports-betting approval is required.
- Obtain counsel's view on age restriction, consumer disclosures, responsible-gaming messages, taxation and data protection.
- Keep all real-money functions disabled until those answers and provider approval are documented.

Official references:
- https://www.gamingboard.go.tz/license-operators/sports-betting
- https://www.gamingboard.go.tz/pages/licence-type
- https://www.gamingboard.go.tz/uploads/documents/sw-1654083403-Sports%20Betting%20Rules%202016.pdf
- https://gamingboard.go.tz/uploads/documents/en-1753987035-GAMING%20ACT%20CAP%2041%20RE%202023.pdf

## Current platform safeguards
- No checkout, deposits, purchases, commission deductions, payouts or withdrawals are enabled.
- The D1 wallet ledger schema is only a future accounting foundation; it has no money-moving API.
- No user balance is displayed as a real-money balance.
- Proposed 10% platform commission and TSh 2,000 withdrawal minimum remain business rules only, not executable payment rules.
