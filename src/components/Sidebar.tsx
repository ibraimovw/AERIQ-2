import {CalendarRange, Compass, Home, PanelLeftClose, PanelLeftOpen, Star} from 'lucide-react';
import {PWAInstallButton} from './PWAInstallButton';
import type {NavSection} from '../types/weather';
import type {TranslationDictionary} from '../i18n/translations';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  favoritesCount: number;
  t: TranslationDictionary;
}

export function Sidebar({
  activeSection,
  onSelectSection,
  collapsed,
  onToggleCollapse,
  favoritesCount,
  t,
}: SidebarProps) {
  const navItems: Array<{id: NavSection; label: string; icon: typeof Home; count?: number}> = [
    {id: 'home', label: t.nav.home, icon: Home},
    {id: 'forecast', label: t.nav.forecast, icon: CalendarRange},
    {id: 'map', label: t.nav.map, icon: Compass},
    {id: 'favorites', label: t.nav.favorites, icon: Star, count: favoritesCount},
  ];

  return (
    <aside
      className={`hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 select-none glass-panel border-y-0 border-l-0 border-r border-[var(--line)] rounded-none transition-[width] duration-200 ease-out ${
        collapsed ? 'w-[72px] px-2.5 py-4' : 'w-[244px] px-3.5 py-4'
      }`}
    >
      {/* Top Gradient Edge Accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{background: 'var(--grad)', opacity: 0.85}}
        aria-hidden="true"
      />

      {/* Brand Lockup */}
      <div
        className={`flex items-center ${
          collapsed ? 'justify-center' : 'justify-between'
        } gap-2 pb-4 border-b border-[var(--line)]`}
      >
        <button
          type="button"
          onClick={() => onSelectSection('home')}
          className="flex items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-[var(--pink)] rounded-xl"
        >
          <img
            src="/logo.svg"
            alt={t.brandName}
            className="w-9 h-9 rounded-xl shrink-0"
          />
          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="aer-brand-mark text-lg leading-none">AER</span>
                <span className="font-display font-semibold text-sm tracking-wide text-[var(--text)] leading-none">
                  .wave
                </span>
              </div>
              <div className="text-[11px] text-[var(--muted)] mt-1 truncate">{t.slogan}</div>
            </div>
          )}
        </button>

        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={t.nav.collapseSidebar}
            title={t.nav.collapseSidebar}
            className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--glass-subtle-bg)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--pink)]"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={t.nav.expandSidebar}
          title={t.nav.expandSidebar}
          className="mt-3 mx-auto p-2.5 rounded-xl text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--glass-subtle-bg)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--pink)]"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1.5 mt-4" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              title={collapsed ? item.label : undefined}
              className={`group relative flex items-center ${
                collapsed ? 'justify-center px-0' : 'justify-between px-3.5'
              } h-11 rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[var(--pink)] ${
                active
                  ? 'bg-[var(--glass-subtle-bg)] text-[var(--text)] border border-[var(--line-strong)] shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--glass-subtle-bg)] border border-transparent'
              }`}
            >
              {active && (
                <span
                  className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full"
                  style={{background: 'var(--grad)'}}
                  aria-hidden="true"
                />
              )}
              <span className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                    active ? 'text-[var(--pink)]' : 'text-[var(--muted)] group-hover:text-[var(--text)]'
                  }`}
                />
                {!collapsed && <span className="whitespace-nowrap truncate">{item.label}</span>}
              </span>
              {!collapsed && typeof item.count === 'number' && (
                <span className="text-xs font-mono tabular-nums text-[var(--muted)]">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* PWA Install & Quiet Footer Version */}
      <div className="space-y-3 pt-3 border-t border-[var(--line)]">
        <div className={collapsed ? 'flex justify-center' : ''}>
          <PWAInstallButton compact={collapsed} t={t} />
        </div>

        <div
          className={`text-xs text-[var(--muted)] flex items-center ${
            collapsed ? 'justify-center' : 'justify-between px-1'
          }`}
        >
          {!collapsed && (
            <span className="truncate tracking-wider uppercase text-[10px]">{t.brandName}</span>
          )}
          <span className="font-mono tabular-nums text-[var(--pink)] font-semibold">
            {t.version}
          </span>
        </div>
      </div>
    </aside>
  );
}
