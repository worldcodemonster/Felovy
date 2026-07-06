'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ComposableMap, Geographies, Geography, Marker,
  ZoomableGroup, useMapContext,
} from 'react-simple-maps';
import { API_URL } from '@/lib/utils';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const COUNTRY_COORDS: Record<string, [number, number]> = {
  'Afghanistan': [67.710, 33.934], 'Albania': [20.169, 41.153], 'Algeria': [1.660, 28.034],
  'Angola': [17.874, -11.203], 'Argentina': [-63.617, -38.416], 'Armenia': [45.039, 40.070],
  'Australia': [133.775, -25.275], 'Austria': [14.550, 47.516], 'Azerbaijan': [47.577, 40.143],
  'Bangladesh': [90.356, 23.685], 'Belarus': [27.954, 53.710], 'Belgium': [4.470, 50.503],
  'Bolivia': [-64.269, -16.291], 'Bosnia and Herzegovina': [17.679, 43.916],
  'Botswana': [24.685, -22.329], 'Brazil': [-51.926, -14.235], 'Bulgaria': [25.486, 42.734],
  'Cambodia': [104.990, 12.566], 'Cameroon': [12.354, 3.848], 'Canada': [-96.796, 56.131],
  'Chile': [-71.543, -35.675], 'China': [104.196, 35.862], 'Colombia': [-74.298, 4.571],
  'Croatia': [15.200, 45.100], 'Czech Republic': [15.473, 49.818], 'Denmark': [9.502, 56.264],
  'Ecuador': [-78.185, -1.832], 'Egypt': [30.803, 26.821], 'Estonia': [25.014, 58.595],
  'Ethiopia': [40.490, 9.145], 'Finland': [25.748, 61.925], 'France': [2.213, 46.228],
  'Georgia': [43.357, 42.315], 'Germany': [10.451, 51.166], 'Ghana': [-1.024, 7.947],
  'Greece': [21.824, 39.074], 'Guatemala': [-90.231, 15.784], 'Hungary': [19.504, 47.163],
  'India': [78.963, 20.594], 'Indonesia': [113.921, -0.790], 'Iran': [53.688, 32.428],
  'Iraq': [43.679, 33.224], 'Ireland': [-8.242, 53.414], 'Israel': [34.852, 31.047],
  'Italy': [12.674, 41.872], 'Japan': [138.252, 36.205], 'Jordan': [36.239, 30.586],
  'Kazakhstan': [66.924, 48.020], 'Kenya': [37.906, -0.023], 'Latvia': [24.604, 56.880],
  'Lebanon': [35.502, 33.854], 'Lithuania': [23.882, 55.170], 'Malaysia': [109.698, 4.211],
  'Mexico': [-102.553, 23.635], 'Morocco': [-7.093, 31.792], 'Myanmar': [95.956, 16.872],
  'Netherlands': [5.292, 52.133], 'New Zealand': [174.886, -40.901], 'Nigeria': [8.676, 9.082],
  'Norway': [8.469, 60.472], 'Pakistan': [69.346, 30.376], 'Peru': [-75.015, -9.190],
  'Philippines': [121.774, 12.880], 'Poland': [19.146, 51.920], 'Portugal': [-8.224, 39.400],
  'Romania': [24.967, 45.943], 'Russia': [105.319, 61.524], 'Saudi Arabia': [45.079, 23.886],
  'Senegal': [-14.452, 14.497], 'Serbia': [21.006, 44.017], 'Singapore': [103.820, 1.353],
  'Slovakia': [19.699, 48.669], 'Slovenia': [14.995, 46.152], 'South Africa': [22.937, -30.560],
  'Spain': [-3.750, 40.463], 'Sri Lanka': [80.772, 7.874],
  'Sweden': [18.644, 60.128], 'Switzerland': [8.228, 46.818], 'Taiwan': [120.961, 23.697],
  'Tanzania': [34.889, -6.369], 'Thailand': [100.993, 15.870], 'Tunisia': [9.538, 33.887],
  'Turkey': [35.243, 38.964], 'Uganda': [32.290, 1.374], 'Ukraine': [31.165, 48.379],
  'United Arab Emirates': [53.848, 23.424], 'United Kingdom': [-3.436, 55.378],
  'United States': [-95.713, 37.090], 'Uzbekistan': [63.949, 41.377],
  'Venezuela': [-66.590, 6.424], 'Vietnam': [108.278, 14.059], 'Yemen': [48.517, 15.553],
  'Zimbabwe': [29.155, -19.016],
};

