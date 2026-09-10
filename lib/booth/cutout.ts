import type { ImageSegmenter } from '@mediapipe/tasks-vision';

let segmenter: Promise<ImageSegmenter> | undefined;
const cache = new Map<string, Promise<HTMLCanvasElement>>();

async function engine() {
  if (!segmenter) {
    segmenter = (async () => {
      const { FilesetResolver, ImageSegmenter } =
        await import('@mediapipe/tasks-vision');
      const files = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm',
      );
      return ImageSegmenter.createFromOptions(files, {
        baseOptions: {
          modelAssetPath: '/models/selfie-segmenter.tflite',
          delegate: 'CPU',
        },
        runningMode: 'IMAGE',
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      });
    })().catch((error) => {
      segmenter = undefined;
      throw error;
    });
  }
  return segmenter;
}

/** Photos stay in this browser. Only the free model/runtime files are downloaded. */
export function personCutout(
  image: HTMLImageElement,
): Promise<HTMLCanvasElement> {
  const key = image.src;
  const existing = cache.get(key);
  if (existing) return existing;
  const task = (async () => {
    const model = await engine();
    // Let the loading indicator paint between individual still-image inferences.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const result = model.segment(image);
    try {
      const masks = result.confidenceMasks;
      const mask = masks?.[masks.length === 1 ? 0 : 1];
      if (!mask)
        throw new Error(
          'Could not separate this portrait. Try a clearer photo.',
        );
      const values = mask.getAsFloat32Array();
      const matte = document.createElement('canvas');
      matte.width = mask.width;
      matte.height = mask.height;
      const mc = matte.getContext('2d')!;
      const pixels = mc.createImageData(mask.width, mask.height);
      let left = mask.width,
        top = mask.height,
        right = 0,
        bottom = 0,
        foreground = 0;
      for (let i = 0; i < values.length; i++) {
        const t = Math.max(0, Math.min(1, (values[i] - 0.2) / 0.6));
        pixels.data[i * 4 + 3] = Math.round(t * t * (3 - 2 * t) * 255);
        if (values[i] > 0.5) {
          const x = i % mask.width,
            y = Math.floor(i / mask.width);
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
          foreground++;
        }
      }
      if (foreground < values.length * 0.01)
        throw new Error(
          'No clear person found in one photo. Try a well-lit portrait or keep original backgrounds.',
        );
      mc.putImageData(pixels, 0, 0);
      const full = document.createElement('canvas');
      full.width = image.naturalWidth;
      full.height = image.naturalHeight;
      const ctx = full.getContext('2d')!;
      ctx.drawImage(image, 0, 0);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(matte, 0, 0, full.width, full.height);
      const x = (Math.max(0, left - 4) / mask.width) * full.width;
      const y = (Math.max(0, top - 4) / mask.height) * full.height;
      const w = Math.min(
        full.width - x,
        ((right - left + 9) / mask.width) * full.width,
      );
      const h = Math.min(
        full.height - y,
        ((bottom - top + 9) / mask.height) * full.height,
      );
      const cutout = document.createElement('canvas');
      cutout.width = Math.max(1, Math.ceil(w));
      cutout.height = Math.max(1, Math.ceil(h));
      cutout
        .getContext('2d')!
        .drawImage(full, x, y, w, h, 0, 0, cutout.width, cutout.height);
      return cutout;
    } finally {
      result.close();
    }
  })().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, task);
  while (cache.size > 8) cache.delete(cache.keys().next().value!);
  return task;
}

export function clearCutouts() {
  cache.clear();
}
