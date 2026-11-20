import { $, $$, formatDay, celsius, weatherIcon } from "./utils.js";
const METRICS = [
  { key:"temperature_2m_max", label:"Макс. температура", unit:"°", format:v=>celsius(v,unit) },
  { key:"temperature_2m_min", label:"Мин. температура", unit:"°", format:v=>celsius(v,unit) },
  { key:"apparent_temperature_max", label:"Ощущается как", unit:"°", format:v=>celsius(v,unit) },
  { key:"precipitation_probability_max", label:"Вероятность осадков", unit:"%", format:v=>v == null ? "—" : `${Math.round(v)}%` },
  { key:"precipitation_sum", label:"Количество осадков", unit:"мм", format:v=>v == null ? "—" : `${Number(v).toFixed(1)} мм` },
  { key:"wind_speed_10m_max", label:"Скорость ветра", unit:"км/ч", format:v=>v == null ? "—" : `${Math.round(v)} км/ч` },
  { key:"uv_index_max", label:"УФ-индекс", unit:"", format:v=>v == null ? "—" : Number(v).toFixed(1) },
  { key:"sunrise", label:"Рассвет", format:v=>v ? v.slice(11,16) : "—" },
  { key:"sunset", label:"Закат", format:v=>v ? v.slice(11,16) : "—" }
];
export function renderForecast(data, selected, onChange, unit = "C") {
  const toggleHost = $("#metricToggles");
  toggleHost.innerHTML = METRICS.map(metric => `<button class="metric-toggle ${selected.includes(metric.key) ? "active" : ""}" data-metric="${metric.key}" aria-pressed="${selected.includes(metric.key)}">${metric.label}</button>`).join("");
  $$("[data-metric]", toggleHost).forEach(button => button.addEventListener("click", () => {
    const key = button.dataset.metric;
    const next = selected.includes(key) ? selected.filter(item => item !== key) : [...selected, key];
    onChange(next.length ? next : [METRICS[0].key]);
  }));
  const columns = METRICS.filter(metric => selected.includes(metric.key));
  $("#forecastHead").innerHTML = `<tr><th>Дата</th><th>Погода</th>${columns.map(metric=>`<th>${metric.label}</th>`).join("")}</tr>`;
  $("#forecastBody").innerHTML = data.daily.time.map((date,index) => {
    const code = data.daily.weather_code?.[index];
    return `<tr><td>${formatDay(date)}</td><td>${weatherIcon(code)}</td>${columns.map(metric=>`<td>${metric.format(data.daily[metric.key]?.[index])}</td>`).join("")}</tr>`;
  }).join("");
}
export function defaultMetricKeys() { return METRICS.slice(0,2).map(metric=>metric.key).concat("precipitation_probability_max","uv_index_max"); }
