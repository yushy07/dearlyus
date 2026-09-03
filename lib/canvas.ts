import { RoomStyle } from '@/types';

interface RenderStripOptions {
  style: RoomStyle;
  shots: string[];
  coupleName: string;
  roomCode: string;
  stickers?: string[];
}

export function exportPhotostripPNG({
  style,
  shots,
  coupleName,
  roomCode,
}: RenderStripOptions): Promise<string> {
  return new Promise(async (resolve) => {
    if (typeof document === 'undefined') {
      resolve('');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }

    // Background fill
    if (style.foilEffect === 'matte-foil') {
      ctx.fillStyle = '#101216';
    } else if (style.bg.startsWith('linear')) {
      const grad = ctx.createLinearGradient(0, 0, 0, 1600);
      grad.addColorStop(0, '#FFE4D6');
      grad.addColorStop(1, '#FFD6E8');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = style.bg;
    }
    ctx.fillRect(0, 0, 600, 1600);

    // Exterior border
    ctx.strokeStyle = style.border;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(16, 16, 568, 1568);

    // Header Logo & Korean Title
    ctx.fillStyle = style.color;
    ctx.font = 'bold 24px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DEARLY US · 인생네컷', 300, 62);

    // Load actual images
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((res) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => res(img);
        img.onerror = () => res(img);
        img.src = src;
      });
    };

    const loadedImages = await Promise.all(shots.map((s) => loadImage(s)));

    // 4 Photo Frames
    for (let i = 0; i < 4; i++) {
      const y = 85 + i * 348;
      ctx.fillStyle = '#FAF8F5';
      ctx.fillRect(42, y, 516, 320);

      const img = loadedImages[i];
      if (img && img.width > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(42, y, 516, 320);
        ctx.clip();
        const imgRatio = img.width / img.height;
        const frameRatio = 516 / 320;
        let dw = 516;
        let dh = 320;
        let dx = 42;
        let dy = y;
        if (imgRatio > frameRatio) {
          dw = 320 * imgRatio;
          dx = 42 - (dw - 516) / 2;
        } else {
          dh = 516 / imgRatio;
          dy = y - (dh - 320) / 2;
        }
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      } else {
        // Frame number fallback
        ctx.fillStyle = '#8B8E98';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`0${i + 1} · ${coupleName.toUpperCase()}`, 300, y + 165);
      }

      ctx.strokeStyle = style.border;
      ctx.strokeRect(42, y, 516, 320);
    }

    // Footer Names & Date
    ctx.fillStyle = style.color;
    ctx.font = 'bold 22px Pretendard, sans-serif';
    ctx.fillText(coupleName, 300, 1515);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#5B5E68';
    ctx.fillText(`ROOM: ${roomCode} · ${new Date().toLocaleDateString()}`, 300, 1545);

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = `dearly-us-photostrip-${roomCode}.png`;
    a.href = dataUrl;
    a.click();

    resolve(dataUrl);
  });
}
