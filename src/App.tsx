import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AlertTriangle, ArrowUp, RefreshCw, WifiOff} from 'lucide-react';
import {Sidebar} from './components/Sidebar';
import {MobileNav} from './components/MobileNav';
import {TopBar} from './components/TopBar';
import {HomeView} from './components/HomeView';
import {ForecastView} from './components/ForecastView';
import {MapView} from './components/MapView';
import {FavoritesView} from './components/FavoritesView';
import {GlassPanel} from './components/GlassPanel';
import {WeatherAtmosphereCanvas} from './components/WeatherAtmosphereCanvas';
import {useOnlineStatus} from './hooks/useOnlineStatus';
import {TRANSLATIONS} from './i18n/translations';
import {
  DEFAULT_CITIES,
  fetchCityWeather,
  getCachedWeather,
  getLocalizedCityDisplay,
  resolveCityLocalization,
} from './services/weatherApi';
import {fetchCityPanorama} from './services/cityImages';
import {computeDayPhase, getWeatherMood} from './utils/weatherHelpers';
import type {
  CityImageAttribution,
  CityLocation,
  DayPhase,
  ForecastMetricKey,
  Language,
  NavSection,
  TempUnit,
  WeatherData,
  WeatherMood,
} from './types/weather';

const SETTINGS_KEY = 'aerwave_settings_v7';
const FAVORITES_KEY = 'aerwave_favorites_v4';
const MAX_FAVORITES = 10;

interface PersistedSettings {
  lang: Language;
  unit: TempUnit;
  theme: 'dark' | 'light';
  city: CityLocation;
  sidebarCollapsed: boolean;
  forecastMetrics: ForecastMetricKey[];
}

const DEFAULT_METRICS: ForecastMetricKey[] = [
  'temperature',
  'precipProb',
  'windSpeed',
  'humidity',
  'pressure',
];

function loadSettings(): PersistedSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY) ?? localStorage.getItem('aerwave_settings_v4');
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
      return {
        lang: parsed.lang === 'en' ? 'en' : 'ru',
        unit: parsed.unit === 'F' ? 'F' : 'C',
        theme: parsed.theme === 'light' ? 'light' : 'dark',
        city: parsed.city?.latitude ? parsed.city : DEFAULT_CITIES[0],
        sidebarCollapsed: Boolean(parsed.sidebarCollapsed),
        forecastMetrics:
          Array.isArray(parsed.forecastMetrics) && parsed.forecastMetrics.length > 0
            ? parsed.forecastMetrics
            : DEFAULT_METRICS,
      };
    }
  } catch {
    // Fallback to defaults
  }
  return {
    lang: 'ru',
    unit: 'C',
    theme: 'dark',
    city: DEFAULT_CITIES[0],
    sidebarCollapsed: false,
    forecastMetrics: DEFAULT_METRICS,
  };
}

function loadFavorites(): CityLocation[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw) as CityLocation[];
      if (Array.isArray(parsed)) return parsed.slice(0, MAX_FAVORITES);
    }
  } catch {
    // Fallback to starter favorites
  }
  return DEFAULT_CITIES.slice(0, 3);
}

function isSameCity(a: CityLocation, b: CityLocation): boolean {
  if (a.id && b.id && a.id === b.id) return true;
  return (
    Math.abs(a.latitude - b.latitude) < 0.04 &&
    Math.abs(a.longitude - b.longitude) < 0.04
  );
}

