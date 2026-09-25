import React from 'react';
import { AlertCircle, RefreshCw, Download, ArrowRight, Printer } from 'lucide-react';

interface PrintIssueModalProps {
  isOpen: boolean;
  onRetry: () => void;
  onSaveDigitalCopy: () => void;
  onSkip: () => void;
}

export const PrintIssueModal: React.FC<PrintIssueModalProps> = ({
  isOpen,
  onRetry,
  onSaveDigitalCopy,
  onSkip,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl text-center">
        {/* Warning Icon */}
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-rose-400 uppercase bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
            PRINT ISSUE
          </span>
          <h2 className="font-display text-2xl font-bold text-neutral-100">
            The photo strip could not be printed.
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Don't worry! Your high-resolution digital strip is fully preserved and can be saved or sent immediately.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={onRetry}
            className="w-full py-4 rounded-2xl font-display font-bold text-sm text-neutral-950 bg-rose-400 hover:bg-rose-300 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>RETRY PRINT</span>
          </button>

          <button
            onClick={onSaveDigitalCopy}
            className="w-full py-3.5 rounded-2xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Save Digital Strip</span>
          </button>

          <button
            onClick={onSkip}
            className="w-full py-3 rounded-2xl border border-neutral-800 bg-transparent hover:bg-neutral-800/40 text-neutral-400 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
          >
            Skip & Complete
          </button>
        </div>
      </div>
    </div>
  );
};
