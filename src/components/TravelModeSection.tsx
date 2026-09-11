import React, { useState } from 'react';
import { Car, Navigation, MapPin, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TravelRoute } from '../types';
import { getTravelRouteData } from '../services/weatherService';
import { WeatherIcon } from './WeatherIcon';

interface TravelModeSectionProps {
  currentCity: string;
}

export const TravelModeSection: React.FC<TravelModeSectionProps> = ({ currentCity }) => {
  const [destination, setDestination] = useState('Pune');
  const [route, setRoute] = useState<TravelRoute>(() =>
    getTravelRouteData(currentCity || 'Mumbai', 'Pune')
  );

  const handleUpdateRoute = (dest: string) => {
    setDestination(dest);
    setRoute(getTravelRouteData(currentCity || 'Mumbai', dest));
  };

  return (
    <section className="w-full max-w-2xl mx-auto px-4 my-2">
      <div className="bg-white/85 backdrop-blur-md rounded-3xl p-4 border border-black/[0.05] shadow-xs">
        {/* Header */}
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-sky-100 text-sky-800 shrink-0">
              <Car className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-800 tracking-tight">
                Highway & Travel Weather
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Live waypoint monitoring • Ghat & Fog alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs self-start xs:self-auto shrink-0">
            <button
              id="travel-dest-pune"
              onClick={() => handleUpdateRoute('Pune')}
              className={`px-3.5 py-1.5 min-h-[36px] rounded-full font-medium transition-all touch-manipulation active:scale-95 ${
                destination === 'Pune' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              To Pune
            </button>
            <button
              id="travel-dest-nashik"
              onClick={() => handleUpdateRoute('Nashik')}
              className={`px-3.5 py-1.5 min-h-[36px] rounded-full font-medium transition-all touch-manipulation active:scale-95 ${
                destination === 'Nashik' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              To Nashik
            </button>
          </div>
        </div>

        {/* Route Summary Banner */}
        <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-sky-600 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 block">
                {route.origin} → {route.destination} ({route.totalKm} km)
              </span>
              <span className="text-slate-600 text-[11px] block">{route.overallAdvisory}</span>
            </div>
          </div>
        </div>

        {/* Waypoints Timeline */}
        <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {route.stops.map((stop, i) => (
            <div key={i} className="relative flex items-start justify-between gap-3 text-xs">
              {/* Dot on line */}
              <div
                className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white ${
                  stop.roadCondition === 'Wet'
                    ? 'bg-amber-500'
                    : stop.roadCondition === 'Fog'
                    ? 'bg-indigo-500'
                    : 'bg-emerald-500'
                }`}
              />

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 text-sm">{stop.city}</span>
                  <span className="text-[10px] text-slate-400">
                    {stop.distanceKm === 0 ? 'Start' : `+${stop.distanceKm} km`} • {stop.eta}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-slate-600">
                  <WeatherIcon conditionKey={stop.conditionKey} isDay={true} className="w-3.5 h-3.5" />
                  <span>{stop.condition}</span>
                  <span>•</span>
                  <span>Rain: {stop.rainProb}%</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-slate-900 block">{stop.temp}°C</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                    stop.roadCondition === 'Wet'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  {stop.roadCondition} Road
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
