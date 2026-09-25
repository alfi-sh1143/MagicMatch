import { CameraService } from '../hardware';
import { PhotoProcessor } from './photoProcessor';

export class BrowserCameraService implements CameraService {
  private stream: MediaStream | null = null;

  async isAvailable(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some((d) => d.kind === 'videoinput');
    } catch {
      return false;
    }
  }

  async startStream(): Promise<MediaStream> {
    this.stopStream();
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera API not supported in this browser.');
    }
    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };
    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    return this.stream;
  }

  stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  captureFrame(video: HTMLVideoElement, filterName: string = 'normal'): string {
    return PhotoProcessor.processFrame(video, {
      filter: filterName as any,
      targetWidth: 1080,
      targetHeight: 720,
      mirror: true,
    });
  }
}

export const cameraService = new BrowserCameraService();

/**
 * Creates simulated photo booth frames when camera is unavailable or in demo mode
 */
export function generateDemoFrame(index: number = 0, filterName: string = 'warm'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background gradient simulating warm photobooth backdrop
  const bg = ctx.createLinearGradient(0, 0, 720, 480);
  if (index === 0) {
    bg.addColorStop(0, '#1c1917');
    bg.addColorStop(1, '#292524');
  } else if (index === 1) {
    bg.addColorStop(0, '#262626');
    bg.addColorStop(1, '#171717');
  } else {
    bg.addColorStop(0, '#1f1e24');
    bg.addColorStop(1, '#13111c');
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 720, 480);

  // Soft studio backlight glow
  const glow = ctx.createRadialGradient(360, 200, 30, 360, 200, 300);
  glow.addColorStop(0, 'rgba(251, 113, 133, 0.15)'); // Rose aura
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 720, 480);

  // Silhouette / avatar illustration
  ctx.fillStyle = '#44403c';
  ctx.beginPath();
  // Head
  ctx.arc(360, 190, 70, 0, Math.PI * 2);
  ctx.fill();
  // Shoulders
  ctx.beginPath();
  ctx.ellipse(360, 360, 150, 100, 0, 0, Math.PI);
  ctx.fill();

  // Pose accessory / expression icon
  ctx.fillStyle = '#f43f5e';
  if (index === 0) {
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('✌️', 420, 160);
  } else if (index === 1) {
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('✨', 420, 150);
  } else {
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('❤️', 420, 160);
  }

  // Stamp photobooth kiosk branding
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`MAGICMATCH BOOTH • TAKE 0${index + 1}`, 36, 436);

  ctx.fillStyle = 'rgba(251, 113, 133, 0.9)';
  ctx.font = '12px monospace';
  ctx.fillText('STUDIO DEMO FRAME', 36, 456);

  // Filter effect
  if (filterName === 'mono') {
    const imgData = ctx.getImageData(0, 0, 720, 480);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  return canvas.toDataURL('image/jpeg', 0.88);
}
