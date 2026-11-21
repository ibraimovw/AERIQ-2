import type {
  DayPhase,
  Language,
  TempUnit,
  WeatherAlert,
  WeatherData,
  WeatherInsight,
  WeatherMood,
} from '../types/weather';

export function convertTemp(celsius: number, unit: TempUnit): number {
  if (unit === 'F') {
    return Math.round((celsius * 9) / 5 + 32);
  }
  return Math.round(celsius);
}

export function convertTempExact(celsius: number, unit: TempUnit): number {
  if (unit === 'F') {
    return (celsius * 9) / 5 + 32;
  }
  return celsius;
}

export function formatTemp(celsius: number, unit: TempUnit): string {
  return `${convertTemp(celsius, unit)}°`;
}

export function getWeatherMood(weatherCode: number): WeatherMood {
  if (weatherCode >= 95) return 'storm';
  if ((weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86) {
    return 'snow';
  }
  if (
    (weatherCode >= 51 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82)
  ) {
    return 'rain';
  }
  if (weatherCode === 45 || weatherCode === 48) return 'fog';
  if (weatherCode === 2 || weatherCode === 3) return 'cloudy';
  return 'clear';
}

export function getCityLocalClock(
  timezone: string,
  nowMs: number = Date.now()
): {
  hours: number;
  minutes: number;
  totalMinutes: number;
  dateKey: string;
  formattedTime: string;
} {
  try {
    const dtf = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = dtf.formatToParts(new Date(nowMs));
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
    const year = get('year');
    const month = get('month');
    const day = get('day');
    let hours = Number(get('hour'));
    if (hours === 24) hours = 0;
    const minutes = Number(get('minute'));
    return {
      hours,
      minutes,
      totalMinutes: hours * 60 + minutes,
      dateKey: `${year}-${month}-${day}`,
      formattedTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    };
  } catch {
    const d = new Date(nowMs);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    return {
      hours,
      minutes,
      totalMinutes: hours * 60 + minutes,
      dateKey: d.toISOString().slice(0, 10),
      formattedTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    };
  }
}

function parseIsoMinutesOfDay(isoDateTime: string): number {
  const timePart = isoDateTime.split('T')[1] ?? '06:00';
  const [hStr, mStr] = timePart.split(':');
  return Number(hStr) * 60 + Number(mStr);
}

function formatMinutesClock(totalMinutes: number): string {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function computeDayPhase(
  timezone: string,
  sunriseIso?: string,
  sunsetIso?: string,
  nowMs: number = Date.now()
): DayPhase {
  const {totalMinutes} = getCityLocalClock(timezone, nowMs);
  const sunriseMin = sunriseIso ? parseIsoMinutesOfDay(sunriseIso) : 6 * 60;
  const sunsetMin = sunsetIso ? parseIsoMinutesOfDay(sunsetIso) : 19 * 60;

  const dawnStart = Math.max(0, sunriseMin - 30);
  const noonThreshold = 11 * 60;
  const duskStart = Math.max(dawnStart + 30, sunsetMin - 60);
  const nightStart = Math.min(24 * 60, sunsetMin + 45);

  if (totalMinutes >= duskStart && totalMinutes < nightStart) {
    return 'dusk';
  }
  if (totalMinutes >= dawnStart && totalMinutes < Math.min(noonThreshold, duskStart)) {
    return 'dawn';
  }
  if (totalMinutes >= noonThreshold && totalMinutes < duskStart) {
    return 'day';
  }
  return 'night';
}

export function computeSunProgress(
  timezone: string,
  sunriseIso: string,
  sunsetIso: string,
  nowMs: number = Date.now()
): {
  progress: number;
  state: 'before' | 'during' | 'after';
  daylightHours: number;
  daylightMinutes: number;
  goldenMorning: string;
  goldenEvening: string;
} {
  const {totalMinutes} = getCityLocalClock(timezone, nowMs);
  const sunriseMin = parseIsoMinutesOfDay(sunriseIso);
  const sunsetMin = parseIsoMinutesOfDay(sunsetIso);
  const span = Math.max(1, sunsetMin - sunriseMin);
  const daylightHours = Math.floor(span / 60);
  const daylightMinutes = span % 60;

  const goldenMorning = `${formatMinutesClock(sunriseMin)}–${formatMinutesClock(sunriseMin + 50)}`;
  const goldenEvening = `${formatMinutesClock(sunsetMin - 50)}–${formatMinutesClock(sunsetMin)}`;

  if (totalMinutes < sunriseMin) {
    return {
      progress: 0,
      state: 'before',
      daylightHours,
      daylightMinutes,
      goldenMorning,
      goldenEvening,
    };
  }
  if (totalMinutes > sunsetMin) {
    return {
      progress: 1,
      state: 'after',
      daylightHours,
      daylightMinutes,
      goldenMorning,
      goldenEvening,
    };
  }
  return {
    progress: Math.max(0, Math.min(1, (totalMinutes - sunriseMin) / span)),
    state: 'during',
    daylightHours,
    daylightMinutes,
    goldenMorning,
    goldenEvening,
  };
}

export function computeMoonPhase(
  nowMs: number = Date.now(),
  lang: Language = 'ru'
): {name: string; illumination: number; iconType: 'new' | 'waxing' | 'full' | 'waning'} {
  // Known new moon reference: 2000-01-06T18:14:00Z
  const synodicMonth = 29.53058867;
  const refMs = Date.UTC(2000, 0, 6, 18, 14, 0);
  const days = (nowMs - refMs) / 86400000;
  const phase = ((days % synodicMonth) + synodicMonth) % synodicMonth;
  const frac = phase / synodicMonth;
  const illumination = Math.round(((1 - Math.cos(frac * 2 * Math.PI)) / 2) * 100);

  if (frac < 0.06 || frac > 0.94) {
    return {
      name: lang === 'ru' ? 'Новолуние' : 'New Moon',
      illumination,
      iconType: 'new',
    };
  }
  if (frac < 0.22) {
    return {
      name: lang === 'ru' ? 'Молодой серп' : 'Waxing Crescent',
      illumination,
      iconType: 'waxing',
    };
  }
  if (frac < 0.28) {
    return {
      name: lang === 'ru' ? 'Первая четверть' : 'First Quarter',
      illumination,
      iconType: 'waxing',
    };
  }
  if (frac < 0.46) {
    return {
      name: lang === 'ru' ? 'Растущая луна' : 'Waxing Gibbous',
      illumination,
      iconType: 'waxing',
    };
  }
  if (frac < 0.54) {
    return {
      name: lang === 'ru' ? 'Полнолуние' : 'Full Moon',
      illumination,
      iconType: 'full',
    };
  }
  if (frac < 0.72) {
    return {
      name: lang === 'ru' ? 'Убывающая луна' : 'Waning Gibbous',
      illumination,
      iconType: 'waning',
    };
  }
  if (frac < 0.78) {
    return {
      name: lang === 'ru' ? 'Последняя четверть' : 'Last Quarter',
      illumination,
      iconType: 'waning',
    };
  }
  return {
    name: lang === 'ru' ? 'Старый серп' : 'Waning Crescent',
    illumination,
    iconType: 'waning',
  };
}

export function computePressureTrend(
  weather: WeatherData
): 'rising' | 'falling' | 'steady' {
  const {dateKey, hours} = getCityLocalClock(weather.timezone);
  const currentPrefix = `${dateKey}T${String(hours).padStart(2, '0')}`;
  const idx = weather.hourly.findIndex((h) => h.time.startsWith(currentPrefix));
  if (idx < 0) return 'steady';
  const prevIdx = Math.max(0, idx - 3);
  const nextIdx = Math.min(weather.hourly.length - 1, idx + 3);
  const diff = (weather.hourly[nextIdx]?.pressure ?? weather.current.pressure) -
    (weather.hourly[prevIdx]?.pressure ?? weather.current.pressure);
  if (diff >= 1.5) return 'rising';
  if (diff <= -1.5) return 'falling';
  return 'steady';
}

export function formatIsoTime(isoDateTime: string): string {
  const timePart = isoDateTime.split('T')[1];
  return timePart ? timePart.slice(0, 5) : '--:--';
}

export function formatDateLabel(
  isoDate: string,
  lang: Language,
  style: 'short' | 'weekday' | 'full' = 'short'
): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US';
  if (style === 'weekday') {
    return new Intl.DateTimeFormat(locale, {weekday: 'short', timeZone: 'UTC'}).format(date);
  }
  if (style === 'full') {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(date);
  }
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(date);
}

export function getWindDirectionLabel(degrees: number, dirs: string[]): string {
  const index = Math.round((((degrees % 360) + 360) % 360) / 45) % 8;
  return dirs[index] ?? dirs[0];
}

export function getUvCategory(
  uv: number,
  labels: {low: string; moderate: string; high: string; veryHigh: string; extreme: string}
): string {
  if (uv < 3) return labels.low;
  if (uv < 6) return labels.moderate;
  if (uv < 8) return labels.high;
  if (uv < 11) return labels.veryHigh;
  return labels.extreme;
}

export function getNext24Hours(weather: WeatherData): WeatherData['hourly'] {
  const {dateKey, hours} = getCityLocalClock(weather.timezone);
  const currentPrefix = `${dateKey}T${String(hours).padStart(2, '0')}`;
  let startIdx = weather.hourly.findIndex((h) => h.time.startsWith(currentPrefix));
  if (startIdx < 0) {
    startIdx = weather.hourly.findIndex((h) => h.time >= weather.current.time);
  }
  if (startIdx < 0) startIdx = 0;
  return weather.hourly.slice(startIdx, startIdx + 24);
}

export function generateHeroDailySummary(
  weather: WeatherData,
  unit: TempUnit,
  lang: Language,
  wmoMap: Record<number, string>
): string {
  const next24 = getNext24Hours(weather);
  const today = weather.daily[0];
  if (!today) return wmoMap[weather.current.weatherCode] ?? '';

  const rainyHour = next24.find((h) => h.precipProb >= 45 || h.precipitation >= 0.4);
  const maxGust = Math.round(
    Math.max(weather.current.windGusts, ...next24.map((h) => h.windGusts))
  );
  const highStr = formatTemp(today.tempMax, unit);
  const lowStr = formatTemp(today.tempMin, unit);

  if (lang === 'ru') {
    const precipText = rainyHour
      ? `осадки вероятны около ${formatIsoTime(rainyHour.time)}`
      : 'в ближайшие 24 ч без существенных осадков';
    const windText = maxGust >= 30 ? `, порывы ветра до ${maxGust} км/ч` : '';
    return `Сегодня от ${lowStr} до ${highStr}, ${precipText}${windText}.`;
  }

  const precipText = rainyHour
    ? `rain likely around ${formatIsoTime(rainyHour.time)}`
    : 'dry conditions expected over the next 24h';
  const windText = maxGust >= 30 ? `, gusts up to ${maxGust} km/h` : '';
  return `Today ${lowStr} to ${highStr}, ${precipText}${windText}.`;
}

export function generateWeatherAlerts(
  weather: WeatherData,
  lang: Language
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const next24 = getNext24Hours(weather);
  const today = weather.daily[0];

  const maxGust = Math.max(weather.current.windGusts, ...next24.map((h) => h.windGusts));
  if (maxGust >= 48) {
    alerts.push({
      id: 'alert-wind',
      severity: maxGust >= 65 ? 'warning' : 'caution',
      title:
        lang === 'ru'
          ? `Шквалистые порывы ветра до ${Math.round(maxGust)} км/ч`
          : `Strong wind gusts up to ${Math.round(maxGust)} km/h`,
      description:
        lang === 'ru'
          ? 'Возможны сильные порывы на открытых участках и у водоёмов.'
          : 'Expect turbulent gusts across exposed streets and bridges.',
    });
  }

  if (today && today.tempMin <= 1 && today.tempMax >= -2 && (today.precipProbMax >= 35 || weather.current.humidity >= 80)) {
    alerts.push({
      id: 'alert-ice',
      severity: 'caution',
      title: lang === 'ru' ? 'Риск гололедицы при околонулевой температуре' : 'Black ice risk near freezing point',
      description:
        lang === 'ru'
          ? 'Переход температуры через 0°C при высокой влажности может сделать дороги скользкими.'
          : 'Temperatures crossing 0°C with moisture increase slippery road risk.',
    });
  }

  if (weather.current.weatherCode >= 95 || (today && today.precipSum >= 12)) {
    alerts.push({
      id: 'alert-storm',
      severity: 'warning',
      title:
        weather.current.weatherCode >= 95
          ? lang === 'ru'
            ? 'Грозовая активность'
            : 'Thunderstorm activity'
          : lang === 'ru'
            ? `Обильные осадки (${today.precipSum.toFixed(1)} мм)`
            : `Heavy precipitation (${today.precipSum.toFixed(1)} mm)`,
      description:
        lang === 'ru'
          ? 'Учитывайте снижение видимости и задержки в пути.'
          : 'Plan extra travel time for reduced visibility and wet roads.',
    });
  }

  if ((today?.uvMax ?? weather.current.uvIndex) >= 7) {
    const uvVal = Math.max(today?.uvMax ?? 0, weather.current.uvIndex);
    alerts.push({
      id: 'alert-uv',
      severity: 'caution',
      title:
        lang === 'ru'
          ? `Высокий УФ-индекс (${uvVal.toFixed(1)})`
          : `High UV exposure (${uvVal.toFixed(1)})`,
      description:
        lang === 'ru'
          ? 'Используйте солнцезащитный крем и очки в полуденные часы.'
          : 'Wear SPF protection and sunglasses during midday hours.',
    });
  }

  if (weather.airQuality && weather.airQuality.europeanAqi >= 60) {
    alerts.push({
      id: 'alert-aqi',
      severity: weather.airQuality.europeanAqi >= 80 ? 'warning' : 'caution',
      title:
        lang === 'ru'
          ? `Пониженное качество воздуха (AQI ${weather.airQuality.europeanAqi})`
          : `Reduced air quality (AQI ${weather.airQuality.europeanAqi})`,
      description:
        lang === 'ru'
          ? `Повышенная концентрация частиц PM2.5 (${weather.airQuality.pm25} мкг/м³). Ограничьте интенсивные нагрузки на улице.`
          : `Elevated PM2.5 (${weather.airQuality.pm25} µg/m³). Consider lighter outdoor exercise.`,
    });
  }

  return alerts;
}

export function generateWeatherInsights(
  weather: WeatherData,
  unit: TempUnit,
  lang: Language
): WeatherInsight[] {
  const insights: WeatherInsight[] = [];
  const {current, daily} = weather;
  const next24 = getNext24Hours(weather);
  const today = daily[0];

  // 1. Apparent vs actual temperature + clothing guidance
  const diffC = current.apparentTemperature - current.temperature;
  const absDiffDisplay = Math.abs(
    convertTemp(current.apparentTemperature, unit) - convertTemp(current.temperature, unit)
  );
  if (Math.abs(diffC) >= 2) {
    const colder = diffC < 0;
    insights.push({
      id: 'feels-delta',
      category: 'feels',
      severity: Math.abs(diffC) >= 5 ? 'notice' : 'info',
      title:
        lang === 'ru'
          ? colder
            ? `Ощущается холоднее на ${absDiffDisplay}°`
            : `Ощущается теплее на ${absDiffDisplay}°`
          : colder
            ? `Feels ${absDiffDisplay}° colder than actual`
            : `Feels ${absDiffDisplay}° warmer than actual`,
      description:
        lang === 'ru'
          ? colder
            ? `При ${formatTemp(current.temperature, unit)} ветер охлаждает воздух до ${formatTemp(current.apparentTemperature, unit)}.`
            : `Влажность повышает ощущаемую температуру до ${formatTemp(current.apparentTemperature, unit)}.`
          : colder
            ? `Wind chill makes ${formatTemp(current.temperature, unit)} feel like ${formatTemp(current.apparentTemperature, unit)}.`
            : `Humidity makes ${formatTemp(current.temperature, unit)} feel like ${formatTemp(current.apparentTemperature, unit)}.`,
    });
  } else {
    const wardrobe =
      current.temperature <= 2
        ? lang === 'ru'
          ? 'Зимняя верхняя одежда и тёплый слой'
          : 'Warm winter coat and thermal layers'
        : current.temperature <= 13
          ? lang === 'ru'
            ? 'Лёгкая куртка или ветровка'
            : 'Light jacket or windbreaker'
          : current.temperature <= 22
            ? lang === 'ru'
              ? 'Комфортно в лёгкой кофте или рубашке'
              : 'Comfortable in a light sweater or long sleeve'
            : lang === 'ru'
              ? 'Лёгкая дышащая одежда'
              : 'Light breathable clothing';
    insights.push({
      id: 'wardrobe-guide',
      category: 'activity',
      severity: 'info',
      title: lang === 'ru' ? 'Гардероб на выход' : 'Wardrobe Guidance',
      description: wardrobe,
    });
  }

  // 2. Wind & gusts
  const wind = Math.round(current.windSpeed);
  const gusts = Math.round(current.windGusts);
  insights.push({
    id: 'wind-condition',
    category: 'wind',
    severity: gusts >= 40 ? 'alert' : wind >= 20 ? 'notice' : 'info',
    title:
      lang === 'ru'
        ? `Ветер ${wind} км/ч · порывы ${gusts} км/ч`
        : `Wind ${wind} km/h · gusts ${gusts} km/h`,
    description:
      lang === 'ru'
        ? gusts >= 40
          ? 'Ощутимые порывы — при поездке на велосипеде или прогулке будьте внимательны.'
          : wind >= 18
            ? 'Свежий поток воздуха; ветрозащитный слой сделает прогулку комфортнее.'
            : 'Спокойная ветровая обстановка, отлично подходит для пробежки или прогулки.'
        : gusts >= 40
          ? 'Strong gusts expected — keep a windproof layer for cycling or walks.'
          : wind >= 18
            ? 'Moderate breeze; a light shell jacket is helpful.'
            : 'Calm surface breeze, ideal for outdoor runs and walks.',
  });

  // 3. Precipitation in next 24h
  if (next24.length > 0) {
    let peakHour = next24[0];
    for (const h of next24) {
      if (h.precipProb > peakHour.precipProb) peakHour = h;
    }
    const maxProb = Math.round(peakHour.precipProb);
    const peakTime = formatIsoTime(peakHour.time);
    insights.push({
      id: 'precip-24h',
      category: 'precip',
      severity: maxProb >= 65 ? 'alert' : maxProb >= 35 ? 'notice' : 'info',
      title:
        lang === 'ru'
          ? maxProb >= 50
            ? `Высокий риск осадков (${maxProb}%)`
            : maxProb >= 20
              ? `Небольшая вероятность осадков (${maxProb}%)`
              : 'В ближайшие 24 часа сухо'
          : maxProb >= 50
            ? `Likely precipitation (${maxProb}%)`
            : maxProb >= 20
              ? `Low precipitation chance (${maxProb}%)`
              : 'Dry over the next 24 hours',
      description:
        lang === 'ru'
          ? maxProb >= 20
            ? `Максимум вероятности около ${peakTime}. ${maxProb >= 50 ? 'Возьмите зонт.' : 'Существенных ливней не ожидается.'}`
            : 'Зонт не понадобится — дороги останутся сухими.'
          : maxProb >= 20
            ? `Peak probability around ${peakTime}. ${maxProb >= 50 ? 'Bring an umbrella.' : 'Only brief light drops at most.'}`
            : 'No umbrella needed; roads should stay dry.',
    });
  }

  // 4. Driving / Visibility & Diurnal swing
  if (current.visibility < 4000) {
    insights.push({
      id: 'visibility-drive',
      category: 'activity',
      severity: 'notice',
      title:
        lang === 'ru'
          ? `Сниженная видимость (${(current.visibility / 1000).toFixed(1)} км)`
          : `Reduced visibility (${(current.visibility / 1000).toFixed(1)} km)`,
      description:
        lang === 'ru'
          ? 'Дымка или осадки ухудшают обзор на дорогах — соблюдайте дистанцию.'
          : 'Mist or precipitation limits road sightlines — allow extra distance.',
    });
  } else if (today) {
    const swingDisplay = Math.abs(
      convertTemp(today.tempMax, unit) - convertTemp(today.tempMin, unit)
    );
    insights.push({
      id: 'diurnal-swing',
      category: 'swing',
      severity: swingDisplay >= 10 ? 'notice' : 'info',
      title:
        lang === 'ru'
          ? `Перепад за сутки ${swingDisplay}°`
          : `${swingDisplay}° daily swing`,
      description:
        lang === 'ru'
          ? `От ${formatTemp(today.tempMin, unit)} до ${formatTemp(today.tempMax, unit)} — удобнее одеваться в несколько слоёв.`
          : `From ${formatTemp(today.tempMin, unit)} to ${formatTemp(today.tempMax, unit)} today — layering works best.`,
    });
  }

  return insights.slice(0, 4);
}
