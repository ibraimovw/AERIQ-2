const STORAGE_LANG_KEY = 'aeriq_lang_v4';

const DICTIONARY = {
  ru: {
    nav: {
      home: 'Главная',
      forecast: 'Расширенный прогноз',
      map: 'Карта',
      favorites: 'Избранное',
      homeShort: 'Главная',
      forecastShort: 'Прогноз',
      mapShort: 'Карта',
      favoritesShort: 'Избранное',
    },
    search: {
      placeholder: 'Поиск города (например: Бишкек, Tokyo)...',
      empty: 'Города не найдены',
      error: 'Ошибка поиска города',
    },
    actions: {
      saveCity: 'В избранное',
      savedCity: 'В избранном',
      open16Days: '16 дней →',
      openMap: 'Открыть карту',
      openCity: 'Открыть',
      remove: 'Удалить',
    },
    hero: {
      localTime: 'Местное время',
      feelsLike: 'Ощущается как',
      max: 'Макс',
      min: 'Мин',
    },
    sections: {
      insights: 'Weather Insights',
      metrics: 'Погодные показатели',
      daylight: 'Восход и закат',
      hourly: 'Почасовой прогноз (24 ч)',
      shortForecast: 'Прогноз на 8 дней',
      mapPreviewTitle: 'Погодная карта',
      mapPreviewDesc: 'Интерактивные слои температуры, осадков, ветра и облачности на базе Open-Meteo.',
    },
    metrics: {
      humidity: 'Влажность',
      wind: 'Скорость ветра',
      pressure: 'Давление',
      visibility: 'Видимость',
      uv: 'УФ-индекс',
      dewPoint: 'Точка росы',
      noData: 'Нет данных',
    },
    daylight: {
      sunrise: 'Восход',
      sunset: 'Закат',
      durationFmt: '{h} ч {m} мин',
    },
    forecast: {
      title: 'Расширенный прогноз на 16 дней',
      subtitle: 'Выберите показатели для отображения в таблице',
      params: {
        temp: 'Температура',
        apparent: 'Ощущается',
        pop: 'Вероятность осадков',
        precip: 'Количество осадков',
        humidity: 'Влажность',
        wind: 'Скорость ветра',
        pressure: 'Давление',
        uv: 'УФ-индекс',
        cloud: 'Облачность',
      },
      dateCol: 'Дата',
    },
    map: {
      title: 'Интерактивная погодная карта',
      gridDisclaimer: 'Модельная сетка точек Open-Meteo (не спутниковый радар)',
      layers: {
        temperature: 'Температура',
        precipitation: 'Осадки',
        wind: 'Ветер',
        cloud: 'Облачность',
      },
      popup: {
        temp: 'Температура',
        precip: 'Осадки',
        wind: 'Ветер',
        cloud: 'Облачность',
      },
    },
    favorites: {
      title: 'Избранные города',
      addCurrent: 'Добавить текущий город',
      empty: 'Список избранного пуст. Сохраните первый город, чтобы быстро переключаться между локациями.',
      limitReached: 'Достигнут лимит: максимум 10 городов в избранном.',
    },
    footer: {
      desc: 'Погодный веб-сервис реального времени',
    },
    errors: {
      offline: 'Нет подключения к интернету. Проверьте сеть и попробуйте снова.',
      weatherFailed: 'Не удалось загрузить погодные данные из Open-Meteo.',
    },
    weatherCodes: {
      0: 'Ясно',
      1: 'Преимущественно ясно',
      2: 'Переменная облачность',
      3: 'Пасмурно',
      45: 'Туман',
      48: 'Изморозь',
      51: 'Лёгкая морось',
      53: 'Умеренная морось',
      55: 'Сильная морось',
      61: 'Небольшой дождь',
      63: 'Умеренный дождь',
      65: 'Сильный дождь',
      66: 'Ледяной дождь',
      67: 'Сильный ледяной дождь',
      71: 'Небольшой снег',
      73: 'Умеренный снег',
      75: 'Сильный снег',
      77: 'Снежные зёрна',
      80: 'Небольшой ливень',
      81: 'Ливень',
      82: 'Сильный ливень',
      85: 'Снегопад',
      86: 'Сильный снегопад',
      95: 'Гроза',
      96: 'Гроза с градом',
      99: 'Сильная гроза с градом',
      unknown: 'Нет данных',
    },
    insights: {
      precipNow: 'Сейчас или в ближайший час ожидаются осадки — стоит взять зонт.',
      strongWind: 'Высокая скорость ветра ({wind} км/ч) — учитывайте порывы на открытых участках.',
      highUv: 'Высокий УФ-индекс ({uv}) — рекомендуется защита от солнца.',
      lowHumidity: 'Низкая влажность ({humidity}%) — воздух достаточно сухой, пейте больше воды.',
      highHumidity: 'Повышенная влажность ({humidity}%) — воздух ощущается более тяжёлым.',
      freezing: 'Температура ниже нуля ({temp}) — возможна гололедица.',
      comfortable: 'Спокойные метеоусловия без резких погодных факторов.',
    },
  },
  en: {
    nav: {
      home: 'Home',
      forecast: 'Extended Forecast',
      map: 'Map',
      favorites: 'Favorites',
      homeShort: 'Home',
      forecastShort: 'Forecast',
      mapShort: 'Map',
      favoritesShort: 'Saved',
    },
    search: {
      placeholder: 'Search city (e.g. Bishkek, Tokyo)...',
      empty: 'No cities found',
      error: 'City search failed',
    },
    actions: {
      saveCity: 'Save city',
      savedCity: 'Saved',
      open16Days: '16 days →',
      openMap: 'Open map',
      openCity: 'Open',
      remove: 'Remove',
    },
    hero: {
      localTime: 'Local time',
      feelsLike: 'Feels like',
      max: 'Max',
      min: 'Min',
    },
    sections: {
      insights: 'Weather Insights',
      metrics: 'Weather Metrics',
      daylight: 'Sunrise & Sunset',
      hourly: 'Hourly Forecast (24h)',
      shortForecast: '8-Day Forecast',
      mapPreviewTitle: 'Weather Map',
      mapPreviewDesc: 'Interactive temperature, precipitation, wind, and cloud cover layers powered by Open-Meteo.',
    },
    metrics: {
      humidity: 'Humidity',
      wind: 'Wind Speed',
      pressure: 'Pressure',
      visibility: 'Visibility',
      uv: 'UV Index',
      dewPoint: 'Dew Point',
      noData: 'No data',
    },
    daylight: {
      sunrise: 'Sunrise',
      sunset: 'Sunset',
      durationFmt: '{h}h {m}m',
    },
    forecast: {
      title: '16-Day Extended Forecast',
      subtitle: 'Toggle meteorological parameters to customize the table',
      params: {
        temp: 'Temperature',
        apparent: 'Feels Like',
        pop: 'Precip. Probability',
        precip: 'Precipitation',
        humidity: 'Humidity',
        wind: 'Wind Speed',
        pressure: 'Pressure',
        uv: 'UV Index',
        cloud: 'Cloud Cover',
      },
      dateCol: 'Date',
    },
    map: {
      title: 'Interactive Weather Map',
      gridDisclaimer: 'Open-Meteo model grid points (not a live satellite radar)',
      layers: {
        temperature: 'Temperature',
        precipitation: 'Precipitation',
        wind: 'Wind',
        cloud: 'Cloud Cover',
      },
      popup: {
        temp: 'Temperature',
        precip: 'Precipitation',
        wind: 'Wind',
        cloud: 'Cloud Cover',
      },
    },
    favorites: {
      title: 'Saved Cities',
      addCurrent: 'Save current city',
      empty: 'No saved cities yet. Add your first city for quick switching.',
      limitReached: 'Limit reached: maximum 10 saved cities.',
    },
    footer: {
      desc: 'Real-time weather web application',
    },
    errors: {
      offline: 'No internet connection. Check your network and try again.',
      weatherFailed: 'Failed to load weather data from Open-Meteo.',
    },
    weatherCodes: {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail',
      unknown: 'No data',
    },
    insights: {
      precipNow: 'Precipitation is active or expected soon — consider taking an umbrella.',
      strongWind: 'High wind speed ({wind} km/h) — watch out for gusts in open areas.',
      highUv: 'High UV index ({uv}) — sun protection is recommended.',
      lowHumidity: 'Low humidity ({humidity}%) — the air is fairly dry, stay hydrated.',
      highHumidity: 'Elevated humidity ({humidity}%) — air may feel heavier.',
      freezing: 'Sub-zero temperature ({temp}) — watch for icy surfaces.',
      comfortable: 'Calm weather conditions with no severe hazards detected.',
    },
  },
};

