import React, { useState, useEffect } from 'react';
import {
  LocationInfo,
  CurrentWeather,
  HourlyForecastItem,
  DailyForecastItem,
  AirQualityData,
  WeatherAlert,
  PersonaType,
  SupportedLanguage,
  ActiveTabType,
  AgroMetAdvisory,
  PersonaIntelligence,
} from './types';
import { MAJOR_INDIAN_CITIES, normalizePersona } from './data/constants';
import {
  fetchLiveWeatherData,
  fetchAirQualityData,
  generateAlerts,
  generateAgroMetAdvisory,
  getThemeClassesForCondition,
} from './services/weatherService';
import { generatePersonaIntelligence } from './services/personaIntelligenceService';
import { Header } from './components/Header';
import { WeatherHero } from './components/WeatherHero';
import { HourlyForecast } from './components/HourlyForecast';
import { WeatherChart } from './components/WeatherChart';
import { DailyForecast } from './components/DailyForecast';
import { WeatherDetailsGrid } from './components/WeatherDetailsGrid';
import { AlertsBanner } from './components/AlertsBanner';
import { ForYouPersonalizedSection } from './components/ForYouPersonalizedSection';
import { PersonaDetailsModal } from './components/PersonaDetailsModal';
import { OnboardingFlow } from './components/OnboardingFlow';
import { LocationSearchModal } from './components/LocationSearchModal';
import { PersonaSelectorModal } from './components/PersonaSelectorModal';
import { RadarMapSection } from './components/RadarMapSection';
import { AgroMetSection } from './components/AgroMetSection';
import { TravelModeSection } from './components/TravelModeSection';
import { MausamGramSection } from './components/MausamGramSection';
import { MausamAiChat } from './components/MausamAiChat';
import { SettingsModal } from './components/SettingsModal';
import { Navigation } from './components/Navigation';
import { Loader2, RefreshCw, AlertCircle, ShieldAlert, Sparkles, Sprout, Car, Users, Bot } from 'lucide-react';

