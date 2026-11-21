import type {
  AirQualityData,
  CityLocation,
  DailyForecastPoint,
  HourlyPoint,
  Language,
  LocalizedCityName,
  MapGridPoint,
  WeatherData,
} from '../types/weather';

const CACHE_KEY = 'aerwave_weather_cache_v7';
const CITY_I18N_CACHE_KEY = 'aerwave_city_i18n_v7';
const MAX_CACHED_CITIES = 15;

export const DEFAULT_CITIES: CityLocation[] = [
  {
    id: '524901',
    name: 'Москва',
    country: 'Россия',
    admin1: 'Москва',
    latitude: 55.7522,
    longitude: 37.6156,
    timezone: 'Europe/Moscow',
    localized: {
      ru: {name: 'Москва', country: 'Россия', admin1: 'Москва'},
      en: {name: 'Moscow', country: 'Russia', admin1: 'Moscow'},
    },
  },
  {
    id: '1850147',
    name: 'Токио',
    country: 'Япония',
    admin1: 'Токио',
    latitude: 35.6895,
    longitude: 139.6917,
    timezone: 'Asia/Tokyo',
    localized: {
      ru: {name: 'Токио', country: 'Япония', admin1: 'Токио'},
      en: {name: 'Tokyo', country: 'Japan', admin1: 'Tokyo'},
    },
  },
  {
    id: '2643743',
    name: 'Лондон',
    country: 'Великобритания',
    admin1: 'Англия',
    latitude: 51.5085,
    longitude: -0.1257,
    timezone: 'Europe/London',
    localized: {
      ru: {name: 'Лондон', country: 'Великобритания', admin1: 'Англия'},
      en: {name: 'London', country: 'United Kingdom', admin1: 'England'},
    },
  },
  {
    id: '5128581',
    name: 'Нью-Йорк',
    country: 'США',
    admin1: 'Нью-Йорк',
    latitude: 40.7143,
    longitude: -74.006,
    timezone: 'America/New_York',
    localized: {
      ru: {name: 'Нью-Йорк', country: 'США', admin1: 'Нью-Йорк'},
      en: {name: 'New York', country: 'United States', admin1: 'New York'},
    },
  },
  {
    id: '3413829',
    name: 'Рейкьявик',
    country: 'Исландия',
    admin1: 'Хёвюдборгарсвайдид',
    latitude: 64.1355,
    longitude: -21.8954,
    timezone: 'Atlantic/Reykjavik',
    localized: {
      ru: {name: 'Рейкьявик', country: 'Исландия', admin1: 'Столичный регион'},
      en: {name: 'Reykjavik', country: 'Iceland', admin1: 'Capital Region'},
    },
  },
];

interface CacheStore {
  [cityKey: string]: WeatherData;
}

type CityI18nStore = Record<string, Partial<Record<Language, LocalizedCityName>>>;

export function getCityCacheKey(city: Pick<CityLocation, 'latitude' | 'longitude'>): string {
  return `${city.latitude.toFixed(2)},${city.longitude.toFixed(2)}`;
}

function readCityI18nStore(): CityI18nStore {
  try {
    const raw = localStorage.getItem(CITY_I18N_CACHE_KEY);
    return raw ? (JSON.parse(raw) as CityI18nStore) : {};
  } catch {
    return {};
  }
}