const BASE_POINTS_SOURCE: [number, number][] = [
  // USA (8)
  [ -74.0,  40.7],  // New York
  [-118.2,  34.1],  // Los Angeles
  [ -87.6,  41.9],  // Chicago
  [ -80.2,  25.8],  // Miami
  [ -95.4,  29.7],  // Houston
  [ -96.8,  32.8],  // Dallas
  [-122.3,  47.6],  // Seattle
  [ -84.4,  33.7],  // Atlanta
  // Canada (3)
  [ -79.4,  43.7],  // Toronto
  [-123.1,  49.3],  // Vancouver
  [ -73.6,  45.5],  // Montreal
  // Latin America
  [ -46.6, -23.5],  // São Paulo, Brazil
  [ -43.2, -22.9],  // Rio de Janeiro, Brazil
  [ -52.0, -14.2],  // Brasília, Brazil
  [ -43.9, -19.9],  // Belo Horizonte, Brazil
  [ -99.1,  19.4],  // Mexico City
  [-103.3,  20.7],  // Guadalajara, Mexico
  [-100.3,  25.7],  // Monterrey, Mexico
  [ -58.4, -34.6],  // Buenos Aires, Argentina
  [ -64.2, -31.4],  // Córdoba, Argentina
  [ -74.1,   4.7],  // Bogotá, Colombia
  [ -75.6,   6.2],  // Medellín, Colombia
  [ -77.0, -12.1],  // Lima, Peru
  [ -70.7, -33.5],  // Santiago, Chile
  [ -66.9,  10.5],  // Caracas, Venezuela
  // Europe (no Russia)
  [  -0.1,  51.5],  // London
  [   2.3,  48.9],  // Paris
  [  13.4,  52.5],  // Berlin
  [  -3.7,  40.4],  // Madrid
  [  12.5,  41.9],  // Rome
  [   4.9,  52.4],  // Amsterdam
  [  21.0,  52.2],  // Warsaw
  [  30.5,  50.5],  // Kyiv
  // Southeast Asia
  [ 106.8,  -6.2],  // Jakarta, Indonesia
  [ 112.7,  -7.3],  // Surabaya, Indonesia
  [ 100.5,  13.8],  // Bangkok, Thailand
  [ 103.8,   1.3],  // Singapore
  [ 121.0,  14.6],  // Manila, Philippines
  [ 101.7,   3.1],  // Kuala Lumpur, Malaysia
  // Middle East
  [  55.3,  25.2],  // Dubai, UAE
  [  46.7,  24.7],  // Riyadh, Saudi Arabia
  [  39.8,  21.5],  // Jeddah, Saudi Arabia
  [  34.8,  31.8],  // Tel Aviv, Israel
  [  28.9,  41.0],  // Istanbul, Turkey
  [  51.4,  35.7],  // Tehran, Iran
  // South & West Asia
  [  77.2,  28.6],  // Delhi, India
  [  72.9,  19.1],  // Mumbai, India
  [  77.6,  12.9],  // Bangalore, India
  [  88.3,  22.6],  // Kolkata, India
  [  67.0,  24.9],  // Karachi, Pakistan
  [  73.0,  33.7],  // Islamabad, Pakistan
  [  90.4,  23.7],  // Dhaka, Bangladesh
  // North Africa
  [  31.2,  30.1],  // Cairo, Egypt
  [  -5.8,  33.9],  // Casablanca, Morocco
  [   3.1,  36.7],  // Algiers, Algeria
  // South Africa
  [  28.1, -26.2],  // Johannesburg
  [  18.4, -33.9],  // Cape Town
  [  31.0, -29.9],  // Durban
  // Additional USA
  [ -71.1,  42.4],  // Boston
  [ -77.0,  38.9],  // Washington DC
  [ -75.2,  39.9],  // Philadelphia
  [-104.9,  39.7],  // Denver
  [-112.1,  33.4],  // Phoenix
  [-122.4,  37.8],  // San Francisco
  [ -93.3,  44.9],  // Minneapolis
  [-111.9,  40.8],  // Salt Lake City
  [ -97.7,  30.3],  // Austin
  [ -86.8,  36.2],  // Nashville
  [-115.1,  36.2],  // Las Vegas
  [-122.7,  45.5],  // Portland
  [ -80.8,  35.2],  // Charlotte
  [ -83.0,  42.3],  // Detroit
  [ -83.0,  40.0],  // Columbus
  [ -90.1,  29.9],  // New Orleans
  [ -98.5,  29.4],  // San Antonio
  [ -82.5,  27.9],  // Tampa
  // Additional Canada
  [-114.1,  51.1],  // Calgary
  [ -75.7,  45.4],  // Ottawa
  [-123.4,  48.4],  // Victoria
  [-113.5,  53.5],  // Edmonton
  [ -97.1,  49.9],  // Winnipeg
  [ -71.2,  46.8],  // Quebec City
  [ -63.6,  44.6],  // Halifax
  // Additional Latam
  [ -51.2, -30.0],  // Porto Alegre, Brazil
  [ -38.5,  -3.7],  // Fortaleza, Brazil
  [ -60.0,  -3.1],  // Manaus, Brazil
  [ -34.9,  -8.1],  // Recife, Brazil
  [ -79.5,   9.0],  // Panama City
  [ -78.5,  -0.2],  // Quito, Ecuador
  [ -56.2, -34.9],  // Montevideo, Uruguay
  [ -68.1, -16.5],  // La Paz, Bolivia
  [ -57.6, -25.3],  // Asunción, Paraguay
  [ -69.9,  18.5],  // Santo Domingo
  [ -84.1,   9.9],  // San José, Costa Rica
  [ -90.5,  14.6],  // Guatemala City
  [ -49.3, -25.4],  // Curitiba, Brazil
  [ -38.5, -12.9],  // Salvador, Brazil
  [ -49.3, -16.7],  // Goiânia, Brazil
  [ -47.1, -22.9],  // Campinas, Brazil
  [ -48.5,  -1.5],  // Belém, Brazil
  [ -76.5,   3.4],  // Cali, Colombia
  [ -74.8,  10.9],  // Barranquilla, Colombia
  [ -79.9,  -2.2],  // Guayaquil, Ecuador
  [ -82.4,  23.1],  // Havana, Cuba
  [ -87.2,  14.1],  // Tegucigalpa, Honduras
  [-117.0,  32.5],  // Tijuana, Mexico
  [ -98.2,  19.0],  // Puebla, Mexico
  [ -35.2,  -5.8],  // Natal, Brazil
  [ -48.5, -27.6],  // Florianópolis, Brazil
  [ -40.3, -20.3],  // Vitória, Brazil
  [ -54.6, -20.5],  // Campo Grande, Brazil
  [ -44.3,  -2.5],  // São Luís, Brazil
  // Additional Europe
  [  -6.3,  53.3],  // Dublin
  [  -9.1,  38.7],  // Lisbon
  [  18.1,  59.3],  // Stockholm
  [  16.4,  48.2],  // Vienna
  [  14.4,  50.1],  // Prague
  [  19.0,  47.5],  // Budapest
  [   4.4,  50.8],  // Brussels
  [   8.5,  47.4],  // Zurich
  [   2.2,  41.4],  // Barcelona
  [   9.2,  45.5],  // Milan
  [  10.7,  59.9],  // Oslo
  [  12.6,  55.7],  // Copenhagen
  [  23.7,  37.9],  // Athens
  [  25.0,  60.2],  // Helsinki
  [  26.1,  44.4],  // Bucharest
  // Australia
  [ 151.2, -33.9],  // Sydney
  [ 144.9, -37.8],  // Melbourne
  [ 153.0, -27.5],  // Brisbane
  [ 115.9, -32.0],  // Perth
];

