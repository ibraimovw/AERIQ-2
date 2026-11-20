import { $, $$ } from "./utils.js";
import { initMap } from "./map.js";
let active = "home";
export function navigate(route) {
  const valid = ["home","forecast","map","favorites"];
  const next = valid.includes(route) ? route : "home";
  active = next;
  $$(".view").forEach(view => view.classList.toggle("active", view.dataset.view === next));
  $$("[data-route]").forEach(link => link.classList.toggle("active", link.dataset.route === next));
  if (next === "map") { initMap(); window.dispatchEvent(new Event("aeriq:map-visible")); }
  window.scrollTo({ top: 0, behavior: "smooth" });
}
export function initNavigation() {
  window.addEventListener("hashchange", () => navigate(location.hash.slice(1)));
  $$("[data-route]").forEach(link => link.addEventListener("click", () => navigate(link.dataset.route)));
  navigate(location.hash.slice(1) || "home");
}
export function currentRoute() { return active; }
