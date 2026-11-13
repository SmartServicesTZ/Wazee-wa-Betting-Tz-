import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTicketPosterSvg,
  calculateTotalOdds,
  clearPosterHistory,
  getTicketPosterDimensions,
  isFreeListing,
  listingAccessLabel,
  readPosterHistory,
  resolveFresh1X2Odds,
  safeFileName,
  savePosterHistory,
} from '../src/lib/ticket-poster.js';

const fixtureTicket = (count, overrides = {}) => ({
  id: `test-${count}`,
  title: `TEST ONLY · ${count} MECHI`,
  sourceLabel: 'SYNTHETIC TEST',
  accessLabel: 'TEST',
  dateLabel: '2026-11-12 · TEST FIXTURE',
  statusLabel: 'SAMPLE DATA · TEST ONLY',
  testOnly: true,
  selections: Array.from({ length: count }, (_, index) => ({
    homeTeam: `SAMPLE HOME ${String(index + 1).padStart(2, '0')}`,
    awayTeam: `SAMPLE AWAY ${String(index + 1).padStart(2, '0')}`,
    competition: `SAMPLE LEAGUE ${index + 1}`,
    kickoffAt: '18:30 · TEST TIME',
    market: '1X2',
    prediction: '1',
    selectedOutcome: 'home',
    odds: { home: 1.35, draw: 3.2, away: 6.1, selected: 1.35, source: 'SYNTHETIC TEST ODDS' },
  })),
  ...overrides,
});

function fakeStorage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
  };
}

test('poster output is portrait and dynamically fits 3, 8 and 15 selections', () => {
  const three = getTicketPosterDimensions(fixtureTicket(3));
  const eight = getTicketPosterDimensions(fixtureTicket(8));
  const fifteen = getTicketPosterDimensions(fixtureTicket(15));
  assert.equal(three.width, 1080);
  assert.ok(three.height > three.width);
  assert.ok(eight.height > three.height);
  assert.ok(fifteen.height > eight.height);
  assert.equal(three.selectionCount, 3);
  assert.equal(eight.selectionCount, 8);
  assert.equal(fifteen.selectionCount, 15);
});

test('3-, 8- and 15-match sample SVGs keep the TEST ONLY watermark and row data', () => {
  for (const count of [3, 8, 15]) {
    const svg = buildTicketPosterSvg(fixtureTicket(count));
    assert.match(svg, /TEST ONLY/);
    assert.match(svg, /NOT REAL DATA/);
    assert.match(svg, new RegExp(`SAMPLE HOME ${String(count).padStart(2, '0')}`));
    assert.match(svg, new RegExp(`SAMPLE AWAY ${String(count).padStart(2, '0')}`));
    assert.match(svg, new RegExp(`${count} MECHI`));
  }
});

test('total odds are calculated only when every selection has odds from one source', () => {
  const selections = fixtureTicket(3).selections;
  assert.equal(calculateTotalOdds(selections), 1.35 ** 3);
  assert.equal(calculateTotalOdds([...selections, { ...selections[0], odds: { ...selections[0].odds, home: null, selected: null } }]), null);
  assert.equal(calculateTotalOdds([selections[0], { ...selections[1], odds: { ...selections[1].odds, source: 'OTHER SOURCE' } }]), null);
  assert.equal(calculateTotalOdds([]), null);
});

test('unknown odds remain unavailable and are never represented as zero', () => {
  const svg = buildTicketPosterSvg(fixtureTicket(1, { selections: [{ homeTeam: 'Club A', awayTeam: 'Club B', market: '1X2', prediction: '1' }] }));
  assert.match(svg, /HAIJAPATIKANA/);
  assert.match(svg, />—</);
  assert.doesNotMatch(svg, /ODDS JUMLA[^<]*0\.00/);
});

