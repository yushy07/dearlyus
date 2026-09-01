/**
 * Thermal Date Lore Receipt Canvas Renderer
 * Renders vintage thermal-paper receipts with dot-matrix typography, barcodes, and tear lines.
 */

export interface ReceiptItem {
  number: string;
  topic: string;
  answerA: string;
  answerB: string;
  syncPercent: number;
}

export interface DateReceiptData {
  roomCode: string;
  date: string;
  partnerA: string;
  partnerB: string;
  items: ReceiptItem[];
  overallSync: number;
  hostVerdict: string;
}

export function drawReceiptToCanvas(canvas: HTMLCanvasElement, data: DateReceiptData) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = 600;
  const itemHeight = 70;
  const baseHeight = 520;
  const height = baseHeight + data.items.length * itemHeight;

  canvas.width = width;
  canvas.height = height;

  // Background: Thermal paper off-white
  ctx.fillStyle = '#FAF8F5';
  ctx.fillRect(0, 0, width, height);

  // Subtle paper grain/dither
  ctx.fillStyle = 'rgba(0, 0, 0, 0.015)';
  for (let i = 0; i < 400; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    ctx.fillRect(rx, ry, 2, 2);
  }

  // Draw jagged top paper tear
  ctx.fillStyle = '#E8E4DC';
  const teeth = 30;
  const toothWidth = width / teeth;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let i = 0; i < teeth; i++) {
    const x = i * toothWidth;
    ctx.lineTo(x + toothWidth / 2, 8);
    ctx.lineTo(x + toothWidth, 0);
  }
  ctx.lineTo(width, 0);
  ctx.lineTo(0, 0);
  ctx.fill();

  // Typography Styles
  ctx.fillStyle = '#222328';
  ctx.textAlign = 'center';

  // Receipt Header
  ctx.font = 'bold 22px "Space Mono", monospace, sans-serif';
  ctx.fillText('ANGIE DATE NIGHT LORE', width / 2, 50);

  ctx.font = '13px "Space Mono", monospace, sans-serif';
  ctx.fillStyle = '#555761';
  ctx.fillText(`ROOM: #${data.roomCode} · ${data.date}`, width / 2, 75);
  ctx.fillText(`${data.partnerA.toUpperCase()} ♡ ${data.partnerB.toUpperCase()}`, width / 2, 95);

  // Dashed Separator
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#BBB9B3';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(30, 115);
  ctx.lineTo(width - 30, 115);
  ctx.stroke();

  // Itemized Questions Table Header
  ctx.font = 'bold 12px "Space Mono", monospace, sans-serif';
  ctx.fillStyle = '#222328';
  ctx.textAlign = 'left';
  ctx.fillText('QTY  LORE TOPIC', 40, 138);
  ctx.textAlign = 'right';
  ctx.fillText('SYNC %', width - 40, 138);

  ctx.beginPath();
  ctx.moveTo(30, 148);
  ctx.lineTo(width - 30, 148);
  ctx.stroke();

  // Draw Items
  let y = 175;
  data.items.forEach((item, idx) => {
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px "Space Mono", monospace, sans-serif';
    ctx.fillStyle = '#17181C';
    ctx.fillText(`${item.number}   ${item.topic.toUpperCase().slice(0, 24)}`, 40, y);

    ctx.textAlign = 'right';
    ctx.font = 'bold 13px "Space Mono", monospace, sans-serif';
    ctx.fillStyle = item.syncPercent >= 80 ? '#0A7D4D' : '#8A5D3B';
    ctx.fillText(`${item.syncPercent}%`, width - 40, y);

    // Answers Breakdown
    ctx.textAlign = 'left';
    ctx.font = '11.5px "Space Mono", monospace, sans-serif';
    ctx.fillStyle = '#5B5E68';
    ctx.fillText(`     ${data.partnerA}: "${item.answerA.slice(0, 26)}"`, 40, y + 18);
    ctx.fillText(`     ${data.partnerB}: "${item.answerB.slice(0, 26)}"`, 40, y + 34);

    y += itemHeight;
  });

  // Summary Totals
  ctx.beginPath();
  ctx.moveTo(30, y + 10);
  ctx.lineTo(width - 30, y + 10);
  ctx.stroke();

  y += 35;
  ctx.textAlign = 'left';
  ctx.font = 'bold 14px "Space Mono", monospace, sans-serif';
  ctx.fillStyle = '#222328';
  ctx.fillText('SUBTOTAL: LOVE & SYNERGY', 40, y);
  ctx.textAlign = 'right';
  ctx.fillText('100.00%', width - 40, y);

  y += 24;
  ctx.textAlign = 'left';
  ctx.font = 'bold 16px "Space Mono", monospace, sans-serif';
  ctx.fillText('OVERALL COMPATIBILITY', 40, y);
  ctx.textAlign = 'right';
  ctx.font = 'bold 18px "Space Mono", monospace, sans-serif';
  ctx.fillStyle = '#FF7BA3';
  ctx.fillText(`${data.overallSync}%`, width - 40, y);

  // Host Verdict Box
  y += 32;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
  ctx.fillRect(30, y, width - 60, 50);
  ctx.strokeStyle = '#DDD9D0';
  ctx.strokeRect(30, y, width - 60, 50);

  ctx.textAlign = 'center';
  ctx.font = 'italic 12px "Space Mono", monospace, sans-serif';
  ctx.fillStyle = '#33353D';
  ctx.fillText(`“${data.hostVerdict.slice(0, 55)}”`, width / 2, y + 30);

  // Barcode Lines Generator
  y += 75;
  ctx.setLineDash([]);
  ctx.fillStyle = '#17181C';
  const barcodeWidth = width - 120;
  const barcodeStart = 60;
  for (let b = 0; b < 65; b++) {
    const bx = barcodeStart + (b * (barcodeWidth / 65));
    const bw = (b % 3 === 0 || b % 5 === 0) ? 3.5 : 1.5;
    ctx.fillRect(bx, y, bw, 42);
  }

  y += 56;
  ctx.font = '11px "Space Mono", monospace, sans-serif';
  ctx.fillStyle = '#6B6E78';
  ctx.fillText(`* ANGIE-${data.roomCode}-${Date.now().toString().slice(-6)} *`, width / 2, y);

  // Footer message
  y += 22;
  ctx.font = '11px "Space Mono", monospace, sans-serif';
  ctx.fillText('THANK YOU FOR VISITING · SAVE TO SCRAPBOOK', width / 2, y);

  // Bottom Jagged Tear
  ctx.fillStyle = '#E8E4DC';
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let i = 0; i < teeth; i++) {
    const x = i * toothWidth;
    ctx.lineTo(x + toothWidth / 2, height - 8);
    ctx.lineTo(x + toothWidth, height);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fill();
}

export function downloadReceiptPNG(data: DateReceiptData, filename?: string) {
  const canvas = document.createElement('canvas');
  drawReceiptToCanvas(canvas, data);
  const link = document.createElement('a');
  link.download = filename || `angie-date-receipt-${data.roomCode}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
