# Sports Data Provider Research

Status: Provider shortlist prepared; API credentials and Tanzanian coverage tests remain pending.

## Recommended first test: API-Football (API-Sports)

Official pricing: https://www.api-football.com/pricing

The published Free plan is $0/month, states 100 requests/day, no credit card required, and lists fixtures, livescore, results/events and pre-match/in-play odds among available endpoints. Free plans are limited in available seasons. This makes it the best first candidate to test in one provider for the initial football data pipeline.

Before adopting:
- Create a free account and obtain an API key.
- Test coverage for Tanzania Premier League, CAF competitions and the leagues actually required.
- Confirm which bookmakers/markets return odds in the free plan.
- Measure daily quota use and refresh frequency.
- Keep the key in Cloudflare Worker secrets, never in browser code or Git.

## Secondary odds source: The Odds API

Official site: https://the-odds-api.com/

Published free tier: 500 credits/month, with coverage across listed sports and bookmakers. Its coverage is strongest for widely covered markets; Tanzanian bookmaker/league coverage is not established from the public page and must be tested before use. It is a secondary odds candidate, not a guaranteed local-bookmaker feed.

## Reference-only source: TheSportsDB

Official documentation: https://www.thesportsdb.com/documentation

The free v1 key 123 is publicly available and the site states 30 requests/minute, but endpoint limits are restrictive and premium v2/livescores are paid. It may help with team/league reference data and artwork; it is not sufficient as the sole source for accurate live scores, results and betting odds.

## Ingestion rules
- Every record must retain provider, provider event ID, source timestamp and fetch timestamp.
- Never infer or fabricate missing odds, results, fixture times or match status.
- Store odds snapshots with market and bookmaker/source identity.
- Mark stale provider data and stop displaying it as live.
- Use caching and quota-aware scheduled refreshes.
- Results must be sourced independently and settlement changes audited.

## Owner action still required
The owner must create the provider account and supply the API key through a secure Cloudflare secret channel. Do not paste the key into GitHub, chat, source code or frontend config.
