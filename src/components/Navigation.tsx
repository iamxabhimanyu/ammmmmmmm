import React from 'react';
import { Home, Calendar, Map, Bell, Sparkles, MoreHorizontal } from 'lucide-react';
import { ActiveTabType } from '../types';

interface NavigationProps {
  activeTab: ActiveTabType;
  onChangeTab: (tab: ActiveTabType) => void;
  hasActiveAlerts?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  hasActiveAlerts = false,
}) => {
  const navItems = [
    { id: 'home' as ActiveTabType, label: 'Home', icon: Home },
    { id: 'forecast' as ActiveTabType, label: 'Forecast', icon: Calendar },
    { id: 'radar' as ActiveTabType, label: 'Radar', icon: Map },
    { id: 'alerts' as ActiveTabType, label: 'Alerts', icon: Bell, badge: hasActiveAlerts },
    { id: 'more' as ActiveTabType, label: 'Explore', icon: Sparkles },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 sm:hidden pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] px-1 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
      >
        <div className="flex items-center justify-between w-full max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => onChangeTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all duration-150 relative select-none active:scale-95 ${
                  isActive ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
                }`}
                aria-label={item.label}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-sky-600 stroke-[2.2]' : 'stroke-[1.8]'}`} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-1 leading-none font-medium">
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-sky-600 mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Centered Segmented Navigation Bar */}
      <div className="hidden sm:flex justify-center w-full max-w-2xl mx-auto px-4 mt-2 mb-1">
        <div className="inline-flex items-center p-1 rounded-full bg-white/80 backdrop-blur-md border border-black/[0.05] shadow-xs gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all select-none relative ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
