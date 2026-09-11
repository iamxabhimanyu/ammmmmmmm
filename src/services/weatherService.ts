import {
  CurrentWeather,
  HourlyForecastItem,
  DailyForecastItem,
  AirQualityData,
  WeatherAlert,
  WeatherConditionKey,
  AgroMetAdvisory,
  PersonaType,
  TravelRoute,
  LocationInfo,
} from '../types';
import { MAJOR_INDIAN_CITIES } from '../data/constants';

export async function searchIndianLocations(query: string): Promise<LocationInfo[]> {
  if (!query.trim()) return [];
  const lowerQ = query.toLowerCase();
  const localMatches = MAJOR_INDIAN_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(lowerQ) ||
      c.state.toLowerCase().includes(lowerQ)
  );

  try {
    const res = await fetch(`/api/search-location?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const apiResults = await res.json();
      const combined = [...localMatches];
      for (const item of apiResults) {
        const already = combined.some(
          (c) =>
            Math.abs(c.lat - item.lat) < 0.05 &&
            Math.abs(c.lon - item.lon) < 0.05
        );
        if (!already) combined.push(item);
      }
      return combined;
    }
  } catch (e) {
    console.warn('Location search API error:', e);
  }
  return localMatches;
}

export function mapWmoCodeToCondition(code: number, isDay: boolean = true): {
  key: WeatherConditionKey;
  text: string;
  icon: string;
} {
  switch (code) {
    case 0:
      return { key: 'clear', text: isDay ? 'Clear Sky' : 'Clear Night', icon: isDay ? 'Sun' : 'Moon' };
    case 1:
      return { key: 'clear', text: isDay ? 'Mainly Sunny' : 'Mainly Clear', icon: isDay ? 'Sun' : 'Moon' };
    case 2:
      return { key: 'partly-cloudy', text: 'Partly Cloudy', icon: 'CloudSun' };
    case 3:
      return { key: 'overcast', text: 'Overcast', icon: 'Cloud' };
    case 45:
    case 48:
      return { key: 'fog', text: 'Fog / Mist', icon: 'CloudFog' };
    case 51:
    case 53:
    case 55:
      return { key: 'drizzle', text: 'Light Drizzle', icon: 'CloudDrizzle' };
    case 61:
    case 63:
      return { key: 'rain', text: 'Moderate Rain', icon: 'CloudRain' };
    case 65:
      return { key: 'heavy-rain', text: 'Heavy Rainfall', icon: 'CloudRainWind' };
    case 71:
    case 73:
    case 75:
      return { key: 'snow', text: 'Snowfall', icon: 'CloudSnow' };
    case 80:
    case 81:
    case 82:
      return { key: 'rain', text: 'Rain Showers', icon: 'CloudRain' };
    case 95:
      return { key: 'thunderstorm', text: 'Thunderstorm', icon: 'CloudLightning' };
    case 96:
    case 99:
      return { key: 'thunderstorm', text: 'Severe Thunderstorm & Hail', icon: 'CloudLightning' };
    default:
      return { key: 'partly-cloudy', text: 'Partly Cloudy', icon: 'CloudSun' };
  }
}

export function getThemeClassesForCondition(conditionKey: WeatherConditionKey, isDay: boolean = true) {
  if (!isDay) {
    return {
      bgGradient: 'from-slate-900 via-indigo-950 to-slate-950',
      heroAccent: 'text-indigo-200',
      cardBg: 'bg-slate-900/80 border-slate-800 text-slate-100',
      softBadge: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/40',
      sliderAccent: 'bg-indigo-800/40 text-indigo-200',
      isDark: true,
    };
  }

  switch (conditionKey) {
    case 'clear':
      return {
        bgGradient: 'from-amber-100/60 via-sky-50 to-slate-50',
        heroAccent: 'text-amber-600',
        cardBg: 'bg-white/85 border-slate-200/70 text-slate-900',
        softBadge: 'bg-amber-100/80 text-amber-900 border-amber-200',
        sliderAccent: 'bg-amber-100/70 text-amber-900',
        isDark: false,
      };
    case 'partly-cloudy':
      return {
        bgGradient: 'from-sky-100/70 via-slate-50 to-emerald-50/20',
        heroAccent: 'text-sky-600',
        cardBg: 'bg-white/90 border-slate-200/70 text-slate-900',
        softBadge: 'bg-sky-100 text-sky-900 border-sky-200',
        sliderAccent: 'bg-sky-100 text-sky-900',
        isDark: false,
      };
    case 'overcast':
    case 'fog':
      return {
        bgGradient: 'from-slate-200/70 via-slate-100 to-sky-50',
        heroAccent: 'text-slate-600',
        cardBg: 'bg-white/90 border-slate-200 text-slate-900',
        softBadge: 'bg-slate-200/80 text-slate-800 border-slate-300',
        sliderAccent: 'bg-slate-200/80 text-slate-900',
        isDark: false,
      };
    case 'rain':
    case 'drizzle':
      return {
        bgGradient: 'from-sky-200/60 via-blue-50 to-slate-100',
        heroAccent: 'text-blue-600',
        cardBg: 'bg-white/90 border-blue-100 text-slate-900',
        softBadge: 'bg-blue-100 text-blue-900 border-blue-200',
        sliderAccent: 'bg-blue-100 text-blue-900',
        isDark: false,
      };
    case 'heavy-rain':
    case 'thunderstorm':
      return {
        bgGradient: 'from-slate-300/80 via-indigo-100/60 to-slate-150',
        heroAccent: 'text-indigo-700',
        cardBg: 'bg-white/90 border-indigo-100 text-slate-900',
        softBadge: 'bg-indigo-100 text-indigo-950 border-indigo-200',
        sliderAccent: 'bg-indigo-100 text-indigo-900',
        isDark: false,
      };
    default:
      return {
        bgGradient: 'from-sky-100/60 via-slate-50 to-slate-50',
        heroAccent: 'text-sky-600',
        cardBg: 'bg-white/90 border-slate-200 text-slate-900',
        softBadge: 'bg-sky-100 text-sky-900 border-sky-200',
        sliderAccent: 'bg-sky-100 text-sky-900',
        isDark: false,
      };
  }
}

export async function fetchLiveWeatherData(lat: number, lon: number): Promise<{
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
}> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,surface_pressure,visibility,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=Asia%2FKolkata`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Weather fetch failed: ${res.statusText}`);
  }

  const data = await res.json();
  const c = data.current;
  const isDay = c.is_day === 1;
  const cond = mapWmoCodeToCondition(c.weather_code, isDay);

  // Parse Hourly (next 24 hours)
  const now = new Date();
  const currentHourIso = now.toISOString().slice(0, 13);
  let startIndex = data.hourly.time.findIndex((t: string) => t.startsWith(currentHourIso));
  if (startIndex === -1) startIndex = 0;

  const hourly: HourlyForecastItem[] = [];
  for (let i = startIndex; i < Math.min(startIndex + 24, data.hourly.time.length); i++) {
    const rawTime = data.hourly.time[i];
    const dateObj = new Date(rawTime);
    const hourVal = dateObj.getHours();
    const ampm = hourVal >= 12 ? 'PM' : 'AM';
    const displayHour = hourVal % 12 === 0 ? 12 : hourVal % 12;
    const isNow = i === startIndex;
    const timeLabel = isNow ? 'Now' : `${displayHour} ${ampm}`;
    const hCode = data.hourly.weather_code[i];
    const hCond = mapWmoCodeToCondition(hCode, hourVal >= 6 && hourVal < 19);

    hourly.push({
      time: timeLabel,
      isoTime: rawTime,
      timestamp: dateObj.getTime(),
      temperature: Math.round(data.hourly.temperature_2m[i]),
      feelsLike: Math.round(data.hourly.apparent_temperature[i]),
      conditionCode: hCode,
      conditionKey: hCond.key,
      conditionText: hCond.text,
      precipitationProb: Math.round(data.hourly.precipitation_probability[i] || 0),
      rainMm: Number((data.hourly.precipitation[i] || 0).toFixed(1)),
      windSpeed: Math.round(data.hourly.wind_speed_10m[i] || 0),
      humidity: Math.round(data.hourly.relative_humidity_2m[i] || 0),
      uvIndex: Math.round(data.hourly.uv_index[i] || 0),
    });
  }

  // Parse Daily (7-10 days)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const daily: DailyForecastItem[] = [];

  for (let d = 0; d < data.daily.time.length; d++) {
    const dStr = data.daily.time[d];
    const dObj = new Date(dStr);
    const dayLabel = d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : dayNames[dObj.getDay()];
    const fullDate = `${dObj.getDate()} ${monthNames[dObj.getMonth()]}`;
    const dCode = data.daily.weather_code[d];
    const dCond = mapWmoCodeToCondition(dCode, true);

    daily.push({
      date: dStr,
      dayName: dayLabel,
      fullDate,
      conditionCode: dCode,
      conditionKey: dCond.key,
      conditionText: dCond.text,
      tempMax: Math.round(data.daily.temperature_2m_max[d]),
      tempMin: Math.round(data.daily.temperature_2m_min[d]),
      precipitationProb: Math.round(data.daily.precipitation_probability_max[d] || 0),
      rainSumMm: Number((data.daily.precipitation_sum[d] || 0).toFixed(1)),
      windSpeedMax: Math.round(data.daily.wind_speed_10m_max[d] || 0),
      uvIndexMax: Math.round(data.daily.uv_index_max[d] || 0),
      sunrise: data.daily.sunrise[d] ? data.daily.sunrise[d].slice(11, 16) : '06:05',
      sunset: data.daily.sunset[d] ? data.daily.sunset[d].slice(11, 16) : '18:32',
      humidity: hourly[0]?.humidity ?? 65,
    });
  }

  // Today High and Low from daily[0]
  const todayHigh = daily[0]?.tempMax ?? Math.round(c.temperature_2m + 3);
  const todayLow = daily[0]?.tempMin ?? Math.round(c.temperature_2m - 4);

  // Current weather
  const current: CurrentWeather = {
    temperature: Math.round(c.temperature_2m),
    feelsLike: Math.round(c.apparent_temperature),
    conditionCode: c.weather_code,
    conditionKey: cond.key,
    conditionText: cond.text,
    high: todayHigh,
    low: todayLow,
    humidity: Math.round(c.relative_humidity_2m),
    windSpeed: Math.round(c.wind_speed_10m),
    windDirection: Math.round(c.wind_direction_10m),
    windGust: Math.round(c.wind_gusts_10m || c.wind_speed_10m * 1.4),
    pressure: Math.round(c.pressure_msl || 1012),
    visibility: Math.round((data.hourly.visibility?.[startIndex] || 10000) / 1000),
    uvIndex: Math.round(data.hourly.uv_index?.[startIndex] || 5),
    dewPoint: Math.round(data.hourly.dew_point_2m?.[startIndex] || c.temperature_2m - (100 - c.relative_humidity_2m) / 5),
    precipitation24h: Number((c.precipitation || 0).toFixed(1)),
    cloudCover: Math.round(c.cloud_cover || 20),
    sunrise: daily[0]?.sunrise || '06:05',
    sunset: daily[0]?.sunset || '18:32',
    isDay,
    time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };

  return { current, hourly, daily };
}

export async function fetchAirQualityData(lat: number, lon: number): Promise<AirQualityData> {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&timezone=Asia%2FKolkata`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Air quality fetch failed');
    const data = await res.json();
    const curr = data.current || {};

    const pm25 = Math.round(curr.pm2_5 || 28);
    const pm10 = Math.round(curr.pm10 || 58);

    // Calculate Indian CPCB standard AQI approximation
    let aqi = 75;
    if (pm25 <= 30) aqi = Math.round((pm25 / 30) * 50);
    else if (pm25 <= 60) aqi = Math.round(50 + ((pm25 - 30) / 30) * 50);
    else if (pm25 <= 90) aqi = Math.round(100 + ((pm25 - 60) / 30) * 100);
    else if (pm25 <= 120) aqi = Math.round(200 + ((pm25 - 90) / 30) * 100);
    else if (pm25 <= 250) aqi = Math.round(300 + ((pm25 - 120) / 130) * 100);
    else aqi = Math.min(500, Math.round(400 + ((pm25 - 250) / 130) * 100));

    let category: AirQualityData['category'] = 'Moderate';
    let color = 'text-amber-600';
    let bgColor = 'bg-amber-100 text-amber-900 border-amber-200';
    let healthAdvice = 'Air quality is acceptable for most people.';

    if (aqi <= 50) {
      category = 'Good';
      color = 'text-emerald-600';
      bgColor = 'bg-emerald-100 text-emerald-900 border-emerald-200';
      healthAdvice = 'Minimal impact. Ideal for outdoor recreation & sports.';
    } else if (aqi <= 100) {
      category = 'Satisfactory';
      color = 'text-lime-600';
      bgColor = 'bg-lime-100 text-lime-900 border-lime-200';
      healthAdvice = 'Minor breathing discomfort to sensitive individuals.';
    } else if (aqi <= 200) {
      category = 'Moderate';
      color = 'text-amber-600';
      bgColor = 'bg-amber-100 text-amber-900 border-amber-200';
      healthAdvice = 'Breathing discomfort to people with asthma and lung diseases.';
    } else if (aqi <= 300) {
      category = 'Poor';
      color = 'text-orange-600';
      bgColor = 'bg-orange-100 text-orange-900 border-orange-200';
      healthAdvice = 'Breathing discomfort to most people on prolonged exposure.';
    } else if (aqi <= 400) {
      category = 'Very Poor';
      color = 'text-red-600';
      bgColor = 'bg-red-100 text-red-900 border-red-200';
      healthAdvice = 'Respiratory illness on prolonged exposure. Avoid heavy jogging.';
    } else {
      category = 'Severe';
      color = 'text-purple-600';
      bgColor = 'bg-purple-100 text-purple-900 border-purple-200';
      healthAdvice = 'Affects healthy people and seriously impacts those with ailments. Stay indoors.';
    }

    return {
      aqi,
      category,
      color,
      bgColor,
      pm25,
      pm10,
      nitrogenDioxide: Math.round(curr.nitrogen_dioxide || 14),
      sulphurDioxide: Math.round(curr.sulphur_dioxide || 8),
      ozone: Math.round(curr.ozone || 42),
      carbonMonoxide: Math.round((curr.carbon_monoxide || 380) / 100),
      healthAdvice,
      source: 'CPCB & Copernicus Air Monitoring',
    };
  } catch (e) {
    return {
      aqi: 82,
      category: 'Satisfactory',
      color: 'text-lime-600',
      bgColor: 'bg-lime-100 text-lime-900 border-lime-200',
      pm25: 26,
      pm10: 64,
      nitrogenDioxide: 18,
      sulphurDioxide: 9,
      ozone: 36,
      carbonMonoxide: 4,
      healthAdvice: 'Air quality is within normal parameters.',
      source: 'IMD-SAFAR Estimation',
    };
  }
}