// Slightly darker than map country colour (#e2e8f0 = slate-200) → slate-400
// UTC offsets, must stay in the same order as BASE_POINTS_SOURCE
const BASE_TZ_SOURCE: number[] = [
  // USA
  -5, -8, -6, -5, -6, -6, -8, -5,
  // Canada
  -5, -8, -5,
  // Latin America
  -3, -3, -3, -3,          // Brazil ×4
  -6, -6, -6,              // Mexico ×3
  -3, -3,                  // Argentina ×2
  -5, -5, -5,              // Bogotá, Medellín, Lima
  -4, -4,                  // Santiago, Caracas
  // Europe
   0,  1,  1,  1,  1,  1,  1,  2,
  // SE Asia
   7,  7,  7,  8,  8,  8,
  // Middle East
   4,  3,  3,  2,  3,  3.5,
  // South & West Asia
   5.5, 5.5, 5.5, 5.5,  5,  5,  6,
  // North Africa
   2,  1,  1,
  // South Africa
   2,  2,  2,
  // Additional USA
  -5, -5, -5, -7, -7, -8, -6, -7,
  -6, -6, -8, -8, -5, -5, -5, -6, -6, -5,
  // Additional Canada
  -7, -5, -8,
  -7, -6, -5, -4,
  // Additional Latam
  -3, -3, -4, -3, -5, -5, -3, -4, -4, -4, -6, -6,
  -3, -3, -3, -3, -3, -5, -5, -5, -5, -6, -8, -6,
  -3, -3, -3, -4, -3,
  // Additional Europe
   0,  0,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  2,  2,  2,
  // Australia
  10, 10, 10,  8,
];

