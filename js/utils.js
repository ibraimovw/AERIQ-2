export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
export const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));
export const safeStorage = {
  get(key, fallback) {
    try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  }
};
export function formatTime(iso, locale = "ru-RU", options = { hour: "2-digit", minute: "2-digit" }) {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(locale, options).format(date);
}
export function formatDay(iso, locale = "ru-RU", options = { weekday: "short", day: "numeric", month: "short" }) {
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(locale, options).format(date);
}
export function weatherIcon(code, isDay = 1) {
  if (code === 0) return isDay ? "☀" : "☾";
  if ([1,2].includes(code)) return isDay ? "🌤" : "☁";
  if (code === 3) return "☁";
  if ([45,48].includes(code)) return "🌫";
  if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return "🌧";
  if ([71,73,75,77,85,86].includes(code)) return "❄";
  if ([95,96,99].includes(code)) return "⛈";
  return "◌";
}
export function weatherDescription(code, lang = "ru") {
  const ru = {0:"Ясно",1:"Преимущественно ясно",2:"Переменная облачность",3:"Пасмурно",45:"Туман",48:"Изморозь",51:"Лёгкая морось",53:"Морось",55:"Сильная морось",61:"Небольшой дождь",63:"Дождь",65:"Сильный дождь",71:"Небольшой снег",73:"Снег",75:"Сильный снег",80:"Ливень",81:"Сильный ливень",82:"Очень сильный ливень",95:"Гроза",96:"Гроза с градом",99:"Сильная гроза"};
  const en = {0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Rime fog",51:"Light drizzle",53:"Drizzle",55:"Dense drizzle",61:"Slight rain",63:"Rain",65:"Heavy rain",71:"Light snow",73:"Snow",75:"Heavy snow",80:"Rain showers",81:"Heavy showers",82:"Violent showers",95:"Thunderstorm",96:"Thunderstorm with hail",99:"Severe thunderstorm"};
  return (lang === "ru" ? ru : en)[code] || (lang === "ru" ? "Погодные условия" : "Weather conditions");
}
export function celsius(value, unit) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return `${Math.round(unit === "F" ? Number(value) * 9 / 5 + 32 : Number(value))}°`;
}
export function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}
