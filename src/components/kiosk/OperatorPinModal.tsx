import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound, ArrowRight, X } from 'lucide-react';

interface OperatorPinModalProps {
  isOpen: boolean;
  expectedPin: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const OperatorPinModal: React.FC<OperatorPinModalProps> = ({
  isOpen,
  expectedPin,
  onSuccess,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const next = pin + num;
      setPin(next);
      setError(false);
      if (next === expectedPin) {
        setTimeout(() => {
          setPin('');
          onSuccess();
        }, 150);
      } else if (next.length >= expectedPin.length) {
        setError(true);
        setTimeout(() => setPin(''), 600);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-sm w-full space-y-6 shadow-2xl text-center">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-400 font-mono text-xs uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            <span>Staff Operator Access</span>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <h2 className="font-display text-2xl font-bold text-neutral-100">Enter Operator PIN</h2>
          <p className="text-xs text-neutral-400">
            Protected kiosk management.
          </p>
          <div className="inline-block mt-1 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-300">
            DEVELOPMENT / DEMO ONLY PIN: <span className="font-bold text-neutral-100">{expectedPin}</span>
          </div>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-3 py-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                error
                  ? 'bg-red-500 scale-110 animate-bounce'
                  : pin.length > idx
                  ? 'bg-rose-400 scale-105'
                  : 'bg-neutral-800 border border-neutral-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-400 font-mono flex items-center justify-center gap-1.5 animate-shake">
            <ShieldAlert className="w-3.5 h-3.5" />
            Incorrect PIN. Try again.
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyPress(digit)}
              className="h-16 rounded-2xl bg-neutral-800/80 hover:bg-neutral-700/80 active:bg-rose-500/20 active:scale-95 text-xl font-mono font-bold text-neutral-100 transition-all cursor-pointer flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-neutral-800/40 hover:bg-neutral-700/40 active:scale-95 text-xs font-mono uppercase text-neutral-400 transition-all cursor-pointer flex items-center justify-center"
          >
            Delete
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-2xl bg-neutral-800/80 hover:bg-neutral-700/80 active:bg-rose-500/20 active:scale-95 text-xl font-mono font-bold text-neutral-100 transition-all cursor-pointer flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={() => {
              if (pin === expectedPin) onSuccess();
              else setError(true);
            }}
            className="h-16 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 active:scale-95 text-xs font-mono uppercase font-bold transition-all cursor-pointer flex items-center justify-center"
          >
            Enter
          </button>
        </div>

        <p className="text-[10px] text-neutral-400 font-mono pt-2">
          Production kiosk deployments require remote token authentication.
        </p>
      </div>
    </div>
  );
};
