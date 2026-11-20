import { $, $$, formatTime, formatDay, weatherIcon, weatherDescription, celsius, showToast, escapeHTML } from "./utils.js";
import { searchCities, loadWeather, loadAir, getCurrentLocation } from "./weather.js";
import { storage } from "./storage.js";
import { renderForecast, defaultMetricKeys } from "./forecast.js";
import { setCityImage } from "./images.js";
import { updateMap, setMapLayer } from "./map.js";
import { initNavigation } from "./navigation.js";
import { setLanguage, locale, t } from "./localization.js";

let place = { id:"bishkek", name:"Бишкек", country:"Кыргызстан", latitude:42.8746, longitude:74.5698, timezone:"Asia/Bishkek" };
let weather = null;
let unit = storage.unit();
let selectedMetrics = storage.metrics();
if (!Array.isArray(selectedMetrics) || !selectedMetrics.length) selectedMetrics = defaultMetricKeys();
let searchTimer;

function displayTemp(value) { return celsius(value, unit); }
function renderHome(data) {
  const current = data.current, daily = data.daily, hourly = data.hourly;
  const today = 0;
  $("#cityName").textContent = place.name;
  $("#cityCountry").textContent = [place.admin1, place.country].filter(Boolean).join(" · ") || "Местоположение";
  $("#condition").textContent = weatherDescription(current.weather_code);
  $("#temperature").textContent = displayTemp(current.temperature_2m).replace("°","");
  $("#unitLabel").textContent = `°${unit}`;
  $("#feelsLike").textContent = displayTemp(current.apparent_temperature);
  $("#todayHigh").textContent = displayTemp(daily.temperature_2m_max?.[today]);
  $("#todayLow").textContent = displayTemp(daily.temperature_2m_min?.[today]);
  $("#weatherSymbol").textContent = weatherIcon(current.weather_code, current.is_day);
  $("#humidity").textContent = current.relative_humidity_2m == null ? "—" : `${current.relative_humidity_2m}%`;
  $("#wind").textContent = current.wind_speed_10m == null ? "—" : `${Math.round(current.wind_speed_10m)} км/ч`;
  $("#windDirection").textContent = current.wind_direction_10m == null ? "—" : `${Math.round(current.wind_direction_10m)}°`;
  $("#pressure").textContent = current.pressure_msl == null ? "—" : `${Math.round(current.pressure_msl)} hPa`;
  $("#visibility").textContent = current.visibility == null ? "—" : `${(current.visibility / 1000).toFixed(1)} км`;
  $("#uv").textContent = daily.uv_index_max?.[today] == null ? "—" : Number(daily.uv_index_max[today]).toFixed(1);
  $("#uvLabel").textContent = uvLabel(daily.uv_index_max?.[today]);
  $("#dewPoint").textContent = displayTemp(current.dew_point_2m);
  $("#sunrise").textContent = formatTime(daily.sunrise?.[today]);
  $("#sunset").textContent = formatTime(daily.sunset?.[today]);
  if (daily.sunrise?.[today] && daily.sunset?.[today]) {
    const minutes = (new Date(daily.sunset[today]) - new Date(daily.sunrise[today])) / 60000;
    $("#dayLength").textContent = `${Math.floor(minutes/60)} ч ${Math.round(minutes%60)} мин`;
  }
  $("#localTime").textContent = formatTime(current.time, locale(), {hour:"2-digit",minute:"2-digit"});
  $("#updatedAt").textContent = `ОБНОВЛЕНО ${formatTime(current.time)}`;
  renderHourly(hourly);
  renderWeek(daily);
  renderInsight(current, daily);
  const isSaved = storage.favorites().some(item => item.id === place.id);
  $("#favoriteButton").classList.toggle("saved", isSaved);
  $("#favoriteButton").innerHTML = `${isSaved ? "★" : "☆"} <span>${isSaved ? t("saved") : t("save")}</span>`;
}
function uvLabel(value) {
  if (value == null) return "Нет данных";
  if (value < 3) return "Низкий";
  if (value < 6) return "Умеренный";
  if (value < 8) return "Высокий";
  if (value < 11) return "Очень высокий";
  return "Экстремальный";
}
function renderHourly(hourly) {
  const now = new Date();
  let start = hourly.time.findIndex(time => new Date(time) >= now);
  if (start < 0) start = 0;
  $("#hourlyList").innerHTML = Array.from({length:24},(_,offset) => {
    const i = start + offset;
    if (i >= hourly.time.length) return "";
    return `<article class="hour-item"><small>${offset === 0 ? "Сейчас" : formatTime(hourly.time[i])}</small><b>${displayTemp(hourly.temperature_2m?.[i])}</b><span>${weatherIcon(hourly.weather_code?.[i])} ${hourly.precipitation_probability?.[i] == null ? "" : `${Math.round(hourly.precipitation_probability[i])}%`}</span></article>`;
  }).join("");
}
function renderWeek(daily) {
  $("#weekList").innerHTML = daily.time.slice(0,7).map((date,i) => `<div class="week-row"><span class="day">${i===0?"Сегодня":formatDay(date)}</span><span class="weather-code">${weatherIcon(daily.weather_code?.[i])}</span><span class="rain">${daily.precipitation_probability_max?.[i] == null ? "—" : `${Math.round(daily.precipitation_probability_max[i])}%`}</span><span class="temps">${displayTemp(daily.temperature_2m_max?.[i])} / ${displayTemp(daily.temperature_2m_min?.[i])}</span></div>`).join("");
}
function renderInsight(current,daily) {
  const temp = current.temperature_2m;
  const wind = current.wind_speed_10m;
  const score = temp == null || wind == null ? null : Math.max(20,Math.min(98,Math.round(95 - Math.abs(temp-21)*2 - Math.max(0,wind-15)*1.3 - (current.precipitation || 0)*8)));
  $("#comfortScore").textContent = score ?? "—";
  $("#comfortText").textContent = score == null ? "Недостаточно данных для оценки." : score > 75 ? "Условия выглядят комфортными для прогулки." : score > 50 ? "Погода умеренно комфортная. Учитывай ветер и температуру." : "На улице может быть некомфортно. Проверь одежду и условия перед выходом.";
  $("#clothingTip").textContent = temp == null ? "Нет данных для рекомендации." : temp < 5 ? "Тёплая куртка и закрытая обувь." : temp < 15 ? "Лёгкая куртка или дополнительный слой." : temp < 25 ? "Комфортная повседневная одежда." : "Лёгкая одежда и вода в течение дня.";
}
function renderAir(data) {
  const current = data?.current;
  if (!current || current.us_aqi == null) {
    $("#aqiValue").textContent = "—"; $("#aqiStatus").textContent = "Нет данных";
    $("#aqiAdvice").textContent = t("noAir"); $("#airMetrics").innerHTML = "";
    return;
  }
  const aqi = current.us_aqi;
  const status = aqi <= 50 ? "Хорошее" : aqi <= 100 ? "Умеренное" : aqi <= 150 ? "Нездоровое для чувствительных групп" : aqi <= 200 ? "Нездоровое" : "Очень нездоровое";
  $("#aqiValue").textContent = Math.round(aqi);
  $("#aqiStatus").textContent = status;
  $("#aqiAdvice").textContent = aqi <= 50 ? "Качество воздуха благоприятное для большинства людей." : "При повышенном AQI чувствительным группам стоит ограничить длительную активность на улице.";
  $("#airMetrics").innerHTML = [["PM2.5",current.pm2_5,"μg/m³"],["PM10",current.pm10,"μg/m³"],["NO₂",current.nitrogen_dioxide,"μg/m³"],["O₃",current.ozone,"μg/m³"]].filter(([,v])=>v!=null).map(([name,value,unit])=>`<span class="air-chip">${name} <b>${Number(value).toFixed(1)} ${unit}</b></span>`).join("");
}
async function refreshWeather() {
  $("#condition").textContent = "Загружаем погоду…";
  try {
    const data = await loadWeather(place);
    weather = data;
    renderHome(data);
    renderForecast(data, selectedMetrics, updateMetrics, unit);
    updateMap(place);
    setCityImage(place.name);
    storage.saveHistory([place,...storage.history().filter(item=>item.id!==place.id)].slice(0,8));
    renderSaved();
  } catch (error) {
    if (error.name === "AbortError") return;
    $("#condition").textContent = "Не удалось загрузить погоду";
    showToast("Ошибка загрузки. Проверь подключение к интернету.");
    console.error(error);
  }
}
function renderSaved() {
  const favorites = storage.favorites();
  $("#favoritesCount").textContent = `${favorites.length} CITIES`;
  $("#favoritesList").innerHTML = favorites.length ? favorites.map(item=>`<article class="favorite-card"><button class="city-open" data-open-city="${escapeHTML(item.id)}"><b>${escapeHTML(item.name)}</b><small>${escapeHTML(item.country || "")}</small></button><button data-remove-city="${escapeHTML(item.id)}" aria-label="Удалить ${escapeHTML(item.name)}">✕</button></article>`).join("") : `<p class="muted">Пока нет сохранённых городов.</p>`;
  $("#historyList").innerHTML = storage.history().map(item=>`<button class="history-item" data-open-city="${escapeHTML(item.id)}">${escapeHTML(item.name)}</button>`).join("");
}
function chooseCity(city) {
  place = city;
  $("#citySearch").value = "";
  $("#searchResults").hidden = true;
  refreshWeather();
}
function initSearch() {
  const input = $("#citySearch"), results = $("#searchResults");
  input.addEventListener("input", () => {
    clearTimeout(searchTimer);
    const query = input.value.trim();
    if (query.length < 2) { results.hidden = true; return; }
    searchTimer = setTimeout(async () => {
      try {
        const cities = await searchCities(query);
        results.innerHTML = cities.map((city,i)=>`<button type="button" data-result="${i}">${escapeHTML(city.name)}<small>${escapeHTML([city.admin1,city.country].filter(Boolean).join(", "))}</small></button>`).join("") || `<p class="muted">Ничего не найдено</p>`;
        results.hidden = false;
        $$("[data-result]",results).forEach(button=>button.addEventListener("click",()=>chooseCity(cities[Number(button.dataset.result)])));
      } catch { results.innerHTML = `<p class="muted">Ошибка поиска городов</p>`; results.hidden = false; }
    },300);
  });
  $("#searchForm").addEventListener("submit", event => { event.preventDefault(); const first = $("[data-result]",results); first?.click(); });
  document.addEventListener("click",event=>{ if(!event.target.closest(".search-box")) results.hidden=true; });
}
function initEvents() {
  $("#favoriteButton").addEventListener("click",()=>{
    const favorites=storage.favorites(); const exists=favorites.some(item=>item.id===place.id);
    const next=exists?favorites.filter(item=>item.id!==place.id):[place,...favorites];
    storage.saveFavorites(next); renderHome(weather); renderSaved();
    showToast(exists?"Город удалён из избранного":"Город добавлен в избранное");
  });
  $("#unitButton").addEventListener("click",()=>{
    unit=unit==="C"?"F":"C"; storage.saveUnit(unit); $("#unitButton").textContent=`°${unit}`;
    if(weather) { renderHome(weather); renderForecast(weather,selectedMetrics,updateMetrics,unit); }
  });
  $("#locationButton").addEventListener("click",async()=>{
    try { const current=await getCurrentLocation(); chooseCity(current); }
    catch(error){ showToast(error.message); }
  });
  $$("[data-language]").forEach(button=>button.addEventListener("click",()=>{setLanguage(button.dataset.language);storage.saveLanguage(button.dataset.language);}));
  $("#clearHistory").addEventListener("click",()=>{storage.saveHistory([]);renderSaved();});
  $("#resetMetrics").addEventListener("click",()=>{selectedMetrics=defaultMetricKeys();storage.saveMetrics(selectedMetrics);if(weather)renderForecast(weather,selectedMetrics,updateMetrics,unit);});
  $$("[data-layer]").forEach(button=>button.addEventListener("click",()=>setMapLayer(button.dataset.layer)));
  $("#favoritesList").addEventListener("click",event=>{
    const open=event.target.closest("[data-open-city]"), remove=event.target.closest("[data-remove-city]");
    if(open){const item=storage.favorites().find(city=>city.id===open.dataset.openCity);if(item)chooseCity(item);location.hash="#home";}
    if(remove){storage.saveFavorites(storage.favorites().filter(city=>city.id!==remove.dataset.removeCity));renderSaved();if(weather)renderHome(weather);}
  });
  $("#historyList").addEventListener("click",event=>{
    const button=event.target.closest("[data-open-city]");if(!button)return;
    const item=storage.history().find(city=>city.id===button.dataset.openCity);if(item){chooseCity(item);location.hash="#home";}
  });
}
function updateMetrics(next) { selectedMetrics=next; storage.saveMetrics(next); if(weather)renderForecast(weather,selectedMetrics,updateMetrics,unit); }
async function init() {
  setLanguage(storage.language());
  $("#unitButton").textContent=`°${unit}`;
  initNavigation(); initSearch(); initEvents(); renderSaved();
  await refreshWeather();
  try { const air=await loadAir(place); renderAir(air); } catch { renderAir(null); }
  window.addEventListener("aeriq:map-visible",()=>updateMap(place));
}
init();
