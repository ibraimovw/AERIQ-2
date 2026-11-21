import {useCallback, useEffect, useRef, useState} from 'react';
import L from 'leaflet';
import {Info, RefreshCw} from 'lucide-react';
import {GlassPanel} from './GlassPanel';
import {fetchMapGrid} from '../services/weatherApi';
import {convertTemp, formatTemp} from '../utils/weatherHelpers';
import type {CityLocation, MapGridPoint, MapLayerKey, TempUnit} from '../types/weather';
import type {TranslationDictionary} from '../i18n/translations';

interface MapViewProps {
  city: CityLocation;
  unit: TempUnit;
  t: TranslationDictionary;
}

const LAYERS: MapLayerKey[] = ['temp', 'precip', 'wind', 'clouds'];

function getLayerColor(layer: MapLayerKey, point: MapGridPoint): string {
  if (layer === 'temp') {
    const temp = point.temperature;
    if (temp <= -10) return '#3e8cff';
    if (temp <= 0) return '#635bff';
    if (temp <= 10) return '#b83dff';
    if (temp <= 20) return '#f17bd2';
    if (temp <= 28) return '#ff4f83';
    return '#ff2d68';
  }
  if (layer === 'precip') {
    const p = point.precipitation;
    if (p <= 0.1) return '#64748b';
    if (p <= 1.0) return '#3e8cff';
    if (p <= 4.0) return '#635bff';
    return '#b83dff';
  }
  if (layer === 'wind') {
    const w = point.windSpeed;
    if (w < 12) return '#3e8cff';
    if (w < 25) return '#635bff';
    if (w < 40) return '#b83dff';
    return '#ff2d68';
  }
  const c = point.cloudCover;
  if (c < 25) return '#3e8cff';
  if (c < 60) return '#b83dff';
  return '#cbd5e1';
}

function formatGridValue(layer: MapLayerKey, point: MapGridPoint, unit: TempUnit, t: TranslationDictionary): string {
  switch (layer) {
    case 'temp':
      return formatTemp(point.temperature, unit);
    case 'precip':
      return `${point.precipitation.toFixed(1)} ${t.map.units.precip}`;
    case 'wind':
      return `${Math.round(point.windSpeed)} ${t.map.units.wind}`;
    case 'clouds':
      return `${Math.round(point.cloudCover)}${t.map.units.clouds}`;
  }
}

