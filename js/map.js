import { $ } from "./utils.js";
let map, marker, baseLayer, radarLayer;
export function initMap() {
  if (map || !window.L) return;
  map = L.map("weatherMap", { zoomControl: true }).setView([42.8746,74.5698], 10);
  baseLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd", maxZoom: 19
  }).addTo(map);
  marker = L.marker([42.8746,74.5698]).addTo(map);
}
export function updateMap(place) {
  if (!map) initMap();
  if (!map) return;
  const coords = [place.latitude, place.longitude];
  map.setView(coords, 9);
  marker?.setLatLng(coords).bindPopup(place.name).openPopup();
  setTimeout(() => map.invalidateSize(), 100);
}
export async function setMapLayer(layerName) {
  if (!map) initMap();
  if (!map) return;
  document.querySelectorAll("[data-layer]").forEach(button => button.classList.toggle("active", button.dataset.layer === layerName));
  if (radarLayer) { map.removeLayer(radarLayer); radarLayer = null; }
  if (layerName === "radar") {
    $("#mapStatus").textContent = "Загрузка радара…";
    try {
      const response = await fetch("https://api.rainviewer.com/public/weather-maps.json");
      if (!response.ok) throw new Error("Radar unavailable");
      const data = await response.json();
      const frames = data.radar?.past || [];
      const frame = frames.at(-1);
      if (!frame?.path) throw new Error("No radar frame");
      radarLayer = L.tileLayer(`${data.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`, { opacity: .62, attribution: "Radar © RainViewer" }).addTo(map);
      $("#mapStatus").textContent = "Радар осадков";
    } catch {
      $("#mapStatus").textContent = "Радар временно недоступен";
    }
  } else $("#mapStatus").textContent = "Базовая карта";
}
