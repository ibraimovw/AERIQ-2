import {useEffect, useMemo, useState} from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Compass,
  Droplets,
  Eye,
  Gauge,
  MapPin,
  Minus,
  MoonStar,
  Sparkles,
  SunMedium,
  Thermometer,
  Wind,
} from 'lucide-react';
import {GlassPanel} from './GlassPanel';
import {Sparkline} from './Sparkline';
import {WeatherIcon} from './WeatherIcon';
import {getLocalizedCityDisplay} from '../services/weatherApi';
import {
  computeMoonPhase,
  computePressureTrend,
  computeSunProgress,
  convertTempExact,
  formatDateLabel,
  formatIsoTime,
  formatTemp,
  generateHeroDailySummary,
  generateWeatherAlerts,
  generateWeatherInsights,
  getCityLocalClock,
  getNext24Hours,
  getUvCategory,
  getWindDirectionLabel,
} from '../utils/weatherHelpers';
import type {
  CityImageAttribution,
  DayPhase,
  HomePreset,
  Language,
  NavSection,
  TempUnit,
  WeatherData,
} from '../types/weather';
import type {TranslationDictionary} from '../i18n/translations';

interface HomeViewProps {
  weather: WeatherData;
  cityImage: CityImageAttribution | null;
  dayPhase: DayPhase;
  unit: TempUnit;
  lang: Language;
  t: TranslationDictionary;
  onNavigate: (section: NavSection) => void;
}

const PRESETS: HomePreset[] = ['now', 'today', 'tomorrow', 'weekend'];

function getAqiCategory(
  aqi: number,
  levels: TranslationDictionary['home']['aqi']['levels']
): {label: string; colorClass: string} {
  if (aqi <= 20) return {label: levels.good, colorClass: 'text-emerald-400'};
  if (aqi <= 40) return {label: levels.fair, colorClass: 'text-[#3e8cff]'};
  if (aqi <= 60) return {label: levels.moderate, colorClass: 'text-amber-400'};
  if (aqi <= 80) return {label: levels.poor, colorClass: 'text-orange-400'};
  return {label: levels.veryPoor, colorClass: 'text-[var(--pink)]'};
}

