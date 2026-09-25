import React from 'react';
import { Compass, RefreshCw, SlidersHorizontal, Bookmark, RotateCcw } from 'lucide-react';

interface NoMatchViewProps {
  sessionId: string;
  onTryAnother: () => void;
  onExpandPreferences: () => void;
  onSaveSession: () => void;
  onResetBooth: () => void;
}

export const NoMatchView: React.FC<NoMatchViewProps> = ({
  sessionId,
  onTryAnother,
  onExpandPreferences,
  onSaveSession,
  onResetBooth,
}) => {
  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-64px)] max-w-xl mx-auto px-4 py-8 text-center">
      {/* Session token */}
      <div className="w-full flex items-center justify-between text-xs font-mono text-neutral-400 pb-3 border-b border-neutral-900">
        <span className="uppercase tracking-wider">Booth Diagnostics</span>
        <span>SESSION: {sessionId}</span>
      </div>

      <div className="my-auto space-y-6 py-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
          <Compass className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-100">
            Your vibe is unique.
          </h2>
          <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            There isn't a strong match in this booth session yet. Everyone's wavelength shifts throughout the day—broadening your hangout activities or battery tolerance can reveal compatible profiles.
          </p>
        </div>

        {/* Buttons as specified in section 28 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={onTryAnother}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-rose-400 hover:bg-rose-300 text-neutral-950 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>TRY ANOTHER MATCH</span>
          </button>

          <button
            onClick={onExpandPreferences}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4 text-rose-400" />
            <span>EXPAND PREFERENCES</span>
          </button>

          <button
            onClick={onSaveSession}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Bookmark className="w-4 h-4" />
            <span>SAVE SESSION</span>
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-neutral-900 w-full flex justify-center">
        <button
          onClick={onResetBooth}
          className="text-xs font-mono text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Booth for next visitor</span>
        </button>
      </div>
    </div>
  );
};
