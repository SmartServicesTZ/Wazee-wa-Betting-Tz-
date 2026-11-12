# Owner setup checklist

These items require the project owner's account or credentials. They are intentionally not guessed or bypassed.

## 1. Firebase Authentication

Project: `wazee-wa-betting-tz-e7183`

In Firebase Console:
1. Open **Authentication → Sign-in method**.
2. Confirm **Email/Password** is enabled. The app uses a phone-number-derived private email alias internally so the public form only asks for phone and password.
3. Open **Authentication → Settings → Authorized domains**.
4. Add `wazee-wa-betting-tz.pages.dev` if it is not already listed.
5. Do not enable Google sign-in; the app does not use it.

Important: the current phone/password identifier does not independently verify ownership of the phone number by SMS. SMS phone verification is a separate security enhancement and must be enabled/tested before representing a phone number as verified.

## 2. First Admin account

1. Open the live website and register/sign in with the intended owner account.
2. Retrieve that account's Firebase UID from Firebase Authentication.
3. Verify the UID and display name.
4. Provide the UID through a secure owner-controlled channel.
5. Promote only that UID to Admin using the controlled, audited D1 bootstrap procedure. Never set roles from the browser.

Until then, the Admin route correctly denies ordinary buyer accounts.

## 3. Sports data

1. Create a free API-Football / API-Sports account.
2. Test Tanzania Premier League, CAF competitions, the required leagues, match results and available odds markets.
3. Provide the API key using Cloudflare Worker **Settings → Variables and Secrets → Add secret** (planned binding name: `API_FOOTBALL_KEY`).
4. Never paste the key in chat, GitHub, or frontend code.

The provider is not enabled until coverage and quota behavior are verified.

## 4. Payments and legal clearance

Do not enable buyer checkout, paid tips, wallet funding, commission collection or seller payouts until:
- FimiPay or another licensed provider gives written approval for the exact multi-seller betting-tips marketplace model and payout structure.
- The Gaming Board of Tanzania and Tanzanian legal counsel clarify the required licences/approvals for this product.
- Fees, reserves, refunds, chargebacks, settlement timing, KYC/KYB and tax handling are documented.

No live money movement is currently implemented.