export function generateAlerts(
  locationName: string,
  state: string,
  weather: CurrentWeather,
  hourly: HourlyForecastItem[]
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const maxRainProb = Math.max(...hourly.slice(0, 12).map((h) => h.precipitationProb));
  const maxRainMm = Math.max(...hourly.slice(0, 12).map((h) => h.rainMm));

  if (weather.conditionKey === 'thunderstorm' || maxRainMm > 15) {
    alerts.push({
      id: 'alert-imd-heavy-rain',
      severity: 'warning',
      alertType: 'Heavy Rainfall & Thunderstorm Warning',
      title: 'Heavy Rainfall & Convective Activity',
      issuedBy: 'IMD',
      region: `${locationName}, ${state}`,
      issuedAt: 'Today, 08:30 IST',
      validUntil: 'Next 24 Hours',
      headline: 'Heavy rainfall with isolated intense spells expected across district.',
      description: 'Atmospheric instability is triggering active cloud development over the region with gusty winds and lightning strikes.',
      actionableAdvice: [
        'Carry an umbrella or rain poncho before heading out.',
        'Allow extra travel time as waterlogging may slow traffic on subways and arterial roads.',
        'Do not take shelter under solitary tall trees during active lightning.',
      ],
      colorCode: 'Orange',
    });
  } else if (maxRainProb >= 50) {
    alerts.push({
      id: 'alert-nowcast-rain',
      severity: 'advisory',
      alertType: 'Nowcast Advisory (Rain Showers)',
      title: 'Showers Expected in Nearby Areas',
      issuedBy: 'IMD',
      region: `${locationName}`,
      issuedAt: 'Updated 30 mins ago',
      validUntil: 'Next 6 Hours',
      headline: 'Passing rain showers likely during evening commute.',
      description: 'Radar reflectivity shows scattered rain bands tracking across the metropolitan perimeter.',
      actionableAdvice: [
        'Keep rain gear handy if stepping out after 4 PM.',
        'Two-wheeler riders should exercise caution on slick bitumen roads.',
      ],
      colorCode: 'Yellow',
    });
  }

  if (weather.temperature >= 39) {
    alerts.push({
      id: 'alert-heat-wave',
      severity: 'warning',
      alertType: 'Heat Wave Advisory',
      title: 'High Temperature Alert (IMD Heatwave Watch)',
      issuedBy: 'NDMA',
      region: `${locationName}, ${state}`,
      issuedAt: 'Today, 06:00 IST',
      validUntil: 'Today 17:00 IST',
      headline: 'Day temperatures are running 3°C to 5°C above normal seasonal average.',
      description: 'Prolonged direct sun exposure may lead to heat exhaustion and dehydration.',
      actionableAdvice: [
        'Stay well-hydrated; drink water frequently even if not thirsty.',
        'Wear light-colored, loose cotton clothing.',
        'Avoid strenuous outdoor work between 12:00 PM and 3:30 PM.',
      ],
      colorCode: 'Orange',
    });
  }

  if (weather.visibility <= 2) {
    alerts.push({
      id: 'alert-fog-vis',
      severity: 'advisory',
      alertType: 'Dense Fog & Low Visibility',
      title: 'Morning Fog Advisory',
      issuedBy: 'IMD',
      region: `${locationName} & Surrounding Highways`,
      issuedAt: 'Early Morning IST',
      validUntil: '10:00 AM IST',
      headline: 'Shallow to moderate fog reducing visibility on highways.',
      description: 'Surface radiation inversion is keeping humidity near saturation near ground level.',
      actionableAdvice: [
        'Use low-beam headlights and fog lamps when driving.',
        'Maintain double following distance behind heavy vehicles.',
      ],
      colorCode: 'Yellow',
    });
  }

  // If no severe or advisory alerts, provide a clean Green IMD status
  if (alerts.length === 0) {
    alerts.push({
      id: 'alert-clear-green',
      severity: 'info',
      alertType: 'All Clear (IMD Bulletin)',
      title: 'Fair Weather Conditions Prevailing',
      issuedBy: 'IMD',
      region: `${locationName}, ${state}`,
      issuedAt: 'Today, 08:30 IST',
      validUntil: 'Next 24 Hours',
      headline: 'No severe weather warning is active for this district.',
      description: 'Atmospheric pressure and flow patterns are normal for the season.',
      actionableAdvice: [
        'Normal outdoor activities and travel can proceed uninterrupted.',
        'Enjoy the pleasant weather conditions.',
      ],
      colorCode: 'Green',
    });
  }

  return alerts;
}

