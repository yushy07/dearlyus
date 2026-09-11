'use client';

import type { CourtSnapshot } from './court';

export async function createCourtRuling(
  snapshot: CourtSnapshot,
  partnerA: string,
  partnerB: string,
) {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext('2d');
  if (!ctx || !snapshot.verdict) throw new Error('The ruling is not ready.');
  ctx.fillStyle = '#f5eddf';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#713d4c';
  ctx.lineWidth = 5;
  ctx.strokeRect(54, 54, 1092, 1392);
  ctx.strokeStyle = '#b89a67';
  ctx.lineWidth = 2;
  ctx.strokeRect(72, 72, 1056, 1356);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#713d4c';
  ctx.font = '700 34px Georgia';
  ctx.fillText('DEARLY US · TINY COUPLES COURT', 600, 145);
  ctx.fillStyle = '#443137';
  ctx.font = 'italic 30px Georgia';
  ctx.fillText(`${partnerA}  ♡  ${partnerB}`, 600, 202);
  ctx.font = '700 60px Georgia';
  wrap(ctx, snapshot.verdict.title, 600, 320, 940, 72);
  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#806a68';
  wrap(ctx, snapshot.topic, 600, 470, 880, 32);
  ctx.fillStyle = '#fff9ef';
  ctx.fillRect(130, 555, 940, 345);
  ctx.strokeStyle = '#c89a9f';
  ctx.strokeRect(130, 555, 940, 345);
  ctx.fillStyle = '#443137';
  ctx.font = '26px Georgia';
  wrap(ctx, snapshot.verdict.funnyReason, 600, 640, 800, 42);
  ctx.fillStyle = '#713d4c';
  ctx.font = '700 22px sans-serif';
  ctx.fillText('THE TINY SENTENCE', 600, 970);
  ctx.font = 'italic 34px Georgia';
  wrap(ctx, snapshot.verdict.playfulSentence, 600, 1040, 850, 50);
  ctx.fillStyle = '#b89a67';
  ctx.beginPath();
  ctx.arc(600, 1270, 74, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff9ef';
  ctx.font = '54px Georgia';
  ctx.fillText('♡', 600, 1290);
  ctx.fillStyle = '#806a68';
  ctx.font = 'italic 24px Georgia';
  ctx.fillText(snapshot.verdict.judgeClosingLine, 600, 1400, 900);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('Could not print the ruling.')),
      'image/png',
    ),
  );
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = '';
  let row = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + row * lineHeight);
      line = word;
      row++;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y + row * lineHeight);
}

export function downloadCourtRuling(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `dearly-us-tiny-court-ruling-${new Date().toISOString().slice(0, 10)}.png`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
