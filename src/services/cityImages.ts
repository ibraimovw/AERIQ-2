import type {CityImageAttribution, CityLocation} from '../types/weather';

const MEMORY_IMAGE_CACHE = new Map<string, CityImageAttribution | null>();
const STORAGE_IMAGE_KEY = 'aerwave_city_panoramas_v7';
const MAX_STORED_PANORAMAS = 40;

const REJECT_PATTERNS =
  /flag|coat_of_arms|coat-of-arms|arms|seal|emblem|logo|locator|location_map|location-map|map|diagram|chart|graph|metro_map|stamp|coin|portrait|signature|icon|symbol|banner|ambox|shackle|statistical|art_project|painting|fresco/i;

const PREFER_PATTERNS =
  /skyline|panorama|cityscape|aerial|downtown|view|harbor|harbour|waterfront|bridge|night|sunset|tower|center|centre|square|kremlin|cathedral|river/i;

function stripHtml(input?: string): string | undefined {
  if (!input) return undefined;
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function readStoredPanorama(cacheKey: string): CityImageAttribution | null | undefined {
  try {
    if (typeof localStorage === 'undefined') return undefined;
    const raw = localStorage.getItem(STORAGE_IMAGE_KEY);
    if (!raw) return undefined;
    const store = JSON.parse(raw) as Record<string, {data: CityImageAttribution | null; savedAt: number}>;
    const entry = store[cacheKey];
    if (!entry) return undefined;
    if (Date.now() - entry.savedAt > 7 * 24 * 60 * 60 * 1000) return undefined;
    return entry.data;
  } catch {
    return undefined;
  }
}

function writeStoredPanorama(cacheKey: string, data: CityImageAttribution | null): void {
  try {
    if (typeof localStorage === 'undefined' || !data) return;
    const raw = localStorage.getItem(STORAGE_IMAGE_KEY);
    const store: Record<string, {data: CityImageAttribution | null; savedAt: number}> = raw
      ? JSON.parse(raw)
      : {};
    store[cacheKey] = {data, savedAt: Date.now()};
    const keys = Object.keys(store);
    if (keys.length > MAX_STORED_PANORAMAS) {
      keys
        .sort((a, b) => store[a].savedAt - store[b].savedAt)
        .slice(0, keys.length - MAX_STORED_PANORAMAS)
        .forEach((k) => delete store[k]);
    }
    localStorage.setItem(STORAGE_IMAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage quota errors
  }
}

interface WikiImagePage {
  title?: string;
  imageinfo?: Array<{
    thumburl?: string;
    url?: string;
    width?: number;
    height?: number;
    descriptionurl?: string;
    extmetadata?: {
      Artist?: {value?: string};
      LicenseShortName?: {value?: string};
    };
  }>;
}

interface WikiSearchPage {
  index?: number;
  title?: string;
  description?: string;
  pageimage?: string;
  coordinates?: Array<{lat: number; lon: number}>;
  thumbnail?: {source: string; width: number; height: number};
  original?: {source: string; width: number; height: number};
}

interface WikiRestSummary {
  type?: string;
  title?: string;
  coordinates?: {lat: number; lon: number};
  thumbnail?: {source: string; width: number; height: number};
  originalimage?: {source: string; width: number; height: number};
  content_urls?: {desktop?: {page?: string}};
}

function scoreImageCandidate(title: string, width: number, height: number, url: string): number {
  if (!/\.(jpe?g|png|webp)(\?|$)/i.test(url)) return -1;
  const filenamePart = url.split('?')[0]?.split('/').pop() ?? '';
  if (REJECT_PATTERNS.test(title) || REJECT_PATTERNS.test(filenamePart)) return -1;
  if (width < 700 || height < 350) return -1;

  const ratio = width / height;
  if (ratio < 1.15 || ratio > 4.2) return -1;

  let score = 15;
  if (ratio >= 1.4 && ratio <= 2.6) score += 15;
  if (width >= 1200) score += 10;
  if (PREFER_PATTERNS.test(title) || PREFER_PATTERNS.test(filenamePart)) score += 20;
  if (/montage/i.test(title) || /montage/i.test(filenamePart)) score -= 4;
  return score;
}

async function fetchWikipediaRestSummary(
  city: CityLocation,
  langSubdomain: 'en' | 'ru',
  candidateTitle: string,
  signal?: AbortSignal
): Promise<CityImageAttribution | null> {
  if (!candidateTitle) return null;
  const slug = encodeURIComponent(candidateTitle.trim().replace(/\s+/g, '_'));
  const res = await fetch(`https://${langSubdomain}.wikipedia.org/api/rest_v1/page/summary/${slug}`, {
    signal,
  });
  if (!res.ok) return null;

  const data = (await res.json()) as WikiRestSummary;
  if (data.type === 'disambiguation') return null;

  if (
    data.coordinates &&
    haversineKm(city.latitude, city.longitude, data.coordinates.lat, data.coordinates.lon) > 150
  ) {
    return null;
  }

  const img = data.originalimage ?? data.thumbnail;
  if (!img?.source) return null;

  const score = scoreImageCandidate(data.title ?? candidateTitle, img.width, img.height, img.source);
  if (score < 15) return null;

  return {
    url: img.source,
    title: data.title ?? candidateTitle,
    sourceUrl: data.content_urls?.desktop?.page,
  };
}

async function fetchWikipediaCitySearchImage(
  city: CityLocation,
  langSubdomain: 'en' | 'ru',
  signal?: AbortSignal
): Promise<CityImageAttribution | null> {
  const cityName =
    langSubdomain === 'en'
      ? (city.localized?.en?.name ?? (/^[\x20-\x7E]+$/.test(city.name) ? city.name : ''))
      : (city.localized?.ru?.name ?? city.name);

  if (!cityName) return null;

  const countryName =
    langSubdomain === 'en'
      ? (city.localized?.en?.country ?? (/^[\x20-\x7E]+$/.test(city.country) ? city.country : ''))
      : (city.localized?.ru?.country ?? city.country);

  const searchUrl = new URL(`https://${langSubdomain}.wikipedia.org/w/api.php`);
  searchUrl.searchParams.set('action', 'query');
  searchUrl.searchParams.set('generator', 'search');
  searchUrl.searchParams.set('gsrsearch', [cityName, countryName].filter(Boolean).join(' '));
  searchUrl.searchParams.set('gsrlimit', '5');
  searchUrl.searchParams.set('prop', 'pageimages|description|coordinates');
  searchUrl.searchParams.set('piprop', 'name|thumbnail|original');
  searchUrl.searchParams.set('pithumbsize', '1400');
  searchUrl.searchParams.set('format', 'json');
  searchUrl.searchParams.set('origin', '*');

  const res = await fetch(searchUrl.toString(), {signal});
  if (!res.ok) return null;

  const json = (await res.json()) as {
    query?: {pages?: Record<string, WikiSearchPage>};
  };

  const pages = Object.values(json.query?.pages ?? {}).sort(
    (a, b) => (a.index ?? 99) - (b.index ?? 99)
  );

  for (const page of pages) {
    const thumb = page.thumbnail ?? page.original;
    if (!thumb?.source) continue;

    const coords = page.coordinates?.[0];
    if (coords && haversineKm(city.latitude, city.longitude, coords.lat, coords.lon) > 150) {
      continue;
    }

    const fileTitle = page.pageimage ?? page.title ?? '';
    const score = scoreImageCandidate(fileTitle, thumb.width, thumb.height, thumb.source);
    if (score >= 15) {
      return {
        url: thumb.source,
        title: (page.pageimage ?? page.title ?? cityName)
          .replace(/\.[^.]+$/, '')
          .replace(/_/g, ' '),
        sourceUrl: page.title
          ? `https://${langSubdomain}.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`
          : undefined,
      };
    }
  }

  return null;
}

async function fetchCommonsSkylineFallback(
  cityName: string,
  signal?: AbortSignal
): Promise<CityImageAttribution | null> {
  if (!cityName) return null;
  const commonsUrl = new URL('https://commons.wikimedia.org/w/api.php');
  commonsUrl.searchParams.set('action', 'query');
  commonsUrl.searchParams.set('generator', 'search');
  commonsUrl.searchParams.set(
    'gsrsearch',
    `"${cityName}" (skyline OR panorama OR cityscape) filetype:bitmap`
  );
  commonsUrl.searchParams.set('gsrnamespace', '6');
  commonsUrl.searchParams.set('gsrlimit', '6');
  commonsUrl.searchParams.set('prop', 'imageinfo');
  commonsUrl.searchParams.set('iiprop', 'url|size|extmetadata');
  commonsUrl.searchParams.set('iiurlwidth', '1400');
  commonsUrl.searchParams.set('format', 'json');
  commonsUrl.searchParams.set('origin', '*');

  const res = await fetch(commonsUrl.toString(), {signal});
  if (!res.ok) return null;

  const json = (await res.json()) as {query?: {pages?: Record<string, WikiImagePage>}};
  const pages = Object.values(json.query?.pages ?? {});
  let best: {score: number; item: CityImageAttribution} | null = null;

  for (const p of pages) {
    const info = p.imageinfo?.[0];
    if (!info) continue;
    const imgUrl = info.thumburl ?? info.url ?? '';
    const score = scoreImageCandidate(p.title ?? '', info.width ?? 0, info.height ?? 0, imgUrl);
    if (score >= 15 && (!best || score > best.score)) {
      best = {
        score,
        item: {
          url: imgUrl,
          title: (p.title ?? '').replace(/^File:/i, '').replace(/\.[^.]+$/, ''),
          artist: stripHtml(info.extmetadata?.Artist?.value),
          license: stripHtml(info.extmetadata?.LicenseShortName?.value),
          sourceUrl: info.descriptionurl,
        },
      };
    }
  }

  return best?.item ?? null;
}

export async function fetchCityPanorama(
  city: CityLocation,
  signal?: AbortSignal
): Promise<CityImageAttribution | null> {
  const cacheKey = `${city.latitude.toFixed(2)},${city.longitude.toFixed(2)}`;
  if (MEMORY_IMAGE_CACHE.has(cacheKey)) {
    return MEMORY_IMAGE_CACHE.get(cacheKey) ?? null;
  }
  const stored = readStoredPanorama(cacheKey);
  if (stored !== undefined) {
    MEMORY_IMAGE_CACHE.set(cacheKey, stored);
    return stored;
  }

  try {
    const enName = city.localized?.en?.name ?? (/^[\x20-\x7E]+$/.test(city.name) ? city.name : '');
    const ruName = city.localized?.ru?.name ?? city.name;

    // 1. Fast CDN-cached Wikipedia REST summary lookup (exact city & disambiguation-safe)
    const restCandidates: Array<{lang: 'en' | 'ru'; title: string}> = [];
    if (enName) {
      restCandidates.push({lang: 'en', title: enName});
      if (!/\bcity\b/i.test(enName)) {
        restCandidates.push({lang: 'en', title: `${enName} City`});
      }
    }
    if (ruName) {
      restCandidates.push({lang: 'ru', title: ruName});
    }

    for (const candidate of restCandidates) {
      const restResult = await fetchWikipediaRestSummary(
        city,
        candidate.lang,
        candidate.title,
        signal
      );
      if (restResult) {
        MEMORY_IMAGE_CACHE.set(cacheKey, restResult);
        writeStoredPanorama(cacheKey, restResult);
        return restResult;
      }
    }

    // 2. Wikipedia search API fallback for smaller towns or compound names
    const enSearch = await fetchWikipediaCitySearchImage(city, 'en', signal);
    if (enSearch) {
      MEMORY_IMAGE_CACHE.set(cacheKey, enSearch);
      writeStoredPanorama(cacheKey, enSearch);
      return enSearch;
    }

    const ruSearch = await fetchWikipediaCitySearchImage(city, 'ru', signal);
    if (ruSearch) {
      MEMORY_IMAGE_CACHE.set(cacheKey, ruSearch);
      writeStoredPanorama(cacheKey, ruSearch);
      return ruSearch;
    }

    // 3. Wikimedia Commons skyline fallback
    const commonsResult = await fetchCommonsSkylineFallback(enName || ruName, signal);
    MEMORY_IMAGE_CACHE.set(cacheKey, commonsResult);
    writeStoredPanorama(cacheKey, commonsResult);
    return commonsResult;
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw err;
    }
    return null;
  }
}
