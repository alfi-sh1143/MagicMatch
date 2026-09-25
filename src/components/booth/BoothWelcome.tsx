import React from 'react';
import { Sparkles, Camera, ArrowRight, ShieldCheck } from 'lucide-react';

interface BoothWelcomeProps {
  onStart: () => void;
  onHowItWorks: () => void;
}

export const BoothWelcome: React.FC<BoothWelcomeProps> = ({ onStart, onHowItWorks }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 py-8 text-center max-w-4xl mx-auto">
      {/* Kiosk status bar */}
      <div className="mb-6 flex items-center gap-3 text-xs font-mono text-neutral-400 bg-neutral-900/80 border border-neutral-800 px-4 py-1.5 rounded-full">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>MAGICMATCH BOOTH · KIOSK STATION 01</span>
      </div>

      <div className="space-y-4 max-w-2xl">
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-neutral-100 text-balance">
          Take a picture. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-rose-400 to-amber-200">
            Meet your vibe.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-neutral-300 font-normal leading-relaxed pt-2">
          Step inside. Answer five rapid prompts, strike four poses in the photobooth, and walk away with a printed strip featuring someone compatible in your city.
        </p>
      </div>

      {/* Main Touch Buttons */}
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
        <button
          onClick={onStart}
          className="w-full py-5 px-8 text-lg font-bold text-neutral-950 bg-rose-400 hover:bg-rose-300 active:scale-95 rounded-2xl shadow-xl shadow-rose-950/40 transition-all cursor-pointer flex items-center justify-center gap-3 group"
        >
          <Camera className="w-6 h-6 transition-transform group-hover:scale-110" />
          <span>START BOOTH</span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>

        <button
          onClick={onHowItWorks}
          className="w-full sm:w-auto py-5 px-6 text-sm font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-2xl transition-colors cursor-pointer whitespace-nowrap"
        >
          How does it work?
        </button>
      </div>

      {/* Privacy guarantee note */}
      <div className="mt-12 flex items-center gap-2 text-xs font-mono text-neutral-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>No public feeds · Dual-consent contact sharing · Instant print</span>
      </div>
    </div>
  );
};
