import { useEffect, useMemo, useState } from 'react';
import {
  readPosterHistory,
  renderTicketPng,
  safeFileName,
  savePosterHistory,
  clearPosterHistory,
  ticketPosterSvgDataUrl,
} from '../lib/ticket-poster.js';
import type { TicketPosterTicket } from '../lib/ticket-poster.js';

type Props = {
  ticket: TicketPosterTicket;
  onNotice: (message: string) => void;
};

type ShareNavigator = Navigator & {
  share?: (data: { title?: string; text?: string; files?: File[] }) => Promise<void>;
  canShare?: (data: { files?: File[] }) => boolean;
};

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export default function TicketPosterTools({ ticket, onNotice }: Props) {
  const [history, setHistory] = useState<TicketPosterTicket[]>([]);
  const [sourceFilter, setSourceFilter] = useState('Zote');
  const [busy, setBusy] = useState(false);
  const previewSrc = useMemo(() => {
    try {
      return ticketPosterSvgDataUrl(ticket);
    } catch {
      return '';
    }
  }, [ticket]);

  useEffect(() => {
    setHistory(readPosterHistory());
  }, []);

  const createFile = async (value: TicketPosterTicket, remember: boolean) => {
    const result = await renderTicketPng(value);
    const file = new File([result.blob], safeFileName(value), { type: 'image/png' });
    if (remember && value.testOnly !== true) {
      const snapshot: TicketPosterTicket = {
        ...value,
        id: `poster-${Date.now()}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
      };
      setHistory(savePosterHistory(snapshot));
    }
    return { blob: result.blob, file };
  };

  const download = async (value: TicketPosterTicket = ticket, remember = true) => {
    if (busy) return;
    setBusy(true);
    try {
      const { blob, file } = await createFile(value, remember);
      saveBlob(blob, file.name);
      onNotice(`PNG imetengenezwa (${value.selections.length} mechi) na kupakuliwa. Hii si bet iliyowekwa.`);
    } catch (error) {
      onNotice((error as Error).message || 'Imeshindikana kutengeneza PNG.');
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { blob, file } = await createFile(ticket, true);
      const shareNavigator = navigator as ShareNavigator;
      if (shareNavigator.share && shareNavigator.canShare?.({ files: [file] })) {
        await shareNavigator.share({ title: 'Wazee wa Betting TZ · Mkeka', text: 'Poster ya uchambuzi wa mechi — cheza kwa uwajibikaji.', files: [file] });
        onNotice('Picha imeshirikishwa.');
      } else {
        saveBlob(blob, file.name);
        onNotice('Kifaa hiki hakiruhusu kushare picha moja kwa moja; PNG imepakuliwa badala yake.');
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') onNotice('Kushare kumeghairiwa.');
      else onNotice((error as Error).message || 'Imeshindikana kushare PNG.');
    } finally {
      setBusy(false);
    }
  };

  const sources = ['Zote', ...Array.from(new Set(history.map((item) => item.sourceLabel || 'BET BUILDER')))];
  const visibleHistory = history.filter((item) => sourceFilter === 'Zote' || (item.sourceLabel || 'BET BUILDER') === sourceFilter);

  return <section className="poster-tools" aria-label="Picha ya mkeka na historia">
    <div className="poster-tools-heading">
      <div><span className="section-overline">PNG · PORTRAIT · HIGH RESOLUTION</span><h4>Poster ya mkeka</h4><p>Muundo hufuata mechi na odds zilizopo; taarifa isiyopatikana haibuniwi.</p></div>
      <span className="poster-source-chip">{ticket.sourceLabel || 'BET BUILDER'}</span>
    </div>
    {previewSrc ? <img className="poster-preview-image" src={previewSrc} alt={`Preview ya poster: ${ticket.title}`} /> : <div className="empty-state"><p>Ongeza chaguo ili kuona preview ya poster.</p></div>}
    <div className="poster-export-actions">
      <button className="primary-button" type="button" onClick={() => void download()} disabled={busy || ticket.selections.length === 0}>{busy ? 'Inatengeneza...' : 'Pakua PNG'}</button>
      <button className="outline-button" type="button" onClick={() => void share()} disabled={busy || ticket.selections.length === 0}>Shiriki picha</button>
    </div>
    <details className="poster-history" open>
      <summary>Historia ya picha <span>{history.length}</span></summary>
      <p className="poster-history-note">Historia huhifadhiwa kwenye kifaa hiki tu; haionekani ndani ya PNG na haipakii data kwenye server.</p>
      {history.length > 0 && <div className="poster-history-toolbar"><label>Chanzo<select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>{sources.map((source) => <option key={source}>{source}</option>)}</select></label><button type="button" className="clear-button" onClick={() => { clearPosterHistory(); setHistory([]); setSourceFilter('Zote'); }}>Futa historia</button></div>}
      {visibleHistory.length === 0 ? <p className="poster-history-empty">Bado hakuna PNG iliyotengenezwa kwenye kifaa hiki.</p> : <ul className="poster-history-list">{visibleHistory.map((item) => <li key={item.id}><div><strong>{item.title}</strong><small>{item.sourceLabel || 'BET BUILDER'} · {item.selections.length} mechi · {item.createdAt ? new Date(item.createdAt).toLocaleString('sw-TZ') : 'Tarehe haijapatikana'}</small></div><button type="button" className="history-download" disabled={busy} onClick={() => void download(item, false)}>Pakua tena</button></li>)}</ul>}
    </details>
  </section>;
}