export default function App() {
  const initialSettings = useMemo(() => loadSettings(), []);
  const [lang, setLang] = useState<Language>(initialSettings.lang);
  const [unit, setUnit] = useState<TempUnit>(initialSettings.unit);
  const [theme, setTheme] = useState<'dark' | 'light'>(initialSettings.theme);
  const [selectedCity, setSelectedCity] = useState<CityLocation>(initialSettings.city);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    initialSettings.sidebarCollapsed
  );
  const [forecastMetrics, setForecastMetrics] = useState<ForecastMetricKey[]>(
    initialSettings.forecastMetrics
  );
  const [favorites, setFavorites] = useState<CityLocation[]>(() => loadFavorites());
  const [activeSection, setActiveSection] = useState<NavSection>('home');

  const [weather, setWeather] = useState<WeatherData | null>(() =>
    getCachedWeather(initialSettings.city)
  );
  const [cityImage, setCityImage] = useState<CityImageAttribution | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [favoriteNotice, setFavoriteNotice] = useState<string | null>(null);
  const [dayPhaseTick, setDayPhaseTick] = useState<number>(() => Date.now());
  const [showScrollTop, setShowScrollTop] = useState(false);

  const isOnline = useOnlineStatus();
  const weatherAbortRef = useRef<AbortController | null>(null);
  const cursorGlowRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    try {
      const payload: PersistedSettings = {
        lang,
        unit,
        theme,
        city: selectedCity,
        sidebarCollapsed,
        forecastMetrics,
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota errors
    }
  }, [lang, unit, theme, selectedCity, sidebarCollapsed, forecastMetrics]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      // Ignore quota errors
    }
  }, [favorites]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    document.body.classList.toggle('light-theme', theme === 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const id = window.setInterval(() => setDayPhaseTick(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !cursorGlowRef.current) return;
      cursorGlowRef.current.style.left = `${e.clientX}px`;
      cursorGlowRef.current.style.top = `${e.clientY}px`;
    };
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('pointermove', onPointerMove, {passive: true});
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Automatically resolve localized RU/EN city names when language or city changes
  useEffect(() => {
    const controller = new AbortController();

    if (!selectedCity.localized?.[lang]) {
      void resolveCityLocalization(selectedCity, lang, controller.signal)
        .then((updated) => {
          if (!controller.signal.aborted && updated.localized?.[lang]) {
            setSelectedCity((prev) =>
              isSameCity(prev, updated)
                ? {...prev, localized: {...prev.localized, ...updated.localized}}
                : prev
            );
            setWeather((prev) =>
              prev && isSameCity(prev.city, updated)
                ? {
                    ...prev,
                    city: {
                      ...prev.city,
                      localized: {...prev.city.localized, ...updated.localized},
                    },
                  }
                : prev
            );
          }
        })
        .catch(() => {});
    }

    const unlocalizedFavs = favorites.filter((f) => !f.localized?.[lang]);
    if (unlocalizedFavs.length > 0) {
      void Promise.allSettled(
        unlocalizedFavs.map((fav) => resolveCityLocalization(fav, lang, controller.signal))
      ).then((results) => {
        if (controller.signal.aborted) return;
        const resolvedMap = new Map<string, CityLocation>();
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value.localized?.[lang]) {
            resolvedMap.set(r.value.id, r.value);
          }
        }
        if (resolvedMap.size > 0) {
          setFavorites((prev) =>
            prev.map((item) => {
              const matched = resolvedMap.get(item.id);
              return matched
                ? {...item, localized: {...item.localized, ...matched.localized}}
                : item;
            })
          );
        }
      });
    }

    return () => controller.abort();
  }, [lang, selectedCity, favorites]);

  const dayPhase: DayPhase = useMemo(() => {
    const tz = weather?.timezone ?? selectedCity.timezone ?? 'UTC';
    const today = weather?.daily[0];
    return computeDayPhase(tz, today?.sunrise, today?.sunset, dayPhaseTick);
  }, [weather, selectedCity.timezone, dayPhaseTick]);

  const weatherMood: WeatherMood = useMemo(() => {
    if (!weather) return 'clear';
    return getWeatherMood(weather.current.weatherCode);
  }, [weather]);

  useEffect(() => {
    document.body.setAttribute('data-dayphase', dayPhase);
    document.body.setAttribute('data-weather', weatherMood);
  }, [dayPhase, weatherMood]);

  const loadCityData = useCallback((city: CityLocation) => {
    weatherAbortRef.current?.abort();
    const controller = new AbortController();
    weatherAbortRef.current = controller;

    const cached = getCachedWeather(city);
    if (cached) {
      setWeather(cached);
    }
    setIsLoading(true);
    setLoadError(false);

    void Promise.allSettled([
      fetchCityWeather(city, controller.signal),
      fetchCityPanorama(city, controller.signal),
    ]).then(([weatherResult, imageResult]) => {
      if (controller.signal.aborted) return;

      if (weatherResult.status === 'fulfilled') {
        setWeather(weatherResult.value);
        setLoadError(false);
      } else {
        const fallback = getCachedWeather(city);
        if (fallback) {
          setWeather(fallback);
          setLoadError(false);
        } else {
          setWeather(null);
          setLoadError(true);
        }
      }

      if (imageResult.status === 'fulfilled') {
        setCityImage(imageResult.value);
      } else {
        setCityImage(null);
      }

      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    loadCityData(selectedCity);
    return () => weatherAbortRef.current?.abort();
  }, [selectedCity.id, selectedCity.latitude, selectedCity.longitude, loadCityData]);

  const isCurrentFavorite = useMemo(
    () => favorites.some((fav) => isSameCity(fav, selectedCity)),
    [favorites, selectedCity]
  );

  const handleToggleFavorite = () => {
    if (isCurrentFavorite) {
      setFavorites((prev) => prev.filter((fav) => !isSameCity(fav, selectedCity)));
      setFavoriteNotice(null);
      return;
    }
    if (favorites.length >= MAX_FAVORITES) {
      setFavoriteNotice(t.topbar.favoriteLimitReached);
      window.setTimeout(() => setFavoriteNotice(null), 3000);
      return;
    }
    setFavorites((prev) => [selectedCity, ...prev]);
    setFavoriteNotice(null);
  };

  const handleAddFavorite = (city: CityLocation) => {
    if (favorites.some((fav) => isSameCity(fav, city))) return;
    if (favorites.length >= MAX_FAVORITES) {
      setFavoriteNotice(t.topbar.favoriteLimitReached);
      window.setTimeout(() => setFavoriteNotice(null), 3000);
      return;
    }
    setFavorites((prev) => [city, ...prev]);
  };

  const handleRemoveFavorite = (city: CityLocation) => {
    setFavorites((prev) => prev.filter((fav) => !isSameCity(fav, city)));
  };

  const handleReorderFavorite = (index: number, direction: -1 | 1) => {
    setFavorites((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(target, 0, moved);
      return copy;
    });
  };

  const handleToggleForecastMetric = (metric: ForecastMetricKey) => {
    setForecastMetrics((prev) => {
      if (prev.includes(metric)) {
        if (prev.length <= 1) return prev;
        return prev.filter((m) => m !== metric);
      }
      return [...prev, metric];
    });
  };

  // Ensure MapView receives localized city name
  const localizedSelectedCity = useMemo(() => {
    const disp = getLocalizedCityDisplay(selectedCity, lang);
    return {
      ...selectedCity,
      name: disp.name,
      country: disp.country,
      admin1: disp.admin1,
    };
  }, [selectedCity, lang]);

  return (
    <div className="relative min-h-screen text-[var(--text)]">
      {/* Combined Time-of-Day + Weather Atmospheric Canvas & Live Particle Layer */}
      <div className="aer-atmosphere" aria-hidden="true" />
      <WeatherAtmosphereCanvas
        mood={weatherMood}
        dayPhase={dayPhase}
        windSpeed={weather?.current.windSpeed ?? 6}
        theme={theme}
      />
      <div ref={cursorGlowRef} className="aer-cursor-glow" aria-hidden="true" />

      {/* Fixed Flush-Left Desktop & Tablet Navigation */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        favoritesCount={favorites.length}
        t={t}
      />

      {/* Main Content Offset to match Fixed Left Sidebar */}
      <div
        className={`relative z-10 transition-[padding] duration-200 ease-out ${
          sidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-[244px]'
        }`}
      >
        <div className="max-w-[1360px] mx-auto px-3 sm:px-5 lg:px-7 pt-3 sm:pt-4 pb-24 md:pb-10 space-y-4 sm:space-y-5">
          <TopBar
            currentCity={selectedCity}
            isFavorite={isCurrentFavorite}
            onToggleFavorite={handleToggleFavorite}
            favoriteNotice={favoriteNotice}
            onSelectCity={(city) => {
              setSelectedCity(city);
              if (activeSection === 'favorites') {
                setActiveSection('home');
              }
            }}
            lang={lang}
            onChangeLang={setLang}
            unit={unit}
            onChangeUnit={setUnit}
            theme={theme}
            onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            dayPhase={dayPhase}
            weatherMood={weatherMood}
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            t={t}
          />

          {/* Offline Connectivity Indicator */}
          {!isOnline && (
            <GlassPanel className="px-4 py-2.5 flex items-center gap-2.5 border-[var(--pink)]/50 text-xs text-[var(--text)]">
              <WifiOff className="w-4 h-4 text-[var(--pink)] shrink-0" />
              <span>{t.pwa.offlineBadge}</span>
            </GlassPanel>
          )}

          {/* Offline / Cached Fallback Banner */}
          {weather?.isCached && (
            <GlassPanel className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-[var(--pink)]/40">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-[var(--text)]">
                <WifiOff className="w-4 h-4 text-[var(--pink)] shrink-0" />
                <div>
                  <span className="font-semibold">{t.cacheBanner.offlineTitle}.</span>{' '}
                  <span className="text-[var(--muted)]">
                    {t.cacheBanner.offlineDesc}{' '}
                    {weather.cachedAt
                      ? new Date(weather.cachedAt).toLocaleString(
                          lang === 'ru' ? 'ru-RU' : 'en-US',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short',
                          }
                        )
                      : ''}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => loadCityData(selectedCity)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--glass-subtle-bg)] border border-[var(--line)] text-xs font-medium text-[var(--text)] transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{t.cacheBanner.retry}</span>
              </button>
            </GlassPanel>
          )}

          {/* Main Section Viewport */}
          <main className="min-w-0">
            {loadError && !weather ? (
              <GlassPanel className="p-8 text-center space-y-4">
                <AlertTriangle className="w-8 h-8 text-[var(--pink)] mx-auto" />
                <h2 className="font-display font-bold text-xl text-[var(--text)]">
                  {t.errors.loadFailedTitle}
                </h2>
                <p className="text-sm text-[var(--muted)] max-w-md mx-auto">
                  {t.errors.loadFailedDesc}
                </p>
                <button
                  type="button"
                  onClick={() => loadCityData(selectedCity)}
                  className="aer-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t.errors.retry}</span>
                </button>
              </GlassPanel>
            ) : !weather && isLoading ? (
              <div className="space-y-5">
                <GlassPanel className="h-[320px] p-8 animate-pulse flex flex-col justify-between">
                  <div className="h-8 w-52 bg-[var(--line)] rounded-xl" />
                  <div className="h-16 w-64 bg-[var(--line)] rounded-xl" />
                </GlassPanel>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <GlassPanel key={i} className="h-28 p-4 animate-pulse" />
                  ))}
                </div>
              </div>
            ) : (
              weather && (
                <>
                  {activeSection === 'home' && (
                    <HomeView
                      weather={weather}
                      cityImage={cityImage}
                      dayPhase={dayPhase}
                      unit={unit}
                      lang={lang}
                      t={t}
                      onNavigate={setActiveSection}
                    />
                  )}

                  {activeSection === 'forecast' && (
                    <ForecastView
                      weather={weather}
                      unit={unit}
                      lang={lang}
                      t={t}
                      selectedMetrics={forecastMetrics}
                      onToggleMetric={handleToggleForecastMetric}
                    />
                  )}

                  {activeSection === 'map' && (
                    <MapView city={localizedSelectedCity} unit={unit} t={t} />
                  )}

                  {activeSection === 'favorites' && (
                    <FavoritesView
                      favorites={favorites}
                      currentCity={selectedCity}
                      unit={unit}
                      lang={lang}
                      t={t}
                      onOpenCity={(city) => {
                        setSelectedCity(city);
                        setActiveSection('home');
                      }}
                      onOpenOnMap={(city) => {
                        setSelectedCity(city);
                        setActiveSection('map');
                      }}
                      onRemoveFavorite={handleRemoveFavorite}
                      onAddFavorite={handleAddFavorite}
                      onReorderFavorite={handleReorderFavorite}
                    />
                  )}
                </>
              )
            )}
          </main>
        </div>
      </div>

      {/* Scroll-to-Top Floating Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
          aria-label="Scroll to top"
          className="hidden md:grid place-items-center fixed right-6 bottom-6 z-40 w-12 h-12 rounded-full bg-[var(--surface2)] border border-[var(--line)] text-[var(--text)] shadow-lg hover:border-[var(--pink)] transition-all"
        >
          <ArrowUp className="w-5 h-5 text-[var(--pink)]" />
        </button>
      )}

      {/* Mobile Flush Bottom Dock */}
      <MobileNav
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        t={t}
      />
    </div>
  );
}
