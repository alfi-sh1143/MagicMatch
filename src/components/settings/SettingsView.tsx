import React, { useState } from 'react';
import { Volume2, VolumeX, Shield, Trash2, RotateCcw, Clock, Sliders, Check } from 'lucide-react';
import { soundService } from '../../services/hardware';
import { getRepository } from '../../services/repository';

interface SettingsViewProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onResetKiosk: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isMuted,
  onToggleMute,
  onResetKiosk,
}) => {
  const [resetTimer, setResetTimer] = useState<number>(120);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleClearBlocked = async () => {
    try {
      localStorage.removeItem('magicmatch_blocked_profiles');
      setFeedbackMsg('Blocked candidate profiles cleared.');
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {}
  };

  const handleClearHistory = async () => {
    try {
      localStorage.removeItem('magicmatch_sessions_history');
      localStorage.removeItem('magicmatch_current_session');
      setFeedbackMsg('All local sessions and stored photos purged.');
      setTimeout(() => setFeedbackMsg(null), 3000);
      onResetKiosk();
    } catch {}
  };

  return (
    <div className="min-h-[calc(100vh-64px)] max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-1 pb-6 border-b border-neutral-900">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-rose-400">
          <span>Kiosk System Configuration</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-neutral-100">
          Settings & Environment
        </h1>
        <p className="text-sm text-neutral-400">
          Adjust hardware parameters, kiosk idle timers, and local storage state.
        </p>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs font-mono text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Section 1: Audio Feedback */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-display text-base font-bold text-neutral-100">
                Acoustic Feedback & Shutter Beeps
              </h3>
              <p className="text-xs text-neutral-400">
                Web Audio API synthesized shutter snaps, countdown beeps, and match celebration chimes.
              </p>
            </div>

            <button
              onClick={onToggleMute}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                !isMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400'
              }`}
            >
              {!isMuted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Section 2: Kiosk Idle Reset Timer */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold text-neutral-100">
              Kiosk Auto-Reset Timeout
            </h3>
            <p className="text-xs text-neutral-400">
              Automatically returns the kiosk to the welcome screen after a completed session.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {[60, 120, 180].map((seconds) => (
              <button
                key={seconds}
                onClick={() => setResetTimer(seconds)}
                className={`py-2.5 px-4 rounded-xl border text-xs font-mono font-medium transition-colors cursor-pointer ${
                  resetTimer === seconds
                    ? 'border-rose-400 bg-rose-500/20 text-rose-200'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                {seconds} Seconds
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Data & Privacy Purge */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold text-neutral-100">
              Local Storage & Safety Actions
            </h3>
            <p className="text-xs text-neutral-400">
              Purge temporary session files, reset blocked candidates, or re-initialize operator metrics.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleClearBlocked}
              className="px-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-xs font-medium text-neutral-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Blocked Profiles</span>
            </button>

            <button
              onClick={handleClearHistory}
              className="px-4 py-2.5 rounded-xl border border-rose-900/40 bg-rose-950/20 hover:bg-rose-900/40 text-xs font-medium text-rose-300 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge All Local Sessions & Photos</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