export function App() {
  // App State - First Launch Onboarding & State Persistence
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mausam_onboarding_completed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [currentLocation, setCurrentLocation] = useState<LocationInfo>(() => {
    try {
      const saved = localStorage.getItem('mausam_selected_location');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return MAJOR_INDIAN_CITIES[0]; // Mumbai default
  });

  const [recentLocations, setRecentLocations] = useState<LocationInfo[]>(() => {
    try {
      const saved = localStorage.getItem('mausam_recents');
      return saved ? JSON.parse(saved) : MAJOR_INDIAN_CITIES.slice(0, 3);
    } catch (e) {
      return MAJOR_INDIAN_CITIES.slice(0, 3);
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTabType>('home');

  // Personas - Primary + Multi-selection
  const [selectedPersonas, setSelectedPersonas] = useState<PersonaType[]>(() => {
    try {
      const saved = localStorage.getItem('mausam_selected_personas');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p) => normalizePersona(p));
        }
      }
    } catch (e) {}
    return ['runner', 'commuter'];
  });

  const [primaryPersona, setPrimaryPersona] = useState<PersonaType>(() => {
    try {
      const saved = localStorage.getItem('mausam_primary_persona');
      if (saved) return normalizePersona(saved);
    } catch (e) {}
    return 'runner';
  });

  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('mausam_selected_language');
      if (saved) return saved as SupportedLanguage;
    } catch (e) {}
    return 'en';
  });

  const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F'>('C');
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);

  // Weather Data State
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [hourly, setHourly] = useState<HourlyForecastItem[]>([]);
  const [daily, setDaily] = useState<DailyForecastItem[]>([]);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [agroMet, setAgroMet] = useState<AgroMetAdvisory | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHourIndex, setSelectedHourIndex] = useState(0);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [detailsModalIntel, setDetailsModalIntel] = useState<PersonaIntelligence | null>(null);

  // Load weather when location changes
  const loadWeatherData = async (loc: LocationInfo, refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const [weatherData, aqiData] = await Promise.all([
        fetchLiveWeatherData(loc.lat, loc.lon),
        fetchAirQualityData(loc.lat, loc.lon),
      ]);

      setWeather(weatherData.current);
      setHourly(weatherData.hourly);
      setDaily(weatherData.daily);
      setAirQuality(aqiData);

      const generatedAlerts = generateAlerts(
        loc.name,
        loc.state,
        weatherData.current,
        weatherData.hourly
      );
      setAlerts(generatedAlerts);

      const generatedAgro = generateAgroMetAdvisory(
        loc.name,
        weatherData.current,
        weatherData.daily
      );
      setAgroMet(generatedAgro);

      setSelectedHourIndex(0);
    } catch (err: any) {
      console.error('Error fetching weather:', err);
      setError('Unable to load live meteorological data. Please check your internet connection.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadWeatherData(currentLocation);
  }, [currentLocation]);

  // Select Location handler
  const handleSelectLocation = (loc: LocationInfo) => {
    setCurrentLocation(loc);
    try {
      localStorage.setItem('mausam_selected_location', JSON.stringify(loc));
    } catch (e) {}
    // Add to recents
    setRecentLocations((prev) => {
      const filtered = prev.filter((item) => item.id !== loc.id);
      const updated = [loc, ...filtered].slice(0, 6);
      try {
        localStorage.setItem('mausam_recents', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleCompleteOnboarding = (data: {
    selectedPersonas: PersonaType[];
    primaryPersona: PersonaType;
    language: SupportedLanguage;
    location: LocationInfo;
  }) => {
    setSelectedPersonas(data.selectedPersonas);
    setPrimaryPersona(data.primaryPersona);
    setCurrentLanguage(data.language);
    setCurrentLocation(data.location);
    setHasCompletedOnboarding(true);
    try {
      localStorage.setItem('mausam_onboarding_completed', 'true');
      localStorage.setItem('mausam_selected_personas', JSON.stringify(data.selectedPersonas));
      localStorage.setItem('mausam_primary_persona', data.primaryPersona);
      localStorage.setItem('mausam_selected_language', data.language);
      localStorage.setItem('mausam_selected_location', JSON.stringify(data.location));
    } catch (e) {}
  };

  const handleResetOnboarding = () => {
    try {
      localStorage.removeItem('mausam_onboarding_completed');
    } catch (e) {}
    setHasCompletedOnboarding(false);
  };

  const handlePersonaActionClick = (actionType: string) => {
    if (actionType === 'agromet') setActiveTab('more');
    else if (actionType === 'travel') setActiveTab('more');
    else if (actionType === 'radar') setActiveTab('radar');
    else if (actionType === 'alerts') setActiveTab('alerts');
  };

  // GPS Current Location handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        try {
          // Reverse geocode via backend Nominatim proxy
          const res = await fetch(`/api/search-location?q=${lat},${lon}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              const detected = {
                ...data[0],
                isCurrent: true,
              };
              handleSelectLocation(detected);
              setIsLoadingLocation(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Reverse geocoding failed, using coordinates');
        }

        const fallbackLoc: LocationInfo = {
          id: 'gps-current',
          name: 'My Current Location',
          state: 'India',
          country: 'India',
          lat,
          lon,
          isCurrent: true,
        };
        handleSelectLocation(fallbackLoc);
        setIsLoadingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLoadingLocation(false);
        // If user denied or timed out, remain on current
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Dynamic Atmospheric Theme Background
  const theme = weather
    ? getThemeClassesForCondition(weather.conditionKey, weather.isDay)
    : {
        bgGradient: 'from-sky-100/60 via-slate-50 to-slate-50',
        heroAccent: 'text-sky-600',
        cardBg: 'bg-white/90 border-slate-200 text-slate-900',
        isDark: false,
      };

  // Persona Intelligence Generation
  const primaryIntelligence =
    weather && airQuality
      ? generatePersonaIntelligence(
          primaryPersona,
          weather,
          hourly,
          daily,
          airQuality,
          currentLocation.name
        )
      : null;

  const allSelectedIntelligences =
    weather && airQuality
      ? selectedPersonas.map((p) =>
          generatePersonaIntelligence(p, weather, hourly, daily, airQuality, currentLocation.name)
        )
      : [];

  return (
    <div
      className={`w-full max-w-full overflow-x-hidden min-h-screen flex flex-col bg-gradient-to-b ${theme.bgGradient} text-slate-900 transition-colors duration-500 pb-nav-safe sm:pb-8 selection:bg-sky-200 ${
        highContrast ? 'contrast-125' : ''
      } ${largeText ? 'text-base' : 'text-sm'}`}
    >
      {/* Top Header */}
      <Header
        currentLocation={currentLocation}
        onOpenSearch={() => setIsSearchOpen(true)}
        onUseCurrentLocation={handleUseCurrentLocation}
        isLoadingLocation={isLoadingLocation}
        selectedPersona={primaryPersona}
        onOpenPersonaModal={() => setIsPersonaOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        currentLanguage={currentLanguage}
      />

      {/* Desktop / Tablet Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        hasActiveAlerts={alerts.some((a) => a.severity === 'severe' || a.severity === 'warning')}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-2xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-28 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            <span className="text-xs font-semibold text-slate-600 tracking-wide">
              Connecting to Indian Meteorological Network...
            </span>
          </div>
        ) : error ? (
          <div className="p-6 text-center max-w-md mx-auto my-12 bg-white/80 backdrop-blur-md rounded-3xl border border-rose-200 shadow-sm mx-4">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">Weather Unavailable</h3>
            <p className="text-xs text-slate-600 mt-1 mb-4">{error}</p>
            <button
              id="app-error-retry-btn"
              onClick={() => loadWeatherData(currentLocation)}
              className="min-h-[44px] px-6 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 active:bg-slate-950 transition-all touch-manipulation active:scale-95"
            >
              Try Again
            </button>
          </div>
        ) : weather && airQuality ? (
          <>
            {/* VIEW 1: HOME (Google Weather Minimal Clean + MAUSAM Persona Intelligence) */}
            {activeTab === 'home' && (
              <div className="animate-in fade-in duration-200">
                {/* 1. Hero */}
                <WeatherHero
                  weather={weather}
                  location={currentLocation}
                  temperatureUnit={temperatureUnit}
                />

                {/* 2. Active Severe Alerts Banner (If warning active) */}
                <AlertsBanner
                  alerts={alerts}
                  onViewAllAlerts={() => setActiveTab('alerts')}
                />

                {/* 3. Hourly Forecast Horizontal Capsules */}
                <HourlyForecast
                  hourly={hourly}
                  selectedHourIndex={selectedHourIndex}
                  onSelectHour={setSelectedHourIndex}
                  temperatureUnit={temperatureUnit}
                />

                {/* 4. Minimal Weather Trend Chart */}
                <WeatherChart
                  hourly={hourly}
                  temperatureUnit={temperatureUnit}
                />

                {/* 5. Daily 10-Day Forecast Teaser */}
                <DailyForecast
                  daily={daily}
                  temperatureUnit={temperatureUnit}
                />

                {/* 6. "FOR YOU" - The most important personalized section on Home */}
                {primaryIntelligence && (
                  <ForYouPersonalizedSection
                    primaryIntelligence={primaryIntelligence}
                    allSelectedIntelligences={allSelectedIntelligences}
                    selectedPersonas={selectedPersonas}
                    onSelectPrimaryPersona={(p) => {
                      setPrimaryPersona(p);
                      try {
                        localStorage.setItem('mausam_primary_persona', p);
                      } catch (e) {}
                    }}
                    onOpenManagePersonas={() => setIsPersonaOpen(true)}
                    onOpenDetails={(intel) => setDetailsModalIntel(intel)}
                    language={currentLanguage}
                  />
                )}

                {/* 7. Comprehensive Weather Details Bento Grid (AQI, Wind, UV, Humidity, etc.) */}
                <WeatherDetailsGrid
                  weather={weather}
                  airQuality={airQuality}
                  temperatureUnit={temperatureUnit}
                />
              </div>
            )}

            {/* VIEW 2: FORECAST (Deep Hourly & 10-Day Breakdown) */}
            {activeTab === 'forecast' && (
              <div className="animate-in fade-in duration-200 pt-2">
                <div className="px-4 mb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {currentLocation.name} Forecast
                      </h2>
                      <p className="text-xs text-slate-500">
                        Hourly trends, rain likelihood, and 10-day outlook
                      </p>
                    </div>
                    <button
                      id="forecast-refresh-btn"
                      onClick={() => loadWeatherData(currentLocation, true)}
                      disabled={isRefreshing}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 text-slate-600 transition-colors touch-manipulation active:scale-95 shrink-0"
                      title="Refresh forecast"
                      aria-label="Refresh forecast"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
                    </button>
                  </div>
                </div>

                <HourlyForecast
                  hourly={hourly}
                  selectedHourIndex={selectedHourIndex}
                  onSelectHour={setSelectedHourIndex}
                  temperatureUnit={temperatureUnit}
                />

                <WeatherChart
                  hourly={hourly}
                  temperatureUnit={temperatureUnit}
                />

                <DailyForecast
                  daily={daily}
                  temperatureUnit={temperatureUnit}
                />
              </div>
            )}

            {/* VIEW 3: RADAR & MAPS */}
            {activeTab === 'radar' && (
              <div className="animate-in fade-in duration-200 pt-2">
                <RadarMapSection location={currentLocation} />
              </div>
            )}

            {/* VIEW 4: ALERTS & BULLETINS */}
            {activeTab === 'alerts' && (
              <div className="animate-in fade-in duration-200 pt-2">
                <div className="px-4 mb-3">
                  <h2 className="text-lg font-bold text-slate-900">
                    Weather Alerts & Bulletins
                  </h2>
                  <p className="text-xs text-slate-500">
                    Official IMD, NDMA & CAP Emergency Advisories
                  </p>
                </div>

                <AlertsBanner alerts={alerts} />

                {/* Additional Public Safety Guidelines */}
                <div className="px-4 my-3">
                  <div className="bg-white/85 backdrop-blur-md rounded-3xl p-4 border border-black/[0.05] shadow-xs">
                    <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-sky-600" />
                      <span>Monsoon & Thunderstorm Safety Guidelines</span>
                    </h3>
                    <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                      <p>
                        • <strong>During Lightning:</strong> Move indoors immediately. Stay away from open windows, electrical appliances, and wire fences.
                      </p>
                      <p>
                        • <strong>Waterlogged Roads:</strong> Avoid driving through standing water of unknown depth. Submerged manholes pose severe hazards.
                      </p>
                      <p>
                        • <strong>Coastal Waves:</strong> Obey red flag warnings along beaches and promenades during high tide periods.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 5: MORE / EXPLORE (Krishi Agro-Met, Travel, MausamGram, AI Chat) */}
            {activeTab === 'more' && (
              <div className="animate-in fade-in duration-200 pt-2 space-y-3">
                <div className="px-4 mb-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    Specialized Weather Features
                  </h2>
                  <p className="text-xs text-slate-500">
                    Agricultural advisories, highway journeys, citizen reports, and AI assistant
                  </p>
                </div>

                {/* 1. Agro-Met Section */}
                {agroMet && (
                  <AgroMetSection
                    advisory={agroMet}
                    weather={weather}
                    locationName={currentLocation.name}
                  />
                )}

                {/* 2. Travel Route Section */}
                <TravelModeSection currentCity={currentLocation.name} />

                {/* 3. Mausam AI Assistant Chat */}
                <MausamAiChat
                  location={currentLocation}
                  weather={weather}
                  persona={primaryPersona}
                />

                {/* 4. MausamGram Citizen Observations */}
                <MausamGramSection currentCity={currentLocation.name} />
              </div>
            )}
          </>
        ) : null}
      </main>

      {/* Modals & Overlays */}
      <LocationSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectLocation={handleSelectLocation}
        onUseCurrentLocation={handleUseCurrentLocation}
        isLoadingLocation={isLoadingLocation}
        recentLocations={recentLocations}
      />

      <PersonaSelectorModal
        isOpen={isPersonaOpen}
        onClose={() => setIsPersonaOpen(false)}
        selectedPersona={primaryPersona}
        selectedPersonas={selectedPersonas}
        onSelectPersona={(p) => {
          setPrimaryPersona(p);
          try {
            localStorage.setItem('mausam_primary_persona', p);
          } catch (e) {}
        }}
        onUpdatePersonas={(personas, primary) => {
          setSelectedPersonas(personas);
          setPrimaryPersona(primary);
          try {
            localStorage.setItem('mausam_selected_personas', JSON.stringify(personas));
            localStorage.setItem('mausam_primary_persona', primary);
          } catch (e) {}
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentLanguage={currentLanguage}
        onSelectLanguage={(lang) => {
          setCurrentLanguage(lang);
          try {
            localStorage.setItem('mausam_selected_language', lang);
          } catch (e) {}
        }}
        tempUnit={temperatureUnit}
        onToggleTempUnit={setTemperatureUnit}
        highContrast={highContrast}
        onToggleHighContrast={setHighContrast}
        largeText={largeText}
        onToggleLargeText={setLargeText}
        selectedPersonas={selectedPersonas}
        onOpenPersonaModal={() => setIsPersonaOpen(true)}
        onResetOnboarding={handleResetOnboarding}
      />

      {/* Persona Deep-Dive Details Modal */}
      {detailsModalIntel && (
        <PersonaDetailsModal
          isOpen={!!detailsModalIntel}
          onClose={() => setDetailsModalIntel(null)}
          intelligence={detailsModalIntel}
          language={currentLanguage}
          onActionClick={handlePersonaActionClick}
        />
      )}

      {/* First-Launch Onboarding Overlay */}
      {!hasCompletedOnboarding && (
        <OnboardingFlow
          onComplete={handleCompleteOnboarding}
          initialLanguage={currentLanguage}
          initialLocation={currentLocation}
        />
      )}
    </div>
  );
}

export default App;
