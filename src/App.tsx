import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { User } from './lib/firebase';
import { apiRequest, loginWithPhone, logout, registerWithPhone, watchAuth } from './lib/firebase';
import TicketPosterTools from './components/ticket-poster-tools';
import { renderTicketPng, resolveFresh1X2Odds, ticketPosterSvgDataUrl } from './lib/ticket-poster.js';
import type { SportsOddsSnapshot, TicketPosterOdds } from './lib/ticket-poster.js';

type Section = 'overview' | 'marketplace' | 'community' | 'sports' | 'builder' | 'seller' | 'admin' | 'settings';
type Post = { id: string; authorId: string; author: string; text: string; likes: number; liked: boolean; comments: number; time: string };
type Comment = { id: string; body: string; author_name: string; created_at: string };
type Pick = { id: number; home: string; away: string; market: string; selection: string; competition?: string; kickoffAt?: string; providerName?: string; odds?: TicketPosterOdds };
type Profile = { id: string; display_name: string; role: 'buyer' | 'seller' | 'admin'; account_status: string };
type Listing = { id: string; title: string; description_preview: string; sport: string; price_tzs: number; seller_name: string; selection_count: number; created_at: string; is_official?: number; selections?: ListingSelection[] };
type SellerApplication = { id: string; legal_name: string; phone: string; reason: string; status: string; created_at: string; display_name: string };
type MySellerApplication = { id: string; legal_name: string; phone: string; reason: string; status: 'pending' | 'approved' | 'rejected'; created_at: string; reviewed_at: string | null };
type AdminSummary = { users: number; active_sellers: number; pending_seller_applications: number; pending_listings: number; published_listings: number; community_posts: number; sports_fixtures: number; wallet_ledger_entries: number };
type MemberProfile = { id: string; display_name: string; avatar_url: string | null; bio: string | null; role: string; created_at: string; posts_count: number; followers_count: number; following_count: number; published_listings: number; won_selections: number; lost_selections: number };
type AdminUser = { id: string; display_name: string; phone: string | null; role: string; account_status: string; created_at: string };
type AuditEvent = { id: string; action: string; target_type: string; target_id: string; created_at: string; actor_name: string | null };
type WalletLedgerEntry = { id: string; entry_type: string; amount_tzs: number; reference_type: string; reference_id: string; status: string; created_at: string; user_name: string; phone: string | null };
type ListingSelection = { home_name: string; away_name: string; market: string; selection: string; odds_decimal?: number | null; odds_source?: string | null };
type SellerListing = { id: string; title: string; description: string; sport: string; price_tzs: number; status: string; result_status: string; created_at: string; seller_name?: string; selection_count?: number; selections?: ListingSelection[] };
type SportsFixture = { id: string; external_id: string; competition: string; home_name: string; away_name: string; kickoff_at: string; status: string; source_updated_at: string | null; fetched_at: string; provider_name: string; provider_status: string };
type PosterSelection = { homeTeam: string; awayTeam: string; market: string; prediction: string; competition?: string; kickoffAt?: string; odds?: TicketPosterOdds };
type SportsProvider = { id: string; provider_key: string; display_name: string; status: string; last_success_at: string | null; last_error_at: string | null };
type SportsResult = { fixture_id: string; competition: string; home_name: string; away_name: string; kickoff_at: string; home_score: number | null; away_score: number | null; result_status: string; fetched_at: string; provider_name: string };

const formatKickoffForPoster = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('sw-TZ', { timeZone: 'Africa/Dar_es_Salaam', dateStyle: 'medium', timeStyle: 'short' });
};

const toPosterSelections = (items: Pick[]): PosterSelection[] => items.map((pick) => ({
  homeTeam: pick.home,
  awayTeam: pick.away,
  market: pick.market,
  prediction: pick.selection,
  competition: pick.competition,
  kickoffAt: formatKickoffForPoster(pick.kickoffAt),
  odds: pick.odds,
}));

