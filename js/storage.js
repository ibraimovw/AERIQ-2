import { safeStorage } from "./utils.js";
const KEYS = { favorites: "aeriq4-favorites", history: "aeriq4-history", metrics: "aeriq4-metrics", unit: "aeriq4-unit", language: "aeriq4-language" };
export const storage = {
  favorites: () => safeStorage.get(KEYS.favorites, []),
  saveFavorites: value => safeStorage.set(KEYS.favorites, value),
  history: () => safeStorage.get(KEYS.history, []),
  saveHistory: value => safeStorage.set(KEYS.history, value),
  metrics: () => safeStorage.get(KEYS.metrics, ["temperature_2m_max","precipitation_probability_max","uv_index_max"]),
  saveMetrics: value => safeStorage.set(KEYS.metrics, value),
  unit: () => safeStorage.get(KEYS.unit, "C"),
  saveUnit: value => safeStorage.set(KEYS.unit, value),
  language: () => safeStorage.get(KEYS.language, "ru"),
  saveLanguage: value => safeStorage.set(KEYS.language, value)
};
