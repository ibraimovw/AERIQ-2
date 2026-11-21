import React, {useEffect, useRef, useState} from 'react';
import {Loader2, Menu, Moon, Search, Star, Sun, X} from 'lucide-react';
import {getLocalizedCityDisplay, searchCities} from '../services/weatherApi';
import {PWAInstallButton} from './PWAInstallButton';
import type {CityLocation, DayPhase, Language, NavSection, TempUnit, WeatherMood} from '../types/weather';
import type {TranslationDictionary} from '../i18n/translations';

interface TopBarProps {
  currentCity: CityLocation;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  favoriteNotice: string | null;
  onSelectCity: (city: CityLocation) => void;
  lang: Language;
  onChangeLang: (lang: Language) => void;
  unit: TempUnit;
  onChangeUnit: (unit: TempUnit) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  dayPhase: DayPhase;
  weatherMood: WeatherMood;
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  t: TranslationDictionary;
}

export function TopBar({
  currentCity,
  isFavorite,
  onToggleFavorite,
  favoriteNotice,
  onSelectCity,
  lang,
  onChangeLang,
  unit,
  onChangeUnit,
  theme,
  onToggleTheme,
  dayPhase,
  weatherMood,
  activeSection,
  onSelectSection,
  t,
}: TopBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityLocation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cityDisplay = getLocalizedCityDisplay(currentCity, lang);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      abortRef.current?.abort();
      setResults([]);
      setIsSearching(false);
      setSearchError(false);
      setHighlightIndex(-1);
      return;
    }

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsSearching(true);
      setSearchError(false);
      setIsOpen(true);

      try {
        const cities = await searchCities(trimmed, lang, controller.signal);
        if (!controller.signal.aborted) {
          setResults(cities);
          setHighlightIndex(cities.length > 0 ? 0 : -1);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setSearchError(true);
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 260);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, lang]);

  const handleChoose = (city: CityLocation) => {
    onSelectCity(city);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && highlightIndex >= 0 && results[highlightIndex]) {
      e.preventDefault();
      handleChoose(results[highlightIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <>
      <header className="glass-panel rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2.5 sm:gap-3 relative z-30">
        {/* Mobile Brand Mark + Search */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0" ref={containerRef}>
          <img
            src="/logo.svg"
            alt={t.brandName}
            className="md:hidden w-8 h-8 rounded-lg shrink-0"
          />

          <div className="relative flex-1 max-w-md min-w-0">
            <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (query.trim().length >= 2) setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder={t.topbar.searchPlaceholder}
              aria-label={t.topbar.searchPlaceholder}
              className="w-full h-10 pl-10 pr-9 rounded-xl bg-[var(--glass-subtle-bg)] border border-[var(--line)] text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--pink)] transition-colors"
            />
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-[var(--pink)] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            ) : (
              query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                    setIsOpen(false);
                  }}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--text)] rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )
            )}

            {/* Search Autocomplete Dropdown */}
            {isOpen && query.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] glass-panel-elevated rounded-2xl p-1.5 z-50 max-h-80 overflow-y-auto aer-scroll">
                {isSearching && results.length === 0 && (
                  <div className="px-3 py-3 text-xs text-[var(--text-secondary)] flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--pink)]" />
                    <span>{t.topbar.searching}</span>
                  </div>
                )}

                {!isSearching && searchError && (
                  <div className="px-3 py-3 text-xs text-[var(--pink)]">{t.topbar.searchError}</div>
                )}

                {!isSearching && !searchError && results.length === 0 && (
                  <div className="px-3 py-3 text-xs text-[var(--muted)]">{t.topbar.noResults}</div>
                )}

                {results.map((city, idx) => (
                  <button
                    key={`${city.id}-${city.latitude}-${city.longitude}`}
                    type="button"
                    onClick={() => handleChoose(city)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                      idx === highlightIndex
                        ? 'bg-[var(--glass-subtle-bg)] text-[var(--text)] border border-[var(--line)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--glass-subtle-bg)] border border-transparent'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text)] truncate">
                        {city.name}
                      </div>
                      <div className="text-xs text-[var(--muted)] truncate">
                        {[city.admin1, city.country].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums text-[var(--muted)] shrink-0">
                      {city.latitude.toFixed(1)}°, {city.longitude.toFixed(1)}°
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop & Tablet Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden xl:inline-block text-xs text-[var(--muted)] px-2 whitespace-nowrap">
            {cityDisplay.name} · {t.dayPhases[dayPhase]} · {t.weatherMoods[weatherMood]}
          </span>

          <button
            type="button"
            onClick={onToggleFavorite}
            title={isFavorite ? t.topbar.removeFavorite : t.topbar.addFavorite}
            aria-label={isFavorite ? t.topbar.removeFavorite : t.topbar.addFavorite}
            className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-colors focus-visible:outline-2 focus-visible:outline-[var(--pink)] ${
              isFavorite
                ? 'bg-[var(--pink)]/16 border-[var(--pink)]/50 text-[var(--pink)]'
                : 'bg-[var(--glass-subtle-bg)] border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'dark' ? t.topbar.themeLight : t.topbar.themeDark}
            aria-label={theme === 'dark' ? t.topbar.themeLight : t.topbar.themeDark}
            className="hidden sm:flex h-10 w-10 rounded-full items-center justify-center bg-[var(--surface2)] border border-[var(--line)] text-[var(--text)] hover:border-[var(--line-strong)] hover:-rotate-12 transition-all focus-visible:outline-2 focus-visible:outline-[var(--pink)]"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[var(--pink)]" />
            ) : (
              <Moon className="w-4 h-4 text-[var(--pink)]" />
            )}
          </button>

          {/* LANG switcher */}
          <div
            className="hidden sm:flex items-center gap-1 bg-[var(--glass-subtle-bg)] border border-[var(--line)] rounded-xl p-1 h-10"
            role="group"
            aria-label={t.topbar.langLabel}
          >
            <span className="hidden lg:inline text-[10px] font-mono text-[var(--muted)] px-1.5">
              {t.topbar.langLabel}
            </span>
            {(['ru', 'en'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onChangeLang(code)}
                className={`h-8 px-2.5 rounded-lg text-xs font-medium uppercase transition-colors whitespace-nowrap ${
                  lang === code
                    ? 'bg-[var(--surface2)] text-[var(--text)] border border-[var(--line)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)] border border-transparent'
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          {/* UNIT switcher */}
          <div
            className="hidden sm:flex items-center gap-1 bg-[var(--glass-subtle-bg)] border border-[var(--line)] rounded-xl p-1 h-10"
            role="group"
            aria-label={t.topbar.unitLabel}
          >
            <span className="hidden lg:inline text-[10px] font-mono text-[var(--muted)] px-1.5">
              {t.topbar.unitLabel}
            </span>
            {(['C', 'F'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => onChangeUnit(u)}
                className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  unit === u
                    ? 'bg-[var(--surface2)] text-[var(--text)] border border-[var(--line)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)] border border-transparent'
                }`}
              >
                °{u}
              </button>
            ))}
          </div>

          {/* Mobile Drawer Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label={t.nav.menu}
            className="sm:hidden h-10 w-10 rounded-xl flex items-center justify-center bg-[var(--glass-subtle-bg)] border border-[var(--line)] text-[var(--text)]"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {favoriteNotice && (
          <div className="w-full sm:w-auto sm:absolute sm:right-3 sm:top-[calc(100%+8px)] glass-panel-elevated rounded-xl px-3 py-2 text-xs text-[var(--pink)] z-40">
            {favoriteNotice}
          </div>
        )}
      </header>

      {/* Fullscreen Glass Mobile Menu Drawer (inspired by reference .mobile-menu) */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-[80] glass-panel-elevated p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
              <div className="flex items-center gap-2.5">
                <img src="/logo.svg" alt={t.brandName} className="w-8 h-8 rounded-lg" />
                <span className="aer-brand-mark text-lg">AER</span>
                <span className="font-display font-semibold text-sm text-[var(--text)]">
                  .wave {t.version}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label={t.pwa.close}
                className="w-10 h-10 rounded-xl bg-[var(--glass-subtle-bg)] border border-[var(--line)] flex items-center justify-center text-[var(--text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="mt-6 flex flex-col gap-2">
              {(['home', 'forecast', 'map', 'favorites'] as const).map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    onSelectSection(sec);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-4 py-3.5 rounded-2xl font-display text-xl font-semibold transition-colors ${
                    activeSection === sec
                      ? 'bg-[var(--glass-subtle-bg)] border border-[var(--line-strong)] aer-grad-text'
                      : 'text-[var(--text)] hover:bg-[var(--glass-subtle-bg)]'
                  }`}
                >
                  {t.nav[sec]}
                </button>
              ))}
            </nav>
          </div>

          <div className="space-y-4 pt-4 border-t border-[var(--line)]">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onToggleTheme}
                className="flex-1 h-11 rounded-xl bg-[var(--glass-subtle-bg)] border border-[var(--line)] flex items-center justify-center gap-2 text-xs font-medium text-[var(--text)]"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-[var(--pink)]" />
                    <span>{t.topbar.themeLight}</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-[var(--pink)]" />
                    <span>{t.topbar.themeDark}</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1 bg-[var(--glass-subtle-bg)] border border-[var(--line)] rounded-xl p-1 h-11">
                {(['ru', 'en'] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onChangeLang(code)}
                    className={`h-9 px-3 rounded-lg text-xs font-medium uppercase ${
                      lang === code ? 'bg-[var(--surface2)] text-[var(--text)]' : 'text-[var(--muted)]'
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-[var(--glass-subtle-bg)] border border-[var(--line)] rounded-xl p-1 h-11">
                {(['C', 'F'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => onChangeUnit(u)}
                    className={`h-9 px-3 rounded-lg text-xs font-medium ${
                      unit === u ? 'bg-[var(--surface2)] text-[var(--text)]' : 'text-[var(--muted)]'
                    }`}
                  >
                    °{u}
                  </button>
                ))}
              </div>
            </div>

            <PWAInstallButton t={t} />
          </div>
        </div>
      )}
    </>
  );
}
