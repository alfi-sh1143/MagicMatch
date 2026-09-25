import React from 'react';
import { ShieldCheck, Lock, EyeOff, Trash2, Clock, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { VenueConfig } from '../../types';

interface PrivacyCenterProps {
  venueConfig: VenueConfig;
}

export const PrivacyCenter: React.FC<PrivacyCenterProps> = ({ venueConfig }) => {
  return (
    <div className="max-w-4xl mx-auto w-full p-6 space-y-8 select-none">
      <div className="border-b border-neutral-800 pb-5">
        <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
          Kiosk Data Protection & Privacy Architecture
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-neutral-100">
          Privacy Center & Lifecycle Policy
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Complete transparent audit of how guest photos, responses, tokens, and contact identifiers are processed and destroyed.
        </p>
      </div>

      {/* Lifecycle Flow Diagram */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <h2 className="font-display text-base font-bold text-neutral-200">
          Session Data Lifecycle (In-Venue Kiosk)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-2xl space-y-1.5 text-center">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">Step 1</span>
            <p className="text-xs font-mono font-bold text-rose-400">1. CAPTURE</p>
            <p className="text-[10px] text-neutral-400">3 poses captured to local memory only.</p>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-2xl space-y-1.5 text-center">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">Step 2</span>
            <p className="text-xs font-mono font-bold text-rose-400">2. PROCESS</p>
            <p className="text-[10px] text-neutral-400">Crop, grain & color graded locally on canvas.</p>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-2xl space-y-1.5 text-center">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">Step 3</span>
            <p className="text-xs font-mono font-bold text-rose-400">3. MATCH</p>
            <p className="text-[10px] text-neutral-400">Deterministic scoring without sending raw data.</p>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-2xl space-y-1.5 text-center">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">Step 4</span>
            <p className="text-xs font-mono font-bold text-rose-400">4. PRINT</p>
            <p className="text-[10px] text-neutral-400">Rendered to thermal printer / canvas.</p>
          </div>

          <div className="bg-neutral-950 border border-emerald-800/40 p-3.5 rounded-2xl space-y-1.5 text-center bg-emerald-950/10">
            <span className="text-[10px] font-mono text-emerald-500 uppercase">Step 5</span>
            <p className="text-xs font-mono font-bold text-emerald-400">5. EXPIRE / DELETE</p>
            <p className="text-[10px] text-emerald-300">
              {venueConfig.photoRetentionHours === 0
                ? 'Immediately erased at session completion.'
                : `Purged after ${venueConfig.photoRetentionHours} hours.`}
            </p>
          </div>
        </div>
      </div>

      {/* Core Privacy Safeguards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-rose-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-display text-sm font-bold text-neutral-100 uppercase tracking-wide">
              Dual-Consent Contact Guard
            </h3>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed font-light">
            Contact information (Instagram handles or phone numbers) is never injected into the DOM or printed unless both parties have opted in. Otherwise, an anonymous temporary token (e.g. MM-X8K4-2F91) is utilized.
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <Clock className="w-5 h-5" />
            <h3 className="font-display text-sm font-bold text-neutral-100 uppercase tracking-wide">
              15-Minute Token Expiration
            </h3>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed font-light">
            Temporary connection tokens expire after 15 minutes. Stale tokens automatically invalidate to prevent unapproved contact or cross-session leakage.
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <Trash2 className="w-5 h-5" />
            <h3 className="font-display text-sm font-bold text-neutral-100 uppercase tracking-wide">
              Zero Persistent Face Biometrics
            </h3>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed font-light">
            The booth does not run facial recognition, identity inference, or sentiment scanning. Visual framing guides are static SVG/CSS overlays rendered purely within the browser client.
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-pink-400">
            <Lock className="w-5 h-5" />
            <h3 className="font-display text-sm font-bold text-neutral-100 uppercase tracking-wide">
              Isolated Touchscreen Kiosk Sandbox
            </h3>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed font-light">
            Operator management views and diagnostic logs are protected behind an operator PIN and corner-gesture lock. Kiosk guests only see the photobooth experience.
          </p>
        </div>
      </div>
    </div>
  );
};