/** Keep 70% of anchor points (~30% removed), evenly across regions. */
const keepMapPoint = (_: unknown, i: number) => i % 10 < 7;

const BASE_POINTS = BASE_POINTS_SOURCE.filter(keepMapPoint);
const BASE_TZ = BASE_TZ_SOURCE.filter(keepMapPoint);

const LINE_COLOR = '#94a3b8';
const POINT_COLOR = '#22c55e';

/** Original map land colors */
const MAP_FILL_HERO = '#dfe3e9';
const MAP_FILL_SECTION = '#e2e8f0';
const MAP_STROKE = '#fff';
const MAP_FILL_HOVER = '#cbd5e1';

/** Hide small island nations west of the Americas (Pacific, left of USA on map) */
function getCountryBbox(geo: {
  bbox?: [number, number, number, number];
  geometry?: { type: string; coordinates: unknown };
}): [number, number, number, number] | null {
  if (geo.bbox) return geo.bbox;
  const geom = geo.geometry;
  if (!geom) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const visit = (coord: number[]) => {
    minX = Math.min(minX, coord[0]);
    maxX = Math.max(maxX, coord[0]);
    minY = Math.min(minY, coord[1]);
    maxY = Math.max(maxY, coord[1]);
  };

  const walkCoords = (coords: unknown): void => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === 'number') visit(coords as number[]);
    else coords.forEach(walkCoords);
  };

  walkCoords(geom.coordinates);
  if (!Number.isFinite(minX)) return null;
  return [minX, minY, maxX, maxY];
}

