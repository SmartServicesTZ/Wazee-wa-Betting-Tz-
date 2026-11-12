import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { User } from './lib/firebase';
import { apiRequest, loginWithPhone, logout, registerWithPhone, watchAuth } from './lib/firebase';

type Section = 'overview' | 'marketplace' | 'community' | 'sports' | 'builder' | 'seller' | 'admin';
type Post = { id: string; authorId: string; author: string; text: string; likes: number; liked: boolean; comments: number; time: string };
type Comment = { id: string; body: string; author_name: string; created_at: string };
type Pick = { id: number; home: string; away: string; market: string; selection: string };
type Profile = { id: string; display_name: string; role: 'buyer' | 'seller' | 'admin'; account_status: string };
type Listing = { id: string; title: string; description_preview: string; sport: string; price_tzs: number; seller_name: string; selection_count: number; created_at: string };
type SellerApplication = { id: string; legal_name: string; phone: string; reason: string; status: string; created_at: string; display_name: string };
type MySellerApplication = { id: string; legal_name: string; phone: string; reason: string; status: 'pending' | 'approved' | 'rejected'; created_at: string; reviewed_at: string | null };
type AdminSummary = { users: number; active_sellers: number; pending_seller_applications: number; pending_listings: number; published_listings: number; community_posts: number; sports_fixtures: number; wallet_ledger_entries: number };
type MemberProfile = { id: string; display_name: string; avatar_url: string | null; bio: string | null; role: string; created_at: string; posts_count: number; followers_count: number; following_count: number; published_listings: number; won_selections: number; lost_selections: number };
type AdminUser = { id: string; display_name: string; phone: string | null; role: string; account_status: string; created_at: string };
type AuditEvent = { id: string; action: string; target_type: string; target_id: string; created_at: string; actor_name: string | null };
type ListingSelection = { home_name: string; away_name: string; market: string; selection: string };
type SellerListing = { id: string; title: string; description: string; sport: string; price_tzs: number; status: string; result_status: string; created_at: string; seller_name?: string; selection_count?: number; selections?: ListingSelection[] };
type SportsFixture = { id: string; external_id: string; competition: string; home_name: string; away_name: string; kickoff_at: string; status: string; source_updated_at: string | null; fetched_at: string; provider_name: string; provider_status: string };
type SportsProvider = { id: string; provider_key: string; display_name: string; status: string; last_success_at: string | null; last_error_at: string | null };

const navItems: { id: Section; label: string; icon: string }[] = [
  { id: 'overview', label: 'Muhtasari', icon: '⌂' },
  { id: 'marketplace', label: 'Soko la mikeka', icon: '▤' },
  { id: 'community', label: 'Jamii', icon: '◎' },
  { id: 'sports', label: 'Michezo', icon: '◉' },
  { id: 'builder', label: 'Jenga mkeka', icon: '＋' },
  { id: 'seller', label: 'Seller Center', icon: '♙' },
  { id: 'admin', label: 'Admin', icon: '⚙' },
];
const categories = ['Zote', 'Mpira wa miguu', 'Basketball', 'Tennis', 'Mikeka ya bure'];

