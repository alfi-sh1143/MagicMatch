import React from 'react';
import { Clock, AlertTriangle, ArrowRight, X } from 'lucide-react';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  onContinue: () => void;
  onEndSession: () => void;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  isOpen,
  remainingSeconds,
  onContinue,
  onEndSession,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl text-center">
        {/* Animated Icon */}
        <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Clock className="w-10 h-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-3xl font-black text-white">Still There?</h2>
          <p className="text-sm text-neutral-400">
            For privacy, this booth resets automatically to protect your photos and survey responses.
          </p>
        </div>

        {/* Large Countdown Badge */}
        <div className="py-2">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-amber-400/40 bg-neutral-950">
            <span className="font-mono text-4xl font-black text-amber-300">
              {remainingSeconds}s
            </span>
          </div>
        </div>

        {/* Large Touch Target Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={onContinue}
            className="w-full py-4 rounded-2xl font-display font-bold text-base text-neutral-950 bg-amber-400 hover:bg-amber-300 active:scale-95 shadow-lg shadow-amber-950/40 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>CONTINUE SESSION</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={onEndSession}
            className="w-full py-3.5 rounded-2xl border border-neutral-800 bg-neutral-800/40 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
          >
            End Session & Clear Data
          </button>
        </div>
      </div>
    </div>
  );
};
