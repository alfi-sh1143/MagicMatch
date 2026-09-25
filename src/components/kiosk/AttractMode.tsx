import React, { useState, useEffect } from 'react';
import { Camera, Sparkles, HeartHandshake, Film, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { VenueConfig } from '../../types';

interface AttractModeProps {
  venueConfig: VenueConfig;
  onStartSession: () => void;
  onOperatorGesture: () => void;
}

export const AttractMode: React.FC<AttractModeProps> = ({
  venueConfig,
  onStartSession,
  onOperatorGesture,
}) => {
  // Hold-to-unlock operator gesture (top-right corner)
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);

  // Periodic simulated "Match Found" animation cycle
  const [pulseMatch, setPulseMatch] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseMatch(true);
      setTimeout(() => setPulseMatch(false), 3800);
    }, 11000);
    return () => clearInterval(interval);
  }, []);

  // Corner hold timer for operator access
  useEffect(() => {
    let timer: any;
    if (isHolding) {
      const startTime = Date.now();
      timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / 4500) * 100);
        setHoldProgress(progress);
        if (progress >= 100) {
          clearInterval(timer);
          setIsHolding(false);
          setHoldProgress(0);
          onOperatorGesture();
        }
      }, 50);
    } else {
      setHoldProgress(0);
    }
    return () => clearInterval(timer);
  }, [isHolding, onOperatorGesture]);

  return (
    <div
      onClick={onStartSession}
      className="relative w-full h-full min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between overflow-hidden cursor-pointer select-none"
    >
      {/* Hidden operator unlock corner (top-right, hold for 5s) */}
      <div
        className="absolute top-0 right-0 w-28 h-28 z-50 flex items-start justify-end p-3"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsHolding(true);
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          setIsHolding(false);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          setIsHolding(true);
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          setIsHolding(false);
        }}
      >
        {isHolding && (
          <div className="flex flex-col items-end gap-1 pointer-events-none animate-fade-in">
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 bg-neutral-900/90 px-2 py-0.5 rounded border border-rose-500/30">
              Hold {Math.ceil((100 - holdProgress) / 20)}s
            </span>
            <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-400 transition-all duration-75"
                style={{ width: `${holdProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Ambient moving lens flares & orbital backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(244,63,94,0.08),transparent_70%)]" />
      </div>

      {/* Top Venue Header */}
      <header className="relative z-10 p-8 sm:p-12 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-mono tracking-widest uppercase text-neutral-400">
            {venueConfig.venueName} • {venueConfig.boothName}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
          <span className="w-2 h-2 rounded-full bg-neutral-700" />
          <span>KIOSK ACTIVE</span>
        </div>
      </header>

      {/* Center Cinematic Stage */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto space-y-8">
        {/* Animated Lens Aperture Frame */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-amber-500/20 rounded-full blur-2xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt" />
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-neutral-700/80 bg-neutral-900/90 backdrop-blur-md flex items-center justify-center shadow-2xl">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border border-rose-500/30 flex items-center justify-center">
              <Camera className="w-12 h-12 sm:w-16 sm:h-16 text-rose-400 animate-pulse" />
            </div>
            {/* Orbital ring */}
            <div className="absolute inset-0 rounded-full border-2 border-t-rose-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '7s' }} />
          </div>
        </div>

        {/* Hero Title & Value Proposition */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neutral-800 bg-neutral-900/70 text-xs font-mono tracking-widest uppercase text-neutral-300">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Interactive Photobooth Experience</span>
          </div>

          <h1 className="font-display text-5xl sm:text-7xl font-black tracking-tight text-white uppercase leading-none">
            Take a Picture. <br />
            <span className="bg-gradient-to-r from-rose-400 via-pink-300 to-amber-300 bg-clip-text text-transparent">
              Meet Your Vibe.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-neutral-400 max-w-xl mx-auto font-light leading-relaxed">
            {venueConfig.welcomeMessage}
          </p>
        </div>

        {/* Match Found Floating Preview Popover */}
        <div
          className={`transition-all duration-700 transform ${
            pulseMatch ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
          }`}
        >
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-neutral-900/95 border border-rose-500/40 shadow-2xl backdrop-blur-lg">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div className="text-left font-mono">
              <p className="text-xs text-rose-400 font-bold uppercase tracking-wider">Just Matched in Venue</p>
              <p className="text-[11px] text-neutral-300">Maya & Alex • 92% Overlap (Vinyl Cafe & Design)</p>
            </div>
          </div>
        </div>

        {/* Large Touch Target Primary CTA */}
        <div className="pt-4">
          <button
            onClick={onStartSession}
            className="w-full sm:w-auto px-12 py-5 rounded-2xl font-display font-black text-xl text-neutral-950 bg-gradient-to-r from-rose-400 via-rose-300 to-amber-300 hover:brightness-110 active:scale-95 shadow-2xl shadow-rose-950/60 transition-all cursor-pointer flex items-center justify-center gap-4 group"
          >
            <span>TAP TO START</span>
            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
          </button>
        </div>
      </div>

      {/* Bottom Feature Badges */}
      <footer className="relative z-10 p-8 sm:p-12 flex flex-wrap items-center justify-center gap-8 border-t border-neutral-900/80 bg-neutral-950/40 backdrop-blur-sm text-xs font-mono text-neutral-400">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-rose-400" />
          <span>3-Pose Glossy Photo Strip</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Instant Deterministic Compatibility</span>
        </div>
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-pink-400" />
          <span>100% Dual-Consent Privacy</span>
        </div>
      </footer>
    </div>
  );
};
