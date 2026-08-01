import { useState } from 'react';

interface LineSeries {
  name: string;
  color?: string;
  data: Array<{ label: string; value: number; fullLabel?: string }>;
}

type ChartType = 'line' | 'bar';

interface Props {
  series: LineSeries[];
  height?: number;
  type?: ChartType;
  formatY?: (v: number) => string;
  formatX?: (v: string) => string;
}

const DEFAULT_COLORS = ['#0a0a0a', '#7c3aed', '#16a34a', '#dc2626'];
const TOOLTIP_WIDTH = 130;
const TOOLTIP_HEIGHT = 42;

function formatExact(value: number): string {
  const fixed = value.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `$${withCommas}.${decPart}`;
}

export default function Chart({ series, height = 240, type = 'line', formatY, formatX }: Props) {
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    barTop: number;
    label: string;
    value: number;
  } | null>(null);

  const allValues = series.flatMap(s => s.data.map(d => d.value));
  if (allValues.length === 0) {
    return (
      <div className="flex items-center justify-center text-ink-400 text-sm" style={{ height }}>
        No data
      </div>
    );
  }
  const max = Math.max(...allValues, 0);
  const min = Math.min(...allValues, 0);
  const range = Math.max(max - min, 1);
  const padding = 32;
  const width = 600;
  const innerHeight = height - padding * 2;
  const innerWidth = width - padding * 2;
  const labels = series[0]?.data.map(d => d.label) ?? [];
  const dataLen = labels.length || 1;
  const xStep = dataLen > 1 ? innerWidth / (dataLen - 1) : innerWidth;
  const slotWidth = innerWidth / dataLen;

  const yTicks = 4;
  const yLines = Array.from({ length: yTicks + 1 }, (_, i) => i / yTicks);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
      {yLines.map((t, i) => {
        const y = padding + innerHeight * (1 - t);
        const value = min + range * t;
        return (
          <g key={i}>
            <line
              x1={padding}
              y1={y}
              x2={width - padding / 2}
              y2={y}
              stroke="#e5e5e5"
              strokeWidth="1"
            />
            <text x={padding - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#737373">
              {formatY ? formatY(value) : Math.round(value).toString()}
            </text>
          </g>
        );
      })}
      {labels.map((label, i) => {
        const x = padding + (type === 'bar' ? slotWidth * i + slotWidth / 2 : xStep * i);
        const showLabel = i === 0 || i === labels.length - 1 || i === Math.floor(labels.length / 2);
        return (
          <text key={i} x={x} y={height - padding / 2} textAnchor="middle" fontSize="10" fill="#737373">
            {showLabel ? (formatX ? formatX(label) : label) : ''}
          </text>
        );
      })}
      {type === 'bar' ? renderBars() : renderLines()}
      {type === 'bar' && hover && renderTooltip(hover)}
    </svg>
  );

  function renderBars() {
    const groupWidth = (slotWidth * 0.7) / Math.max(series.length, 1);
    const groupGap = slotWidth * 0.15;
    return (
      <>
        {series.map((s, sIdx) => {
          const color = s.color || DEFAULT_COLORS[sIdx % DEFAULT_COLORS.length];
          return (
            <g key={sIdx}>
              {s.data.map((d, i) => {
                const groupX = padding + slotWidth * i + groupGap;
                const x = groupX + sIdx * groupWidth;
                const y = padding + innerHeight * (1 - (d.value - min) / range);
                const h = innerHeight - (y - padding);
                const barCenter = x + groupWidth / 2;
                return (
                  <rect
                    key={i}
                    x={x}
                    y={y}
                    width={groupWidth}
                    height={Math.max(h, 0)}
                    fill={color}
                    rx="2"
                    onMouseEnter={() => setHover({
                      x: barCenter,
                      y,
                      barTop: y,
                      label: d.fullLabel ?? d.label,
                      value: d.value,
                    })}
                    onMouseLeave={() => setHover(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <title>{`${d.fullLabel ?? d.label}: ${formatExact(d.value)}`}</title>
                  </rect>
                );
              })}
            </g>
          );
        })}
      </>
    );
  }

  function renderLines() {
    return (
      <>
        {series.map((s, sIdx) => {
          const color = s.color || DEFAULT_COLORS[sIdx % DEFAULT_COLORS.length];
          const points = s.data.map((d, i) => {
            const x = padding + xStep * i;
            const y = padding + innerHeight * (1 - (d.value - min) / range);
            return `${x},${y}`;
          }).join(' ');
          const areas = s.data.map((d, i) => {
            const x = padding + xStep * i;
            const y = padding + innerHeight * (1 - (d.value - min) / range);
            return `${x},${y}`;
          }).join(' L ');
          return (
            <g key={sIdx}>
              <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <path
                d={`M ${padding},${padding + innerHeight} L ${areas} L ${padding + xStep * (s.data.length - 1)},${padding + innerHeight} Z`}
                fill={color}
                fillOpacity="0.08"
              />
            </g>
          );
        })}
      </>
    );
  }

  function renderTooltip(h: { x: number; y: number; label: string; value: number }) {
    const preferredX = h.x - TOOLTIP_WIDTH / 2;
    const clampedX = Math.max(padding, Math.min(preferredX, width - padding - TOOLTIP_WIDTH));
    const preferredY = h.y - TOOLTIP_HEIGHT - 8;
    const minY = padding;
    const maxY = height - padding - TOOLTIP_HEIGHT;
    const clampedY = preferredY < minY
      ? Math.min(h.y + 8, maxY)
      : Math.min(preferredY, maxY);

    return (
      <g pointerEvents="none">
        <rect
          x={clampedX}
          y={clampedY}
          width={TOOLTIP_WIDTH}
          height={TOOLTIP_HEIGHT}
          rx={6}
          fill="#0a0a0a"
          fillOpacity="0.92"
        />
        <text x={clampedX + 10} y={clampedY + 16} fontSize="11" fill="#a3a3a3">
          {h.label}
        </text>
        <text x={clampedX + 10} y={clampedY + 32} fontSize="13" fontWeight="bold" fill="#ffffff">
          {formatExact(h.value)}
        </text>
      </g>
    );
  }
}