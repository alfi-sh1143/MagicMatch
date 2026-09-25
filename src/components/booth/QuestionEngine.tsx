import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Sparkles, BatteryCharging, BatteryMedium, BatteryFull } from 'lucide-react';
import { BOOTH_QUESTIONS } from '../../data/questions';
import { Question } from '../../types';

interface QuestionEngineProps {
  onComplete: (answers: Record<string, any>) => void;
  onBackToStart: () => void;
  initialAnswers?: Record<string, any>;
}

export const QuestionEngine: React.FC<QuestionEngineProps> = ({
  onComplete,
  onBackToStart,
  initialAnswers,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    return (
      initialAnswers || {
        energy: '',
        interests: [],
        hangout: '',
        social_energy: 50,
        intent: [],
        contact_consent: false,
      }
    );
  });

  const currentQuestion: Question = BOOTH_QUESTIONS[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / BOOTH_QUESTIONS.length) * 100);

  const handleSingleSelect = (val: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: val }));
  };

  const handleTagToggle = (tagId: string, maxSelections: number = 3) => {
    setAnswers((prev) => {
      const currentList: string[] = prev[currentQuestion.id] || [];
      if (currentList.includes(tagId)) {
        return { ...prev, [currentQuestion.id]: currentList.filter((t) => t !== tagId) };
      }
      if (currentList.length >= maxSelections) {
        return prev;
      }
      return { ...prev, [currentQuestion.id]: [...currentList, tagId] };
    });
  };

  const handleMultiSelectToggle = (optionId: string) => {
    setAnswers((prev) => {
      const currentList: string[] = prev[currentQuestion.id] || [];
      if (currentList.includes(optionId)) {
        return { ...prev, [currentQuestion.id]: currentList.filter((t) => t !== optionId) };
      }
      return { ...prev, [currentQuestion.id]: [...currentList, optionId] };
    });
  };

  const isStepValid = (): boolean => {
    const val = answers[currentQuestion.id];
    if (currentQuestion.type === 'cards' || currentQuestion.type === 'single') {
      return !!val;
    }
    if (currentQuestion.type === 'tags') {
      return Array.isArray(val) && val.length > 0;
    }
    if (currentQuestion.type === 'multiselect') {
      return Array.isArray(val) && val.length > 0;
    }
    if (currentQuestion.type === 'slider') {
      return typeof val === 'number';
    }
    if (currentQuestion.type === 'consent') {
      return true; // Consent can be false or true (optional opt-in)
    }
    return true;
  };

  const handleNext = () => {
    if (!isStepValid()) return;
    if (currentIndex < BOOTH_QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onComplete(answers);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      onBackToStart();
    }
  };

  // Helper for social battery label
  const getBatteryDescription = (val: number) => {
    if (val < 25) return 'Solo sanctuary · Quiet, low stimulation, observing';
    if (val < 50) return 'Gentle conversation · Intimate 1-on-1 coffee vibe';
    if (val < 75) return 'Vibrant social mode · Ready for jokes, stories, and exploring';
    return 'Full voltage party energy · Spontaneous, electric, open to anything';
  };

  return (
    <div className="flex flex-col justify-between min-h-[calc(100vh-64px)] max-w-3xl mx-auto px-4 py-8">
      {/* Top Header: Progress and Step Count */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="uppercase">Vibe Check</span>
            <span aria-hidden="true">·</span>
            <span>Step {currentIndex + 1} of {BOOTH_QUESTIONS.length}</span>
          </div>
          <span>{progressPercent}% Complete</span>
        </div>

        {/* Visual Progress Bar */}
        <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Titles */}
        <div className="pt-4 space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-neutral-100 text-balance">
            {currentQuestion.title}
          </h2>
          <p className="text-sm text-neutral-400">{currentQuestion.subtitle}</p>
        </div>
      </div>

      {/* Center: Dynamic Question Control Body */}
      <div className="my-8">
        {/* TYPE 1: CARDS (Single selection) */}
        {currentQuestion.type === 'cards' && currentQuestion.options && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQuestion.options.map((opt) => {
              const selected = answers[currentQuestion.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSingleSelect(opt.id)}
                  className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                    selected
                      ? 'border-rose-400 bg-rose-950/20 shadow-md ring-1 ring-rose-400/50'
                      : 'border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-neutral-100 text-base">{opt.label}</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        selected
                          ? 'border-rose-400 bg-rose-400 text-neutral-950'
                          : 'border-neutral-700 bg-neutral-900'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  {opt.description && (
                    <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                      {opt.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* TYPE 2: TAGS (Pick up to 3) */}
        {currentQuestion.type === 'tags' && currentQuestion.options && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span>Selected: {(answers[currentQuestion.id] || []).length} / 3</span>
              {(answers[currentQuestion.id] || []).length === 3 && (
                <span className="text-rose-400">Target reached!</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2.5">
              {currentQuestion.options.map((tag) => {
                const selected = (answers[currentQuestion.id] || []).includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id, currentQuestion.maxSelections || 3)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer whitespace-nowrap ${
                      selected
                        ? 'border-rose-400 bg-rose-500/20 text-rose-200 shadow-sm'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <span>{tag.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TYPE 3: SLIDER (Social Battery) */}
        {currentQuestion.type === 'slider' && (
          <div className="space-y-8 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {answers.social_energy < 40 ? (
                  <BatteryMedium className="w-8 h-8 text-amber-400" />
                ) : (
                  <BatteryFull className="w-8 h-8 text-emerald-400" />
                )}
                <div>
                  <div className="font-display text-3xl font-bold text-neutral-100 tabular-nums">
                    {answers.social_energy ?? 50}%
                  </div>
                  <div className="text-xs text-neutral-400 uppercase font-mono">Battery Gauge</div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono text-rose-400 bg-rose-950/40 border border-rose-800/40 px-3 py-1 rounded-full">
                  {answers.social_energy >= 70 ? 'High Output' : answers.social_energy >= 40 ? 'Balanced' : 'Quiet Sanctuary'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="range"
                min={currentQuestion.min || 0}
                max={currentQuestion.max || 100}
                step={currentQuestion.step || 5}
                value={answers.social_energy ?? 50}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, social_energy: parseInt(e.target.value, 10) }))
                }
                className="w-full h-3 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
              />
              <div className="flex justify-between text-xs font-mono text-neutral-400">
                <span>{currentQuestion.minLabel}</span>
                <span>{currentQuestion.maxLabel}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
              <p className="text-xs text-neutral-300 font-mono">
                {getBatteryDescription(answers.social_energy ?? 50)}
              </p>
            </div>
          </div>
        )}

        {/* TYPE 4: MULTISELECT (Intentions) */}
        {currentQuestion.type === 'multiselect' && currentQuestion.options && (
          <div className="space-y-3">
            {currentQuestion.options.map((opt) => {
              const selected = (answers[currentQuestion.id] || []).includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => handleMultiSelectToggle(opt.id)}
                  className={`w-full p-4 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                    selected
                      ? 'border-rose-400 bg-rose-950/20 ring-1 ring-rose-400/50'
                      : 'border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 hover:border-neutral-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-neutral-100 text-sm sm:text-base">
                      {opt.label}
                    </span>
                    {opt.description && (
                      <p className="text-xs text-neutral-400">{opt.description}</p>
                    )}
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ml-4 transition-colors ${
                      selected
                        ? 'border-rose-400 bg-rose-400 text-neutral-950'
                        : 'border-neutral-700 bg-neutral-900'
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* TYPE 5: CONSENT TOGGLE */}
        {currentQuestion.type === 'consent' && (
          <div className="space-y-6 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-semibold text-neutral-100 text-base">
                  Dual-Consent Privacy Rule
                </h3>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {currentQuestion.helperText}
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-800">
              <label className="flex items-start gap-4 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!answers.contact_consent}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, contact_consent: e.target.checked }))
                  }
                  className="mt-1 w-5 h-5 rounded border-neutral-700 bg-neutral-900 text-rose-500 focus:ring-rose-500 cursor-pointer"
                />
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-neutral-100">
                    I'm okay with sharing my demo contact details with a compatible match.
                  </span>
                  <p className="text-xs text-neutral-400">
                    If left unchecked, your printed strip will not reveal your contact handle, and your matched profile will remain strictly anonymous.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav: Back & Next Button */}
      <div className="pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={handlePrev}
          className="w-full sm:w-auto px-5 py-3 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-sm font-medium text-neutral-300 transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentIndex === 0 ? 'Exit Booth' : 'Previous'}</span>
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
          {!isStepValid() && (
            <span className="text-xs font-mono text-amber-400/90 text-center sm:text-right">
              {currentQuestion.type === 'cards' || currentQuestion.type === 'single'
                ? 'Select an option above to continue'
                : currentQuestion.type === 'tags'
                ? 'Select at least 1 interest tag'
                : currentQuestion.type === 'multiselect'
                ? 'Select at least 1 intention'
                : 'Complete selection to proceed'}
            </span>
          )}

          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            aria-disabled={!isStepValid()}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              isStepValid()
                ? 'bg-rose-400 text-neutral-950 hover:bg-rose-300 active:scale-95 shadow-lg shadow-rose-950/40'
                : 'bg-neutral-800/80 text-neutral-500 cursor-not-allowed opacity-60'
            }`}
          >
            <span>{currentIndex === BOOTH_QUESTIONS.length - 1 ? 'Go to Camera' : 'Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
