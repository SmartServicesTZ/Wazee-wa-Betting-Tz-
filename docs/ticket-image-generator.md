# Mpango: Betting Ticket Image Generator

## Muonekano
PNG ya portrait inafuata marejeo: fremu ya giza/navy, kichwa cha bluu-navy na maandishi ya dhahabu, kadi nyeupe za mechi, mistari ya timu/VS, muda na ligi, prediction, na odds strip ya kijani/dhahabu. Urefu huongezeka kadri selections zinavyoongezeka; text wrap hudhibiti majina marefu.

## Sources na uadilifu wa data
- Bet Builder hutumia fixture iliyochaguliwa kutoka sports API iliyopo; 1/X/2 odds huongezwa tu zikiwa na source na timestamp ndani ya saa 6. Zisipopatikana huonekana kama `—`.
- Seller Center hutengeneza poster ya draft ya selections ambazo seller mwenyewe ameingiza; bei ya draft huweka lebo ya FREE/PREMIUM, bila kubadili entitlement au payment.
- Demo/sample PNG hutumia majina na odds za synthetic test pekee, watermark kubwa ya `TEST ONLY`, na haihifadhiwi kwenye historia.
- Repo haina AI tips endpoint wala public Mkeka wa Leo/free/premium ticket feed yenye selections; hatutunzi data ili kujifanya hizo sources zipo. Renderer inapokea `sourceLabel` kwa sources halisi zitakazounganishwa baadaye.
- Team logos huonyeshwa tu ikiwa data URL ya picha halisi imetolewa; bila hiyo poster hutumia initials badala ya kutafuta au kubuni nembo.
- Historia ni metadata ya kifaa/browser hiki pekee; haipakii picha wala kutuma data server.

## Utekelezaji
1. Reusable SVG-to-PNG renderer, portrait high-resolution output, escaping, sizing, odds calculation na privacy guards.
2. Preview/download/native share/fallback na filtered local history kwenye Bet Builder na Seller Center draft.
3. Actual fixture selection hujaza teams/competition/kickoff na huchukua 1X2 snapshots fresh pekee.
4. Test fixtures na test-only preview harness kwa 3, 8 na 15 selections.
5. PR CI huendesha typecheck, tests, Worker syntax check na production build; production smoke check imewekewa main-push pekee.

## Uhakiki
- Unit tests kwa sizing, odds, freshness, source consistency, text escaping, privacy, history na FREE/PREMIUM labels.
- Typecheck, unit suite, Worker syntax checks na production build.
- PNG 3/8/15 zimeundwa na kukaguliwa kwa macho; mobile/tablet/desktop checks 375/768/1440 hazikuonyesha horizontal overflow.
- Preview API override ya Vite inaweza kuzuia local/preview requests kwenda Cloudflare; fallback ya production haijabadilishwa.
- Branch/PR pekee; hakuna Cloudflare deploy, data/schema/Rules/Functions changes, billing au merge.
