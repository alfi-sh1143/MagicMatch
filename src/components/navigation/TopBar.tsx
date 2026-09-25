import React from 'react';
import { Volume2, VolumeX, Monitor, Shield, Settings, QrCode } from 'lucide-react';

export type AppViewType =
  | 'landing'
  | 'booth'
  | 'kiosk'
  | 'dashboard'
  | 'connections'
  | 'settings'
  | 'privacy'
  | 'connect';

interface TopBarProps {
  currentView: AppViewType;
  onNavigate: (view: AppViewType) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  repositoryMode: 'local' | 'connected';
  isOnline: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onNavigate,
  isMuted,
  onToggleMute,
  repositoryMode,
  isOnline,
}) => {
  return (
    <header className="relative z-40 border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md px-4 sm:px-8 py-3.5 no-print">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Zone 1: Wordmark */}
        <button
          onClick={() => onNavigate('landing')}
          className="text-left group cursor-pointer focus-visible:outline-hidden rounded-md flex items-center gap-2"
        >
          <span className="font-display text-xl font-bold tracking-tight text-neutral-100 group-hover:text-rose-400 transition-colors">
            MagicMatch
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400">
            PHASE 4 KIOSK
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-mono uppercase tracking-wider text-neutral-400">
          <button
            onClick={() => onNavigate('landing')}
            className={`transition-colors hover:text-neutral-100 cursor-pointer ${
              currentView === 'landing' ? 'text-neutral-100 font-bold border-b border-rose-400 pb-0.5' : ''
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onNavigate('kiosk')}
            className={`transition-colors hover:text-rose-300 cursor-pointer flex items-center gap-1.5 ${
              currentView === 'kiosk' ? 'text-rose-400 font-bold border-b border-rose-400 pb-0.5' : ''
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-rose-400" />
            <span>Kiosk Mode</span>
          </button>
          <button
            onClick={() => onNavigate('connect')}
            className={`transition-colors hover:text-rose-300 cursor-pointer flex items-center gap-1.5 ${
              currentView === 'connect' ? 'text-rose-400 font-bold border-b border-rose-400 pb-0.5' : ''
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-rose-400" />
            <span>Mobile Connect</span>
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className={`transition-colors hover:text-neutral-100 cursor-pointer ${
              currentView === 'dashboard' ? 'text-neutral-100 font-bold border-b border-rose-400 pb-0.5' : ''
            }`}
          >
            Operator Hub
          </button>
          <button
            onClick={() => onNavigate('privacy')}
            className={`transition-colors hover:text-neutral-100 cursor-pointer flex items-center gap-1 ${
              currentView === 'privacy' ? 'text-neutral-100 font-bold border-b border-rose-400 pb-0.5' : ''
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Privacy</span>
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className={`transition-colors hover:text-neutral-100 cursor-pointer flex items-center gap-1 ${
              currentView === 'settings' ? 'text-neutral-100 font-bold border-b border-rose-400 pb-0.5' : ''
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Venue Config</span>
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-3">
          {/* Database Mode indicator */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-neutral-400 font-mono bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-md">
            <span
              className={`w-2 h-2 rounded-full ${
                repositoryMode === 'connected' ? 'bg-cyan-400' : 'bg-amber-400'
              }`}
            />
            <span className="uppercase">{repositoryMode === 'connected' ? 'SUPABASE' : 'LOCAL-FIRST'}</span>
          </div>

          {/* Network indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 font-mono bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-md">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span>{isOnline ? 'ONLINE' : 'OFFLINE MODE'}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
            className="p-2 text-neutral-400 hover:text-neutral-100 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors cursor-pointer"
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-rose-400" />}
          </button>

          {/* Launch Kiosk Full Viewport */}
          {currentView !== 'kiosk' && (
            <button
              onClick={() => onNavigate('kiosk')}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-neutral-950 bg-rose-400 hover:bg-rose-300 rounded-xl shadow-lg shadow-rose-950/40 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Enter Kiosk Mode</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
