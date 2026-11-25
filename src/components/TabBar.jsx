const TABS = [
  { id: 'home', label: 'Home' },
  { id: 'now', label: 'Now' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'ingredients', label: 'Ingredients' },
];

export default function TabBar({ tab, setTab, badge }) {
  return (
    <nav className="tabbar" aria-label="Sections">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`tab ${tab === t.id ? 'active' : ''}`}
          aria-current={tab === t.id ? 'page' : undefined}
          onClick={() => setTab(t.id)}
        >
          {t.label}
          {t.id === 'now' && badge > 0 && <span className="badge">{badge}</span>}
        </button>
      ))}
    </nav>
  );
}
