import type { ImageSegmenter } from '@mediapipe/tasks-vision';
import { cleanEdgeColours, refineConfidenceMask, type MatteQuality } from './matte';

let segmenter: Promise<ImageSegmenter> | undefined;
const cache = new Map<string, Promise<HTMLCanvasElement>>();
const CUTOUT_VERSION = 2;

export type RefinedCutout = HTMLCanvasElement & {
  quality?: MatteQuality;
  sourceCanvas?: HTMLCanvasElement;
  basePixels?: ImageData;
  undoPixels?: ImageData[];
};

export function cutoutQuality(canvas: HTMLCanvasElement) {
  return (canvas as RefinedCutout).quality;
}

type CutoutPoint = { x: number; y: number };

function strokePath(
  context: CanvasRenderingContext2D,
  points: CutoutPoint[],
  width: number,
  height: number,
) {
  context.beginPath();
  const first = points[0];
  context.moveTo(first.x * width, first.y * height);
  for (const point of points.slice(1)) context.lineTo(point.x * width, point.y * height);
  if (points.length === 1) context.lineTo(first.x * width + 0.01, first.y * height);
}

export async function editCutout(
  imageSrc: string,
  points: CutoutPoint[],
  mode: 'erase' | 'restore',
  brushSize: number,
) {
  const cutout = (await cache.get(`${CUTOUT_VERSION}:${imageSrc}`)) as RefinedCutout | undefined;
  if (!cutout || !points.length) throw new Error('Prepare this cutout before refining its edges.');
  const context = cutout.getContext('2d', { willReadFrequently: true })!;
  cutout.undoPixels ??= [];
  cutout.undoPixels.push(context.getImageData(0, 0, cutout.width, cutout.height));
  if (cutout.undoPixels.length > 8) cutout.undoPixels.shift();
  const lineWidth = Math.max(6, Math.min(100, brushSize)) * Math.min(cutout.width, cutout.height) / 700;
  if (mode === 'erase') {
    context.save();
    context.globalCompositeOperation = 'destination-out';
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = lineWidth;
    context.strokeStyle = '#000';
    strokePath(context, points, cutout.width, cutout.height);
    context.stroke();
    context.restore();
  } else if (cutout.sourceCanvas) {
    const restoreMask = document.createElement('canvas');
    restoreMask.width = cutout.width;
    restoreMask.height = cutout.height;
    const restoreContext = restoreMask.getContext('2d')!;
    restoreContext.lineCap = 'round';
    restoreContext.lineJoin = 'round';
    restoreContext.lineWidth = lineWidth;
    restoreContext.strokeStyle = '#000';
    strokePath(restoreContext, points, cutout.width, cutout.height);
    restoreContext.stroke();
    restoreContext.globalCompositeOperation = 'source-in';
    restoreContext.drawImage(cutout.sourceCanvas, 0, 0);
    context.drawImage(restoreMask, 0, 0);
  }
  return cutout;
}

export async function undoCutoutEdit(imageSrc: string) {
  const cutout = (await cache.get(`${CUTOUT_VERSION}:${imageSrc}`)) as RefinedCutout | undefined;
  const previous = cutout?.undoPixels?.pop();
  if (!cutout || !previous) return cutout;
  cutout.getContext('2d')!.putImageData(previous, 0, 0);
  return cutout;
}

export async function resetCutoutEdits(imageSrc: string) {
  const cutout = (await cache.get(`${CUTOUT_VERSION}:${imageSrc}`)) as RefinedCutout | undefined;
  if (!cutout?.basePixels) return cutout;
  cutout.getContext('2d')!.putImageData(cutout.basePixels, 0, 0);
  cutout.undoPixels = [];
  return cutout;
}

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
      if (refined.quality.foregroundRatio > 0.96)
        throw new Error(
          'The background could not be separated from this portrait. Try brighter, more even lighting.',
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
      cutout.sourceCanvas = document.createElement('canvas');
      cutout.sourceCanvas.width = cutout.width;
      cutout.sourceCanvas.height = cutout.height;
      cutout.sourceCanvas.getContext('2d')!.drawImage(image, x, y, w, h, 0, 0, cutout.width, cutout.height);
      cutout.basePixels = cutoutContext.getImageData(0, 0, cutout.width, cutout.height);
      cutout.undoPixels = [];
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