function writeCityI18nEntry(
  cityKey: string,
  lang: Language,
  loc: LocalizedCityName
): void {
  try {
    const store = readCityI18nStore();
    store[cityKey] = {...(store[cityKey] ?? {}), [lang]: loc};
    localStorage.setItem(CITY_I18N_CACHE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage errors
  }
}

export function getLocalizedCityDisplay(
  city: CityLocation,
  lang: Language
): LocalizedCityName {
  const fromCity = city.localized?.[lang];
  if (fromCity?.name) return fromCity;

  const key = getCityCacheKey(city);
  const store = readCityI18nStore();
  const fromStore = store[key]?.[lang];
  if (fromStore?.name) return fromStore;

  return {
    name: city.name,
    country: city.country,
    admin1: city.admin1,
  };
}

export async function resolveCityLocalization(
  city: CityLocation,
  targetLang: Language,
  signal?: AbortSignal
): Promise<CityLocation> {
  if (city.localized?.[targetLang]?.name) {
    return city;
  }

  const key = getCityCacheKey(city);
  const store = readCityI18nStore();
  const cachedLoc = store[key]?.[targetLang];
  if (cachedLoc?.name) {
    return {
      ...city,
      localized: {...city.localized, [targetLang]: cachedLoc},
    };
  }

  // 1. Try Open-Meteo Geocoding by city name in targetLang, matching closest coordinates
  try {
    const searchName = city.localized?.en?.name ?? city.localized?.ru?.name ?? city.name;
    const candidates = await searchCities(searchName, targetLang, signal);
    const match = candidates.find(
      (c) =>
        Math.abs(c.latitude - city.latitude) < 0.35 &&
        Math.abs(c.longitude - city.longitude) < 0.35
    );
    if (match) {
      const loc: LocalizedCityName = {
        name: match.name,
        country: match.country,
        admin1: match.admin1,
      };
      writeCityI18nEntry(key, targetLang, loc);
      return {
        ...city,
        localized: {...city.localized, [targetLang]: loc},
      };
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
  }

  // 2. Fallback: OpenStreetMap Nominatim reverse geocoding in targetLang
  try {
    const nomUrl = new URL('https://nominatim.openstreetmap.org/reverse');
    nomUrl.searchParams.set('format', 'jsonv2');
    nomUrl.searchParams.set('lat', city.latitude.toFixed(4));
    nomUrl.searchParams.set('lon', city.longitude.toFixed(4));
    nomUrl.searchParams.set('zoom', '10');
    nomUrl.searchParams.set('accept-language', targetLang);

    const res = await fetch(nomUrl.toString(), {signal});
    if (res.ok) {
      const data = (await res.json()) as {
        name?: string;
        address?: {
          city?: string;
          town?: string;
          village?: string;
          municipality?: string;
          state?: string;
          country?: string;
        };
      };
      const resolvedName =
        data.address?.city ??
        data.address?.town ??
        data.address?.village ??
        data.address?.municipality ??
        data.name;
      if (resolvedName) {
        const loc: LocalizedCityName = {
          name: resolvedName,
          country: data.address?.country ?? city.country,
          admin1: data.address?.state ?? city.admin1,
        };
        writeCityI18nEntry(key, targetLang, loc);
        return {
          ...city,
          localized: {...city.localized, [targetLang]: loc},
        };
      }
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
  }

  return city;
}

function readCacheStore(): CacheStore {
  try {
    const raw =
      localStorage.getItem(CACHE_KEY) ?? localStorage.getItem('aerwave_weather_cache_v4');
    if (!raw) return {};
    return JSON.parse(raw) as CacheStore;
  } catch {
    return {};
  }
}

function writeCacheEntry(cityKey: string, data: WeatherData): void {
  try {
    const store = readCacheStore();
    store[cityKey] = data;
    const entries = Object.entries(store).sort((a, b) => b[1].fetchedAt - a[1].fetchedAt);
    const trimmed = Object.fromEntries(entries.slice(0, MAX_CACHED_CITIES));
    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage quota errors
  }
}

export function getCachedWeather(
  city: Pick<CityLocation, 'latitude' | 'longitude'>
): WeatherData | null {
  const key = getCityCacheKey(city);
  const store = readCacheStore();
  const entry = store[key];
  if (!entry) return null;
  return {
    ...entry,
    isCached: true,
    cachedAt: entry.fetchedAt,
  };
}

export async function searchCities(
  query: string,
  lang: Language,
  signal?: AbortSignal
): Promise<CityLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', trimmed);
  url.searchParams.set('count', '8');
  url.searchParams.set('language', lang);
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString(), {signal});
  if (!res.ok) {
    throw new Error(`Geocoding error: ${res.status}`);
  }
  const json = (await res.json()) as {
    results?: Array<{
      id: number;
      name: string;
      country?: string;
      admin1?: string;
      latitude: number;
      longitude: number;
      timezone?: string;
    }>;
  };

  if (!json.results) return [];

  return json.results.map((item) => {
    const loc: LocalizedCityName = {
      name: item.name,
      country: item.country ?? '',
      admin1: item.admin1,
    };
    const key = getCityCacheKey({latitude: item.latitude, longitude: item.longitude});
    writeCityI18nEntry(key, lang, loc);
    return {
      id: String(item.id),
      name: item.name,
      country: item.country ?? '',
      admin1: item.admin1,
      latitude: item.latitude,
      longitude: item.longitude,
      timezone: item.timezone,
      localized: {[lang]: loc},
    };
  });
}

export async function fetchAirQuality(
  city: Pick<CityLocation, 'latitude' | 'longitude'>,
  signal?: AbortSignal
): Promise<AirQualityData | null> {
  try {
    const url = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
    url.searchParams.set('latitude', city.latitude.toFixed(4));
    url.searchParams.set('longitude', city.longitude.toFixed(4));
    url.searchParams.set(
      'current',
      'european_aqi,us_aqi,pm10,pm2_5,nitrogen_dioxide,ozone'
    );

    const res = await fetch(url.toString(), {signal});
    if (!res.ok) return null;
    const json = (await res.json()) as {
      current?: {
        european_aqi?: number;
        us_aqi?: number;
        pm10?: number;
        pm2_5?: number;
        nitrogen_dioxide?: number;
        ozone?: number;
      };
    };
    if (!json.current) return null;
    return {
      europeanAqi: Math.round(json.current.european_aqi ?? 0),
      usAqi: Math.round(json.current.us_aqi ?? 0),
      pm25: Number((json.current.pm2_5 ?? 0).toFixed(1)),
      pm10: Number((json.current.pm10 ?? 0).toFixed(1)),
      no2: Number((json.current.nitrogen_dioxide ?? 0).toFixed(1)),
      ozone: Number((json.current.ozone ?? 0).toFixed(1)),
    };
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    return null;
  }
}

interface OpenMeteoForecastResponse {
  timezone: string;
  utc_offset_seconds: number;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    cloud_cover: number;
    pressure_msl: number;
    wind_speed_10m: number;
    wind_gusts_10m?: number;
    wind_direction_10m: number;
    visibility?: number;
    dew_point_2m?: number;
    uv_index?: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
    pressure_msl: number[];
    wind_speed_10m: number[];
    wind_gusts_10m?: number[];
    visibility: number[];
    uv_index: number[];
    cloud_cover: number[];
    is_day: number[];
    dew_point_2m: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
  };
}

