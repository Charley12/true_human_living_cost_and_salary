import { useEffect, useRef, useState, useCallback } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import { useTranslation } from '../i18n/I18nContext';

// Region definitions with real lat/lng coordinates
const REGION_DEFS: Record<string, { name: string; lng: number; lat: number }> = {
  na_west:    { name: '北美西部',  lng: -122, lat: 37 },
  na_east:    { name: '北美東部',  lng:  -75, lat: 40 },
  sa:         { name: '南美洲',    lng:  -55, lat: -15 },
  europe:     { name: '歐洲地區',  lng:   15, lat: 50 },
  africa:     { name: '非洲地區',  lng:   20, lat:  5 },
  east_asia:  { name: '東亞地區',  lng:  120, lat: 35 },
  south_asia: { name: '南亞地區',  lng:   79, lat: 21 },
  oceania:    { name: '大洋洲',    lng:  134, lat: -27 },
};

interface HeatmapStats {
  [key: string]: { name: string; count: number };
}

interface Props {
  heatmapStats: HeatmapStats;
}

function buildProjection(width: number, height: number, panOffset: { x: number; y: number }) {
  return geoMercator()
    .scale((width / (2 * Math.PI)) * 1.22)
    .translate([width / 2 + panOffset.x, (height / 2) + height * 0.06 + panOffset.y])
    .center([10, 15]);
}

