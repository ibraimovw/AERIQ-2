import {useEffect, useState} from 'react';
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  ArrowUpRight,
  Check,
  Compass,
  Plus,
  Trash2,
} from 'lucide-react';
import {GlassPanel} from './GlassPanel';
import {WeatherIcon} from './WeatherIcon';
import {
  DEFAULT_CITIES,
  fetchCityWeather,
  getCachedWeather,
  getLocalizedCityDisplay,
} from '../services/weatherApi';
import {
  computeDayPhase,
  formatTemp,
  getCityLocalClock,
} from '../utils/weatherHelpers';
import type {
  CityLocation,
  DayPhase,
  FavoriteCityWeatherSummary,
  Language,
  TempUnit,
  WeatherData,
} from '../types/weather';
import type {TranslationDictionary} from '../i18n/translations';

interface FavoritesViewProps {
  favorites: CityLocation[];
  currentCity: CityLocation;
  unit: TempUnit;
  lang: Language;
  t: TranslationDictionary;
  onOpenCity: (city: CityLocation) => void;
  onOpenOnMap: (city: CityLocation) => void;
  onRemoveFavorite: (city: CityLocation) => void;
  onAddFavorite: (city: CityLocation) => void;
  onReorderFavorite: (index: number, direction: -1 | 1) => void;
}

function getPhaseCardTint(phase: DayPhase): string {
  switch (phase) {
    case 'dawn':
      return 'linear-gradient(135deg, rgba(255,45,104,0.14), rgba(184,61,255,0.08))';
    case 'day':
      return 'linear-gradient(135deg, rgba(62,140,255,0.14), rgba(99,91,255,0.06))';
    case 'dusk':
      return 'linear-gradient(135deg, rgba(255,45,104,0.16), rgba(99,91,255,0.10))';
    case 'night':
      return 'linear-gradient(135deg, rgba(99,91,255,0.10), rgba(5,5,7,0.08))';
  }
}