export async function fetchCityWeather(
  city: CityLocation,
  signal?: AbortSignal
): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', city.latitude.toFixed(4));
  url.searchParams.set('longitude', city.longitude.toFixed(4));
  url.searchParams.set(
    'current',
    [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'weather_code',
      'cloud_cover',
      'pressure_msl',
      'wind_speed_10m',
      'wind_gusts_10m',
      'wind_direction_10m',
      'visibility',
      'dew_point_2m',
      'uv_index',
    ].join(',')
  );
  url.searchParams.set(
    'hourly',
    [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation_probability',
      'precipitation',
      'weather_code',
      'pressure_msl',
      'wind_speed_10m',
      'wind_gusts_10m',
      'visibility',
      'uv_index',
      'cloud_cover',
      'is_day',
      'dew_point_2m',
    ].join(',')
  );
  url.searchParams.set(
    'daily',
    [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'sunrise',
      'sunset',
      'uv_index_max',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
    ].join(',')
  );
  url.searchParams.set('forecast_days', '16');
  url.searchParams.set('timezone', 'auto');

  try {
    const [forecastRes, airQuality] = await Promise.all([
      fetch(url.toString(), {signal}),
      fetchAirQuality(city, signal),
    ]);

    if (!forecastRes.ok) {
      throw new Error(`Open-Meteo error: ${forecastRes.status}`);
    }
    const raw = (await forecastRes.json()) as OpenMeteoForecastResponse;

    const hourly: HourlyPoint[] = raw.hourly.time.map((t, i) => ({
      time: t,
      temperature: raw.hourly.temperature_2m[i] ?? 0,
      apparentTemperature: raw.hourly.apparent_temperature[i] ?? 0,
      humidity: raw.hourly.relative_humidity_2m[i] ?? 0,
      precipProb: raw.hourly.precipitation_probability[i] ?? 0,
      precipitation: raw.hourly.precipitation[i] ?? 0,
      weatherCode: raw.hourly.weather_code[i] ?? 0,
      pressure: raw.hourly.pressure_msl[i] ?? 1013,
      windSpeed: raw.hourly.wind_speed_10m[i] ?? 0,
      windGusts: raw.hourly.wind_gusts_10m?.[i] ?? raw.hourly.wind_speed_10m[i] ?? 0,
      visibility: raw.hourly.visibility[i] ?? 10000,
      uvIndex: raw.hourly.uv_index[i] ?? 0,
      cloudCover: raw.hourly.cloud_cover[i] ?? 0,
      isDay: (raw.hourly.is_day[i] ?? 1) === 1,
    }));

    const dailyBuckets = new Map<
      string,
      {humidity: number[]; pressure: number[]; clouds: number[]}
    >();
    for (const h of hourly) {
      const dayKey = h.time.slice(0, 10);
      let bucket = dailyBuckets.get(dayKey);
      if (!bucket) {
        bucket = {humidity: [], pressure: [], clouds: []};
        dailyBuckets.set(dayKey, bucket);
      }
      bucket.humidity.push(h.humidity);
      bucket.pressure.push(h.pressure);
      bucket.clouds.push(h.cloudCover);
    }

    const avg = (arr: number[], fallback: number): number =>
      arr.length > 0 ? arr.reduce((sum, val) => sum + val, 0) / arr.length : fallback;

    const daily: DailyForecastPoint[] = raw.daily.time.map((date, i) => {
      const bucket = dailyBuckets.get(date);
      return {
        date,
        weatherCode: raw.daily.weather_code[i] ?? 0,
        tempMax: raw.daily.temperature_2m_max[i] ?? 0,
        tempMin: raw.daily.temperature_2m_min[i] ?? 0,
        feelsMax: raw.daily.apparent_temperature_max[i] ?? 0,
        feelsMin: raw.daily.apparent_temperature_min[i] ?? 0,
        sunrise: raw.daily.sunrise[i] ?? `${date}T06:00`,
        sunset: raw.daily.sunset[i] ?? `${date}T18:00`,
        uvMax: raw.daily.uv_index_max[i] ?? 0,
        precipSum: raw.daily.precipitation_sum[i] ?? 0,
        precipProbMax: raw.daily.precipitation_probability_max[i] ?? 0,
        windMax: raw.daily.wind_speed_10m_max[i] ?? 0,
        humidityMean: Math.round(avg(bucket?.humidity ?? [], raw.current.relative_humidity_2m)),
        pressureMean: Math.round(avg(bucket?.pressure ?? [], raw.current.pressure_msl)),
        cloudCoverMean: Math.round(avg(bucket?.clouds ?? [], raw.current.cloud_cover)),
      };
    });

    const currentHourPrefix = raw.current.time.slice(0, 13);
    const matchingHourlyIdx = raw.hourly.time.findIndex((t) => t.startsWith(currentHourPrefix));
    const fallbackVis =
      matchingHourlyIdx >= 0 ? (raw.hourly.visibility[matchingHourlyIdx] ?? 10000) : 10000;
    const fallbackDew =
      matchingHourlyIdx >= 0 ? (raw.hourly.dew_point_2m[matchingHourlyIdx] ?? 0) : 0;
    const fallbackUv = matchingHourlyIdx >= 0 ? (raw.hourly.uv_index[matchingHourlyIdx] ?? 0) : 0;
    const fallbackGusts =
      matchingHourlyIdx >= 0
        ? (raw.hourly.wind_gusts_10m?.[matchingHourlyIdx] ?? raw.current.wind_speed_10m)
        : raw.current.wind_speed_10m;

    const data: WeatherData = {
      city: {...city, timezone: raw.timezone},
      timezone: raw.timezone,
      utcOffsetSeconds: raw.utc_offset_seconds,
      fetchedAt: Date.now(),
      current: {
        time: raw.current.time,
        temperature: raw.current.temperature_2m,
        apparentTemperature: raw.current.apparent_temperature,
        humidity: raw.current.relative_humidity_2m,
        isDay: raw.current.is_day === 1,
        precipitation: raw.current.precipitation,
        weatherCode: raw.current.weather_code,
        cloudCover: raw.current.cloud_cover,
        pressure: raw.current.pressure_msl,
        windSpeed: raw.current.wind_speed_10m,
        windGusts: raw.current.wind_gusts_10m ?? fallbackGusts,
        windDirection: raw.current.wind_direction_10m,
        visibility: raw.current.visibility ?? fallbackVis,
        dewPoint: raw.current.dew_point_2m ?? fallbackDew,
        uvIndex: raw.current.uv_index ?? fallbackUv,
      },
      hourly,
      daily,
      airQuality,
      isCached: false,
    };

    writeCacheEntry(getCityCacheKey(city), data);
    return data;
  } catch (err) {
    if (signal?.aborted) {
      throw err;
    }
    const cached = getCachedWeather(city);
    if (cached) {
      return cached;
    }
    throw err;
  }
}

