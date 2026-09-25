import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TopBar, AppViewType } from './components/navigation/TopBar';
import { LandingPage } from './components/landing/LandingPage';
import { BoothWelcome } from './components/booth/BoothWelcome';
import { BoothHowItWorks } from './components/booth/BoothHowItWorks';
import { QuestionEngine } from './components/booth/QuestionEngine';
import { CameraCapture } from './components/camera/CameraCapture';
import { MatchProcessing } from './components/matching/MatchProcessing';
import { MatchReveal } from './components/matching/MatchReveal';
import { NoMatchView } from './components/matching/NoMatchView';
import { PhotoStrip } from './components/photostrip/PhotoStrip';
import { OperatorDashboard } from './components/dashboard/OperatorDashboard';
import { ConnectionCenter } from './components/connections/ConnectionCenter';
import { SettingsView } from './components/settings/SettingsView';
import { VenueSettings } from './components/settings/VenueSettings';
import { PrivacyCenter } from './components/privacy/PrivacyCenter';
import { ConnectionPageView } from './components/connect/ConnectionPageView';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Phase 3 Kiosk Components
import { AttractMode } from './components/kiosk/AttractMode';
import { OperatorPinModal } from './components/kiosk/OperatorPinModal';
import { SessionTimeoutModal } from './components/kiosk/SessionTimeoutModal';

import {
  BoothSession,
  BoothStep,
  CapturedPhoto,
  MatchResult,
  SystemLogEntry,
  VenueConfig,
} from './types';
import { getRepository } from './services/repository';
import { findBestMatch, ENGINE_METADATA } from './services/matching/engine';
import { centralizedAudioService } from './services/audio';
import { generateDemoFrame } from './services/camera';
import { getVenueConfig } from './services/venue/config';
import { PhotoProcessor } from './services/camera/photoProcessor';