function App() {
  const [active, setActive] = useState<Section>('overview');
  const [category, setCategory] = useState('Zote');
  const [marketSearch, setMarketSearch] = useState('');
  const [marketSort, setMarketSort] = useState('newest');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const [authFirstName, setAuthFirstName] = useState('');
  const [authLastName, setAuthLastName] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [sellerApplications, setSellerApplications] = useState<SellerApplication[]>([]);
  const [mySellerApplication, setMySellerApplication] = useState<MySellerApplication | null>(null);
  const [sellerListings, setSellerListings] = useState<SellerListing[]>([]);
  const [adminListings, setAdminListings] = useState<SellerListing[]>([]);
  const [adminSummary, setAdminSummary] = useState<AdminSummary | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminAudit, setAdminAudit] = useState<AuditEvent[]>([]);
  const [sportsFixtures, setSportsFixtures] = useState<SportsFixture[]>([]);
  const [sportsProviders, setSportsProviders] = useState<SportsProvider[]>([]);
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
      ]).then(([fixtures, providers]) => { setSportsFixtures(fixtures.items || []); setSportsProviders(providers.items || []); })
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
        apiRequest<{ summary: AdminSummary }>('/api/v1/admin/summary', authUser),
        apiRequest<{ items: AdminUser[] }>('/api/v1/admin/users', authUser),
        apiRequest<{ items: AuditEvent[] }>('/api/v1/admin/audit-events', authUser),
      ]).then(([applications, pendingListings, summary, users, audit]) => { setSellerApplications(applications.items || []); setAdminListings(pendingListings.items || []); setAdminSummary(summary.summary); setAdminUsers(users.items || []); setAdminAudit(audit.items || []); })
        .catch((error: Error) => setNotice(error.message));
    }
  }, [active, authUser, profile?.role]);

  const go = (section: Section) => { setActive(section); setMobileMenuOpen(false); setNotice(''); };
  const addPick = () => {
    if (!fixtureHome.trim() || !fixtureAway.trim() || !fixtureSelection.trim()) {
      setNotice('Jaza timu zote mbili na chaguo lako kabla ya kuongeza.');
      return;
    }
    setPicks((current) => [...current, { id: Date.now(), home: fixtureHome.trim(), away: fixtureAway.trim(), market: fixtureMarket, selection: fixtureSelection.trim() }]);
    setFixtureHome(''); setFixtureAway(''); setFixtureSelection('');
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
        user = await registerWithPhone(authPhone, authPassword, authFirstName, authLastName);
      } else user = await loginWithPhone(authPhone, authPassword);
      const data = await apiRequest<{ user: Profile }>('/api/v1/me', user);
      setProfile(data.user); setAuthUser(user); setAuthMode(null); setAuthPassword('');
      setNotice('Umeingia kikamilifu. Karibu!');
    } catch (error) { setAuthError((error as Error).message || 'Imeshindikana. Jaribu tena.'); }
    finally { setAuthBusy(false); }
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

  const downloadTicket = async () => {
    if (!picks.length) return;
    const xmlEntities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&apos;' };
    const escapeXml = (value: string) => value.replace(/[&<>\"']/g, (character) => xmlEntities[character] || character);
    const width = 1000;
    const rowHeight = 86;
    const height = 260 + picks.length * rowHeight;
    const rows = picks.map((pick, index) => `<g transform="translate(48 ${190 + index * rowHeight})"><rect width="904" height="68" rx="13" fill="#f5f8f8"/><circle cx="34" cy="34" r="19" fill="#dcece7"/><text x="34" y="40" text-anchor="middle" font-size="16" font-weight="700" fill="#28766d">${index + 1}</text><text x="72" y="29" font-size="21" font-weight="700" fill="#26394e">${escapeXml(pick.home)} vs ${escapeXml(pick.away)}</text><text x="72" y="52" font-size="14" fill="#77879a">${escapeXml(pick.market)} · ${escapeXml(pick.selection)}</text></g>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#ffffff"/><rect width="100%" height="142" fill="#17344e"/><text x="48" y="54" font-size="19" font-weight="800" letter-spacing="3" fill="#a9d9ca">WAZEE WA BETTING TZ</text><text x="48" y="100" font-size="32" font-weight="800" fill="#ffffff">Mkeka wa maandalizi</text><text x="48" y="125" font-size="14" fill="#d3e2e5">${picks.length} selections · ${new Date().toLocaleString('sw-TZ')}</text>${rows}<text x="48" y="${height - 45}" font-size="15" font-weight="700" fill="#a65d3b">PREVIEW TU · Odds hazijathibitishwa · Hakuna bet iliyowekwa</text><text x="48" y="${height - 20}" font-size="12" fill="#91a0ad">Tumia taarifa kutoka vyanzo vinavyoaminika na cheza kwa uwajibikaji.</text></svg>`;
    const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) { URL.revokeObjectURL(svgUrl); setNotice('Imeshindikana kutengeneza picha kwenye kifaa hiki.'); return; }
      context.drawImage(image, 0, 0);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(svgUrl);
        if (!blob) { setNotice('Imeshindikana ku-export picha.'); return; }
        const pngUrl = URL.createObjectURL(blob); const anchor = document.createElement('a');
        anchor.href = pngUrl; anchor.download = 'wazee-wa-betting-tz-mkeka-preview.png'; anchor.click();
        URL.revokeObjectURL(pngUrl); setNotice('Picha ya mkeka imeandaliwa. Hii ni preview, si tiketi ya bet.');
      }, 'image/png');
    };
    image.onerror = () => { URL.revokeObjectURL(svgUrl); setNotice('Imeshindikana kutengeneza picha.'); };
    image.src = svgUrl;
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
    if (active === 'marketplace') return <section className="module-page">
      <div className="module-intro"><div><span className="section-overline">BUYER MARKETPLACE</span><h2>Soko la mikeka</h2><p>Gundua wachambuzi na mikeka iliyochapishwa na wauzaji walioidhinishwa.</p></div><button className="primary-button" onClick={() => go('seller')}>＋ Omba kuwa seller</button></div>
      <div className="market-toolbar"><div className="filter-row">{categories.map((item) => <button key={item} className={category === item ? 'filter-chip selected' : 'filter-chip'} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="market-search-controls"><input className="search-input" value={marketSearch} onChange={(event) => setMarketSearch(event.target.value)} placeholder="Tafuta tipster au mkeka..." /><select className="market-sort" value={marketSort} onChange={(event) => setMarketSort(event.target.value)}><option value="newest">Mpya kwanza</option><option value="price_low">Bei: ndogo kwanza</option><option value="price_high">Bei: kubwa kwanza</option></select></div></div>
      {filteredListings.length === 0 ? <div className="empty-state large-empty"><div className="empty-illustration">▤</div><h3>{listings.length === 0 ? 'Marketplace inasubiri wauzaji wa kwanza' : 'Hakuna listing inayolingana na utafutaji'}</h3><p>{listings.length === 0 ? 'Hakuna listing iliyochapishwa. Bidhaa, bei na rekodi za ushindi zitaonekana baada ya seller kuidhinishwa na kuweka listing halisi.' : 'Badili neno la utafutaji au chagua kundi jingine.'}</p><button className="outline-button" onClick={() => go('seller')}>Anza maombi ya seller →</button></div> : <div className="listing-grid">{filteredListings.map((listing) => <article className="listing-card" key={listing.id}><span className="section-overline">{listing.sport}</span><h3>{listing.title}</h3><p>{listing.description_preview}</p><div><strong>{listing.price_tzs.toLocaleString('en-US')} TSh</strong><small>Seller: {listing.seller_name} · {listing.selection_count || 0} selections</small></div></article>)}</div>}
    </section>;
    if (active === 'community') return <section className="module-page">
      <div className="module-intro"><div><span className="section-overline">SOCIAL NETWORK</span><h2>Jamii ya Wazee</h2><p>Jadili michezo, shiriki uchambuzi na fuatilia wachambuzi.</p></div></div>
      <div className="community-layout"><div className="feed-column"><div className="composer"><div className="avatar">W</div><div className="composer-body"><textarea value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="Una maoni gani kuhusu michezo ya leo?" /><div className="composer-footer"><span>Shiriki kwa heshima. Epuka madai ya ushindi wa uhakika.</span><button className="primary-button" onClick={publishPost} disabled={!postText.trim()}>Chapisha</button></div></div></div>
      {posts.length === 0 ? <div className="empty-state"><div className="empty-illustration">◎</div><h3>Karibu kwenye jamii</h3><p>Bado hakuna post zilizochapishwa. Ingia ili uwe wa kwanza kushiriki.</p></div> : posts.map((post) => <article className="post-card" key={post.id}><div className="post-head"><div className="avatar">W</div><div><button className="profile-name-button" onClick={() => void openMemberProfile(post.authorId)}>{post.author}</button><small>{post.time}</small></div>{authUser && post.authorId !== authUser.uid ? <button className="follow-button" onClick={() => void toggleFollow(post.authorId)}>{followingUsers.includes(post.authorId) ? 'Unafuatilia' : '+ Fuata'}</button> : <span className="post-menu">•••</span>}</div><p>{post.text}</p><div className="post-actions"><button onClick={() => void toggleLike(post.id)} className={post.liked ? 'liked' : ''}>♡ {post.likes} Likes</button><button onClick={() => void openComments(post.id)}>▢ {post.comments} Maoni</button><button onClick={() => setNotice('Kushare post kutawashwa kwenye toleo lijalo.')}>↗ Shiriki</button></div>{commentTarget === post.id && <div className="comment-panel"><div className="comment-list">{comments.length === 0 ? <p>Bado hakuna maoni.</p> : comments.map((comment) => <div className="comment-row" key={comment.id}><strong>{comment.author_name || 'Mwanachama'}</strong><p>{comment.body}</p></div>)}</div><form onSubmit={(event) => void submitComment(event)}><input value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder="Andika maoni..." maxLength={2000} /><button type="submit" disabled={!commentDraft.trim()}>Tuma</button><button type="button" onClick={() => setCommentTarget(null)}>Funga</button></form></div>}</article>)}</div>
      <aside className="community-aside"><div className="aside-card"><span className="section-overline">KANUNI ZA JAMII</span><h3>Uwazi kwanza</h3><p>Hakuna tips za uhakika, matokeo ya kubuni au udanganyifu wa takwimu. Rekodi za tipster zitathibitishwa kwa matokeo halisi.</p></div><div className="aside-card"><span className="section-overline">JENGA WASIFU</span><h3>Fuata maendeleo yako</h3><p>Fuata wanachama moja kwa moja kutoka kwenye post zao. Wasifu na leaderboard vitafuata.</p></div></aside></div>
    </section>;
    if (active === 'sports') return <section className="module-page"><div className="module-intro"><div><span className="section-overline">SPORTS DATA</span><h2>Michezo na matokeo</h2><p>Ratiba na matokeo hutolewa kutoka D1 kwa chanzo na muda wa mwisho wa data.</p></div><span className="source-badge">{sportsProviders.some((provider) => provider.status === 'healthy') ? 'Provider healthy' : 'Provider haijawezeshwa'}</span></div><div className="sports-tabs"><button className="sports-tab active">Ratiba</button><button className="sports-tab">Live</button><button className="sports-tab">Matokeo</button><button className="sports-tab">Ligi</button></div>{sportsFixtures.length === 0 ? <div className="empty-state large-empty"><div className="empty-illustration">◉</div><h3>Hakuna fixtures zilizothibitishwa bado</h3><p>API za kusoma ratiba na matokeo zipo tayari. Data itaonekana baada ya kuingiza fixtures kutoka provider aliyethibitishwa; hatutengenezi mechi au odds za kubuni.</p><button className="outline-button" onClick={() => go('builder')}>Fungua bet builder →</button></div> : <div className="fixture-list">{sportsFixtures.map((fixture) => <article className="fixture-card" key={fixture.id}><div className="fixture-meta"><strong>{fixture.competition}</strong><span>{new Date(fixture.kickoff_at).toLocaleString('sw-TZ',{dateStyle:'medium',timeStyle:'short'})}</span></div><div className="fixture-teams"><strong>{fixture.home_name}</strong><span>VS</span><strong>{fixture.away_name}</strong></div><div className="fixture-foot"><span>{fixture.status}</span><small>Chanzo: {fixture.provider_name} · Ilipokelewa: {new Date(fixture.fetched_at).toLocaleString('sw-TZ')}</small><button className="fixture-add-button" onClick={() => { setFixtureHome(fixture.home_name); setFixtureAway(fixture.away_name); setFixtureMarket('1X2'); setFixtureSelection(''); go('builder'); }}>Jenga mkeka</button></div></article>)}</div>}</section>;
    if (active === 'builder') return <section className="module-page"><div className="module-intro"><div><span className="section-overline">TICKET BUILDER</span><h2>Jenga mkeka wako</h2><p>Andaa chaguo zako. Odds hazijazalishwa; zitaongezwa tu kutoka chanzo kilichothibitishwa.</p></div><span className="count-pill">{totalSelections} selections</span></div><div className="builder-layout"><div className="builder-form"><h3>Ongeza mechi / chaguo</h3><label>Timu ya nyumbani<input value={fixtureHome} onChange={(e) => setFixtureHome(e.target.value)} placeholder="Mfano: Timu A" /></label><label>Timu ya ugenini<input value={fixtureAway} onChange={(e) => setFixtureAway(e.target.value)} placeholder="Mfano: Timu B" /></label><label>Soko<select value={fixtureMarket} onChange={(e) => setFixtureMarket(e.target.value)}><option>1X2</option><option>Over / Under</option><option>Both Teams To Score</option><option>Double Chance</option><option>Other</option></select></label><label>Chaguo lako<input value={fixtureSelection} onChange={(e) => setFixtureSelection(e.target.value)} placeholder="Andika selection" /></label><button className="primary-button" onClick={addPick}>＋ Ongeza selection</button></div><div className="builder-slip"><div className="slip-head"><div><span className="section-overline">BET SLIP PREVIEW</span><h3>Mkeka wako</h3></div><button className="clear-button" onClick={() => setPicks([])} disabled={!picks.length}>Futa yote</button></div>{picks.length === 0 ? <div className="slip-empty">Chaguo zako zitaonekana hapa. Anza kwa kujaza fomu.</div> : picks.map((pick, index) => <div className="selection-row" key={pick.id}><span className="selection-number">{index + 1}</span><div><strong>{pick.home} vs {pick.away}</strong><small>{pick.market} · {pick.selection}</small></div><button aria-label="Ondoa selection" onClick={() => setPicks((current) => current.filter((p) => p.id !== pick.id))}>×</button></div>)}<div className="slip-note">Huu ni muundo wa kuandaa na kushare chaguo. Hakuna odds, stake, malipo au uwekaji bet unaofanyika hapa.</div><button className="outline-button full-button" onClick={() => void downloadTicket()} disabled={!picks.length}>Pakua picha ya mkeka (PNG)</button></div></div></section>;
    if (active === 'seller') return <section className="module-page"><div className="module-intro"><div><span className="section-overline">SELLER CENTER</span><h2>Uza mikeka yako</h2><p>Admin lazima aidhinishe akaunti na kukagua kila listing kabla ya kuchapishwa sokoni.</p></div><span className="approval-badge">{profile?.role === 'seller' ? 'Seller ameidhinishwa' : 'Approval inahitajika'}</span></div><div className="seller-layout"><div className="seller-benefits"><div className="seller-symbol">✦</div><h3>Jenga biashara yako ya tips</h3><ul><li>Wasifu wa tipster na rekodi zinazoonekana</li><li>Listings zenye bei na maelezo wazi</li><li>Ripoti za mauzo na earnings</li><li>Platform commission inayopendekezwa: 10%</li></ul><p className="muted-note">Malipo, wallet na withdrawals bado vimezimwa hadi provider na compliance vikaguliwe.</p></div>{profile?.role === 'seller' ? <div className="seller-form"><h3>Chapisha listing mpya</h3><form onSubmit={(event) => void createListing(event)}><label>Kichwa cha mkeka / uchambuzi<input required maxLength={140} value={listingTitle} onChange={(e) => setListingTitle(e.target.value)} placeholder="Mfano: Uchambuzi wa mechi za leo" /></label><label>Maelezo<textarea value={listingDescription} onChange={(e) => setListingDescription(e.target.value)} maxLength={3000} placeholder="Eleza uchambuzi wako kwa uwazi..." /></label><label>Mchezo<select value={listingSport} onChange={(e) => setListingSport(e.target.value)}><option value="football">Mpira wa miguu</option><option value="basketball">Basketball</option><option value="tennis">Tennis</option><option value="other">Mengineyo</option></select></label><div className="seller-picks"><h4>Selections za mkeka (hadi 30)</h4><div className="seller-pick-fields"><input value={sellerHome} onChange={(e) => setSellerHome(e.target.value)} placeholder="Timu ya nyumbani" /><input value={sellerAway} onChange={(e) => setSellerAway(e.target.value)} placeholder="Timu ya ugenini" /><select value={sellerMarket} onChange={(e) => setSellerMarket(e.target.value)}><option>1X2</option><option>Over / Under</option><option>Both Teams To Score</option><option>Double Chance</option><option>Other</option></select><input value={sellerSelection} onChange={(e) => setSellerSelection(e.target.value)} placeholder="Chaguo lako" /><button type="button" className="outline-button" onClick={addSellerSelection}>＋ Ongeza chaguo</button></div>{sellerSelections.map((item, index) => <div className="seller-pick-row" key={item.id}><span>{index + 1}. {item.home} vs {item.away}</span><small>{item.market} · {item.selection}</small><button type="button" onClick={() => setSellerSelections((current) => current.filter((pick) => pick.id !== item.id))}>×</button></div>)}</div><label>Bei (TSh)<input required type="number" min="0" step="1" value={listingPrice} onChange={(e) => setListingPrice(e.target.value)} placeholder="0 kwa bure" /></label><button className="primary-button" type="submit">Tuma listing kwa Admin</button></form><h3 className="admin-section-title">Listings zako</h3>{sellerListings.length === 0 ? <p className="muted-note">Bado hujatuma listing.</p> : sellerListings.map((listing) => <div className="seller-listing-row" key={listing.id}><strong>{listing.title}</strong><small>{listing.status} · {listing.selection_count || listing.selections?.length || 0} selections · {listing.price_tzs.toLocaleString('en-US')} TSh</small></div>)}</div> : !authUser ? <div className="seller-form"><h3>Ingia kuomba kuwa seller</h3><p>Ombi lako litaunganishwa na akaunti yako ili uweze kufuatilia maamuzi ya Admin.</p><button className="primary-button" onClick={() => setAuthMode('login')}>Ingia / Jisajili</button></div> : mySellerApplication ? <div className="seller-form"><h3>Hali ya ombi lako</h3><span className="approval-badge">{mySellerApplication.status === 'pending' ? 'Linasubiri ukaguzi' : mySellerApplication.status === 'approved' ? 'Umeidhinishwa' : 'Ombi limekataliwa'}</span><p>{mySellerApplication.legal_name} · {mySellerApplication.phone}</p><p className="muted-note">Uliomba: {new Date(mySellerApplication.created_at).toLocaleString('sw-TZ')}{mySellerApplication.reviewed_at ? ' · Limekaguliwa: ' + new Date(mySellerApplication.reviewed_at).toLocaleString('sw-TZ') : ''}</p>{mySellerApplication.status === 'approved' && <><p>Refresh akaunti yako ili kufungua sehemu ya kutengeneza listings.</p><button className="primary-button" onClick={() => { if (!authUser) return; void apiRequest<{ user: Profile }>('/api/v1/me', authUser).then((data) => { setProfile(data.user); setNotice('Akaunti imesasishwa.'); }).catch((error: Error) => setNotice(error.message)); }}>Sasisha akaunti</button></>}{mySellerApplication.status === 'rejected' && <button className="outline-button" onClick={() => setMySellerApplication(null)}>Tuma ombi jipya</button>}</div> : <form className="seller-form" onSubmit={(e) => { e.preventDefault(); if (!authUser) { setAuthMode('login'); setNotice('Ingia kwanza ili kutuma ombi la seller.'); return; } void apiRequest('/api/v1/seller-applications', authUser, { method: 'POST', body: JSON.stringify({ legal_name: sellerName, phone: sellerPhone, reason: sellerReason }) }).then(() => { setSellerSent(true); void apiRequest<{ application: MySellerApplication | null }>('/api/v1/seller-applications/me', authUser).then((data) => setMySellerApplication(data.application)); setNotice('Ombi limetumwa. Status: PENDING.'); }).catch((error: Error) => setNotice(error.message)); }}><h3>Maombi ya seller</h3><label>Jina kamili<input required value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="Jina lako" /></label><label>Namba ya simu<input required type="tel" value={sellerPhone} onChange={(e) => setSellerPhone(e.target.value)} placeholder="07XX XXX XXX" /></label><label>Kwa nini unataka kuwa seller?<textarea required value={sellerReason} onChange={(e) => setSellerReason(e.target.value)} placeholder="Eleza uzoefu wako na aina ya uchambuzi..." /></label><button className="primary-button" type="submit" disabled={!authReady}>Tuma maombi ya seller</button>{sellerSent && <p className="form-notice">Ombi lako limepokelewa na linasubiri ukaguzi wa Admin.</p>}</form>}</div></section>;
    if (active === 'admin') return <section className="module-page"><div className="module-intro"><div><span className="section-overline">CONTROL PANEL</span><h2>Admin dashboard</h2><p>Usimamizi wa seller applications na marketplace kwa ruhusa za server.</p></div><span className="approval-badge">{profile?.role === 'admin' ? 'Admin amethibitishwa' : 'Admin access'}</span></div>{!authUser ? <div className="admin-warning">Ingia kwenye akaunti ya Admin ili kufungua control panel.</div> : profile?.role !== 'admin' ? <div className="admin-warning">Akaunti hii haina ruhusa ya Admin. Role inathibitishwa na backend; mmiliki wa mfumo anahitaji kukamilisha bootstrap ya Admin wa kwanza.</div> : <><div className="admin-stats-grid">{[['Watumiaji',adminSummary?.users],['Seller hai',adminSummary?.active_sellers],['Maombi ya seller',adminSummary?.pending_seller_applications],['Listings pending',adminSummary?.pending_listings],['Listings live',adminSummary?.published_listings],['Community posts',adminSummary?.community_posts],['Fixtures',adminSummary?.sports_fixtures],['Ledger entries',adminSummary?.wallet_ledger_entries]].map(([label,value]) => <div className="admin-stat" key={String(label)}><small>{label}</small><strong>{value ?? '—'}</strong></div>)}</div><h3 className="admin-section-title">Maombi ya seller</h3>{sellerApplications.length === 0 ? <div className="empty-state">Hakuna maombi ya seller yanayosubiri.</div> : <div className="admin-applications">{sellerApplications.map((application) => <article className="application-card" key={application.id}><div><strong>{application.legal_name}</strong><small>{application.phone} · {application.status}</small><p>{application.reason}</p></div>{application.status === 'pending' && <div className="application-actions"><button onClick={() => void reviewSeller(application.id, 'approved')}>Idhinisha</button><button onClick={() => void reviewSeller(application.id, 'rejected')}>Kataa</button></div>}</article>)}</div>}<h3 className="admin-section-title">Listings zinazosubiri ukaguzi</h3>{adminListings.length === 0 ? <div className="empty-state">Hakuna listing inayosubiri ukaguzi.</div> : <div className="admin-applications">{adminListings.map((listing) => <article className="application-card" key={listing.id}><div><strong>{listing.title}</strong><small>{listing.seller_name} · {listing.price_tzs.toLocaleString('en-US')} TSh</small><p>{listing.description}</p>{listing.selections && listing.selections.length > 0 && <ul className="admin-selection-list">{listing.selections.map((selection, index) => <li key={index}>{selection.home_name} vs {selection.away_name} — {selection.market}: <strong>{selection.selection}</strong></li>)}</ul>}</div><div className="application-actions"><button onClick={() => void reviewListing(listing.id, 'published')}>Chapisha</button><button onClick={() => void reviewListing(listing.id, 'rejected')}>Kataa</button></div></article>)}</div>}<h3 className="admin-section-title">Usimamizi wa watumiaji</h3>{adminUsers.length === 0 ? <div className="empty-state">Hakuna watumiaji bado.</div> : <div className="admin-applications">{adminUsers.map((account) => <article className="application-card" key={account.id}><div><strong>{account.display_name || 'Mtumiaji'}</strong><small>{account.phone || 'Namba haijaunganishwa'} · {account.role} · {account.account_status}</small><p>Alijiunga: {new Date(account.created_at).toLocaleString('sw-TZ')}</p></div>{account.role !== 'admin' && <div className="application-actions">{account.account_status === 'active' ? <button onClick={() => void setUserAccountStatus(account.id, 'suspended')}>Simamisha</button> : <button onClick={() => void setUserAccountStatus(account.id, 'active')}>Wezesha</button>}</div>}</article>)}</div>}<h3 className="admin-section-title">Audit log</h3>{adminAudit.length === 0 ? <div className="empty-state">Hakuna matukio yaliyorekodiwa bado.</div> : <div className="admin-applications">{adminAudit.slice(0,20).map((event) => <article className="application-card" key={event.id}><div><strong>{event.action}</strong><small>{event.actor_name || 'System'} · {event.target_type} · {event.target_id}</small></div><small>{new Date(event.created_at).toLocaleString('sw-TZ')}</small></article>)}</div>}</>}</section>;

    return <><section className="hero-panel"><div className="hero-copy"><span className="hero-kicker">ZAIDI YA MIKeka. NI JAMII.</span><h2>Maarifa ya michezo.<br /><em>Thamani ya pamoja.</em></h2><p>Sehemu moja ya kupata tips, kujifunza kutoka kwa wengine na kushiriki uchambuzi wako.</p><div className="hero-actions"><button className="hero-primary" onClick={() => go('marketplace')}>Gundua marketplace <span>→</span></button><button className="hero-secondary" onClick={() => go('community')}>Tembelea jamii</button></div></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="ball">⚽</div><div className="floating-card card-top"><span>✦</span><div><b>Tips zenye chanzo</b><small>Uwazi kwanza</small></div></div><div className="floating-card card-bottom"><span>◎</span><div><b>Jenga jamii</b><small>Shiriki uchambuzi</small></div></div></div><div className="hero-index">01 <span>/</span> 04</div></section>
    <section className="section-heading"><div><span className="section-overline">CHAGUA UNACHOTAFUTA</span><h2>Gundua jukwaa</h2></div><button className="text-link" onClick={() => go('marketplace')}>Angalia yote <span>→</span></button></section>
    <section className="discovery-grid"><button className="discovery-card market-card" onClick={() => go('marketplace')}><span className="discovery-icon">▤</span><span className="discovery-arrow">↗</span><strong>Tips Marketplace</strong><p>Gundua mikeka na wachambuzi. Bei na matokeo vitaonyeshwa kwa uwazi.</p><small>GUNDUA SOKO <span>→</span></small></button><button className="discovery-card community-card" onClick={() => go('community')}><span className="discovery-icon">◎</span><span className="discovery-arrow">↗</span><strong>Jamii ya Wazee</strong><p>Shiriki mawazo, jadili mechi na fuatilia tipsters unaowapenda.</p><small>JIUNGE NA JAMII <span>→</span></small></button><button className="discovery-card sports-card" onClick={() => go('sports')}><span className="discovery-icon">◉</span><span className="discovery-arrow">↗</span><strong>Michezo & Matokeo</strong><p>Fixtures, odds na matokeo kutoka kwa vyanzo vitakavyothibitishwa.</p><small>ANGALIA MICHEZO <span>→</span></small></button></section>
    <section className="section-heading market-heading"><div><span className="section-overline">SOKO LA TIPS</span><h2>Chunguza marketplace</h2></div><button className="text-link" onClick={() => go('marketplace')}>Marketplace yote <span>→</span></button></section><div className="filter-row">{categories.map((item) => <button key={item} className={category === item ? 'filter-chip selected' : 'filter-chip'} onClick={() => setCategory(item)}>{item}</button>)}</div><section className="empty-market"><div className="empty-illustration">▤</div><div><strong>Marketplace inajengwa</strong><p>Hakuna listing iliyochapishwa bado. Mikeka ya majaribio haitaonyeshwa kama bidhaa halisi.</p></div><button onClick={() => go('seller')}>Omba kuwa seller <span>→</span></button></section></>;
  };

  return <div className="app-frame"><aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}><a className="brand" href="#home" onClick={(e) => { e.preventDefault(); go('overview'); }}><span className="brand-mark">W</span><span><strong>WAZEE WA</strong><small>BETTING TZ</small></span></a><div className="sidebar-label">MENU KUU</div><nav className="side-nav" aria-label="Navigation kuu">{navItems.filter((item) => item.id !== 'admin' || profile?.role === 'admin').map((item) => <button className={`nav-item ${active === item.id ? 'active' : ''}`} key={item.id} onClick={() => go(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}{item.id === 'marketplace' && <span className="nav-dot" />}</button>)}</nav><div className="sidebar-bottom"><div className="seller-card"><span className="seller-card-icon">✦</span><strong>Uza mikeka yako</strong><p>Jiunge kama tipster na ujenge jamii yako.</p><button onClick={() => go('seller')}>Anza hapa <span>→</span></button></div><div className="sidebar-foot">Wazee wa Betting TZ <span>•</span> Beta</div></div></aside>
  {mobileMenuOpen && <button className="mobile-scrim" aria-label="Funga menyu" onClick={() => setMobileMenuOpen(false)} />}
  <main className="main-area"><header className="topbar"><button className="mobile-menu" aria-label="Fungua menyu" onClick={() => setMobileMenuOpen(true)}>☰</button><div className="breadcrumb">Wazee wa Betting TZ <span>/</span> <strong>{activeLabel}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Arifa" onClick={() => setNotice('Arifa zitaunganishwa baada ya backend.')}>♧<i /></button><button className="login-button" onClick={() => authUser ? void logout() : setAuthMode('login')}>{authUser ? (profile?.display_name || 'Akaunti') + ' · Toka' : 'Ingia / Jisajili'}</button><button className="avatar avatar-button" onClick={() => authUser ? void openMemberProfile(authUser.uid) : setAuthMode('login')} aria-label="Fungua wasifu">W</button></div></header><div className="page-content">{active === 'overview' && <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> JUKWAA LA MICHEZO NA TIPS</div><h1>Karibu kwenye Wazee.</h1><p className="welcome-copy">Gundua wachambuzi, shiriki maarifa na jenga mikeka yako kwa taarifa zenye chanzo.</p></div><button className="primary-button" onClick={() => go('builder')}><span>＋</span> Jenga mkeka</button></section>}{pageContent()}{notice && <div className="notice-bar" role="status"><span>ⓘ</span>{notice}<button onClick={() => setNotice('')}>×</button></div>}<footer className="page-footer"><span>© 2026 Wazee wa Betting TZ</span><span>Jukwaa la maarifa, uwazi na jamii.</span><span className="footer-status"><i /> Mfumo unaandaliwa</span></footer></div></main>
  <nav className="mobile-bottom-nav" aria-label="Navigation ya simu">{navItems.slice(0, 5).map((item) => <button key={item.id} className={active === item.id ? 'mobile-active' : ''} onClick={() => go(item.id)}><span>{item.icon}</span><small>{item.label === 'Soko la mikeka' ? 'Soko' : item.label === 'Jenga mkeka' ? 'Jenga' : item.label}</small></button>)}</nav>{profileViewId && <div className="auth-overlay profile-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setProfileViewId(null); }}><section className="member-profile-card"><button className="auth-close" onClick={() => setProfileViewId(null)}>×</button>{profileBusy || !memberProfile ? <p>Inapakia wasifu...</p> : <><div className="member-profile-head"><div className="member-avatar">{memberProfile.avatar_url ? <img src={memberProfile.avatar_url} alt="" /> : (memberProfile.display_name || 'W').slice(0,1).toUpperCase()}</div><div><span className="section-overline">WAZEE WA BETTING TZ</span><h2>{memberProfile.display_name || 'Mwanachama'}</h2><span className="profile-role">{memberProfile.role}</span></div></div><p className="member-bio">{memberProfile.bio || 'Bado hajaandika maelezo ya wasifu.'}</p><div className="member-stats"><div><strong>{memberProfile.posts_count}</strong><small>Posts</small></div><div><strong>{memberProfile.followers_count}</strong><small>Followers</small></div><div><strong>{memberProfile.following_count}</strong><small>Following</small></div><div><strong>{memberProfile.published_listings}</strong><small>Listings</small></div></div>{memberProfile.role === 'seller' && <p className="profile-record">Selections zilizothibitishwa: {memberProfile.won_selections} won · {memberProfile.lost_selections} lost</p>}{authUser?.uid === memberProfile.id ? <form className="profile-edit-form" onSubmit={(event) => void saveMemberProfile(event)}><h3>Hariri wasifu wako</h3><label>Jina linaloonekana<input required maxLength={80} value={profileEditName} onChange={(event) => setProfileEditName(event.target.value)} /></label><label>Maelezo mafupi<textarea maxLength={280} value={profileEditBio} onChange={(event) => setProfileEditBio(event.target.value)} /></label><label>Picha ya wasifu (URL ya HTTPS)<input value={profileEditAvatar} onChange={(event) => setProfileEditAvatar(event.target.value)} placeholder="https://..." /></label><button className="primary-button" type="submit">Hifadhi wasifu</button></form> : authUser && <button className="primary-button profile-follow" onClick={() => void toggleFollow(memberProfile.id)}>{followingUsers.includes(memberProfile.id) ? 'Unafuatilia' : 'Fuata'}</button>}</>}</section></div>}{authMode && <div className="auth-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthMode(null); }}><form className="auth-card" onSubmit={(event) => void submitAuth(event)}><button className="auth-close" type="button" onClick={() => setAuthMode(null)}>×</button><span className="section-overline">WAZEE WA BETTING TZ</span><h2>{authMode === 'register' ? 'Fungua akaunti' : 'Karibu tena'}</h2><p>Usajili na login hutumia namba ya simu na password. Hakuna Google login.</p><div className="auth-tabs"><button type="button" className={authMode === 'login' ? 'selected' : ''} onClick={() => { setAuthMode('login'); setAuthError(''); }}>Ingia</button><button type="button" className={authMode === 'register' ? 'selected' : ''} onClick={() => { setAuthMode('register'); setAuthError(''); }}>Jisajili</button></div>{authMode === 'register' && <><label>Jina la kwanza<input required value={authFirstName} onChange={(e) => setAuthFirstName(e.target.value)} autoComplete="given-name" /></label><label>Jina la mwisho<input required value={authLastName} onChange={(e) => setAuthLastName(e.target.value)} autoComplete="family-name" /></label></>}<label>Namba ya simu<input required type="tel" value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} placeholder="0712 345 678" autoComplete="tel" /></label><label>Password<input required type="password" minLength={6} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} /></label>{authError && <p className="auth-error">{authError}</p>}<button className="primary-button auth-submit" type="submit" disabled={authBusy}>{authBusy ? 'Subiri...' : authMode === 'register' ? 'Jisajili' : 'Ingia'}</button></form></div>}</div>;
}
export default App;
