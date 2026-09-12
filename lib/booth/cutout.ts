import type { ImageSegmenter } from '@mediapipe/tasks-vision';
import { cleanEdgeColours, refineConfidenceMask, type MatteQuality } from './matte';

let segmenter: Promise<ImageSegmenter> | undefined;
const cache = new Map<string, Promise<HTMLCanvasElement>>();
const CUTOUT_VERSION = 2;

export type RefinedCutout = HTMLCanvasElement & { quality?: MatteQuality };

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
  const key = `${CUTOUT_VERSION}:${image.src}`;
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
      const refined = refineConfidenceMask(values, mask.width, mask.height);
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
      for (let i = 0; i < refined.alpha.length; i++) {
        pixels.data[i * 4 + 3] = Math.round(refined.alpha[i] * 255);
        if (refined.alpha[i] > 0.08) {
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
      const x = (Math.max(0, left - 3) / mask.width) * image.naturalWidth;
      const y = (Math.max(0, top - 3) / mask.height) * image.naturalHeight;
      const w = Math.min(image.naturalWidth - x, ((right - left + 7) / mask.width) * image.naturalWidth);
      const h = Math.min(image.naturalHeight - y, ((bottom - top + 7) / mask.height) * image.naturalHeight);
      const cutout = document.createElement('canvas') as RefinedCutout;
      cutout.width = Math.max(1, Math.ceil(w));
      cutout.height = Math.max(1, Math.ceil(h));
      const cutoutContext = cutout.getContext('2d', { willReadFrequently: true })!;
      cutoutContext.drawImage(image, x, y, w, h, 0, 0, cutout.width, cutout.height);
      const scaledMatte = document.createElement('canvas');
      scaledMatte.width = cutout.width;
      scaledMatte.height = cutout.height;
      const scaledContext = scaledMatte.getContext('2d')!;
      scaledContext.imageSmoothingEnabled = true;
      scaledContext.imageSmoothingQuality = 'high';
      scaledContext.drawImage(
        matte,
        (x / image.naturalWidth) * mask.width,
        (y / image.naturalHeight) * mask.height,
        (w / image.naturalWidth) * mask.width,
        (h / image.naturalHeight) * mask.height,
        0,
        0,
        cutout.width,
        cutout.height,
      );
      const subject = cutoutContext.getImageData(0, 0, cutout.width, cutout.height);
      const scaledPixels = scaledContext.getImageData(0, 0, cutout.width, cutout.height).data;
      const alpha = new Uint8ClampedArray(cutout.width * cutout.height);
      for (let index = 0; index < alpha.length; index++) alpha[index] = scaledPixels[index * 4 + 3];
      cleanEdgeColours(subject.data, alpha, cutout.width, cutout.height);
      for (let index = 0; index < alpha.length; index++) subject.data[index * 4 + 3] = alpha[index];
      cutoutContext.putImageData(subject, 0, 0);
      cutout.quality = refined.quality;
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
