import {useId, useState} from 'react';

export interface SparklinePoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface SparklineProps {
  title: string;
  points: SparklinePoint[];
  unitSuffix?: string;
  height?: number;
  accentColor?: string;
  secondaryColor?: string;
  showSecondary?: boolean;
}

function buildSmoothPath(coords: Array<{x: number; y: number}>): string {
  if (coords.length === 0) return '';
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;
  let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx.toFixed(1)} ${p0.y.toFixed(1)}, ${cx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  return d;
}

export function Sparkline({
  title,
  points,
  unitSuffix = '°',
  height = 84,
  accentColor = 'var(--pink)',
  secondaryColor = 'var(--blue)',
  showSecondary = false,
}: SparklineProps) {
  const gradId = useId().replace(/:/g, '');
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  if (points.length < 2) return null;

  const width = 560;
  const padX = 12;
  const padY = 14;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  const allValues = points.flatMap((p) =>
    showSecondary && typeof p.secondaryValue === 'number' ? [p.value, p.secondaryValue] : [p.value]
  );
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = Math.max(1, maxVal - minVal);

  const toCoords = (vals: number[]) =>
    vals.map((val, idx) => ({
      x: padX + (idx / Math.max(1, vals.length - 1)) * plotW,
      y: padY + (1 - (val - minVal) / range) * plotH,
    }));

  const primaryCoords = toCoords(points.map((p) => p.value));
  const primaryPath = buildSmoothPath(primaryCoords);
  const areaPath = `${primaryPath} L ${primaryCoords[primaryCoords.length - 1].x.toFixed(1)} ${(
    height - 2
  ).toFixed(1)} L ${primaryCoords[0].x.toFixed(1)} ${(height - 2).toFixed(1)} Z`;

  const secondaryCoords = showSecondary
    ? toCoords(points.map((p) => p.secondaryValue ?? p.value))
    : [];
  const secondaryPath = showSecondary ? buildSmoothPath(secondaryCoords) : '';

  const hovered = activeIdx !== null ? points[activeIdx] : null;
  const hoveredCoord = activeIdx !== null ? primaryCoords[activeIdx] : null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-xs font-medium text-[var(--muted)] tracking-wide">{title}</span>
        <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-[var(--text-secondary)]">
          {hovered ? (
            <span className="text-[var(--pink)] font-medium">
              {hovered.label} · {Math.round(hovered.value)}
              {unitSuffix}
              {showSecondary && typeof hovered.secondaryValue === 'number'
                ? ` / ${Math.round(hovered.secondaryValue)}${unitSuffix}`
                : ''}
            </span>
          ) : (
            <span>
              {Math.round(minVal)}
              {unitSuffix} – {Math.round(maxVal)}
              {unitSuffix}
            </span>
          )}
        </div>
      </div>

      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full overflow-visible select-none"
          style={{height: `${height}px`}}
          preserveAspectRatio="none"
          onMouseLeave={() => setActiveIdx(null)}
        >
          <defs>
            <linearGradient id={`fill-${gradId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.24" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <path d={areaPath} fill={`url(#fill-${gradId})`} />

          {showSecondary && secondaryPath && (
            <path
              d={secondaryPath}
              fill="none"
              stroke={secondaryColor}
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinecap="round"
              opacity="0.82"
            />
          )}

          <path
            d={primaryPath}
            fill="none"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {hoveredCoord && (
            <>
              <line
                x1={hoveredCoord.x}
                y1={padY / 2}
                x2={hoveredCoord.x}
                y2={height - 2}
                stroke="var(--line-strong)"
                strokeDasharray="3 3"
              />
              <circle
                cx={hoveredCoord.x}
                cy={hoveredCoord.y}
                r="4.5"
                fill="var(--surface)"
                stroke={accentColor}
                strokeWidth="2.5"
              />
            </>
          )}

          {primaryCoords.map((coord, idx) => {
            const sliceW = plotW / points.length;
            return (
              <rect
                key={idx}
                x={Math.max(0, coord.x - sliceW / 2)}
                y={0}
                width={sliceW}
                height={height}
                fill="transparent"
                onMouseEnter={() => setActiveIdx(idx)}
                className="cursor-crosshair"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
