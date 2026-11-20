const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
let activeController = null;

async function fetchJSON(url, signal) {
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
export async function searchCities(query, lang = "ru") {
  const url = new URL(GEO_URL);
  url.search = new URLSearchParams({ name: query, count: "7", language: lang, format: "json" });
  const data = await fetchJSON(url);
  return (data.results || []).map(place => ({
    id: `${place.id}`, name: place.name, country: place.country || "",
    admin1: place.admin1 || "", latitude: place.latitude, longitude: place.longitude,
    timezone: place.timezone || "auto"
  }));
}
export async function loadWeather(place) {
  if (activeController) activeController.abort();
  activeController = new AbortController();
  const { signal } = activeController;
  const url = new URL(FORECAST_URL);
  const params = {
    latitude: place.latitude, longitude: place.longitude, timezone: "auto", forecast_days: "16",
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,dew_point_2m,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility",
    hourly: "temperature_2m,apparent_temperature,precipitation_probability,precipitation,relative_humidity_2m,wind_speed_10m,pressure_msl,cloud_cover,uv_index,visibility,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
    wind_speed_unit: "kmh"
  };
  url.search = new URLSearchParams(params);
  const data = await fetchJSON(url, signal);
  if (!data.current || !data.daily || !data.hourly) throw new Error("Неполный ответ погодного API");
  return data;
}
export async function loadAir(place) {
  const url = new URL(AIR_URL);
  url.search = new URLSearchParams({
    latitude: place.latitude, longitude: place.longitude, timezone: "auto",
    current: "us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide"
  });
  return fetchJSON(url);
}
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Геолокация не поддерживается браузером"));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ id: "current-location", name: "Моё местоположение", country: "", latitude: coords.latitude, longitude: coords.longitude, timezone: "auto" }),
      error => reject(new Error(error.code === 1 ? "Доступ к геолокации запрещён" : "Не удалось определить местоположение")),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}