test('fresh provider snapshots map only recognized 1X2 outcomes from one recent provider batch', () => {
  const now = Date.UTC(2026, 10, 12, 12, 0, 0);
  const stamp = new Date(now - 60_000).toISOString();
  const fixture = { home_name: 'Yanga SC', away_name: 'Simba SC' };
  const rows = [
    { market_key: 'match_result', selection_key: 'Home', odds_decimal: 1.45, source_updated_at: stamp, fetched_at: stamp, provider_name: 'TEST Provider' },
    { market_key: 'match_result', selection_key: 'Draw', odds_decimal: 3.2, source_updated_at: stamp, fetched_at: stamp, provider_name: 'TEST Provider' },
    { market_key: 'match_result', selection_key: 'Away', odds_decimal: 5.4, source_updated_at: stamp, fetched_at: stamp, provider_name: 'TEST Provider' },
  ];
  const result = resolveFresh1X2Odds(rows, fixture, '1', now);
  assert.deepEqual({ home: result.home, draw: result.draw, away: result.away, selected: result.selected, source: result.source }, { home: 1.45, draw: 3.2, away: 5.4, selected: 1.45, source: 'TEST Provider' });
  assert.equal(resolveFresh1X2Odds(rows, fixture, 'Home win', now + 7 * 60 * 60 * 1000), null);
  assert.equal(resolveFresh1X2Odds(rows.map((row) => ({ ...row, market_key: 'over_under' })), fixture, '1', now), null);
});

test('untrusted names are escaped and external logo URLs are ignored', () => {
  const svg = buildTicketPosterSvg(fixtureTicket(1, { selections: [{
    homeTeam: '</text><script>alert(1)</script>',
    awayTeam: 'Sample Away',
    market: '1X2',
    prediction: 'home',
    homeLogoDataUrl: 'https://example.invalid/unknown-logo.png',
  }] }));
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /&lt;\/text&gt;&lt;script&gt;/);
  assert.doesNotMatch(svg, /example\.invalid/);
});

test('locked premium poster does not expose supplied selection names or calculate odds', () => {
  const svg = buildTicketPosterSvg({
    title: 'Premium teaser',
    sourceLabel: 'SELLER TIPS',
    accessLabel: 'PREMIUM',
    lockedContent: true,
    selectionCount: 4,
    selections: [{ homeTeam: 'PRIVATE HOME NAME', awayTeam: 'PRIVATE AWAY NAME', odds: { home: 2.5, selected: 2.5, source: 'Private odds' } }],
  });
  assert.match(svg, /PREMIUM · CHAGUO LIMEFICHWA/);
  assert.match(svg, /4 CHAGUO/);
  assert.doesNotMatch(svg, /PRIVATE HOME NAME|PRIVATE AWAY NAME|2\.50|Private odds/);
});

test('history is device-local, capped and ignores TEST ONLY fixtures', () => {
  const storage = fakeStorage();
  savePosterHistory(fixtureTicket(1), storage);
  assert.equal(readPosterHistory(storage).length, 0);
  for (let index = 0; index < 32; index += 1) {
    savePosterHistory({ id: `saved-${index}`, title: `Saved ${index}`, selections: [{ homeTeam: 'Real data supplied by caller', awayTeam: 'Other team' }] }, storage);
  }
  assert.equal(readPosterHistory(storage).length, 30);
  clearPosterHistory(storage);
  assert.equal(readPosterHistory(storage).length, 0);
});

test('free and premium labels follow actual listing price and safe filenames are produced', () => {
  assert.equal(isFreeListing(0), true);
  assert.equal(isFreeListing('0'), true);
  assert.equal(isFreeListing(1000), false);
  assert.equal(listingAccessLabel(0), 'FREE');
  assert.equal(listingAccessLabel(2000), 'PREMIUM');
  assert.equal(safeFileName({ title: 'Mkeka wa Leo / Odds 3' }), 'wazee-wa-betting-tz-mkeka-wa-leo-odds-3.png');
});
