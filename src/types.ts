/**
 * Core Types and Interfaces for MAUSAM Indian Weather Intelligence
 */

export type WeatherConditionKey =
  | 'clear'
  | 'partly-cloudy'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy-rain'
  | 'thunderstorm'
  | 'snow'
  | 'dust';

export interface WeatherConditionInfo {
  key: WeatherConditionKey;
  label: string;
  description: string;
  icon: string;
  bgGradient: string;
  cardBg: string;
  accentColor: string;
  badgeBg: string;
  textColor: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  conditionCode: number;
  conditionKey: WeatherConditionKey;
  conditionText: string;
  high: number;
  low: number;
  humidity: number;
  windSpeed: number; // km/h
  windDirection: number; // degrees
  windGust: number; // km/h
  pressure: number; // hPa
  visibility: number; // km
  uvIndex: number;
  dewPoint: number;
  precipitation24h: number; // mm
  cloudCover: number; // %
  sunrise: string;
  sunset: string;
  isDay: boolean;
  time: string;
}

export interface HourlyForecastItem {
  time: string; // "10 AM", "Now"
  isoTime: string;
  timestamp: number;
  temperature: number;
  feelsLike: number;
  conditionCode: number;
  conditionKey: WeatherConditionKey;
  conditionText: string;
  precipitationProb: number; // %
  rainMm: number;
  windSpeed: number;
  humidity: number;
  uvIndex: number;
}

export interface DailyForecastItem {
  date: string; // "YYYY-MM-DD"
  dayName: string; // "Today", "Sat", "Sun"
  fullDate: string; // "12 Sep 2026"
  conditionCode: number;
  conditionKey: WeatherConditionKey;
  conditionText: string;
  tempMax: number;
  tempMin: number;
  precipitationProb: number; // %
  rainSumMm: number;
  windSpeedMax: number;
  uvIndexMax: number;
  sunrise: string;
  sunset: string;
  humidity: number;
}

export interface AirQualityData {
  aqi: number; // Indian CPCB scale (0 - 500)
  category: 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';
  color: string;
  bgColor: string;
  pm25: number;
  pm10: number;
  nitrogenDioxide: number;
  sulphurDioxide: number;
  ozone: number;
  carbonMonoxide: number;
  healthAdvice: string;
  source: string;
}

export type AlertSeverity = 'severe' | 'warning' | 'advisory' | 'info';

export interface WeatherAlert {
  id: string;
  severity: AlertSeverity;
  alertType: string;
  title: string;
  issuedBy: 'IMD' | 'NDMA' | 'State SDMA' | 'CAP India';
  region: string;
  issuedAt: string;
  validUntil: string;
  headline: string;
  description: string;
  actionableAdvice: string[];
  impactZones?: string[];
  colorCode: 'Red' | 'Orange' | 'Yellow' | 'Green';
}

export interface LocationInfo {
  id: string;
  name: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  isCurrent?: boolean;
}

export type PersonaType =
  | 'runner'
  | 'commuter'
  | 'traveller'
  | 'health'
  | 'family'
  | 'farmer'
  | 'marine'
  // Legacy aliases for backward compatibility
  | 'general'
  | 'outdoor'
  | 'student'
  | 'safety';

export interface PersonaProfile {
  id: PersonaType;
  label: string;
  icon: string;
  badge: string;
  description: string;
  tagline?: string;
  primaryQuestion?: string;
}

export interface PersonaMetricItem {
  label: string;
  value: string;
  subValue?: string;
  status?: 'good' | 'moderate' | 'caution' | 'neutral';
  icon?: string;
}

export interface PersonaHourlyScore {
  time: string;
  score: number; // 0-100
  status: 'Ideal' | 'Good' | 'Fair' | 'Avoid';
  temp: number;
  rainProb: number;
  conditionText?: string;
  note?: string;
}

export interface PersonaIntelligence {
  personaId: PersonaType;
  label: string;
  iconName: string;
  score: number; // 0-100
  scoreLabel: 'Excellent' | 'Good' | 'Moderate' | 'Poor' | 'Caution';
  primaryQuestion: string;
  primaryAnswer: string;
  bestWindow: string;
  bestWindowSub?: string;
  avoidWindow?: string;
  avoidWindowReason?: string;
  keyConditions: {
    label: string;
    value: string;
    status?: 'good' | 'moderate' | 'caution' | 'neutral';
  }[];
  recommendation: string;
  advisoryHeadline: string;
  prioritizedMetrics: PersonaMetricItem[];
  hourlySuitability: PersonaHourlyScore[];
  whatToCarryOrAction: string[];
  actionButton?: {
    label: string;
    actionType: 'agromet' | 'travel' | 'radar' | 'alerts' | 'custom';
  };
}

export interface AgroMetAdvisory {
  cropSeason: 'Kharif' | 'Rabi' | 'Zaid';
  primaryCrops: string[];
  spraySafety: {
    status: 'Safe' | 'Caution' | 'Unfavorable';
    reason: string;
    nextFavorableWindow: string;
  };
  irrigationAdvisory: string;
  sowingHarvestingNotice: string;
  soilMoistureEst: string; // e.g., "Adequate (65%)"
  pestDiseaseAlert: string;
}

export interface JourneyStop {
  city: string;
  distanceKm: number;
  eta: string;
  temp: number;
  condition: string;
  conditionKey: WeatherConditionKey;
  rainProb: number;
  roadCondition: 'Clear' | 'Wet' | 'Foggy' | 'Waterlogged';
}

export interface TravelRoute {
  routeName: string;
  origin: string;
  destination: string;
  totalKm: number;
  overallAdvisory: string;
  stops: JourneyStop[];
}

export interface CitizenReport {
  id: string;
  location: string;
  state: string;
  condition: string;
  conditionKey: WeatherConditionKey;
  temp: number;
  timeAgo: string;
  reporterName: string;
  verified: boolean;
  upvotes: number;
  userUpvoted?: boolean;
  notes: string;
  tag?: 'Waterlogging' | 'Rainfall' | 'Hail' | 'Clear Sky' | 'Dense Fog' | 'High Wind';
}

export interface DopplerRadarStation {
  id: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  type: 'S-Band' | 'C-Band' | 'X-Band';
  status: 'Operational' | 'Maintenance';
  rangeKm: number;
}

export type SatLayer = 'infrared' | 'visible' | 'waterVapour' | 'cloudTopTemp';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: string;
  suggestedActions?: string[];
}

export type SupportedLanguage =
  | 'en'
  | 'hi'
  | 'mr'
  | 'bn'
  | 'ta'
  | 'te'
  | 'gu'
  | 'kn'
  | 'pa';

export type ActiveTabType = 'home' | 'forecast' | 'radar' | 'alerts' | 'more';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}
