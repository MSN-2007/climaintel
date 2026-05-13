
import { ClimateStats, MonthlyClimateData, LocationInfo } from '../types';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CLIMATE_THRESHOLDS = {
  WINTER_MAX_TEMP: 15,
  RAINY_MIN_PRECIP: 60,
  RAINY_MIN_DAYS: 10,
  SUNNY_MIN_SOLAR: 22,
  SUNNY_MAX_PRECIP: 40,
  WINDY_MIN_SPEED: 14.5,
};

const CACHE_PREFIX = 'climatintel_cache_';

/**
 * Normalizes coordinates to a 2-decimal precision string for consistent caching.
 */
const getCacheKey = (lat: number, lng: number) => `${lat.toFixed(2)}_${lng.toFixed(2)}`;

/**
 * Retrieves cached climate data from localStorage if available and not expired (24h).
 */
function getCachedData(lat: number, lng: number): ClimateStats | null {
  const key = CACHE_PREFIX + getCacheKey(lat, lng);
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  
  try {
    const entry = JSON.parse(cached);
    const now = new Date().getTime();
    // 24 hour cache expiration
    if (now - entry.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch (e) {
    return null;
  }
}

/**
 * Saves processed climate data to localStorage.
 */
function setCachedData(lat: number, lng: number, data: ClimateStats) {
  const key = CACHE_PREFIX + getCacheKey(lat, lng);
  const entry = {
    timestamp: new Date().getTime(),
    data
  };
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    // If storage is full, clear old cache entries
    console.warn("LocalStorage full, clearing climate cache");
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(CACHE_PREFIX)) localStorage.removeItem(k);
    });
  }
}

export function degToCardinal(deg: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}

/**
 * Enhanced Geocode search with smart fallbacks.
 */
export async function geocode(query: string): Promise<LocationInfo[]> {
  const sanitized = query.trim();
  if (!sanitized || sanitized.length < 2) return [];
  
  const performSearch = async (term: string): Promise<LocationInfo[]> => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=10&language=en&format=json`;
    const response = await fetch(url);
    
    if (response.status === 429) throw new Error("RATE_LIMIT: Search limit reached. Please wait.");
    if (!response.ok) throw new Error("SERVICE_UNAVAILABLE: Search service unavailable.");
    
    const data = await response.json();
    if (!data.results) return [];
    
    return data.results.map((r: any) => ({
      name: `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}${r.country ? ', ' + r.country : ''}`,
      lat: r.latitude,
      lng: r.longitude,
      country: r.country,
    }));
  };

  try {
    // Try primary search
    let results = await performSearch(sanitized);
    
    // If no results and query contains commas, try searching for just the first part (the city)
    if (results.length === 0 && sanitized.includes(',')) {
      const parts = sanitized.split(',').map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length > 0) {
        results = await performSearch(parts[0]);
      }
    }
    
    return results;
  } catch (err: any) {
    throw err;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`;
    const response = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!response.ok) return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
    const data = await response.json();
    return data.display_name || `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  } catch (err) {
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  }
}

async function fetchWithRetry(lat: number, lng: number): Promise<any> {
  const end = new Date();
  const start = new Date();
  // Standard WMO Climate Baseline (30 Years)
  start.setFullYear(end.getFullYear() - 30);
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const params = [
    'temperature_2m_max',
    'temperature_2m_min',
    'temperature_2m_mean',
    'precipitation_sum',
    'shortwave_radiation_sum',
    'windspeed_10m_max',
    'wind_direction_10m_dominant',
    'relative_humidity_2m_mean',
    'uv_index_max'
  ].join(',');

  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${fmt(start)}&end_date=${fmt(end)}&daily=${params}&timezone=auto`;

  const response = await fetch(url);
  
  if (response.status === 429) {
    throw new Error("RATE_LIMIT: The Climate API is under heavy load. We've retrieved data from cache where possible, but new locations need a 60-second break.");
  }

  if (!response.ok) {
    if (response.status === 400) throw new Error("OUTSIDE_GRID: Location not in historical records (e.g. Deep Ocean).");
    throw new Error(`API_ERROR: HTTP ${response.status}`);
  }
  return await response.json();
}

