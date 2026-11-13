# Wazee wa Betting TZ — A-to-Z social feed rebuild

## Product goal

Wazee wa Betting TZ ni social-first community ya mikeka: mwanachama anaona feed ya posts, anashiriki mkeka wake, anapokea likes/comments, anafuata wachambuzi na anaweza ku-export poster ya mkeka bila kuifanya ionekane kama bet iliyowekwa. Frontend hii itabaki kwenye data/API/Auth iliyopo; hakuna schema, rules, payment au fabricated sports data itakayobadilishwa.

## Design direction

- **Alternative styles:** modern sports terminal (0.04); premium betting newsroom (0.07); bold community bulletin (0.08).
- **Chosen movement:** premium community clubhouse — dark ink shell, white canvas, cobalt action color na green trust signal, ikiwa na feed cards kubwa zinazofanana na editorial posts badala ya dashboard tiles.
- **Core principles:** social proof ionekane haraka; one-thumb mobile actions; official/test content itambulike wazi; empty/error states ziwe na maelekezo ya hatua inayofuata.
- **Color philosophy:** deep navy ni context ya brand na navigation; cobalt ni action/selection; emerald ni trust/live state; orange inabaki kwa warnings na TEST ONLY, si kama decoration ya random.
- **Layout paradigm:** desktop split-view yenye left rail, centered feed na right rail ya discovery; mobile inageuka kuwa single-column feed yenye bottom navigation na sticky composer CTA.
- **Signature elements:** official blue tick, green live signal, poster preview frame na compact social action row ya Like/Maoni/Shiriki.
- **Interaction philosophy:** actions ziwe close to content; buttons ziwe explicit kuhusu login, demo na live data; no hidden purchase or betting action.
- **Animation:** subtle 150–220ms lift/fade only; respect `prefers-reduced-motion`; hakuna looping motion inayochosha feed.
- **Typography:** Manrope kwa body/UI, Space Grotesk kwa headings/brand; short labels uppercase with tracking, long Swahili copy with relaxed line height.
- **Brand essence:** jukwaa la Tanzania la kushirikiana, kujifunza na kuchambua mikeka kwa uwazi; social, makini, trustworthy.
- **Brand voice:** “Mikeka ya jamii, taarifa kabla ya presha.” / “Shiriki pick yako. Wengine waijadili.”
- **Wordmark & logo:** W monogram ndani ya cobalt/green signal tile, ikifuatwa na stacked WAZEE WA / BETTING TZ wordmark.
- **Signature brand color:** cobalt `#1769e8`, paired with emerald `#16a36a` as the trust accent.

## Implementation

`src/App.tsx` na existing API helpers zitaendelea kuwa source ya behavior: Firebase Auth, posts, likes, comments, follows, listings, sports data, seller flows, admin controls na poster export hazibadilishwi. `src/styles.css` itakuwa visual source of truth mpya kwa shell, feed, marketplace, builder, seller, wallet, admin, auth na responsive states. `src/components/ticket-poster-tools.tsx` itabaki kwa poster preview/download/history, ikiwa na TEST ONLY semantics zilizopo.

## Project structure

- `src/App.tsx`: route-like section state, API calls, auth handlers na feature composition.
- `src/styles.css`: rebuilt token system, layout primitives, social cards, responsive breakpoints na accessibility states.
- `src/components/ticket-poster-tools.tsx`: poster preview, PNG export/share na local-only history.
- `src/lib/firebase.ts`: existing Firebase Auth/API token transport, unchanged.
- `worker/`: existing Worker API and D1 schema, unchanged.
- `scripts/`: existing poster tests and production smoke tests, reused.

## Boundaries

Real-money payments, wallet movement, seller approval, admin access, provider keys, sports fixtures/odds and database writes remain governed by existing auth/API contracts. If a view requires owner credentials, provider secrets or Cloudflare/Firebase configuration, leave the view intact and report the required human action after the frontend rebuild.
