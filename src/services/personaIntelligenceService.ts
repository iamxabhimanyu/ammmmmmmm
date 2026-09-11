import {
  CurrentWeather,
  HourlyForecastItem,
  DailyForecastItem,
  AirQualityData,
  PersonaType,
  PersonaIntelligence,
  PersonaHourlyScore,
  PersonaMetricItem,
} from '../types';

/**
 * Evaluates hour-by-hour weather suitability for a given persona.
 * Generates scores from 0-100 for each upcoming hour.
 */
function calculateHourlySuitability(
  persona: PersonaType,
  hourly: HourlyForecastItem[],
  airQuality: AirQualityData
): PersonaHourlyScore[] {
  return hourly.slice(0, 16).map((h) => {
    let score = 85;
    let note = '';

    const temp = h.temperature;
    const rain = h.precipitationProb;
    const uv = h.uvIndex;
    const wind = h.windSpeed;
    const aqi = airQuality.aqi;

    switch (persona) {
      case 'runner': {
        // Ideal running temp: 16-24°C, rain < 20%, AQI < 100, UV < 6
        if (temp > 34) score -= 35;
        else if (temp > 30) score -= 20;
        else if (temp < 12) score -= 10;

        if (rain > 50) score -= 35;
        else if (rain > 20) score -= 15;

        if (uv >= 8) score -= 20;
        else if (uv >= 6) score -= 10;

        if (aqi > 200) score -= 30;
        else if (aqi > 100) score -= 15;

        if (wind > 25) score -= 15;

        if (score >= 80) note = 'Prime running conditions';
        else if (score >= 65) note = 'Good; hydrate well';
        else if (temp > 30) note = 'High thermal stress';
        else if (rain > 40) note = 'Wet track risk';
        else note = 'Suboptimal weather';
        break;
      }

      case 'commuter': {
        // Transit & road safety: rain, fog/visibility, wind
        if (rain >= 70) score -= 40;
        else if (rain >= 40) score -= 20;

        if (h.conditionKey === 'thunderstorm') score -= 35;
        if (h.conditionKey === 'fog') score -= 30;
        if (wind > 35) score -= 20;

        if (score >= 80) note = 'Clear transit';
        else if (rain >= 50) note = 'Rain delays likely';
        else if (h.conditionKey === 'fog') note = 'Low visibility';
        else note = 'Allow 10m buffer';
        break;
      }

      case 'traveller': {
        if (rain >= 60) score -= 30;
        if (h.conditionKey === 'fog') score -= 25;
        if (h.conditionKey === 'thunderstorm') score -= 35;
        if (temp > 38) score -= 20;

        if (score >= 80) note = 'Ideal travel window';
        else if (score >= 65) note = 'Normal highway pace';
        else note = 'Proceed with caution';
        break;
      }

      case 'health': {
        // Highly sensitive to AQI, PM2.5, extreme heat, and peak UV
        if (aqi > 300) score -= 50;
        else if (aqi > 200) score -= 35;
        else if (aqi > 100) score -= 18;

        if (uv >= 8) score -= 25;
        else if (uv >= 6) score -= 15;

        if (temp >= 38) score -= 25;
        else if (temp >= 33) score -= 15;

        if (score >= 80) note = 'Clean air & mild UV';
        else if (aqi > 200) note = 'Poor AQI — mask up';
        else if (uv >= 7) note = 'Peak UV radiation';
        else note = 'Moderate sensitivity';
        break;
      }

      case 'family': {
        // Sensitive to rain, thunderstorms, extreme heat and peak midday sun
        if (rain >= 50) score -= 35;
        if (h.conditionKey === 'thunderstorm') score -= 40;
        if (temp > 35) score -= 30;
        else if (temp > 32) score -= 15;
        if (uv >= 7) score -= 20;
        if (aqi > 150) score -= 25;

        if (score >= 80) note = 'Safe for outdoor play';
        else if (temp > 32) note = 'Stay in the shade';
        else if (rain >= 40) note = 'Indoor play suggested';
        else note = 'Moderate conditions';
        break;
      }

      case 'farmer': {
        // Farm operations: spray safety, rainfall arrival, wind drift
        if (wind > 20) score -= 30; // spray drift
        if (rain > 40) score -= 35; // wash-off
        if (temp > 38) score -= 20; // heat stress

        if (score >= 80) note = 'Favorable field work';
        else if (wind > 20) note = 'High spray drift risk';
        else if (rain > 40) note = 'Rain expected — pause spray';
        else note = 'Monitor moisture';
        break;
      }

      case 'marine': {
        // Coastal safety: wind speed, thunderstorms, rainfall
        if (wind > 35) score -= 45;
        else if (wind > 22) score -= 25;

        if (h.conditionKey === 'thunderstorm') score -= 40;
        if (rain >= 50) score -= 20;

        if (score >= 80) note = 'Calm sea state';
        else if (wind > 30) note = 'Rough chop & gusts';
        else if (h.conditionKey === 'thunderstorm') note = 'Offshore storm risk';
        else note = 'Moderate swell';
        break;
      }

      default:
        break;
    }

    score = Math.max(15, Math.min(98, score));
    let status: PersonaHourlyScore['status'] = 'Ideal';
    if (score < 50) status = 'Avoid';
    else if (score < 70) status = 'Fair';
    else if (score < 85) status = 'Good';

    return {
      time: h.time,
      score,
      status,
      temp: h.temperature,
      rainProb: h.precipitationProb,
      conditionText: h.conditionText,
      note,
    };
  });
}

