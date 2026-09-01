/**
 * Client-side Photobooth Animated Loop & Video Exporter
 * Generates animated GIF / WebM loops from 4-cut photostrips directly in the browser.
 */

export interface GifOptions {
  fps?: number;
  includeFlash?: boolean;
  frameBorderColor?: string;
}

/**
 * Creates an animated WebM / Video clip from photobooth shots via Canvas MediaRecorder
 */
export async function createAnimatedPhotostripVideo(
  frames: string[],
  options: GifOptions = {}
): Promise<Blob> {
  const fps = options.fps || 2;
  const frameDurationMs = 1000 / fps;

  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // Load images
  const loadedImages: HTMLImageElement[] = await Promise.all(
    frames.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        })
    )
  );

  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, {
    mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm',
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };
  });

  recorder.start();

  // Draw 2 complete loops of the 4 shots (total 8 frame transitions)
  const totalRounds = 2;
  for (let r = 0; r < totalRounds; r++) {
    for (let f = 0; f < loadedImages.length; f++) {
      const img = loadedImages[f];

      // White flash effect between cuts
      if (options.includeFlash) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await new Promise((res) => setTimeout(res, 60));
      }

      // Draw Korean Photogray border frame
      ctx.fillStyle = options.frameBorderColor || '#17181C';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Current Shot
      const pad = 24;
      const innerW = canvas.width - pad * 2;
      const innerH = canvas.height - 120;
      ctx.drawImage(img, pad, pad, innerW, innerH);

      // Frame footer text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px "Space Mono", monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`ANGIE 인생네컷 · CUT 0${f + 1}/04`, canvas.width / 2, canvas.height - 55);
      ctx.font = '12px "Space Mono", monospace, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }), canvas.width / 2, canvas.height - 32);

      await new Promise((res) => setTimeout(res, frameDurationMs));
    }
  }

  recorder.stop();
  return recordingPromise;
}

/**
 * Downloads the animated clip to the user's device
 */
export async function downloadAnimatedStripVideo(frames: string[], filename?: string, options?: GifOptions) {
  const blob = await createAnimatedPhotostripVideo(frames, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `angie-photostrip-live-${Date.now()}.webm`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
