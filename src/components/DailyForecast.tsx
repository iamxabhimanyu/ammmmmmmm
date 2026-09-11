import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Droplets, Sunrise, Sunset, Wind } from 'lucide-react';
import { DailyForecastItem } from '../types';
import { WeatherIcon } from './WeatherIcon';

interface DailyForecastProps {
  daily: DailyForecastItem[];
  temperatureUnit?: 'C' | 'F';
}

export const DailyForecast: React.FC<DailyForecastProps> = ({
  daily,
  temperatureUnit = 'C',
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'weekend'>('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const displayTemp = (celsius: number) => {
    if (temperatureUnit === 'F') return Math.round((celsius * 9) / 5 + 32);
    return Math.round(celsius);
  };

  // Find absolute min and max across all days for proportional range bar
  const allMins = daily.map((d) => displayTemp(d.tempMin));
  const allMaxs = daily.map((d) => displayTemp(d.tempMax));
  const globalMin = Math.min(...allMins);
  const globalMax = Math.max(...allMaxs);
  const totalSpan = Math.max(globalMax - globalMin, 1);

  const filteredDaily =
    activeTab === 'weekend'
      ? daily.filter((d) => {
          const day = new Date(d.date).getDay();
          return day === 0 || day === 6 || d.dayName === 'Today';
        })
      : daily;

  return (
    <section className="w-full max-w-2xl mx-auto px-4 my-2">
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 border border-black/[0.05] shadow-xs">
        {/* Header with Segmented Filter */}
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-sm font-semibold text-slate-800 tracking-tight">10-Day Forecast</h3>

          <div className="flex items-center p-0.5 rounded-full bg-slate-100 border border-black/[0.04] text-xs">
            <button
              id="forecast-tab-all"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 min-h-[36px] rounded-full font-medium transition-all touch-manipulation active:scale-95 ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Days
            </button>
            <button
              id="forecast-tab-weekend"
              onClick={() => setActiveTab('weekend')}
              className={`px-3.5 py-1.5 min-h-[36px] rounded-full font-medium transition-all touch-manipulation active:scale-95 ${
                activeTab === 'weekend' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Weekend
            </button>
          </div>
        </div>

        {/* Daily Rows */}
        <div className="divide-y divide-slate-100">
          {filteredDaily.map((item, idx) => {
            const minT = displayTemp(item.tempMin);
            const maxT = displayTemp(item.tempMax);
            const isExpanded = expandedIndex === idx;

            // Bar offset calculation
            const leftPercent = ((minT - globalMin) / totalSpan) * 100;
            const widthPercent = Math.max(((maxT - minT) / totalSpan) * 100, 10);

            return (
              <div key={item.date} className="py-2.5 transition-colors group">
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between gap-3 text-left focus:outline-none"
                  aria-expanded={isExpanded}
                >
                  {/* Day & Date */}
                  <div className="w-16 xs:w-20 sm:w-28 shrink-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">
                      {item.dayName}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-normal truncate">
                      {item.fullDate}
                    </p>
                  </div>

                  {/* Weather Icon & Rain Prob */}
                  <div className="flex items-center gap-1.5 xs:gap-2 w-16 xs:w-24 sm:w-28 shrink-0">
                    <WeatherIcon
                      conditionKey={item.conditionKey}
                      isDay={true}
                      className="w-5 h-5 sm:w-6 sm:h-6 shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="hidden xs:inline text-xs font-medium text-slate-700 capitalize truncate max-w-[70px] sm:max-w-[80px]">
                        {item.conditionText}
                      </span>
                      {item.precipitationProb > 0 ? (
                        <span className="text-[10px] font-semibold text-blue-600 flex items-center gap-0.5 whitespace-nowrap">
                          <Droplets className="w-2.5 h-2.5 shrink-0" />
                          {item.precipitationProb}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-300 select-none">-</span>
                      )}
                    </div>
                  </div>

                  {/* Google Weather Temperature Range Bar */}
                  <div className="flex-1 min-w-0 flex items-center justify-end gap-1.5 sm:gap-3">
                    <span className="text-xs font-semibold text-slate-500 w-6 sm:w-7 text-right shrink-0">
                      {minT}°
                    </span>

                    <div className="relative flex-1 max-w-[60px] xs:max-w-[80px] sm:max-w-[112px] h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                      <div
                        className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-400"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                      />
                    </div>

                    <span className="text-xs font-semibold text-slate-900 w-6 sm:w-7 text-left shrink-0">
                      {maxT}°
                    </span>

                    <div className="text-slate-400 group-hover:text-slate-600 shrink-0">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </button>

                {/* Expanded Detail Tray */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 bg-slate-50/60 p-2.5 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Sunrise className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Sunrise: <strong>{item.sunrise}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sunset className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span>Sunset: <strong>{item.sunset}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wind className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>Max Wind: <strong>{item.windSpeedMax} km/h</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplets className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>Rainfall: <strong>{item.rainSumMm} mm</strong></span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
