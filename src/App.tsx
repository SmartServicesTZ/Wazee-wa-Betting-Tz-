import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { apiRequest, loginWithPhone, logout, registerWithPhone, watchAuth } from './lib/firebase';

type Section = 'overview' | 'marketplace' | 'community' | 'sports' | 'builder' | 'seller' | 'admin';
type Post = { id: string; author: string; text: string; likes: number; comments: number; time: string };
type Pick = { id: number; home: string; away: string; market: string; selection: string };
type Profile = { id: string; display_name: string; role: 'buyer' | 'seller' | 'admin'; account_status: string };
type Listing = { id: string; title: string; description: string; sport: string; price_tzs: number; seller_name: string };
type SellerApplication = { id: string; legal_name: string; phone: string; reason: string; status: string; created_at: string; display_name: string };
type SellerListing = { id: string; title: string; description: string; sport: string; price_tzs: number; status: string; result_status: string; created_at: string; seller_name?: string };

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [postText, setPostText] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
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
  const [sellerListings, setSellerListings] = useState<SellerListing[]>([]);
  const [adminListings, setAdminListings] = useState<SellerListing[]>([]);
  const [listingTitle, setListingTitle] = useState('');
  const [listingDescription, setListingDescription] = useState('');
  const [listingSport, setListingSport] = useState('football');
  const [listingPrice, setListingPrice] = useState('');
  const activeLabel = navItems.find((item) => item.id === active)?.label ?? 'Muhtasari';
  const totalSelections = useMemo(() => picks.length, [picks]);

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
      void apiRequest<{ items: Array<{ id: string; body: string; author_name: string; likes_count: number; comments_count: number; created_at: string }> }>('/api/v1/community/posts')
        .then((data) => setPosts((data.items || []).map((post) => ({ id: post.id, author: post.author_name || 'Mwanachama', text: post.body, likes: post.likes_count || 0, comments: post.comments_count || 0, time: post.created_at }))));
    }
    if (active === 'seller' && authUser && profile?.role === 'seller') {
      void apiRequest<{ items: SellerListing[] }>('/api/v1/seller/listings/me', authUser)
        .then((data) => setSellerListings(data.items || []))
        .catch((error: Error) => setNotice(error.message));
    }
    if (active === 'admin' && authUser && profile?.role === 'admin') {
      void Promise.all([
        apiRequest<{ items: SellerApplication[] }>('/api/v1/admin/seller-applications', authUser),
        apiRequest<{ items: SellerListing[] }>('/api/v1/admin/listings', authUser),
      ]).then(([applications, pendingListings]) => { setSellerApplications(applications.items || []); setAdminListings(pendingListings.items || []); })
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
      const data = await apiRequest<{ items: Array<{ id: string; body: string; author_name: string; likes_count: number; comments_count: number; created_at: string }> }>('/api/v1/community/posts');
      setPosts((data.items || []).map((post) => ({ id: post.id, author: post.author_name || 'Mwanachama', text: post.body, likes: post.likes_count || 0, comments: post.comments_count || 0, time: post.created_at })));
      setNotice('Post imechapishwa kwenye jamii.');
    } catch (error) { setNotice((error as Error).message || 'Imeshindikana kuchapisha post.'); }
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

  const createListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser) return;
    try {
      await apiRequest('/api/v1/seller/listings', authUser, { method: 'POST', body: JSON.stringify({ title: listingTitle, description: listingDescription, sport: listingSport, price_tzs: Number(listingPrice) }) });
      setListingTitle(''); setListingDescription(''); setListingPrice('');
      const data = await apiRequest<{ items: SellerListing[] }>('/api/v1/seller/listings/me', authUser);
      setSellerListings(data.items || []); setNotice('Listing imetumwa kwa Admin kwa ukaguzi kabla ya kuchapishwa.');
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
      <div className="market-toolbar"><div className="filter-row">{categories.map((item) => <button key={item} className={category === item ? 'filter-chip selected' : 'filter-chip'} onClick={() => setCategory(item)}>{item}</button>)}</div><input className="search-input" placeholder="Tafuta tipster au mkeka..." /></div>
      {listings.length === 0 ? <div className="empty-state large-empty"><div className="empty-illustration">▤</div><h3>Marketplace inasubiri wauzaji wa kwanza</h3><p>Hakuna listing iliyochapishwa. Bidhaa, bei na rekodi za ushindi zitaonekana baada ya seller kuidhinishwa na kuweka listing halisi.</p><button className="outline-button" onClick={() => go('seller')}>Anza maombi ya seller →</button></div> : <div className="listing-grid">{listings.map((listing) => <article className="listing-card" key={listing.id}><span className="section-overline">{listing.sport}</span><h3>{listing.title}</h3><p>{listing.description}</p><div><strong>{listing.price_tzs.toLocaleString('en-US')} TSh</strong><small>Seller: {listing.seller_name}</small></div></article>)}</div>}
    </section>;
    if (active === 'community') return <section className="module-page">
      <div className="module-intro"><div><span className="section-overline">SOCIAL NETWORK</span><h2>Jamii ya Wazee</h2><p>Jadili michezo, shiriki uchambuzi na fuatilia wachambuzi.</p></div></div>
      <div className="community-layout"><div className="feed-column"><div className="composer"><div className="avatar">W</div><div className="composer-body"><textarea value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="Una maoni gani kuhusu michezo ya leo?" /><div className="composer-footer"><span>Shiriki kwa heshima. Epuka madai ya ushindi wa uhakika.</span><button className="primary-button" onClick={publishPost} disabled={!postText.trim()}>Chapisha</button></div></div></div>
      {posts.length === 0 ? <div className="empty-state"><div className="empty-illustration">◎</div><h3>Karibu kwenye jamii</h3><p>Bado hakuna post zilizochapishwa. Ingia ili uwe wa kwanza kushiriki.</p></div> : posts.map((post) => <article className="post-card" key={post.id}><div className="post-head"><div className="avatar">W</div><div><strong>{post.author}</strong><small>{post.time}</small></div><span className="post-menu">•••</span></div><p>{post.text}</p><div className="post-actions"><span>♡ {post.likes} Likes</span><span>▢ {post.comments} Maoni</span><button onClick={() => setNotice('Kushare post kutawashwa kwenye toleo lijalo.')}>↗ Shiriki</button></div></article>)}</div>
      <aside className="community-aside"><div className="aside-card"><span className="section-overline">KANUNI ZA JAMII</span><h3>Uwazi kwanza</h3><p>Hakuna tips za uhakika, matokeo ya kubuni au udanganyifu wa takwimu. Rekodi za tipster zitathibitishwa kwa matokeo halisi.</p></div><div className="aside-card"><span className="section-overline">JENGA WASIFU</span><h3>Fuata maendeleo yako</h3><p>Profiles, followers na leaderboard vitaunganishwa baada ya mfumo wa akaunti kuwekwa.</p></div></aside></div>
    </section>;
    if (active === 'sports') return <section className="module-page"><div className="module-intro"><div><span className="section-overline">SPORTS DATA</span><h2>Michezo na matokeo</h2><p>Ratiba, ligi, odds na matokeo kutoka kwa data providers wenye chanzo kinachotambulika.</p></div><span className="source-badge">Chanzo cha data: hakijaunganishwa</span></div><div className="sports-tabs"><button className="sports-tab active">Ratiba</button><button className="sports-tab">Live</button><button className="sports-tab">Matokeo</button><button className="sports-tab">Ligi</button></div><div className="empty-state large-empty"><div className="empty-illustration">◉</div><h3>Sports data provider bado hajaunganishwa</h3><p>Hatuonyeshi fixtures, live scores au odds za kubuni. Sehemu hii itaanza kuonyesha data baada ya API provider, key na masharti yake kuthibitishwa.</p><button className="outline-button" onClick={() => go('builder')}>Fungua bet builder →</button></div></section>;
    if (active === 'builder') return <section className="module-page"><div className="module-intro"><div><span className="section-overline">TICKET BUILDER</span><h2>Jenga mkeka wako</h2><p>Andaa chaguo zako. Odds hazijazalishwa; zitaongezwa tu kutoka chanzo kilichothibitishwa.</p></div><span className="count-pill">{totalSelections} selections</span></div><div className="builder-layout"><div className="builder-form"><h3>Ongeza mechi / chaguo</h3><label>Timu ya nyumbani<input value={fixtureHome} onChange={(e) => setFixtureHome(e.target.value)} placeholder="Mfano: Timu A" /></label><label>Timu ya ugenini<input value={fixtureAway} onChange={(e) => setFixtureAway(e.target.value)} placeholder="Mfano: Timu B" /></label><label>Soko<select value={fixtureMarket} onChange={(e) => setFixtureMarket(e.target.value)}><option>1X2</option><option>Over / Under</option><option>Both Teams To Score</option><option>Double Chance</option><option>Other</option></select></label><label>Chaguo lako<input value={fixtureSelection} onChange={(e) => setFixtureSelection(e.target.value)} placeholder="Andika selection" /></label><button className="primary-button" onClick={addPick}>＋ Ongeza selection</button></div><div className="builder-slip"><div className="slip-head"><div><span className="section-overline">BET SLIP PREVIEW</span><h3>Mkeka wako</h3></div><button className="clear-button" onClick={() => setPicks([])} disabled={!picks.length}>Futa yote</button></div>{picks.length === 0 ? <div className="slip-empty">Chaguo zako zitaonekana hapa. Anza kwa kujaza fomu.</div> : picks.map((pick, index) => <div className="selection-row" key={pick.id}><span className="selection-number">{index + 1}</span><div><strong>{pick.home} vs {pick.away}</strong><small>{pick.market} · {pick.selection}</small></div><button aria-label="Ondoa selection" onClick={() => setPicks((current) => current.filter((p) => p.id !== pick.id))}>×</button></div>)}<div className="slip-note">Huu ni muundo wa kuandaa na kushare chaguo. Hakuna odds, stake, malipo au uwekaji bet unaofanyika hapa.</div><button className="outline-button full-button" onClick={() => setNotice('Export ya picha na kushare itawashwa baada ya ticket service kuunganishwa.')} disabled={!picks.length}>Tengeneza picha ya mkeka</button></div></div></section>;
    if (active === 'seller') return <section className="module-page"><div className="module-intro"><div><span className="section-overline">SELLER CENTER</span><h2>Uza mikeka yako</h2><p>Admin lazima aidhinishe akaunti na kukagua kila listing kabla ya kuchapishwa sokoni.</p></div><span className="approval-badge">{profile?.role === 'seller' ? 'Seller ameidhinishwa' : 'Approval inahitajika'}</span></div><div className="seller-layout"><div className="seller-benefits"><div className="seller-symbol">✦</div><h3>Jenga biashara yako ya tips</h3><ul><li>Wasifu wa tipster na rekodi zinazoonekana</li><li>Listings zenye bei na maelezo wazi</li><li>Ripoti za mauzo na earnings</li><li>Platform commission inayopendekezwa: 10%</li></ul><p className="muted-note">Malipo, wallet na withdrawals bado vimezimwa hadi provider na compliance vikaguliwe.</p></div>{profile?.role === 'seller' ? <div className="seller-form"><h3>Chapisha listing mpya</h3><form onSubmit={(event) => void createListing(event)}><label>Kichwa cha mkeka / uchambuzi<input required maxLength={140} value={listingTitle} onChange={(e) => setListingTitle(e.target.value)} placeholder="Mfano: Uchambuzi wa mechi za leo" /></label><label>Maelezo<textarea value={listingDescription} onChange={(e) => setListingDescription(e.target.value)} maxLength={3000} placeholder="Eleza uchambuzi wako kwa uwazi..." /></label><label>Mchezo<select value={listingSport} onChange={(e) => setListingSport(e.target.value)}><option value="football">Mpira wa miguu</option><option value="basketball">Basketball</option><option value="tennis">Tennis</option><option value="other">Mengineyo</option></select></label><label>Bei (TSh)<input required type="number" min="0" step="1" value={listingPrice} onChange={(e) => setListingPrice(e.target.value)} placeholder="0 kwa bure" /></label><button className="primary-button" type="submit">Tuma listing kwa Admin</button></form><h3 className="admin-section-title">Listings zako</h3>{sellerListings.length === 0 ? <p className="muted-note">Bado hujatuma listing.</p> : sellerListings.map((listing) => <div className="seller-listing-row" key={listing.id}><strong>{listing.title}</strong><small>{listing.status} · {listing.price_tzs.toLocaleString('en-US')} TSh</small></div>)}</div> : <form className="seller-form" onSubmit={(e) => { e.preventDefault(); if (!authUser) { setAuthMode('login'); setNotice('Ingia kwanza ili kutuma ombi la seller.'); return; } void apiRequest('/api/v1/seller-applications', authUser, { method: 'POST', body: JSON.stringify({ legal_name: sellerName, phone: sellerPhone, reason: sellerReason }) }).then(() => { setSellerSent(true); setNotice('Ombi limetumwa. Status: PENDING.'); }).catch((error: Error) => setNotice(error.message)); }}><h3>Maombi ya seller</h3><label>Jina kamili<input required value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="Jina lako" /></label><label>Namba ya simu<input required type="tel" value={sellerPhone} onChange={(e) => setSellerPhone(e.target.value)} placeholder="07XX XXX XXX" /></label><label>Kwa nini unataka kuwa seller?<textarea required value={sellerReason} onChange={(e) => setSellerReason(e.target.value)} placeholder="Eleza uzoefu wako na aina ya uchambuzi..." /></label><button className="primary-button" type="submit" disabled={!authReady}>Tuma maombi ya seller</button>{sellerSent && <p className="form-notice">Ombi lako limepokelewa na linasubiri ukaguzi wa Admin.</p>}</form>}</div></section>;
    if (active === 'admin') return <section className="module-page"><div className="module-intro"><div><span className="section-overline">CONTROL PANEL</span><h2>Admin dashboard</h2><p>Usimamizi wa seller applications na marketplace kwa ruhusa za server.</p></div><span className="approval-badge">{profile?.role === 'admin' ? 'Admin amethibitishwa' : 'Admin access'}</span></div>{!authUser ? <div className="admin-warning">Ingia kwenye akaunti ya Admin ili kufungua control panel.</div> : profile?.role !== 'admin' ? <div className="admin-warning">Akaunti hii haina ruhusa ya Admin. Role inathibitishwa na backend; mmiliki wa mfumo anahitaji kukamilisha bootstrap ya Admin wa kwanza.</div> : <><h3 className="admin-section-title">Maombi ya seller</h3>{sellerApplications.length === 0 ? <div className="empty-state">Hakuna maombi ya seller yanayosubiri.</div> : <div className="admin-applications">{sellerApplications.map((application) => <article className="application-card" key={application.id}><div><strong>{application.legal_name}</strong><small>{application.phone} · {application.status}</small><p>{application.reason}</p></div>{application.status === 'pending' && <div className="application-actions"><button onClick={() => void reviewSeller(application.id, 'approved')}>Idhinisha</button><button onClick={() => void reviewSeller(application.id, 'rejected')}>Kataa</button></div>}</article>)}</div>}<h3 className="admin-section-title">Listings zinazosubiri ukaguzi</h3>{adminListings.length === 0 ? <div className="empty-state">Hakuna listing inayosubiri ukaguzi.</div> : <div className="admin-applications">{adminListings.map((listing) => <article className="application-card" key={listing.id}><div><strong>{listing.title}</strong><small>{listing.seller_name} · {listing.price_tzs.toLocaleString('en-US')} TSh</small><p>{listing.description}</p></div><div className="application-actions"><button onClick={() => void reviewListing(listing.id, 'published')}>Chapisha</button><button onClick={() => void reviewListing(listing.id, 'rejected')}>Kataa</button></div></article>)}</div>}</>}</section>;

    return <><section className="hero-panel"><div className="hero-copy"><span className="hero-kicker">ZAIDI YA MIKeka. NI JAMII.</span><h2>Maarifa ya michezo.<br /><em>Thamani ya pamoja.</em></h2><p>Sehemu moja ya kupata tips, kujifunza kutoka kwa wengine na kushiriki uchambuzi wako.</p><div className="hero-actions"><button className="hero-primary" onClick={() => go('marketplace')}>Gundua marketplace <span>→</span></button><button className="hero-secondary" onClick={() => go('community')}>Tembelea jamii</button></div></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="ball">⚽</div><div className="floating-card card-top"><span>✦</span><div><b>Tips zenye chanzo</b><small>Uwazi kwanza</small></div></div><div className="floating-card card-bottom"><span>◎</span><div><b>Jenga jamii</b><small>Shiriki uchambuzi</small></div></div></div><div className="hero-index">01 <span>/</span> 04</div></section>
    <section className="section-heading"><div><span className="section-overline">CHAGUA UNACHOTAFUTA</span><h2>Gundua jukwaa</h2></div><button className="text-link" onClick={() => go('marketplace')}>Angalia yote <span>→</span></button></section>
    <section className="discovery-grid"><button className="discovery-card market-card" onClick={() => go('marketplace')}><span className="discovery-icon">▤</span><span className="discovery-arrow">↗</span><strong>Tips Marketplace</strong><p>Gundua mikeka na wachambuzi. Bei na matokeo vitaonyeshwa kwa uwazi.</p><small>GUNDUA SOKO <span>→</span></small></button><button className="discovery-card community-card" onClick={() => go('community')}><span className="discovery-icon">◎</span><span className="discovery-arrow">↗</span><strong>Jamii ya Wazee</strong><p>Shiriki mawazo, jadili mechi na fuatilia tipsters unaowapenda.</p><small>JIUNGE NA JAMII <span>→</span></small></button><button className="discovery-card sports-card" onClick={() => go('sports')}><span className="discovery-icon">◉</span><span className="discovery-arrow">↗</span><strong>Michezo & Matokeo</strong><p>Fixtures, odds na matokeo kutoka kwa vyanzo vitakavyothibitishwa.</p><small>ANGALIA MICHEZO <span>→</span></small></button></section>
    <section className="section-heading market-heading"><div><span className="section-overline">SOKO LA TIPS</span><h2>Chunguza marketplace</h2></div><button className="text-link" onClick={() => go('marketplace')}>Marketplace yote <span>→</span></button></section><div className="filter-row">{categories.map((item) => <button key={item} className={category === item ? 'filter-chip selected' : 'filter-chip'} onClick={() => setCategory(item)}>{item}</button>)}</div><section className="empty-market"><div className="empty-illustration">▤</div><div><strong>Marketplace inajengwa</strong><p>Hakuna listing iliyochapishwa bado. Mikeka ya majaribio haitaonyeshwa kama bidhaa halisi.</p></div><button onClick={() => go('seller')}>Omba kuwa seller <span>→</span></button></section></>;
  };

  return <div className="app-frame"><aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}><a className="brand" href="#home" onClick={(e) => { e.preventDefault(); go('overview'); }}><span className="brand-mark">W</span><span><strong>WAZEE WA</strong><small>BETTING TZ</small></span></a><div className="sidebar-label">MENU KUU</div><nav className="side-nav" aria-label="Navigation kuu">{navItems.map((item) => <button className={`nav-item ${active === item.id ? 'active' : ''}`} key={item.id} onClick={() => go(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}{item.id === 'marketplace' && <span className="nav-dot" />}</button>)}</nav><div className="sidebar-bottom"><div className="seller-card"><span className="seller-card-icon">✦</span><strong>Uza mikeka yako</strong><p>Jiunge kama tipster na ujenge jamii yako.</p><button onClick={() => go('seller')}>Anza hapa <span>→</span></button></div><div className="sidebar-foot">Wazee wa Betting TZ <span>•</span> Beta</div></div></aside>
  {mobileMenuOpen && <button className="mobile-scrim" aria-label="Funga menyu" onClick={() => setMobileMenuOpen(false)} />}
  <main className="main-area"><header className="topbar"><button className="mobile-menu" aria-label="Fungua menyu" onClick={() => setMobileMenuOpen(true)}>☰</button><div className="breadcrumb">Wazee wa Betting TZ <span>/</span> <strong>{activeLabel}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Arifa" onClick={() => setNotice('Arifa zitaunganishwa baada ya backend.')}>♧<i /></button><button className="login-button" onClick={() => authUser ? void logout() : setAuthMode('login')}>{authUser ? (profile?.display_name || 'Akaunti') + ' · Toka' : 'Ingia / Jisajili'}</button><div className="avatar">W</div></div></header><div className="page-content">{active === 'overview' && <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> JUKWAA LA MICHEZO NA TIPS</div><h1>Karibu kwenye Wazee.</h1><p className="welcome-copy">Gundua wachambuzi, shiriki maarifa na jenga mikeka yako kwa taarifa zenye chanzo.</p></div><button className="primary-button" onClick={() => go('builder')}><span>＋</span> Jenga mkeka</button></section>}{pageContent()}{notice && <div className="notice-bar" role="status"><span>ⓘ</span>{notice}<button onClick={() => setNotice('')}>×</button></div>}<footer className="page-footer"><span>© 2026 Wazee wa Betting TZ</span><span>Jukwaa la maarifa, uwazi na jamii.</span><span className="footer-status"><i /> Mfumo unaandaliwa</span></footer></div></main>
  <nav className="mobile-bottom-nav" aria-label="Navigation ya simu">{navItems.slice(0, 5).map((item) => <button key={item.id} className={active === item.id ? 'mobile-active' : ''} onClick={() => go(item.id)}><span>{item.icon}</span><small>{item.label === 'Soko la mikeka' ? 'Soko' : item.label === 'Jenga mkeka' ? 'Jenga' : item.label}</small></button>)}</nav>{authMode && <div className="auth-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthMode(null); }}><form className="auth-card" onSubmit={(event) => void submitAuth(event)}><button className="auth-close" type="button" onClick={() => setAuthMode(null)}>×</button><span className="section-overline">WAZEE WA BETTING TZ</span><h2>{authMode === 'register' ? 'Fungua akaunti' : 'Karibu tena'}</h2><p>Usajili na login hutumia namba ya simu na password. Hakuna Google login.</p><div className="auth-tabs"><button type="button" className={authMode === 'login' ? 'selected' : ''} onClick={() => { setAuthMode('login'); setAuthError(''); }}>Ingia</button><button type="button" className={authMode === 'register' ? 'selected' : ''} onClick={() => { setAuthMode('register'); setAuthError(''); }}>Jisajili</button></div>{authMode === 'register' && <><label>Jina la kwanza<input required value={authFirstName} onChange={(e) => setAuthFirstName(e.target.value)} autoComplete="given-name" /></label><label>Jina la mwisho<input required value={authLastName} onChange={(e) => setAuthLastName(e.target.value)} autoComplete="family-name" /></label></>}<label>Namba ya simu<input required type="tel" value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} placeholder="0712 345 678" autoComplete="tel" /></label><label>Password<input required type="password" minLength={6} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} /></label>{authError && <p className="auth-error">{authError}</p>}<button className="primary-button auth-submit" type="submit" disabled={authBusy}>{authBusy ? 'Subiri...' : authMode === 'register' ? 'Jisajili' : 'Ingia'}</button></form></div>}</div>;
}
export default App;
