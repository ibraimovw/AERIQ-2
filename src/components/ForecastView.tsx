import {useMemo, useState} from 'react';
import {ChevronDown, ChevronUp} from 'lucide-react';
import {GlassPanel} from './GlassPanel';
import {Sparkline} from './Sparkline';
import {WeatherIcon} from './WeatherIcon';
import {
  convertTempExact,
  formatDateLabel,
  formatIsoTime,
  formatTemp,
} from '../utils/weatherHelpers';
import {getLocalizedCityDisplay} from '../services/weatherApi';
import type {
  DailyForecastPoint,
  ForecastMetricKey,
  Language,
  TempUnit,
  WeatherData,
} from '../types/weather';
import type {TranslationDictionary} from '../i18n/translations';

interface ForecastViewProps {
  weather: WeatherData;
  unit: TempUnit;
  lang: Language;
  t: TranslationDictionary;
  selectedMetrics: ForecastMetricKey[];
  onToggleMetric: (metric: ForecastMetricKey) => void;
}

const ALL_METRICS: ForecastMetricKey[] = [
  'temperature',
  'feelsLike',
  'precipProb',
  'precipSum',
  'humidity',
  'windSpeed',
  'pressure',
  'uvIndex',
  'cloudCover',
];

export function ForecastView({
  weather,
  unit,
  lang,
  t,
  selectedMetrics,
  onToggleMetric,
}: ForecastViewProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(
    weather.daily[0]?.date ?? null
  );
  const [minHintVisible, setMinHintVisible] = useState(false);

  const handleToggle = (metric: ForecastMetricKey) => {
    if (selectedMetrics.includes(metric) && selectedMetrics.length <= 1) {
      setMinHintVisible(true);
      window.setTimeout(() => setMinHintVisible(false), 2400);
      return;
    }
    setMinHintVisible(false);
    onToggleMetric(metric);
  };

  const sparklinePoints = useMemo(
    () =>
      weather.daily.map((d, i) => ({
        label: i === 0 ? t.home.today : formatDateLabel(d.date, lang, 'short'),
        value: convertTempExact(d.tempMax, unit),
        secondaryValue: convertTempExact(d.tempMin, unit),
      })),
    [weather.daily, unit, lang, t.home.today]
  );

  const renderMetricValue = (day: DailyForecastPoint, metric: ForecastMetricKey): string => {
    switch (metric) {
      case 'temperature':
        return `${formatTemp(day.tempMax, unit)} / ${formatTemp(day.tempMin, unit)}`;
      case 'feelsLike':
        return `${formatTemp(day.feelsMax, unit)} / ${formatTemp(day.feelsMin, unit)}`;
      case 'precipProb':
        return `${Math.round(day.precipProbMax)}%`;
      case 'precipSum':
        return `${day.precipSum.toFixed(1)} ${t.home.units.mm}`;
      case 'humidity':
        return `${day.humidityMean}%`;
      case 'windSpeed':
        return `${Math.round(day.windMax)} ${t.home.units.kmh}`;
      case 'pressure':
        return `${day.pressureMean} ${t.home.units.hpa}`;
      case 'uvIndex':
        return day.uvMax.toFixed(1);
      case 'cloudCover':
        return `${day.cloudCoverMean}%`;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header + 16-Day Sparkline */}
      <GlassPanel as="section" spotlight className="aer-top-accent p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div className="flex items-center gap-3 text-[11px] font-display tracking-[0.18em] uppercase text-[var(--muted)] mb-2">
              <span className="aer-eyebrow-line" aria-hidden="true" />
              <span>{getLocalizedCityDisplay(weather.city, lang).name}</span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-[var(--text)]">
              {t.forecast.title}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
              {t.forecast.subtitle}
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-[var(--pink)] font-semibold">
            {weather.daily.length}d
          </span>
        </div>

        <Sparkline
          title={t.forecast.sparklineTitle}
          points={sparklinePoints}
          unitSuffix="°"
          height={96}
          accentColor="var(--pink)"
          secondaryColor="var(--blue)"
          showSecondary
        />
      </GlassPanel>

      {/* Parameter Selection Bar (.filter-bar) */}
      <GlassPanel as="section" className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-medium text-[var(--muted)]">{t.forecast.parametersLabel}</span>
          {minHintVisible && (
            <span className="text-xs text-[var(--pink)] font-medium">{t.forecast.minOneParamHint}</span>
          )}
        </div>

        <div className="filter-bar flex flex-wrap gap-2">
          {ALL_METRICS.map((metric) => {
            const active = selectedMetrics.includes(metric);
            return (
              <button
                key={metric}
                type="button"
                onClick={() => handleToggle(metric)}
                aria-pressed={active}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap min-h-[38px] ${
                  active
                    ? 'aer-btn-primary border-transparent'
                    : 'bg-[var(--glass-subtle-bg)] border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {t.forecast.metrics[metric]}
              </button>
            );
          })}
        </div>
      </GlassPanel>

      {/* Desktop / Wide Tablet Table */}
      <GlassPanel as="section" className="hidden lg:block overflow-hidden">
        <div className="overflow-x-auto aer-scroll">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--line)] text-xs text-[var(--muted)] font-medium">
                <th className="py-3.5 px-5 whitespace-nowrap">{t.forecast.dateCol}</th>
                <th className="py-3.5 px-4 whitespace-nowrap">{t.forecast.conditionCol}</th>
                {selectedMetrics.map((metric) => (
                  <th key={metric} className="py-3.5 px-4 text-right whitespace-nowrap">
                    {t.forecast.metrics[metric]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] text-sm">
              {weather.daily.map((day, idx) => (
                <tr
                  key={day.date}
                  className="hover:bg-[var(--glass-subtle-bg)] transition-colors"
                >
                  <td className="py-3.5 px-5 font-medium text-[var(--text)] whitespace-nowrap">
                    {idx === 0 ? t.home.today : formatDateLabel(day.date, lang, 'full')}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5 min-w-[160px]">
                      <WeatherIcon code={day.weatherCode} isDay className="w-5 h-5 shrink-0" />
                      <span className="text-[var(--text-secondary)] truncate">
                        {t.wmo[day.weatherCode] ?? t.wmo[3]}
                      </span>
                    </div>
                  </td>
                  {selectedMetrics.map((metric) => (
                    <td
                      key={metric}
                      className="py-3.5 px-4 text-right font-mono tabular-nums text-[var(--text)] whitespace-nowrap"
                    >
                      {renderMetricValue(day, metric)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>

      {/* Mobile & Compact Tablet Expandable Day Cards */}
      <section className="lg:hidden space-y-3">
        {weather.daily.map((day, idx) => {
          const isExpanded = expandedDate === day.date;
          return (
            <GlassPanel key={day.date} as="article" className="overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedDate(isExpanded ? null : day.date)}
                aria-expanded={isExpanded}
                className="w-full text-left p-4 flex flex-col gap-3 focus-visible:outline-2 focus-visible:outline-[var(--pink)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <WeatherIcon code={day.weatherCode} isDay className="w-6 h-6 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--text)] text-sm">
                        {idx === 0 ? t.home.today : formatDateLabel(day.date, lang, 'full')}
                      </div>
                      <div className="text-xs text-[var(--muted)] truncate">
                        {t.wmo[day.weatherCode] ?? t.wmo[3]}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-mono tabular-nums text-sm font-semibold text-[var(--text)]">
                      {formatTemp(day.tempMax, unit)}
                    </span>
                    <span className="font-mono tabular-nums text-sm text-[var(--muted)]">
                      {formatTemp(day.tempMin, unit)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[var(--muted)]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[var(--muted)]" />
                    )}
                  </div>
                </div>

                {/* Compact selected parameter blocks (.m-day-card__chips) */}
                <div className="m-day-card__chips grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[var(--line)]">
                  {selectedMetrics.map((metric) => (
                    <div
                      key={metric}
                      className="rounded-lg bg-[var(--glass-subtle-bg)] px-2.5 py-1.5 flex flex-col"
                    >
                      <span className="text-[11px] text-[var(--muted)] truncate">
                        {t.forecast.metrics[metric]}
                      </span>
                      <span className="text-xs font-mono tabular-nums font-medium text-[var(--text)] mt-0.5">
                        {renderMetricValue(day, metric)}
                      </span>
                    </div>
                  ))}
                </div>
              </button>

              {isExpanded && (
                <div className="m-day-card__details px-4 pb-4 pt-2 border-t border-[var(--line)] bg-[var(--glass-subtle-bg)] grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-[var(--muted)]">{t.forecast.sunriseLabel}</div>
                    <div className="font-mono tabular-nums text-[var(--text)] mt-0.5">
                      {formatIsoTime(day.sunrise)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--muted)]">{t.forecast.sunsetLabel}</div>
                    <div className="font-mono tabular-nums text-[var(--text)] mt-0.5">
                      {formatIsoTime(day.sunset)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--muted)]">{t.forecast.metrics.feelsLike}</div>
                    <div className="font-mono tabular-nums text-[var(--text)] mt-0.5">
                      {renderMetricValue(day, 'feelsLike')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--muted)]">{t.forecast.metrics.pressure}</div>
                    <div className="font-mono tabular-nums text-[var(--text)] mt-0.5">
                      {renderMetricValue(day, 'pressure')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--muted)]">{t.forecast.metrics.uvIndex}</div>
                    <div className="font-mono tabular-nums text-[var(--text)] mt-0.5">
                      {renderMetricValue(day, 'uvIndex')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--muted)]">{t.forecast.metrics.cloudCover}</div>
                    <div className="font-mono tabular-nums text-[var(--text)] mt-0.5">
                      {renderMetricValue(day, 'cloudCover')}
                    </div>
                  </div>
                </div>
              )}
            </GlassPanel>
          );
        })}
      </section>
    </div>
  );
}
