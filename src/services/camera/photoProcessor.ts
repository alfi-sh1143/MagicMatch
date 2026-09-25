export interface PhotoProcessOptions {
  filter?: 'normal' | 'mono' | 'warm' | 'cyber';
  targetWidth?: number;
  targetHeight?: number;
  mirror?: boolean;
}

export class PhotoProcessor {
  /**
   * Process a captured video frame into an optimized, memory-efficient data URL.
   */
  static processFrame(
    video: HTMLVideoElement,
    options: PhotoProcessOptions = {}
  ): string {
    const {
      filter = 'normal',
      targetWidth = 1080,
      targetHeight = 720,
      mirror = true,
    } = options;

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Handle high quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.save();

    // Mirror horizontally for natural photo-booth feel
    if (mirror) {
      ctx.translate(targetWidth, 0);
      ctx.scale(-1, 1);
    }

    // Apply color filters
    if (filter === 'mono') {
      ctx.filter = 'grayscale(100%) contrast(125%) brightness(95%)';
    } else if (filter === 'warm') {
      ctx.filter = 'sepia(35%) contrast(110%) brightness(105%) saturate(115%)';
    } else if (filter === 'cyber') {
      ctx.filter = 'hue-rotate(25deg) contrast(125%) saturate(140%)';
    } else {
      ctx.filter = 'contrast(105%) brightness(102%)';
    }

    // Maintain aspect ratio with center-crop
    const srcW = video.videoWidth || 640;
    const srcH = video.videoHeight || 480;
    const srcAspect = srcW / srcH;
    const targetAspect = targetWidth / targetHeight;

    let sx = 0, sy = 0, sw = srcW, sh = srcH;
    if (srcAspect > targetAspect) {
      // Source is wider than target
      sw = srcH * targetAspect;
      sx = (srcW - sw) / 2;
    } else {
      // Source is taller than target
      sh = srcW / targetAspect;
      sy = (srcH - sh) / 2;
    }

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
    ctx.restore();

    // Film grain layer
    try {
      const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 16) {
        const grain = (Math.random() - 0.5) * 14;
        data[i] = Math.min(255, Math.max(0, data[i] + grain));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
      }
      ctx.putImageData(imgData, 0, 0);
    } catch {}

    // Export with high visual fidelity at 0.92 JPEG compression
    return canvas.toDataURL('image/jpeg', 0.92);
  }

  /**
   * Cleans and revokes an image object URL to prevent memory leaks.
   */
  static revoke(url: string) {
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }
  }
}
