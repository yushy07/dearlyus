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
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }

    // Background fill
    ctx.fillStyle = style.bg.startsWith('linear') ? '#FFFFFF' : style.bg;
    ctx.fillRect(0, 0, 600, 1600);

    // Exterior border
    ctx.strokeStyle = style.border;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(16, 16, 568, 1568);

    // Header Logo & Korean Title
    ctx.fillStyle = style.color;
    ctx.font = 'bold 24px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ANGIE · 인생네컷', 300, 62);

    // 4 Photo Frames
    for (let i = 0; i < 4; i++) {
      const y = 85 + i * 348;
      ctx.fillStyle = '#F8F9FB';
      ctx.fillRect(42, y, 516, 320);
      ctx.strokeStyle = style.border;
      ctx.strokeRect(42, y, 516, 320);

      // Frame number & serial
      ctx.fillStyle = '#8B8E98';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`0${i + 1} · ${coupleName.toUpperCase()}`, 300, y + 165);
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
    a.download = `angie-photostrip-${roomCode}.png`;
    a.href = dataUrl;
    a.click();

    resolve(dataUrl);
  });
}
