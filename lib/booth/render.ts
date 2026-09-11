import {
  coverCrop,
  frameRects,
  logicalSize,
  THEMES,
  FILTERS,
  getBackdropScene,
  type Shot,
  type BoothDesign,
  type Photo,
} from './model';
import { personCutout } from './cutout';

async function load(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = src;
  await image.decode();
  return image;
}
const sceneImages = new Map<string, Promise<HTMLImageElement>>();
async function loadScene(src: string) {
  if (!sceneImages.has(src)) {
    const request = load(src).catch((error) => {
      sceneImages.delete(src);
      throw error;
    });
    sceneImages.set(src, request);
  }
  return sceneImages.get(src)!;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  rect: { x: number; y: number; w: number; h: number },
) {
  const scale = Math.max(
    rect.w / image.naturalWidth,
    rect.h / image.naturalHeight,
  );
  const sourceWidth = rect.w / scale;
  const sourceHeight = rect.h / scale;
  ctx.drawImage(
    image,
    (image.naturalWidth - sourceWidth) / 2,
    (image.naturalHeight - sourceHeight) / 2,
    sourceWidth,
    sourceHeight,
    rect.x,
    rect.y,
    rect.w,
    rect.h,
  );
}
/** Preview, PNG and print sheets all use this one renderer. */
export async function renderBooth(
  shots: Shot[],
  design: BoothDesign,
  solo: boolean,
  scale = 2,
) {
  await document.fonts.ready;
  const size = logicalSize(design.layout),
    canvas = document.createElement('canvas');
  canvas.width = size.width * scale;
  canvas.height = size.height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Photo rendering is unavailable.');
  ctx.scale(scale, scale);
  const theme = THEMES[design.theme];
  ctx.fillStyle = theme.paper;
  ctx.fillRect(0, 0, size.width, size.height);
  ctx.fillStyle = theme.ink;
  ctx.textAlign = 'center';
  ctx.font = '600 26px "Playfair Display", Georgia';
  ctx.fillText('dearly us.', size.width / 2, 48);
  ctx.font = '10px sans-serif';
  ctx.fillText('TWO PLACES. ONE LITTLE MEMORY.', size.width / 2, 73);
  const images = new Map<string, HTMLImageElement>();
  const cutouts = new Map<string, HTMLCanvasElement>();
  const backdrop = getBackdropScene(design.backdrop);
  let backdropImage: HTMLImageElement | null = null;
  await Promise.all(
    shots
      .flatMap((s) => [s.left, s.right])
      .filter((p): p is Photo => Boolean(p))
      .map(async (p) => images.set(p.id, await load(p.src))),
  );
  if (design.composition === 'backdrop') {
    backdropImage = await loadScene(backdrop.image).catch(() => null);
    for (const [id, image] of images)
      cutouts.set(id, await personCutout(image));
  }
  for (const [index, rect] of frameRects(design.layout).entries()) {
    ctx.fillStyle = '#e7ded2';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    const shot = shots[index];
    const draw = (photo: Photo | undefined, x: number, width: number) => {
      if (!photo) {
        ctx.fillStyle = '#9e8a80';
        ctx.font = '14px sans-serif';
        ctx.fillText(
          'your moment goes here',
          x + width / 2,
          rect.y + rect.h / 2,
        );
        return;
      }
      const img = images.get(photo.id)!;
      if (design.composition === 'backdrop') {
        const person = cutouts.get(photo.id)!;
        const fit =
          Math.min(
            (solo ? rect.w * 0.85 : rect.w * 0.62) / person.width,
            (rect.h * 0.94) / person.height,
          ) * photo.crop.zoom;
        const w = person.width * fit,
          h = person.height * fit;
        const center = solo ? 0.5 : photo.side === 'left' ? 0.31 : 0.69;
        const px = rect.x + rect.w * (center + photo.crop.x * 0.22) - w / 2;
        const py = rect.y + rect.h - h + photo.crop.y * rect.h * 0.2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.w, rect.h);
        ctx.clip();
        ctx.save();
        ctx.filter = 'blur(6px)';
        ctx.fillStyle =
          backdrop.tone === 'dark'
            ? 'rgba(15, 9, 16, .42)'
            : 'rgba(55, 36, 39, .22)';
        ctx.beginPath();
        ctx.ellipse(
          px + w / 2,
          Math.min(rect.y + rect.h - 5, py + h - 2),
          Math.max(18, w * 0.22),
          Math.max(5, h * 0.018),
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.restore();
        ctx.filter = FILTERS[design.filter];
        if (photo.crop.mirror) {
          ctx.translate(px * 2 + w, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(person, px, py, w, h);
        ctx.restore();
        return;
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, rect.y, width, rect.h);
      ctx.clip();
      ctx.filter = FILTERS[design.filter];
      const c = coverCrop(
        img.naturalWidth,
        img.naturalHeight,
        width,
        rect.h,
        photo.crop,
      );
      if (photo.crop.mirror) {
        ctx.translate(x * 2 + width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(img, c.x, c.y, c.w, c.h, x, rect.y, width, rect.h);
      ctx.restore();
    };
    if (design.composition === 'backdrop') {
      ctx.fillStyle = backdrop.fallback;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      if (backdropImage) drawCover(ctx, backdropImage, rect);
    }
    draw(shot?.left, rect.x, solo ? rect.w : rect.w / 2);
    if (!solo) draw(shot?.right, rect.x + rect.w / 2, rect.w / 2);
    ctx.fillStyle = theme.ink;
    ctx.textAlign = 'left';
    ctx.font = '9px monospace';
    ctx.fillText(
      String(index + 1).padStart(2, '0'),
      rect.x,
      rect.y + rect.h + 17,
    );
    ctx.textAlign = 'center';
  }
  ctx.fillStyle = theme.ink;
  ctx.font = 'italic 23px "Playfair Display", Georgia';
  ctx.fillText(
    design.caption.slice(0, 60),
    size.width / 2,
    size.height - 66,
    size.width - 60,
  );
  ctx.font = '11px sans-serif';
  ctx.fillText(design.date, size.width / 2, size.height - 34);
  for (const sticker of design.stickers) {
    ctx.save();
    ctx.translate(sticker.x * size.width, sticker.y * size.height);
    ctx.rotate((sticker.rotation * Math.PI) / 180);
    ctx.fillStyle = theme.ink;
    ctx.font = `${sticker.size}px sans-serif`;
    ctx.fillText(sticker.text.slice(0, 24), 0, 0);
    ctx.restore();
  }
  for (const stroke of design.strokes ?? []) {
    if (stroke.points.length < 2) continue;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(
      stroke.points[0].x * size.width,
      stroke.points[0].y * size.height,
    );
    for (let index = 1; index < stroke.points.length - 1; index++) {
      const point = stroke.points[index],
        next = stroke.points[index + 1];
      ctx.quadraticCurveTo(
        point.x * size.width,
        point.y * size.height,
        ((point.x + next.x) / 2) * size.width,
        ((point.y + next.y) / 2) * size.height,
      );
    }
    const last = stroke.points.at(-1)!;
    ctx.lineTo(last.x * size.width, last.y * size.height);
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = Math.max(2, Math.min(28, stroke.width));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }
  return canvas;
}
export async function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error('Could not create your photo.')),
      'image/png',
    ),
  );
}
export async function printSheet(
  strip: HTMLCanvasElement,
  layout: BoothDesign['layout'],
) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1800;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 1200, 1800);
  if (layout === 'strip') {
    ctx.drawImage(strip, 0, 0, 600, 1800);
    ctx.drawImage(strip, 600, 0, 600, 1800);
  } else {
    ctx.drawImage(strip, 0, 0, 1200, 900);
    ctx.drawImage(strip, 0, 900, 1200, 900);
  }
  return canvas;
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
