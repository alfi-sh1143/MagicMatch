import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  HeartHandshake,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Phone,
  Instagram,
  Mail,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Flag,
  Lock,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { ConnectionVerificationResult } from '../../types';
import { getRepository } from '../../services/repository';

interface ConnectionPageViewProps {
  initialToken?: string;
  onNavigateHome?: () => void;
}

export const ConnectionPageView: React.FC<ConnectionPageViewProps> = ({
  initialToken = '',
  onNavigateHome,
}) => {
  const [tokenInput, setTokenInput] = useState<string>(initialToken);
  const [activeToken, setActiveToken] = useState<string>(initialToken);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ConnectionVerificationResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [guestConsentAgreed, setGuestConsentAgreed] = useState<boolean>(false);
  const [remainingSec, setRemainingSec] = useState<number>(15 * 60);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);

  const repo = getRepository();

  const handleResolve = useCallback(
    async (tokenToVerify: string) => {
      const clean = tokenToVerify.trim().toUpperCase();
      if (!clean) return;

      setIsLoading(true);
      try {
        const res = await repo.resolveConnection(clean);
        setResult(res);

        if (res.expiresAt) {
          const diff = Math.max(0, Math.floor((res.expiresAt - Date.now()) / 1000));
          setRemainingSec(diff);
        }
        if (res.consents?.guestConsent) {
          setGuestConsentAgreed(true);
        }
      } catch (err) {
        console.error('Resolution error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [repo]
  );

  useEffect(() => {
    if (activeToken) {
      handleResolve(activeToken);
    }
  }, [activeToken, handleResolve]);

  // Visual countdown timer synced to server expiresAt
  useEffect(() => {
    if (!result?.expiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((result.expiresAt! - Date.now()) / 1000));
      setRemainingSec(diff);
      if (diff <= 0 && result.status !== 'EXPIRED') {
        handleResolve(activeToken);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [result, activeToken, handleResolve]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmConsent = async () => {
    setIsLoading(true);
    try {
      const res = await repo.submitConsent(activeToken, true);
      setResult(res);
      setGuestConsentAgreed(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (window.confirm('Are you sure you want to revoke this connection? Contact details will be immediately concealed.')) {
      setIsLoading(true);
      try {
        await repo.revokeConnection(activeToken, 'guest');
        await handleResolve(activeToken);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleReport = async (reason: string) => {
    if (result?.profile?.id) {
      await repo.reportProfile(result.profile.id, reason);
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        handleResolve(activeToken);
      }, 1500);
    }
  };

  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  const formattedCountdown = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Mobile Header Branding */}
        <header className="flex items-center justify-between border-b border-neutral-900 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center shadow-lg shadow-rose-950/50">
              <Sparkles className="w-4 h-4 text-neutral-950" />
            </div>
            <div>
              <span className="font-display font-black tracking-tight text-base text-neutral-100">
                MAGIC<span className="text-rose-400">MATCH</span>
              </span>
              <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                Secure Mobile Connect
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="text-xs font-mono text-neutral-400 hover:text-neutral-200 transition-colors py-1 px-2.5 rounded-lg border border-neutral-800 bg-neutral-900 cursor-pointer"
              >
                Booth Kiosk
              </button>
            )}
          </div>
        </header>

        {/* Hero Pitch */}
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-400">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Connection Portal</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100">
            Someone thought your vibes might click.
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            You scanned a MagicMatch temporary token. Contact details are strictly protected by server-side dual consent.
          </p>
        </div>

        {/* Token Search Bar (if not provided in URL or invalid) */}
        {(!activeToken || result?.status === 'INVALID_TOKEN') && (
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="space-y-1">
              <label className="text-xs font-mono text-neutral-300 font-bold uppercase tracking-wider block">
                Enter Connection Token
              </label>
              <p className="text-xs text-neutral-500">
                Type the 8-character token printed on your photo strip (e.g. MM-9EY4-JWW4).
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                placeholder="MM-XXXX-XXXX"
                className="flex-1 bg-neutral-950 border border-neutral-700 focus:border-rose-400 rounded-xl px-4 py-3 font-mono text-sm tracking-wider text-neutral-100 uppercase outline-none transition-colors"
              />
              <button
                onClick={() => setActiveToken(tokenInput)}
                disabled={isLoading || !tokenInput.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-400 hover:from-rose-400 hover:to-rose-300 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                <span>Look Up</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {result?.status === 'INVALID_TOKEN' && (
              <div className="flex items-center gap-2 text-xs font-mono text-red-400 bg-red-950/40 border border-red-800/40 p-3 rounded-xl">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Token not found. Verify the code on your strip.</span>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="p-8 text-center bg-neutral-900/50 border border-neutral-800 rounded-2xl space-y-3">
            <div className="w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-neutral-400">Authorizing connection token with backend...</p>
          </div>
        )}

        {/* Active Connection & Results */}
        {!isLoading && result && (
          <div className="space-y-4">
            {/* Token Badge & Expiration Indicator */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                  Active Token
                </span>
                <span className="font-mono text-sm font-bold text-neutral-200 tracking-wider">
                  {activeToken}
                </span>
              </div>

              {result.expiresAt && result.status !== 'EXPIRED' && (
                <div className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800 font-mono text-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-neutral-300 font-bold">{formattedCountdown}</span>
                  <span className="text-neutral-500 text-[10px]">remaining</span>
                </div>
              )}
            </div>

            {/* CASE 1: AUTHORIZED (Mutual Consent Satisfied!) */}
            {result.authorized && result.profile && (
              <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-rose-500/30 rounded-3xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xl font-display font-black text-rose-400">
                      {result.profile.displayName.substring(0, 1)}
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-bold text-neutral-100">
                        {result.profile.displayName}
                      </h2>
                      <p className="text-xs text-neutral-400 font-mono">
                        {result.profile.city}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>MUTUAL CONSENT</span>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed italic bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800">
                  "{result.profile.bio}"
                </p>

                {/* Contact Channels */}
                <div className="space-y-3 pt-2">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                    Unlocked Contact Channels
                  </span>

                  {result.profile.instagramHandle && (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                          <Instagram className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-neutral-500 block">Instagram</span>
                          <span className="text-xs font-mono font-bold text-neutral-200">
                            {result.profile.instagramHandle}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(result.profile?.instagramHandle || '', 'ig')}
                          className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition-colors cursor-pointer"
                          title="Copy Instagram"
                        >
                          {copiedField === 'ig' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={`https://instagram.com/${result.profile.instagramHandle.replace('@', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {result.profile.phoneNumber && (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-neutral-500 block">Phone / SMS</span>
                          <span className="text-xs font-mono font-bold text-neutral-200">
                            {result.profile.phoneNumber}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(result.profile?.phoneNumber || '', 'phone')}
                          className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition-colors cursor-pointer"
                          title="Copy Phone"
                        >
                          {copiedField === 'phone' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={`tel:${result.profile.phoneNumber}`}
                          className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Revoke Control */}
                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="text-[11px] font-mono text-neutral-500 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Flag className="w-3 h-3" />
                    <span>Report / Block</span>
                  </button>

                  <button
                    onClick={handleRevoke}
                    className="text-[11px] font-mono text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Revoke My Consent
                  </button>
                </div>
              </div>
            )}

            {/* CASE 2: PENDING DUAL CONSENT */}
            {!result.authorized && result.status === 'PENDING_DUAL_CONSENT' && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-neutral-100">
                      Private Connection
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono">
                      Candidate: {result.teaser?.displayName || 'Matched Guest'}
                    </p>
                  </div>
                </div>

                <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2 text-xs text-neutral-300">
                  <p className="font-bold text-neutral-200">
                    Dual Consent Protocol Active
                  </p>
                  <p className="text-neutral-400 leading-relaxed">
                    This candidate has authorized mutual contact disclosure. To unlock each other's connection details, confirm your consent below.
                  </p>
                </div>

                {result.teaser?.interests && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                      Shared Vibe Tags
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.teaser.interests.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-rose-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-neutral-800 space-y-3">
                  <button
                    onClick={handleConfirmConsent}
                    disabled={isLoading}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-400 to-amber-300 text-neutral-950 font-display font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <HeartHandshake className="w-4 h-4" />
                    <span>Confirm & View Connection</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-[11px] text-center text-neutral-500 font-mono">
                    You can revoke consent at any time. Phone numbers are never stored in plain text.
                  </p>
                </div>
              </div>
            )}

            {/* CASE 3: EXPIRED */}
            {!result.authorized && result.status === 'EXPIRED' && (
              <div className="bg-neutral-900 border border-red-900/40 rounded-3xl p-6 sm:p-8 space-y-4 text-center shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-800/60 text-red-400 flex items-center justify-center mx-auto">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-neutral-100">
                  Connection Expired
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
                  For your privacy and security, MagicMatch temporary connection tokens automatically expire 15 minutes after session creation.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveToken('')}
                    className="px-6 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-xs font-mono text-neutral-300 transition-colors cursor-pointer"
                  >
                    Try Another Token
                  </button>
                </div>
              </div>
            )}

            {/* CASE 4: REVOKED */}
            {!result.authorized && result.status === 'REVOKED' && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center space-y-3 shadow-2xl">
                <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto" />
                <h3 className="font-display text-lg font-bold text-neutral-100">
                  Connection Revoked
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
                  This connection was cancelled by either party or closed by the host venue.
                </p>
              </div>
            )}

            {/* CASE 5: PROFILE UNAVAILABLE */}
            {!result.authorized && result.status === 'PROFILE_UNAVAILABLE' && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center space-y-3 shadow-2xl">
                <AlertTriangle className="w-10 h-10 text-neutral-500 mx-auto" />
                <h3 className="font-display text-lg font-bold text-neutral-100">
                  Profile Paused
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
                  This candidate has paused their profile or is no longer participating in booth discovery.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Safety & Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
              <h3 className="font-display text-base font-bold text-neutral-100 flex items-center gap-2">
                <Flag className="w-4 h-4 text-red-400" />
                Report Profile
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                If this user provided inappropriate contact details or made you uncomfortable, report them immediately.
              </p>

              {reportSuccess ? (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-xs font-mono text-emerald-400 text-center">
                  Report submitted. Profile blocked.
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleReport('Inappropriate contact info')}
                    className="w-full py-2.5 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-left text-neutral-200 transition-colors cursor-pointer"
                  >
                    Inappropriate contact info
                  </button>
                  <button
                    onClick={() => handleReport('Impersonation / fake profile')}
                    className="w-full py-2.5 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-left text-neutral-200 transition-colors cursor-pointer"
                  >
                    Impersonation / fake profile
                  </button>
                  <button
                    onClick={() => handleReport('Harassment or spam')}
                    className="w-full py-2.5 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-left text-neutral-200 transition-colors cursor-pointer"
                  >
                    Harassment or spam
                  </button>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="w-full py-2 text-xs font-mono text-neutral-500 hover:text-neutral-400 cursor-pointer pt-2"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto pt-6 text-center text-[10px] font-mono text-neutral-600 border-t border-neutral-900 space-y-1">
        <p>MagicMatch Booth • Zero-Knowledge Dual Consent</p>
        <p>No phone numbers or emails are stored in cleartext.</p>
      </footer>
    </div>
  );
};