let currentLang = localStorage.getItem(STORAGE_LANG_KEY) === 'en' ? 'en' : 'ru';

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  currentLang = lang === 'en' ? 'en' : 'ru';
  localStorage.setItem(STORAGE_LANG_KEY, currentLang);
  document.documentElement.lang = currentLang;
  applyStaticTranslations();
  return currentLang;
}

export function t(path, vars = {}) {
  const parts = path.split('.');
  let node = DICTIONARY[currentLang];
  for (const key of parts) {
    if (node && Object.prototype.hasOwnProperty.call(node, key)) {
      node = node[key];
    } else {
      return path;
    }
  }
  if (typeof node !== 'string') return path;
  return node.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

export function getWeatherDescription(code) {
  const dict = DICTIONARY[currentLang].weatherCodes;
  return dict[code] ?? dict.unknown;
}

export function applyStaticTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });

  const searchInput = document.getElementById('citySearchInput');
  if (searchInput) {
    searchInput.placeholder = t('search.placeholder');
  }
}

/**
 * Rule-based deterministic Weather Insights based strictly on real API numbers.
 */
export function buildWeatherInsights(weather, unit = 'c') {
  if (!weather || !weather.current) return [];
  const c = weather.current;
  const items = [];

  const rainyCodes = new Set([51, 53, 55, 61, 63, 65, 66, 67, 71, 73, 75, 80, 81, 82, 85, 86, 95, 96, 99]);
  const nextHourPop = weather.hourly?.precipitationProbability?.[0] ?? 0;

  if (rainyCodes.has(c.weatherCode) || nextHourPop >= 55) {
    items.push({ text: t('insights.precipNow'), tone: 'blue' });
  }

  if (typeof c.windSpeedKmh === 'number' && c.windSpeedKmh >= 30) {
    items.push({ text: t('insights.strongWind', { wind: Math.round(c.windSpeedKmh) }), tone: 'red' });
  }

  if (typeof c.uvIndex === 'number' && c.uvIndex >= 6) {
    items.push({ text: t('insights.highUv', { uv: c.uvIndex.toFixed(1) }), tone: 'pink' });
  }

  if (typeof c.temperatureC === 'number' && c.temperatureC <= 0) {
    const val = unit === 'f' ? `${Math.round((c.temperatureC * 9) / 5 + 32)}°F` : `${Math.round(c.temperatureC)}°C`;
    items.push({ text: t('insights.freezing', { temp: val }), tone: 'blue' });
  }

  if (typeof c.humidity === 'number' && c.humidity <= 30) {
    items.push({ text: t('insights.lowHumidity', { humidity: Math.round(c.humidity) }), tone: 'purple' });
  } else if (typeof c.humidity === 'number' && c.humidity >= 85) {
    items.push({ text: t('insights.highHumidity', { humidity: Math.round(c.humidity) }), tone: 'purple' });
  }

  if (items.length === 0) {
    items.push({ text: t('insights.comfortable'), tone: 'red' });
  }

  return items.slice(0, 3);
}
