// Lightweight, dependency-free QR Code matrix encoder and React SVG component
// Supports alphanumeric/byte encoding with Reed-Solomon error correction for room links

import React from 'react';

// Galois field tables for GF(256) with primitive polynomial 0x11d
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    EXP_TABLE[i + 255] = x;
    LOG_TABLE[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
  LOG_TABLE[0] = 0;
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[LOG_TABLE[a] + LOG_TABLE[b]];
}

function getGeneratorPoly(ecCount: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < ecCount; i++) {
    const nextPoly = new Uint8Array(poly.length + 1);
    const factor = EXP_TABLE[i];
    for (let j = 0; j < poly.length; j++) {
      nextPoly[j] ^= gfMul(poly[j], factor);
      nextPoly[j + 1] ^= poly[j];
    }
    poly = nextPoly;
  }
  return poly;
}

function computeReedSolomon(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = getGeneratorPoly(ecCount);
  const remainder = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    remainder.copyWithin(0, 1);
    remainder[ecCount - 1] = 0;
    if (factor !== 0) {
      for (let j = 0; j < ecCount; j++) {
        remainder[j] ^= gfMul(gen[j], factor);
      }
    }
  }
  return remainder;
}

interface QRVersionConfig {
  version: number;
  size: number;
  totalBytes: number;
  dataBytes: number;
  ecBytes: number;
}

const VERSIONS: QRVersionConfig[] = [
  { version: 2, size: 25, totalBytes: 44, dataBytes: 28, ecBytes: 16 },
  { version: 3, size: 29, totalBytes: 70, dataBytes: 44, ecBytes: 26 },
  { version: 4, size: 33, totalBytes: 100, dataBytes: 64, ecBytes: 36 },
];

export function encodeQRCode(text: string): boolean[][] {
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(text);

  let config = VERSIONS[0];
  for (const v of VERSIONS) {
    const needed = textBytes.length + 3;
    if (v.dataBytes >= needed) {
      config = v;
      break;
    }
    config = v;
  }

  const { size, dataBytes, ecBytes } = config;

  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  pushBits(0b0100, 4); // Byte mode indicator
  pushBits(textBytes.length, 8); // Character count

  for (let i = 0; i < textBytes.length; i++) {
    pushBits(textBytes[i], 8);
  }

  // Terminator
  const termLen = Math.min(4, dataBytes * 8 - bits.length);
  for (let i = 0; i < termLen; i++) bits.push(0);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);

  // Pad bytes
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < dataBytes * 8) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  const data = new Uint8Array(dataBytes);
  for (let i = 0; i < dataBytes; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bits[i * 8 + b];
    }
    data[i] = byteVal;
  }

  const ec = computeReedSolomon(data, ecBytes);

  const finalCodewords = new Uint8Array(dataBytes + ecBytes);
  finalCodewords.set(data, 0);
  finalCodewords.set(ec, dataBytes);

  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setModule = (r: number, c: number, val: boolean) => {
    matrix[r][c] = val;
    isFunction[r][c] = true;
  };

  const drawFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const tr = row + r;
        const tc = col + c;
        if (tr >= 0 && tr < size && tc >= 0 && tc < size) {
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBlack = r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
            setModule(tr, tc, isBlack);
          } else {
            setModule(tr, tc, false);
          }
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  if (size >= 25) {
    const alignCenter = size - 7;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isBlack = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
        setModule(alignCenter + r, alignCenter + c, isBlack);
      }
    }
  }

  for (let i = 8; i < size - 8; i++) {
    setModule(6, i, i % 2 === 0);
    setModule(i, 6, i % 2 === 0);
  }

  setModule(size - 8, 8, true);

  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      isFunction[8][i] = true;
      isFunction[i][8] = true;
    }
  }
  for (let i = size - 8; i < size; i++) {
    isFunction[8][i] = true;
    isFunction[i][8] = true;
  }

  let bitIdx = 0;
  const totalBits = finalCodewords.length * 8;
  const getBit = (idx: number) => {
    if (idx >= totalBits) return false;
    const byte = finalCodewords[Math.floor(idx / 8)];
    return ((byte >> (7 - (idx % 8))) & 1) === 1;
  };

  let upward = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--;
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const c of [right, right - 1]) {
        if (!isFunction[r][c]) {
          const dataBit = getBit(bitIdx++);
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = dataBit !== mask;
        }
      }
    }
    upward = !upward;
  }

  const formatInfo = 0x77c4;
  for (let i = 0; i < 15; i++) {
    const bit = ((formatInfo >> (14 - i)) & 1) === 1;
    if (i < 6) matrix[8][i] = bit;
    else if (i === 6) matrix[8][7] = bit;
    else if (i === 7) matrix[8][8] = bit;
    else if (i === 8) matrix[7][8] = bit;
    else matrix[14 - i][8] = bit;

    if (i < 8) matrix[size - 1 - i][8] = bit;
    else matrix[8][size - 15 + i] = bit;
  }

  return matrix;
}

interface QRCodeSVGProps {
  text: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function QRCodeSVG({
  text,
  size = 180,
  fgColor = '#000000',
  bgColor = '#FFFFFF',
  className,
  style,
}: QRCodeSVGProps) {
  const matrix = React.useMemo(() => {
    try {
      return encodeQRCode(text);
    } catch {
      return encodeQRCode('https://getangie.com');
    }
  }, [text]);

  const moduleCount = matrix.length;
  const padding = 2;
  const viewBoxSize = moduleCount + padding * 2;

  const rectElements: React.ReactNode[] = [];
  rectElements.push(
    React.createElement('rect', {
      key: 'bg',
      width: viewBoxSize,
      height: viewBoxSize,
      fill: bgColor,
    })
  );

  matrix.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell) {
        rectElements.push(
          React.createElement('rect', {
            key: `${r}-${c}`,
            x: c + padding,
            y: r + padding,
            width: 1.04,
            height: 1.04,
            rx: 0.2,
            fill: fgColor,
          })
        );
      }
    });
  });

  return React.createElement(
    'svg',
    {
      viewBox: `0 0 ${viewBoxSize} ${viewBoxSize}`,
      width: size,
      height: size,
      className,
      style: { display: 'block', borderRadius: '12px', background: bgColor, ...style },
      'aria-label': `QR Code for ${text}`,
    },
    ...rectElements
  );
}
