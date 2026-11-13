const POSTER_WIDTH = 1080;
const OUTER_PADDING = 30;
const CONTENT_WIDTH = POSTER_WIDTH - OUTER_PADDING * 2;
const HEADER_HEIGHT = 270;
const FOOTER_HEIGHT = 320;
const MIN_HEIGHT = 1280;
const MAX_SELECTIONS = 30;
const HISTORY_KEY = 'wbtz.ticket-image-history.v1';
const VALID_OUTCOMES = new Set(['home', 'draw', 'away']);

const escapeXml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}[character]));

const cleanText = (value, fallback = 'Haijapatikana') => {
  const text = String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return text || fallback;
};

const firstInitials = (value) => {
  const words = cleanText(value, 'T').split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => Array.from(word)[0]?.toUpperCase() ?? '').join('') || 'T';
};

const wrapWords = (value, maxChars = 54, maxLines = 3) => {
  const words = cleanText(value).split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    if (word.length > maxChars) {
      if (line) lines.push(line);
      line = '';
      for (let offset = 0; offset < word.length; offset += maxChars) lines.push(word.slice(offset, offset + maxChars));
      continue;
    }
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = `${kept[maxLines - 1].slice(0, Math.max(1, maxChars - 1))}…`;
  return kept;
};

const validOdds = (value) => Number.isFinite(Number(value)) && Number(value) > 1 ? Number(value) : null;
const formatOdds = (value) => {
  const number = validOdds(value);
  return number === null ? '—' : number.toFixed(2);
};

const sourceFor = (ticket) => cleanText(ticket.sourceLabel, 'BET BUILDER').toUpperCase();
const accessFor = (ticket) => cleanText(ticket.accessLabel, 'DRAFT').toUpperCase();

const getSelectedOutcome = (pick) => {
  const explicit = String(pick.selectedOutcome ?? '').toLowerCase();
  if (VALID_OUTCOMES.has(explicit)) return explicit;
  const prediction = cleanText(pick.prediction ?? pick.selection, '').toLowerCase();
  if (/^(1|home|home win|home team|1x2 home)$/.test(prediction)) return 'home';
  if (/^(x|draw|tie|draw no bet)$/.test(prediction)) return 'draw';
  if (/^(2|away|away win|away team|1x2 away)$/.test(prediction)) return 'away';
  const home = cleanText(pick.homeTeam ?? pick.home, '').toLowerCase();
  const away = cleanText(pick.awayTeam ?? pick.away, '').toLowerCase();
  if (home && prediction.includes(home)) return 'home';
  if (away && prediction.includes(away)) return 'away';
  return null;
};

const getSelectedOdds = (pick) => {
  const explicit = validOdds(pick.odds?.selected);
  if (explicit !== null) return explicit;
  const outcome = getSelectedOutcome(pick);
  return outcome ? validOdds(pick.odds?.[outcome]) : null;
};

export function calculateTotalOdds(selections) {
  if (!Array.isArray(selections) || selections.length === 0) return null;
  const odds = selections.map(getSelectedOdds);
  if (odds.some((value) => value === null)) return null;
  const sources = selections.map((pick) => cleanText(pick.odds?.source, '')).filter(Boolean);
  if (sources.length !== selections.length || new Set(sources).size !== 1) return null;
  const total = odds.reduce((product, value) => product * value, 1);
  return Number.isFinite(total) ? total : null;
}