export function FavoritesView({
  favorites,
  currentCity,
  unit,
  lang,
  t,
  onOpenCity,
  onOpenOnMap,
  onRemoveFavorite,
  onAddFavorite,
  onReorderFavorite,
}: FavoritesViewProps) {
  const [summaries, setSummaries] = useState<Record<string, FavoriteCityWeatherSummary>>({});
  const [fullWeatherMap, setFullWeatherMap] = useState<Record<string, WeatherData>>({});
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    if (favorites.length === 0) return;

    const controller = new AbortController();

    const initial: Record<string, FavoriteCityWeatherSummary> = {};
    const initialFull: Record<string, WeatherData> = {};
    for (const city of favorites) {
      const cached = getCachedWeather(city);
      if (cached) {
        initialFull[city.id] = cached;
        initial[city.id] = {
          city,
          temperature: cached.current.temperature,
          weatherCode: cached.current.weatherCode,
          tempMin: cached.daily[0]?.tempMin ?? cached.current.temperature,
          tempMax: cached.daily[0]?.tempMax ?? cached.current.temperature,
          isDay: cached.current.isDay,
          timezone: cached.timezone,
          sunrise: cached.daily[0]?.sunrise,
          sunset: cached.daily[0]?.sunset,
          updatedAt: cached.fetchedAt,
        };
      }
    }
    setSummaries((prev) => ({...prev, ...initial}));
    setFullWeatherMap((prev) => ({...prev, ...initialFull}));

    void Promise.allSettled(
      favorites.map(async (city) => {
        const data = await fetchCityWeather(city, controller.signal);
        if (!controller.signal.aborted) {
          setFullWeatherMap((prev) => ({...prev, [city.id]: data}));
          setSummaries((prev) => ({
            ...prev,
            [city.id]: {
              city,
              temperature: data.current.temperature,
              weatherCode: data.current.weatherCode,
              tempMin: data.daily[0]?.tempMin ?? data.current.temperature,
              tempMax: data.daily[0]?.tempMax ?? data.current.temperature,
              isDay: data.current.isDay,
              timezone: data.timezone,
              sunrise: data.daily[0]?.sunrise,
              sunset: data.daily[0]?.sunset,
              updatedAt: data.fetchedAt,
            },
          }));
        }
      })
    );

    return () => controller.abort();
  }, [favorites]);

  const toggleCompareCity = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const comparePair = compareIds
    .map((id) => ({
      city: favorites.find((c) => c.id === id),
      weather: fullWeatherMap[id],
    }))
    .filter((entry): entry is {city: CityLocation; weather: WeatherData} =>
      Boolean(entry.city && entry.weather)
    );

  return (
    <div className="space-y-5">
      <GlassPanel as="section" className="aer-top-accent p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 text-[11px] font-display tracking-[0.18em] uppercase text-[var(--muted)] mb-2">
            <span className="aer-eyebrow-line" aria-hidden="true" />
            <span>{t.brandName}</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[var(--text)]">
            {t.favorites.title}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">{t.favorites.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {favorites.length >= 2 && (
            <button
              type="button"
              onClick={() => {
                setCompareMode((m) => !m);
                if (compareMode) setCompareIds([]);
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                compareMode
                  ? 'aer-btn-primary border-transparent'
                  : 'bg-[var(--glass-subtle-bg)] border-[var(--line)] text-[var(--text)] hover:border-[var(--pink)]'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>{t.favorites.compareToggle}</span>
            </button>
          )}

          <div className="font-mono tabular-nums text-sm font-semibold text-[var(--text)] bg-[var(--glass-subtle-bg)] border border-[var(--line)] rounded-xl px-4 py-2">
            <span className="text-[var(--pink)]">{favorites.length}</span> {t.favorites.counterSuffix}
          </div>
        </div>
      </GlassPanel>

      {/* Side-by-side 2-City Comparison Panel */}
      {compareMode && (
        <GlassPanel as="section" className="p-5 sm:p-6 space-y-4 border-[var(--pink)]/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-[var(--text)]">
              {comparePair.length === 2 ? t.favorites.compareTitle : t.favorites.compareSelectHint}
            </div>
            {compareIds.length > 0 && (
              <button
                type="button"
                onClick={() => setCompareIds([])}
                className="text-xs text-[var(--pink)] hover:underline"
              >
                {t.favorites.clearCompare}
              </button>
            )}
          </div>

          {comparePair.length === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {comparePair.map(({city, weather}) => {
                const disp = getLocalizedCityDisplay(city, lang);
                const clock = getCityLocalClock(weather.timezone);
                return (
                  <div key={city.id} className="glass-subtle rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-display font-bold text-lg text-[var(--text)]">
                          {disp.name}
                        </div>
                        <div className="text-xs text-[var(--muted)]">
                          {disp.country} · {clock.formattedTime}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <WeatherIcon
                          code={weather.current.weatherCode}
                          isDay={weather.current.isDay}
                          className="w-7 h-7"
                        />
                        <span className="font-display font-bold text-2xl aer-grad-text tabular-nums">
                          {formatTemp(weather.current.temperature, unit)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums pt-2 border-t border-[var(--line)]">
                      <div>
                        <span className="text-[var(--muted)]">{t.home.high}/{t.home.low}: </span>
                        <span className="text-[var(--text)]">
                          {formatTemp(weather.daily[0]?.tempMax ?? weather.current.temperature, unit)} /{' '}
                          {formatTemp(weather.daily[0]?.tempMin ?? weather.current.temperature, unit)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--muted)]">{t.home.metrics.wind}: </span>
                        <span className="text-[var(--text)]">
                          {Math.round(weather.current.windSpeed)} {t.home.units.kmh}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--muted)]">{t.home.metrics.humidity}: </span>
                        <span className="text-[var(--text)]">{Math.round(weather.current.humidity)}%</span>
                      </div>
                      <div>
                        <span className="text-[var(--muted)]">{t.home.metrics.pressure}: </span>
                        <span className="text-[var(--text)]">
                          {Math.round(weather.current.pressure)} {t.home.units.hpa}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassPanel>
      )}

      {favorites.length === 0 ? (
        <GlassPanel as="section" className="p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="font-display font-semibold text-lg text-[var(--text)]">
              {t.favorites.emptyTitle}
            </h2>
            <p className="text-sm text-[var(--muted)] mt-1.5 max-w-xl leading-relaxed">
              {t.favorites.emptyDesc}
            </p>
          </div>

          <div>
            <div className="text-xs font-medium text-[var(--muted)] mb-3">
              {t.favorites.quickAddTitle}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {DEFAULT_CITIES.map((city) => {
                const disp = getLocalizedCityDisplay(city, lang);
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => onAddFavorite(city)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--glass-subtle-bg)] hover:border-[var(--pink)] border border-[var(--line)] text-xs font-medium text-[var(--text)] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-[var(--pink)]" />
                    <span>{disp.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </GlassPanel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {favorites.map((city, idx) => {
            const summary = summaries[city.id];
            const disp = getLocalizedCityDisplay(city, lang);
            const isCurrent =
              city.id === currentCity.id ||
              (Math.abs(city.latitude - currentCity.latitude) < 0.05 &&
                Math.abs(city.longitude - currentCity.longitude) < 0.05);
            const isCompared = compareIds.includes(city.id);

            const cityPhase: DayPhase = summary
              ? computeDayPhase(summary.timezone, summary.sunrise, summary.sunset)
              : 'night';
            const cityClock = summary ? getCityLocalClock(summary.timezone) : null;

            return (
              <GlassPanel
                key={`${city.id}-${city.latitude}`}
                as="article"
                spotlight
                style={{backgroundImage: getPhaseCardTint(cityPhase)}}
                className={`aer-top-accent p-5 flex flex-col justify-between gap-4 ${
                  isCompared
                    ? 'border-[var(--pink)] ring-1 ring-[var(--pink)]/50'
                    : isCurrent
                      ? 'border-[var(--pink)]/50'
                      : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums text-[var(--muted)] mb-1">
                      {cityClock && <span>{cityClock.formattedTime}</span>}
                      <span>·</span>
                      <span>{t.dayPhases[cityPhase]}</span>
                    </div>
                    <h2 className="font-display font-bold text-xl text-[var(--text)] truncate">
                      {disp.name}
                    </h2>
                    <div className="text-xs text-[var(--muted)] mt-0.5 truncate">
                      {[disp.admin1, disp.country].filter(Boolean).join(' · ')}
                    </div>
                  </div>

                  {summary ? (
                    <div className="flex items-center gap-3 shrink-0">
                      <WeatherIcon
                        code={summary.weatherCode}
                        isDay={summary.isDay}
                        className="w-7 h-7"
                      />
                      <div className="text-right">
                        <div className="font-display font-bold text-2xl aer-grad-text tabular-nums leading-none">
                          {formatTemp(summary.temperature, unit)}
                        </div>
                        <div className="text-xs font-mono tabular-nums text-[var(--muted)] mt-1">
                          {formatTemp(summary.tempMax, unit)} / {formatTemp(summary.tempMin, unit)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--muted)]">{t.favorites.loadingWeather}</span>
                  )}
                </div>

                {summary && (
                  <div className="text-xs text-[var(--text-secondary)]">
                    {t.wmo[summary.weatherCode] ?? t.wmo[3]}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--line)]">
                  <div className="flex items-center gap-1.5">
                    {compareMode ? (
                      <button
                        type="button"
                        onClick={() => toggleCompareCity(city.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                          isCompared
                            ? 'aer-btn-primary border-transparent'
                            : 'bg-[var(--glass-subtle-bg)] border-[var(--line)] text-[var(--text)]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.favorites.compareToggle}</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenCity(city)}
                          className="aer-btn-primary inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap"
                        >
                          <span>{t.favorites.openCity}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenOnMap(city)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--glass-subtle-bg)] hover:border-[var(--pink)] border border-[var(--line)] text-xs font-medium text-[var(--text)] transition-colors whitespace-nowrap"
                        >
                          <Compass className="w-3.5 h-3.5 text-[var(--pink)]" />
                          <span>{t.favorites.showOnMap}</span>
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => onReorderFavorite(idx, -1)}
                      aria-label={t.favorites.moveUp}
                      title={t.favorites.moveUp}
                      className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-30 transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === favorites.length - 1}
                      onClick={() => onReorderFavorite(idx, 1)}
                      aria-label={t.favorites.moveDown}
                      title={t.favorites.moveDown}
                      className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-30 transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveFavorite(city)}
                      aria-label={t.favorites.removeCity}
                      title={t.favorites.removeCity}
                      className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--pink)] hover:bg-[var(--pink)]/12 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
