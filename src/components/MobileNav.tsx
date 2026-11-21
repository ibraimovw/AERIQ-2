import {CalendarRange, Compass, Home, Star} from 'lucide-react';
import type {NavSection} from '../types/weather';
import type {TranslationDictionary} from '../i18n/translations';

interface MobileNavProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  t: TranslationDictionary;
}

export function MobileNav({activeSection, onSelectSection, t}: MobileNavProps) {
  const items: Array<{id: NavSection; label: string; icon: typeof Home}> = [
    {id: 'home', label: t.nav.home, icon: Home},
    {id: 'forecast', label: t.nav.forecast, icon: CalendarRange},
    {id: 'map', label: t.nav.map, icon: Compass},
    {id: 'favorites', label: t.nav.favorites, icon: Star},
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel-elevated border-x-0 border-b-0 border-t border-[var(--line)] rounded-none px-2 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))] flex items-center justify-around"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeSection === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectSection(item.id)}
            className={`relative flex flex-col items-center justify-center min-w-[68px] min-h-[44px] px-2 py-1 rounded-xl transition-colors ${
              active
                ? 'text-[var(--text)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {active && (
              <span
                className="absolute top-0 left-3 right-3 h-[2px] rounded-full"
                style={{background: 'var(--grad)'}}
                aria-hidden="true"
              />
            )}
            <Icon className={`w-[18px] h-[18px] ${active ? 'text-[var(--pink)]' : ''}`} />
            <span className="text-[11px] font-medium mt-0.5 whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
