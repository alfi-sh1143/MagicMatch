import { centralizedAudioService } from '../audio';
import { printQueueService } from '../print/printQueue';

export interface CameraService {
  startStream(): Promise<MediaStream>;
  stopStream(): void;
  captureFrame(video: HTMLVideoElement, filter?: string): string;
  isAvailable(): Promise<boolean>;
}

export interface PrinterService {
  print(): Promise<boolean>;
  getStatus(): 'online' | 'degraded' | 'offline';
}

export interface SoundService {
  playCountdownTick(): void;
  playShutter(): void;
  playMatchChime(): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
}

class BrowserPrintService implements PrinterService {
  async print(): Promise<boolean> {
    const job = await printQueueService.enqueueJob({
      sessionId: 'kiosk-session',
      payload: { photoCount: 3, hasMatch: true },
    });
    return job.status === 'COMPLETED' || job.status === 'PRINTING' || job.status === 'QUEUED';
  }

  getStatus(): 'online' | 'degraded' | 'offline' {
    return typeof window !== 'undefined' ? 'online' : 'offline';
  }
}

export const soundService: SoundService = {
  playCountdownTick: () => centralizedAudioService.playCountdownTick(),
  playShutter: () => centralizedAudioService.playShutter(),
  playMatchChime: () => centralizedAudioService.playMatchChime(),
  setMuted: (muted: boolean) => centralizedAudioService.setEnabled(!muted),
  isMuted: () => !centralizedAudioService.isEnabled(),
};

export const printerService = new BrowserPrintService();
