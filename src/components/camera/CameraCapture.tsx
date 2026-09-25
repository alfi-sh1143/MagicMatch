import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  RefreshCw,
  Sparkles,
  Zap,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Sun,
  Eye,
} from 'lucide-react';
import { CapturedPhoto } from '../../types';
import { BrowserCameraService, generateDemoFrame } from '../../services/camera';
import { soundService } from '../../services/hardware';
import { PhotoProcessor } from '../../services/camera/photoProcessor';

interface CameraCaptureProps {
  sessionId: string;
  onPhotosCaptured: (photos: CapturedPhoto[]) => void;
  onBack: () => void;
  allowedCount?: number;
}

type PhotoFilter = 'normal' | 'mono' | 'warm' | 'cyber';
type CameraLifecycle =
  | 'INITIAL'
  | 'REQUESTING_PERMISSION'
  | 'READY'
  | 'COUNTDOWN'
  | 'CAPTURING'
  | 'ERROR';

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  sessionId,
  onPhotosCaptured,
  onBack,
  allowedCount = 3,
}) => {
  const TARGET_PHOTO_COUNT = allowedCount;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraServiceRef = useRef<BrowserCameraService>(new BrowserCameraService());

  const [cameraState, setCameraState] = useState<CameraLifecycle>('INITIAL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<PhotoFilter>('warm');
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [framingHint, setFramingHint] = useState<string>('Center your smile in the frame');

  // Rotate helpful non-intrusive framing cues
  useEffect(() => {
    const hints = [
      'Center your smile in the frame',
      'Good lighting creates crisp prints',
      'Strike a fun pose for take ' + (photos.length + 1),
      'Keep eyes aligned with the camera guide',
    ];
    const interval = setInterval(() => {
      setFramingHint((prev) => {
        const nextIdx = (hints.indexOf(prev) + 1) % hints.length;
        return hints[nextIdx];
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [photos.length]);

  // Clean unmount helper
  const teardownCamera = () => {
    try {
      cameraServiceRef.current.stopStream();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } catch (e) {
      console.warn('Error during camera teardown:', e);
    }
  };

  // Initialize camera stream
  useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      if (isDemoMode) return;
      try {
        setCameraState('REQUESTING_PERMISSION');
        const stream = await cameraServiceRef.current.startStream();

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (isMounted) {
              videoRef.current?.play().catch(() => {});
              setCameraState('READY');
            }
          };
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.warn('Camera stream could not start, enabling demo fallback option:', err);
        setCameraState('ERROR');
        setErrorMessage(
          err.name === 'NotAllowedError'
            ? 'Camera permission was denied. Tap below to use the simulated studio camera mode.'
            : 'No active webcam detected. You can proceed seamlessly with the demo photo booth mode.'
        );
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      teardownCamera();
    };
  }, [isDemoMode]);

  // Handle countdown and capture
  const startCountdown = () => {
    if (cameraState === 'COUNTDOWN' || cameraState === 'CAPTURING') return;
    setCameraState('COUNTDOWN');
    let count = 3;
    setCountdownValue(count);
    soundService.playCountdownTick();

    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownValue(count);
        soundService.playCountdownTick();
      } else {
        clearInterval(interval);
        setCountdownValue(null);
        takeSnap();
      }
    }, 1000);
  };

  const takeSnap = () => {
    setCameraState('CAPTURING');
    setIsFlashing(true);
    soundService.playShutter();

    setTimeout(() => {
      setIsFlashing(false);

      let dataUrl = '';
      if (!isDemoMode && videoRef.current && cameraState !== 'ERROR') {
        dataUrl = cameraServiceRef.current.captureFrame(videoRef.current, activeFilter);
      }

      if (!dataUrl) {
        // High quality fallback frame
        dataUrl = generateDemoFrame(photos.length, activeFilter);
      }

      const newPhoto: CapturedPhoto = {
        id: `photo-${Date.now()}-${photos.length}`,
        dataUrl,
        timestamp: Date.now(),
        filterName: activeFilter,
      };

      const updated = [...photos, newPhoto];
      setPhotos(updated);
      setCameraState('READY');
    }, 250);
  };

  // Retake individual photo
  const handleRetake = (indexToRetake: number) => {
    const photoToRemove = photos[indexToRetake];
    if (photoToRemove) {
      PhotoProcessor.revoke(photoToRemove.dataUrl);
    }
    const updated = photos.filter((_, idx) => idx !== indexToRetake);
    setPhotos(updated);
  };

  // Retake entire sequence
  const handleRetakeAll = () => {
    photos.forEach((p) => PhotoProcessor.revoke(p.dataUrl));
    setPhotos([]);
  };

  const handleFinish = () => {
    teardownCamera();
    onPhotosCaptured(photos);
  };

  const handleEnableDemoMode = () => {
    teardownCamera();
    setIsDemoMode(true);
    setCameraState('READY');
    setErrorMessage(null);
  };

  const filtersList: { id: PhotoFilter; label: string; desc: string }[] = [
    { id: 'warm', label: 'Vintage Warm', desc: 'Golden tone' },
    { id: 'normal', label: 'True Color', desc: 'Natural light' },
    { id: 'mono', label: 'Noir Mono', desc: 'Classic B&W' },
    { id: 'cyber', label: 'Neon Cyber', desc: 'Vibrant pop' },
  ];

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-4 flex flex-col items-center space-y-4 select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-rose-400 uppercase">
            Step 2 of 4 • Photobooth Studio
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-neutral-100">
            Capture Your 3-Pose Strip
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {isDemoMode && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono">
              Simulated Camera
            </span>
          )}
          <div className="px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300">
            Pose <span className="text-rose-400 font-bold">{Math.min(photos.length + 1, TARGET_PHOTO_COUNT)}</span> / {TARGET_PHOTO_COUNT}
          </div>
        </div>
      </div>

      {/* Main Viewport Card */}
      <div className="relative w-full aspect-16/10 sm:aspect-16/9 bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl flex items-center justify-center">
        {/* Flash Screen Overlay */}
        <div
          className={`absolute inset-0 bg-white z-40 transition-opacity pointer-events-none ${
            isFlashing ? 'opacity-100 duration-75' : 'opacity-0 duration-500'
          }`}
        />

        {/* Live Camera Feed */}
        {!isDemoMode && cameraState !== 'ERROR' ? (
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className={`w-full h-full object-cover transform -scale-x-100 transition-all ${
              activeFilter === 'mono'
                ? 'grayscale contrast-125'
                : activeFilter === 'warm'
                ? 'sepia-30 contrast-110 brightness-105'
                : activeFilter === 'cyber'
                ? 'hue-rotate-30 contrast-125 saturate-130'
                : ''
            }`}
          />
        ) : (
          /* Simulated Camera Mode Visual */
          <div className="relative w-full h-full bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-rose-500/40 flex items-center justify-center mb-4 text-rose-400/80 animate-pulse">
              <Camera className="w-12 h-12" />
            </div>
            <p className="font-display text-lg font-bold text-neutral-200">
              {cameraState === 'ERROR' ? 'Hardware Camera Unavailable' : 'Studio Simulated Feed Active'}
            </p>
            <p className="text-xs text-neutral-400 max-w-sm mt-1">
              {errorMessage || 'High fidelity portrait graphics will be synthesized automatically for your photo strip.'}
            </p>
            {cameraState === 'ERROR' && !isDemoMode && (
              <button
                onClick={handleEnableDemoMode}
                className="mt-4 px-5 py-2.5 rounded-xl bg-rose-400 text-neutral-950 text-xs font-mono font-bold uppercase hover:bg-rose-300 transition-all cursor-pointer"
              >
                Switch to Demo Studio Mode
              </button>
            )}
          </div>
        )}

        {/* Visual Framing Overlay (Pure Browser Level Guide - No biometric identification) */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
          {/* Subtle Oval Framing Guide */}
          <div className="w-56 h-72 sm:w-64 sm:h-80 border-2 border-white/20 rounded-[50%] mt-4 relative">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-rose-400/60" />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-rose-400/60" />
            <div className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-rose-400/60" />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-rose-400/60" />
          </div>

          {/* Dynamic Framing Cue */}
          <div className="bg-neutral-950/70 backdrop-blur-md px-4 py-1.5 rounded-full border border-neutral-700/50 text-[11px] font-mono text-neutral-300 flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-rose-400" />
            <span>{framingHint}</span>
          </div>
        </div>

        {/* Countdown Overlay Badge */}
        {countdownValue !== null && (
          <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center z-30">
            <div className="w-32 h-32 rounded-full border-4 border-rose-400 bg-neutral-950/90 flex items-center justify-center shadow-2xl animate-scale-in">
              <span className="font-mono text-7xl font-black text-rose-400">
                {countdownValue}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Selection Chips */}
      <div className="w-full flex items-center justify-center gap-2 py-1 overflow-x-auto">
        {filtersList.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-2 ${
              activeFilter === f.id
                ? 'bg-rose-500/20 border border-rose-500 text-rose-300 shadow-sm'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      {/* Captured Thumbnails Gallery */}
      <div className="w-full bg-neutral-900/60 border border-neutral-800 rounded-2xl p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {[0, 1, 2].map((idx) => {
            const photo = photos[idx];
            return (
              <div
                key={idx}
                className="relative w-20 h-16 sm:w-24 sm:h-20 rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden flex items-center justify-center group"
              >
                {photo ? (
                  <>
                    <img src={photo.dataUrl} alt={`Take ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRetake(idx)}
                      className="absolute inset-0 bg-neutral-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-mono text-red-400 transition-opacity cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-mono text-neutral-600 font-bold">0{idx + 1}</span>
                )}
              </div>
            );
          })}
        </div>

        {photos.length > 0 && (
          <button
            onClick={handleRetakeAll}
            className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 cursor-pointer px-3 py-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake All</span>
          </button>
        )}
      </div>

      {/* Large Touch Action Bar */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          onClick={onBack}
          className="w-full sm:w-auto px-5 py-3 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-mono uppercase text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          Back to Questions
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {photos.length < TARGET_PHOTO_COUNT ? (
            <button
              onClick={() => {
                if (cameraState === 'ERROR') {
                  handleEnableDemoMode();
                } else {
                  startCountdown();
                }
              }}
              disabled={cameraState === 'COUNTDOWN' || cameraState === 'CAPTURING' || cameraState === 'REQUESTING_PERMISSION'}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl font-display font-black text-base text-neutral-950 bg-gradient-to-r from-rose-400 via-rose-300 to-amber-300 hover:brightness-110 active:scale-95 shadow-xl shadow-rose-950/50 transition-all cursor-pointer flex items-center justify-center gap-3 group"
            >
              <Camera className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span>
                {cameraState === 'REQUESTING_PERMISSION'
                  ? 'Initializing Camera...'
                  : cameraState === 'ERROR'
                  ? 'Switch to Demo Camera'
                  : cameraState === 'COUNTDOWN'
                  ? `Counting down (${countdownValue})`
                  : `CAPTURE TAKE 0${photos.length + 1}`}
              </span>
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl font-display font-black text-base text-neutral-950 bg-rose-400 hover:bg-rose-300 active:scale-95 shadow-xl shadow-rose-950/40 transition-all cursor-pointer flex items-center justify-center gap-2 group"
            >
              <CheckCircle2 className="w-5 h-5 text-neutral-950" />
              <span>CONFIRM 3 PHOTOS & FIND MATCH</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
