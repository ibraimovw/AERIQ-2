const IMAGE_CACHE_KEY = 'aeriq_city_images_v4';
const memoryCache = new Map();

function loadPersistentCache() {
  try {
    const raw = localStorage.getItem(IMAGE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function savePersistentCache(obj) {
  try {
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(obj));
  } catch {
    // Ignore storage quota errors
  }
}

function preloadAndVerify(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    const timer = setTimeout(() => {
      img.src = '';
      reject(new Error('Image load timeout'));
    }, 6500);

    img.onload = () => {
      clearTimeout(timer);
      if (img.naturalWidth > 200) {
        resolve(url);
      } else {
        reject(new Error('Image too small'));
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Image load error'));
    };

    img.src = url;
  });
}

async function queryWikimediaCommons(searchQuery, signal) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');
  url.searchParams.set('generator', 'search');
  url.searchParams.set('gsrnamespace', '6');
  url.searchParams.set('gsrlimit', '6');
  url.searchParams.set('gsrsearch', `filetype:bitmap ${searchQuery}`);
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'url|extmetadata');
  url.searchParams.set('iiurlwidth', '1280');

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) return [];
  const data = await res.json();
  const pages = data?.query?.pages ? Object.values(data.query.pages) : [];

  return pages
    .map((page) => {
      const info = page.imageinfo?.[0];
      if (!info) return null;
      const candidateUrl = info.thumburl || info.url;
      if (!candidateUrl || !/\.(jpe?g|png|webp)(\?|$)/i.test(candidateUrl)) return null;
      const rawArtist = info.extmetadata?.Artist?.value || '';
      const cleanArtist = rawArtist.replace(/<[^>]*>/g, '').trim();
      const license = info.extmetadata?.LicenseShortName?.value || 'Wikimedia Commons';
      return {
        url: candidateUrl,
        credit: cleanArtist ? `Wikimedia Commons · ${cleanArtist} (${license})` : `Wikimedia Commons (${license})`,
      };
    })
    .filter(Boolean);
}

export async function updateHeroCityImage(city, signal) {
  const bgEl = document.getElementById('heroBg');
  const creditEl = document.getElementById('heroImageCredit');
  if (!bgEl) return;

  bgEl.classList.remove('is-loaded');
  if (creditEl) {
    creditEl.hidden = true;
    creditEl.textContent = '';
  }

  const cacheKey = `${city.name}_${city.country}`.toLowerCase();
  const persistent = loadPersistentCache();

  if (memoryCache.has(cacheKey) || persistent[cacheKey]) {
    const cached = memoryCache.get(cacheKey) || persistent[cacheKey];
    try {
      await preloadAndVerify(cached.url);
      bgEl.style.backgroundImage = `url("${cached.url}")`;
      bgEl.classList.add('is-loaded');
      if (creditEl && cached.credit) {
        creditEl.textContent = cached.credit;
        creditEl.hidden = false;
      }
      return;
    } catch {
      delete persistent[cacheKey];
      savePersistentCache(persistent);
    }
  }

  const queries = [
    `${city.name} ${city.country} skyline`,
    `${city.name} city`,
    city.country ? `${city.country} landscape` : city.name,
  ];

  for (const q of queries) {
    try {
      const candidates = await queryWikimediaCommons(q, signal);
      for (const item of candidates) {
        try {
          await preloadAndVerify(item.url);
          memoryCache.set(cacheKey, item);
          persistent[cacheKey] = item;
          savePersistentCache(persistent);

          bgEl.style.backgroundImage = `url("${item.url}")`;
          bgEl.classList.add('is-loaded');
          if (creditEl) {
            creditEl.textContent = item.credit;
            creditEl.hidden = false;
          }
          return;
        } catch {
          // Try next candidate
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  // Fallback: keep styled gradient with no broken image
  bgEl.style.backgroundImage = 'none';
}

export function initHeroParallax() {
  const hero = document.getElementById('heroPanel');
  const bg = document.getElementById('heroBg');
  if (!hero || !bg) return;

  hero.addEventListener('pointermove', (e) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = hero.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * -10;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
    bg.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  });

  hero.addEventListener('pointerleave', () => {
    bg.style.transform = 'translate3d(0, 0, 0)';
  });
}