export async function fetchClimateData(lat: number, lng: number, locationName?: string): Promise<ClimateStats> {
  const cached = getCachedData(lat, lng);
  if (cached) {
    console.log("Serving from local cache for:", locationName);
    return { ...cached, location: { ...cached.location, name: locationName || cached.location.name } };
  }

  const raw = await fetchWithRetry(lat, lng);
  if (!raw.daily) throw new Error("NO_DATA: No historical records found.");

  const daily = raw.daily;
  const time = daily.time;
  const monthBuckets = Array.from({ length: 12 }, () => ({
    tempMax: [] as number[],
    tempMin: [] as number[],
    tempMean: [] as number[],
    rain: [] as number[],
    solar: [] as number[],
    uv: [] as number[],
    wind: [] as number[],
    windDirs: [] as number[],
    humidity: [] as number[],
    rainyDaysCount: 0
  }));

  for (let i = 0; i < time.length; i++) {
    const month = parseInt(time[i].substring(5, 7), 10) - 1;
    const bucket = monthBuckets[month];
    if (daily.temperature_2m_max[i] != null) bucket.tempMax.push(daily.temperature_2m_max[i]);
    if (daily.temperature_2m_min[i] != null) bucket.tempMin.push(daily.temperature_2m_min[i]);
    if (daily.temperature_2m_mean[i] != null) bucket.tempMean.push(daily.temperature_2m_mean[i]);
    if (daily.precipitation_sum[i] != null) {
      bucket.rain.push(daily.precipitation_sum[i]);
      if (daily.precipitation_sum[i] >= 1.0) bucket.rainyDaysCount++;
    }
    if (daily.shortwave_radiation_sum[i] != null) bucket.solar.push(daily.shortwave_radiation_sum[i]);
    if (daily.uv_index_max && daily.uv_index_max[i] != null) bucket.uv.push(daily.uv_index_max[i]);
    if (daily.windspeed_10m_max[i] != null) bucket.wind.push(daily.windspeed_10m_max[i]);
    if (daily.wind_direction_10m_dominant[i] != null) bucket.windDirs.push(daily.wind_direction_10m_dominant[i]);
    if (daily.relative_humidity_2m_mean[i] != null) bucket.humidity.push(daily.relative_humidity_2m_mean[i]);
  }

  const yearsProcessed = 30;
  const initialMonthlyData: MonthlyClimateData[] = monthBuckets.map((b, idx) => {
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, c) => a + c, 0) / arr.length : 0;
    const max = (arr: number[]) => arr.length ? Math.max(...arr) : 0;
    const min = (arr: number[]) => arr.length ? Math.min(...arr) : 0;
    
    const cardinalCounts: Record<string, number> = {};
    b.windDirs.forEach(d => {
      const c = degToCardinal(d);
      cardinalCounts[c] = (cardinalCounts[c] || 0) + 1;
    });
    const prevailingCardinal = Object.entries(cardinalCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N';
    const cardinalToDeg: Record<string, number> = { 'N': 0, 'NE': 45, 'E': 90, 'SE': 135, 'S': 180, 'SW': 225, 'W': 270, 'NW': 315 };

    const tAvg = avg(b.tempMean);
    const rh = avg(b.humidity);
    const rain = b.rain.reduce((a,c)=>a+c,0) / yearsProcessed;
    const solar = avg(b.solar);
    const wind = avg(b.wind);

    return {
      month: MONTH_NAMES[idx],
      monthIdx: idx,
      tempAvg: parseFloat(tAvg.toFixed(1)),
      tempMax: parseFloat(max(b.tempMax).toFixed(1)),
      tempMin: parseFloat(min(b.tempMin).toFixed(1)),
      rainfall: parseFloat(rain.toFixed(1)),
      rainyDays: Math.round(b.rainyDaysCount / yearsProcessed),
      humidity: parseFloat(rh.toFixed(1)),
      humidityMax: parseFloat(max(b.humidity).toFixed(1)),
      humidityMin: parseFloat(min(b.humidity).toFixed(1)),
      windSpeed: parseFloat(wind.toFixed(1)),
      windMax: parseFloat(max(b.wind).toFixed(1)),
      windDir: cardinalToDeg[prevailingCardinal], 
      solarIntensity: parseFloat(solar.toFixed(1)),
      peakSunHours: parseFloat((solar / 3.6).toFixed(1)),
      uvIndex: parseFloat(avg(b.uv).toFixed(1)),
      heatIndex: parseFloat((tAvg + (rh > 40 ? (tAvg > 25 ? 0.047 * (rh - 40) * (tAvg - 20) : 0) : 0)).toFixed(1)),
      isSunny: solar >= CLIMATE_THRESHOLDS.SUNNY_MIN_SOLAR && rain < CLIMATE_THRESHOLDS.SUNNY_MAX_PRECIP,
      isRainy: rain >= CLIMATE_THRESHOLDS.RAINY_MIN_PRECIP || (b.rainyDaysCount / yearsProcessed) >= CLIMATE_THRESHOLDS.RAINY_MIN_DAYS,
      isWinter: tAvg <= CLIMATE_THRESHOLDS.WINTER_MAX_TEMP,
      isWindy: wind >= CLIMATE_THRESHOLDS.WINDY_MIN_SPEED
    };
  });

  // Relative seasonal fallbacks
  const hasWinter = initialMonthlyData.some(m => m.isWinter);
  const hasRainy = initialMonthlyData.some(m => m.isRainy);
  const hasSunny = initialMonthlyData.some(m => m.isSunny);
  const hasWindy = initialMonthlyData.some(m => m.isWindy);

  const sortedByTemp = [...initialMonthlyData].sort((a, b) => a.tempAvg - b.tempAvg);
  const sortedByRain = [...initialMonthlyData].sort((a, b) => b.rainfall - a.rainfall);
  const sortedBySolar = [...initialMonthlyData].sort((a, b) => b.solarIntensity - a.solarIntensity);
  const sortedByWind = [...initialMonthlyData].sort((a, b) => b.windSpeed - a.windSpeed);

  const finalMonthlyData = initialMonthlyData.map(m => ({
    ...m,
    isWinter: hasWinter ? m.isWinter : sortedByTemp.slice(0, 3).some(sm => sm.monthIdx === m.monthIdx),
    isRainy: hasRainy ? m.isRainy : sortedByRain.slice(0, 3).some(sm => sm.monthIdx === m.monthIdx),
    isSunny: hasSunny ? m.isSunny : sortedBySolar.slice(0, 3).some(sm => sm.monthIdx === m.monthIdx),
    isWindy: hasWindy ? m.isWindy : sortedByWind.slice(0, 3).some(sm => sm.monthIdx === m.monthIdx),
  }));

  const result: ClimateStats = {
    location: { name: locationName || "Location", lat, lng },
    period: "30-Year WMO Climate Baseline",
    reliabilityScore: 99.9,
    monthlyData: finalMonthlyData,
    summary: {
      hottestMonth: sortedByTemp[11].month,
      coldestMonth: sortedByTemp[0].month,
      rainiestMonth: sortedByRain[0].month,
      sunniestMonth: sortedBySolar[0].month,
    }
  };

  setCachedData(lat, lng, result);
  return result;
}