export default function App() {
  const [currentView, setCurrentView] = useState<AppViewType>('kiosk');
  const [venueConfig, setVenueConfig] = useState<VenueConfig>(getVenueConfig());
  const [isMuted, setIsMuted] = useState<boolean>(!venueConfig.soundEnabled);
  const [currentSession, setCurrentSession] = useState<BoothSession | null>(null);
  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Inactivity & Session Timeout State
  const [inactivitySeconds, setInactivitySeconds] = useState<number>(0);
  const [showTimeoutModal, setShowTimeoutModal] = useState<boolean>(false);
  const [timeoutCountdown, setTimeoutCountdown] = useState<number>(venueConfig.inactivityWarningSec);

  // Operator Lock State
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [isBoothPaused, setIsBoothPaused] = useState<boolean>(false);
  const [antiAbuseLastRestart, setAntiAbuseLastRestart] = useState<number>(0);

  // Phase 4: Mobile Connect Token Routing
  const [connectToken, setConnectToken] = useState<string>('');

  const repository = getRepository();

  // Helper to add structured system event logs
  const addLog = useCallback((event: string, level: SystemLogEntry['level'] = 'info') => {
    const newEntry: SystemLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      event,
      level,
    };
    setSystemLogs((prev) => [newEntry, ...prev.slice(0, 49)]);
  }, []);

  // URL Hash & Path Router for Mobile Connect (/connect/:token or #/connect/:token)
  useEffect(() => {
    const handleUrlRoute = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash;
      const path = window.location.pathname;
      const search = window.location.search;

      let extractedToken = '';
      if (hash.startsWith('#/connect')) {
        const parts = hash.split('#/connect');
        if (parts[1]) {
          extractedToken = parts[1].replace(/^\//, '').trim();
        }
        setCurrentView('connect');
      } else if (path.startsWith('/connect')) {
        const parts = path.split('/connect');
        if (parts[1]) {
          extractedToken = parts[1].replace(/^\//, '').trim();
        }
        setCurrentView('connect');
      } else if (search.includes('token=') || search.includes('connect=')) {
        const params = new URLSearchParams(search);
        extractedToken = (params.get('token') || params.get('connect') || '').trim();
        setCurrentView('connect');
      }

      if (extractedToken) {
        setConnectToken(extractedToken.toUpperCase());
        addLog(`Mobile URL route matched: token [${extractedToken.toUpperCase()}]`, 'info');
      }
    };

    handleUrlRoute();
    window.addEventListener('hashchange', handleUrlRoute);
    window.addEventListener('popstate', handleUrlRoute);

    return () => {
      window.removeEventListener('hashchange', handleUrlRoute);
      window.removeEventListener('popstate', handleUrlRoute);
    };
  }, [addLog]);

  // Online / Offline tracking
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addLog('Network restored. ONLINE.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      addLog('Network disconnected. OFFLINE MODE (local degraded operation).', 'warn');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addLog]);

  // Centralized booth reset (clears photos, revoked URLs, tokens, answers)
  const resetBoothSession = useCallback(async () => {
    addLog('Executing resetBoothSession(): full teardown & memory purge', 'action');
    if (currentSession?.photos) {
      currentSession.photos.forEach((p) => PhotoProcessor.revoke(p.dataUrl));
    }
    await repository.clearSession();
    const fresh = await repository.createSession();
    fresh.step = 'attract';
    setCurrentSession(fresh);
    setShowTimeoutModal(false);
    setInactivitySeconds(0);
    setTimeoutCountdown(venueConfig.inactivityWarningSec);
    addLog(`Session cleared. Kiosk returned to Attract Mode (${fresh.id})`, 'info');
  }, [addLog, currentSession, repository, venueConfig.inactivityWarningSec]);

  // Activity tracking for booth session timeout
  const resetInactivity = useCallback(() => {
    setInactivitySeconds(0);
    if (showTimeoutModal) {
      setShowTimeoutModal(false);
      setTimeoutCountdown(venueConfig.inactivityWarningSec);
      addLog('User touched screen: inactivity timer reset', 'info');
    }
  }, [addLog, showTimeoutModal, venueConfig.inactivityWarningSec]);

  // Attach global touch & mouse listeners to detect activity
  useEffect(() => {
    const handleUserActivity = () => {
      resetInactivity();
    };

    window.addEventListener('pointerdown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);

    return () => {
      window.removeEventListener('pointerdown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
    };
  }, [resetInactivity]);

  // Inactivity Interval Loop (Only active during live sessions when not on attract screen)
  useEffect(() => {
    const isAttract = !currentSession || currentSession.step === 'attract';
    if (isAttract || isBoothPaused || currentView === 'connect') return;

    const interval = setInterval(() => {
      setInactivitySeconds((prev) => {
        const next = prev + 1;
        const warningThreshold = venueConfig.sessionTimeoutSec - venueConfig.inactivityWarningSec;

        if (next >= venueConfig.sessionTimeoutSec) {
          // Timeout reached: purge session & return to attract
          resetBoothSession();
          return 0;
        } else if (next >= warningThreshold) {
          setShowTimeoutModal(true);
          setTimeoutCountdown(venueConfig.sessionTimeoutSec - next);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession, isBoothPaused, currentView, resetBoothSession, venueConfig.inactivityWarningSec, venueConfig.sessionTimeoutSec]);

  // Initialize session and restore from storage if present
  useEffect(() => {
    addLog(`MagicMatch Kiosk OS Initialized (Engine ${ENGINE_METADATA.engineVersion})`, 'info');
    addLog(`Venue: ${venueConfig.venueName} | Booth: ${venueConfig.boothName}`, 'info');

    repository.getCurrentSession().then((session) => {
      if (session) {
        setCurrentSession(session);
        addLog(`Restored session ${session.id} (step: ${session.step})`, 'info');
      } else {
        repository.createSession().then((newSession) => {
          newSession.step = 'attract';
          setCurrentSession(newSession);
          addLog(`Initial booth session created in attract mode: ${newSession.id}`, 'info');
        });
      }
    });
  }, [addLog, repository, venueConfig.boothName, venueConfig.venueName]);

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    centralizedAudioService.setEnabled(!next);
    addLog(next ? 'Booth audio disabled' : 'Booth audio enabled', 'info');
  };

  // Step transitions inside the booth
  const updateSessionStep = async (step: BoothStep) => {
    if (!currentSession) return;
    const updated: BoothSession = {
      ...currentSession,
      step,
    };
    setCurrentSession(updated);
    await repository.saveSession(updated);
    addLog(`Session step transitioned to [${step.toUpperCase()}]`, 'action');
  };

  // Start new clean booth flow from Attract Screen with anti-abuse rate limiting
  const handleStartBooth = async () => {
    const now = Date.now();
    if (now - antiAbuseLastRestart < 1500) {
      addLog('Anti-abuse: rapid restart throttled', 'warn');
      return;
    }
    setAntiAbuseLastRestart(now);

    centralizedAudioService.playTap();
    addLog('Attract screen tapped: beginning guest experience flow', 'action');
    if (!currentSession || currentSession.step === 'attract') {
      const fresh = await repository.createSession();
      fresh.step = 'welcome';
      setCurrentSession(fresh);
      await repository.saveSession(fresh);
    } else {
      await updateSessionStep('welcome');
    }
  };

  // Answer recording from QuestionEngine
  const handleAnswersComplete = async (answers: Record<string, any>) => {
    if (!currentSession) return;
    centralizedAudioService.playTap();
    const updated: BoothSession = {
      ...currentSession,
      answers,
      step: 'camera',
    };
    setCurrentSession(updated);
    await repository.saveSession(updated);
    addLog('Guest questionnaire completed. Activating camera viewfinder.', 'action');
  };

  // Photo captures recording from CameraCapture
  const handlePhotosCaptured = async (photos: CapturedPhoto[]) => {
    if (!currentSession) return;
    const updated: BoothSession = {
      ...currentSession,
      photos,
      step: 'matching',
    };
    setCurrentSession(updated);
    await repository.saveSession(updated);
    addLog(`Captured ${photos.length} photos. Dispatched to Deterministic Match Engine.`, 'action');
  };

  // Matching calculation completion
  const handleMatchingComplete = async () => {
    if (!currentSession) return;
    const candidates = await repository.getProfiles();
    const blockedIds = await repository.getBlockedProfileIds();

    const match = findBestMatch(
      currentSession.answers,
      candidates,
      blockedIds,
      undefined,
      currentSession.id,
      currentSession.contactConsent
    );

    if (match) {
      centralizedAudioService.playMatchChime();
      const updated: BoothSession = {
        ...currentSession,
        match,
        candidatesEvaluated: candidates.length,
        step: 'reveal',
      };
      setCurrentSession(updated);
      await repository.saveSession(updated);
      addLog(
        `Top match found: ${match.candidate.name} (${match.compatibility.score}% overlap). Level: ${match.compatibility.level}. Token: ${match.matchToken}`,
        'success'
      );
    } else {
      const updated: BoothSession = {
        ...currentSession,
        match: null,
        candidatesEvaluated: candidates.length,
        step: 'no_match',
      };
      setCurrentSession(updated);
      await repository.saveSession(updated);
      addLog('No matching profile exceeded the compatibility threshold for current answers.', 'warn');
    }
  };

  // Try Another candidate action
  const handleTryAnotherMatch = async () => {
    if (!currentSession) return;
    centralizedAudioService.playTap();
    const candidates = await repository.getProfiles();
    const blockedIds = await repository.getBlockedProfileIds();
    const currentCandidateId = currentSession.match?.candidate.id;

    const nextMatch = findBestMatch(
      currentSession.answers,
      candidates,
      blockedIds,
      currentCandidateId,
      `${currentSession.id}-alt-${Date.now()}`,
      currentSession.contactConsent
    );

    if (nextMatch) {
      const updated: BoothSession = {
        ...currentSession,
        match: nextMatch,
        step: 'reveal',
      };
      setCurrentSession(updated);
      await repository.saveSession(updated);
      addLog(`Alternate candidate found: ${nextMatch.candidate.name} (${nextMatch.compatibility.score}%)`, 'action');
    } else {
      updateSessionStep('no_match');
    }
  };

  // Candidate blocking action
  const handleBlockMatch = async (candidateId: string) => {
    await repository.blockProfile(candidateId);
    addLog(`Profile #${candidateId} blocked by guest. Excluding from future sessions.`, 'warn');
    handleTryAnotherMatch();
  };

  // Candidate reporting action
  const handleReportMatch = async (candidateId: string, reason: string) => {
    await repository.reportProfile(candidateId, reason);
    addLog(`Profile #${candidateId} reported for: ${reason}. Auto-blocked from kiosk engine.`, 'warn');
    handleTryAnotherMatch();
  };

  // Trigger Fast Demo Simulation Run for Venue Staff
  const handleTriggerTestSession = async () => {
    addLog('Executing fast venue staff demonstration run...', 'action');
    const fresh = await repository.createSession();
    fresh.answers = {
      energy: 'creative',
      interests: ['photography', 'design', 'music'],
      hangout: 'cafe_vinyl',
      social_energy: 65,
      intent: ['creative_projects', 'new_friends'],
      contact_consent: true,
    };
    fresh.contactConsent = true;

    // Generate 3 synthetic demo photo frames
    const demoPhotos: CapturedPhoto[] = [
      { id: 'sim-1', dataUrl: generateDemoFrame(1, 'mono'), timestamp: Date.now() - 3000, filterName: 'mono' },
      { id: 'sim-2', dataUrl: generateDemoFrame(2, 'warm'), timestamp: Date.now() - 2000, filterName: 'warm' },
      { id: 'sim-3', dataUrl: generateDemoFrame(3, 'cyber'), timestamp: Date.now() - 1000, filterName: 'cyber' },
    ];
    fresh.photos = demoPhotos;
    fresh.isSimulation = true;

    const candidates = await repository.getProfiles();
    const blockedIds = await repository.getBlockedProfileIds();
    const match = findBestMatch(fresh.answers, candidates, blockedIds, undefined, fresh.id, true);

    fresh.match = match;
    fresh.candidatesEvaluated = candidates.length;
    fresh.step = 'strip';

    setCurrentSession(fresh);
    await repository.saveSession(fresh);
    addLog('Demo simulation generated with high-compatibility candidate and digital photo strip.', 'success');
  };

  // Operator gesture trigger: Long hold in hidden corner (5s)
  const operatorHoldTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCornerTouchStart = () => {
    operatorHoldTimerRef.current = setTimeout(() => {
      centralizedAudioService.playAlert();
      setShowPinModal(true);
      addLog('Operator secret corner gesture triggered (5-second hold)', 'action');
    }, 5000);
  };

  const handleCornerTouchEnd = () => {
    if (operatorHoldTimerRef.current) {
      clearTimeout(operatorHoldTimerRef.current);
      operatorHoldTimerRef.current = null;
    }
  };

  const isKioskMode = currentView === 'kiosk';
  const isConnectPortal = currentView === 'connect';

  return (
    <div className={`min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans select-none ${isKioskMode ? 'kiosk-mode overflow-hidden touch-none' : ''}`}>
      {/* TopBar is suppressed in Kiosk Mode and Mobile Connect Portal for immersive display */}
      {!isKioskMode && !isConnectPortal && (
        <TopBar
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          repositoryMode={repository.mode}
          isOnline={isOnline}
        />
      )}

      {/* PAUSED BOOTH OVERLAY */}
      {isBoothPaused && (
        <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <span className="font-mono text-2xl font-black">||</span>
          </div>
          <h2 className="font-display text-3xl font-black text-neutral-100 uppercase tracking-tight">
            Booth Temporarily Paused
          </h2>
          <p className="text-sm text-neutral-400 max-w-sm font-mono">
            This booth is currently undergoing routine maintenance or paper refill by venue staff.
          </p>
          <button
            onClick={() => setShowPinModal(true)}
            className="px-6 py-3 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-mono uppercase tracking-wider text-neutral-300 transition-colors cursor-pointer"
          >
            Staff Unlock (PIN)
          </button>
        </div>
      )}

      {/* Main View Area wrapped in ErrorBoundary */}
      <main className="flex-1 flex flex-col relative">
        {/* Hidden Operator Corner Button (Hold for 5s to unlock operator terminal) */}
        {isKioskMode && (
          <div
            onPointerDown={handleCornerTouchStart}
            onPointerUp={handleCornerTouchEnd}
            onPointerLeave={handleCornerTouchEnd}
            className="absolute top-0 right-0 w-20 h-20 z-50 opacity-0 cursor-default"
            aria-hidden="true"
          />
        )}

        {/* VIEW: MOBILE CONNECT PORTAL (Phase 4) */}
        {currentView === 'connect' && (
          <ErrorBoundary fallbackTitle="Connection Portal Safe Reset" onReset={() => setCurrentView('kiosk')}>
            <ConnectionPageView
              initialToken={connectToken}
              onNavigateHome={() => setCurrentView('kiosk')}
            />
          </ErrorBoundary>
        )}

        {/* VIEW: KIOSK & BOOTH STEPS */}
        {(currentView === 'kiosk' || currentView === 'booth') && (
          <div className="flex-1 flex flex-col relative w-full h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            {/* KIOSK MODE ACTIVE INDICATOR */}
            {isKioskMode && currentSession?.step !== 'attract' && (
              <div className="flex items-center justify-between pb-3 text-xs font-mono text-neutral-400 border-b border-neutral-900 no-print">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-bold text-neutral-200 uppercase tracking-wider">
                    KIOSK MODE • {venueConfig.boothName}
                  </span>
                  <span className="hidden sm:inline text-neutral-600">|</span>
                  <span className="hidden sm:inline text-neutral-400">
                    Session {currentSession?.id}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-neutral-500 hidden sm:inline">
                    Tap corner 5s for Operator Lock
                  </span>
                  <button
                    onClick={() => setShowPinModal(true)}
                    className="text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    Operator Lock
                  </button>
                </div>
              </div>
            )}

            {currentSession && (
              <ErrorBoundary fallbackTitle="Booth Step Containment" onReset={resetBoothSession}>
                {/* STEP 0: ATTRACT SCREEN (Idle Loop) */}
                {currentSession.step === 'attract' && (
                  <AttractMode
                    venueConfig={venueConfig}
                    onStartSession={handleStartBooth}
                    onOperatorGesture={() => setShowPinModal(true)}
                  />
                )}

                {/* STEP 1: WELCOME */}
                {currentSession.step === 'welcome' && (
                  <BoothWelcome
                    onStart={() => updateSessionStep('how_it_works')}
                    onHowItWorks={() => updateSessionStep('how_it_works')}
                  />
                )}

                {/* STEP 2: HOW IT WORKS & CONSENT */}
                {currentSession.step === 'how_it_works' && (
                  <BoothHowItWorks
                    onContinue={() => updateSessionStep('questions')}
                    onBack={() => updateSessionStep('welcome')}
                  />
                )}

                {/* STEP 3: VIBE QUESTIONS */}
                {currentSession.step === 'questions' && (
                  <QuestionEngine
                    onComplete={handleAnswersComplete}
                    onBackToStart={() => updateSessionStep('how_it_works')}
                  />
                )}

                {/* STEP 4: CAMERA CAPTURE */}
                {currentSession.step === 'camera' && (
                  <CameraCapture
                    sessionId={currentSession.id}
                    allowedCount={venueConfig.photoCount}
                    onPhotosCaptured={handlePhotosCaptured}
                    onBack={() => updateSessionStep('questions')}
                  />
                )}

                {/* STEP 5: MATCH SCANNING */}
                {currentSession.step === 'matching' && (
                  <MatchProcessing
                    onComplete={handleMatchingComplete}
                    candidateCount={30}
                  />
                )}

                {/* STEP 6: MATCH REVEAL & QR */}
                {currentSession.step === 'reveal' && currentSession.match && (
                  <MatchReveal
                    matchResult={currentSession.match}
                    userConsent={currentSession.contactConsent}
                    venueConfig={venueConfig}
                    onViewStrip={() => updateSessionStep('strip')}
                    onTryAnother={handleTryAnotherMatch}
                    onBlockMatch={handleBlockMatch}
                    onReportMatch={handleReportMatch}
                  />
                )}

                {/* STEP 7: NO MATCH / UNIQUE VIBE */}
                {currentSession.step === 'no_match' && (
                  <NoMatchView
                    sessionId={currentSession.id}
                    onTryAnother={handleTryAnotherMatch}
                    onExpandPreferences={() => updateSessionStep('questions')}
                    onSaveSession={async () => {
                      await repository.saveSession(currentSession);
                      addLog('Session saved to local visitor archive', 'success');
                    }}
                    onResetBooth={resetBoothSession}
                  />
                )}

                {/* STEP 8: PHOTO STRIP & PRINT */}
                {currentSession.step === 'strip' && currentSession.match && (
                  <PhotoStrip
                    sessionId={currentSession.id}
                    photos={currentSession.photos}
                    matchResult={currentSession.match}
                    userConsent={currentSession.contactConsent}
                    venueConfig={venueConfig}
                    onResetBooth={resetBoothSession}
                    onBackToReveal={() => updateSessionStep('reveal')}
                  />
                )}
              </ErrorBoundary>
            )}
          </div>
        )}

        {/* VIEW: LANDING PAGE */}
        {currentView === 'landing' && (
          <LandingPage
            onStartBooth={() => {
              setCurrentView('kiosk');
              handleStartBooth();
            }}
            onOpenDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {/* VIEW: OPERATOR DASHBOARD */}
        {currentView === 'dashboard' && (
          <OperatorDashboard
            currentSession={currentSession}
            logs={systemLogs}
            venueConfig={venueConfig}
            onTriggerTestSession={handleTriggerTestSession}
            onResetKiosk={resetBoothSession}
            onPauseBooth={() => setIsBoothPaused(true)}
            onResumeBooth={() => setIsBoothPaused(false)}
            isPaused={isBoothPaused}
            onConfigChange={(newCfg) => setVenueConfig(newCfg)}
          />
        )}

        {/* VIEW: PRIVACY CENTER */}
        {currentView === 'privacy' && <PrivacyCenter venueConfig={venueConfig} />}

        {/* VIEW: VENUE CONFIGURATION */}
        {currentView === 'settings' && (
          <VenueSettings
            config={venueConfig}
            onConfigChange={(newCfg) => setVenueConfig(newCfg)}
          />
        )}

        {/* VIEW: HARDWARE CONNECTIONS */}
        {currentView === 'connections' && <ConnectionCenter />}
      </main>

      {/* Operator PIN Authentication Modal */}
      <OperatorPinModal
        isOpen={showPinModal}
        expectedPin={venueConfig.operatorPin}
        onSuccess={() => {
          setShowPinModal(false);
          setCurrentView('dashboard');
          addLog('Staff operator authenticated with PIN', 'action');
        }}
        onCancel={() => setShowPinModal(false)}
      />

      {/* Session Inactivity Timeout Modal */}
      <SessionTimeoutModal
        isOpen={showTimeoutModal}
        remainingSeconds={timeoutCountdown}
        onContinue={resetInactivity}
        onEndSession={resetBoothSession}
      />
    </div>
  );
}
