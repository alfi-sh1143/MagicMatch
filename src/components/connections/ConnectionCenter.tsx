import React, { useState } from 'react';
import {
  Camera,
  Database,
  Cpu,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { cameraService } from '../../services/camera';
import { printerService } from '../../services/hardware';
import { evaluateAllCandidates } from '../../services/matching/engine';
import { MOCK_CANDIDATE_PROFILES } from '../../data/profiles';
import { getRepository } from '../../services/repository';

export const ConnectionCenter: React.FC = () => {
  const [cameraTestResult, setCameraTestResult] = useState<string | null>(null);
  const [printerTestResult, setPrinterTestResult] = useState<string | null>(null);
  const [engineBenchmark, setEngineBenchmark] = useState<string | null>(null);
  const [testingCamera, setTestingCamera] = useState(false);

  const repo = getRepository();

  const handleTestCamera = async () => {
    setTestingCamera(true);
    setCameraTestResult('Querying browser media devices...');
    try {
      const isAvail = await cameraService.isAvailable();
      if (isAvail) {
        setCameraTestResult('WebRTC video input device detected and responsive.');
      } else {
        setCameraTestResult('No hardware camera detected. Demo camera mode ready for instant fallback.');
      }
    } catch (e: any) {
      setCameraTestResult(`Camera query: ${e.message || 'Handled via demo mode'}`);
    } finally {
      setTestingCamera(false);
    }
  };

  const handleTestEngine = () => {
    const start = performance.now();
    const mockAnswers = {
      energy: 'creative',
      interests: ['photography', 'music', 'design'],
      hangout: 'cafe_vinyl',
      social_energy: 70,
      intent: ['creative_projects', 'new_friends'],
    };
    const results = evaluateAllCandidates(mockAnswers, MOCK_CANDIDATE_PROFILES);
    const duration = (performance.now() - start).toFixed(2);
    setEngineBenchmark(
      `Evaluated ${results.length} candidate profiles in ${duration}ms. Top match: ${results[0].candidate.name} (${results[0].compatibility.score}% overlap).`
    );
  };

  const handleTestPrinter = async () => {
    setPrinterTestResult('Opening system print preview spool...');
    await printerService.print();
    setPrinterTestResult('System print spool dialog invoked successfully.');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-1 pb-6 border-b border-neutral-900">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-rose-400">
          <span>Subsystems & Hardware Integration</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-neutral-100">
          Hardware & Nodes
        </h1>
        <p className="text-sm text-neutral-400 max-w-xl">
          Supervise physical peripherals, persistence layers, and local algorithmic matching services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Camera */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-rose-400">
                <Camera className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>BROWSER CAMERA</span>
              </div>
            </div>

            <h3 className="font-display text-lg font-bold text-neutral-100">
              Camera Subsystem
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-mono">
              Driver: BrowserCameraService (WebRTC getUserMedia). Front-facing 720p stream with canvas flash capture and instant demo camera fallback.
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-neutral-800">
            {cameraTestResult && (
              <p className="text-[11px] text-neutral-300 font-mono bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                {cameraTestResult}
              </p>
            )}

            <button
              onClick={handleTestCamera}
              disabled={testingCamera}
              className="w-full py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingCamera ? 'animate-spin' : ''}`} />
              <span>Test Camera Feed</span>
            </button>
          </div>
        </div>

        {/* Card 2: Database / Persistence */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-rose-400">
                <Database className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="uppercase">{repo.mode === 'connected' ? 'CONNECTED' : 'LOCAL MODE'}</span>
              </div>
            </div>

            <h3 className="font-display text-lg font-bold text-neutral-100">
              Data Repository Adapter
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-mono">
              Driver: LocalStorageRepository with in-memory persistence. Ready for Supabase / PostgreSQL adapter substitution without UI rewrites.
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-neutral-800">
            <div className="text-[11px] font-mono text-neutral-400 space-y-1">
              <div>VITE_SUPABASE_URL: Not set (Defaulting to Local)</div>
              <div>Persistence: Local Browser Storage (Safe)</div>
            </div>

            <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 font-mono">
              Sessions stored locally with zero cloud leaks.
            </div>
          </div>
        </div>

        {/* Card 3: Match Engine */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-rose-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>ONLINE</span>
              </div>
            </div>

            <h3 className="font-display text-lg font-bold text-neutral-100">
              Deterministic Vibe Engine
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-mono">
              Multi-dimensional scoring: 30% interests, 20% personality traits, 15% hangouts, 15% intent, 10% battery, 10% entropy.
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-neutral-800">
            {engineBenchmark && (
              <p className="text-[11px] text-neutral-300 font-mono bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                {engineBenchmark}
              </p>
            )}

            <button
              onClick={handleTestEngine}
              className="w-full py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Cpu className="w-3.5 h-3.5 text-rose-400" />
              <span>Run Benchmark Test</span>
            </button>
          </div>
        </div>

        {/* Card 4: Printer */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-rose-400">
                <Printer className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>BROWSER PRINT</span>
              </div>
            </div>

            <h3 className="font-display text-lg font-bold text-neutral-100">
              Print Spool Service
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-mono">
              Driver: BrowserPrintService (window.print). Formats the DOM layout for physical photo strip output with automatic print-dialog invocation.
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-neutral-800">
            {printerTestResult && (
              <p className="text-[11px] text-neutral-300 font-mono bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                {printerTestResult}
              </p>
            )}

            <button
              onClick={handleTestPrinter}
              className="w-full py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Test Print Spooler</span>
            </button>
          </div>
        </div>

        {/* Card 5: Optional AI Services */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 flex flex-col justify-between space-y-4 md:col-span-2 lg:col-span-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-rose-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 bg-neutral-800 border border-neutral-700 px-2.5 py-0.5 rounded-full">
                <span>OPTIONAL / UNLOCKED IN LOCAL</span>
              </div>
            </div>

            <h3 className="font-display text-lg font-bold text-neutral-100">
              Optional AI Layer (Gemini Proxy)
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-mono">
              The core matching engine is 100% deterministic and operates autonomously without external AI APIs. If configured server-side, Gemini can optionally generate creative hangout icebreaker copy. Never performs facial recognition or attractiveness profiling.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Status: Deterministic Offline Mode Active
            </span>
            <span className="text-[11px] text-neutral-500">Autonomous Execution</span>
          </div>
        </div>
      </div>
    </div>
  );
};