export function WorldMap({ heatmapStats }: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [countryPaths, setCountryPaths] = useState<{ id: string | number; d: string }[]>([]);
  const [size, setSize] = useState({ width: 1200, height: 700 });
  const [projected, setProjected] = useState<Record<string, { x: number; y: number }>>({});
  const [latLines, setLatLines] = useState<{ lat: number; y: number }[]>([]);
  
  // Dragging / Panning State
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const geojsonRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  // Load world atlas topology once on mount to cache it
  useEffect(() => {
    import('world-atlas/countries-110m.json').then((topo: any) => {
      const data = topo.default || topo;
      geojsonRef.current = feature(data, data.objects.countries);
      setLoading(false);
    });
  }, []);

  const recompute = useCallback((width: number, height: number, offset: { x: number; y: number }) => {
    if (!geojsonRef.current) return;

    const proj = buildProjection(width, height, offset);
    const pathGen = geoPath().projection(proj);

    const newPaths = geojsonRef.current.features.map((f: any) => ({
      id: f.id ?? Math.random(),
      d: pathGen(f) ?? '',
    }));
    setCountryPaths(newPaths);

    // Project each region's lat/lng
    const pts: Record<string, { x: number; y: number }> = {};
    for (const key in REGION_DEFS) {
      const { lng, lat } = REGION_DEFS[key];
      const coords = proj([lng, lat]);
      if (coords) pts[key] = { x: coords[0], y: coords[1] };
    }
    setProjected(pts);

    // Latitude reference lines
    const lats = [-66.5, -23.5, 0, 23.5, 66.5];
    const lines = lats.map((lat) => {
      const c = proj([0, lat])!;
      return { lat, y: c[1] };
    });
    setLatLines(lines);
  }, []);

  // Update sizes when wrapper changes size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setSize({ width, height });
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Recompute SVG paths and projection points whenever size or panOffset updates
  useEffect(() => {
    recompute(size.width, size.height, panOffset);
  }, [size, panOffset, recompute, loading]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...panOffset };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = { x: touch.clientX, y: touch.clientY };
    panStart.current = { ...panOffset };
  };

  // Manage window mouse & touch listeners globally to support dragging outside the container
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPanOffset({
        x: panStart.current.x + dx,
        y: panStart.current.y + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStart.current.x;
      const dy = touch.clientY - dragStart.current.y;
      setPanOffset({
        x: panStart.current.x + dx,
        y: panStart.current.y + dy,
      });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 select-none overflow-hidden cursor-grab active:cursor-grabbing pointer-events-auto"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <svg
        viewBox={`0 0 ${size.width} ${size.height}`}
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle grid */}
          <pattern id="d3-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(71,85,105,0.09)" strokeWidth="0.7" />
          </pattern>

          {/* Glow filter for land */}
          <filter id="land-glow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feFlood floodColor="rgba(255,255,255,0.03)" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle vignette */}
          <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
            <stop offset="60%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(2,6,23,0.75)" />
          </radialGradient>

          {/* Ocean gradient */}
          <radialGradient id="ocean-bg" cx="50%" cy="40%" r="75%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
        </defs>

        {/* Ocean */}
        <rect width={size.width} height={size.height} fill="url(#ocean-bg)" />

        {/* Grid */}
        <rect width={size.width} height={size.height} fill="url(#d3-grid)" />

        {/* Latitude reference lines */}
        {latLines.map(({ lat, y }) => {
          const isEquator = lat === 0;
          return (
            <line
              key={lat}
              x1={0} y1={y}
              x2={size.width} y2={y}
              stroke={isEquator ? 'rgba(255,255,255,0.15)' : 'rgba(71,85,105,0.12)'}
              strokeWidth={isEquator ? 0.9 : 0.5}
              strokeDasharray={isEquator ? undefined : '5 8'}
            />
          );
        })}

        {/* Country land masses */}
        {countryPaths.map((p) =>
          p.d ? (
            <path
              key={p.id}
              d={p.d}
              fill="rgba(15,23,42,0.80)"
              stroke="rgba(100,116,139,0.5)"
              strokeWidth="0.55"
              filter="url(#land-glow)"
            />
          ) : null
        )}

        {/* Vignette overlay */}
        <rect width={size.width} height={size.height} fill="url(#vignette)" />

        {/* Heatmap Nodes projected from lat/lng */}
        {Object.keys(heatmapStats).map((key) => {
          const region = heatmapStats[key];
          const pos = projected[key];
          if (!pos) return null;

          const count = region.count;
          const intensity = Math.min(count / 30000, 1.0);
          const radius = 5 + intensity * 13;
          const isCritical = count >= 15000;
          const isMedium = count >= 2000 && count < 15000;

          const coreColor  = isCritical ? '#ffffff' : isMedium ? '#94a3b8' : '#334155';
          const strokeColor = isCritical ? '#cbd5e1' : isMedium ? '#64748b' : '#475569';
          const glowColor  = isCritical ? 'rgba(255,255,255,0.30)' : isMedium ? 'rgba(148,163,184,0.20)' : 'rgba(71,85,105,0.10)';
          const glowR = radius * 3.5;

          return (
            <g key={key} transform={`translate(${pos.x},${pos.y})`} style={{ pointerEvents: 'auto', cursor: 'help' }}>
              {/* Outer soft glow */}
              <circle r={glowR} fill={glowColor} style={{ filter: 'blur(8px)' }} />

              {/* Animated pulse for critical */}
              {isCritical && (
                <circle r={radius + 3} fill="none" stroke="rgba(255,255,255,0.40)" strokeWidth="1.2">
                  <animate attributeName="r" values={`${radius + 3};${radius + 15};${radius + 3}`} dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0;0.7" dur="2.5s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Medium pulse */}
              {isMedium && (
                <circle r={radius + 2} fill="none" stroke="rgba(148,163,184,0.30)" strokeWidth="0.8">
                  <animate attributeName="r" values={`${radius + 2};${radius + 10};${radius + 2}`} dur="3.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="3.5s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Core dot */}
              <circle r={radius} fill={coreColor} stroke={strokeColor} strokeWidth="0.9" />

              {/* Inner highlight */}
              <circle r={radius * 0.4} fill="rgba(255,255,255,0.15)" />

              {/* Region label */}
              <text
                y={radius + 13}
                textAnchor="middle"
                fontSize="8.5"
                fill={isCritical ? '#ffffff' : isMedium ? 'rgba(226,232,240,0.75)' : 'rgba(148,163,184,0.65)'}
                fontFamily="'Courier New', monospace"
                fontWeight="600"
                letterSpacing="0.5"
              >
                {t('regions.' + key)}
              </text>
              <text
                y={radius + 22}
                textAnchor="middle"
                fontSize="7"
                fill="rgba(148,163,184,0.5)"
                fontFamily="'Courier New', monospace"
              >
                {count.toLocaleString()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
