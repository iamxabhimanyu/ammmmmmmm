import React from 'react';
import { MapPin, Search, Navigation2, SlidersHorizontal, Globe } from 'lucide-react';
import { LocationInfo, PersonaType } from '../types';
import { PERSONA_PROFILES } from '../data/constants';

interface HeaderProps {
  currentLocation: LocationInfo;
  onOpenSearch: () => void;
  onUseCurrentLocation: () => void;
  isLoadingLocation?: boolean;
  selectedPersona: PersonaType;
  onOpenPersonaModal: () => void;
  onOpenSettings: () => void;
  currentLanguage: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  onOpenSearch,
  onUseCurrentLocation,
  isLoadingLocation = false,
  selectedPersona,
  onOpenPersonaModal,
  onOpenSettings,
  currentLanguage,
}) => {
  const currentPersonaObj = PERSONA_PROFILES.find((p) => p.id === selectedPersona) || PERSONA_PROFILES[0];

  return (
    <header className="sticky top-0 z-30 w-full px-4 pt-3 pb-2 transition-all backdrop-blur-md bg-white/40 border-b border-black/[0.04]">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
        {/* Location Section - Clickable to open search */}
        <button
          id="header-location-btn"
          onClick={onOpenSearch}
          className="flex-1 min-w-0 flex flex-col text-left group transition-transform active:scale-98 focus:outline-none py-1 pr-1 min-h-[44px] justify-center"
          aria-label="Change location"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-4 h-4 text-sky-600 shrink-0 group-hover:text-sky-700 transition-colors" />
            <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-slate-900 group-hover:text-sky-950 transition-colors truncate">
              {currentLocation.name}
            </h1>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium pl-5 truncate flex items-center gap-1">
            {currentLocation.isCurrent ? (
              <span className="inline-flex items-center gap-1 text-sky-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                Current Location
              </span>
            ) : (
              <span className="truncate">{currentLocation.state ? `${currentLocation.state}, India` : 'India'}</span>
            )}
          </p>
        </button>

        {/* Right Action Affordances - Clean touch targets */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Persona Mode Capsule */}
          <button
            id="header-persona-btn"
            onClick={onOpenPersonaModal}
            className="flex items-center gap-1.5 px-2.5 h-10 rounded-full bg-slate-900/[0.05] hover:bg-slate-900/[0.09] active:bg-slate-900/[0.12] transition-colors border border-black/[0.05] text-xs font-semibold text-slate-700 touch-manipulation active:scale-95"
            title="Switch Persona Mode (Agro-Met, Travel, Citizen, etc.)"
            aria-label="Change user mode"
          >
            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
            <span className="hidden sm:inline">{currentPersonaObj.label}</span>
            <span className="sm:hidden">{currentPersonaObj.label.split(' ')[0]}</span>
          </button>

          {/* Current GPS Button */}
          <button
            id="header-gps-btn"
            onClick={onUseCurrentLocation}
            disabled={isLoadingLocation}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-slate-900/[0.04] hover:bg-slate-900/[0.08] active:bg-slate-900/[0.12] text-slate-700 transition-all disabled:opacity-50 flex items-center justify-center touch-manipulation active:scale-95"
            title="Locate via GPS"
            aria-label="Use current GPS location"
          >
            <Navigation2 className={`w-4 h-4 ${isLoadingLocation ? 'animate-spin text-sky-600' : ''}`} />
          </button>

          {/* Search Trigger Button */}
          <button
            id="header-search-btn"
            onClick={onOpenSearch}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-slate-900/[0.04] hover:bg-slate-900/[0.08] active:bg-slate-900/[0.12] text-slate-700 transition-all flex items-center justify-center touch-manipulation active:scale-95"
            title="Search Indian cities & villages"
            aria-label="Search location"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Settings & Accessibility Toggle */}
          <button
            id="header-settings-btn"
            onClick={onOpenSettings}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-slate-900/[0.04] hover:bg-slate-900/[0.08] active:bg-slate-900/[0.12] text-slate-700 transition-all flex items-center justify-center touch-manipulation active:scale-95"
            title="Settings, Language & Accessibility"
            aria-label="Open settings"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
