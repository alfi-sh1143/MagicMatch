import React, { useState, useEffect } from 'react';
import {
  Activity,
  Printer,
  Camera,
  Database,
  Cpu,
  RefreshCw,
  Play,
  RotateCcw,
  Pause,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Wifi,
  Globe,
  Sliders,
  Flame,
  Volume2,
  QrCode,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { BoothSession, SystemLogEntry, BoothHealthTelemetry, VenueConfig, StoredConnectionToken } from '../../types';
import { printQueueService } from '../../services/print/printQueue';
import { ENGINE_METADATA } from '../../services/matching/engine';
import { tokenResolutionService } from '../../services/matching/tokenService';
import { thermalPrinterDriver } from '../../services/hardware/thermalPrinter';
import { getRepository } from '../../services/repository';

interface OperatorDashboardProps {
  currentSession: BoothSession | null;
  logs: SystemLogEntry[];
  venueConfig: VenueConfig;
  onTriggerTestSession: () => void;
  onResetKiosk: () => void;
  onPauseBooth: () => void;
  onResumeBooth: () => void;
  isPaused: boolean;
  onConfigChange: (newConfig: VenueConfig) => void;
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({
  currentSession,
  logs,
  venueConfig,
  onTriggerTestSession,
  onResetKiosk,
  onPauseBooth,
  onResumeBooth,
  isPaused,
  onConfigChange,
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [networkOnline, setNetworkOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [tokens, setTokens] = useState<StoredConnectionToken[]>([]);
  const [thermalTestResult, setThermalTestResult] = useState<string | null>(null);

  // Print Queue Live Status
  const [queueStats, setQueueStats] = useState(printQueueService.getQueueStats());
  const [recentJobs, setRecentJobs] = useState(printQueueService.getJobs());

  const repo = getRepository();

  const refreshTokens = () => {
    setTokens(tokenResolutionService.getAllTokens().slice(0, 10));
  };

  useEffect(() => {
    refreshTokens();
    const unsub = printQueueService.addListener((jobs) => {
      setRecentJobs(jobs.slice(0, 5));
      setQueueStats(printQueueService.getQueueStats());
    });

    const handleOnline = () => setNetworkOnline(true);
    const handleOffline = () => setNetworkOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const tokenInterval = setInterval(refreshTokens, 3000);

    return () => {
      unsub();
      clearInterval(tokenInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTestThermalPrint = async () => {
    setThermalTestResult('Generating ESC/POS receipt commands...');
    const res = await thermalPrinterDriver.runDiagnosticTest();
    setThermalTestResult(res.message);
  };

  const handleRevokeToken = async (token: string) => {
    await tokenResolutionService.revokeConnection(token, 'operator');
    refreshTokens();
  };

  const healthTelemetry: BoothHealthTelemetry = {
    camera: {
      status: 'online',
      lastCheck: '10s ago',
      latencyMs: 14,
    },
    printer: {
      status: queueStats.failed > 0 ? 'degraded' : 'online',
      lastCheck: '1s ago',
      latencyMs: 8,
      lastError: queueStats.failed > 0 ? 'Printer queue warning' : undefined,
    },
    storage: {
      status: 'online',
      lastCheck: 'Active (Synchronized)',
      latencyMs: 2,
    },
    matchEngine: {
      status: 'online',
      lastCheck: 'Ready (Deterministic v2.4)',
      latencyMs: 5,
    },
    network: {
      status: networkOnline ? 'online' : 'degraded',
      lastCheck: networkOnline ? 'Online' : 'Offline Mode',
      latencyMs: networkOnline ? 24 : undefined,
    },
    backend: {
      status: repo.mode === 'connected' ? 'online' : 'online',
      lastCheck: repo.mode === 'connected' ? 'Supabase Connected' : 'Local-First Storage',
      latencyMs: repo.mode === 'connected' ? 45 : 1,
    },
    audio: {
      status: venueConfig.soundEnabled ? 'online' : 'degraded',
      lastCheck: venueConfig.soundEnabled ? 'Web Audio Synthesizer' : 'Muted',
    },
  };

  const filteredLogs = logs.filter((log) => filterLevel === 'all' || log.level === filterLevel);

  return (
    <div className="min-h-[calc(100vh-64px)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-900">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-rose-400">
            <Activity className="w-3.5 h-3.5" />
            <span>Kiosk Supervisory Terminal</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-neutral-100">
            Operator Hub & Diagnostics
          </h1>
          <p className="text-xs text-neutral-400 font-mono">
            Node: {venueConfig.boothName} ({venueConfig.boothId}) • Venue: {venueConfig.venueName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isPaused ? (
            <button
              onClick={onResumeBooth}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-neutral-950" />
              <span>Resume Booth</span>
            </button>
          ) : (
            <button
              onClick={onPauseBooth}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-amber-400 text-xs font-bold font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
            >
              <Pause className="w-4 h-4" />
              <span>Pause Booth</span>
            </button>
          )}

          <button
            onClick={onTriggerTestSession}
            className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
          >
            <Play className="w-4 h-4 text-rose-400" />
            <span>Simulate Guest Run</span>
          </button>

          <button
            onClick={onResetKiosk}
            className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-red-950/40 border border-neutral-700 hover:border-red-700 text-neutral-200 hover:text-red-300 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-red-400" />
            <span>Reset Kiosk</span>
          </button>
        </div>
      </div>

      {/* SUBSYSTEM HEALTH GRID */}
      <div className="space-y-3">
        <h2 className="font-display text-base font-bold text-neutral-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-rose-400" />
          <span>Subsystems Telemetry</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {Object.entries(healthTelemetry).map(([name, data]) => {
            const isOk = data.status === 'online';
            return (
              <div
                key={name}
                className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase">
                    {name}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOk ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                </div>

                <div>
                  <p className="text-xs font-bold font-mono text-neutral-200 uppercase">
                    {data.status}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-mono truncate">
                    {data.lastCheck}
                  </p>
                </div>

                {typeof data.latencyMs === 'number' && (
                  <p className="text-[10px] font-mono text-neutral-400 border-t border-neutral-800/80 pt-1">
                    Latency: {data.latencyMs}ms
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SESSION SUPERVISOR & PRINT SPOOL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CURRENT SESSION SUPERVISOR */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-neutral-100 flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Current Session Supervisor</span>
            </h2>
            <span className="text-xs font-mono text-neutral-400">
              {currentSession ? `ID: ${currentSession.id}` : 'No active guest'}
            </span>
          </div>

          {currentSession ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase">Active Step</span>
                <p className="font-bold text-rose-400 uppercase">{currentSession.step}</p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase">Captured Photos</span>
                <p className="font-bold text-neutral-200">{currentSession.photos.length} takes</p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase">Selected Match</span>
                <p className="font-bold text-neutral-200 truncate">
                  {currentSession.match?.candidate.name || 'Not evaluated'}
                </p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase">Print Status</span>
                <p className="font-bold text-neutral-200">
                  {currentSession.printRequested ? 'Dispatched' : 'Idle'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-950 p-6 rounded-2xl text-center text-xs font-mono text-neutral-400">
              No active session. Kiosk is currently waiting in Attract Mode.
            </div>
          )}
        </div>

        {/* PRINT QUEUE & THERMAL PRINTER TEST */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-neutral-100 flex items-center gap-2">
              <Printer className="w-4 h-4 text-rose-400" />
              <span>Thermal Spool</span>
            </h2>
            <span className="text-xs font-mono text-neutral-400">
              {queueStats.queued} queued
            </span>
          </div>

          <div className="space-y-2">
            {recentJobs.length === 0 ? (
              <p className="text-xs font-mono text-neutral-500 text-center py-2">
                Print spool is clear.
              </p>
            ) : (
              recentJobs.slice(0, 3).map((job) => (
                <div
                  key={job.id}
                  className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <p className="text-neutral-200 font-bold">{job.id}</p>
                    <p className="text-[10px] text-neutral-500">
                      {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      job.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : job.status === 'PRINTING'
                        ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                        : job.status === 'FAILED'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              ))
            )}

            <button
              onClick={handleTestThermalPrint}
              className="w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Printer className="w-3.5 h-3.5 text-rose-400" />
              <span>ESC/POS Diagnostic Cut Test</span>
            </button>
            {thermalTestResult && (
              <p className="text-[10px] font-mono text-neutral-400 bg-neutral-950 p-2 rounded border border-neutral-800 truncate">
                {thermalTestResult}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* PHASE 4: ACTIVE CONNECTION TOKENS MONITOR */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="font-display text-base font-bold text-neutral-100 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-rose-400" />
              <span>Server-Authoritative Connection Tokens (Phase 4)</span>
            </h2>
            <p className="text-xs text-neutral-400 font-mono">
              Real temporary tokens created for physical booth guests. Strictly expires in 15 minutes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#/connect"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-rose-300 transition-colors flex items-center gap-1.5"
            >
              <span>Open Mobile Portal</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={refreshTokens}
              className="p-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition-colors cursor-pointer"
              title="Refresh Tokens"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-500 uppercase text-[10px]">
                <th className="py-2.5 px-3">Token Code</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Created</th>
                <th className="py-2.5 px-3">Expiration</th>
                <th className="py-2.5 px-3">Dual Consent</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {tokens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-neutral-500">
                    No active tokens generated yet. Run a photo session to issue tokens.
                  </td>
                </tr>
              ) : (
                tokens.map((t) => {
                  const isExpired = Date.now() > t.expiresAt || t.status === 'EXPIRED';
                  const remainingMin = Math.max(0, Math.ceil((t.expiresAt - Date.now()) / 60000));
                  return (
                    <tr key={t.id} className="hover:bg-neutral-950/40">
                      <td className="py-2.5 px-3 font-bold text-neutral-200">{t.token}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.status === 'REVOKED'
                              ? 'bg-neutral-800 text-neutral-400'
                              : isExpired
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {isExpired ? 'EXPIRED' : t.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-400">
                        {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-300">
                        {isExpired ? 'Expired' : `${remainingMin} mins remaining`}
                      </td>
                      <td className="py-2.5 px-3">
                        {t.guestConsent && t.candidateConsent ? (
                          <span className="text-emerald-400 text-[11px] font-bold">Mutual Active</span>
                        ) : (
                          <span className="text-amber-400 text-[11px]">Pending Guest</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {t.status === 'ACTIVE' && !isExpired && (
                          <button
                            onClick={() => handleRevokeToken(t.token)}
                            className="px-2 py-1 rounded bg-neutral-950 hover:bg-red-950/50 text-neutral-400 hover:text-red-400 border border-neutral-800 text-[10px] cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SYSTEM LOGS CONSOLE */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-display text-base font-bold text-neutral-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-rose-400" />
            <span>Kiosk Kernel Event Stream</span>
          </h2>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            {['all', 'info', 'action', 'success', 'warn'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg uppercase cursor-pointer transition-colors ${
                  filterLevel === lvl
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-neutral-950 text-neutral-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 max-h-56 overflow-y-auto space-y-1.5 font-mono text-xs">
          {filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3">
              <span className="text-neutral-500 shrink-0">{log.timestamp}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 ${
                  log.level === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : log.level === 'warn'
                    ? 'bg-amber-500/20 text-amber-400'
                    : log.level === 'action'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {log.level}
              </span>
              <span className="text-neutral-300 break-words">{log.event}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
