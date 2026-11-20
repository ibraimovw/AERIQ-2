import { $ } from "./utils.js";
let requestId = 0;
export async function setCityImage(city) {
  const current = ++requestId;
  const host = $("#heroPhoto");
  host.style.backgroundImage = "";
  host.style.background = "radial-gradient(ellipse at 70% 28%,rgba(150,87,255,.42),transparent 35%),linear-gradient(120deg,#25253b,#10101a 75%)";
  try {
    const url = new URL("https://commons.wikimedia.org/w/api.php");
    url.search = new URLSearchParams({ action:"query", generator:"search", gsrsearch:`${city} city skyline`, gsrnamespace:"6", gsrlimit:"8", prop:"imageinfo", iiprop:"url", iiurlwidth:"1400", format:"json", origin:"*" });
    const response = await fetch(url);
    if (!response.ok) return;
    const data = await response.json();
    const pages = Object.values(data.query?.pages || {});
    const image = pages.find(page => /\.(jpg|jpeg|png|webp)$/i.test(page.imageinfo?.[0]?.thumburl || ""));
    if (current !== requestId || !image) return;
    const src = image.imageinfo[0].thumburl;
    const probe = new Image();
    probe.onload = () => { if (current === requestId) host.style.backgroundImage = `url("${src}")`; };
    probe.src = src;
    $("#photoCredit").textContent = "WIKIMEDIA COMMONS";
  } catch { /* Gradient remains as intentional fallback. */ }
}
