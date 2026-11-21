export type Language = 'ru' | 'en';
export type TempUnit = 'C' | 'F';
export type NavSection = 'home' | 'forecast' | 'map' | 'favorites';
export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';
export type WeatherMood = 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog' | 'storm';
export type HomePreset = 'now' | 'today' | 'tomorrow' | 'weekend';

export type ForecastMetricKey =
  | 'temperature'
  | 'feelsLike'
  | 'precipProb'
  | 'precipSum'
  | 'humidity'
  | 'windSpeed'
  | 'pressure'
  | 'uvIndex'
  | 'cloudCover';

export type MapLayerKey = 'temp' | 'precip' | 'wind' | 'clouds';

export interface LocalizedCityName {
  name: string;
  country: string;
  admin1?: string;
}

export interface CityLocation {
  id: string;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  localized?: Partial<Record<Language, LocalizedCityName>>;
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  isDay: boolean;
  precipitation: number;
  weatherCode: number;
  cloudCover: number;
  pressure: number;
  windSpeed: number;
  windGusts: number;
  windDirection: number;
  visibility: number; // meters
  dewPoint: number;
  uvIndex: number;
}

export interface HourlyPoint {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipProb: number;
  precipitation: number;
  weatherCode: number;
  pressure: number;
  windSpeed: number;
  windGusts: number;
  visibility: number;
  uvIndex: number;
  cloudCover: number;
  isDay: boolean;
}

export interface DailyForecastPoint {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  feelsMax: number;
  feelsMin: number;
  sunrise: string;
  sunset: string;
  uvMax: number;
  precipSum: number;
  precipProbMax: number;
  windMax: number;
  humidityMean: number;
  pressureMean: number;
  cloudCoverMean: number;
}

export interface AirQualityData {
  europeanAqi: number;
  usAqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  ozone: number;
}

export interface WeatherData {
  city: CityLocation;
  timezone: string;
  utcOffsetSeconds: number;
  fetchedAt: number;
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyForecastPoint[];
  airQuality?: AirQualityData | null;
  isCached?: boolean;
  cachedAt?: number;
}

export interface CityImageAttribution {
  url: string;
  title: string;
  artist?: string;
  license?: string;
  sourceUrl?: string;
}

export interface WeatherInsight {
  id: string;
  category: 'feels' | 'wind' | 'precip' | 'swing' | 'activity';
  title: string;
  description: string;
  severity: 'info' | 'notice' | 'alert';
}

export interface WeatherAlert {
  id: string;
  severity: 'caution' | 'warning';
  title: string;
  description: string;
}

export interface MapGridPoint {
  lat: number;
  lon: number;
  temperature: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  cloudCover: number;
}

export interface FavoriteCityWeatherSummary {
  city: CityLocation;
  temperature: number;
  weatherCode: number;
  tempMin: number;
  tempMax: number;
  isDay: boolean;
  timezone: string;
  sunrise?: string;
  sunset?: string;
  updatedAt: number;
}