export async function fetchMapGrid(
  bounds: {north: number; south: number; east: number; west: number},
  signal?: AbortSignal
): Promise<MapGridPoint[]> {
  const latSpan = Math.max(0.4, Math.min(35, bounds.north - bounds.south));
  const lonSpan = Math.max(0.4, Math.min(60, bounds.east - bounds.west));
  const centerLat = (bounds.north + bounds.south) / 2;
  const centerLon = (bounds.east + bounds.west) / 2;

  const minLat = Math.max(-82, centerLat - latSpan * 0.42);
  const maxLat = Math.min(82, centerLat + latSpan * 0.42);
  const minLon = centerLon - lonSpan * 0.42;
  const maxLon = centerLon + lonSpan * 0.42;

  const steps = 5;
  const lats: number[] = [];
  const lons: number[] = [];

  for (let r = 0; r < steps; r++) {
    const lat = minLat + ((maxLat - minLat) * r) / (steps - 1);
    for (let c = 0; c < steps; c++) {
      let lon = minLon + ((maxLon - minLon) * c) / (steps - 1);
      lon = ((((lon + 180) % 360) + 360) % 360) - 180;
      lats.push(Number(lat.toFixed(3)));
      lons.push(Number(lon.toFixed(3)));
    }
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lats.join(','));
  url.searchParams.set('longitude', lons.join(','));
  url.searchParams.set(
    'current',
    'temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,cloud_cover'
  );

  const res = await fetch(url.toString(), {signal});
  if (!res.ok) {
    throw new Error(`Grid fetch failed: ${res.status}`);
  }
  const json = (await res.json()) as
    | Array<{
        latitude: number;
        longitude: number;
        current: {
          temperature_2m: number;
          precipitation: number;
          wind_speed_10m: number;
          wind_direction_10m: number;
          cloud_cover: number;
        };
      }>
    | {
        latitude: number;
        longitude: number;
        current: {
          temperature_2m: number;
          precipitation: number;
          wind_speed_10m: number;
          wind_direction_10m: number;
          cloud_cover: number;
        };
      };

  const list = Array.isArray(json) ? json : [json];
  return list.map((item, idx) => ({
    lat: lats[idx] ?? item.latitude,
    lon: lons[idx] ?? item.longitude,
    temperature: item.current.temperature_2m ?? 0,
    precipitation: item.current.precipitation ?? 0,
    windSpeed: item.current.wind_speed_10m ?? 0,
    windDirection: item.current.wind_direction_10m ?? 0,
    cloudCover: item.current.cloud_cover ?? 0,
  }));
}