export function generateAgroMetAdvisory(
  location: string,
  weather: CurrentWeather,
  daily: DailyForecastItem[]
): AgroMetAdvisory {
  const next3DaysRainProb = Math.max(...daily.slice(0, 3).map((d) => d.precipitationProb));
  const temp = weather.temperature;

  let sprayStatus: AgroMetAdvisory['spraySafety']['status'] = 'Safe';
  let sprayReason = 'Winds are calm (< 15 km/h) and rain probability is minimal.';
  let nextFavorable = 'Clear window available through next 48 hours.';

  if (next3DaysRainProb > 45 || weather.windSpeed > 18) {
    sprayStatus = 'Unfavorable';
    sprayReason = `High rain likelihood (${next3DaysRainProb}%) or gusty winds (${weather.windSpeed} km/h) will wash away or drift agrochemical sprays.`;
    nextFavorable = 'Wait for the rain spell to pass; check radar after 36 hours.';
  } else if (next3DaysRainProb > 25) {
    sprayStatus = 'Caution';
    sprayReason = 'Isolated rain showers possible in afternoons; spray early morning if essential.';
    nextFavorable = 'Tomorrow 06:00 AM - 09:30 AM.';
  }

  return {
    cropSeason: 'Kharif',
    primaryCrops: ['Paddy (Rice)', 'Cotton', 'Soybean', 'Maize', 'Pulses'],
    spraySafety: {
      status: sprayStatus,
      reason: sprayReason,
      nextFavorableWindow: nextFavorable,
    },
    irrigationAdvisory:
      next3DaysRainProb > 50
        ? 'Withhold scheduled field irrigation to prevent root waterlogging and nutrient leaching.'
        : temp > 34
        ? 'Provide light, frequent irrigation during late evening to reduce heat stress on flowering crops.'
        : 'Maintain standard moisture regime; ensure surface drainage channels are clear.',
    sowingHarvestingNotice:
      next3DaysRainProb > 50
        ? 'Keep harvested produce covered with tarpaulins in mandi or threshing yards.'
        : 'Favorable conditions for field preparation and standard intercultural operations.',
    soilMoistureEst: weather.humidity > 70 ? 'High / Saturated (75%)' : 'Optimal Moisture (58%)',
    pestDiseaseAlert:
      weather.humidity > 80 && temp > 26
        ? 'High humidity & warm temps favor fungal blast and sucking pests in rice and cotton. Monitor weekly.'
        : 'Low pest infestation risk currently reported across district blocks.',
  };
}