function shouldShowCountry(geo: {
  id?: string | number;
  properties?: { name?: string };
  bbox?: [number, number, number, number];
  geometry?: { type: string; coordinates: unknown };
}): boolean {
  if (Number(geo.id) === 10) return false; // Antarctica

  const name = geo.properties?.name ?? '';
  const PACIFIC_WEST_NAMES = new Set([
    'Fiji', 'Samoa', 'Tonga', 'Vanuatu', 'Solomon Is.', 'Kiribati',
    'Marshall Is.', 'Micronesia', 'Nauru', 'Palau', 'Tuvalu',
    'Fr. Polynesia', 'Cook Is.', 'Niue', 'Guam', 'N. Mariana Is.',
    'American Samoa', 'Wallis and Futuna Is.', 'New Caledonia',
  ]);
  if (PACIFIC_WEST_NAMES.has(name)) return false;

  const bbox = getCountryBbox(geo);
  if (!bbox) return true;

  const [minX, , maxX] = bbox;
  const width = bbox[2] - minX;
  const height = bbox[3] - bbox[1];

  // Small land west of continental Americas, drops Hawaii-sized specks & outlying isles
  const westOfAmericas = maxX < -90;
  const isSmall = width < 14 && height < 14;
  if (westOfAmericas && isSmall) return false;

  // Aleutian / far-west slivers that aren't mainland
  if (minX < -168 && width < 20 && height < 25) return false;

  return true;
}

type LineDef = {
  key: number;
  d: string;
  delay: number;
  dur: number;
};

