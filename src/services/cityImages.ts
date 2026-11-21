import type {CityImageAttribution, CityLocation} from '../types/weather';

const MEMORY_IMAGE_CACHE = new Map<string, CityImageAttribution | null>();

const REJECT_PATTERNS =
  /flag|coat_of_arms|coat-of-arms|arms|seal|emblem|logo|map|locator|location|diagram|chart|graph|metro|transit|stamp|coin|portrait|signature|icon|symbol|banner|wiki/i;

const PREFER_PATTERNS =
  /skyline|panorama|cityscape|aerial|downtown|view|harbor|harbour|waterfront|bridge|night|sunset|tower|center|centre|square|kremlin|river/i;

function stripHtml(input?: string): string | undefined {
  if (!input) return undefined;
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

function scoreImageCandidate(title: string, width: number, height: number, url: string): number {
  if (!/\.(jpe?g|png|webp)(\?|$)/i.test(url)) return -1;
  if (REJECT_PATTERNS.test(title) || REJECT_PATTERNS.test(url)) return -1;
  if (width < 850 || height < 400) return -1;

  const ratio = width / height;
  if (ratio < 1.25 || ratio > 4.2) return -1;

  let score = 10;
  if (ratio >= 1.5 && ratio <= 2.6) score += 15;
  if (width >= 1200) score += 10;
  if (PREFER_PATTERNS.test(title)) score += 25;
  if (/montage/i.test(title)) score -= 12;
  return score;
}

async function fetchWikipediaArticleTitle(
  city: CityLocation,
  langSubdomain: 'en' | 'ru',
  signal?: AbortSignal
): Promise<string | null> {
  const nameToQuery =
    langSubdomain === 'en'
      ? (city.localized?.en?.name ?? city.name)
      : (city.localized?.ru?.name ?? city.name);

  // Use Wikipedia GeoSearch around the city coordinates first to get the exact Wikipedia article
  const geoUrl = new URL(`https://${langSubdomain}.wikipedia.org/w/api.php`);
  geoUrl.searchParams.set('action', 'query');
  geoUrl.searchParams.set('list', 'geosearch');
  geoUrl.searchParams.set('gscoord', `${city.latitude.toFixed(4)}|${city.longitude.toFixed(4)}`);
  geoUrl.searchParams.set('gsradius', '10000');
  geoUrl.searchParams.set('gslimit', '8');
  geoUrl.searchParams.set('format', 'json');
  geoUrl.searchParams.set('origin', '*');

  try {
    const geoRes = await fetch(geoUrl.toString(), {signal});
    if (geoRes.ok) {
      const geoJson = (await geoRes.json()) as {
        query?: {geosearch?: Array<{title: string; dist: number}>};
      };
      const results = geoJson.query?.geosearch ?? [];
      const exactMatch = results.find((r) =>
        r.title.toLowerCase().includes(nameToQuery.toLowerCase())
      );
      if (exactMatch) return exactMatch.title;
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
  }

  return nameToQuery;
}

async function fetchWikipediaCityImages(
  city: CityLocation,
  langSubdomain: 'en' | 'ru',
  signal?: AbortSignal
): Promise<CityImageAttribution | null> {
  const articleTitle = await fetchWikipediaArticleTitle(city, langSubdomain, signal);
  if (!articleTitle) return null;

  // 1. Check the curated Wikipedia page image (lead infobox image) + all article images
  const url = new URL(`https://${langSubdomain}.wikipedia.org/w/api.php`);
  url.searchParams.set('action', 'query');
  url.searchParams.set('titles', articleTitle);
  url.searchParams.set('redirects', '1');
  url.searchParams.set('prop', 'pageimages');
  url.searchParams.set('piprop', 'original|thumbnail');
  url.searchParams.set('pithumbsize', '1400');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');

  let leadImageFileName: string | null = null;

  const pageRes = await fetch(url.toString(), {signal});
  if (pageRes.ok) {
    const pageJson = (await pageRes.json()) as {
      query?: {
        pages?: Record<
          string,
          {
            title?: string;
            pageimage?: string;
            thumbnail?: {source: string; width: number; height: number};
            original?: {source: string; width: number; height: number};
          }
        >;
      };
    };
    const page = Object.values(pageJson.query?.pages ?? {})[0];
    if (page?.pageimage) {
      leadImageFileName = page.pageimage;
    }
    const thumb = page?.thumbnail ?? page?.original;
    if (thumb && page?.pageimage) {
      const s = scoreImageCandidate(page.pageimage, thumb.width, thumb.height, thumb.source);
      if (s >= 20 && !/montage/i.test(page.pageimage)) {
        return {
          url: thumb.source,
          title: page.pageimage.replace(/\.[^.]+$/, '').replace(/_/g, ' '),
          sourceUrl: `https://${langSubdomain}.wikipedia.org/wiki/File:${encodeURIComponent(page.pageimage)}`,
        };
      }
    }
  }

  // 2. Query images embedded in that exact Wikipedia city article, scored for panoramic landscape views
  const imagesUrl = new URL(`https://${langSubdomain}.wikipedia.org/w/api.php`);
  imagesUrl.searchParams.set('action', 'query');
  imagesUrl.searchParams.set('titles', articleTitle);
  imagesUrl.searchParams.set('redirects', '1');
  imagesUrl.searchParams.set('generator', 'images');
  imagesUrl.searchParams.set('gimlimit', '24');
  imagesUrl.searchParams.set('prop', 'imageinfo');
  imagesUrl.searchParams.set('iiprop', 'url|size|extmetadata');
  imagesUrl.searchParams.set('iiurlwidth', '1400');
  imagesUrl.searchParams.set('format', 'json');
  imagesUrl.searchParams.set('origin', '*');

  const imgRes = await fetch(imagesUrl.toString(), {signal});
  if (!imgRes.ok) return null;

  const imgJson = (await imgRes.json()) as {
    query?: {pages?: Record<string, WikiImagePage>};
  };
  const pages = Object.values(imgJson.query?.pages ?? {});

  let best: {score: number; item: CityImageAttribution} | null = null;
  for (const p of pages) {
    const info = p.imageinfo?.[0];
    const title = p.title ?? '';
    if (!info) continue;
    const imgUrl = info.thumburl ?? info.url ?? '';
    const w = info.width ?? 0;
    const h = info.height ?? 0;
    let score = scoreImageCandidate(title, w, h, imgUrl);
    if (score < 0) continue;
    if (leadImageFileName && title.includes(leadImageFileName)) {
      score += 8;
    }
    if (!best || score > best.score) {
      best = {
        score,
        item: {
          url: imgUrl,
          title: title.replace(/^File:/i, '').replace(/\.[^.]+$/, ''),
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

  try {
    // 1. Primary: curated lead/panorama image from the city's English Wikipedia article
    const enResult = await fetchWikipediaCityImages(city, 'en', signal);
    if (enResult) {
      MEMORY_IMAGE_CACHE.set(cacheKey, enResult);
      return enResult;
    }

    // 2. Secondary: Russian Wikipedia article for regional/CIS cities
    const ruResult = await fetchWikipediaCityImages(city, 'ru', signal);
    if (ruResult) {
      MEMORY_IMAGE_CACHE.set(cacheKey, ruResult);
      return ruResult;
    }

    // 3. Tertiary: Wikimedia Commons strictly requiring skyline/panorama/cityscape in filename
    const enName = city.localized?.en?.name ?? city.name;
    const commonsUrl = new URL('https://commons.wikimedia.org/w/api.php');
    commonsUrl.searchParams.set('action', 'query');
    commonsUrl.searchParams.set('generator', 'search');
    commonsUrl.searchParams.set(
      'gsrsearch',
      `intitle:"${enName}" (skyline OR panorama OR cityscape) filetype:bitmap`
    );
    commonsUrl.searchParams.set('gsrnamespace', '6');
    commonsUrl.searchParams.set('gsrlimit', '10');
    commonsUrl.searchParams.set('prop', 'imageinfo');
    commonsUrl.searchParams.set('iiprop', 'url|size|extmetadata');
    commonsUrl.searchParams.set('iiurlwidth', '1400');
    commonsUrl.searchParams.set('format', 'json');
    commonsUrl.searchParams.set('origin', '*');

    const res = await fetch(commonsUrl.toString(), {signal});
    if (res.ok) {
      const json = (await res.json()) as {query?: {pages?: Record<string, WikiImagePage>}};
      const pages = Object.values(json.query?.pages ?? {});
      for (const p of pages) {
        const info = p.imageinfo?.[0];
        if (!info) continue;
        const imgUrl = info.thumburl ?? info.url ?? '';
        const score = scoreImageCandidate(p.title ?? '', info.width ?? 0, info.height ?? 0, imgUrl);
        if (score >= 15) {
          const result: CityImageAttribution = {
            url: imgUrl,
            title: (p.title ?? '').replace(/^File:/i, '').replace(/\.[^.]+$/, ''),
            artist: stripHtml(info.extmetadata?.Artist?.value),
            license: stripHtml(info.extmetadata?.LicenseShortName?.value),
            sourceUrl: info.descriptionurl,
          };
          MEMORY_IMAGE_CACHE.set(cacheKey, result);
          return result;
        }
      }
    }

    MEMORY_IMAGE_CACHE.set(cacheKey, null);
    return null;
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw err;
    }
    return null;
  }
}
