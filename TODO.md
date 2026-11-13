# Rebuild TODO

## Social-first home and community
- [ ] Feed ya mikeka iwe entry point kuu yenye hierarchy mpya ya post cards, official blue tick, TEST/demo labeling, likes, comments na share actions zinazoonekana karibu na post.
- [ ] Composer ya post iwe prominent, mobile-friendly na imwambie user ku-login kwa uwazi badala ya kupoteza draft.
- [ ] Community, marketplace, sports, seller, wallet, admin na settings zitumie shell moja ya kisasa yenye sidebar desktop, bottom nav mobile na focus states zinazosomeka.

## Visual quality
- [ ] Rebuild palette iwe deep navy, cobalt blue, emerald trust green na neutral surfaces; typography, spacing, cards, empty states na controls ziwe consistent.
- [ ] Responsive behavior ikaguliwe kwenye 375px, 768px na desktop bila horizontal overflow; touch targets ziwe angalau takriban 44px kwenye actions muhimu.
- [ ] Respect reduced motion, visible keyboard focus, readable contrast na localized Kiswahili microcopy.

## Existing behavior preserved
- [ ] Firebase phone/password auth, API token transport, posts, likes, comments, follows, listings, sports data, seller flows, admin controls na poster PNG export zibaki zikifanya kazi.
- [ ] Hakuna fabricated fixtures, odds, results, user content, wallet balance au seller approval state itakayoonyeshwa kama halisi.
- [ ] Firebase, Firestore/D1 schema, Worker functions, security rules, provider secrets, billing/payment methods na deployment settings zisibadilishwe.

## Human handoff
- [ ] Owner a-enable/athibitishe Firebase Auth domains na Email/Password kama bado hazijakamilika.
- [ ] Owner athibitishe first Admin UID kupitia controlled operation; hakuna auto-promotion.
- [ ] Owner aweke verified sports provider secret kupitia Cloudflare Worker secrets kama live fixtures/odds zinahitajika.
- [ ] Owner aidhinishe payments/regulatory setup kabla ya real-money checkout, wallet funding, commission au withdrawals.

## Validation
- [ ] Typecheck, unit tests, production build na production smoke checks zipite.
- [ ] Preview routes/sections zikaguliwe kwa browser na screenshots za mobile/desktop zichukuliwe.
- [ ] Branch mpya ipelekwe kwa review bila merge au production deployment mpaka approval.