export function resolveFresh1X2Odds(snapshots, fixture, prediction, now = Date.now()) {
  if (!Array.isArray(snapshots) || !fixture) return null;
  const parseUtc = (value) => {
    if (!value) return NaN;
    const normalized = String(value).includes('T') ? String(value) : `${String(value).replace(' ', 'T')}Z`;
    return Date.parse(normalized);
  };
  const marketName = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const marketAllowed = (value) => ['1x2', 'matchwinner', 'matchresult', 'fulltimematchresult'].includes(marketName(value));
  const slotFor = (value) => {
    const key = String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const home = String(fixture.home_name ?? fixture.homeTeam ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const away = String(fixture.away_name ?? fixture.awayTeam ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (['1', 'home', 'homewin', 'hometeam', '1x2home'].includes(key) || (home && key === home)) return 'home';
    if (['x', 'draw', 'tie', '1x2draw', '1x2x'].includes(key)) return 'draw';
    if (['2', 'away', 'awaywin', 'awayteam', '1x2away'].includes(key) || (away && key === away)) return 'away';
    return null;
  };
  const groups = new Map();
  for (const snapshot of snapshots) {
    if (!marketAllowed(snapshot.market_key)) continue;
    const odds = validOdds(snapshot.odds_decimal);
    const timestampValue = snapshot.source_updated_at || snapshot.fetched_at;
    const timestamp = parseUtc(timestampValue);
    if (odds === null || !Number.isFinite(timestamp) || now - timestamp > 6 * 60 * 60 * 1000 || timestamp - now > 5 * 60 * 1000) continue;
    const outcome = slotFor(snapshot.selection_key);
    if (!outcome) continue;
    const provider = cleanText(snapshot.provider_name, '');
    if (!provider) continue;
    const minuteBucket = Math.floor(timestamp / 60_000);
    const key = `${provider}|${marketName(snapshot.market_key)}|${minuteBucket}`;
    const group = groups.get(key) ?? { provider, timestamp, values: {} };
    if (timestamp >= group.timestamp) group.timestamp = timestamp;
    if (group.values[outcome] === undefined) group.values[outcome] = odds;
    groups.set(key, group);
  }
  const candidates = [...groups.values()].sort((left, right) => Object.keys(right.values).length - Object.keys(left.values).length || right.timestamp - left.timestamp);
  const best = candidates[0];
  if (!best) return null;
  const selectedText = String(prediction ?? '').trim().toLowerCase();
  const homeText = String(fixture.home_name ?? fixture.homeTeam ?? '').trim().toLowerCase();
  const awayText = String(fixture.away_name ?? fixture.awayTeam ?? '').trim().toLowerCase();
  const selectedOutcome = ['1', 'home', 'home win'].includes(selectedText) || (homeText && selectedText.includes(homeText))
    ? 'home'
    : ['x', 'draw', 'tie'].includes(selectedText)
      ? 'draw'
      : ['2', 'away', 'away win'].includes(selectedText) || (awayText && selectedText.includes(awayText))
        ? 'away'
        : null;
  return {
    ...best.values,
    selected: selectedOutcome ? best.values[selectedOutcome] ?? null : null,
    source: best.provider,
    updatedAt: new Date(best.timestamp).toISOString(),
  };
}

const logoMarkup = (name, dataUrl, centerX, centerY) => {
  const safeDataUrl = /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(String(dataUrl ?? '')) ? String(dataUrl) : '';
  if (safeDataUrl) {
    return `<circle cx="${centerX}" cy="${centerY}" r="33" fill="#fff" stroke="#d7e0e8" stroke-width="3"/><image href="${escapeXml(safeDataUrl)}" x="${centerX - 28}" y="${centerY - 28}" width="56" height="56" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return `<circle cx="${centerX}" cy="${centerY}" r="33" fill="#e8edf2" stroke="#cbd5df" stroke-width="3"/><text x="${centerX}" y="${centerY + 10}" text-anchor="middle" font-family="Arial,sans-serif" font-size="23" font-weight="900" fill="#19344c">${escapeXml(firstInitials(name))}</text>`;
};

const makePredictionLines = (pick) => {
  const market = cleanText(pick.market, 'Chaguo');
  const prediction = cleanText(pick.prediction ?? pick.selection, 'Chaguo halijawekwa');
  return wrapWords(`${market} · ${prediction}`, 67, 2);
};

const matchRows = (ticket) => {
  const selections = ticket.lockedContent === true ? [] : Array.isArray(ticket.selections) ? ticket.selections : [];
  return selections.map((pick, index) => {
    const home = cleanText(pick.homeTeam ?? pick.home, `Timu ya nyumbani ${index + 1}`);
    const away = cleanText(pick.awayTeam ?? pick.away, `Timu ya ugenini ${index + 1}`);
    const competition = cleanText(pick.competition, 'Ligi haijapatikana');
    const kickoff = cleanText(pick.kickoffAt ?? pick.kickoff, 'Muda haujapatikana');
    const homeLines = wrapWords(home, 18, 3);
    const awayLines = wrapWords(away, 18, 3);
    const predictionLines = makePredictionLines(pick);
    const nameLineCount = Math.max(homeLines.length, awayLines.length);
    const rowHeight = 196 + Math.max(0, nameLineCount - 1) * 24 + Math.max(0, predictionLines.length - 1) * 22;
    return { pick, index, home, away, competition, kickoff, homeLines, awayLines, predictionLines, nameLineCount, rowHeight };
  });
};

const renderTeamLines = (lines, x, y, textAnchor) => lines.map((line, index) => `<text x="${x}" y="${y + index * 25}" text-anchor="${textAnchor}" font-family="Arial,sans-serif" font-size="27" font-weight="900" fill="#111923">${escapeXml(line)}</text>`).join('');

const renderOddsStrip = (pick, x, y, width) => {
  const selected = getSelectedOutcome(pick);
  const values = [
    { key: 'home', title: '1 · NYUMBANI', value: pick.odds?.home, fill: '#07833f' },
    { key: 'draw', title: 'X · SARE', value: pick.odds?.draw, fill: '#e6ad00' },
    { key: 'away', title: '2 · UGENINI', value: pick.odds?.away, fill: '#07833f' },
  ];
  const is1x2 = values.some((item) => validOdds(item.value) !== null);
  const gap = 5;
  const segmentWidth = (width - gap * 2) / 3;
  if (!is1x2) {
    const market = cleanText(pick.market, 'CHAGUO');
    const prediction = cleanText(pick.prediction ?? pick.selection, 'Haijapatikana');
    const chosenOdds = formatOdds(getSelectedOdds(pick));
    return `<rect x="${x}" y="${y}" width="${width}" height="62" rx="10" fill="#087c45"/><text x="${x + 20}" y="${y + 24}" font-family="Arial,sans-serif" font-size="14" font-weight="800" fill="#d9ffeb">${escapeXml(market.toUpperCase())}</text><text x="${x + 20}" y="${y + 48}" font-family="Arial,sans-serif" font-size="21" font-weight="900" fill="#fff">${escapeXml(wrapWords(prediction, 42, 1)[0])}</text><text x="${x + width - 22}" y="${y + 40}" text-anchor="end" font-family="Arial,sans-serif" font-size="23" font-weight="900" fill="#fff">${escapeXml(chosenOdds)}</text>`;
  }
  return values.map((item, index) => {
    const segmentX = x + index * (segmentWidth + gap);
    const isSelected = selected === item.key;
    const fill = item.fill;
    return `<g><rect x="${segmentX}" y="${y}" width="${segmentWidth}" height="62" rx="10" fill="${fill}" stroke="${isSelected ? '#111923' : '#ffffff'}" stroke-width="${isSelected ? 4 : 1}"/><text x="${segmentX + 16}" y="${y + 22}" font-family="Arial,sans-serif" font-size="13" font-weight="900" fill="#fff">${item.title}</text><text x="${segmentX + 16}" y="${y + 49}" font-family="Arial,sans-serif" font-size="25" font-weight="900" fill="#fff">${formatOdds(item.value)}</text>${isSelected ? `<text x="${segmentX + segmentWidth - 13}" y="${y + 23}" text-anchor="end" font-family="Arial,sans-serif" font-size="12" font-weight="900" fill="#fff">CHAGUO</text>` : ''}</g>`;
  }).join('');
};

export function getTicketPosterDimensions(ticket) {
  const rows = matchRows(ticket);
  const contentHeight = rows.reduce((sum, row) => sum + row.rowHeight + 14, 0);
  return { width: POSTER_WIDTH, height: Math.max(MIN_HEIGHT, HEADER_HEIGHT + contentHeight + FOOTER_HEIGHT), selectionCount: rows.length };
}

export function buildTicketPosterSvg(ticket) {
  const locked = ticket?.lockedContent === true;
  const selections = locked ? [] : Array.isArray(ticket?.selections) ? ticket.selections : [];
  if (!locked && selections.length < 1) throw new Error('Ongeza angalau chaguo moja kabla ya kutengeneza picha.');
  if (selections.length > MAX_SELECTIONS) throw new Error(`Poster inaruhusu hadi ${MAX_SELECTIONS} selections kwa sasa.`);
  const rows = matchRows(ticket);
  const { width, height } = getTicketPosterDimensions(ticket);
  const source = sourceFor(ticket);
  const access = accessFor(ticket);
  const title = cleanText(ticket.title, 'MKeka WA MAANDALIZI');
  const createdAt = cleanText(ticket.dateLabel ?? ticket.createdAt, 'Tarehe haijapatikana');
  const isTest = ticket.testOnly === true;
  const totalOdds = calculateTotalOdds(selections);
  const oddsSource = totalOdds === null ? '' : cleanText(selections[0].odds?.source, '');
  const headerTitle = isTest ? 'TEST ONLY · MECHI ZA MFANO' : 'MECHI ZA BETTING';
  let y = HEADER_HEIGHT;
  const rowMarkup = rows.map((row) => {
    const cardY = y;
    const cardX = OUTER_PADDING;
    const infoY = cardY + 42 + (row.nameLineCount - 1) * 24 + 33;
    const predictionY = infoY + 27;
    const oddsY = predictionY + row.predictionLines.length * 20 + 10;
    const oddsHeight = 62;
    const homeText = renderTeamLines(row.homeLines, cardX + 307, cardY + 51, 'middle');
    const awayText = renderTeamLines(row.awayLines, cardX + CONTENT_WIDTH - 307, cardY + 51, 'middle');
    const predictionMarkup = row.predictionLines.map((line, lineIndex) => `<text x="${POSTER_WIDTH / 2}" y="${predictionY + lineIndex * 20}" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="800" fill="#29384a">${escapeXml(line)}</text>`).join('');
    const markup = `<g><rect x="${cardX}" y="${cardY}" width="${CONTENT_WIDTH}" height="${row.rowHeight}" rx="17" fill="#f4f5f6" stroke="#cfd3d7" stroke-width="3"/><circle cx="${cardX + 44}" cy="${cardY + 50}" r="25" fill="#087fce"/><text x="${cardX + 44}" y="${cardY + 59}" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" font-weight="900" fill="#fff">${row.index + 1}</text>${logoMarkup(row.home, row.pick.homeLogoDataUrl, cardX + 99, cardY + 51)}${homeText}<text x="${POSTER_WIDTH / 2}" y="${cardY + 58}" text-anchor="middle" font-family="Arial,sans-serif" font-size="21" font-weight="900" fill="#334154">VS</text>${awayText}${logoMarkup(row.away, row.pick.awayLogoDataUrl, cardX + CONTENT_WIDTH - 99, cardY + 51)}<text x="${POSTER_WIDTH / 2}" y="${infoY}" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="800" fill="#212c38">${escapeXml(row.kickoff)} · ${escapeXml(row.competition)}</text>${predictionMarkup}${renderOddsStrip(row.pick, cardX + 15, oddsY, CONTENT_WIDTH - 30)}${row.pick.odds?.source ? `<text x="${cardX + CONTENT_WIDTH - 18}" y="${cardY + row.rowHeight - 7}" text-anchor="end" font-family="Arial,sans-serif" font-size="9" font-weight="700" fill="#647286">Chanzo cha odds: ${escapeXml(row.pick.odds.source)}</text>` : ''}</g>`;
    y += row.rowHeight + 14;
    return markup;
  }).join('');
  const summaryY = locked ? HEADER_HEIGHT + 225 : Math.max(y + 5, height - FOOTER_HEIGHT + 26);
  const totalText = totalOdds === null ? 'HAIJAPATIKANA' : totalOdds.toFixed(2);
  const responsible = isTest ? 'DATA YA MAJARIBIO TU · SI MECHI AU ODDS HALISI' : 'Utabiri si dhamana ya ushindi. Cheza kwa uwajibikaji.';
  const matchSummary = locked ? `${Number(ticket.selectionCount ?? 0)} CHAGUO · MAUDHUI YAMELINDWA` : `${selections.length} MECHI · ${access}`;
  const hiddenRows = locked ? `<rect x="${OUTER_PADDING + 22}" y="${HEADER_HEIGHT + 22}" width="${CONTENT_WIDTH - 44}" height="168" rx="16" fill="#eef1f3"/><text x="${POSTER_WIDTH / 2}" y="${HEADER_HEIGHT + 90}" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" font-weight="900" fill="#25384b">PREMIUM · CHAGUO LIMEFICHWA</text><text x="${POSTER_WIDTH / 2}" y="${HEADER_HEIGHT + 126}" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" fill="#68798b">Hakuna maelezo ya mechi yaliyofichuliwa kwenye preview hii.</text>` : rowMarkup;
  const contentEnd = locked ? HEADER_HEIGHT + 204 : y;
  const posterHeight = Math.max(height, contentEnd + FOOTER_HEIGHT - 25, summaryY + FOOTER_HEIGHT - 25);
  const safeWatermark = isTest ? `<g opacity=".16" transform="translate(540 ${Math.floor(posterHeight / 2)}) rotate(-25)"><text text-anchor="middle" font-family="Arial,sans-serif" font-size="86" font-weight="900" fill="#dd1e1e">TEST ONLY · NOT REAL DATA</text></g>` : '';
  const testPill = isTest ? `<rect x="${POSTER_WIDTH - 300}" y="38" width="230" height="43" rx="21" fill="#b82020"/><text x="${POSTER_WIDTH - 185}" y="67" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="900" fill="#fff">TEST ONLY</text>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${posterHeight}" viewBox="0 0 ${width} ${posterHeight}" role="img" aria-label="${escapeXml(title)}"><defs><linearGradient id="wall" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#05080d"/><stop offset=".55" stop-color="#161d27"/><stop offset="1" stop-color="#070a0f"/></linearGradient><linearGradient id="header" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#082b68"/><stop offset=".6" stop-color="#0b2450"/><stop offset="1" stop-color="#061631"/></linearGradient><linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffd14b"/><stop offset="1" stop-color="#f0a900"/></linearGradient><filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="9" flood-color="#000" flood-opacity=".48"/></filter></defs><rect width="100%" height="100%" fill="url(#wall)"/><circle cx="75" cy="80" r="20" fill="#fff7d6" opacity=".18"/><circle cx="${width - 84}" cy="130" r="30" fill="#fff7d6" opacity=".13"/><rect x="18" y="18" width="${width - 36}" height="${posterHeight - 36}" rx="26" fill="#090c11" stroke="#313945" stroke-width="4"/><rect x="${OUTER_PADDING}" y="${OUTER_PADDING}" width="${CONTENT_WIDTH}" height="218" rx="18" fill="url(#header)" stroke="#60708a" stroke-width="2" filter="url(#shadow)"/><text x="${POSTER_WIDTH / 2}" y="${isTest ? 132 : 102}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${isTest ? 45 : 57}" font-weight="1000" letter-spacing="1" fill="url(#gold)">${escapeXml(headerTitle)}</text><text x="${POSTER_WIDTH / 2}" y="${isTest ? 165 : 151}" text-anchor="middle" font-family="Arial,sans-serif" font-size="23" font-weight="900" fill="#fff">${escapeXml(title.toUpperCase())}</text><text x="${POSTER_WIDTH / 2}" y="${isTest ? 194 : 186}" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="800" fill="#f3f6fb">${escapeXml(createdAt)} · ${escapeXml(source)} · ${escapeXml(access)}</text><text x="${POSTER_WIDTH / 2}" y="${isTest ? 222 : 216}" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="800" fill="#bed0e8">${escapeXml(ticket.statusLabel ?? (isTest ? 'SAMPLE DATA · TEST ONLY' : 'DRAFT PREVIEW · HAKUNA BET ILIYOWEKWA'))}</text>${testPill}${hiddenRows}${safeWatermark}<rect x="${OUTER_PADDING}" y="${summaryY}" width="${CONTENT_WIDTH}" height="190" rx="18" fill="#f4f5f6" stroke="#cfd3d7" stroke-width="3"/><text x="${OUTER_PADDING + 27}" y="${summaryY + 45}" font-family="Arial,sans-serif" font-size="15" font-weight="900" fill="#536171">ODDS JUMLA${oddsSource ? ` · ${escapeXml(oddsSource)}` : ''}</text><text x="${OUTER_PADDING + 27}" y="${summaryY + 103}" font-family="Arial,sans-serif" font-size="43" font-weight="1000" fill="${totalOdds === null ? '#7c8792' : '#087f48'}">${escapeXml(totalText)}</text><text x="${POSTER_WIDTH - OUTER_PADDING - 27}" y="${summaryY + 47}" text-anchor="end" font-family="Arial,sans-serif" font-size="17" font-weight="900" fill="#1e2d3d">${escapeXml(matchSummary)}</text><text x="${POSTER_WIDTH - OUTER_PADDING - 27}" y="${summaryY + 79}" text-anchor="end" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#617184">Chaguo ni uchambuzi, si matokeo yaliyothibitishwa</text><line x1="${OUTER_PADDING + 25}" y1="${summaryY + 128}" x2="${POSTER_WIDTH - OUTER_PADDING - 25}" y2="${summaryY + 128}" stroke="#d5dbe0" stroke-width="2"/><text x="${POSTER_WIDTH / 2}" y="${summaryY + 158}" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="900" fill="#25384b">${escapeXml(responsible)}</text><text x="${POSTER_WIDTH / 2}" y="${posterHeight - 52}" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="800" fill="#c7d2e0">WAZEE WA BETTING TZ · ${escapeXml(source)} · ${escapeXml(access)}</text><text x="${POSTER_WIDTH / 2}" y="${posterHeight - 27}" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#8f9cac">Picha ni taarifa ya uchambuzi tu; haimaanishi bet imewekwa au ushindi umehakikishwa.</text></svg>`;
}

export function ticketPosterSvgDataUrl(ticket) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildTicketPosterSvg(ticket))}`;
}

export async function renderTicketPng(ticket) {
  if (typeof document === 'undefined') throw new Error('PNG inaweza kutengenezwa ndani ya browser pekee.');
  const svg = buildTicketPosterSvg(ticket);
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('Picha ya poster haikuweza kusomwa.'));
      image.src = svgUrl;
    });
    const { width, height } = getTicketPosterDimensions(ticket);
    const actualHeight = Math.max(height, image.naturalHeight || 0);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = actualHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Kifaa hiki hakiwezi kutengeneza PNG.');
    context.drawImage(image, 0, 0, width, actualHeight);
    const blob = await new Promise((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('PNG haikutengenezwa.')), 'image/png'));
    return { blob, width, height: actualHeight };
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export function safeFileName(ticket) {
  const title = cleanText(ticket.title, 'mkeka').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'mkeka';
  return `wazee-wa-betting-tz-${title}.png`;
}

export function readPosterHistory(storage = globalThis.localStorage) {
  try {
    const value = storage?.getItem(HISTORY_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => item && Array.isArray(item.selections)) : [];
  } catch {
    return [];
  }
}

export function savePosterHistory(ticket, storage = globalThis.localStorage) {
  if (!storage || ticket.testOnly === true) return readPosterHistory(storage);
  const entry = {
    ...ticket,
    id: ticket.id || (globalThis.crypto?.randomUUID?.() ?? `poster-${Date.now()}`),
    createdAt: ticket.createdAt || new Date().toISOString(),
    selections: (ticket.selections || []).map((pick) => ({ ...pick })),
  };
  const next = [entry, ...readPosterHistory(storage).filter((item) => item.id !== entry.id)].slice(0, 30);
  try {
    storage.setItem(HISTORY_KEY, JSON.stringify(next));
    return next;
  } catch {
    return readPosterHistory(storage);
  }
}

export function clearPosterHistory(storage = globalThis.localStorage) {
  try {
    storage?.removeItem(HISTORY_KEY);
  } catch {
    // Local storage may be disabled by the browser; the caller can still clear its in-memory view.
  }
}

export function isFreeListing(priceTzs) {
  return Number.isFinite(Number(priceTzs)) && Number(priceTzs) === 0;
}

export function listingAccessLabel(priceTzs) {
  return isFreeListing(priceTzs) ? 'FREE' : 'PREMIUM';
}