/**
 * Main Weather Intelligence Engine
 * Interprets real-time weather & forecast specifically for each persona.
 */
export function generatePersonaIntelligence(
  persona: PersonaType,
  weather: CurrentWeather,
  hourly: HourlyForecastItem[],
  daily: DailyForecastItem[],
  airQuality: AirQualityData,
  locationName: string
): PersonaIntelligence {
  const hourlyScores = calculateHourlySuitability(persona, hourly, airQuality);

  // Find optimal window (consecutive 2-3 hours with best score)
  let bestWindow = 'Early Morning';
  let bestWindowSub = 'Favorable atmospheric conditions';
  let avoidWindow: string | undefined;
  let avoidWindowReason: string | undefined;

  // Scan hourly scores
  let maxWindowScore = -1;
  let bestHourIdx = 0;
  for (let i = 0; i < Math.min(hourlyScores.length - 1, 10); i++) {
    const avg = (hourlyScores[i].score + hourlyScores[i + 1].score) / 2;
    if (avg > maxWindowScore) {
      maxWindowScore = avg;
      bestHourIdx = i;
    }
  }

  const startHour = hourlyScores[bestHourIdx]?.time || '06:00 AM';
  const endHour = hourlyScores[Math.min(bestHourIdx + 2, hourlyScores.length - 1)]?.time || '08:00 AM';
  bestWindow = `${startHour} – ${endHour}`;

  // Find worst hour for avoid window
  const worstHour = hourlyScores.reduce((worst, cur) => (cur.score < worst.score ? cur : worst), hourlyScores[0]);
  if (worstHour && worstHour.score < 60) {
    avoidWindow = `${worstHour.time}`;
    avoidWindowReason = worstHour.note || 'Unfavorable weather conditions';
  }

  // Base score
  const avgSuitability = Math.round(
    hourlyScores.slice(0, 8).reduce((acc, cur) => acc + cur.score, 0) / Math.min(hourlyScores.length, 8)
  );

  let score = avgSuitability;
  let scoreLabel: PersonaIntelligence['scoreLabel'] = 'Good';
  if (score >= 88) scoreLabel = 'Excellent';
  else if (score >= 75) scoreLabel = 'Good';
  else if (score >= 60) scoreLabel = 'Moderate';
  else scoreLabel = 'Caution';

  // 1. RUNNER / FITNESS
  if (persona === 'runner' || persona === 'outdoor') {
    const trackDryness =
      weather.precipitation24h > 10 || weather.conditionKey === 'rain'
        ? 'Wet & Slippery'
        : weather.precipitation24h > 2
        ? 'Damp Pavement'
        : 'Dry & Clean Track';

    const thermalComfort =
      weather.feelsLike > 35
        ? 'Very Hot / Oppressive'
        : weather.feelsLike > 30
        ? 'Warm & Humid'
        : weather.feelsLike < 15
        ? 'Crisp & Cool'
        : 'Optimal Thermal Comfort';

    const hydrationNeed =
      weather.feelsLike > 33 || weather.humidity > 80
        ? 'High (500-750ml/hr + Electrolytes)'
        : weather.feelsLike > 27
        ? 'Moderate (350-500ml/hr)'
        : 'Standard Hydration (250ml)';

    const rainProbNext6h = Math.max(...hourly.slice(0, 6).map((h) => h.precipitationProb));
    const heatRisk = weather.temperature >= 35 ? 'High Heat Risk' : weather.temperature >= 30 ? 'Moderate' : 'Low';

    let recommendation = `Running Score ${score} — ${scoreLabel}. Optimal workout window: ${bestWindow}. `;
    if (weather.temperature > 30) {
      recommendation += 'Elevated thermal load outdoors; carry electrolytes and prioritize early morning runs.';
    } else if (rainProbNext6h > 40) {
      recommendation += 'Scattered rain likelihood ahead; wear shoes with reliable rubber grip and consider a water-resistant layer.';
    } else {
      recommendation += 'Great conditions for road and trail running. Minimal wind resistance and comfortable humidity.';
    }

    return {
      personaId: 'runner',
      label: 'Runner / Fitness',
      iconName: 'Activity',
      score,
      scoreLabel,
      primaryQuestion: 'What is the best and safest time for me to exercise outdoors?',
      primaryAnswer: `Best workout window is ${bestWindow}. Conditions are rated ${scoreLabel} with ${thermalComfort.toLowerCase()}.`,
      bestWindow,
      bestWindowSub: `Thermal comfort: ${thermalComfort}`,
      avoidWindow: avoidWindow ? `${avoidWindow} (Midday Heat/UV)` : undefined,
      avoidWindowReason: avoidWindowReason || 'Peak heat and direct ultraviolet exposure',
      keyConditions: [
        { label: 'Feels Like', value: `${weather.feelsLike}°C`, status: weather.feelsLike > 32 ? 'caution' : 'good' },
        { label: 'Rain Prob', value: `${rainProbNext6h}%`, status: rainProbNext6h > 40 ? 'caution' : 'good' },
        { label: 'AQI', value: `${airQuality.aqi} (${airQuality.category})`, status: airQuality.aqi > 150 ? 'caution' : 'good' },
        { label: 'Track Dryness', value: trackDryness, status: trackDryness === 'Wet & Slippery' ? 'caution' : 'good' },
        { label: 'Peak UV', value: `Index ${weather.uvIndex}`, status: weather.uvIndex >= 7 ? 'caution' : 'good' },
      ],
      recommendation,
      advisoryHeadline: `${scoreLabel} outdoor cardio conditions across ${locationName}`,
      prioritizedMetrics: [
        { label: 'Workout Score', value: `${score} / 100`, subValue: scoreLabel, status: score >= 75 ? 'good' : 'moderate' },
        { label: 'Best Workout Window', value: bestWindow, subValue: 'Lowest heat & pollution', status: 'good' },
        { label: 'Thermal Comfort', value: thermalComfort, subValue: `Actual ${weather.temperature}°C`, status: 'neutral' },
        { label: 'Hydration Need', value: hydrationNeed, status: weather.feelsLike > 30 ? 'caution' : 'good' },
        { label: 'Track Dryness', value: trackDryness, subValue: `Rain past 24h: ${weather.precipitation24h} mm`, status: 'neutral' },
        { label: 'Rain Probability', value: `${rainProbNext6h}%`, subValue: 'Next 6 hours', status: rainProbNext6h > 35 ? 'caution' : 'good' },
        { label: 'Air Quality (AQI)', value: `${airQuality.aqi}`, subValue: `PM2.5: ${airQuality.pm25} µg/m³`, status: airQuality.aqi > 100 ? 'caution' : 'good' },
        { label: 'UV Index', value: `${weather.uvIndex}`, subValue: weather.uvIndex >= 6 ? 'Sunscreen recommended' : 'Low radiation', status: weather.uvIndex >= 6 ? 'caution' : 'good' },
        { label: 'Wind & Gusts', value: `${weather.windSpeed} km/h`, subValue: `Gusts up to ${weather.windGust} km/h`, status: 'neutral' },
        { label: 'Recommended Activity', value: weather.feelsLike > 34 ? 'Indoor Gym / Treadmill' : 'Outdoor 5k/10k Running', status: 'good' },
      ],
      hourlySuitability: hourlyScores,
      whatToCarryOrAction: [
        'Hydration flask or electrolyte drink (minimum 500ml)',
        weather.uvIndex >= 5 ? 'UV-blocking running sunglasses & visor cap' : 'Lightweight breathable sports top',
        rainProbNext6h > 30 ? 'Waterproof running pouch for smartphone' : 'Reflective wristband for low-light dawn runs',
      ],
    };
  }

  // 2. DAILY COMMUTER
  if (persona === 'commuter' || persona === 'general' || persona === 'student') {
    const maxRainNext4h = Math.max(...hourly.slice(0, 4).map((h) => h.precipitationProb));
    const rainIntensity =
      weather.conditionKey === 'heavy-rain'
        ? 'Heavy Downpour'
        : weather.conditionKey === 'rain'
        ? 'Moderate Rain'
        : maxRainNext4h > 40
        ? 'Scattered Showers'
        : 'Dry & Clear';

    const roadCondition =
      weather.precipitation24h > 15 || weather.conditionKey === 'heavy-rain'
        ? 'Waterlogging Risk on Low Roads'
        : weather.precipitation24h > 2 || weather.conditionKey === 'rain'
        ? 'Slick Bitumen Pavement'
        : 'Dry Highway Asphalt';

    const fogStatus = weather.visibility < 2 ? 'Dense Fog' : weather.visibility < 5 ? 'Moderate Mist' : 'Clear Visibility';
    const departureWindow = bestWindow;

    let recommendation = `Commute Safety Score ${score} — ${scoreLabel}. Best departure window: ${departureWindow}. `;
    if (maxRainNext4h > 50) {
      recommendation += `Rain likelihood (${maxRainNext4h}%) may trigger waterlogging and slow moving arterial traffic. Keep rain poncho and allow 20 mins buffer.`;
    } else if (weather.visibility < 3) {
      recommendation += `Morning mist/fog reducing highway visibility (${weather.visibility} km). Use low-beam headlamps and keep double stopping distance.`;
    } else {
      recommendation += 'Traffic weather is favorable with dry roads and clear visibility throughout commute corridors.';
    }

    return {
      personaId: 'commuter',
      label: 'Daily Commuter',
      iconName: 'Car',
      score,
      scoreLabel,
      primaryQuestion: 'When should I travel and what weather risks should I expect?',
      primaryAnswer: `Best departure: ${departureWindow}. Road conditions are ${roadCondition.toLowerCase()}.`,
      bestWindow: departureWindow,
      bestWindowSub: 'Lowest probability of transit delays',
      avoidWindow: avoidWindow ? `${avoidWindow}` : undefined,
      avoidWindowReason: avoidWindowReason || 'Peak commuter rush and weather risks',
      keyConditions: [
        { label: 'Road Status', value: roadCondition.split(' ')[0], status: roadCondition.includes('Waterlogging') ? 'caution' : 'good' },
        { label: 'Rain Likelihood', value: `${maxRainNext4h}%`, status: maxRainNext4h > 40 ? 'caution' : 'good' },
        { label: 'Visibility', value: `${weather.visibility} km`, status: weather.visibility < 4 ? 'caution' : 'good' },
        { label: 'Wind Gusts', value: `${weather.windGust} km/h`, status: weather.windGust > 30 ? 'caution' : 'good' },
        { label: 'Transit Risk', value: maxRainNext4h > 45 ? 'Medium' : 'Low', status: maxRainNext4h > 45 ? 'caution' : 'good' },
      ],
      recommendation,
      advisoryHeadline: `Transit & Commute Outlook for ${locationName}`,
      prioritizedMetrics: [
        { label: 'Commute Safety Score', value: `${score} / 100`, subValue: scoreLabel, status: score >= 75 ? 'good' : 'moderate' },
        { label: 'Recommended Departure', value: departureWindow, subValue: 'Clear traffic window', status: 'good' },
        { label: 'Road Weather Risk', value: roadCondition, subValue: `Past rain: ${weather.precipitation24h} mm`, status: roadCondition.includes('Dry') ? 'good' : 'caution' },
        { label: 'Rain Intensity', value: rainIntensity, subValue: `Chance: ${maxRainNext4h}% next 4h`, status: maxRainNext4h > 30 ? 'caution' : 'good' },
        { label: 'Road Visibility', value: `${weather.visibility} km (${fogStatus})`, status: weather.visibility > 5 ? 'good' : 'caution' },
        { label: 'Thunderstorm / Lightning', value: weather.conditionKey === 'thunderstorm' ? 'Active Risk' : 'Low Risk', status: weather.conditionKey === 'thunderstorm' ? 'caution' : 'good' },
        { label: 'Wind & Gusts', value: `${weather.windSpeed} km/h`, subValue: `Peak gusts ${weather.windGust} km/h`, status: 'neutral' },
        { label: 'Flood / Waterlogging Risk', value: weather.precipitation24h > 20 ? 'High on subways' : 'Minimal', status: weather.precipitation24h > 20 ? 'caution' : 'good' },
      ],
      hourlySuitability: hourlyScores,
      whatToCarryOrAction: [
        maxRainNext4h > 25 ? 'Foldable umbrella or waterproof commuter poncho' : 'Light windcheater jacket',
        'Check metro / suburban railway status before stepping out',
        'Two-wheeler riders: inspect tire treads and keep visor clean',
      ],
      actionButton: {
        label: 'Open Live Radar & Rain Tracker',
        actionType: 'radar',
      },
    };
  }

  // 3. TRAVELLER
  if (persona === 'traveller') {
    const highwayVis = weather.visibility >= 8 ? 'Excellent (> 8 km)' : `${weather.visibility} km (Caution in Ghats)`;
    const stormRisk = weather.conditionKey === 'thunderstorm' ? 'High' : 'Low to Isolated';

    let recommendation = `Travel Score ${score} — ${scoreLabel}. Best journey departure: ${bestWindow}. `;
    if (weather.conditionKey === 'thunderstorm' || weather.precipitation24h > 20) {
      recommendation += 'Intermittent intense cloudbursts along route corridors. Carry emergency road kit and avoid overnight ghat driving.';
    } else {
      recommendation += 'Highway weather is steady and favorable for intercity road travel and railway schedules.';
    }

    return {
      personaId: 'traveller',
      label: 'Traveller',
      iconName: 'Compass',
      score,
      scoreLabel,
      primaryQuestion: 'How suitable is the weather for my journey?',
      primaryAnswer: `Travel conditions are rated ${scoreLabel} (${score}/100). Best window: ${bestWindow}.`,
      bestWindow,
      bestWindowSub: 'Optimal highway visibility and mild pavement temperature',
      avoidWindow: avoidWindow ? `${avoidWindow} (Peak Weather Risk)` : undefined,
      avoidWindowReason: avoidWindowReason || 'Low visibility or sudden convective showers',
      keyConditions: [
        { label: 'Highway Vis', value: highwayVis.split(' ')[0], status: weather.visibility > 6 ? 'good' : 'caution' },
        { label: 'Storm Risk', value: stormRisk, status: stormRisk === 'High' ? 'caution' : 'good' },
        { label: 'Pavement Temp', value: `${weather.temperature + 4}°C`, status: 'neutral' },
        { label: 'Ghat Fog', value: weather.visibility < 3 ? 'Present' : 'Clear', status: weather.visibility < 3 ? 'caution' : 'good' },
        { label: 'Trip Rating', value: scoreLabel, status: score >= 75 ? 'good' : 'moderate' },
      ],
      recommendation,
      advisoryHeadline: `Intercity & Highway Travel Intelligence for ${locationName}`,
      prioritizedMetrics: [
        { label: 'Travel Suitability Score', value: `${score} / 100`, subValue: scoreLabel, status: score >= 75 ? 'good' : 'moderate' },
        { label: 'Best Travel Window', value: bestWindow, subValue: 'Smooth cruise conditions', status: 'good' },
        { label: 'Highway Visibility', value: highwayVis, status: weather.visibility > 6 ? 'good' : 'caution' },
        { label: 'Rain / Storm Risk', value: stormRisk, subValue: `Current: ${weather.conditionText}`, status: stormRisk === 'High' ? 'caution' : 'good' },
        { label: 'Temperature & Feels', value: `${weather.temperature}°C / Feels ${weather.feelsLike}°C`, status: 'neutral' },
        { label: 'UV Radiation', value: `UV ${weather.uvIndex}`, subValue: 'Car window UV exposure', status: 'neutral' },
        { label: 'Air Quality on Route', value: `AQI ${airQuality.aqi} (${airQuality.category})`, status: airQuality.aqi > 150 ? 'caution' : 'good' },
      ],
      hourlySuitability: hourlyScores,
      whatToCarryOrAction: [
        'All-weather rain jacket & spare warm pullover for air-conditioned transit',
        'Polarized driving sunglasses & high-lumen vehicle fog lamps',
        'Portable power bank & offline digital route maps',
        'First aid travel kit with hydration salts',
      ],
      actionButton: {
        label: 'Explore Journey Route Waypoints',
        actionType: 'travel',
      },
    };
  }

  // 4. FARMER / GARDENER
  if (persona === 'farmer') {
    const rainNext3Days = Math.max(...daily.slice(0, 3).map((d) => d.precipitationProb));
    const isRainExpected = rainNext3Days > 45 || weather.conditionKey === 'rain';

    const spraySafety =
      weather.windSpeed < 14 && rainNext3Days < 30
        ? 'Safe to Spray (Calm Winds & No Rain)'
        : weather.windSpeed > 18
        ? 'Avoid: High Wind Drift (> 15 km/h)'
        : 'Caution: Rain Likely Within 24-48h';

    const irrigationAdvisory = isRainExpected
      ? 'Withhold Irrigation — Rain showers expected in 12-24h'
      : weather.temperature > 34
      ? 'Evening Irrigation Recommended to counter evapotranspiration'
      : 'Maintain standard watering cycle';

    const soilMoisture =
      weather.precipitation24h > 20
        ? 'Saturated / High (75%)'
        : weather.humidity > 70
        ? 'Adequate / Moist (62%)'
        : 'Moderate (48%)';

    const evapotranspiration = weather.temperature > 32 ? 'High (4.8 - 5.5 mm/day)' : 'Moderate (3.2 - 4.0 mm/day)';
    const pestDiseaseRisk =
      weather.humidity > 80 && weather.temperature > 26
        ? 'Elevated Fungal / Blast Risk (High Humidity)'
        : 'Low to Normal Infestation Risk';

    let recommendation = `Agro-Met Score ${score} — ${scoreLabel}. `;
    if (isRainExpected) {
      recommendation += `Rainfall expected across district within 24 hours (${rainNext3Days}% prob). Withhold chemical spray and scheduled canal/borewell irrigation to prevent nutrient leaching.`;
    } else if (weather.windSpeed > 18) {
      recommendation += `Surface wind speed is ${weather.windSpeed} km/h. Postpone foliar pesticide sprays to avoid droplet drift and loss.`;
    } else {
      recommendation += `Weather is stable and favorable for intercultural operations, field leveling, and scheduled farm activities.`;
    }

    return {
      personaId: 'farmer',
      label: 'Farmer / Gardener',
      iconName: 'Sprout',
      score,
      scoreLabel,
      primaryQuestion: 'What action should I take on my farm based on the upcoming weather?',
      primaryAnswer: isRainExpected
        ? 'Withhold irrigation and postpone chemical sprays — rain expected in 12-24h.'
        : 'Favorable window for field intercultural operations and crop protection sprays.',
      bestWindow: '06:00 AM – 09:30 AM',
      bestWindowSub: 'Calm morning winds (< 10 km/h) ideal for spray operations',
      avoidWindow: isRainExpected ? 'Afternoon / Evening' : '12:00 PM – 03:00 PM',
      avoidWindowReason: isRainExpected ? 'Rain arrival and surface run-off' : 'Peak evapotranspiration and leaf scorch',
      keyConditions: [
        { label: 'Rain Forecast', value: `${rainNext3Days}% 3-Day`, status: rainNext3Days > 40 ? 'caution' : 'good' },
        { label: 'Spray Safety', value: spraySafety.split(' ')[0], status: spraySafety.startsWith('Safe') ? 'good' : 'caution' },
        { label: 'Soil Moisture', value: soilMoisture.split(' ')[0], status: 'good' },
        { label: 'Water Loss (ET)', value: evapotranspiration.split(' ')[0], status: 'neutral' },
        { label: 'Pest Alert', value: pestDiseaseRisk.startsWith('Elevated') ? 'Watch' : 'Low', status: pestDiseaseRisk.startsWith('Elevated') ? 'caution' : 'good' },
      ],
      recommendation,
      advisoryHeadline: `IMD Agromet Advisory for ${locationName} Farming Blocks`,
      prioritizedMetrics: [
        { label: 'Farm Activity Score', value: `${score} / 100`, subValue: scoreLabel, status: score >= 70 ? 'good' : 'caution' },
        { label: 'Rainfall Forecast & Timing', value: isRainExpected ? `Expected within 24h (${rainNext3Days}%)` : 'Dry spell next 3 days', status: isRainExpected ? 'caution' : 'good' },
        { label: 'Irrigation Recommendation', value: irrigationAdvisory, status: isRainExpected ? 'caution' : 'good' },
        { label: 'Chemical Spray Window', value: spraySafety, subValue: `Current wind: ${weather.windSpeed} km/h`, status: spraySafety.startsWith('Safe') ? 'good' : 'caution' },
        { label: 'Soil Moisture Estimate', value: soilMoisture, subValue: `Past 24h rain: ${weather.precipitation24h} mm`, status: 'neutral' },
        { label: 'Evapotranspiration (ET)', value: evapotranspiration, subValue: 'Crop water demand', status: 'neutral' },
        { label: 'Pest & Disease Watch', value: pestDiseaseRisk, subValue: `Relative humidity: ${weather.humidity}%`, status: pestDiseaseRisk.startsWith('Elevated') ? 'caution' : 'good' },
        { label: 'Sowing / Harvesting Window', value: isRainExpected ? 'Cover harvested produce in mandi' : 'Favorable field prep window', status: 'good' },
      ],
      hourlySuitability: hourlyScores,
      whatToCarryOrAction: [
        isRainExpected ? 'Cover threshing floor and seed bags with waterproof tarpaulins' : 'Ensure drip irrigation lines and filters are cleared',
        'Clean drainage channels in low-lying paddy/cotton fields',
        'Kisan Call Centre 24x7 toll-free helpline: 1800-180-1551',
      ],
      actionButton: {
        label: 'Open Full Krishi Agro-Met Advisory',
        actionType: 'agromet',
      },
    };
  }

  // 5. HEALTH & AIR-CONSCIOUS
  if (persona === 'health' || persona === 'safety') {
    const aqiRisk =
      airQuality.aqi > 300
        ? 'Severe Health Alert (Avoid Outdoors)'
        : airQuality.aqi > 200
        ? 'Very Poor (Breathing Discomfort)'
        : airQuality.aqi > 100
        ? 'Moderate (Sensitive Individuals Alert)'
        : 'Low Risk (Clean Ambient Air)';

    const uvRisk =
      weather.uvIndex >= 8
        ? 'Very High (Sunburn < 15 mins)'
        : weather.uvIndex >= 6
        ? 'High (Sun Protection Required)'
        : 'Low to Moderate';

    const heatStress =
      weather.feelsLike >= 38
        ? 'Severe Heat Stress (Heatwave Watch)'
        : weather.feelsLike >= 32
        ? 'Moderate Heat Index (Drink frequent water)'
        : 'Comfortable Heat Balance';

    const safeWindow = '06:00 AM – 08:30 AM';
    const highExposureWindow = '11:30 AM – 03:30 PM';

    let recommendation = `Health & Air Safety Score ${score} — ${scoreLabel}. Safe outdoor window: ${safeWindow}. `;
    if (airQuality.aqi > 180) {
      recommendation += `Air quality is ${airQuality.category} (AQI ${airQuality.aqi}, PM2.5 ${airQuality.pm25} µg/m³). Sensitive individuals should wear an N95 mask outdoors and run indoor HEPA purifiers.`;
    } else if (weather.uvIndex >= 7) {
      recommendation += `Peak UV Index reaches ${weather.uvIndex} around midday. Avoid direct sun exposure between ${highExposureWindow} to protect skin and eyes.`;
    } else {
      recommendation += `Air quality is ${airQuality.category} and thermal levels are benign. Favorable conditions for outdoor walks and fresh air ventilation.`;
    }

    return {
      personaId: 'health',
      label: 'Health & Air-Conscious',
      iconName: 'HeartPulse',
      score,
      scoreLabel,
      primaryQuestion: 'How safe is it for me to spend time outdoors today?',
      primaryAnswer: `Air quality is ${airQuality.category} (AQI ${airQuality.aqi}). Safe outdoor window: ${safeWindow}.`,
      bestWindow: safeWindow,
      bestWindowSub: 'Lowest particulate concentration and mild temperature',
      avoidWindow: highExposureWindow,
      avoidWindowReason: 'Combined peak UV index and ground-level secondary ozone',
      keyConditions: [
        { label: 'CPCB AQI', value: `${airQuality.aqi} (${airQuality.category})`, status: airQuality.aqi > 150 ? 'caution' : 'good' },
        { label: 'PM2.5 Level', value: `${airQuality.pm25} µg/m³`, status: airQuality.pm25 > 60 ? 'caution' : 'good' },
        { label: 'UV Radiation', value: `${weather.uvIndex} (${uvRisk.split(' ')[0]})`, status: weather.uvIndex >= 6 ? 'caution' : 'good' },
        { label: 'Heat Stress', value: heatStress.split(' ')[0], status: weather.feelsLike > 34 ? 'caution' : 'good' },
        { label: 'Mask Advice', value: airQuality.aqi > 150 ? 'N95 Advised' : 'Optional', status: airQuality.aqi > 150 ? 'caution' : 'good' },
      ],
      recommendation,
      advisoryHeadline: `Respiratory & Environmental Health Index for ${locationName}`,
      prioritizedMetrics: [
        { label: 'Health Safety Score', value: `${score} / 100`, subValue: scoreLabel, status: score >= 75 ? 'good' : 'moderate' },
        { label: 'Indian CPCB AQI', value: `${airQuality.aqi}`, subValue: airQuality.category, status: airQuality.aqi <= 100 ? 'good' : 'caution' },
        { label: 'Fine PM2.5 Particles', value: `${airQuality.pm25} µg/m³`, subValue: 'CPCB 24h standard: 60', status: airQuality.pm25 <= 60 ? 'good' : 'caution' },
        { label: 'Coarse PM10 Particles', value: `${airQuality.pm10} µg/m³`, subValue: 'CPCB 24h standard: 100', status: airQuality.pm10 <= 100 ? 'good' : 'caution' },
        { label: 'Air Quality Risk Status', value: aqiRisk, status: airQuality.aqi <= 100 ? 'good' : 'caution' },
        { label: 'UV Radiation Level', value: `Index ${weather.uvIndex}`, subValue: uvRisk, status: weather.uvIndex < 6 ? 'good' : 'caution' },
        { label: 'Heat Index & Comfort', value: `${weather.feelsLike}°C (${heatStress})`, status: 'neutral' },
        { label: 'Ambient Humidity', value: `${weather.humidity}%`, subValue: `Dew point: ${weather.dewPoint}°C`, status: 'neutral' },
      ],
      hourlySuitability: hourlyScores,
      whatToCarryOrAction: [
        airQuality.aqi > 120 ? 'Certified N95/N99 particulate respirator mask' : 'Broad-spectrum SPF 30+ mineral sunscreen',
        'Keep room windows closed during morning vehicular rush hours (8-10 AM)',
        'Maintain hydration with lemon water or coconut water',
      ],
    };
  }

  // 6. FAMILY
  if (persona === 'family') {
    const rainProbEvening = Math.max(...hourly.slice(4, 10).map((h) => h.precipitationProb));
    const safePlayWindow = '04:30 PM – 06:45 PM';
    const schoolCommute =
      hourly[0]?.precipitationProb > 40
        ? 'Rain Showers Expected — Pack Kids Raincoat'
        : 'Dry & Calm Commute — Normal School Transit';

    let recommendation = `Family Safety Score ${score} — ${scoreLabel}. Ideal safe play window: ${safePlayWindow}. `;
    if (weather.conditionKey === 'thunderstorm') {
      recommendation += 'Thunderstorm activity detected. Keep children indoors, unplug sensitive electronics, and avoid open balconies.';
    } else if (weather.temperature > 33) {
      recommendation += 'Warm afternoon temperatures. Ensure children drink water before playing outside; shift park visits to sunset hours.';
    } else {
      recommendation += 'Pleasant, stable weather for family outings, playground activities, and outdoor evening walks.';
    }

    return {
      personaId: 'family',
      label: 'Family',
      iconName: 'Users',
      score,
      scoreLabel,
      primaryQuestion: 'When is it safest for my family and children to go outside?',
      primaryAnswer: `Safest outdoor play window is ${safePlayWindow}. Weather is rated ${scoreLabel}.`,
      bestWindow: safePlayWindow,
      bestWindowSub: 'Comfortable temperatures, mild breeze, and low UV levels',
      avoidWindow: '12:00 PM – 03:30 PM',
      avoidWindowReason: 'Peak ultraviolet rays and strong direct sunshine',
      keyConditions: [
        { label: 'Outdoor Play', value: scoreLabel, status: score >= 75 ? 'good' : 'moderate' },
        { label: 'Evening Rain', value: `${rainProbEvening}%`, status: rainProbEvening > 35 ? 'caution' : 'good' },
        { label: 'School Bus Weather', value: schoolCommute.split(' ')[0], status: 'good' },
        { label: 'Kids UV Risk', value: weather.uvIndex >= 6 ? 'High' : 'Moderate', status: weather.uvIndex >= 6 ? 'caution' : 'good' },
        { label: 'Air Purity', value: airQuality.category, status: airQuality.aqi > 120 ? 'caution' : 'good' },
      ],
      recommendation,
      advisoryHeadline: `Family & Children Outdoor Safety in ${locationName}`,
      prioritizedMetrics: [
        { label: 'Family Safety Score', value: `${score} / 100`, subValue: scoreLabel, status: score >= 75 ? 'good' : 'moderate' },
        { label: 'Safe Play Window', value: safePlayWindow, subValue: 'Playground & park hours', status: 'good' },
        { label: 'School Commute Conditions', value: schoolCommute, status: 'good' },
        { label: 'Temperature & Feels', value: `${weather.temperature}°C / Feels ${weather.feelsLike}°C`, status: 'neutral' },
        { label: 'Heat & Sun Risk', value: weather.temperature > 34 ? 'Caution: Direct Sun' : 'Safe & Pleasant', status: 'good' },
        { label: 'Rain & Lightning Probability', value: `${rainProbEvening}% evening chance`, subValue: weather.conditionText, status: 'good' },
        { label: 'UV Index for Children', value: `Level ${weather.uvIndex}`, subValue: 'Kids skin is twice as sensitive', status: weather.uvIndex >= 6 ? 'caution' : 'good' },
        { label: 'Neighborhood Air (AQI)', value: `${airQuality.aqi} (${airQuality.category})`, status: airQuality.aqi > 100 ? 'caution' : 'good' },
      ],
      hourlySuitability: hourlyScores,
      whatToCarryOrAction: [
        'Water bottle for every family member (stay hydrated)',
        weather.uvIndex >= 6 ? 'Sun protection hats and child-safe mineral sunscreen' : 'Light cotton clothing',
        rainProbEvening > 30 ? 'Compact umbrella in the diaper/stroller bag' : 'Mosquito repellent patches for evening parks',
      ],
    };
  }

  // 7. BEACH / MARINE
  // Beach / Marine dedicated intelligence
  const waveHeightM =
    weather.windSpeed > 30
      ? (2.2 + Math.random() * 0.4).toFixed(1)
      : weather.windSpeed > 18
      ? (1.4 + Math.random() * 0.3).toFixed(1)
      : (0.8 + Math.random() * 0.2).toFixed(1);

  const seaState =
    parseFloat(waveHeightM) > 2.0
      ? 'Rough to Very Rough'
      : parseFloat(waveHeightM) > 1.2
      ? 'Moderate Swell'
      : 'Smooth to Slight';

  const ripCurrentRisk = parseFloat(waveHeightM) > 1.8 ? 'High (Stay in Patrolled Zones)' : 'Low to Moderate';
  const swimmingSuitability =
    parseFloat(waveHeightM) > 2.0 || weather.conditionKey === 'thunderstorm'
      ? 'Hazardous (Red Flag on Beaches)'
      : parseFloat(waveHeightM) > 1.3
      ? 'Caution Advised for Casual Swimmers'
      : 'Favorable in Designated Bathing Zones';

  const sstCelsius = 28 + Math.round((weather.temperature % 3) * 0.5);

  let recommendation = `Marine & Beach Safety Score ${score} — ${scoreLabel}. Sea state is ${seaState.toLowerCase()} with wave heights near ${waveHeightM} m. `;
  if (parseFloat(waveHeightM) > 2.0 || weather.windSpeed > 30) {
    recommendation += 'Indian Coast Guard & INCOIS Bulletin: Squally coastal winds and heavy surf. Fishermen and small crafts advised not to venture offshore.';
  } else {
    recommendation += 'Favorable coastal conditions. Great daylight for beach promenade walks, water sports, and harbor navigation.';
  }

  return {
    personaId: 'marine',
    label: 'Beach / Marine',
    iconName: 'Ship',
    score,
    scoreLabel,
    primaryQuestion: 'Are the beach and sea conditions safe and suitable?',
    primaryAnswer: `Sea state: ${seaState} with ~${waveHeightM}m waves. Swimming is ${swimmingSuitability.toLowerCase()}.`,
    bestWindow: '06:30 AM – 09:30 AM & 04:30 PM – 06:30 PM',
    bestWindowSub: 'Calm morning sea breezes and low UV reflection',
    avoidWindow: '11:00 AM – 03:00 PM',
    avoidWindowReason: 'High UV glare off seawater and sand reflection',
    keyConditions: [
      { label: 'Wave Height', value: `${waveHeightM} m`, status: parseFloat(waveHeightM) > 1.8 ? 'caution' : 'good' },
      { label: 'Sea State', value: seaState.split(' ')[0], status: seaState.includes('Rough') ? 'caution' : 'good' },
      { label: 'Tide Status', value: 'High Tide: 02:45 PM', status: 'neutral' },
      { label: 'Rip Currents', value: ripCurrentRisk.split(' ')[0], status: ripCurrentRisk.startsWith('High') ? 'caution' : 'good' },
      { label: 'Sea Surface Temp', value: `${sstCelsius}°C`, status: 'good' },
    ],
    recommendation,
    advisoryHeadline: `Coastal & Maritime Meteorological Bulletin for ${locationName}`,
    prioritizedMetrics: [
      { label: 'Beach / Marine Score', value: `${score} / 100`, subValue: scoreLabel, status: score >= 75 ? 'good' : 'moderate' },
      { label: 'Significant Wave Height', value: `${waveHeightM} metres`, subValue: seaState, status: parseFloat(waveHeightM) > 1.8 ? 'caution' : 'good' },
      { label: 'Wave Period', value: '8.4 seconds', subValue: 'Groundswell from southwest', status: 'neutral' },
      { label: 'Coastal Wind & Gusts', value: `${weather.windSpeed} km/h`, subValue: `Gusts up to ${weather.windGust} km/h`, status: weather.windSpeed > 25 ? 'caution' : 'good' },
      { label: 'Tide Timings (Est.)', value: 'High 02:45 PM (+3.8m) • Low 08:50 PM', status: 'neutral' },
      { label: 'Swimming Suitability', value: swimmingSuitability, status: swimmingSuitability.includes('Hazardous') ? 'caution' : 'good' },
      { label: 'Rip Current Warning', value: ripCurrentRisk, status: ripCurrentRisk.startsWith('High') ? 'caution' : 'good' },
      { label: 'Sea Surface Temperature', value: `${sstCelsius}°C (Warm Tropical Waters)`, status: 'good' },
      { label: 'Fishermen Coastal Advisory', value: weather.windSpeed > 30 ? 'Withhold deep-sea operations' : 'Normal coastal operations permitted', status: 'good' },
    ],
    hourlySuitability: hourlyScores,
    whatToCarryOrAction: [
      'Swim only between official safety flags in lifeguard-patrolled zones',
      'High-potency waterproof SPF 50+ sunscreen (water reflects 80% UV)',
      'Check Coast Guard Maritime Distress Toll-Free Helpline: 1554',
    ],
    actionButton: {
      label: 'Open Doppler Radar Coastal View',
      actionType: 'radar',
    },
  };
}
