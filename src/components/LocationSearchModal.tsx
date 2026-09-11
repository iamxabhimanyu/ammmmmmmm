import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation2, X, Clock, Loader2, Star } from 'lucide-react';
import { LocationInfo } from '../types';
import { MAJOR_INDIAN_CITIES } from '../data/constants';

interface LocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (loc: LocationInfo) => void;
  onUseCurrentLocation: () => void;
  isLoadingLocation?: boolean;
  recentLocations: LocationInfo[];
}

export const LocationSearchModal: React.FC<LocationSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  onUseCurrentLocation,
  isLoadingLocation = false,
  recentLocations,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        // First check local Indian cities for instant fuzzy match
        const lowerQ = query.toLowerCase();
        const localMatches = MAJOR_INDIAN_CITIES.filter(
          (c) =>
            c.name.toLowerCase().includes(lowerQ) ||
            c.state.toLowerCase().includes(lowerQ)
        );

        // Also query backend Nominatim proxy for all Indian towns, villages, and pin codes
        const res = await fetch(`/api/search-location?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const apiResults = await res.json();
          // Merge deduplicating by approximate coordinates
          const combined = [...localMatches];
          for (const item of apiResults) {
            const already = combined.some(
              (c) =>
                Math.abs(c.lat - item.lat) < 0.05 &&
                Math.abs(c.lon - item.lon) < 0.05
            );
            if (!already) combined.push(item);
          }
          setResults(combined);
        } else {
          setResults(localMatches);
        }
      } catch (e) {
        // Fallback to local filter
        const lowerQ = query.toLowerCase();
        setResults(
          MAJOR_INDIAN_CITIES.filter(
            (c) =>
              c.name.toLowerCase().includes(lowerQ) ||
              c.state.toLowerCase().includes(lowerQ)
          )
        );
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden mt-2 sm:mt-0">
        {/* Search Header Input */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center gap-2 sm:gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1" />
          <input
            id="location-search-input"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Indian city, town, or PIN..."
            className="flex-1 text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none min-h-[40px]"
          />
          {query ? (
            <button
              id="location-search-clear-btn"
              onClick={() => setQuery('')}
              className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 active:bg-slate-100 transition-colors touch-manipulation active:scale-95 shrink-0"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
          <button
            id="location-search-cancel-btn"
            onClick={onClose}
            className="min-h-[40px] px-3 flex items-center justify-center text-xs font-semibold text-slate-600 hover:text-slate-900 active:bg-slate-100 rounded-xl transition-colors touch-manipulation active:scale-95 shrink-0"
          >
            Cancel
          </button>
        </div>

        {/* GPS Current Location Quick Button */}
        <div className="px-3 sm:px-4 py-2 bg-sky-50/50 border-b border-slate-100 shrink-0">
          <button
            id="use-current-gps-btn"
            onClick={() => {
              onUseCurrentLocation();
              onClose();
            }}
            disabled={isLoadingLocation}
            className="w-full min-h-[50px] flex items-center gap-3 text-left py-2 px-3 rounded-2xl hover:bg-sky-100/70 active:bg-sky-200/60 transition-colors text-sky-800 font-medium text-sm touch-manipulation active:scale-98"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0">
              <Navigation2 className={`w-4 h-4 ${isLoadingLocation ? 'animate-spin' : ''}`} />
            </div>
            <div className="min-w-0">
              <span className="block font-semibold text-xs sm:text-sm truncate">Use Current Location</span>
              <span className="text-[11px] sm:text-xs text-sky-600 block truncate">Detect accurate location via GPS</span>
            </div>
          </button>
        </div>

        {/* Scrollable Results & Recommendations */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 overscroll-contain">
          {/* Active Search Results */}
          {query.trim() ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Search Results
                </span>
                {isSearching && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Searching...
                  </span>
                )}
              </div>

              {results.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {results.map((loc) => (
                    <button
                      key={loc.id}
                      id={`location-result-${loc.id}`}
                      onClick={() => {
                        onSelectLocation(loc);
                        onClose();
                      }}
                      className="w-full min-h-[48px] flex items-center gap-3 py-2.5 px-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 text-left transition-colors touch-manipulation active:scale-98"
                    >
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="truncate min-w-0">
                        <span className="text-sm font-semibold text-slate-900 block truncate">
                          {loc.name}
                        </span>
                        <span className="text-xs text-slate-500 block truncate">
                          {loc.district ? `${loc.district}, ` : ''}
                          {loc.state}, India
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : !isSearching ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No places found for "{query}". Try checking the spelling or search by district/state.
                </p>
              ) : null}
            </div>
          ) : (
            <>
              {/* Recent Locations if any */}
              {recentLocations.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Recent Locations
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {recentLocations.slice(0, 4).map((loc) => (
                      <button
                        key={loc.id}
                        id={`location-recent-${loc.id}`}
                        onClick={() => {
                          onSelectLocation(loc);
                          onClose();
                        }}
                        className="flex items-center gap-2 p-2.5 min-h-[44px] rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200/60 text-left text-xs transition-all touch-manipulation active:scale-95"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{loc.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Indian Cities */}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Popular Indian Cities
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MAJOR_INDIAN_CITIES.slice(0, 9).map((loc) => (
                    <button
                      key={loc.id}
                      id={`location-popular-${loc.id}`}
                      onClick={() => {
                        onSelectLocation(loc);
                        onClose();
                      }}
                      className="p-3 min-h-[54px] rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200/60 text-left transition-all group touch-manipulation active:scale-95"
                    >
                      <span className="text-xs font-bold text-slate-900 block group-hover:text-sky-700 truncate">
                        {loc.name}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                        {loc.state}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