export function MapView({city, unit, t}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const gridLayerRef = useRef<L.LayerGroup | null>(null);
  const cityMarkerRef = useRef<L.CircleMarker | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerKey>('temp');
  const [gridPoints, setGridPoints] = useState<MapGridPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const loadGridForBounds = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const bounds = map.getBounds();
    setIsLoading(true);
    try {
      const points = await fetchMapGrid(
        {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
        controller.signal
      );
      if (!controller.signal.aborted) {
        setGridPoints(points);
        setLastUpdated(Date.now());
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        // Ignore transient move errors silently
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [city.latitude, city.longitude],
      zoom: 6,
      minZoom: 3,
      maxZoom: 11,
      zoomControl: true,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    const gridGroup = L.layerGroup().addTo(map);
    gridLayerRef.current = gridGroup;
    mapRef.current = map;

    let moveTimer: number | null = null;
    const onMoveEnd = () => {
      if (moveTimer) window.clearTimeout(moveTimer);
      moveTimer = window.setTimeout(() => {
        void loadGridForBounds();
      }, 380);
    };

    map.on('moveend', onMoveEnd);
    void loadGridForBounds();

    return () => {
      if (moveTimer) window.clearTimeout(moveTimer);
      map.off('moveend', onMoveEnd);
      abortRef.current?.abort();
      map.remove();
      mapRef.current = null;
      gridLayerRef.current = null;
      cityMarkerRef.current = null;
    };
  }, [loadGridForBounds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setView([city.latitude, city.longitude], 6, {animate: true});

    if (cityMarkerRef.current) {
      cityMarkerRef.current.remove();
    }
    cityMarkerRef.current = L.circleMarker([city.latitude, city.longitude], {
      radius: 7,
      color: '#FFFFFF',
      weight: 2,
      fillColor: '#ff2d68',
      fillOpacity: 1,
    }).addTo(map);

    void loadGridForBounds();
  }, [city.id, city.latitude, city.longitude, loadGridForBounds]);

  useEffect(() => {
    const marker = cityMarkerRef.current;
    if (!marker) return;
    const popupEl = document.createElement('div');
    const titleEl = document.createElement('div');
    titleEl.style.fontWeight = '600';
    titleEl.textContent = city.name;
    const subEl = document.createElement('div');
    subEl.style.fontSize = '11px';
    subEl.style.opacity = '0.8';
    subEl.textContent = t.map.activeCity;
    popupEl.appendChild(titleEl);
    popupEl.appendChild(subEl);
    marker.bindPopup(popupEl);
  }, [city.id, city.name, t.map.activeCity]);

  useEffect(() => {
    const group = gridLayerRef.current;
    if (!group) return;
    group.clearLayers();

    for (const point of gridPoints) {
      const color = getLayerColor(activeLayer, point);
      const label = formatGridValue(activeLayer, point, unit, t);

      L.circle([point.lat, point.lon], {
        radius: 32000,
        stroke: false,
        fillColor: color,
        fillOpacity: 0.24,
      }).addTo(group);

      const icon = L.divIcon({
        className: 'aer-grid-label',
        html: `<div style="background:rgba(5,5,7,0.86);border:1px solid ${color};color:#f4f4f6;padding:2px 7px;border-radius:8px;font-family:JetBrains Mono,monospace;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,0.45);transform:translate(-50%,-50%);">${label}</div>`,
        iconSize: [0, 0],
      });

      const marker = L.marker([point.lat, point.lon], {icon});
      marker.bindPopup(`
        <div style="font-family:Onest,sans-serif;font-size:12px;line-height:1.5;min-width:140px;">
          <div style="font-weight:600;margin-bottom:4px;">${point.lat.toFixed(2)}°, ${point.lon.toFixed(2)}°</div>
          <div>${t.map.layers.temp}: <strong>${formatTemp(point.temperature, unit)}</strong></div>
          <div>${t.map.layers.precip}: <strong>${point.precipitation.toFixed(1)} ${t.map.units.precip}</strong></div>
          <div>${t.map.layers.wind}: <strong>${Math.round(point.windSpeed)} ${t.map.units.wind}</strong></div>
          <div>${t.map.layers.clouds}: <strong>${Math.round(point.cloudCover)}${t.map.units.clouds}</strong></div>
        </div>
      `);
      marker.addTo(group);
    }
  }, [gridPoints, activeLayer, unit, t]);

  const legendItems =
    activeLayer === 'temp'
      ? [
          {color: '#3e8cff', label: `${convertTemp(-10, unit)}°`},
          {color: '#635bff', label: `${convertTemp(0, unit)}°`},
          {color: '#b83dff', label: `${convertTemp(10, unit)}°`},
          {color: '#f17bd2', label: `${convertTemp(20, unit)}°`},
          {color: '#ff2d68', label: `${convertTemp(30, unit)}°+`},
        ]
      : activeLayer === 'precip'
        ? [
            {color: '#64748b', label: `0 ${t.map.units.precip}`},
            {color: '#3e8cff', label: `0.5`},
            {color: '#635bff', label: `2.5`},
            {color: '#b83dff', label: `4.0+ ${t.map.units.precip}`},
          ]
        : activeLayer === 'wind'
          ? [
              {color: '#3e8cff', label: `<12`},
              {color: '#635bff', label: `20`},
              {color: '#b83dff', label: `35`},
              {color: '#ff2d68', label: `40+ ${t.map.units.wind}`},
            ]
          : [
              {color: '#3e8cff', label: `0–25%`},
              {color: '#b83dff', label: `25–60%`},
              {color: '#cbd5e1', label: `60–100%`},
            ];

  return (
    <div className="space-y-4">
      <GlassPanel as="section" className="aer-top-accent p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 text-[11px] font-display tracking-[0.18em] uppercase text-[var(--muted)] mb-2">
              <span className="aer-eyebrow-line" aria-hidden="true" />
              <span>{city.name}</span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-[var(--text)]">
              {t.map.title}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">{t.map.subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="hidden sm:inline text-xs font-mono tabular-nums text-[var(--muted)]">
                {t.map.gridUpdated}:{' '}
                {new Date(lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
              </span>
            )}
            <button
              type="button"
              onClick={() => void loadGridForBounds()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--glass-subtle-bg)] hover:border-[var(--pink)] border border-[var(--line)] text-xs font-medium text-[var(--text)] transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[var(--pink)]' : ''}`} />
              <span>{isLoading ? t.map.refreshing : t.map.refreshBtn}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {LAYERS.map((layer) => {
              const active = activeLayer === layer;
              return (
                <button
                  key={layer}
                  type="button"
                  onClick={() => setActiveLayer(layer)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${
                    active
                      ? 'aer-btn-primary border-transparent'
                      : 'bg-[var(--glass-subtle-bg)] border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {t.map.layers[layer]}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
            <span>{t.map.legendTitle}:</span>
            <div className="flex items-center gap-2.5 font-mono tabular-nums text-[var(--text-secondary)]">
              {legendItems.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{backgroundColor: item.color}}
                  />
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel as="section" className="overflow-hidden p-1.5">
        <div
          ref={mapContainerRef}
          className="aer-leaflet-container w-full h-[460px] sm:h-[540px] rounded-xl overflow-hidden"
        />
      </GlassPanel>

      <div className="glass-subtle rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs text-[var(--muted)] leading-relaxed">
        <Info className="w-4 h-4 text-[var(--pink)] shrink-0 mt-0.5" />
        <span>{t.map.disclaimer}</span>
      </div>
    </div>
  );
}
