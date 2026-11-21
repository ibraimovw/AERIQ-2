import type {
  DayPhase,
  ForecastMetricKey,
  HomePreset,
  Language,
  MapLayerKey,
  WeatherMood,
} from '../types/weather';

export interface TranslationDictionary {
  brandName: string;
  slogan: string;
  version: string;
  nav: {
    home: string;
    forecast: string;
    map: string;
    favorites: string;
    collapseSidebar: string;
    expandSidebar: string;
    menu: string;
  };
  pwa: {
    installBtn: string;
    installShort: string;
    iosTitle: string;
    iosStep1: string;
    iosStep2: string;
    close: string;
    offlineBadge: string;
  };
  topbar: {
    searchPlaceholder: string;
    searching: string;
    noResults: string;
    searchError: string;
    addFavorite: string;
    removeFavorite: string;
    favoriteLimitReached: string;
    langLabel: string;
    unitLabel: string;
    themeDark: string;
    themeLight: string;
  };
  dayPhases: Record<DayPhase, string>;
  weatherMoods: Record<WeatherMood, string>;
  cacheBanner: {
    offlineTitle: string;
    offlineDesc: string;
    retry: string;
  };
  home: {
    localTime: string;
    feelsLike: string;
    high: string;
    low: string;
    photoCredit: string;
    presets: Record<HomePreset, string>;
    presetTomorrowLabel: string;
    presetWeekendLabel: string;
    precipProbLabel: string;
    alertsTitle: string;
    insightsTitle: string;
    insightsSubtitle: string;
    metricsTitle: string;
    metrics: {
      humidity: string;
      wind: string;
      gusts: string;
      pressure: string;
      visibility: string;
      uvIndex: string;
      dewPoint: string;
    };
    pressureTrend: {
      rising: string;
      falling: string;
      steady: string;
    };
    aqi: {
      title: string;
      european: string;
      pm25: string;
      pm10: string;
      no2: string;
      ozone: string;
      levels: {
        good: string;
        fair: string;
        moderate: string;
        poor: string;
        veryPoor: string;
      };
    };
    units: {
      kmh: string;
      hpa: string;
      km: string;
      mm: string;
      ugm3: string;
    };
    sunTitle: string;
    sunrise: string;
    sunset: string;
    goldenHour: string;
    moonPhase: string;
    illumination: string;
    hourlyTitle: string;
    hourlySparklineTitle: string;
    now: string;
    daily8Title: string;
    daily8SparklineTitle: string;
    open16Days: string;
    today: string;
    mapPreviewTitle: string;
    mapPreviewDesc: string;
    openMap: string;
  };
  forecast: {
    title: string;
    subtitle: string;
    sparklineTitle: string;
    parametersLabel: string;
    minOneParamHint: string;
    dateCol: string;
    conditionCol: string;
    sunriseLabel: string;
    sunsetLabel: string;
    metrics: Record<ForecastMetricKey, string>;
  };
  map: {
    title: string;
    subtitle: string;
    refreshing: string;
    refreshBtn: string;
    layers: Record<MapLayerKey, string>;
    disclaimer: string;
    legendTitle: string;
    activeCity: string;
    gridUpdated: string;
    units: {
      precip: string;
      wind: string;
      clouds: string;
    };
  };
  favorites: {
    title: string;
    subtitle: string;
    counterSuffix: string;
    emptyTitle: string;
    emptyDesc: string;
    quickAddTitle: string;
    openCity: string;
    showOnMap: string;
    removeCity: string;
    moveUp: string;
    moveDown: string;
    compareToggle: string;
    compareSelectHint: string;
    compareTitle: string;
    clearCompare: string;
    localTimeLabel: string;
    loadingWeather: string;
  };
  errors: {
    loadFailedTitle: string;
    loadFailedDesc: string;
    retry: string;
  };
  uvLevels: {
    low: string;
    moderate: string;
    high: string;
    veryHigh: string;
    extreme: string;
  };
  windDirs: string[];
  wmo: Record<number, string>;
}

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  ru: {
    brandName: 'AER.wave',
    slogan: 'Beyond the forecast',
    version: 'v7',
    nav: {
      home: 'Главная',
      forecast: 'Прогноз 16 дн.',
      map: 'Карта',
      favorites: 'Избранное',
      collapseSidebar: 'Свернуть меню',
      expandSidebar: 'Развернуть меню',
      menu: 'Меню',
    },
    pwa: {
      installBtn: 'Установить приложение',
      installShort: 'Установить',
      iosTitle: 'Установка на iPhone / iPad',
      iosStep1: 'Нажмите кнопку «Поделиться» в нижней или верхней панели Safari.',
      iosStep2: 'Выберите пункт «На экран Домой» для запуска как приложение.',
      close: 'Закрыть',
      offlineBadge: 'Офлайн-режим · используются сохранённые данные',
    },
    topbar: {
      searchPlaceholder: 'Поиск города…',
      searching: 'Поиск городов…',
      noResults: 'Городов не найдено',
      searchError: 'Ошибка поиска городов',
      addFavorite: 'Добавить в избранное',
      removeFavorite: 'Удалить из избранного',
      favoriteLimitReached: 'Максимум 10 городов в избранном',
      langLabel: 'ЯЗЫК',
      unitLabel: 'ШКАЛА',
      themeDark: 'Тёмная тема',
      themeLight: 'Светлая тема',
    },
    dayPhases: {
      dawn: 'Рассвет',
      day: 'День',
      dusk: 'Закат',
      night: 'Ночь',
    },
    weatherMoods: {
      clear: 'Ясно',
      cloudy: 'Облачно',
      rain: 'Дождь',
      snow: 'Снег',
      fog: 'Туман',
      storm: 'Гроза',
    },
    cacheBanner: {
      offlineTitle: 'Показаны сохранённые данные из кэша',
      offlineDesc: 'Не удалось обновить прогноз по сети. Последнее обновление:',
      retry: 'Обновить',
    },
    home: {
      localTime: 'Местное время',
      feelsLike: 'Ощущается как',
      high: 'Макс',
      low: 'Мин',
      photoCredit: 'Фото: Wikipedia / Commons',
      presets: {
        now: 'Сейчас',
        today: 'Сегодня',
        tomorrow: 'Завтра',
        weekend: 'Выходные',
      },
      presetTomorrowLabel: 'Прогноз на завтра',
      presetWeekendLabel: 'Ближайшие выходные',
      precipProbLabel: 'Вер. осадков',
      alertsTitle: 'Метеопредупреждения',
      insightsTitle: 'Аналитика и сценарии',
      insightsSubtitle: 'Гардероб, активность и рекомендации по текущим условиям',
      metricsTitle: 'Метеопараметры',
      metrics: {
        humidity: 'Влажность',
        wind: 'Ветер',
        gusts: 'порывы',
        pressure: 'Давление',
        visibility: 'Видимость',
        uvIndex: 'УФ-индекс',
        dewPoint: 'Точка росы',
      },
      pressureTrend: {
        rising: 'Растёт',
        falling: 'Падает',
        steady: 'Стабильно',
      },
      aqi: {
        title: 'Качество воздуха',
        european: 'Индекс EAQI',
        pm25: 'PM2.5',
        pm10: 'PM10',
        no2: 'NO₂',
        ozone: 'Озон O₃',
        levels: {
          good: 'Отличное',
          fair: 'Хорошее',
          moderate: 'Умеренное',
          poor: 'Низкое',
          veryPoor: 'Плохое',
        },
      },
      units: {
        kmh: 'км/ч',
        hpa: 'гПа',
        km: 'км',
        mm: 'мм',
        ugm3: 'мкг/м³',
      },
      sunTitle: 'Солнце и Луна',
      sunrise: 'Восход',
      sunset: 'Закат',
      goldenHour: 'Золотой час',
      moonPhase: 'Фаза Луны',
      illumination: 'освещённость',
      hourlyTitle: 'Почасовой прогноз на 24 часа',
      hourlySparklineTitle: 'Тренд температуры (24 ч)',
      now: 'Сейчас',
      daily8Title: 'Прогноз на 8 дней',
      daily8SparklineTitle: 'Дневные максимумы (8 дн.)',
      open16Days: 'Открыть на 16 дней',
      today: 'Сегодня',
      mapPreviewTitle: 'Интерактивная карта',
      mapPreviewDesc: 'Модельная сетка температуры, осадков, ветра и облачности Open-Meteo',
      openMap: 'Открыть карту',
    },
    forecast: {
      title: 'Расширенный прогноз на 16 дней',
      subtitle: 'Настраиваемые метеорологические параметры и долгосрочный тренд',
      sparklineTitle: 'Динамика максимумов и минимумов на 16 дней',
      parametersLabel: 'Параметры',
      minOneParamHint: 'Минимум 1 параметр должен оставаться активным',
      dateCol: 'Дата',
      conditionCol: 'Погода',
      sunriseLabel: 'Восход',
      sunsetLabel: 'Закат',
      metrics: {
        temperature: 'Температура',
        feelsLike: 'Ощущается как',
        precipProb: 'Вер. осадков',
        precipSum: 'Осадки',
        humidity: 'Влажность',
        windSpeed: 'Ветер',
        pressure: 'Давление',
        uvIndex: 'УФ-индекс',
        cloudCover: 'Облачность',
      },
    },
    map: {
      title: 'Погодная карта Open-Meteo',
      subtitle: 'Пространственная выборка модельных данных по текущей области карты',
      refreshing: 'Обновление сетки…',
      refreshBtn: 'Обновить сетку',
      layers: {
        temp: 'Температура',
        precip: 'Осадки',
        wind: 'Ветер',
        clouds: 'Облачность',
      },
      disclaimer:
        'Отображается расчётная модельная сетка Open-Meteo для выбранной области, а не данные метеорологического спутника или радара в реальном времени.',
      legendTitle: 'Шкала слоя',
      activeCity: 'Выбранный город',
      gridUpdated: 'Сетка обновлена',
      units: {
        precip: 'мм',
        wind: 'км/ч',
        clouds: '%',
      },
    },
    favorites: {
      title: 'Витрина избранных городов',
      subtitle: 'Местное время, атмосфера суток и быстрое сравнение двух локаций',
      counterSuffix: '/ 10',
      emptyTitle: 'Список избранных городов пуст',
      emptyDesc:
        'Добавляйте города кнопкой со звёздочкой в шапке или выберите популярную локацию ниже.',
      quickAddTitle: 'Популярные города',
      openCity: 'Открыть',
      showOnMap: 'На карте',
      removeCity: 'Удалить',
      moveUp: 'Выше',
      moveDown: 'Ниже',
      compareToggle: 'Сравнить 2 города',
      compareSelectHint: 'Выберите 2 города для сравнения',
      compareTitle: 'Сравнение городов',
      clearCompare: 'Сбросить',
      localTimeLabel: 'Время',
      loadingWeather: 'Загрузка…',
    },
    errors: {
      loadFailedTitle: 'Не удалось загрузить прогноз',
      loadFailedDesc: 'Проверьте подключение к сети или выберите другой город.',
      retry: 'Повторить попытку',
    },
    uvLevels: {
      low: 'Низкий',
      moderate: 'Умеренный',
      high: 'Высокий',
      veryHigh: 'Очень высокий',
      extreme: 'Экстремальный',
    },
    windDirs: ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'],
    wmo: {
      0: 'Ясно',
      1: 'Преимущественно ясно',
      2: 'Переменная облачность',
      3: 'Пасмурно',
      45: 'Туман',
      48: 'Изморозь и туман',
      51: 'Лёгкая морось',
      53: 'Умеренная морось',
      55: 'Плотная морось',
      56: 'Ледяная морось',
      57: 'Сильная ледяная морось',
      61: 'Небольшой дождь',
      63: 'Умеренный дождь',
      65: 'Сильный дождь',
      66: 'Ледяной дождь',
      67: 'Сильный ледяной дождь',
      71: 'Небольшой снег',
      73: 'Умеренный снег',
      75: 'Сильный снег',
      77: 'Снежные зёрна',
      80: 'Кратковременный дождь',
      81: 'Ливень',
      82: 'Сильный ливень',
      85: 'Небольшой снегопад',
      86: 'Сильный снегопад',
      95: 'Гроза',
      96: 'Гроза с мелким градом',
      99: 'Гроза с сильным градом',
    },
  },
  en: {
    brandName: 'AER.wave',
    slogan: 'Beyond the forecast',
    version: 'v7',
    nav: {
      home: 'Overview',
      forecast: '16-Day Forecast',
      map: 'Weather Map',
      favorites: 'Favorites',
      collapseSidebar: 'Collapse sidebar',
      expandSidebar: 'Expand sidebar',
      menu: 'Menu',
    },
    pwa: {
      installBtn: 'Install App',
      installShort: 'Install',
      iosTitle: 'Install on iPhone / iPad',
      iosStep1: 'Tap the Share button in the Safari toolbar.',
      iosStep2: 'Scroll down and tap "Add to Home Screen".',
      close: 'Close',
      offlineBadge: 'Offline Mode — Cached data active',
    },
    topbar: {
      searchPlaceholder: 'Search city…',
      searching: 'Searching cities…',
      noResults: 'No cities found',
      searchError: 'City search failed',
      addFavorite: 'Add to favorites',
      removeFavorite: 'Remove from favorites',
      favoriteLimitReached: 'Maximum 10 favorite cities reached',
      langLabel: 'LANG',
      unitLabel: 'UNIT',
      themeDark: 'Dark theme',
      themeLight: 'Light theme',
    },
    dayPhases: {
      dawn: 'Dawn',
      day: 'Day',
      dusk: 'Dusk',
      night: 'Night',
    },
    weatherMoods: {
      clear: 'Clear',
      cloudy: 'Cloudy',
      rain: 'Rain',
      snow: 'Snow',
      fog: 'Fog',
      storm: 'Storm',
    },
    cacheBanner: {
      offlineTitle: 'Showing cached forecast data',
      offlineDesc: 'Network update unavailable. Last synced:',
      retry: 'Refresh',
    },
    home: {
      localTime: 'Local time',
      feelsLike: 'Feels like',
      high: 'High',
      low: 'Low',
      photoCredit: 'Photo: Wikipedia / Commons',
      presets: {
        now: 'Now',
        today: 'Today',
        tomorrow: 'Tomorrow',
        weekend: 'Weekend',
      },
      presetTomorrowLabel: 'Tomorrow Outlook',
      presetWeekendLabel: 'Upcoming Weekend',
      precipProbLabel: 'Precip Prob',
      alertsTitle: 'Weather Alerts',
      insightsTitle: 'Insights & Lifestyle',
      insightsSubtitle: 'Wardrobe, outdoor comfort, and practical guidance',
      metricsTitle: 'Atmospheric Metrics',
      metrics: {
        humidity: 'Humidity',
        wind: 'Wind',
        gusts: 'gusts',
        pressure: 'Pressure',
        visibility: 'Visibility',
        uvIndex: 'UV Index',
        dewPoint: 'Dew Point',
      },
      pressureTrend: {
        rising: 'Rising',
        falling: 'Falling',
        steady: 'Steady',
      },
      aqi: {
        title: 'Air Quality',
        european: 'European AQI',
        pm25: 'PM2.5',
        pm10: 'PM10',
        no2: 'NO₂',
        ozone: 'Ozone O₃',
        levels: {
          good: 'Good',
          fair: 'Fair',
          moderate: 'Moderate',
          poor: 'Poor',
          veryPoor: 'Very Poor',
        },
      },
      units: {
        kmh: 'km/h',
        hpa: 'hPa',
        km: 'km',
        mm: 'mm',
        ugm3: 'µg/m³',
      },
      sunTitle: 'Sun & Moon',
      sunrise: 'Sunrise',
      sunset: 'Sunset',
      goldenHour: 'Golden Hour',
      moonPhase: 'Moon Phase',
      illumination: 'lit',
      hourlyTitle: '24-Hour Hourly Forecast',
      hourlySparklineTitle: '24h Temperature Trend',
      now: 'Now',
      daily8Title: '8-Day Outlook',
      daily8SparklineTitle: '8-Day Highs Trend',
      open16Days: 'Open 16-Day Forecast',
      today: 'Today',
      mapPreviewTitle: 'Interactive Weather Map',
      mapPreviewDesc: 'Open-Meteo model grid for temperature, precipitation, wind, and clouds',
      openMap: 'Open Map',
    },
    forecast: {
      title: '16-Day Extended Forecast',
      subtitle: 'Configurable atmospheric parameters and multi-week trend',
      sparklineTitle: '16-Day High & Low Temperature Trend',
      parametersLabel: 'Parameters',
      minOneParamHint: 'At least 1 parameter must stay active',
      dateCol: 'Date',
      conditionCol: 'Condition',
      sunriseLabel: 'Sunrise',
      sunsetLabel: 'Sunset',
      metrics: {
        temperature: 'Temperature',
        feelsLike: 'Feels like',
        precipProb: 'Precip Prob',
        precipSum: 'Precipitation',
        humidity: 'Humidity',
        windSpeed: 'Wind',
        pressure: 'Pressure',
        uvIndex: 'UV Index',
        cloudCover: 'Cloud Cover',
      },
    },
    map: {
      title: 'Open-Meteo Weather Map',
      subtitle: 'Model grid sampling across the visible map viewport',
      refreshing: 'Updating grid…',
      refreshBtn: 'Refresh Grid',
      layers: {
        temp: 'Temperature',
        precip: 'Precipitation',
        wind: 'Wind',
        clouds: 'Cloud Cover',
      },
      disclaimer:
        'Displays an Open-Meteo numerical model grid for the visible viewport rather than live satellite or Doppler radar imagery.',
      legendTitle: 'Layer Scale',
      activeCity: 'Selected City',
      gridUpdated: 'Grid updated',
      units: {
        precip: 'mm',
        wind: 'km/h',
        clouds: '%',
      },
    },
    favorites: {
      title: 'Saved Cities Showcase',
      subtitle: 'Local time, live atmosphere phase, and side-by-side comparison',
      counterSuffix: '/ 10',
      emptyTitle: 'No favorite cities yet',
      emptyDesc:
        'Bookmark cities using the star button in the top bar or add a popular city below.',
      quickAddTitle: 'Suggested Cities',
      openCity: 'Open',
      showOnMap: 'On Map',
      removeCity: 'Remove',
      moveUp: 'Move up',
      moveDown: 'Move down',
      compareToggle: 'Compare 2 Cities',
      compareSelectHint: 'Select 2 cities to compare',
      compareTitle: 'City Comparison',
      clearCompare: 'Clear',
      localTimeLabel: 'Local',
      loadingWeather: 'Loading…',
    },
    errors: {
      loadFailedTitle: 'Unable to load forecast',
      loadFailedDesc: 'Check your network connection or select another city.',
      retry: 'Try Again',
    },
    uvLevels: {
      low: 'Low',
      moderate: 'Moderate',
      high: 'High',
      veryHigh: 'Very High',
      extreme: 'Extreme',
    },
    windDirs: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
    wmo: {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail',
    },
  },
};
