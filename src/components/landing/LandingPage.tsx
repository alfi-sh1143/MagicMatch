import React from 'react';
import { Camera, Sparkles, ShieldCheck, Printer, ArrowRight, Compass, HeartHandshake, EyeOff } from 'lucide-react';
import heroKioskImg from '../../assets/images/hero_booth_kiosk_1790275625997.jpg';
import photoStripSampleImg from '../../assets/images/booth_photostrip_sample_1790275639935.jpg';
import venueLoungeImg from '../../assets/images/venue_social_lounge_1790275652323.jpg';

interface LandingPageProps {
  onStartBooth: () => void;
  onOpenDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartBooth,
  onOpenDashboard,
}) => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-neutral-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-950/20 via-neutral-950/60 to-neutral-950 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-rose-400">
                <span>Physical Photobooth</span>
                <span aria-hidden="true">·</span>
                <span>Deterministic Compatibility</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-100 max-w-2xl text-balance">
                Skip the swipe. <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-rose-400 to-amber-200">
                  Take the picture.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-neutral-300 max-w-xl font-normal leading-relaxed">
                MagicMatch Booth turns personality vibes into tactile instant photo strips. Walk up, answer five quick prompts, strike a pose, and discover someone in your city on your exact wavelength.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={onStartBooth}
                  className="px-6 py-3.5 text-base font-semibold text-neutral-950 bg-rose-400 hover:bg-rose-300 rounded-xl shadow-lg shadow-rose-950/40 transition-all cursor-pointer flex items-center justify-center gap-2.5 group"
                >
                  <Sparkles className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span>Start Live Booth Experience</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                <a
                  href="#how-it-works"
                  className="px-6 py-3.5 text-base font-medium text-neutral-300 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 rounded-xl transition-colors flex items-center justify-center gap-2 text-center"
                >
                  <span>See How It Works</span>
                </a>
              </div>

              <div className="pt-4 flex items-center gap-6 text-xs text-neutral-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Zero Facial Profiling
                </span>
                <span className="flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-neutral-400" />
                  Instant Physical Strip
                </span>
                <span className="flex items-center gap-1.5">
                  <EyeOff className="w-4 h-4 text-amber-400" />
                  Strict Contact Consent
                </span>
              </div>
            </div>

            {/* Right Column: Physical Kiosk Visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-2xl">
                <img
                  src={heroKioskImg}
                  alt="Futuristic MagicMatch Photo Booth Kiosk Installation"
                  className="w-full h-auto aspect-[16/10] object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-transparent to-transparent flex items-end p-6">
                  <div className="space-y-1">
                    <p className="text-xs uppercase font-mono tracking-wider text-rose-300">
                      Live Hardware Spec
                    </p>
                    <p className="text-sm font-semibold text-neutral-200">
                      Touch Kiosk · High-CRI Ring Light · Thermal Strip Dispenser
                    </p>
                  </div>
                </div>
              </div>

              {/* Sample Floating Strip Preview */}
              <div className="hidden sm:block absolute -bottom-6 -left-6 max-w-[210px] rounded-xl overflow-hidden border border-neutral-700 bg-neutral-950 p-2 shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform">
                <img
                  src={photoStripSampleImg}
                  alt="Sample printed photo strip"
                  className="w-full h-auto rounded object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="mt-2 text-center">
                  <p className="font-mono text-[10px] text-neutral-400 uppercase">
                    Sample Match Strip
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Mechanism: How It Works */}
      <section id="how-it-works" className="py-20 border-b border-neutral-900 bg-neutral-950/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-rose-400">
              Three-Step Interaction
            </h2>
            <p className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-neutral-100">
              From walk-up to printed vibe in under 2 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 flex flex-col justify-between hover:border-neutral-700 transition-colors">
              <div className="space-y-4">
                <span className="font-mono text-3xl font-bold text-rose-400">01</span>
                <h3 className="font-display text-xl font-bold text-neutral-100">Answer Fast Prompts</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  No 100-question surveys. Five rapid questions reveal your current social battery, creative obsessions, and dream first hangout.
                </p>
              </div>
              <div className="pt-6 text-xs font-mono text-neutral-400">
                <span>Avg. time: 45 seconds</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 flex flex-col justify-between hover:border-neutral-700 transition-colors">
              <div className="space-y-4">
                <span className="font-mono text-3xl font-bold text-rose-400">02</span>
                <h3 className="font-display text-xl font-bold text-neutral-100">Snap Your Strip</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  The booth camera counts down with studio ring flash. Take up to four poses with nostalgic film filters or retro noir tones.
                </p>
              </div>
              <div className="pt-6 text-xs font-mono text-neutral-400">
                <span>Front camera + countdown flash</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 flex flex-col justify-between hover:border-neutral-700 transition-colors">
              <div className="space-y-4">
                <span className="font-mono text-3xl font-bold text-rose-400">03</span>
                <h3 className="font-display text-xl font-bold text-neutral-100">Reveal & Print Vibe</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Our weighted matching engine calculates genuine compatibility overlap and reveals your match with concrete reasons and an instant printable strip.
                </p>
              </div>
              <div className="pt-6 text-xs font-mono text-neutral-400">
                <span>Printable physical keepsake</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Venue Experience & Social Context */}
      <section className="py-20 border-b border-neutral-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900">
              <img
                src={venueLoungeImg}
                alt="Social venue with photo booth"
                className="w-full h-auto aspect-[16/10] object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 bg-neutral-950/80 backdrop-blur-sm border border-neutral-800 px-3 py-1 rounded text-[11px] font-mono text-amber-400">
                DEMO VENUE TELEMETRY
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <h2 className="text-xs font-mono uppercase tracking-widest text-rose-400">
                  Built For Real Spaces
                </h2>
                <h3 className="font-display text-3xl font-bold tracking-tight text-neutral-100">
                  Designed for coffee shops, festivals, campuses, and cultural hubs.
                </h3>
              </div>

              <p className="text-neutral-300 text-base leading-relaxed">
                Dating apps commodify humans into infinite endless scrolling. MagicMatch brings serendipity back into third spaces. You walk away with a real physical strip to hold in your hands.
              </p>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-800/80">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-neutral-100 font-display">84%</div>
                  <div className="text-xs text-neutral-400">Strip Keepsake Rate (Demo Data)</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-neutral-100 font-display">1.8m</div>
                  <div className="text-xs text-neutral-400">Avg Booth Dwell Time</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-neutral-100 font-display">100%</div>
                  <div className="text-xs text-neutral-400">Opt-In Contact Sharing</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Privacy & Safety Manifesto */}
      <section className="py-20 border-b border-neutral-900 bg-neutral-950/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-widest text-rose-400">
                Privacy Constitution
              </h2>
              <p className="font-display text-3xl font-bold text-neutral-100">
                Built with radical respect for human boundaries.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-6 space-y-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <EyeOff className="w-5 h-5" />
                  <h4 className="font-semibold text-neutral-100">No Facial Profiling</h4>
                </div>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Your photo is never analyzed by computer vision to guess attractiveness, mood, or personality. The camera captures only your booth souvenir.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-6 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                  <h4 className="font-semibold text-neutral-100">Dual-Consent Contact</h4>
                </div>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Contact details (Instagram or phone) are ONLY displayed if the matched person explicitly turned on contact sharing. Otherwise, cards remain purely anonymous.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-6 space-y-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <Compass className="w-5 h-5" />
                  <h4 className="font-semibold text-neutral-100">Deterministic Engine</h4>
                </div>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Matches are evaluated with transparent weights: shared interests, energy capacity, and hangout preferences. Every match gives clear, explainable reasons.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-6 space-y-3">
                <div className="flex items-center gap-2 text-blue-400">
                  <HeartHandshake className="w-5 h-5" />
                  <h4 className="font-semibold text-neutral-100">Zero Pressure Claims</h4>
                </div>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  We never claim to find your "soulmate" or guarantee romance. We highlight genuine vibe overlap so you can meet someone cool.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer / Operator Jump */}
      <footer className="py-12 border-t border-neutral-900 bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-neutral-200">MagicMatch Booth</span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-400">Real-world social discovery</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-neutral-400">
            <button
              onClick={onOpenDashboard}
              className="hover:text-neutral-200 underline underline-offset-4 cursor-pointer"
            >
              Operator Control Hub
            </button>
            <span>·</span>
            <button
              onClick={onStartBooth}
              className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
            >
              Enter Booth Mode
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
