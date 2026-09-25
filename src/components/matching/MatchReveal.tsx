import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Printer,
  Flag,
  Sparkles,
  QrCode,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MatchResult, VenueConfig } from '../../types';
import { SimulatedQrCode } from '../common/SimulatedQrCode';
import { TOKEN_EXPIRATION_MS } from '../../services/matching/tokens';

interface MatchRevealProps {
  matchResult: MatchResult;
  userConsent: boolean;
  venueConfig: VenueConfig;
  onViewStrip: () => void;
  onTryAnother: () => void;
  onBlockMatch: (candidateId: string) => void;
  onReportMatch: (candidateId: string, reason: string) => void;
}

export const MatchReveal: React.FC<MatchRevealProps> = ({
  matchResult,
  userConsent,
  venueConfig,
  onViewStrip,
  onTryAnother,
  onBlockMatch,
  onReportMatch,
}) => {
  const { candidate, compatibility, matchToken } = matchResult;
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showResearchBreakdown, setShowResearchBreakdown] = useState(false);
  const [reportReason, setReportReason] = useState('Not a good fit for this venue');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Connection token countdown (15 minutes)
  const tokenExpiresAt = matchResult.connectionTokenData?.expiresAt || Date.now() + TOKEN_EXPIRATION_MS;
  const [secondsRemaining, setSecondsRemaining] = useState(
    Math.max(0, Math.floor((tokenExpiresAt - Date.now()) / 1000))
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((tokenExpiresAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, [tokenExpiresAt]);

  const isTokenExpired = secondsRemaining <= 0;

  // DUAL CONSENT VERIFICATION:
  // Contact details only show if BOTH the current user consented AND the candidate consented.
  const canRevealContact = userConsent && candidate.contactSharingEnabled;

  const handleReport = () => {
    onReportMatch(candidate.id, reportReason);
    setReportSuccess(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSuccess(false);
    }, 1200);
  };

  const minutesPart = Math.floor(secondsRemaining / 60);
  const secondsPart = secondsRemaining % 60;
  const formattedTimeRemaining = `${minutesPart}:${secondsPart < 10 ? '0' : ''}${secondsPart}`;

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-6 flex flex-col items-center justify-center space-y-6 select-none">
      {/* Top Header Badge */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-mono tracking-widest uppercase">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>Vibe Radar Match Found</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-neutral-100 tracking-tight">
          Meet Your Venue Resonance
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-md">
          Based on your shared interests, social battery balance, and vibe preferences.
        </p>
      </div>

      {/* Main Connection Profile Card */}
      <div className="w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar representation with SVG geometric art */}
          <div className="flex flex-col items-center space-y-2 shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-neutral-800 border-2 border-rose-500/30 p-2 shadow-inner flex items-center justify-center relative">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="#1c1917" />
                <circle cx="50" cy="40" r="20" fill="#f43f5e" fillOpacity="0.4" />
                <path d="M 22 84 C 24 64, 76 64, 78 84" fill="#fb7185" />
                <circle cx="50" cy="40" r="14" fill="#fda4af" />
              </svg>
              <div className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-neutral-950 border border-neutral-700 text-[10px] font-mono text-neutral-400">
                {candidate.city}
              </div>
            </div>
            <span className="text-xs font-mono text-neutral-400 font-medium">{candidate.ageRange}</span>
          </div>

          {/* Profile details */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-neutral-100">
                  {candidate.name}
                </h2>
                <p className="text-xs text-rose-400 font-mono tracking-wider">{candidate.displayName}</p>
              </div>

              {/* Compatibility Score Pill */}
              <div className="inline-flex items-center gap-2 self-center md:self-auto px-4 py-2 rounded-2xl bg-rose-500/20 border border-rose-500/40">
                <span className="font-mono text-2xl font-black text-rose-300">
                  {compatibility.score}%
                </span>
                <span className="text-xs text-rose-200 font-medium">{compatibility.level}</span>
              </div>
            </div>

            <p className="text-sm text-neutral-300 font-light leading-relaxed italic border-l-2 border-rose-500/30 pl-3">
              "{candidate.bio}"
            </p>

            {/* Interest pills */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider">Interest Highlights</p>
              <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                {candidate.interests.map((tag) => (
                  <span
                    key={tag}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-mono ${
                      compatibility.sharedInterests.includes(tag)
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-semibold'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                    }`}
                  >
                    #{tag.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Explainable Connection Reasons */}
        <div className="rounded-2xl bg-neutral-950/70 border border-neutral-800 p-4 space-y-2">
          <p className="text-xs font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
            Why You Two Resonate Tonight
          </p>
          <ul className="text-xs text-neutral-300 space-y-1.5 list-disc list-inside">
            {compatibility.reasons.map((reason, i) => (
              <li key={i} className="leading-relaxed">
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Optional Research Mode Breakdown for Operator Testing */}
        {venueConfig.researchModeEnabled && compatibility.components && (
          <div className="rounded-2xl bg-neutral-950 border border-purple-500/30 p-4 space-y-3 font-mono text-xs">
            <button
              onClick={() => setShowResearchBreakdown(!showResearchBreakdown)}
              className="w-full flex items-center justify-between text-purple-400 font-bold uppercase tracking-wider cursor-pointer"
            >
              <span>🔬 Research Mode Breakdown (Engine {compatibility.engineVersion})</span>
              {showResearchBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showResearchBreakdown && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-neutral-800">
                <div className="bg-neutral-900 p-2 rounded-lg">
                  <span className="text-neutral-500 text-[10px]">Interests (30%):</span>
                  <p className="text-neutral-200 font-bold">{compatibility.components.sharedInterestsScore} pts</p>
                </div>
                <div className="bg-neutral-900 p-2 rounded-lg">
                  <span className="text-neutral-500 text-[10px]">Traits (20%):</span>
                  <p className="text-neutral-200 font-bold">{compatibility.components.traitScore} pts</p>
                </div>
                <div className="bg-neutral-900 p-2 rounded-lg">
                  <span className="text-neutral-500 text-[10px]">Hangout (15%):</span>
                  <p className="text-neutral-200 font-bold">{compatibility.components.activityScore} pts</p>
                </div>
                <div className="bg-neutral-900 p-2 rounded-lg">
                  <span className="text-neutral-500 text-[10px]">Intent (15%):</span>
                  <p className="text-neutral-200 font-bold">{compatibility.components.intentScore} pts</p>
                </div>
                <div className="bg-neutral-900 p-2 rounded-lg">
                  <span className="text-neutral-500 text-[10px]">Battery Delta (10%):</span>
                  <p className="text-neutral-200 font-bold">{compatibility.components.batteryScore} pts</p>
                </div>
                <div className="bg-neutral-900 p-2 rounded-lg">
                  <span className="text-neutral-500 text-[10px]">Entropy (10%):</span>
                  <p className="text-neutral-200 font-bold">{compatibility.components.antiStagnationScore} pts</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Safety & Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-400">Candidate #{candidate.id}</span>
            <span className="w-1 h-1 rounded-full bg-neutral-700" />
            <span className="text-xs font-mono text-neutral-400">
              {candidate.contactSharingEnabled ? 'Contact Sharing Enabled' : 'Private Profile'}
            </span>
          </div>

          <button
            onClick={() => setShowReportModal(true)}
            className="text-xs font-mono text-neutral-400 hover:text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer py-1"
          >
            <Flag className="w-3.5 h-3.5" />
            Report / Block Candidate
          </button>
        </div>
      </div>

      {/* Connection QR & Token Card */}
      <div className="w-full bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <SimulatedQrCode token={matchToken} size={110} />
            {isTokenExpired && (
              <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-xs rounded-xl flex items-center justify-center text-[10px] font-mono text-red-400 font-bold uppercase text-center p-1">
                Expired
              </div>
            )}
          </div>

          <div className="space-y-1.5 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest">
                Connect With Your Match
              </span>
              <div className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{isTokenExpired ? 'Expired' : `${formattedTimeRemaining} left`}</span>
              </div>
            </div>

            <h3 className="font-mono text-xl sm:text-2xl font-black text-neutral-100 tracking-wider">
              {matchToken}
            </h3>

            <p className="text-xs text-neutral-400 max-w-sm">
              {canRevealContact
                ? 'Scan or present token at the venue lounge desk to connect.'
                : 'Private token connection: Scan to exchange messages via venue host without exposing numbers.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <a
            href={`#/connect/${matchToken}`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 px-4 py-3 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-mono uppercase tracking-wider text-rose-300 transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Mobile Portal</span>
          </a>

          <button
            onClick={() => setShowContactModal(true)}
            className="shrink-0 px-5 py-3 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-mono uppercase tracking-wider text-neutral-200 transition-colors cursor-pointer flex items-center gap-2"
          >
            <HeartHandshake className="w-4 h-4 text-rose-400" />
            <span>Consent Details</span>
          </button>
        </div>
      </div>

      {/* Bottom Large Touch Action Bar */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          onClick={onTryAnother}
          className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Another Candidate</span>
        </button>

        <button
          onClick={onViewStrip}
          className="w-full sm:w-auto px-10 py-5 rounded-2xl font-display font-black text-base text-neutral-950 bg-gradient-to-r from-rose-400 via-rose-300 to-amber-300 hover:brightness-110 active:scale-95 shadow-xl shadow-rose-950/40 transition-all cursor-pointer flex items-center justify-center gap-3 group"
        >
          <Printer className="w-5 h-5" />
          <span>VIEW & PRINT PHOTO STRIP</span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Contact Details Modal (Dual Consent Enforced) */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-neutral-100 flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-rose-400" />
                Connection Consent Status
              </h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-neutral-400 hover:text-white text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {canRevealContact ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold font-mono">
                    <ShieldCheck className="w-4 h-4" />
                    DUAL-CONSENT VERIFIED
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Both you and {candidate.name} agreed to share contact info with compatible booth matches.
                  </p>
                </div>

                <div className="space-y-2.5 rounded-2xl bg-neutral-950 p-4 border border-neutral-800 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Instagram:</span>
                    <span className="text-rose-400 font-semibold">{candidate.instagramHandle || '@demo_match'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Phone (Demo):</span>
                    <span className="text-neutral-200">{candidate.phoneNumber || '+1 (555) 019-2831'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Secure Token:</span>
                    <span className="text-neutral-400">{matchToken}</span>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400 font-mono leading-relaxed">
                  This contact information is also printed on the reverse side of your physical photo strip.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold font-mono">
                    <ShieldAlert className="w-4 h-4" />
                    PRIVATE CONNECTION (DUAL CONSENT REQUIRED)
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {!userConsent && !candidate.contactSharingEnabled
                      ? 'Both parties opted to keep contact information private.'
                      : !userConsent
                      ? 'You opted out of sharing contact information.'
                      : `${candidate.name} opted to keep their direct contact information private.`}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2 font-mono text-xs">
                  <span className="text-neutral-400 text-[11px]">Anonymous Token:</span>
                  <p className="text-sm font-bold text-neutral-100">{matchToken}</p>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    You can show this token to the venue lounge coordinator or scan at the connection table to exchange messages without revealing personal numbers.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowContactModal(false)}
              className="w-full py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-mono uppercase text-neutral-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Report / Block Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-neutral-100 flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-400" />
              Report or Block Candidate
            </h3>

            {reportSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-400 text-xs font-mono">
                ✓ Candidate reported and permanently blocked for your session. Evaluating new match...
              </div>
            ) : (
              <>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Blocking removes {candidate.name} from your pool immediately and replaces them with an alternative match.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-neutral-400 uppercase">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-200 font-mono outline-hidden focus:border-rose-500"
                  >
                    <option value="Not a good fit for this venue">Not a good fit for this venue</option>
                    <option value="Inappropriate bio / content">Inappropriate bio / content</option>
                    <option value="I know this person and prefer not to match">I know this person and prefer not to match</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 py-3 rounded-xl border border-neutral-800 text-xs font-mono uppercase text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReport}
                    className="flex-1 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-xs font-mono uppercase font-bold text-red-300"
                  >
                    Block Candidate
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
