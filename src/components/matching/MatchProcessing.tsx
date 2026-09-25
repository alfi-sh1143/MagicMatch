import React, { useState, useEffect } from 'react';
import { Sparkles, Radio, Zap } from 'lucide-react';
import { soundService } from '../../services/hardware';

interface MatchProcessingProps {
  onComplete: () => void;
  candidateCount?: number;
}

const STAGES = [
  'INITIALIZING VIBE RADAR...',
  'EVALUATING 30 LOCAL PROFILES...',
  'CALCULATING ENERGY RESONANCE & HANGOUTS...',
  'PROFILE SIGNAL FOUND. LOCKING FREQUENCY...',
];

export const MatchProcessing: React.FC<MatchProcessingProps> = ({
  onComplete,
  candidateCount = 30,
}) => {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [flashActive, setFlashActive] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setCurrentStageIdx(1);
    }, 700);

    const timer2 = setTimeout(() => {
      setCurrentStageIdx(2);
    }, 1500);

    const timer3 = setTimeout(() => {
      setCurrentStageIdx(3);
      soundService.playCountdownTick();
    }, 2300);

    const timerFlash = setTimeout(() => {
      setFlashActive(true);
      soundService.playShutter();
      soundService.playMatchChime();
    }, 2900);

    const timerComplete = setTimeout(() => {
      onComplete();
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timerFlash);
      clearTimeout(timerComplete);
    };
  }, [onComplete]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 py-8 overflow-hidden text-center">
      {/* Flash overlay */}
      {flashActive && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-200" />
      )}

      {/* Orbital Radar Graphic */}
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center mb-8">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border border-rose-500/20 animate-spin duration-[12000ms]" />
        {/* Mid Ring */}
        <div className="absolute inset-8 rounded-full border border-dashed border-rose-400/30 animate-spin duration-[8000ms] direction-reverse" />
        {/* Inner Ring */}
        <div className="absolute inset-16 rounded-full border border-rose-500/40" />

        {/* Radar Sweep Line */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-rose-500/10 via-transparent to-transparent animate-spin duration-[3000ms]" />

        {/* Center Node */}
        <div className="relative z-10 w-20 h-20 rounded-full bg-neutral-900 border-2 border-rose-400 flex items-center justify-center shadow-2xl shadow-rose-950/60">
          <Radio className="w-8 h-8 text-rose-400 animate-pulse" />
        </div>

        {/* Floating Blips */}
        <div className="absolute top-12 left-16 w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
        <div className="absolute bottom-16 right-12 w-2 h-2 rounded-full bg-amber-400 animate-ping delay-300" />
        <div className="absolute top-24 right-20 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping delay-700" />
      </div>

      {/* Dynamic Status Text */}
      <div className="space-y-3 max-w-md">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-rose-400 bg-rose-950/30 border border-rose-900/40 px-3 py-1 rounded-full">
          <Zap className="w-3.5 h-3.5" />
          <span>Vibe Discovery Engine</span>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl font-bold text-neutral-100 min-h-[44px]">
          {STAGES[currentStageIdx]}
        </h2>

        <p className="text-xs font-mono text-neutral-400">
          Cross-referencing shared passions, hangout synergy, and social frequencies.
        </p>
      </div>
    </div>
  );
};
