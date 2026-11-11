import { useState } from 'react';

type Section = 'overview' | 'marketplace' | 'community' | 'sports' | 'builder' | 'seller';

const navItems: { id: Section; label: string; icon: string }[] = [
  { id: 'overview', label: 'Muhtasari', icon: '⌂' },
  { id: 'marketplace', label: 'Soko la mikeka', icon: '▤' },
  { id: 'community', label: 'Jamii', icon: '◎' },
  { id: 'sports', label: 'Michezo', icon: '◉' },
  { id: 'builder', label: 'Jenga mkeka', icon: '＋' },
  { id: 'seller', label: 'Seller Center', icon: '♙' },
];

const categories = ['Zote', 'Mpira wa miguu', 'Basketball', 'Tennis', 'Mikeka ya bure'];

function App() {
  const [active, setActive] = useState<Section>('overview');
  const [category, setCategory] = useState('Zote');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeLabel = navItems.find((item) => item.id === active)?.label ?? 'Muhtasari';

  return (
    <div className="app-frame">
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#home" onClick={() => setActive('overview')}>
          <span className="brand-mark">W</span>
          <span><strong>WAZEE WA</strong><small>BETTING TZ</small></span>
        </a>
        <div className="sidebar-label">MENU KUU</div>
        <nav className="side-nav" aria-label="Navigation kuu">
          {navItems.map((item) => (
            <button
              className={`nav-item ${active === item.id ? 'active' : ''}`}
              key={item.id}
              onClick={() => { setActive(item.id); setMobileMenuOpen(false); }}
            >
              <span className="nav-icon">{item.icon}</span>{item.label}
              {item.id === 'marketplace' && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="seller-card">
            <span className="seller-card-icon">✦</span>
            <strong>Uza mikeka yako</strong>
            <p>Jiunge kama tipster na ujenge jamii yako.</p>
            <button onClick={() => setActive('seller')}>Anza hapa <span>→</span></button>
          </div>
          <div className="sidebar-foot">Wazee wa Betting TZ <span>•</span> Beta</div>
        </div>
      </aside>

      {mobileMenuOpen && <button className="mobile-scrim" aria-label="Funga menyu" onClick={() => setMobileMenuOpen(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Fungua menyu" onClick={() => setMobileMenuOpen(true)}>☰</button>
          <div className="breadcrumb">Wazee wa Betting TZ <span>/</span> <strong>{activeLabel}</strong></div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Arifa">♧<i /></button>
            <button className="login-button">Ingia / Jisajili</button>
            <div className="avatar">W</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" /> JUKWAA LA MICHEZO NA TIPS</div>
              <h1>{active === 'overview' ? 'Karibu kwenye Wazee.' : activeLabel}</h1>
              <p className="welcome-copy">Gundua wachambuzi, shiriki maarifa na jenga mikeka yako kwa taarifa zenye chanzo.</p>
            </div>
            <button className="primary-button" onClick={() => setActive('builder')}><span>＋</span> Jenga mkeka</button>
          </section>

          <section className="hero-panel">
            <div className="hero-copy">
              <span className="hero-kicker">ZAIDI YA MIKeka. NI JAMII.</span>
              <h2>Maarifa ya michezo.<br /><em>Thamani ya pamoja.</em></h2>
              <p>Sehemu moja ya kupata tips, kujifunza kutoka kwa wengine na kushiriki uchambuzi wako.</p>
              <div className="hero-actions">
                <button className="hero-primary" onClick={() => setActive('marketplace')}>Gundua marketplace <span>→</span></button>
                <button className="hero-secondary" onClick={() => setActive('community')}>Tembelea jamii</button>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="orbit orbit-one" /><div className="orbit orbit-two" />
              <div className="ball">⚽</div>
              <div className="floating-card card-top"><span>✦</span><div><b>Tips zenye chanzo</b><small>Uwazi kwanza</small></div></div>
              <div className="floating-card card-bottom"><span>◎</span><div><b>Jenga jamii</b><small>Shiriki uchambuzi</small></div></div>
            </div>
            <div className="hero-index">01 <span>/</span> 04</div>
          </section>

          <section className="section-heading">
            <div><span className="section-overline">CHAGUA UNACHOTAFUTA</span><h2>Gundua jukwaa</h2></div>
            <button className="text-link" onClick={() => setActive('marketplace')}>Angalia yote <span>→</span></button>
          </section>

          <section className="discovery-grid">
            <button className="discovery-card market-card" onClick={() => setActive('marketplace')}>
              <span className="discovery-icon">▤</span><span className="discovery-arrow">↗</span>
              <strong>Tips Marketplace</strong><p>Gundua mikeka na wachambuzi. Bei na matokeo vitaonyeshwa kwa uwazi.</p><small>GUNDUA SOKO <span>→</span></small>
            </button>
            <button className="discovery-card community-card" onClick={() => setActive('community')}>
              <span className="discovery-icon">◎</span><span className="discovery-arrow">↗</span>
              <strong>Jamii ya Wazee</strong><p>Shiriki mawazo, jadili mechi na fuatilia tipsters unaowapenda.</p><small>JIUNGE NA JAMII <span>→</span></small>
            </button>
            <button className="discovery-card sports-card" onClick={() => setActive('sports')}>
              <span className="discovery-icon">◉</span><span className="discovery-arrow">↗</span>
              <strong>Michezo & Matokeo</strong><p>Fixtures, odds na matokeo kutoka kwa vyanzo vitakavyothibitishwa.</p><small>ANGALIA MICHEZO <span>→</span></small>
            </button>
          </section>

          <section className="section-heading market-heading">
            <div><span className="section-overline">SOKO LA TIPS</span><h2>Chunguza marketplace</h2></div>
            <button className="text-link" onClick={() => setActive('marketplace')}>Marketplace yote <span>→</span></button>
          </section>
          <div className="filter-row">
            {categories.map((item) => <button key={item} className={category === item ? 'filter-chip selected' : 'filter-chip'} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          <section className="empty-market">
            <div className="empty-illustration">▤</div>
            <div><strong>Marketplace inajengwa</strong><p>Hakuna listing iliyochapishwa bado. Mikeka ya majaribio haitaonyeshwa kama bidhaa halisi.</p></div>
            <button onClick={() => setActive('seller')}>Omba kuwa seller <span>→</span></button>
          </section>

          <footer className="page-footer">
            <span>© 2026 Wazee wa Betting TZ</span>
            <span>Jukwaa la maarifa, uwazi na jamii.</span>
            <span className="footer-status"><i /> Mfumo unaandaliwa</span>
          </footer>
        </div>
      </main>

      <nav className="mobile-bottom-nav" aria-label="Navigation ya simu">
        {navItems.slice(0, 5).map((item) => (
          <button key={item.id} className={active === item.id ? 'mobile-active' : ''} onClick={() => setActive(item.id)}>
            <span>{item.icon}</span><small>{item.label === 'Soko la mikeka' ? 'Soko' : item.label === 'Jenga mkeka' ? 'Jenga' : item.label}</small>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
