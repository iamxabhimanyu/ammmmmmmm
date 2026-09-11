import React from 'react';
import { ArrowDown, ArrowUp, Droplets, Wind, Sparkles } from 'lucide-react';
import { CurrentWeather, LocationInfo } from '../types';
import { WeatherIcon } from './WeatherIcon';

interface WeatherHeroProps {
  weather: CurrentWeather;
  location: LocationInfo;
  temperatureUnit?: 'C' | 'F';
  onTapInsights?: () => void;
}

export const WeatherHero: React.FC<WeatherHeroProps> = ({
  weather,
  location,
  temperatureUnit = 'C',
}) => {
  const displayTemp = (celsius: number) => {
    if (temperatureUnit === 'F') {
      return Math.round((celsius * 9) / 5 + 32);
    }
    return Math.round(celsius);
  };

  const todayDateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  return (
    <section className="relative px-4 pt-4 pb-2 w-full max-w-2xl mx-auto flex flex-col items-center text-center">
      {/* Date & Time Capsule */}
      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-slate-500 tracking-wide uppercase">
        <span>{todayDateStr}</span>
        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
        <span>{weather.time} IST</span>
      </div>

      {/* Main Temperature & Visual Display */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 my-1">
        {/* Dominant Temperature */}
        <div className="relative flex items-start">
          <span className="text-6xl xs:text-7xl sm:text-8xl md:text-9xl font-light tracking-tighter text-slate-900 leading-none">
            {displayTemp(weather.temperature)}
          </span>
          <span className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-light text-slate-500 ml-1 mt-0.5">
            °{temperatureUnit}
          </span>
        </div>

        {/* Large Condition Icon */}
        <div className="flex flex-col items-center justify-center p-2 rounded-3xl bg-white/60 shadow-xs border border-white/80 backdrop-blur-xs shrink-0">
          <WeatherIcon
            conditionKey={weather.conditionKey}
            isDay={weather.isDay}
            className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20"
          />
        </div>
      </div>

      {/* Weather Condition Text */}
      <h2 className="text-lg xs:text-xl sm:text-2xl font-medium text-slate-800 tracking-tight mt-1 capitalize px-2">
        {weather.conditionText}
      </h2>

      {/* Feels Like & High / Low Metrics Row */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-2.5 text-xs sm:text-sm font-medium text-slate-600">
        <span className="px-3 py-1 rounded-full bg-black/[0.04] border border-black/[0.04] whitespace-nowrap">
          Feels like <span className="text-slate-900 font-semibold">{displayTemp(weather.feelsLike)}°</span>
        </span>

        <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-black/[0.04] border border-black/[0.04] whitespace-nowrap">
          <span className="flex items-center gap-1 text-slate-700">
            <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-semibold text-slate-900">H {displayTemp(weather.high)}°</span>
          </span>
          <span className="w-px h-3 bg-slate-300"></span>
          <span className="flex items-center gap-1 text-slate-700">
            <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-semibold text-slate-900">L {displayTemp(weather.low)}°</span>
          </span>
        </div>
      </div>

      {/* Quick Micro-Bar: Rain probability + Wind indicator */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <Droplets className="w-3.5 h-3.5 text-sky-500" />
          <span>Humidity: <strong className="text-slate-700">{weather.humidity}%</strong></span>
        </span>
        <span className="hidden xs:inline-block w-1 h-1 rounded-full bg-slate-300"></span>
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <Wind className="w-3.5 h-3.5 text-teal-500" />
          <span>Wind: <strong className="text-slate-700">{weather.windSpeed} km/h</strong></span>
        </span>
      </div>
    </section>
  );
};