// Dotted curved line, each line fades in/out on its own independent schedule
function DottedArc({ d, delay, dur }: Omit<LineDef, 'key'>) {
  return (
    <path
      d={d}
      fill="none"
      stroke={LINE_COLOR}
      strokeWidth={0.7}
      strokeLinecap="round"
      strokeDasharray="1.5 6"
    >
      {/* Visible ~80% of the cycle so each point usually shows 2-3 lines */}
      <animate
        attributeName="opacity"
        values="0;0;0.28;0.28;0"
        keyTimes="0;0.04;0.12;0.92;1"
        dur={`${dur}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
      />
      {/* Dots flow along the path */}
      <animate
        attributeName="stroke-dashoffset"
        from="7.5"
        to="0"
        dur="1.4s"
        repeatCount="indefinite"
        calcMode="linear"
      />
    </path>
  );
}

function buildPath(from: [number, number], to: [number, number]): string {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const mx = (x1 + x2) / 2 - dy * 0.06;
  const my = (y1 + y2) / 2 - Math.max(dist * 0.22, 18);
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

function LineLayer({ extraPoints }: { extraPoints: [number, number][] }) {
  const { projection } = useMapContext();
  const [lines, setLines] = useState<LineDef[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    const pts: [number, number][] = [
      ...BASE_POINTS,
      ...extraPoints.filter(ep =>
        !BASE_POINTS.some(bp => Math.abs(bp[0] - ep[0]) < 3 && Math.abs(bp[1] - ep[1]) < 3)
      ),
    ];
    if (pts.length < 2) return;

    // UTC offset for a point: use BASE_TZ for base points, estimate from lng for real-data extras
    const getTz = (i: number) =>
      i < BASE_TZ.length ? BASE_TZ[i] : Math.round(pts[i][0] / 15);

    const usedPairs = new Set<string>();
    const result: LineDef[] = [];

    for (let ai = 0; ai < pts.length; ai++) {
      const target = 2 + (Math.random() < 0.5 ? 1 : 0); // 2 or 3 per point
      let added = 0;
      let tries = 0;

      while (added < target && tries < 80) {
        tries++;
        let bi = Math.floor(Math.random() * pts.length);
        while (bi === ai) bi = Math.floor(Math.random() * pts.length);

        // Only connect points within ±2 timezone hours
        if (Math.abs(getTz(ai) - getTz(bi)) > 2) continue;

        const pairKey = `${Math.min(ai, bi)}-${Math.max(ai, bi)}`;
        if (usedPairs.has(pairKey)) continue;
        usedPairs.add(pairKey);

        const fromXY = projection(pts[ai]) as [number, number] | null;
        const toXY   = projection(pts[bi]) as [number, number] | null;
        if (!fromXY || !toXY) continue;

        result.push({
          key:   counter.current++,
          d:     buildPath(fromXY, toXY),
          delay: Math.random() * 20,
          dur:   9 + Math.random() * 9,
        });
        added++;
      }
    }

    setLines(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projection, extraPoints.length]);

  return <>{lines.map(({ key: k, ...rest }) => <DottedArc key={k} {...rest} />)}</>;
}

// ─── Data types ───────────────────────────────────────────────────────────────

type CountryCount = { country: string; count: number };
type MapData = { developers: CountryCount[]; employers: CountryCount[]; jobs: CountryCount[] };

function toMarkers(list: CountryCount[]) {
  return list
    .filter(({ country }) => COUNTRY_COORDS[country])
    .map(({ country, count }) => ({
      name: country,
      coordinates: COUNTRY_COORDS[country] as [number, number],
      count,
    }));
}

// ─── Main component ───────────────────────────────────────────────────────────

function MapLayers() {
  return (
    <>
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.filter(shouldShowCountry).map(geo => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill={MAP_FILL_HERO}
              stroke={MAP_STROKE}
              strokeWidth={0.6}
              style={{
                default: { outline: 'none' },
                hover:   { outline: 'none' },
                pressed: { outline: 'none' },
              }}
            />
          ))
        }
      </Geographies>
      {BASE_POINTS.map((coords, i) => {
        const d1 = ((i * 0.41) % 3).toFixed(2);
        const d2 = ((i * 0.41 + 1.5) % 3).toFixed(2);
        return (
          <Marker key={`bp-${i}`} coordinates={coords}>
            <circle fill="none" stroke={POINT_COLOR} strokeWidth={0.6}>
              <animate attributeName="r"       values="1;14"   dur="3s" begin={`${d1}s`} repeatCount="indefinite" calcMode="linear" />
              <animate attributeName="opacity" values="0.26;0"  dur="3s" begin={`${d1}s`} repeatCount="indefinite" calcMode="linear" />
            </circle>
            <circle fill="none" stroke={POINT_COLOR} strokeWidth={0.4}>
              <animate attributeName="r"       values="1;14"   dur="3s" begin={`${d2}s`} repeatCount="indefinite" calcMode="linear" />
              <animate attributeName="opacity" values="0.18;0"   dur="3s" begin={`${d2}s`} repeatCount="indefinite" calcMode="linear" />
            </circle>
            <circle r={1} fill={POINT_COLOR} fillOpacity={0.65} />
          </Marker>
        );
      })}
    </>
  );
}

function MapCanvas({ fillHeight = false }: { fillHeight?: boolean }) {
  return (
    <ComposableMap
      width={800}
      height={365}
      projectionConfig={fillHeight
        ? { scale: 140, center: [5, 9] }
        : { scale: 147, center: [0, 5] }}
      className={fillHeight ? 'pointer-events-none select-none' : undefined}
      style={fillHeight
        ? { width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }
        : { width: '100%', height: 'auto', display: 'block' }}
      preserveAspectRatio={fillHeight ? 'xMidYMid slice' : 'xMidYMid meet'}
    >
      {fillHeight ? (
        // Hero map is decorative, skip ZoomableGroup's invisible hit rect / d3 zoom layer.
        <g style={{ pointerEvents: 'none' }}>
          <MapLayers />
        </g>
      ) : (
        <ZoomableGroup zoom={1} minZoom={1} maxZoom={1}>
          <MapLayers />
        </ZoomableGroup>
      )}
    </ComposableMap>
  );
}

export default function WorldMap({ mode = 'section' }: { mode?: 'section' | 'hero' }) {
  if (mode === 'hero') return <MapCanvas fillHeight />;

  const [mapData, setMapData] = useState<MapData>({ developers: [], employers: [], jobs: [] });

  useEffect(() => {
    fetch(`${API_URL}/developers/map`)
      .then(r => r.json())
      .then((d: unknown) => {
        if (d && typeof d === 'object' && !Array.isArray(d) && 'developers' in d)
          setMapData(d as MapData);
      })
      .catch(() => {});
  }, []);

  const devMarkers = toMarkers(mapData.developers);
  const empMarkers = toMarkers(mapData.employers);
  const jobMarkers = toMarkers(mapData.jobs);

  const extraPoints: [number, number][] = [
    ...devMarkers.map(m => m.coordinates),
    ...empMarkers.map(m => m.coordinates),
    ...jobMarkers.map(m => m.coordinates),
  ];

  const totalDevs    = mapData.developers.reduce((s, r) => s + r.count, 0);
  const totalEmps    = mapData.employers.reduce((s, r) => s + r.count, 0);
  const totalJobs    = mapData.jobs.reduce((s, r) => s + r.count, 0);
  const countryCount = new Set([
    ...mapData.developers.map(d => d.country),
    ...mapData.employers.map(e => e.country),
    ...mapData.jobs.map(j => j.country),
  ]).size;

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto max-w-7xl px-4">

        <div className="text-center mb-10">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-felovy-red/70 mb-3">Global Reach</p>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Talent &amp; Opportunities{' '}
            <span className="text-felovy-red">Worldwide</span>
          </h2>
          <p className="text-gray-500 max-w-md mx-auto text-sm">
            Verified developers, hiring companies, and open jobs spanning every corner of the globe.
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 mb-6">
          {[
            { color: '#e11d48', label: 'Developers' },
            { color: '#10b981', label: 'Companies'  },
            { color: '#38bdf8', label: 'Jobs'        },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full inline-block" style={{ background: color }} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>

        <div className="relative rounded-3xl overflow-hidden bg-gray-50 border border-gray-200 shadow-sm">
          <ComposableMap
            projectionConfig={{ scale: 147, center: [0, 10] }}
            style={{ width: '100%', height: 'auto' }}
          >
            <ZoomableGroup zoom={1} minZoom={1} maxZoom={1}>

              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.filter(shouldShowCountry).map(geo => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={MAP_FILL_SECTION}
                      stroke={MAP_STROKE}
                      strokeWidth={0.6}
                      style={{
                        default: { outline: 'none' },
                        hover:   { outline: 'none', fill: MAP_FILL_HOVER },
                        pressed: { outline: 'none' },
                      }}
                    />
                  ))
                }
              </Geographies>

              {/* Dashed communication lines between random points */}
              <LineLayer extraPoints={extraPoints} />

              {/* Employer rings */}
              {empMarkers.map(({ name, coordinates, count }) => (
                <Marker key={`emp-${name}`} coordinates={coordinates}>
                  <circle r={Math.min(4 + count, 9)} fill="none" stroke="#10b981" strokeWidth={1.5} />
                </Marker>
              ))}

              {/* Job dots */}
              {jobMarkers.map(({ name, coordinates, count }) => (
                <Marker key={`job-${name}`} coordinates={coordinates}>
                  <circle r={Math.min(3 + count * 0.5, 7)} fill="#38bdf8" fillOpacity={0.85} />
                </Marker>
              ))}

              {/* Developer dots */}
              {devMarkers.map(({ name, coordinates, count }) => (
                <Marker key={`dev-${name}`} coordinates={coordinates}>
                  <circle r={Math.min(3 + count * 0.5, 7) + 3} fill="rgba(225,29,72,0.1)" />
                  <circle r={Math.min(3 + count * 0.5, 7)} fill="#e11d48" stroke="#fff" strokeWidth={0.8} />
                </Marker>
              ))}

              {/* Anchor dots */}
              {BASE_POINTS.map((coords, i) => (
                <Marker key={`bp-${i}`} coordinates={coords}>
                  <circle r={1.4} fill={POINT_COLOR} fillOpacity={0.8} />
                </Marker>
              ))}

            </ZoomableGroup>
          </ComposableMap>
        </div>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl mx-auto">
          {[
            { value: totalDevs    || '-', label: 'Developers', color: 'text-felovy-red'  },
            { value: totalEmps    || '-', label: 'Companies',  color: 'text-emerald-500' },
            { value: totalJobs    || '-', label: 'Open Jobs',  color: 'text-sky-500'     },
            { value: countryCount || '-', label: 'Countries',  color: 'text-gray-800'    },
          ].map(({ value, label, color }) => (
            <div key={label} className="text-center">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