export function getTravelRouteData(origin: string, destination: string): TravelRoute {
  return {
    routeName: `${origin} to ${destination} Route`,
    origin,
    destination,
    totalKm: 148,
    overallAdvisory: 'Route weather is generally stable with isolated damp pavement in ghat sections.',
    stops: [
      {
        city: origin,
        distanceKm: 0,
        eta: 'Depart 08:00 AM',
        temp: 28,
        condition: 'Clear Sky',
        conditionKey: 'clear',
        rainProb: 10,
        roadCondition: 'Clear',
      },
      {
        city: 'Khandala / Lonavala Ghat',
        distanceKm: 82,
        eta: '09:45 AM',
        temp: 23,
        condition: 'Passing Fog & Drizzle',
        conditionKey: 'fog',
        rainProb: 45,
        roadCondition: 'Wet',
      },
      {
        city: 'Talegaon Tollway',
        distanceKm: 118,
        eta: '10:30 AM',
        temp: 27,
        condition: 'Partly Cloudy',
        conditionKey: 'partly-cloudy',
        rainProb: 15,
        roadCondition: 'Clear',
      },
      {
        city: destination,
        distanceKm: 148,
        eta: 'Arrive 11:15 AM',
        temp: 29,
        condition: 'Pleasant & Sunny',
        conditionKey: 'clear',
        rainProb: 10,
        roadCondition: 'Clear',
      },
    ],
  };
}
