'use client';

const PAGES = ['marketplace', 'inventory', 'profile', 'vote', 'referrals'];

function ArrowLeftIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>);
}

const TITLES = {
  marketplace: (t) => [t.marketplace, t.marketplaceDesc],
  inventory: (t) => [t.inventory, t.inventoryDesc],
  profile: (t) => [t.profile, t.profileDesc],
  vote: (t) => [t.vote, t.voteDesc],
  referrals: (t) => [t.referrals, t.referralsDesc],
};

export default function DashboardShell({ page, onNavigate, onClose, t, children }) {
  const [title, desc] = TITLES[page](t);

  return (
    <div className="dashboard-overlay" role="dialog" aria-label={title}>
      <header className="dashboard-header">
        <div className="dashboard-title-area">
          <h1>{title}</h1>
          <p>{desc}</p>
        </div>

        <nav className="dashboard-nav" aria-label="Dashboard pages">
          {PAGES.map((p) => (
            <button
              key={p}
              className={`dashboard-nav-btn ${p === page ? 'active' : ''}`}
              onClick={() => onNavigate(p)}
            >
              {TITLES[p](t)[0]}
            </button>
          ))}
        </nav>

        <button className="dashboard-close-btn" onClick={onClose}>
          <ArrowLeftIcon />
          <span>{t.backToMap}</span>
        </button>
      </header>

      <div className="dashboard-body">{children}</div>
    </div>
  );
}