export function HomeView({
  weather,
  cityImage,
  dayPhase,
  unit,
  lang,
  t,
  onNavigate,
}: HomeViewProps) {
  const [imageError, setImageError] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [parallaxOffset, setParallaxOffset] = useState({x: 0, y: 0});
  const [activePreset, setActivePreset] = useState<HomePreset>('now');

  useEffect(() => {
    setImageError(false);
  }, [cityImage?.url]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const cityDisplay = useMemo(
    () => getLocalizedCityDisplay(weather.city, lang),
    [weather.city, lang]
  );

  const localClock = useMemo(
    () => getCityLocalClock(weather.timezone, nowMs),
    [weather.timezone, nowMs]
  );

  const today = weather.daily[0];
  const tomorrow = weather.daily[1];
  const weekendDays = useMemo(() => {
    return weather.daily
      .filter((d) => {
        const [y, m, day] = d.date.split('-').map(Number);
        const dow = new Date(Date.UTC(y, (m ?? 1) - 1, day ?? 1, 12)).getUTCDay();
        return dow === 0 || dow === 6;
      })
      .slice(0, 2);
  }, [weather.daily]);

  const next24 = useMemo(() => getNext24Hours(weather), [weather]);
  const daily8 = useMemo(() => weather.daily.slice(0, 8), [weather.daily]);
  const insights = useMemo(
    () => generateWeatherInsights(weather, unit, lang),
    [weather, unit, lang]
  );
  const alerts = useMemo(() => generateWeatherAlerts(weather, lang), [weather, lang]);
  const heroSummary = useMemo(
    () => generateHeroDailySummary(weather, unit, lang, t.wmo),
    [weather, unit, lang, t.wmo]
  );

  const pressureTrend = useMemo(() => computePressureTrend(weather), [weather]);
  const moonInfo = useMemo(() => computeMoonPhase(nowMs, lang), [nowMs, lang]);

  const sunInfo = useMemo(() => {
    if (!today) {
      return {
        progress: 0.5,
        state: 'during' as const,
        daylightHours: 12,
        daylightMinutes: 0,
        goldenMorning: '06:00–06:50',
        goldenEvening: '18:10–19:00',
      };
    }
    return computeSunProgress(weather.timezone, today.sunrise, today.sunset, nowMs);
  }, [weather.timezone, today, nowMs]);

  const hourlySparkPoints = useMemo(
    () =>
      next24.map((h, i) => ({
        label: i === 0 ? t.home.now : formatIsoTime(h.time),
        value: convertTempExact(h.temperature, unit),
      })),
    [next24, unit, t.home.now]
  );

  const daily8SparkPoints = useMemo(
    () =>
      daily8.map((d, i) => ({
        label: i === 0 ? t.home.today : formatDateLabel(d.date, lang, 'weekday'),
        value: convertTempExact(d.tempMax, unit),
        secondaryValue: convertTempExact(d.tempMin, unit),
      })),
    [daily8, unit, lang, t.home.today]
  );

  const weekMin = Math.min(...daily8.map((d) => d.tempMin));
  const weekMax = Math.max(...daily8.map((d) => d.tempMax));
  const weekSpan = Math.max(1, weekMax - weekMin);

  const sunT = sunInfo.progress;
  const sunX = (1 - sunT) * (1 - sunT) * 20 + 2 * (1 - sunT) * sunT * 140 + sunT * sunT * 260;
  const sunY = (1 - sunT) * (1 - sunT) * 96 + 2 * (1 - sunT) * sunT * 12 + sunT * sunT * 96;

  const wmoDesc = t.wmo[weather.current.weatherCode] ?? t.wmo[3];
  const windDir = getWindDirectionLabel(weather.current.windDirection, t.windDirs);
  const uvCategory = getUvCategory(weather.current.uvIndex, t.uvLevels);
  const visibilityKm = (weather.current.visibility / 1000).toFixed(1);
  const showPanorama = Boolean(cityImage?.url) && !imageError;

  const aqi = weather.airQuality;
  const aqiMeta = aqi ? getAqiCategory(aqi.europeanAqi, t.home.aqi.levels) : null;

  return (
    <div className="space-y-5">
      {/* HERO PANEL */}
      <GlassPanel
        as="section"
        spotlight
        elevated
        className="hero-panel hero-frame aer-top-accent overflow-hidden min-h-[320px] sm:min-h-[360px] flex flex-col justify-between p-6 sm:p-8 text-white"
        onPointerMove={(e) => {
          if (e.pointerType !== 'mouse') return;
          const rect = e.currentTarget.getBoundingClientRect();
          const nx = (e.clientX - rect.left) / rect.width - 0.5;
          const ny = (e.clientY - rect.top) / rect.height - 0.5;
          setParallaxOffset({x: nx * -10, y: ny * -8});
        }}
        onPointerLeave={() => setParallaxOffset({x: 0, y: 0})}
      >
        <div className="aer-corner top-3.5 left-3.5" aria-hidden="true" />
        <div className="aer-corner top-3.5 right-3.5 rotate-90" aria-hidden="true" />
        <div className="aer-corner bottom-3.5 left-3.5 -rotate-90" aria-hidden="true" />
        <div className="aer-corner bottom-3.5 right-3.5 rotate-180" aria-hidden="true" />

        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {showPanorama ? (
            <img
              src={cityImage?.url}
              alt={`${cityDisplay.name} panorama`}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover scale-105 transition-transform duration-500 ease-out"
              style={{
                transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0) scale(1.06)`,
              }}
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background:
                  dayPhase === 'dawn'
                    ? 'radial-gradient(circle at 22% 24%, rgba(255,45,104,0.34), transparent 48%), radial-gradient(circle at 78% 72%, rgba(184,61,255,0.28), transparent 52%), #07070b'
                    : dayPhase === 'day'
                      ? 'radial-gradient(circle at 22% 24%, rgba(62,140,255,0.34), transparent 50%), radial-gradient(circle at 78% 72%, rgba(99,91,255,0.24), transparent 52%), #07080e'
                      : dayPhase === 'dusk'
                        ? 'radial-gradient(circle at 24% 24%, rgba(255,45,104,0.38), transparent 48%), radial-gradient(circle at 80% 70%, rgba(184,61,255,0.3), transparent 54%), #08070d'
                        : 'radial-gradient(circle at 25% 25%, rgba(99,91,255,0.26), transparent 48%), radial-gradient(circle at 78% 74%, rgba(255,45,104,0.16), transparent 54%), #050507',
              }}
            />
          )}
          <div className="absolute inset-0 hero-scrim" />
        </div>

        {/* Hero Top Row */}
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 text-[11px] font-display tracking-[0.18em] uppercase text-slate-300 mb-2">
              <span className="aer-eyebrow-line" aria-hidden="true" />
              <MapPin className="w-3.5 h-3.5 text-[#ff2d68] shrink-0" />
              <span>
                {[cityDisplay.admin1, cityDisplay.country].filter(Boolean).join(', ')}
              </span>
              <span aria-hidden="true">·</span>
              <span>{t.dayPhases[dayPhase]}</span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-5xl tracking-[-0.04em] text-white leading-none">
              {cityDisplay.name}
            </h1>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2">
            <div className="text-left sm:text-right">
              <div className="text-[11px] uppercase tracking-[0.14em] text-slate-300/85">
                {t.home.localTime}
              </div>
              <div className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-white mt-0.5">
                {localClock.formattedTime}
              </div>
            </div>

            {/* Quick Presets (Now / Today / Tomorrow / Weekend) */}
            <div
              className="flex items-center gap-1 bg-black/45 border border-white/15 backdrop-blur-md rounded-xl p-1"
              role="group"
              aria-label="Forecast presets"
            >
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setActivePreset(preset)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                    activePreset === preset
                      ? 'aer-btn-primary text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {t.home.presets[preset]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hero Bottom Row */}
        <div className="relative z-10 mt-8 space-y-4">
          {(activePreset === 'now' || activePreset === 'today') && (
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="space-y-2.5">
                <div className="flex items-center gap-5 sm:gap-7">
                  <div className="font-display font-bold text-6xl sm:text-7xl tracking-tighter aer-grad-text tabular-nums leading-none">
                    {activePreset === 'now'
                      ? formatTemp(weather.current.temperature, unit)
                      : today
                        ? formatTemp(today.tempMax, unit)
                        : formatTemp(weather.current.temperature, unit)}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <WeatherIcon
                        code={
                          activePreset === 'now'
                            ? weather.current.weatherCode
                            : (today?.weatherCode ?? weather.current.weatherCode)
                        }
                        isDay={activePreset === 'now' ? weather.current.isDay : true}
                        className="w-7 h-7"
                      />
                      <span className="text-lg sm:text-xl font-medium text-white">
                        {activePreset === 'now'
                          ? wmoDesc
                          : (t.wmo[today?.weatherCode ?? weather.current.weatherCode] ?? wmoDesc)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 text-sm text-slate-200/90 tabular-nums">
                      <span>
                        {t.home.feelsLike} {formatTemp(weather.current.apparentTemperature, unit)}
                      </span>
                      {today && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>
                            {t.home.high} {formatTemp(today.tempMax, unit)} / {t.home.low}{' '}
                            {formatTemp(today.tempMin, unit)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-200/90 max-w-2xl leading-relaxed">
                  {heroSummary}
                </p>
              </div>

              {showPanorama && cityImage && (
                <div className="text-[11px] text-slate-300/80 max-w-xs sm:text-right leading-relaxed">
                  {cityImage.sourceUrl ? (
                    <a
                      href={cityImage.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-white underline decoration-white/30 underline-offset-2 transition-colors"
                    >
                      {t.home.photoCredit}
                      {cityImage.artist ? ` · ${cityImage.artist}` : ''}
                      {cityImage.license ? ` (${cityImage.license})` : ''}
                    </a>
                  ) : (
                    <span>{t.home.photoCredit}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {activePreset === 'tomorrow' && tomorrow && (
            <div className="rounded-2xl bg-black/45 border border-white/15 backdrop-blur-md p-4 sm:p-5 flex flex-wrap items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <WeatherIcon code={tomorrow.weatherCode} isDay className="w-10 h-10 shrink-0" />
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-300">
                    {t.home.presetTomorrowLabel} · {formatDateLabel(tomorrow.date, lang, 'full')}
                  </div>
                  <div className="text-xl sm:text-2xl font-display font-bold text-white mt-0.5">
                    {t.wmo[tomorrow.weatherCode] ?? t.wmo[3]}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-sm font-mono tabular-nums">
                <div>
                  <div className="text-[11px] text-slate-400">{t.home.high} / {t.home.low}</div>
                  <div className="text-lg font-bold aer-grad-text">
                    {formatTemp(tomorrow.tempMax, unit)} / {formatTemp(tomorrow.tempMin, unit)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">{t.home.precipProbLabel}</div>
                  <div className="text-base text-white">{Math.round(tomorrow.precipProbMax)}%</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">{t.home.metrics.wind}</div>
                  <div className="text-base text-white">{Math.round(tomorrow.windMax)} {t.home.units.kmh}</div>
                </div>
              </div>
            </div>
          )}

          {activePreset === 'weekend' && weekendDays.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {weekendDays.map((day) => (
                <div
                  key={day.date}
                  className="rounded-2xl bg-black/45 border border-white/15 backdrop-blur-md p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <WeatherIcon code={day.weatherCode} isDay className="w-8 h-8 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-slate-300 font-medium">
                        {formatDateLabel(day.date, lang, 'full')}
                      </div>
                      <div className="text-sm font-semibold text-white truncate">
                        {t.wmo[day.weatherCode] ?? t.wmo[3]}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <div className="text-lg font-bold aer-grad-text">
                      {formatTemp(day.tempMax, unit)} / {formatTemp(day.tempMin, unit)}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      {Math.round(day.precipProbMax)}% · {Math.round(day.windMax)} {t.home.units.kmh}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassPanel>

      {/* WEATHER ALERTS (when active) */}
      {alerts.length > 0 && (
        <GlassPanel as="section" className="p-4 sm:p-5 border-[var(--pink)]/45">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--pink)] mb-3">
            <AlertTriangle className="w-4 h-4" />
            <span>{t.home.alertsTitle}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="glass-subtle rounded-xl p-3.5 space-y-1">
                <div className="text-sm font-semibold text-[var(--text)]">{alert.title}</div>
                <p className="text-xs text-[var(--muted)] leading-relaxed">{alert.description}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* 01 · INSIGHTS & LIFESTYLE GUIDANCE */}
      <GlassPanel as="section" spotlight className="aer-top-accent p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs text-[var(--muted)]">01</span>
            <h2 className="font-display font-semibold text-lg text-[var(--text)]">
              {t.home.insightsTitle}
            </h2>
          </div>
          <span className="text-xs text-[var(--muted)]">{t.home.insightsSubtitle}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {insights.map((item) => {
            const titleColor =
              item.severity === 'alert'
                ? 'text-[var(--pink)]'
                : item.severity === 'notice'
                  ? 'text-[var(--violet)]'
                  : 'text-[var(--sky)]';
            return (
              <div
                key={item.id}
                className="glass-subtle rounded-xl p-4 flex flex-col justify-between gap-2"
              >
                <div className={`text-sm font-semibold ${titleColor}`}>{item.title}</div>
                <p className="text-xs text-[var(--muted)] leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </GlassPanel>

      {/* 02 · 6 METRICS + AIR QUALITY + SUN & MOON */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <GlassPanel as="section" spotlight className="xl:col-span-8 p-5 sm:p-6 flex flex-col gap-5">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs text-[var(--muted)]">02</span>
            <h2 className="font-display font-semibold text-lg text-[var(--text)]">
              {t.home.metricsTitle}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            <div className="glass-subtle rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <Droplets className="w-4 h-4 text-[var(--sky)]" />
                <span>{t.home.metrics.humidity}</span>
              </div>
              <div className="font-mono tabular-nums text-2xl font-semibold text-[var(--text)] mt-3">
                {Math.round(weather.current.humidity)}%
              </div>
            </div>

            <div className="glass-subtle rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <Wind className="w-4 h-4 text-[var(--blue)]" />
                <span>{t.home.metrics.wind}</span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono tabular-nums text-2xl font-semibold text-[var(--text)]">
                    {Math.round(weather.current.windSpeed)}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {t.home.units.kmh} · {windDir}
                  </span>
                </div>
                <div className="text-[11px] font-mono tabular-nums text-[var(--muted)] mt-1">
                  {t.home.metrics.gusts} {Math.round(weather.current.windGusts)} {t.home.units.kmh}
                </div>
              </div>
            </div>

            <div className="glass-subtle rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <Gauge className="w-4 h-4 text-[var(--violet)]" />
                <span>{t.home.metrics.pressure}</span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono tabular-nums text-2xl font-semibold text-[var(--text)]">
                    {Math.round(weather.current.pressure)}
                  </span>
                  <span className="text-xs text-[var(--muted)]">{t.home.units.hpa}</span>
                </div>
                <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--muted)]">
                  {pressureTrend === 'rising' && (
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  {pressureTrend === 'falling' && (
                    <ArrowDownRight className="w-3.5 h-3.5 text-[var(--pink)]" />
                  )}
                  {pressureTrend === 'steady' && (
                    <Minus className="w-3.5 h-3.5 text-[var(--sky)]" />
                  )}
                  <span>{t.home.pressureTrend[pressureTrend]}</span>
                </div>
              </div>
            </div>

            <div className="glass-subtle rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <Eye className="w-4 h-4 text-[var(--sky)]" />
                <span>{t.home.metrics.visibility}</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-mono tabular-nums text-2xl font-semibold text-[var(--text)]">
                  {visibilityKm}
                </span>
                <span className="text-xs text-[var(--muted)]">{t.home.units.km}</span>
              </div>
            </div>

            <div className="glass-subtle rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <SunMedium className="w-4 h-4 text-[var(--pink)]" />
                <span>{t.home.metrics.uvIndex}</span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-mono tabular-nums text-2xl font-semibold text-[var(--text)]">
                  {weather.current.uvIndex.toFixed(1)}
                </span>
                <span className="text-xs text-[var(--muted)] truncate">{uvCategory}</span>
              </div>
            </div>

            <div className="glass-subtle rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <Thermometer className="w-4 h-4 text-[var(--violet)]" />
                <span>{t.home.metrics.dewPoint}</span>
              </div>
              <div className="font-mono tabular-nums text-2xl font-semibold text-[var(--text)] mt-3">
                {formatTemp(weather.current.dewPoint, unit)}
              </div>
            </div>
          </div>

          {/* Open-Meteo Air Quality Index Row */}
          {aqi && aqiMeta && (
            <div className="glass-subtle rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs text-[var(--muted)]">{t.home.aqi.title} · {t.home.aqi.european}</div>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <span className="font-mono tabular-nums text-2xl font-bold text-[var(--text)]">
                    {aqi.europeanAqi}
                  </span>
                  <span className={`text-sm font-semibold ${aqiMeta.colorClass}`}>
                    {aqiMeta.label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono tabular-nums">
                <div>
                  <div className="text-[var(--muted)]">{t.home.aqi.pm25}</div>
                  <div className="text-[var(--text)] font-medium mt-0.5">
                    {aqi.pm25} {t.home.units.ugm3}
                  </div>
                </div>
                <div>
                  <div className="text-[var(--muted)]">{t.home.aqi.pm10}</div>
                  <div className="text-[var(--text)] font-medium mt-0.5">
                    {aqi.pm10} {t.home.units.ugm3}
                  </div>
                </div>
                <div>
                  <div className="text-[var(--muted)]">{t.home.aqi.no2}</div>
                  <div className="text-[var(--text)] font-medium mt-0.5">
                    {aqi.no2} {t.home.units.ugm3}
                  </div>
                </div>
                <div>
                  <div className="text-[var(--muted)]">{t.home.aqi.ozone}</div>
                  <div className="text-[var(--text)] font-medium mt-0.5">
                    {aqi.ozone} {t.home.units.ugm3}
                  </div>
                </div>
              </div>
            </div>
          )}
        </GlassPanel>

        {/* Sun, Golden Hour & Moon Phase Card */}
        <GlassPanel as="section" spotlight className="xl:col-span-4 p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="font-display font-semibold text-lg text-[var(--text)]">
                {t.home.sunTitle}
              </h2>
              <span className="text-xs font-mono tabular-nums text-[var(--muted)]">
                {sunInfo.daylightHours}h {String(sunInfo.daylightMinutes).padStart(2, '0')}m
              </span>
            </div>

            <div className="my-2">
              <svg viewBox="0 0 280 118" className="w-full h-28 overflow-visible">
                <defs>
                  <linearGradient id="sunArcGrad" x1="20" y1="96" x2="260" y2="96" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ff2d68" />
                    <stop offset="52%" stopColor="#b83dff" />
                    <stop offset="100%" stopColor="#3e8cff" />
                  </linearGradient>
                </defs>
                <line
                  x1="12"
                  y1="96"
                  x2="268"
                  y2="96"
                  stroke="var(--line-strong)"
                  strokeDasharray="4 4"
                />
                <path
                  d="M 20 96 Q 140 12 260 96"
                  fill="none"
                  stroke="var(--line)"
                  strokeWidth="2.5"
                />
                <path
                  d="M 20 96 Q 140 12 260 96"
                  fill="none"
                  stroke="url(#sunArcGrad)"
                  strokeWidth="3"
                  strokeDasharray="300"
                  strokeDashoffset={300 - 300 * sunInfo.progress}
                  strokeLinecap="round"
                />
                <circle
                  cx={sunX}
                  cy={sunY}
                  r="7"
                  fill={sunInfo.state === 'during' ? '#ff2d68' : 'var(--muted)'}
                  stroke="var(--surface)"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-[var(--line)]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-[var(--muted)]">{t.home.sunrise}</div>
                <div className="font-mono tabular-nums text-base font-semibold text-[var(--text)] mt-0.5">
                  {today ? formatIsoTime(today.sunrise) : '--:--'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[var(--muted)]">{t.home.sunset}</div>
                <div className="font-mono tabular-nums text-base font-semibold text-[var(--text)] mt-0.5">
                  {today ? formatIsoTime(today.sunset) : '--:--'}
                </div>
              </div>
            </div>

            <div className="glass-subtle rounded-xl p-3 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[var(--muted)]">
                <Sparkles className="w-3.5 h-3.5 text-[var(--pink)]" />
                <span>{t.home.goldenHour}</span>
              </div>
              <span className="font-mono tabular-nums text-[var(--text)]">
                {sunInfo.goldenEvening}
              </span>
            </div>

            <div className="glass-subtle rounded-xl p-3 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[var(--muted)]">
                <MoonStar className="w-3.5 h-3.5 text-[var(--blue)]" />
                <span>{t.home.moonPhase}</span>
              </div>
              <span className="text-[var(--text)] font-medium">
                {moonInfo.name} · <span className="font-mono tabular-nums">{moonInfo.illumination}%</span>
              </span>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* 03 · 24-HOUR HOURLY FORECAST */}
      <GlassPanel as="section" spotlight className="p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs text-[var(--muted)]">03</span>
            <h2 className="font-display font-semibold text-lg text-[var(--text)]">
              {t.home.hourlyTitle}
            </h2>
          </div>
          <span className="text-xs font-mono tabular-nums text-[var(--muted)]">
            {next24.length}h
          </span>
        </div>

        <Sparkline
          title={t.home.hourlySparklineTitle}
          points={hourlySparkPoints}
          unitSuffix="°"
          height={76}
          accentColor="var(--pink)"
        />

        <div className="flex gap-2.5 overflow-x-auto pb-2 aer-scroll">
          {next24.map((hour, idx) => {
            const isNow = idx === 0;
            return (
              <div
                key={hour.time}
                className={`shrink-0 w-[84px] rounded-xl p-3 flex flex-col items-center gap-2 border transition-colors ${
                  isNow
                    ? 'bg-[var(--glass-subtle-bg)] border-[var(--pink)] text-[var(--text)]'
                    : 'bg-[var(--glass-subtle-bg)] border-[var(--line)] text-[var(--text-secondary)]'
                }`}
              >
                <span className="text-xs font-mono tabular-nums text-[var(--muted)]">
                  {isNow ? t.home.now : formatIsoTime(hour.time)}
                </span>
                <WeatherIcon code={hour.weatherCode} isDay={hour.isDay} className="w-6 h-6" />
                <span className="font-mono tabular-nums text-base font-semibold text-[var(--text)]">
                  {formatTemp(hour.temperature, unit)}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-[var(--sky)]">
                  {Math.round(hour.precipProb)}%
                </span>
              </div>
            );
          })}
        </div>
      </GlassPanel>

      {/* 04 · 8-DAY FORECAST + MAP PREVIEW */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <GlassPanel as="section" spotlight className="xl:col-span-8 p-5 sm:p-6 flex flex-col justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-[var(--muted)]">04</span>
                <h2 className="font-display font-semibold text-lg text-[var(--text)]">
                  {t.home.daily8Title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('forecast')}
                className="aer-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
              >
                <span>{t.home.open16Days}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mb-5">
              <Sparkline
                title={t.home.daily8SparklineTitle}
                points={daily8SparkPoints}
                unitSuffix="°"
                height={76}
                accentColor="var(--pink)"
                secondaryColor="var(--blue)"
                showSecondary
              />
            </div>

            <div className="divide-y divide-[var(--line)]">
              {daily8.map((day, idx) => {
                const leftPct = ((day.tempMin - weekMin) / weekSpan) * 100;
                const widthPct = Math.max(8, ((day.tempMax - day.tempMin) / weekSpan) * 100);
                return (
                  <div
                    key={day.date}
                    className="py-2.5 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="w-24 sm:w-28 shrink-0 font-medium text-[var(--text)] truncate">
                      {idx === 0 ? t.home.today : formatDateLabel(day.date, lang, 'full')}
                    </div>

                    <div className="flex items-center gap-2 w-16 shrink-0">
                      <WeatherIcon code={day.weatherCode} isDay className="w-5 h-5" />
                      <span className="text-xs font-mono tabular-nums text-[var(--sky)]">
                        {day.precipProbMax >= 15 ? `${Math.round(day.precipProbMax)}%` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 flex-1 max-w-xs">
                      <span className="font-mono tabular-nums text-xs text-[var(--muted)] w-9 text-right">
                        {formatTemp(day.tempMin, unit)}
                      </span>
                      <div className="relative flex-1 h-1.5 rounded-full bg-[var(--line)] overflow-hidden">
                        <div
                          className="absolute top-0 bottom-0 rounded-full"
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            background: 'var(--grad)',
                          }}
                        />
                      </div>
                      <span className="font-mono tabular-nums text-xs font-semibold text-[var(--text)] w-9">
                        {formatTemp(day.tempMax, unit)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassPanel>

        <GlassPanel as="section" spotlight className="xl:col-span-4 p-5 sm:p-6 flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 className="font-display font-semibold text-lg text-[var(--text)]">
                {t.home.mapPreviewTitle}
              </h2>
              <Compass className="w-5 h-5 text-[var(--pink)]" />
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">{t.home.mapPreviewDesc}</p>
          </div>

          <div className="relative h-48 rounded-xl overflow-hidden hero-frame flex flex-col justify-between p-4 text-white">
            <div
              className="absolute inset-0 opacity-85"
              style={{
                background:
                  'radial-gradient(circle at 52% 48%, rgba(255,45,104,0.24) 0%, rgba(99,91,255,0.16) 44%, rgba(5,5,7,0.4) 82%)',
              }}
            />
            <div className="relative z-10 flex items-center justify-between text-xs text-slate-300">
              <span>{cityDisplay.name}</span>
              <span className="font-mono tabular-nums text-[#ff2d68]">
                {weather.city.latitude.toFixed(2)}°, {weather.city.longitude.toFixed(2)}°
              </span>
            </div>

            <div className="relative z-10 self-center flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border border-white/10 absolute" />
              <div className="w-16 h-16 rounded-full border border-[#635bff]/45 aer-orbit-spin absolute" />
              <span className="w-3.5 h-3.5 rounded-full bg-[#ff2d68] ring-8 ring-[#ff2d68]/20" />
            </div>

            <div className="relative z-10 flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-300/90">
              <span>{t.map.layers.temp}: {formatTemp(weather.current.temperature, unit)}</span>
              <span>{t.map.layers.clouds}: {Math.round(weather.current.cloudCover)}%</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('map')}
            className="w-full h-11 rounded-xl bg-[var(--glass-subtle-bg)] hover:border-[var(--pink)] border border-[var(--line)] text-sm font-medium text-[var(--text)] inline-flex items-center justify-center gap-2 transition-colors"
          >
            <span>{t.home.openMap}</span>
            <ArrowRight className="w-4 h-4 text-[var(--pink)]" />
          </button>
        </GlassPanel>
      </div>
    </div>
  );
}
