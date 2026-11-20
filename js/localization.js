import { $$, $ } from "./utils.js";
const translations = {
  ru: { placeholder:"Найти город...", saved:"В избранном", save:"В избранное", noAir:"Данные о качестве воздуха сейчас недоступны.", good:"Хорошее", moderate:"Умеренное", poor:"Нездоровое", error:"Не удалось загрузить погоду." },
  en: { placeholder:"Search city...", saved:"Saved", save:"Add to favorites", noAir:"Air quality data is currently unavailable.", good:"Good", moderate:"Moderate", poor:"Unhealthy", error:"Could not load weather." }
};
let language = "ru";
export function setLanguage(value) {
  language = value === "en" ? "en" : "ru";
  document.documentElement.lang = language;
  $("#citySearch").placeholder = translations[language].placeholder;
  $$("[data-language]").forEach(button => button.classList.toggle("active", button.dataset.language === language));
}
export const t = key => translations[language][key] || key;
export const locale = () => language === "ru" ? "ru-RU" : "en-US";
export const getLanguage = () => language;
