import React from 'react';
import { Sparkles, Camera, HeartHandshake, ArrowRight, ArrowLeft } from 'lucide-react';

interface BoothHowItWorksProps {
  onContinue: () => void;
  onBack: () => void;
}

export const BoothHowItWorks: React.FC<BoothHowItWorksProps> = ({ onContinue, onBack }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 py-8 max-w-4xl mx-auto">
      <div className="text-center space-y-3 mb-12">
        <span className="text-xs font-mono uppercase tracking-widest text-rose-400">
          The Experience
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-neutral-100">
          How MagicMatch Works
        </h2>
        <p className="text-neutral-400 text-sm max-w-md mx-auto">
          Built for real-world serendipity in under two minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-neutral-400">Step 1</span>
            <h3 className="font-display text-lg font-bold text-neutral-100 mt-1">Answer Your Vibe</h3>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Pick your current social energy, passions, and dream hangout. Fast, intuitive, and zero boring surveys.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Camera className="w-7 h-7" />
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-neutral-400">Step 2</span>
            <h3 className="font-display text-lg font-bold text-neutral-100 mt-1">Snap Four Poses</h3>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Watch the 3-2-1 studio ring countdown. Capture candid, nostalgic photos with authentic film styling.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-neutral-400">Step 3</span>
            <h3 className="font-display text-lg font-bold text-neutral-100 mt-1">Meet & Print</h3>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Discover a compatible person in your venue or city. Walk away with a physical souvenir strip.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
        <button
          onClick={onBack}
          className="w-full sm:w-auto px-6 py-4 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-sm font-medium text-neutral-300 transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={onContinue}
          className="w-full py-4 px-8 text-base font-bold text-neutral-950 bg-rose-400 hover:bg-rose-300 active:scale-95 rounded-xl shadow-lg shadow-rose-950/40 transition-all cursor-pointer flex items-center justify-center gap-2 group"
        >
          <span>Let's Find Your Vibe</span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
