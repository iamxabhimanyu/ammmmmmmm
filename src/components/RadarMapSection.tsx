import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Layers, MapPin, Eye, Info, ZoomIn, ZoomOut } from 'lucide-react';
import { LocationInfo, DopplerRadarStation } from '../types';
import { IMD_RADAR_STATIONS } from '../data/constants';

interface RadarMapSectionProps {
  location: LocationInfo;
}

export const RadarMapSection: React.FC<RadarMapSectionProps> = ({ location }) => {
  const [activeLayer, setActiveLayer] = useState<'radar' | 'satellite' | 'precip' | 'wind'>('radar');
  const [isPlaying, setIsPlaying] = useState(false);
  const [frameIndex, setFrameIndex] = useState(4); // 0 to 6 (4 is 'Now')
  const [selectedStation, setSelectedStation] = useState<DopplerRadarStation | null>(null);

  const frames = [
    { label: '-60m', time: '1 hour ago' },
    { label: '-45m', time: '45 mins ago' },
    { label: '-30m', time: '30 mins ago' },
    { label: '-15m', time: '15 mins ago' },
    { label: 'Now', time: 'Live Nowcast' },
    { label: '+15m', time: 'Predicted +15m' },
    { label: '+30m', time: 'Predicted +30m' },
  ];

  // Auto-advance loop when playing
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % frames.length);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      // Create map
      const map = L.map(mapContainerRef.current, {
        center: [location.lat, location.lon],
        zoom: 7,
        zoomControl: false,
        attributionControl: false,
      });

      // Google Maps / CartoDB Voyager clean minimalist tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
      }).addTo(map);

      // Add radar stations as clean SVG circle markers
      IMD_RADAR_STATIONS.forEach((station) => {
        const circleMarker = L.circleMarker([station.lat, station.lon], {
          radius: 6,
          fillColor: '#0284c7',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        });

        // Add 250km operational range circle
        const rangeCircle = L.circle([station.lat, station.lon], {
          radius: (station.rangeKm || 250) * 1000,
          color: '#0284c7',
          weight: 1,
          dashArray: '4, 6',
          fillColor: '#38bdf8',
          fillOpacity: 0.05,
        });

        circleMarker.bindTooltip(
          `<strong>${station.name}</strong><br/><span style="font-size:11px">${station.type} Radar • Range: ${station.rangeKm}km</span>`,
          { direction: 'top', className: 'imd-radar-tooltip' }
        );

        circleMarker.on('click', () => {
          setSelectedStation(station);
          map.flyTo([station.lat, station.lon], 8, { duration: 1.2 });
        });

        circleMarker.addTo(map);
        rangeCircle.addTo(map);
      });

      // Current location marker with pulsating ring
      const locMarker = L.circleMarker([location.lat, location.lon], {
        radius: 8,
        fillColor: '#f43f5e',
        color: '#ffffff',
        weight: 2.5,
        opacity: 1,
        fillOpacity: 1,
      }).addTo(map);

      locMarker.bindTooltip(`📍 <strong>${location.name}</strong>`, {
        permanent: true,
        direction: 'bottom',
        offset: [0, 6],
      });

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.flyTo([location.lat, location.lon], 7, { duration: 1 });
    }
  }, [location]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <section className="w-full max-w-2xl mx-auto px-4 my-2">
      <div className="bg-white/85 backdrop-blur-md rounded-3xl p-4 border border-black/[0.05] shadow-xs flex flex-col">
        {/* Title and Layer Controls */}
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 tracking-tight flex items-center gap-1.5">
              <span>Doppler Radar & Satellite</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 uppercase">
                Live
              </span>
            </h3>
            <p className="text-xs text-slate-400">IMD DWR Network & INSAT-3DR</p>
          </div>

          {/* Clean Segmented Layer Switcher */}
          <div className="flex items-center p-0.5 rounded-full bg-slate-100 border border-black/[0.04] text-xs self-start xs:self-auto shrink-0">
            <button
              id="radar-layer-radar"
              onClick={() => setActiveLayer('radar')}
              className={`px-3 py-1.5 min-h-[36px] rounded-full font-medium transition-all touch-manipulation active:scale-95 ${
                activeLayer === 'radar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Radar
            </button>
            <button
              id="radar-layer-satellite"
              onClick={() => setActiveLayer('satellite')}
              className={`px-3 py-1.5 min-h-[36px] rounded-full font-medium transition-all touch-manipulation active:scale-95 ${
                activeLayer === 'satellite' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Satellite
            </button>
            <button
              id="radar-layer-wind"
              onClick={() => setActiveLayer('wind')}
              className={`px-3 py-1.5 min-h-[36px] rounded-full font-medium transition-all touch-manipulation active:scale-95 ${
                activeLayer === 'wind' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Wind
            </button>
          </div>
        </div>

        {/* Interactive Map Viewport */}
        <div className="relative w-full h-[300px] sm:h-[380px] rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Map Zoom Controls */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 bg-white/90 backdrop-blur-md rounded-2xl p-1 shadow-md border border-slate-200/60">
            <button
              id="radar-zoom-in-btn"
              onClick={handleZoomIn}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-700 active:scale-95 transition-all touch-manipulation"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              id="radar-zoom-out-btn"
              onClick={handleZoomOut}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-700 active:scale-95 transition-all touch-manipulation"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          {/* Floating Radar Station Selector Capsule */}
          <div className="absolute top-3 left-3 z-10 max-w-[calc(100%-60px)]">
            <select
              id="radar-station-select"
              value={selectedStation?.id || ''}
              onChange={(e) => {
                const s = IMD_RADAR_STATIONS.find((st) => st.id === e.target.value);
                if (s && mapInstanceRef.current) {
                  setSelectedStation(s);
                  mapInstanceRef.current.flyTo([s.lat, s.lon], 8, { duration: 1 });
                }
              }}
              className="max-w-[200px] xs:max-w-xs bg-white/90 backdrop-blur-md text-slate-800 text-xs font-semibold py-2 px-3 rounded-full shadow-md border border-slate-200/70 focus:outline-none cursor-pointer truncate touch-manipulation"
            >
              <option value="">🎯 IMD Radar Stations</option>
              {IMD_RADAR_STATIONS.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.type})
                </option>
              ))}
            </select>
          </div>

          {/* Floating Timestamp Badge */}
          <div className="absolute bottom-3 left-3 z-10 bg-slate-900/85 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-medium px-2.5 sm:px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${frameIndex === 4 ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400'}`} />
            <span className="truncate max-w-[110px] sm:max-w-none">{frames[frameIndex].time}</span>
          </div>

          {/* Minimalist dBZ Radar Intensity Legend */}
          <div className="absolute bottom-3 right-3 z-10 bg-white/90 backdrop-blur-md px-2 py-1 rounded-full shadow-sm border border-slate-200 text-[9px] sm:text-[10px] font-medium text-slate-600 flex items-center gap-1 sm:gap-1.5">
            <span className="hidden xs:inline">Light</span>
            <div className="w-12 sm:w-16 h-1.5 sm:h-2 rounded-full bg-gradient-to-r from-sky-300 via-emerald-400 via-amber-400 to-rose-600" />
            <span className="hidden xs:inline">Severe</span>
          </div>
        </div>

        {/* Timeline Playback Controls */}
        <div className="mt-3 flex items-center gap-1.5 sm:gap-2 bg-slate-50 p-1.5 sm:p-2 rounded-2xl border border-slate-200/60">
          <button
            id="radar-play-pause-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-800 active:scale-95 transition-all shadow-xs shrink-0 touch-manipulation"
            title={isPlaying ? 'Pause radar animation' : 'Play radar animation'}
            aria-label={isPlaying ? 'Pause radar' : 'Play radar'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <div className="flex-1 min-w-0 flex items-center justify-between gap-0.5 sm:gap-1">
            {frames.map((f, i) => (
              <button
                key={f.label}
                id={`radar-frame-${f.label}`}
                onClick={() => {
                  setFrameIndex(i);
                  setIsPlaying(false);
                }}
                className={`flex-1 min-h-[38px] py-1 text-[11px] sm:text-xs font-semibold rounded-lg transition-all text-center touch-manipulation active:scale-95 ${
                  frameIndex === i
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-500 hover:bg-slate-200/60 hover:text-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            id="radar-reset-nowcast-btn"
            onClick={() => {
              setFrameIndex(4);
              setIsPlaying(false);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-200/60 active:bg-slate-200 transition-colors shrink-0 touch-manipulation active:scale-95"
            title="Reset to Live Nowcast"
            aria-label="Reset to Live Nowcast"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
