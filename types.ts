
export interface MonthlyClimateData {
  month: string;
  monthIdx: number;
  tempAvg: number;
  tempMax: number;
  tempMin: number;
  rainfall: number;
  rainyDays: number;
  humidity: number;
  humidityMax: number;
  humidityMin: number;
  windSpeed: number;
  windMax: number;
  windDir: number;
  solarIntensity: number; // Shortwave radiation in MJ/m² or W/m²
  peakSunHours: number;
  uvIndex: number; // Added UV Index property
  heatIndex: number;
  isSunny: boolean;
  isRainy: boolean;
  isWinter: boolean;
  isWindy: boolean;
}

export interface LocationInfo {
  name: string;
  lat: number;
  lng: number;
  country?: string;
}

export interface ClimateStats {
  location: LocationInfo;
  period: string;
  monthlyData: MonthlyClimateData[];
  reliabilityScore: number;
  summary: {
    hottestMonth: string;
    coldestMonth: string;
    rainiestMonth: string;
    sunniestMonth: string;
  };
}

export enum Page {
  OVERVIEW = 'overview',
  SUNNY = 'sunny',
  RAINY = 'rainy',
  WINTER = 'winter',
  STATS = 'stats',
  GRAPHS = 'graphs'
}
