export type TicketPosterOutcome = 'home' | 'draw' | 'away';

export interface TicketPosterOdds {
  home?: number | null;
  draw?: number | null;
  away?: number | null;
  selected?: number | null;
  source?: string;
  updatedAt?: string;
}

export interface TicketPosterSelection {
  id?: string | number;
  homeTeam?: string;
  awayTeam?: string;
  home?: string;
  away?: string;
  market?: string;
  prediction?: string;
  selection?: string;
  selectedOutcome?: TicketPosterOutcome;
  competition?: string;
  kickoffAt?: string;
  odds?: TicketPosterOdds;
  homeLogoDataUrl?: string;
  awayLogoDataUrl?: string;
}

export interface TicketPosterTicket {
  id?: string;
  title: string;
  sourceLabel?: string;
  accessLabel?: string;
  dateLabel?: string;
  createdAt?: string;
  statusLabel?: string;
  testOnly?: boolean;
  lockedContent?: boolean;
  selectionCount?: number;
  selections: TicketPosterSelection[];
}

export interface SportsOddsSnapshot {
  market_key: string;
  selection_key: string;
  odds_decimal: number;
  source_updated_at: string | null;
  fetched_at: string;
  provider_name: string;
}

export interface PosterFixtureSource {
  home_name?: string;
  away_name?: string;
  homeTeam?: string;
  awayTeam?: string;
}

export function calculateTotalOdds(selections: TicketPosterSelection[]): number | null;
export function resolveFresh1X2Odds(snapshots: SportsOddsSnapshot[], fixture: PosterFixtureSource, prediction: string, now?: number): TicketPosterOdds | null;
export function getTicketPosterDimensions(ticket: TicketPosterTicket): { width: number; height: number; selectionCount: number };
export function buildTicketPosterSvg(ticket: TicketPosterTicket): string;
export function ticketPosterSvgDataUrl(ticket: TicketPosterTicket): string;
export function renderTicketPng(ticket: TicketPosterTicket): Promise<{ blob: Blob; width: number; height: number }>;
export function safeFileName(ticket: TicketPosterTicket): string;
export function readPosterHistory(storage?: Storage): TicketPosterTicket[];
export function savePosterHistory(ticket: TicketPosterTicket, storage?: Storage): TicketPosterTicket[];
export function clearPosterHistory(storage?: Storage): void;
export function isFreeListing(priceTzs: unknown): boolean;
export function listingAccessLabel(priceTzs: unknown): string;
