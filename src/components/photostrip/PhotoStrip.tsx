import React, { useState } from 'react';
import {
  RotateCcw,
  Printer,
  Sparkles,
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Download,
  AlertTriangle,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { CapturedPhoto, MatchResult, VenueConfig } from '../../types';
import { SimulatedQrCode } from '../common/SimulatedQrCode';
import { printQueueService } from '../../services/print/printQueue';
import { PrintIssueModal } from '../kiosk/PrintIssueModal';

interface PhotoStripProps {
  sessionId: string;
  photos: CapturedPhoto[];
  matchResult: MatchResult;
  userConsent: boolean;
  venueConfig: VenueConfig;
  onResetBooth: () => void;
  onBackToReveal?: () => void;
}

export const PhotoStrip: React.FC<PhotoStripProps> = ({
  sessionId,
  photos,
  matchResult,
  userConsent,
  venueConfig,
  onResetBooth,
  onBackToReveal,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);
  const [printFailed, setPrintFailed] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);

  const { candidate, compatibility, matchToken } = matchResult;
  const canShowContact = userConsent && candidate.contactSharingEnabled;

  const handlePrint = async () => {
    setIsPrinting(true);
    setIsFlipped(false); // Unflip to print photographic side A

    try {
      const job = await printQueueService.enqueueJob({
        sessionId,
        payload: {
          photoCount: photos.length,
          hasMatch: !!matchResult,
          matchName: candidate.name,
          token: matchToken,
        },
      });

      // Allow print queue processing
      setTimeout(() => {
        setIsPrinting(false);
        if (job.status === 'FAILED') {
          setPrintFailed(true);
          setShowIssueModal(true);
        } else {
          setPrintSuccess(true);
          setTimeout(() => setPrintSuccess(false), 4000);
        }
      }, 700);
    } catch (e) {
      setIsPrinting(false);
      setPrintFailed(true);
      setShowIssueModal(true);
    }
  };

  const handleSaveDigitalCopy = () => {
    // Generate simple data download
    const link = document.createElement('a');
    link.download = `magicmatch-strip-${sessionId}.jpg`;
    link.href = photos[0]?.dataUrl || '';
    link.click();
    setShowIssueModal(false);
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 flex flex-col items-center justify-center space-y-6 select-none">
      {/* Top Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900 text-rose-300 text-xs font-mono tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>Physical Photo Strip Layout</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-neutral-100">
          Your Commemorative Print
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Side A captures your photo takes. Tap the card or button below to flip to Side B for your match insights.
        </p>
      </div>

      {/* 3D Interactive Flip Container */}
      <div className="relative group perspective-1000 py-2">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative w-[280px] sm:w-[320px] transition-transform duration-700 transform-style-3d cursor-pointer ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* ========================================================
              SIDE A: PHOTOGRAPHIC STRIP (FRONT)
              Optimized for high-contrast thermal/photo paper
             ======================================================== */}
          <div
            id="printable-photo-strip"
            className="w-full bg-[#fbf9f5] text-[#1c1917] p-4 sm:p-5 rounded-sm shadow-2xl space-y-3.5 border border-neutral-300 backface-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Header branding */}
            <div className="border-b border-[#1c1917]/20 pb-2 text-center space-y-0.5">
              <div className="flex items-center justify-center gap-1.5 font-display text-base font-black tracking-widest uppercase">
                <Flame className="w-4 h-4 text-rose-600 fill-rose-600" />
                <span>MAGICMATCH</span>
              </div>
              <p className="text-[9px] font-mono tracking-widest uppercase text-[#78716c]">
                {venueConfig.venueName} • KIOSK STRIP
              </p>
            </div>

            {/* 3 Captured Photos with Classic Photo Border */}
            <div className="space-y-2.5">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative aspect-4/3 bg-neutral-900 border-2 border-white shadow-sm overflow-hidden"
                >
                  <img
                    src={photo.dataUrl}
                    alt={`Take ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-[9px] font-mono text-white/90 rounded-xs">
                    0{index + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* Match Teaser on Side A */}
            <div className="rounded-sm bg-neutral-100 p-2.5 border border-neutral-300 space-y-1 text-center">
              <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-500">
                Tonight's Resonance
              </span>
              <p className="text-xs font-bold font-display uppercase tracking-wide text-neutral-900">
                {candidate.name} ({compatibility.score}% Match)
              </p>
              <p className="text-[9px] font-mono text-rose-600 font-semibold uppercase">
                {compatibility.level}
              </p>
            </div>

            {/* Footer with Session ID & Date */}
            <div className="border-t border-[#1c1917]/20 pt-2 flex items-center justify-between text-[9px] font-mono text-[#78716c]">
              <span>ID: {sessionId}</span>
              <span>{currentDate}</span>
            </div>
          </div>

          {/* ========================================================
              SIDE B: INSIGHTS & CONNECTION RADAR (BACK)
             ======================================================== */}
          <div
            className="absolute inset-0 w-full bg-[#171717] text-neutral-100 p-4 sm:p-5 rounded-sm shadow-2xl space-y-3.5 border border-neutral-700 backface-hidden rotate-y-180 flex flex-col justify-between"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="border-b border-neutral-800 pb-2 text-center space-y-0.5">
                <span className="text-[9px] font-mono tracking-widest uppercase text-rose-400">
                  CONNECTION RADAR REPORT
                </span>
                <h3 className="font-display text-sm font-bold text-white uppercase">
                  {candidate.name}
                </h3>
              </div>

              {/* Bio quote */}
              <div className="p-2.5 rounded-sm bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300 italic">
                "{candidate.bio}"
              </div>

              {/* Shared interests */}
              <div className="space-y-1">
                <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-400">
                  Key Overlaps
                </span>
                <div className="flex flex-wrap gap-1">
                  {compatibility.sharedInterests.map((interest) => (
                    <span
                      key={interest}
                      className="text-[9px] px-1.5 py-0.5 rounded-xs bg-rose-500/20 text-rose-300 font-mono"
                    >
                      #{interest.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Verified contact or private token */}
              <div className="p-2.5 rounded-sm bg-neutral-900 border border-neutral-800 space-y-1 font-mono text-[9px]">
                {canShowContact ? (
                  <>
                    <div className="flex items-center gap-1 text-emerald-400 font-bold uppercase">
                      <ShieldCheck className="w-3 h-3" />
                      <span>DUAL CONSENT CONTACT</span>
                    </div>
                    <p className="text-neutral-300">Instagram: {candidate.instagramHandle}</p>
                    <p className="text-neutral-300">Phone: {candidate.phoneNumber}</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1 text-amber-400 font-bold uppercase">
                      <Lock className="w-3 h-3" />
                      <span>PRIVATE VENUE TOKEN</span>
                    </div>
                    <p className="text-neutral-300 font-bold text-xs">{matchToken}</p>
                    <p className="text-neutral-400 text-[8px]">
                      Present token at lounge desk to connect securely.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* QR code on reverse */}
            <div className="flex flex-col items-center justify-center space-y-1 pt-2 border-t border-neutral-800">
              <SimulatedQrCode token={matchToken} size={84} />
              <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest">
                Scan for mobile digital strip
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Flip Prompt Badge */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          <span>{isFlipped ? 'Flip to Side A (Photos)' : 'Flip to Side B (Match Radar)'}</span>
        </button>
      </div>

      {/* Print Success Confirmation Toast */}
      {printSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Job enqueued in thermal queue! Dispensing physical photo strip.</span>
        </div>
      )}

      {/* Large Touch Action Bar */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-900">
        {onBackToReveal && (
          <button
            onClick={onBackToReveal}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-mono uppercase text-neutral-300 transition-colors cursor-pointer"
          >
            Back to Match Profile
          </button>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-display font-black text-sm text-neutral-950 bg-rose-400 hover:bg-rose-300 active:scale-95 shadow-xl shadow-rose-950/40 transition-all cursor-pointer flex items-center justify-center gap-2.5"
          >
            <Printer className="w-5 h-5" />
            <span>{isPrinting ? 'Printing Strip...' : 'PRINT PHYSICAL PHOTO STRIP'}</span>
          </button>

          <button
            onClick={onResetBooth}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-xs font-mono font-bold uppercase tracking-wider text-neutral-100 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Finish & Leave Booth</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Print Issue Modal for Graceful Error Recovery */}
      <PrintIssueModal
        isOpen={showIssueModal}
        onRetry={() => {
          setShowIssueModal(false);
          handlePrint();
        }}
        onSaveDigitalCopy={handleSaveDigitalCopy}
        onSkip={() => {
          setShowIssueModal(false);
          onResetBooth();
        }}
      />
    </div>
  );
};
