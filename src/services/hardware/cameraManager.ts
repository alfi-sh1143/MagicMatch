export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
  kind: string;
}

export interface CameraStreamTelemetry {
  width: number;
  height: number;
  frameRate: number;
  latencyMs: number;
  facingMode?: string;
  activeSource: 'browser_webrtc' | 'virtual_demo' | 'dslr_usb';
}

export class CameraHardwareManager {
  private activeTelemetry: CameraStreamTelemetry = {
    width: 1280,
    height: 720,
    frameRate: 30,
    latencyMs: 12,
    activeSource: 'browser_webrtc',
  };

  /**
   * Enumerate connected hardware video devices
   */
  async listVideoDevices(): Promise<CameraDeviceInfo[]> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return [
        { deviceId: 'demo-default', label: 'MagicMatch Virtual Synthetic Camera', kind: 'videoinput' },
      ];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId || `cam-${index}`,
          label: d.label || `Camera Source ${index + 1}`,
          kind: d.kind,
        }));

      if (videoInputs.length === 0) {
        videoInputs.push({
          deviceId: 'demo-default',
          label: 'MagicMatch Virtual Synthetic Camera',
          kind: 'videoinput',
        });
      }
      return videoInputs;
    } catch {
      return [
        { deviceId: 'demo-default', label: 'MagicMatch Virtual Synthetic Camera', kind: 'videoinput' },
      ];
    }
  }

  getTelemetry(): CameraStreamTelemetry {
    return { ...this.activeTelemetry };
  }

  updateTelemetry(partial: Partial<CameraStreamTelemetry>) {
    this.activeTelemetry = { ...this.activeTelemetry, ...partial };
  }
}

export const cameraHardwareManager = new CameraHardwareManager();