const navItems: { id: Section; label: string; icon: string }[] = [
  { id: 'marketplace', label: 'Uwanja wa mikeka', icon: '▤' },
  { id: 'overview', label: 'Muhtasari', icon: '⌂' },
  { id: 'community', label: 'Jamii', icon: '◎' },
  { id: 'sports', label: 'Michezo', icon: '◉' },
  { id: 'builder', label: 'Jenga mkeka', icon: '＋' },
  { id: 'seller', label: 'Seller Center', icon: '♙' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
  { id: 'admin', label: 'Admin Dashboard', icon: '▦' },
];
const categories = ['Zote', 'Mpira wa miguu', 'Basketball', 'Tennis', 'Mikeka ya bure'];

type DemoTeam = { name: string; logo: string; };
const demoTeams: Record<string, DemoTeam> = {
  'Arsenal': { name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
  'Real Madrid': { name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' },
  'Inter Milan': { name: 'Inter Milan', logo: 'https://media.api-sports.io/football/teams/505.png' },
  'Barcelona': { name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png' },
  'Bayern Munich': { name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png' },
  'Liverpool': { name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png' },
  'PSG': { name: 'Paris Saint-Germain', logo: 'https://media.api-sports.io/football/teams/85.png' },
  'Juventus': { name: 'Juventus', logo: 'https://media.api-sports.io/football/teams/496.png' },
};
const getDemoTeam = (selection: string): DemoTeam => {
  const teamName = Object.keys(demoTeams).find((name) => selection.toLowerCase().includes(name.toLowerCase()));
  return teamName ? demoTeams[teamName] : { name: 'Timu', logo: '' };
};
type DemoTicket = { id: number; title: string; category: string; posted: string; selections: string[]; sampleOdds: string; };
const buildDemoPoster = (ticket: DemoTicket) => ({
  title: ticket.title,
  sourceLabel: 'DEMO PREVIEW',
  accessLabel: 'TEST ONLY',
  dateLabel: 'SAMPLE DATE · NOT A REAL FIXTURE LIST',
  statusLabel: 'SAMPLE DATA · ODDS HAZIJATHIBITISHWA · HAKUNA AI',
  testOnly: true,
  selections: ticket.selections.map((selection, index) => ({
    homeTeam: `SAMPLE · ${getDemoTeam(selection).name}`,
    awayTeam: `SAMPLE OPPONENT ${String(index + 1).padStart(2, '0')}`,
    market: 'SAMPLE PICK',
    prediction: selection,
    competition: 'LIGI HAIPATIKANI · TEST ONLY',
    kickoffAt: 'MUDA HAUPATIKANI · TEST ONLY',
    odds: {
      selected: Math.pow(Number(ticket.sampleOdds), 1 / ticket.selections.length),
      source: 'SYNTHETIC TEST ONLY',
    },
  })),
});

const demoTickets: DemoTicket[] = [
 { id: 1, title: 'Mkeka wa mfano #01', category: 'Mpira wa miguu', posted: 'Mfano wa chapisho', selections: ['Arsenal kushinda', 'Real Madrid zaidi ya magoli 1.5', 'Inter Milan kupata goli'], sampleOdds: '3.40' },
 { id: 2, title: 'Mkeka wa mfano #02', category: 'Mpira wa miguu', posted: 'Mfano wa chapisho', selections: ['Barcelona kushinda au sare', 'Bayern Munich zaidi ya magoli 1.5'], sampleOdds: '2.15' },
 { id: 3, title: 'Mkeka wa mfano #03', category: 'Mpira wa miguu', posted: 'Mfano wa chapisho', selections: ['Liverpool kupata goli', 'PSG zaidi ya kona 3.5', 'Juventus under 4.5'], sampleOdds: '3.05' },
];

function App() {
  const [active, setActive] = useState<Section>('marketplace');
  const [category, setCategory] = useState('Zote');
  const [marketSearch, setMarketSearch] = useState('');
  const [marketSort, setMarketSort] = useState('newest');
  const [demoLiked, setDemoLiked] = useState<number[]>([]);
  const [demoCommentOpen, setDemoCommentOpen] = useState<number | null>(null);
  const [demoCommentDraft, setDemoCommentDraft] = useState('');
  const [demoComments, setDemoComments] = useState<Record<number, string[]>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [appearance, setAppearance] = useState<'light' | 'dark'>(() => (localStorage.getItem('wazee-appearance') as 'light' | 'dark') || 'light');
  const [language, setLanguage] = useState<'sw' | 'en'>(() => (localStorage.getItem('wazee-language') as 'sw' | 'en') || 'sw');
  const [pushEnabled, setPushEnabled] = useState(() => localStorage.getItem('wazee-notifications') !== 'off');
  const [postText, setPostText] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [followingUsers, setFollowingUsers] = useState<string[]>([]);
  const [profileViewId, setProfileViewId] = useState<string | null>(null);
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileEditName, setProfileEditName] = useState('');
  const [profileEditBio, setProfileEditBio] = useState('');
  const [profileEditAvatar, setProfileEditAvatar] = useState('');
  const [commentTarget, setCommentTarget] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [picks, setPicks] = useState<Pick[]>([]);
  const [sampleMode, setSampleMode] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState<SportsFixture | null>(null);
  const [fixtureOdds, setFixtureOdds] = useState<SportsOddsSnapshot[]>([]);
  const [fixtureHome, setFixtureHome] = useState('');
  const [fixtureAway, setFixtureAway] = useState('');
  const [fixtureMarket, setFixtureMarket] = useState('1X2');
  const [fixtureSelection, setFixtureSelection] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerReason, setSellerReason] = useState('');
  const [sellerSent, setSellerSent] = useState(false);
  const [notice, setNotice] = useState('');
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authFirstName, setAuthFirstName] = useState('');
  const [authLastName, setAuthLastName] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [sellerApplications, setSellerApplications] = useState<SellerApplication[]>([]);
  const [mySellerApplication, setMySellerApplication] = useState<MySellerApplication | null>(null);
  const [sellerListings, setSellerListings] = useState<SellerListing[]>([]);
  const [adminListings, setAdminListings] = useState<SellerListing[]>([]);
  const [officialListings, setOfficialListings] = useState<Listing[]>([]);
  const [officialTitle, setOfficialTitle] = useState('');
  const [officialDescription, setOfficialDescription] = useState('');
  const [officialSport, setOfficialSport] = useState('football');
  const [officialHome, setOfficialHome] = useState('');
  const [officialAway, setOfficialAway] = useState('');
  const [officialMarket, setOfficialMarket] = useState('1X2');
  const [officialSelection, setOfficialSelection] = useState('');
  const [officialSelections, setOfficialSelections] = useState<Pick[]>([]);
  const [adminSummary, setAdminSummary] = useState<AdminSummary | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminAudit, setAdminAudit] = useState<AuditEvent[]>([]);
  const [walletLedger, setWalletLedger] = useState<WalletLedgerEntry[]>([]);
  const [sportsFixtures, setSportsFixtures] = useState<SportsFixture[]>([]);
  const [sportsProviders, setSportsProviders] = useState<SportsProvider[]>([]);
  const [sportsResults, setSportsResults] = useState<SportsResult[]>([]);
  const [sportsTab, setSportsTab] = useState<'fixtures' | 'live' | 'results' | 'leagues'>('fixtures');
  const [listingTitle, setListingTitle] = useState('');
  const [listingDescription, setListingDescription] = useState('');
  const [listingSport, setListingSport] = useState('football');
  const [listingPrice, setListingPrice] = useState('');
  const [sellerHome, setSellerHome] = useState('');
  const [sellerAway, setSellerAway] = useState('');
  const [sellerMarket, setSellerMarket] = useState('1X2');
  const [sellerSelection, setSellerSelection] = useState('');
  const [sellerSelections, setSellerSelections] = useState<Pick[]>([]);
  const activeLabel = navItems.find((item) => item.id === active)?.label ?? 'Muhtasari';
  const totalSelections = useMemo(() => picks.length, [picks]);
  const liveStatuses = ['live', '1h', 'ht', '2h', 'et', 'p', 'int', 'in_play'];
  const liveFixtures = sportsFixtures.filter((fixture) => liveStatuses.includes(fixture.status.toLowerCase()));
  const upcomingFixtures = sportsFixtures.filter((fixture) => !liveStatuses.includes(fixture.status.toLowerCase()) && !['finished', 'ft'].includes(fixture.status.toLowerCase()));
  const leagueNames = Array.from(new Set(sportsFixtures.map((fixture) => fixture.competition)));
  const filteredListings = useMemo(() => {
    const query = marketSearch.trim().toLowerCase();
    const filtered = listings.filter((listing) => {
      const matchesCategory = category === 'Zote' || (category === 'Mikeka ya bure' ? listing.price_tzs === 0 : listing.sport.toLowerCase() === (category === 'Mpira wa miguu' ? 'football' : category.toLowerCase()));
      const searchable = (listing.title + ' ' + listing.description_preview + ' ' + listing.seller_name).toLowerCase();
      return matchesCategory && (!query || searchable.includes(query));
    });
    return filtered.sort((a, b) => marketSort === 'price_low' ? a.price_tzs - b.price_tzs : marketSort === 'price_high' ? b.price_tzs - a.price_tzs : b.created_at.localeCompare(a.created_at));
  }, [listings, category, marketSearch, marketSort]);

  useEffect(() => watchAuth((user) => {
    setAuthUser(user);
    setAuthReady(true);
    if (!user) { setProfile(null); return; }
    void apiRequest<{ user: Profile }>('/api/v1/me', user)
      .then((data) => setProfile(data.user))
      .catch((error: Error) => { setProfile(null); setNotice(error.message); });
  }), []);

  useEffect(() => {
    if (active === 'marketplace') {
      void apiRequest<{ items: Listing[] }>('/api/v1/listings')
        .then((data) => setListings(data.items || []))
        .catch(() => setNotice('Marketplace haipatikani kwa sasa.'));
    }
    if (active === 'community') {
      void apiRequest<{ items: Array<{ id: string; author_id: string; body: string; author_name: string; likes_count: number; comments_count: number; created_at: string; is_following: number }> }>('/api/v1/community/posts', authUser)
        .then((data) => { const items = data.items || []; setPosts(items.map((post) => ({ id: post.id, authorId: post.author_id, author: post.author_name || 'Mwanachama', text: post.body, likes: post.likes_count || 0, liked: false, comments: post.comments_count || 0, time: post.created_at }))); setFollowingUsers(items.filter((post) => post.is_following === 1).map((post) => post.author_id)); });
    }
    if (active === 'sports') {
      void Promise.all([
        apiRequest<{ items: SportsFixture[] }>('/api/v1/sports/fixtures'),
        apiRequest<{ items: SportsProvider[] }>('/api/v1/sports/providers'),
        apiRequest<{ items: SportsResult[] }>('/api/v1/sports/results'),
      ]).then(([fixtures, providers, results]) => { setSportsFixtures(fixtures.items || []); setSportsProviders(providers.items || []); setSportsResults(results.items || []); })
        .catch(() => setNotice('Data za michezo haipatikani kwa sasa.'));
    }
    if (active === 'seller' && authUser && profile?.role === 'seller') {
      void apiRequest<{ items: SellerListing[] }>('/api/v1/seller/listings/me', authUser)
        .then((data) => setSellerListings(data.items || []))
        .catch((error: Error) => setNotice(error.message));
    }
    if (active === 'seller' && authUser && profile?.role === 'buyer') {
      void apiRequest<{ application: MySellerApplication | null }>('/api/v1/seller-applications/me', authUser)
        .then((data) => setMySellerApplication(data.application))
        .catch((error: Error) => setNotice(error.message));
    }
    if (active === 'admin' && authUser && profile?.role === 'admin') {
      void Promise.all([
        apiRequest<{ items: SellerApplication[] }>('/api/v1/admin/seller-applications', authUser),
        apiRequest<{ items: SellerListing[] }>('/api/v1/admin/listings', authUser),
        apiRequest<{ items: Listing[] }>('/api/v1/admin/official-listings', authUser),
        apiRequest<{ summary: AdminSummary }>('/api/v1/admin/summary', authUser),
        apiRequest<{ items: AdminUser[] }>('/api/v1/admin/users', authUser),
        apiRequest<{ items: AuditEvent[] }>('/api/v1/admin/audit-events', authUser),
        apiRequest<{ items: WalletLedgerEntry[] }>('/api/v1/admin/wallet/ledger', authUser),
      ]).then(([applications, pendingListings, official, summary, users, audit, ledger]) => { setSellerApplications(applications.items || []); setAdminListings(pendingListings.items || []); setOfficialListings(official.items || []); setAdminSummary(summary.summary); setAdminUsers(users.items || []); setAdminAudit(audit.items || []); setWalletLedger(ledger.items || []); })
        .catch((error: Error) => setNotice(error.message));
    }
  }, [active, authUser, profile?.role]);

  const go = (section: Section) => { setActive(section); setMobileMenuOpen(false); setNotice(''); };
  useEffect(() => { localStorage.setItem('wazee-appearance', appearance); }, [appearance]);
  useEffect(() => { localStorage.setItem('wazee-language', language); }, [language]);
  useEffect(() => { localStorage.setItem('wazee-notifications', pushEnabled ? 'on' : 'off'); }, [pushEnabled]);
  const openFixtureInBuilder = async (fixture: SportsFixture) => {
    setSelectedFixture(fixture); setFixtureOdds([]); setFixtureHome(fixture.home_name); setFixtureAway(fixture.away_name); setFixtureMarket('1X2'); setFixtureSelection(''); setSampleMode(false);
    go('builder');
    try {
      const data = await apiRequest<{ items: SportsOddsSnapshot[] }>(`/api/v1/sports/odds?fixture_id=${encodeURIComponent(fixture.id)}`);
      setFixtureOdds(data.items || []);
      if (!data.items?.length) setNotice('Mechi imechaguliwa kutoka provider; odds hazijapatikana, hivyo poster itaonyesha wazi kuwa hazipo.');
    } catch {
      setNotice('Mechi imechaguliwa kutoka provider lakini odds hazijapatikana. Hakuna odds zitakazobuniwa.');
    }
  };
  const loadSampleTicket = () => {
    const sample: Pick[] = Array.from({ length: 3 }, (_, index) => ({
      id: Date.now() + index,
      home: `SAMPLE HOME CLUB ${String(index + 1).padStart(2, '0')}`,
      away: `SAMPLE AWAY CLUB ${String(index + 1).padStart(2, '0')}`,
      market: '1X2 · TEST',
      selection: '1 · SAMPLE HOME WIN',
      competition: `SAMPLE LEAGUE ${String(index + 1).padStart(2, '0')}`,
      kickoffAt: `${String(17 + index).padStart(2, '0')}:30 · TEST TIME`,
      providerName: 'SYNTHETIC TEST DATA',
      odds: { home: 1.45, draw: 3.2, away: 5.4, selected: 1.45, source: 'SYNTHETIC TEST ONLY' },
    }));
    setPicks(sample); setSampleMode(true); setSelectedFixture(null); setFixtureOdds([]); setFixtureHome(''); setFixtureAway(''); setFixtureSelection('');
    setNotice('Mkeka wa mfano umewekwa kwa ajili ya kujaribu muonekano tu. Timu, ligi, muda na odds si data halisi; hakuna AI wala bet iliyowekwa.');
  };
  const addPick = () => {
    if (!fixtureHome.trim() || !fixtureAway.trim() || !fixtureSelection.trim()) {
      setNotice('Jaza timu zote mbili na chaguo lako kabla ya kuongeza.');
      return;
    }
    const activeFixture = selectedFixture && selectedFixture.home_name === fixtureHome.trim() && selectedFixture.away_name === fixtureAway.trim() ? selectedFixture : null;
    const odds = activeFixture && fixtureMarket === '1X2' ? resolveFresh1X2Odds(fixtureOdds, activeFixture, fixtureSelection) ?? undefined : undefined;
    const newPick: Pick = { id: Date.now(), home: fixtureHome.trim(), away: fixtureAway.trim(), market: fixtureMarket, selection: fixtureSelection.trim(), competition: activeFixture?.competition, kickoffAt: activeFixture?.kickoff_at, providerName: activeFixture?.provider_name, odds };
    setPicks((current) => sampleMode ? [newPick] : [...current, newPick]);
    setSampleMode(false); setSelectedFixture(null); setFixtureOdds([]); setFixtureHome(''); setFixtureAway(''); setFixtureSelection('');
    setNotice('Chaguo limeongezwa kwenye mkeka wako wa maandalizi.');
  };
  const publishPost = async () => {
    if (!postText.trim()) return;
    if (!authUser) { setAuthMode('login'); setNotice('Ingia kwanza ili kuchapisha post.'); return; }
    try {
      await apiRequest('/api/v1/community/posts', authUser, { method: 'POST', body: JSON.stringify({ body: postText.trim() }) });
      setPostText('');
      const data = await apiRequest<{ items: Array<{ id: string; author_id: string; body: string; author_name: string; likes_count: number; comments_count: number; created_at: string; is_following: number }> }>('/api/v1/community/posts', authUser);
      const items = data.items || []; setPosts(items.map((post) => ({ id: post.id, authorId: post.author_id, author: post.author_name || 'Mwanachama', text: post.body, likes: post.likes_count || 0, liked: false, comments: post.comments_count || 0, time: post.created_at }))); setFollowingUsers(items.filter((post) => post.is_following === 1).map((post) => post.author_id));
      setNotice('Post imechapishwa kwenye jamii.');
    } catch (error) { setNotice((error as Error).message || 'Imeshindikana kuchapisha post.'); }
  };

  const openMemberProfile = async (userId: string) => {
    setProfileViewId(userId); setMemberProfile(null); setProfileBusy(true);
    try {
      const data = await apiRequest<{ profile: MemberProfile }>('/api/v1/users/' + userId + '/profile');
      setMemberProfile(data.profile); setProfileEditName(data.profile.display_name || ''); setProfileEditBio(data.profile.bio || ''); setProfileEditAvatar(data.profile.avatar_url || '');
    } catch (error) { setNotice((error as Error).message); setProfileViewId(null); }
    finally { setProfileBusy(false); }
  };

  const saveMemberProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser || !memberProfile || memberProfile.id !== authUser.uid) return;
    try {
      const data = await apiRequest<{ profile: MemberProfile }>('/api/v1/me/profile', authUser, { method: 'PUT', body: JSON.stringify({ display_name: profileEditName, bio: profileEditBio, avatar_url: profileEditAvatar }) });
      setMemberProfile((current) => current ? { ...current, ...data.profile } : data.profile);
      setProfile((current) => current ? { ...current, display_name: data.profile.display_name } : current);
      setNotice('Wasifu umesasishwa.');
    } catch (error) { setNotice((error as Error).message); }
  };

  const toggleFollow = async (userId: string) => {
    if (!authUser) { setAuthMode('login'); setNotice('Ingia kwanza ili kufuatilia mwanachama.'); return; }
    try {
      const result = await apiRequest<{ followed: boolean }>('/api/v1/users/' + userId + '/follow', authUser, { method: 'PUT' });
      setFollowingUsers((current) => result.followed ? [...current.filter((id) => id !== userId), userId] : current.filter((id) => id !== userId));
    } catch (error) { setNotice((error as Error).message); }
  };

  const toggleDemoLike = (ticketId: number) => {
    setDemoLiked((current) => current.includes(ticketId) ? current.filter((id) => id !== ticketId) : [...current, ticketId]);
  };

  const submitDemoComment = (ticketId: number) => {
    if (!demoCommentDraft.trim()) return;
    setDemoComments((current) => ({ ...current, [ticketId]: [...(current[ticketId] || []), demoCommentDraft.trim()] }));
    setDemoCommentDraft('');
    setNotice('Maoni ya mfano yameongezwa kwenye chapisho hili.');
  };

  const exportDemoTicket = async (ticket: DemoTicket, shouldShare = false) => {
    const demoPoster = buildDemoPoster(ticket);
    try {
      const result = await renderTicketPng(demoPoster);
      const file = new File([result.blob], `TEST-ONLY-wazee-ticket-${ticket.id}.png`, { type: 'image/png' });
      if (shouldShare && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'Wazee wa Betting TZ · TEST ONLY', text: 'Picha hii ni mfano wa muundo tu; si mechi au odds halisi.', files: [file] });
        setNotice('PNG ya mfano imeshirikishwa. Ni TEST ONLY, si mkeka halisi.');
      } else {
        const url = URL.createObjectURL(result.blob);
        const anchor = document.createElement('a');
        anchor.href = url; anchor.download = file.name; anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
        setNotice(shouldShare ? 'Kifaa hiki hakiruhusu file share; PNG ya TEST ONLY imepakuliwa.' : 'PNG ya TEST ONLY imepakuliwa; si tip au odds halisi.');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') setNotice((error as Error).message || 'Imeshindikana kutengeneza PNG ya mfano.');
    }
  };

  const shareDemoTicket = async (ticket: DemoTicket) => exportDemoTicket(ticket, true);

  const toggleLike = async (postId: string) => {
    if (!authUser) { setAuthMode('login'); setNotice('Ingia kwanza ili kuweka like.'); return; }
    try {
      const result = await apiRequest<{ liked: boolean }>('/api/v1/community/posts/' + postId + '/like', authUser, { method: 'PUT' });
      setPosts((current) => current.map((post) => post.id === postId ? { ...post, liked: result.liked, likes: post.likes + (result.liked ? 1 : -1) } : post));
    } catch (error) { setNotice((error as Error).message); }
  };

  const openComments = async (postId: string) => {
    if (!authUser) { setAuthMode('login'); setNotice('Ingia kwanza ili kuona na kuandika maoni.'); return; }
    setCommentTarget(postId); setCommentDraft('');
    try {
      const data = await apiRequest<{ items: Comment[] }>('/api/v1/community/posts/' + postId + '/comments', authUser);
      setComments(data.items || []);
    } catch (error) { setNotice((error as Error).message); }
  };

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser || !commentTarget || !commentDraft.trim()) return;
    try {
      await apiRequest('/api/v1/community/posts/' + commentTarget + '/comments', authUser, { method: 'POST', body: JSON.stringify({ body: commentDraft.trim() }) });
      const data = await apiRequest<{ items: Comment[] }>('/api/v1/community/posts/' + commentTarget + '/comments', authUser);
      setComments(data.items || []); setCommentDraft('');
      setPosts((current) => current.map((post) => post.id === commentTarget ? { ...post, comments: post.comments + 1 } : post));
    } catch (error) { setNotice((error as Error).message); }
  };

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setAuthBusy(true); setAuthError('');
    try {
      let user: User;
      if (authMode === 'register') {
        if (!authFirstName.trim() || !authLastName.trim()) throw new Error('Jaza jina la kwanza na la mwisho.');
        if (authPassword.length < 6) throw new Error('Password iwe na angalau herufi/namba 6.');
        if (authPassword !== authConfirmPassword) throw new Error('Password na uthibitisho wake havifanani.');
        user = await registerWithPhone(authPhone, authPassword, authFirstName, authLastName);
      } else user = await loginWithPhone(authPhone, authPassword);
      const data = await apiRequest<{ user: Profile }>('/api/v1/me', user);
      setProfile(data.user); setAuthUser(user); setAuthMode(null); setAuthPassword(''); setAuthConfirmPassword('');
      setNotice('Umeingia kikamilifu. Karibu!');
    } catch (error) { setAuthError((error as Error).message || 'Imeshindikana. Jaribu tena.'); }
    finally { setAuthBusy(false); }
  };

  const addOfficialSelection = () => {
    if (!officialHome.trim() || !officialAway.trim() || !officialSelection.trim()) { setNotice('Jaza timu zote mbili na chaguo la mechi.'); return; }
    if (officialSelections.length >= 30) { setNotice('Mkeka mmoja unaweza kuwa na selections zisizozidi 30.'); return; }
    setOfficialSelections((current) => [...current, { id: Date.now(), home: officialHome.trim(), away: officialAway.trim(), market: officialMarket, selection: officialSelection.trim() }]);
    setOfficialHome(''); setOfficialAway(''); setOfficialSelection('');
  };

  const publishOfficialListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser || profile?.role !== 'admin') { setNotice('Ruhusa ya Admin inahitajika.'); return; }
    if (!officialSelections.length) { setNotice('Ongeza angalau mechi moja kabla ya kuchapisha.'); return; }
    try {
      await apiRequest('/api/v1/admin/official-listings', authUser, { method: 'POST', body: JSON.stringify({ title: officialTitle, description: officialDescription, sport: officialSport, selections: officialSelections.map((item) => ({ home_name: item.home, away_name: item.away, market: item.market, selection: item.selection })) }) });
      setOfficialTitle(''); setOfficialDescription(''); setOfficialSelections([]);
      const data = await apiRequest<{ items: Listing[] }>('/api/v1/admin/official-listings', authUser);
      setOfficialListings(data.items || []);
      const market = await apiRequest<{ items: Listing[] }>('/api/v1/listings');
      setListings(market.items || []);
      setNotice('Mkeka rasmi umechapishwa na kuhifadhiwa. Unaonekana kwenye Uwanja wa Mikeka.');
    } catch (error) { setNotice((error as Error).message || 'Imeshindikana kuchapisha mkeka rasmi.'); }
  };

  const addSellerSelection = () => {
    if (!sellerHome.trim() || !sellerAway.trim() || !sellerSelection.trim()) { setNotice('Jaza timu zote mbili na chaguo la mechi.'); return; }
    if (sellerSelections.length >= 30) { setNotice('Listing moja inaweza kuwa na selections zisizozidi 30.'); return; }
    setSellerSelections((current) => [...current, { id: Date.now(), home: sellerHome.trim(), away: sellerAway.trim(), market: sellerMarket, selection: sellerSelection.trim() }]);
    setSellerHome(''); setSellerAway(''); setSellerSelection('');
  };

  const createListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser) return;
    try {
      await apiRequest('/api/v1/seller/listings', authUser, { method: 'POST', body: JSON.stringify({ title: listingTitle, description: listingDescription, sport: listingSport, price_tzs: Number(listingPrice), selections: sellerSelections.map((item) => ({ home_name: item.home, away_name: item.away, market: item.market, selection: item.selection })) }) });
      setListingTitle(''); setListingDescription(''); setListingPrice(''); setSellerSelections([]);
      const data = await apiRequest<{ items: SellerListing[] }>('/api/v1/seller/listings/me', authUser);
      setSellerListings(data.items || []); setNotice('Listing imetumwa kwa Admin kwa ukaguzi kabla ya kuchapishwa.');
    } catch (error) { setNotice((error as Error).message); }
  };

  const setUserAccountStatus = async (id: string, status: 'active' | 'suspended') => {
    if (!authUser) return;
    try {
      await apiRequest('/api/v1/admin/users/' + id + '/status', authUser, { method: 'POST', body: JSON.stringify({ status }) });
      setAdminUsers((current) => current.map((item) => item.id === id ? { ...item, account_status: status } : item));
      setNotice(status === 'suspended' ? 'Akaunti imesimamishwa.' : 'Akaunti imewezeshwa tena.');
    } catch (error) { setNotice((error as Error).message); }
  };

  const reviewListing = async (id: string, decision: 'published' | 'rejected') => {
    if (!authUser) return;
    try {
      await apiRequest('/api/v1/admin/listings/' + id + '/decision', authUser, { method: 'POST', body: JSON.stringify({ decision }) });
      setAdminListings((current) => current.filter((listing) => listing.id !== id));
      setNotice(decision === 'published' ? 'Listing imechapishwa sokoni.' : 'Listing imekataliwa.');
    } catch (error) { setNotice((error as Error).message); }
  };

  const reviewSeller = async (id: string, decision: 'approved' | 'rejected') => {
    if (!authUser) return;
    try {
      await apiRequest('/api/v1/admin/seller-applications/' + id + '/decision', authUser, { method: 'POST', body: JSON.stringify({ decision }) });
      const data = await apiRequest<{ items: SellerApplication[] }>('/api/v1/admin/seller-applications', authUser);
      setSellerApplications(data.items || []); setNotice('Uamuzi wa ombi umehifadhiwa.');
    } catch (error) { setNotice((error as Error).message); }
  };

  const pageContent = () => {
    if (active === 'marketplace') return <section className="module-page market-feed-page">
      <div className="market-feed-heading">
        <div><span className="section-overline">WAZEE WA BETTING TZ · RASMI</span><h1>Uwanja wa Mikeka</h1><p>Mikeka iliyoshirikishwa na wachambuzi wa jukwaa.</p></div>
        <button className="primary-button" onClick={() => go('builder')}>＋ Jenga mkeka</button>
      </div>
      <div className="official-banner"><span className="official-avatar">W</span><div><strong>Wazee wa Betting TZ <span className="blue-tick" aria-label="Akaunti rasmi iliyothibitishwa">✓</span></strong><small>Akaunti rasmi ya jukwaa · Mikeka rasmi na ya wachambuzi walioidhinishwa</small></div><span className="official-tag">RASMI</span></div>
      <div className="demo-notice"><strong>TAARIFA:</strong> Mikeka 3 hapa ni mifano ya kuonyesha muundo wa machapisho. Si mechi za sasa, si odds za live, na haimaanishi ushindi umehakikishwa.</div>
      <div className="market-toolbar"><div className="filter-row">{categories.map((item) => <button key={item} className={category === item ? 'filter-chip selected' : 'filter-chip'} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="market-search-controls"><input className="search-input" value={marketSearch} onChange={(event) => setMarketSearch(event.target.value)} placeholder="Tafuta mkeka..." /><select className="market-sort" value={marketSort} onChange={(event) => setMarketSort(event.target.value)}><option value="newest">Mpya kwanza</option><option value="price_low">Bei: ndogo kwanza</option><option value="price_high">Bei: kubwa kwanza</option></select></div></div>
      <div className="feed-section-label"><strong>Mikeka iliyopostiwa</strong><span>{demoTickets.filter((ticket) => (category === 'Zote' || category === 'Mikeka ya bure' || ticket.category === category) && (!marketSearch || (ticket.title + ' ' + ticket.selections.join(' ')).toLowerCase().includes(marketSearch.toLowerCase()))).length + filteredListings.length} machapisho</span></div>
      <div className="listing-grid feed-listing-grid">
        {demoTickets.filter((ticket) => (category === 'Zote' || category === 'Mikeka ya bure' || ticket.category === category) && (!marketSearch || (ticket.title + ' ' + ticket.selections.join(' ')).toLowerCase().includes(marketSearch.toLowerCase()))).map((ticket) => <article className="listing-card demo-ticket-card" key={'demo-' + ticket.id}>
          <div className="ticket-author-row"><span className="official-avatar small">W</span><div><strong>Wazee wa Betting TZ <span className="blue-tick" aria-label="Akaunti rasmi iliyothibitishwa">✓</span></strong><small>{ticket.posted}</small></div><span className="demo-pill">DEMO</span></div>
          <div className="ticket-poster-render" style={{ background: '#080d15', borderRadius: 16, overflow: 'hidden', lineHeight: 0 }}>
            <img
              src={ticketPosterSvgDataUrl(buildDemoPoster(ticket))}
              alt={`${ticket.title} — poster ya mfano ya TEST ONLY`}
              loading="lazy"
              style={{ display: 'block', width: '100%', height: 'auto' }}
            />
          </div>
          <div className="ticket-poster-source"><span>ODDS, LOGOS NA MATOKEO HALISI HUONYESHWA TU ZIKIPATIKANA</span><b>DEMO PREVIEW</b></div>
          <div className="demo-social-actions">
            <button className={demoLiked.includes(ticket.id) ? 'social-action is-liked' : 'social-action'} onClick={() => toggleDemoLike(ticket.id)} aria-pressed={demoLiked.includes(ticket.id)}><span>♥</span> Like <small>{demoLiked.includes(ticket.id) ? '1' : '0'}</small></button>
            <button className="social-action" onClick={() => { setDemoCommentOpen(demoCommentOpen === ticket.id ? null : ticket.id); setDemoCommentDraft(''); }}><span>▢</span> Maoni <small>{(demoComments[ticket.id] || []).length}</small></button>
            <button className="social-action ticket-export" onClick={() => void exportDemoTicket(ticket)}><span>↓</span> DOWNLOAD PNG</button>
            <button className="social-action ticket-share" onClick={() => void shareDemoTicket(ticket)}><span>↗</span> SHARE IMAGE</button>
          </div>
          {demoCommentOpen === ticket.id && <div className="demo-comment-box">
            {(demoComments[ticket.id] || []).map((comment, index) => <p className="demo-comment-item" key={index}><strong>Mwanachama:</strong> {comment}</p>)}
            <form onSubmit={(event) => { event.preventDefault(); submitDemoComment(ticket.id); }}><input value={demoCommentDraft} onChange={(event) => setDemoCommentDraft(event.target.value)} placeholder="Andika maoni..." maxLength={300} /><button type="submit" disabled={!demoCommentDraft.trim()}>Tuma</button></form>
            <small>Maoni haya ni ya majaribio na yanabaki kwenye kifaa hiki kwa muda wa ukurasa.</small>
          </div>}
        </article>)}
        {filteredListings.map((listing) => <article className="listing-card" key={listing.id}>
          <div className="ticket-author-row"><span className={listing.is_official ? 'official-avatar small' : 'avatar'}>{listing.is_official ? 'W' : (listing.seller_name || 'S').slice(0,1).toUpperCase()}</span><div><strong>{listing.is_official ? 'Wazee wa Betting TZ' : listing.seller_name}{listing.is_official ? <> <span className="blue-tick" aria-label="Akaunti rasmi iliyothibitishwa">✓</span></> : null}</strong><small>{new Date(listing.created_at).toLocaleString('sw-TZ')} · {listing.is_official ? 'Chapisho rasmi' : 'Seller tips'}</small></div><span className={listing.is_official ? 'official-tag' : 'demo-pill'}>{listing.is_official ? 'RASMI' : listing.price_tzs === 0 ? 'BURE' : 'PREMIUM'}</span></div>
          {listing.selections?.length ? <div className="ticket-poster-render" style={{ background: '#080d15', borderRadius: 16, overflow: 'hidden', lineHeight: 0 }}>
            <img src={ticketPosterSvgDataUrl({ title: listing.title, sourceLabel: listing.is_official ? 'WAZEE WA BETTING TZ' : listing.seller_name, accessLabel: listing.price_tzs === 0 ? 'FREE' : 'PREMIUM', dateLabel: new Date(listing.created_at).toLocaleString('sw-TZ'), statusLabel: listing.selections.some((item) => Number(item.odds_decimal) > 1) ? 'ODDS ZILIZOPO ZINATOKA KWENYE CHANZO KILICHOTHIBITISHWA' : 'ODDS HAZIJATHIBITISHWA · HAZIJAONYESHWA', selections: listing.selections.map((item) => ({ homeTeam: item.home_name, awayTeam: item.away_name, market: item.market, prediction: item.selection, odds: Number(item.odds_decimal) > 1 ? { selected: item.odds_decimal, source: item.odds_source || 'Provider' } : undefined })) })} alt={listing.title + ' poster'} loading="lazy" style={{ display: 'block', width: '100%', height: 'auto' }} />
          </div> : <div className="empty-state">Mkeka huu hauna selections zilizohifadhiwa.</div>}
          <p>{listing.description_preview}</p><div className="ticket-poster-source"><span>UCHAMBUZI TU · HAKUNA UHAKIKA WA USHINDI</span><b>{listing.price_tzs === 0 ? 'BURE' : listing.price_tzs.toLocaleString('en-US') + ' TSh'}</b></div>
        </article>)}
      </div>
      {demoTickets.filter((ticket) => (category === 'Zote' || category === 'Mikeka ya bure' || ticket.category === category) && (!marketSearch || (ticket.title + ' ' + ticket.selections.join(' ')).toLowerCase().includes(marketSearch.toLowerCase()))).length === 0 && filteredListings.length === 0 && <div className="empty-state"><h3>Hakuna mkeka unaolingana</h3><p>Badili utafutaji au kundi ulilochagua.</p></div>}
    </section>;
    if (active === 'community') return <section className="module-page">
      <div className="module-intro"><div><span className="section-overline">SOCIAL NETWORK</span><h2>Jamii ya Wazee</h2><p>Jadili michezo, shiriki uchambuzi na fuatilia wachambuzi.</p></div></div>
      <div className="community-layout"><div className="feed-column"><div className="composer"><div className="avatar">W</div><div className="composer-body"><textarea value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="Una maoni gani kuhusu michezo ya leo?" /><div className="composer-footer"><span>Shiriki kwa heshima. Epuka madai ya ushindi wa uhakika.</span><button className="primary-button" onClick={publishPost} disabled={!postText.trim()}>Chapisha</button></div></div></div>
      {posts.length === 0 ? <div className="empty-state"><div className="empty-illustration">◎</div><h3>Karibu kwenye jamii</h3><p>Bado hakuna post zilizochapishwa. Ingia ili uwe wa kwanza kushiriki.</p></div> : posts.map((post) => <article className="post-card" key={post.id}><div className="post-head"><div className="avatar">W</div><div><button className="profile-name-button" onClick={() => void openMemberProfile(post.authorId)}>{post.author}</button><small>{post.time}</small></div>{authUser && post.authorId !== authUser.uid ? <button className="follow-button" onClick={() => void toggleFollow(post.authorId)}>{followingUsers.includes(post.authorId) ? 'Unafuatilia' : '+ Fuata'}</button> : <span className="post-menu">•••</span>}</div><p>{post.text}</p><div className="post-actions"><button onClick={() => void toggleLike(post.id)} className={post.liked ? 'liked' : ''}>♡ {post.likes} Likes</button><button onClick={() => void openComments(post.id)}>▢ {post.comments} Maoni</button><button onClick={() => setNotice('Kushare post kutawashwa kwenye toleo lijalo.')}>↗ Shiriki</button></div>{commentTarget === post.id && <div className="comment-panel"><div className="comment-list">{comments.length === 0 ? <p>Bado hakuna maoni.</p> : comments.map((comment) => <div className="comment-row" key={comment.id}><strong>{comment.author_name || 'Mwanachama'}</strong><p>{comment.body}</p></div>)}</div><form onSubmit={(event) => void submitComment(event)}><input value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder="Andika maoni..." maxLength={2000} /><button type="submit" disabled={!commentDraft.trim()}>Tuma</button><button type="button" onClick={() => setCommentTarget(null)}>Funga</button></form></div>}</article>)}</div>
      <aside className="community-aside"><div className="aside-card"><span className="section-overline">KANUNI ZA JAMII</span><h3>Uwazi kwanza</h3><p>Hakuna tips za uhakika, matokeo ya kubuni au udanganyifu wa takwimu. Rekodi za tipster zitathibitishwa kwa matokeo halisi.</p></div><div className="aside-card"><span className="section-overline">JENGA WASIFU</span><h3>Fuata maendeleo yako</h3><p>Fuata wanachama moja kwa moja kutoka kwenye post zao. Wasifu na leaderboard vitafuata.</p></div></aside></div>
    </section>;
    if (active === 'sports') return <section className="module-page"><div className="module-intro"><div><span className="section-overline">SPORTS DATA</span><h2>Michezo na matokeo</h2><p>Ratiba na matokeo hutolewa kutoka D1 kwa chanzo na muda wa mwisho wa data.</p></div><span className="source-badge">{sportsProviders.some((provider) => provider.status === 'healthy') ? 'Provider healthy' : 'Provider haijawezeshwa'}</span></div><div className="sports-tabs"><button className={sportsTab === 'fixtures' ? 'sports-tab active' : 'sports-tab'} onClick={() => setSportsTab('fixtures')}>Ratiba</button><button className={sportsTab === 'live' ? 'sports-tab active' : 'sports-tab'} onClick={() => setSportsTab('live')}>Live</button><button className={sportsTab === 'results' ? 'sports-tab active' : 'sports-tab'} onClick={() => setSportsTab('results')}>Matokeo</button><button className={sportsTab === 'leagues' ? 'sports-tab active' : 'sports-tab'} onClick={() => setSportsTab('leagues')}>Ligi</button></div>{sportsTab === 'results' ? sportsResults.length === 0 ? <div className="empty-state large-empty"><h3>Hakuna matokeo yaliyothibitishwa</h3><p>Matokeo yataonekana baada ya kupokelewa kutoka provider.</p></div> : <div className="fixture-list">{sportsResults.map((result) => <article className="fixture-card" key={result.fixture_id}><div className="fixture-meta"><strong>{result.competition}</strong><span>{result.result_status}</span></div><div className="result-teams"><strong>{result.home_name}</strong><b>{result.home_score ?? '—'} : {result.away_score ?? '—'}</b><strong>{result.away_name}</strong></div><div className="fixture-foot"><span>Chanzo: {result.provider_name}</span><small>Ilipokelewa: {new Date(result.fetched_at).toLocaleString('sw-TZ')}</small></div></article>)}</div> : sportsTab === 'leagues' ? leagueNames.length === 0 ? <div className="empty-state large-empty"><h3>Hakuna ligi zenye data bado</h3><p>Ligi zitaonekana baada ya fixtures halisi kuingizwa.</p></div> : <div className="league-grid">{leagueNames.map((league) => <div className="league-card" key={league}><span>◉</span><strong>{league}</strong><small>{sportsFixtures.filter((fixture) => fixture.competition === league).length} fixtures</small></div>)}</div> : (sportsTab === 'live' ? liveFixtures : upcomingFixtures).length === 0 ? <div className="empty-state large-empty"><div className="empty-illustration">◉</div><h3>{sportsTab === 'live' ? 'Hakuna mechi live zilizothibitishwa' : 'Hakuna fixtures zilizothibitishwa bado'}</h3><p>Data itaonekana baada ya kuingizwa kutoka provider aliyethibitishwa. Hatutengenezi mechi au odds za kubuni.</p><button className="outline-button" onClick={() => go('builder')}>Fungua bet builder →</button></div> : <div className="fixture-list">{(sportsTab === 'live' ? liveFixtures : upcomingFixtures).map((fixture) => <article className="fixture-card" key={fixture.id}><div className="fixture-meta"><strong>{fixture.competition}</strong><span>{new Date(fixture.kickoff_at).toLocaleString('sw-TZ',{dateStyle:'medium',timeStyle:'short'})}</span></div><div className="fixture-teams"><strong>{fixture.home_name}</strong><span>VS</span><strong>{fixture.away_name}</strong></div><div className="fixture-foot"><span>{fixture.status}</span><small>Chanzo: {fixture.provider_name} · Ilipokelewa: {new Date(fixture.fetched_at).toLocaleString('sw-TZ')}</small><button className="fixture-add-button" onClick={() => void openFixtureInBuilder(fixture)}>Jenga mkeka</button></div></article>)}</div>}</section>;
    if (active === 'builder') return <section className="module-page"><div className="module-intro"><div><span className="section-overline">TICKET BUILDER</span><h2>Jenga mkeka wako</h2><p>Andaa chaguo zako. Odds hazijazalishwa; zitaongezwa tu kutoka chanzo kilichothibitishwa.</p></div><span className="count-pill">{totalSelections} selections</span></div><div className="builder-layout"><div className="builder-form"><h3>Ongeza mechi / chaguo</h3><label>Timu ya nyumbani<input value={fixtureHome} onChange={(e) => setFixtureHome(e.target.value)} placeholder="Mfano: Timu A" /></label><label>Timu ya ugenini<input value={fixtureAway} onChange={(e) => setFixtureAway(e.target.value)} placeholder="Mfano: Timu B" /></label><label>Soko<select value={fixtureMarket} onChange={(e) => setFixtureMarket(e.target.value)}><option>1X2</option><option>Over / Under</option><option>Both Teams To Score</option><option>Double Chance</option><option>Other</option></select></label><label>Chaguo lako<input value={fixtureSelection} onChange={(e) => setFixtureSelection(e.target.value)} placeholder="Andika selection" /></label><button className="primary-button" onClick={addPick}>＋ Ongeza selection</button><button className="outline-button" type="button" onClick={loadSampleTicket}>Jaza mkeka wa mfano (TEST ONLY)</button><p className="muted-note">Mfano huu ni wa kujaribu poster tu; si AI, si mechi/odds halisi, na hauwezi kuwekwa kama bet.</p></div><div className="builder-slip"><div className="slip-head"><div><span className="section-overline">BET SLIP PREVIEW</span><h3>Mkeka wako</h3></div><button className="clear-button" onClick={() => { setPicks([]); setSampleMode(false); }} disabled={!picks.length}>Futa yote</button></div>{picks.length === 0 ? <div className="slip-empty">Chaguo zako zitaonekana hapa. Anza kwa kujaza fomu.</div> : picks.map((pick, index) => <div className="selection-row" key={pick.id}><span className="selection-number">{index + 1}</span><div><strong>{pick.home} vs {pick.away}</strong><small>{pick.market} · {pick.selection}</small></div><button aria-label="Ondoa selection" onClick={() => setPicks((current) => current.filter((p) => p.id !== pick.id))}>×</button></div>)}<div className="slip-note">Huu ni muundo wa kuandaa na kushare chaguo. Hakuna stake, malipo au uwekaji bet unaofanyika hapa.</div></div></div>{picks.length > 0 && <TicketPosterTools ticket={{ title: sampleMode ? 'Mkeka wa mfano · TEST ONLY' : 'Mkeka wa maandalizi', sourceLabel: sampleMode ? 'SAMPLE TICKET' : (picks.some((item) => item.providerName) ? 'SPORTS PROVIDER' : 'BET BUILDER'), accessLabel: sampleMode ? 'TEST ONLY' : 'DRAFT', dateLabel: new Date().toLocaleString('sw-TZ'), statusLabel: sampleMode ? 'SAMPLE DATA · SI MECHI/ODDS HALISI · HAKUNA AI' : 'DRAFT PREVIEW · HAKUNA BET ILIYOWEKWA', testOnly: sampleMode, selections: toPosterSelections(picks) }} onNotice={setNotice} />}</section>;
    if (active === 'seller') return <section className="module-page"><div className="module-intro"><div><span className="section-overline">SELLER CENTER</span><h2>Uza mikeka yako</h2><p>Admin lazima aidhinishe akaunti na kukagua kila listing kabla ya kuchapishwa sokoni.</p></div><span className="approval-badge">{profile?.role === 'seller' ? 'Seller ameidhinishwa' : 'Approval inahitajika'}</span></div><div className="seller-layout"><div className="seller-benefits"><div className="seller-symbol">✦</div><h3>Jenga biashara yako ya tips</h3><ul><li>Wasifu wa tipster na rekodi zinazoonekana</li><li>Listings zenye bei na maelezo wazi</li><li>Ripoti za mauzo na earnings</li><li>Platform commission inayopendekezwa: 10%</li></ul><p className="muted-note">Malipo, wallet na withdrawals bado vimezimwa hadi provider na compliance vikaguliwe.</p></div>{profile?.role === 'seller' ? <div className="seller-form"><h3>Chapisha listing mpya</h3><form onSubmit={(event) => void createListing(event)}><label>Kichwa cha mkeka / uchambuzi<input required maxLength={140} value={listingTitle} onChange={(e) => setListingTitle(e.target.value)} placeholder="Mfano: Uchambuzi wa mechi za leo" /></label><label>Maelezo<textarea value={listingDescription} onChange={(e) => setListingDescription(e.target.value)} maxLength={3000} placeholder="Eleza uchambuzi wako kwa uwazi..." /></label><label>Mchezo<select value={listingSport} onChange={(e) => setListingSport(e.target.value)}><option value="football">Mpira wa miguu</option><option value="basketball">Basketball</option><option value="tennis">Tennis</option><option value="other">Mengineyo</option></select></label><div className="seller-picks"><h4>Selections za mkeka (hadi 30)</h4><div className="seller-pick-fields"><input value={sellerHome} onChange={(e) => setSellerHome(e.target.value)} placeholder="Timu ya nyumbani" /><input value={sellerAway} onChange={(e) => setSellerAway(e.target.value)} placeholder="Timu ya ugenini" /><select value={sellerMarket} onChange={(e) => setSellerMarket(e.target.value)}><option>1X2</option><option>Over / Under</option><option>Both Teams To Score</option><option>Double Chance</option><option>Other</option></select><input value={sellerSelection} onChange={(e) => setSellerSelection(e.target.value)} placeholder="Chaguo lako" /><button type="button" className="outline-button" onClick={addSellerSelection}>＋ Ongeza chaguo</button></div>{sellerSelections.map((item, index) => <div className="seller-pick-row" key={item.id}><span>{index + 1}. {item.home} vs {item.away}</span><small>{item.market} · {item.selection}</small><button type="button" onClick={() => setSellerSelections((current) => current.filter((pick) => pick.id !== item.id))}>×</button></div>)}</div><label>Bei (TSh)<input required type="number" min="0" step="1" value={listingPrice} onChange={(e) => setListingPrice(e.target.value)} placeholder="0 kwa bure" /></label><button className="primary-button" type="submit">Tuma listing kwa Admin</button></form>{sellerSelections.length > 0 && <TicketPosterTools ticket={{ title: listingTitle || 'Seller tips draft', sourceLabel: 'SELLER TIPS', accessLabel: listingPrice.trim() === '' ? 'DRAFT' : Number(listingPrice) === 0 ? 'FREE' : 'PREMIUM', dateLabel: new Date().toLocaleString('sw-TZ'), statusLabel: 'DRAFT PREVIEW · HAKUNA BET ILIYOWEKWA', selections: toPosterSelections(sellerSelections) }} onNotice={setNotice} />}<h3 className="admin-section-title">Listings zako</h3>{sellerListings.length === 0 ? <p className="muted-note">Bado hujatuma listing.</p> : sellerListings.map((listing) => <div className="seller-listing-row" key={listing.id}><strong>{listing.title}</strong><small>{listing.status} · {listing.selection_count || listing.selections?.length || 0} selections · {listing.price_tzs.toLocaleString('en-US')} TSh</small></div>)}</div> : !authUser ? <div className="seller-form"><h3>Ingia kuomba kuwa seller</h3><p>Ombi lako litaunganishwa na akaunti yako ili uweze kufuatilia maamuzi ya Admin.</p><button className="primary-button" onClick={() => setAuthMode('login')}>Ingia / Jisajili</button></div> : mySellerApplication ? <div className="seller-form"><h3>Hali ya ombi lako</h3><span className="approval-badge">{mySellerApplication.status === 'pending' ? 'Linasubiri ukaguzi' : mySellerApplication.status === 'approved' ? 'Umeidhinishwa' : 'Ombi limekataliwa'}</span><p>{mySellerApplication.legal_name} · {mySellerApplication.phone}</p><p className="muted-note">Uliomba: {new Date(mySellerApplication.created_at).toLocaleString('sw-TZ')}{mySellerApplication.reviewed_at ? ' · Limekaguliwa: ' + new Date(mySellerApplication.reviewed_at).toLocaleString('sw-TZ') : ''}</p>{mySellerApplication.status === 'approved' && <><p>Refresh akaunti yako ili kufungua sehemu ya kutengeneza listings.</p><button className="primary-button" onClick={() => { if (!authUser) return; void apiRequest<{ user: Profile }>('/api/v1/me', authUser).then((data) => { setProfile(data.user); setNotice('Akaunti imesasishwa.'); }).catch((error: Error) => setNotice(error.message)); }}>Sasisha akaunti</button></>}{mySellerApplication.status === 'rejected' && <button className="outline-button" onClick={() => setMySellerApplication(null)}>Tuma ombi jipya</button>}</div> : <form className="seller-form" onSubmit={(e) => { e.preventDefault(); if (!authUser) { setAuthMode('login'); setNotice('Ingia kwanza ili kutuma ombi la seller.'); return; } void apiRequest('/api/v1/seller-applications', authUser, { method: 'POST', body: JSON.stringify({ legal_name: sellerName, phone: sellerPhone, reason: sellerReason }) }).then(() => { setSellerSent(true); void apiRequest<{ application: MySellerApplication | null }>('/api/v1/seller-applications/me', authUser).then((data) => setMySellerApplication(data.application)); setNotice('Ombi limetumwa. Status: PENDING.'); }).catch((error: Error) => setNotice(error.message)); }}><h3>Maombi ya seller</h3><label>Jina kamili<input required value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="Jina lako" /></label><label>Namba ya simu<input required type="tel" value={sellerPhone} onChange={(e) => setSellerPhone(e.target.value)} placeholder="07XX XXX XXX" /></label><label>Kwa nini unataka kuwa seller?<textarea required value={sellerReason} onChange={(e) => setSellerReason(e.target.value)} placeholder="Eleza uzoefu wako na aina ya uchambuzi..." /></label><button className="primary-button" type="submit" disabled={!authReady}>Tuma maombi ya seller</button>{sellerSent && <p className="form-notice">Ombi lako limepokelewa na linasubiri ukaguzi wa Admin.</p>}</form>}</div></section>;
    if (active === 'settings') return <section className="module-page settings-page"><div className="module-intro"><div><span className="section-overline">PREFERENCES</span><h2>Settings</h2><p>Dhibiti muonekano na mapendeleo ya akaunti yako.</p></div></div><div className="settings-grid"><article className="settings-card"><span className="settings-icon">◐</span><div><h3>Muonekano</h3><p>Chagua mwonekano unaokufaa.</p></div><div className="settings-choice"><button type="button" className={appearance === 'light' ? 'selected' : ''} onClick={() => setAppearance('light')}>☀ Light</button><button type="button" className={appearance === 'dark' ? 'selected' : ''} onClick={() => setAppearance('dark')}>☾ Dark</button></div></article><article className="settings-card"><span className="settings-icon">文</span><div><h3>Lugha</h3><p>Chagua lugha ya mapendeleo.</p></div><div className="settings-choice"><button type="button" className={language === 'sw' ? 'selected' : ''} onClick={() => setLanguage('sw')}>Kiswahili</button><button type="button" className={language === 'en' ? 'selected' : ''} onClick={() => setLanguage('en')}>English</button></div><small className="settings-note">Chaguo limehifadhiwa; tafsiri ya sehemu zote itaongezwa hatua kwa hatua.</small></article><article className="settings-card"><span className="settings-icon">♧</span><div><h3>Arifa</h3><p>Mapendeleo ya taarifa za jukwaa.</p></div><label className="settings-switch"><input type="checkbox" checked={pushEnabled} onChange={(event) => setPushEnabled(event.target.checked)} /><span>{pushEnabled ? 'Zimewashwa' : 'Zimezimwa'}</span></label><small className="settings-note">Hii huhifadhi chaguo lako kwenye kifaa. Push notifications bado zinahitaji kuunganishwa.</small></article><article className="settings-card"><span className="settings-icon">♙</span><div><h3>Akaunti na usalama</h3><p>Angalia wasifu na taarifa za kuingia.</p></div><button className="settings-action" type="button" onClick={() => authUser ? void openMemberProfile(authUser.uid) : setAuthMode('login')}>Fungua akaunti yangu →</button><small className="settings-note">Usibadilishe password kupitia ukurasa huu bado; huduma salama ya kubadilisha password haijaunganishwa.</small></article><article className="settings-card"><span className="settings-icon">◇</span><div><h3>Faragha</h3><p>Linda taarifa zako binafsi.</p></div><p className="settings-detail">Usishiriki password au taarifa nyeti. Wasifu wa jamii una taarifa unazochagua kuonyesha.</p></article><article className="settings-card"><span className="settings-icon">?</span><div><h3>Msaada na mawasiliano</h3><p>Unahitaji msaada kuhusu matumizi ya jukwaa?</p></div><a className="settings-action" href="https://wa.me/255698232313" target="_blank" rel="noreferrer">Wasiliana na msaada →</a><small className="settings-note">Kiungo kinafungua WhatsApp.</small></article><article className="settings-card settings-about"><span className="settings-icon">W</span><div><h3>Kuhusu Wazee wa Betting TZ</h3><p>Jukwaa la michezo, uchambuzi na jamii.</p><small>Toleo la Beta · 2026</small></div></article></div></section>;
    if (active === 'admin') return <section className="module-page"><div className="module-intro"><div><span className="section-overline">CONTROL PANEL</span><h2>Admin dashboard</h2><p>Usimamizi wa seller applications na marketplace kwa ruhusa za server.</p></div><span className="approval-badge">{profile?.role === 'admin' ? 'Admin amethibitishwa' : 'Admin access'}</span></div>{!authUser ? <div className="admin-warning">Ingia kwenye akaunti ya Admin ili kufungua control panel.</div> : profile?.role !== 'admin' ? <div className="admin-warning">Akaunti hii haina ruhusa ya Admin. Role inathibitishwa na backend; mmiliki wa mfumo anahitaji kukamilisha bootstrap ya Admin wa kwanza.</div> : <><div className="admin-stats-grid">{[['Watumiaji',adminSummary?.users],['Seller hai',adminSummary?.active_sellers],['Maombi ya seller',adminSummary?.pending_seller_applications],['Listings pending',adminSummary?.pending_listings],['Listings live',adminSummary?.published_listings],['Community posts',adminSummary?.community_posts],['Fixtures',adminSummary?.sports_fixtures],['Ledger entries',adminSummary?.wallet_ledger_entries]].map(([label,value]) => <div className="admin-stat" key={String(label)}><small>{label}</small><strong>{value ?? '—'}</strong></div>)}</div><h3 className="admin-section-title">Chapisha mkeka rasmi wa Wazee wa Betting TZ</h3>
      <form className="seller-form official-publish-form" onSubmit={(event) => void publishOfficialListing(event)}>
        <label>Kichwa cha mkeka<input required maxLength={140} value={officialTitle} onChange={(event) => setOfficialTitle(event.target.value)} placeholder="Mfano: Mkeka rasmi wa leo" /></label>
        <label>Maelezo<textarea maxLength={3000} value={officialDescription} onChange={(event) => setOfficialDescription(event.target.value)} placeholder="Maelezo ya mkeka (si lazima yawe marefu)..." /></label>
        <label>Mchezo<select value={officialSport} onChange={(event) => setOfficialSport(event.target.value)}><option value="football">Mpira wa miguu</option><option value="basketball">Basketball</option><option value="tennis">Tennis</option><option value="other">Mengineyo</option></select></label>
        <div className="seller-picks"><h4>Mechi na chaguo (hadi 30)</h4><div className="seller-pick-fields">
          <input value={officialHome} onChange={(event) => setOfficialHome(event.target.value)} placeholder="Timu ya nyumbani" />
          <input value={officialAway} onChange={(event) => setOfficialAway(event.target.value)} placeholder="Timu ya ugenini" />
          <select value={officialMarket} onChange={(event) => setOfficialMarket(event.target.value)}><option>1X2</option><option>Over / Under</option><option>Both Teams To Score</option><option>Double Chance</option><option>Other</option></select>
          <input value={officialSelection} onChange={(event) => setOfficialSelection(event.target.value)} placeholder="Chaguo lako" />
          <button type="button" className="outline-button" onClick={addOfficialSelection}>＋ Ongeza mechi</button>
        </div>
        {officialSelections.map((item, index) => <div className="seller-pick-row" key={item.id}><span>{index + 1}. {item.home} vs {item.away}</span><small>{item.market} · {item.selection}</small><button type="button" onClick={() => setOfficialSelections((current) => current.filter((pick) => pick.id !== item.id))}>×</button></div>)}</div>
        <button className="primary-button" type="submit" disabled={!officialTitle.trim() || !officialSelections.length}>Chapisha mkeka rasmi</button>
        <p className="muted-note">Mkeka utahifadhiwa kwenye database na kuonekana kwa wageni. Odds hazitaongezwa isipokuwa ziwe zimethibitishwa kutoka provider.</p>
      </form>
      {officialSelections.length > 0 && <TicketPosterTools ticket={{ title: officialTitle || 'Mkeka rasmi · DRAFT', sourceLabel: 'WAZEE WA BETTING TZ', accessLabel: 'RASMI', dateLabel: new Date().toLocaleString('sw-TZ'), statusLabel: 'DRAFT PREVIEW · ODDS HAZIJATHIBITISHWA', selections: toPosterSelections(officialSelections) }} onNotice={setNotice} />}
      <h3 className="admin-section-title">Historia ya mikeka rasmi</h3>
      {officialListings.length === 0 ? <div className="empty-state">Bado hujachapisha mkeka rasmi.</div> : <div className="admin-applications">{officialListings.map((listing) => <article className="application-card" key={listing.id}><div><strong>{listing.title}</strong><small>{new Date(listing.created_at).toLocaleString('sw-TZ')} · {listing.selection_count} selections · {listing.price_tzs.toLocaleString('en-US')} TSh</small><p>{listing.description_preview}</p></div><span className="approval-badge">Imechapishwa</span></article>)}</div>}
      <h3 className="admin-section-title">Maombi ya seller</h3>{sellerApplications.length === 0 ? <div className="empty-state">Hakuna maombi ya seller yanayosubiri.</div> : <div className="admin-applications">{sellerApplications.map((application) => <article className="application-card" key={application.id}><div><strong>{application.legal_name}</strong><small>{application.phone} · {application.status}</small><p>{application.reason}</p></div>{application.status === 'pending' && <div className="application-actions"><button onClick={() => void reviewSeller(application.id, 'approved')}>Idhinisha</button><button onClick={() => void reviewSeller(application.id, 'rejected')}>Kataa</button></div>}</article>)}</div>}<h3 className="admin-section-title">Listings zinazosubiri ukaguzi</h3>{adminListings.length === 0 ? <div className="empty-state">Hakuna listing inayosubiri ukaguzi.</div> : <div className="admin-applications">{adminListings.map((listing) => <article className="application-card" key={listing.id}><div><strong>{listing.title}</strong><small>{listing.seller_name} · {listing.price_tzs.toLocaleString('en-US')} TSh</small><p>{listing.description}</p>{listing.selections && listing.selections.length > 0 && <ul className="admin-selection-list">{listing.selections.map((selection, index) => <li key={index}>{selection.home_name} vs {selection.away_name} — {selection.market}: <strong>{selection.selection}</strong></li>)}</ul>}</div><div className="application-actions"><button onClick={() => void reviewListing(listing.id, 'published')}>Chapisha</button><button onClick={() => void reviewListing(listing.id, 'rejected')}>Kataa</button></div></article>)}</div>}<h3 className="admin-section-title">Usimamizi wa watumiaji</h3>{adminUsers.length === 0 ? <div className="empty-state">Hakuna watumiaji bado.</div> : <div className="admin-applications">{adminUsers.map((account) => <article className="application-card" key={account.id}><div><strong>{account.display_name || 'Mtumiaji'}</strong><small>{account.phone || 'Namba haijaunganishwa'} · {account.role} · {account.account_status}</small><p>Alijiunga: {new Date(account.created_at).toLocaleString('sw-TZ')}</p></div>{account.role !== 'admin' && <div className="application-actions">{account.account_status === 'active' ? <button onClick={() => void setUserAccountStatus(account.id, 'suspended')}>Simamisha</button> : <button onClick={() => void setUserAccountStatus(account.id, 'active')}>Wezesha</button>}</div>}</article>)}</div>}<h3 className="admin-section-title">Audit log</h3>{adminAudit.length === 0 ? <div className="empty-state">Hakuna matukio yaliyorekodiwa bado.</div> : <div className="admin-applications">{adminAudit.slice(0,20).map((event) => <article className="application-card" key={event.id}><div><strong>{event.action}</strong><small>{event.actor_name || 'System'} · {event.target_type} · {event.target_id}</small></div><small>{new Date(event.created_at).toLocaleString('sw-TZ')}</small></article>)}</div>}<h3 className="admin-section-title">Wallet ledger (read-only)</h3><p className="muted-note">Hii ni audit view tu. Deposits, purchases, commissions na withdrawals hazijawezeshwa.</p>{walletLedger.length === 0 ? <div className="empty-state">Hakuna ledger entries. Hakuna fedha zinazohamishwa kwenye mfumo.</div> : <div className="admin-applications">{walletLedger.map((entry) => <article className="application-card" key={entry.id}><div><strong>{entry.user_name || entry.phone || 'Mtumiaji'} · {entry.entry_type}</strong><small>{entry.reference_type} · {entry.reference_id} · {entry.status}</small></div><div><strong>{entry.amount_tzs.toLocaleString('en-US')} TSh</strong><small>{new Date(entry.created_at).toLocaleString('sw-TZ')}</small></div></article>)}</div>}</>}</section>;

    return <><section className="hero-panel"><div className="hero-copy"><span className="hero-kicker">ZAIDI YA MIKeka. NI JAMII.</span><h2>Maarifa ya michezo.<br /><em>Thamani ya pamoja.</em></h2><p>Sehemu moja ya kupata tips, kujifunza kutoka kwa wengine na kushiriki uchambuzi wako.</p><div className="hero-actions"><button className="hero-primary" onClick={() => go('marketplace')}>Gundua marketplace <span>→</span></button><button className="hero-secondary" onClick={() => go('community')}>Tembelea jamii</button></div></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="ball">⚽</div><div className="floating-card card-top"><span>✦</span><div><b>Tips zenye chanzo</b><small>Uwazi kwanza</small></div></div><div className="floating-card card-bottom"><span>◎</span><div><b>Jenga jamii</b><small>Shiriki uchambuzi</small></div></div></div><div className="hero-index">01 <span>/</span> 04</div></section>
    <section className="section-heading"><div><span className="section-overline">CHAGUA UNACHOTAFUTA</span><h2>Gundua jukwaa</h2></div><button className="text-link" onClick={() => go('marketplace')}>Angalia yote <span>→</span></button></section>
    <section className="discovery-grid"><button className="discovery-card market-card" onClick={() => go('marketplace')}><span className="discovery-icon">▤</span><span className="discovery-arrow">↗</span><strong>Tips Marketplace</strong><p>Gundua mikeka na wachambuzi. Bei na matokeo vitaonyeshwa kwa uwazi.</p><small>GUNDUA SOKO <span>→</span></small></button><button className="discovery-card community-card" onClick={() => go('community')}><span className="discovery-icon">◎</span><span className="discovery-arrow">↗</span><strong>Jamii ya Wazee</strong><p>Shiriki mawazo, jadili mechi na fuatilia tipsters unaowapenda.</p><small>JIUNGE NA JAMII <span>→</span></small></button><button className="discovery-card sports-card" onClick={() => go('sports')}><span className="discovery-icon">◉</span><span className="discovery-arrow">↗</span><strong>Michezo & Matokeo</strong><p>Fixtures, odds na matokeo kutoka kwa vyanzo vitakavyothibitishwa.</p><small>ANGALIA MICHEZO <span>→</span></small></button></section>
    <section className="home-value-strip" aria-label="Vipengele vya jukwaa">
      <div><span className="value-icon">01</span><strong>Uwazi wa matokeo</strong><small>Rekodi na chanzo vitenganishwe wazi.</small></div>
      <div><span className="value-icon">02</span><strong>Wachambuzi halisi</strong><small>Gundua tipsters na historia zao.</small></div>
      <div><span className="value-icon">03</span><strong>Jenga kwa uhuru</strong><small>Andaa mkeka na ushiriki picha yake.</small></div>
    </section>
    <section className="home-feature-band">
      <div><span className="section-overline">JINSI INAVYOFANYA KAZI</span><h2>Maarifa yanakuwa bora yakishirikishwa.</h2><p>Chunguza mechi, linganisha uchambuzi, jenga mkeka wako au jiunge na mazungumzo ya jamii.</p></div>
      <div className="home-steps"><div><b>01</b><span><strong>Gundua</strong><small>Mechi na wachambuzi</small></span></div><div><b>02</b><span><strong>Chambua</strong><small>Chagua masoko na maoni</small></span></div><div><b>03</b><span><strong>Shiriki</strong><small>Jenga jamii yenye uwazi</small></span></div></div>
    </section>
    <section className="section-heading market-heading"><div><span className="section-overline">SOKO LA TIPS</span><h2>Chunguza marketplace</h2></div><button className="text-link" onClick={() => go('marketplace')}>Marketplace yote <span>→</span></button></section><div className="filter-row">{categories.map((item) => <button key={item} className={category === item ? 'filter-chip selected' : 'filter-chip'} onClick={() => setCategory(item)}>{item}</button>)}</div><section className="empty-market"><div className="empty-illustration">▤</div><div><strong>Marketplace inajengwa</strong><p>Hakuna listing iliyochapishwa bado. Mikeka ya majaribio haitaonyeshwa kama bidhaa halisi.</p></div><button onClick={() => go('seller')}>Omba kuwa seller <span>→</span></button></section></>;
  };

  return <div className={`app-frame ${appearance === 'dark' ? 'theme-dark' : ''}`}><aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}><a className="brand" href="#home" onClick={(e) => { e.preventDefault(); go('marketplace'); }}><span className="brand-mark">W</span><span><strong>WAZEE WA</strong><small>BETTING TZ</small></span></a><div className="sidebar-label">MENU KUU</div><nav className="side-nav" aria-label="Navigation kuu">{navItems.filter((item) => item.id !== 'admin' || profile?.role === 'admin').map((item) => <button className={`nav-item ${active === item.id ? 'active' : ''}`} key={item.id} onClick={() => go(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}{item.id === 'marketplace' && <span className="nav-dot" />}</button>)}</nav><div className="sidebar-account">{authUser ? <><button className="sidebar-profile" onClick={() => { setMobileMenuOpen(false); void openMemberProfile(authUser.uid); }}><span className="sidebar-avatar">{(profile?.display_name || 'W').slice(0,1).toUpperCase()}</span><span><strong>{profile?.display_name || 'Akaunti yangu'}</strong><small>{profile?.role === 'admin' ? 'Admin' : 'Mwanachama'}</small></span></button><button className="sidebar-logout" onClick={() => void logout()}>↪ Toka kwenye akaunti</button></> : <button className="sidebar-login" onClick={() => { setMobileMenuOpen(false); setAuthMode('login'); }}>Ingia / Jisajili</button>}</div><div className="sidebar-bottom"><div className="seller-card"><span className="seller-card-icon">✦</span><strong>Uza mikeka yako</strong><p>Jiunge kama tipster na ujenge jamii yako.</p><button onClick={() => go('seller')}>Anza hapa <span>→</span></button></div><div className="sidebar-foot">Wazee wa Betting TZ <span>•</span> Beta</div></div></aside>
  {mobileMenuOpen && <button className="mobile-scrim" aria-label="Funga menyu" onClick={() => setMobileMenuOpen(false)} />}
  <main className="main-area"><header className="topbar"><button className="mobile-menu" aria-label="Fungua menyu" onClick={() => setMobileMenuOpen(true)}>☰</button><div className="breadcrumb">Wazee wa Betting TZ <span>/</span> <strong>{activeLabel}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Arifa" onClick={() => setNotice('Arifa zitaunganishwa baada ya backend.')}>♧<i /></button><button className="avatar avatar-button" onClick={() => authUser ? void openMemberProfile(authUser.uid) : setAuthMode('login')} aria-label="Fungua wasifu">W</button></div></header><div className="page-content">{active === 'overview' && <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> JUKWAA LA MICHEZO NA TIPS</div><h1>Karibu kwenye Wazee.</h1><p className="welcome-copy">Gundua wachambuzi, shiriki maarifa na jenga mikeka yako kwa taarifa zenye chanzo.</p></div><button className="primary-button" onClick={() => go('builder')}><span>＋</span> Jenga mkeka</button></section>}{pageContent()}{notice && <div className="notice-bar" role="status"><span>ⓘ</span>{notice}<button onClick={() => setNotice('')}>×</button></div>}<footer className="page-footer"><span>© 2026 Wazee wa Betting TZ</span><span>Jukwaa la maarifa, uwazi na jamii.</span><span className="footer-status"><i /> Mfumo unaandaliwa</span></footer></div></main>
  <nav className="mobile-bottom-nav" aria-label="Navigation ya simu">{navItems.slice(0, 5).map((item) => <button key={item.id} className={active === item.id ? 'mobile-active' : ''} onClick={() => go(item.id)}><span>{item.icon}</span><small>{item.label === 'Uwanja wa mikeka' ? 'Uwanja' : item.label === 'Jenga mkeka' ? 'Jenga' : item.label}</small></button>)}</nav>{profileViewId && <div className="auth-overlay profile-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setProfileViewId(null); }}><section className="member-profile-card"><button className="auth-close" onClick={() => setProfileViewId(null)}>×</button>{profileBusy || !memberProfile ? <p>Inapakia wasifu...</p> : <><div className="member-profile-head"><div className="member-avatar">{memberProfile.avatar_url ? <img src={memberProfile.avatar_url} alt="" /> : (memberProfile.display_name || 'W').slice(0,1).toUpperCase()}</div><div><span className="section-overline">WAZEE WA BETTING TZ</span><h2>{memberProfile.display_name || 'Mwanachama'}</h2><span className="profile-role">{memberProfile.role}</span></div></div><p className="member-bio">{memberProfile.bio || 'Bado hajaandika maelezo ya wasifu.'}</p><div className="member-stats"><div><strong>{memberProfile.posts_count}</strong><small>Posts</small></div><div><strong>{memberProfile.followers_count}</strong><small>Followers</small></div><div><strong>{memberProfile.following_count}</strong><small>Following</small></div><div><strong>{memberProfile.published_listings}</strong><small>Listings</small></div></div>{memberProfile.role === 'seller' && <p className="profile-record">Selections zilizothibitishwa: {memberProfile.won_selections} won · {memberProfile.lost_selections} lost</p>}{authUser?.uid === memberProfile.id ? <form className="profile-edit-form" onSubmit={(event) => void saveMemberProfile(event)}><h3>Hariri wasifu wako</h3><label>Jina linaloonekana<input required maxLength={80} value={profileEditName} onChange={(event) => setProfileEditName(event.target.value)} /></label><label>Maelezo mafupi<textarea maxLength={280} value={profileEditBio} onChange={(event) => setProfileEditBio(event.target.value)} /></label><label>Picha ya wasifu (URL ya HTTPS)<input value={profileEditAvatar} onChange={(event) => setProfileEditAvatar(event.target.value)} placeholder="https://..." /></label><button className="primary-button" type="submit">Hifadhi wasifu</button></form> : authUser && <button className="primary-button profile-follow" onClick={() => void toggleFollow(memberProfile.id)}>{followingUsers.includes(memberProfile.id) ? 'Unafuatilia' : 'Fuata'}</button>}</>}</section></div>}{authMode && <div className="auth-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthMode(null); }}><form className="auth-card" onSubmit={(event) => void submitAuth(event)}><button className="auth-close" type="button" onClick={() => setAuthMode(null)}>×</button><span className="section-overline">WAZEE WA BETTING TZ</span><h2>{authMode === 'register' ? 'Fungua akaunti' : 'Karibu tena'}</h2><p>Usajili na login hutumia namba ya simu na password. Hakuna Google login.</p><div className="auth-tabs"><button type="button" className={authMode === 'login' ? 'selected' : ''} onClick={() => { setAuthMode('login'); setAuthError(''); }}>Ingia</button><button type="button" className={authMode === 'register' ? 'selected' : ''} onClick={() => { setAuthMode('register'); setAuthError(''); }}>Jisajili</button></div>{authMode === 'register' && <><label>Jina la kwanza<input required value={authFirstName} onChange={(e) => setAuthFirstName(e.target.value)} autoComplete="given-name" /></label><label>Jina la mwisho<input required value={authLastName} onChange={(e) => setAuthLastName(e.target.value)} autoComplete="family-name" /></label></>}<label>Namba ya simu<input required type="tel" value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} placeholder="0712 345 678" autoComplete="tel" /></label><label>Password<input required type="password" minLength={6} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} /></label>{authMode === 'register' && <label>Thibitisha password<input required type="password" minLength={6} value={authConfirmPassword} onChange={(e) => setAuthConfirmPassword(e.target.value)} autoComplete="new-password" /></label>}{authError && <p className="auth-error">{authError}</p>}<button className="primary-button auth-submit" type="submit" disabled={authBusy}>{authBusy ? 'Subiri...' : authMode === 'register' ? 'Jisajili' : 'Ingia'}</button></form></div>}</div>;
}
export default App;
