import React from 'react';
import { X, Globe, Eye, Type, Thermometer, Shield, Check, Phone } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES, EMERGENCY_HELPLINES } from '../data/constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  tempUnit: 'C' | 'F';
  onToggleTempUnit: (unit: 'C' | 'F') => void;
  highContrast: boolean;
  onToggleHighContrast: (val: boolean) => void;
  largeText: boolean;
  onToggleLargeText: (val: boolean) => void;
  selectedPersonas?: string[];
  onOpenPersonaModal?: () => void;
  onResetOnboarding?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  onSelectLanguage,
  tempUnit,
  onToggleTempUnit,
  highContrast,
  onToggleHighContrast,
  largeText,
  onToggleLargeText,
  selectedPersonas,
  onOpenPersonaModal,
  onResetOnboarding,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            Settings & Accessibility
          </h3>
          <button
            id="settings-modal-close-btn"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors touch-manipulation active:scale-95"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 text-xs overscroll-contain">
          {/* Personalized Modes & Personas */}
          {selectedPersonas && onOpenPersonaModal && (
            <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5 truncate">
                  <Shield className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Personalized Modes ({selectedPersonas.length})</span>
                </span>
                <button
                  id="settings-manage-modes-btn"
                  onClick={() => {
                    onClose();
                    onOpenPersonaModal();
                  }}
                  className="min-h-[36px] px-3 flex items-center text-xs font-bold text-sky-700 hover:text-sky-900 active:bg-sky-100/70 rounded-full transition-colors touch-manipulation active:scale-95 shrink-0"
                >
                  Manage Modes
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {selectedPersonas.map((p, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-full bg-white border border-sky-200 text-[11px] font-semibold text-sky-900 capitalize shadow-2xs"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Temperature Unit */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-sky-600" />
              Temperature Unit
            </label>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
              <button
                id="unit-celsius-btn"
                onClick={() => onToggleTempUnit('C')}
                className={`min-h-[44px] py-2 px-3 rounded-2xl border font-semibold flex items-center justify-between transition-all touch-manipulation active:scale-98 ${
                  tempUnit === 'C'
                    ? 'bg-sky-50 border-sky-400 text-sky-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                }`}
              >
                <span>Celsius (°C) — India</span>
                {tempUnit === 'C' && <Check className="w-4 h-4 text-sky-600" />}
              </button>

              <button
                id="unit-fahrenheit-btn"
                onClick={() => onToggleTempUnit('F')}
                className={`min-h-[44px] py-2 px-3 rounded-2xl border font-semibold flex items-center justify-between transition-all touch-manipulation active:scale-98 ${
                  tempUnit === 'F'
                    ? 'bg-sky-50 border-sky-400 text-sky-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                }`}
              >
                <span>Fahrenheit (°F)</span>
                {tempUnit === 'F' && <Check className="w-4 h-4 text-sky-600" />}
              </button>
            </div>
          </div>

          {/* Regional Indian Languages */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-600" />
              Indian Language (भाषा)
            </label>
            <div className="grid grid-cols-2 xs:grid-cols-3 gap-1.5">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSel = currentLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    id={`lang-btn-${lang.code}`}
                    onClick={() => onSelectLanguage(lang.code)}
                    className={`min-h-[44px] py-2 px-2.5 rounded-xl border text-left transition-all touch-manipulation active:scale-95 ${
                      isSel
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                    }`}
                  >
                    <span className="block text-xs font-semibold">{lang.nativeName}</span>
                    <span className="block text-[10px] text-slate-400 font-normal">{lang.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accessibility Toggles */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-600" />
              Display & Accessibility
            </label>
            <div className="space-y-2">
              <label className="min-h-[50px] flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer touch-manipulation active:bg-slate-100">
                <div className="pr-2">
                  <span className="font-semibold text-slate-800 block">High Contrast Mode</span>
                  <span className="text-[11px] text-slate-500 block">Enhances border contrast for bright outdoor glare</span>
                </div>
                <input
                  id="toggle-high-contrast-input"
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => onToggleHighContrast(e.target.checked)}
                  className="w-5 h-5 accent-sky-600 rounded shrink-0 cursor-pointer"
                />
              </label>

              <label className="min-h-[50px] flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer touch-manipulation active:bg-slate-100">
                <div className="pr-2">
                  <span className="font-semibold text-slate-800 block">Large Text / Senior Readability</span>
                  <span className="text-[11px] text-slate-500 block">Boosts font scale for effortless glanceability</span>
                </div>
                <input
                  id="toggle-large-text-input"
                  type="checkbox"
                  checked={largeText}
                  onChange={(e) => onToggleLargeText(e.target.checked)}
                  className="w-5 h-5 accent-sky-600 rounded shrink-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Emergency Helplines List */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-rose-600" />
              National Emergency Numbers (India)
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {EMERGENCY_HELPLINES.map((h, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-800 block truncate">{h.name}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{h.desc}</span>
                  </div>
                  <a
                    id={`settings-helpline-${h.number.replace(/\D/g, '')}`}
                    href={`tel:${h.number.split(' ')[0]}`}
                    className="min-h-[38px] px-3 flex items-center font-mono font-bold text-xs text-sky-700 bg-white hover:bg-sky-50 active:bg-sky-100 rounded-lg border border-slate-200 shrink-0 touch-manipulation active:scale-95"
                  >
                    {h.number}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Reset Onboarding Option */}
          {onResetOnboarding && (
            <div className="pt-1">
              <button
                id="reset-onboarding-btn"
                onClick={() => {
                  onClose();
                  onResetOnboarding();
                }}
                className="w-full min-h-[44px] py-2.5 px-3 rounded-2xl border border-slate-200 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 touch-manipulation active:scale-98"
              >
                <span>Re-run Welcome Setup & Onboarding</span>
              </button>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-100 text-center shrink-0">
          <p className="text-[11px] text-slate-400">
            MAUSAM Redesign • India Weather Intelligence & IMD Integration
          </p>
        </div>
      </div>
    </div>
  );
};
