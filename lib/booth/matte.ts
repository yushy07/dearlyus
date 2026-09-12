export type MatteQuality = {
  foregroundRatio: number;
  uncertainRatio: number;
  score: number;
  status: 'good' | 'fair' | 'poor';
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));

function smooth(values: Float32Array, width: number, height: number) {
  const output = new Float32Array(values.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let total = 0;
      let weight = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const py = Math.max(0, Math.min(height - 1, y + dy));
        for (let dx = -1; dx <= 1; dx++) {
          const px = Math.max(0, Math.min(width - 1, x + dx));
          const currentWeight = dx === 0 && dy === 0 ? 4 : dx === 0 || dy === 0 ? 2 : 1;
          total += values[py * width + px] * currentWeight;
          weight += currentWeight;
        }
      }
      output[y * width + x] = total / weight;
    }
  }
  return output;
}

function closeSmallGaps(values: Float32Array, width: number, height: number) {
  const expanded = new Float32Array(values.length);
  const closed = new Float32Array(values.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let high = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const px = Math.max(0, Math.min(width - 1, x + dx));
          const py = Math.max(0, Math.min(height - 1, y + dy));
          high = Math.max(high, values[py * width + px]);
        }
      }
      expanded[y * width + x] = high;
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let low = 1;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const px = Math.max(0, Math.min(width - 1, x + dx));
          const py = Math.max(0, Math.min(height - 1, y + dy));
          low = Math.min(low, expanded[py * width + px]);
        }
      }
      closed[y * width + x] = low;
    }
  }
  return closed;
}

function removeFragments(values: Float32Array, width: number, height: number) {
  const visited = new Uint8Array(values.length);
  const components: number[][] = [];
  for (let start = 0; start < values.length; start++) {
    if (visited[start] || values[start] < 0.18) continue;
    const queue = [start];
    const component: number[] = [];
    visited[start] = 1;
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const index = queue[cursor];
      component.push(index);
      const x = index % width;
      const y = Math.floor(index / width);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if ((!dx && !dy) || x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) continue;
          const next = (y + dy) * width + x + dx;
          if (!visited[next] && values[next] >= 0.18) {
            visited[next] = 1;
            queue.push(next);
          }
        }
      }
    }
    components.push(component);
  }
  components.sort((a, b) => b.length - a.length);
  const largest = components[0]?.length ?? 0;
  const keep = new Uint8Array(values.length);
  for (const component of components) {
    if (component.length < Math.max(10, largest * 0.025)) continue;
    for (const index of component) keep[index] = 1;
  }
  const output = values.slice();
  for (let index = 0; index < output.length; index++) {
    if (!keep[index]) output[index] = 0;
  }
  return output;
}

export function refineConfidenceMask(
  confidence: Float32Array,
  width: number,
  height: number,
) {
  const softened = smooth(confidence, width, height);
  const curved = new Float32Array(softened.length);
  for (let index = 0; index < softened.length; index++) {
    const normalized = clamp((softened[index] - 0.3) / 0.42);
    const eased = normalized * normalized * (3 - 2 * normalized);
    curved[index] = softened[index] > 0.82 ? 1 : eased;
  }
  const closed = closeSmallGaps(curved, width, height);
  const cleaned = removeFragments(closed, width, height);
  const finalMask = smooth(cleaned, width, height);
  let foreground = 0;
  let uncertain = 0;
  for (let index = 0; index < finalMask.length; index++) {
    if (finalMask[index] > 0.5) foreground++;
    if (finalMask[index] > 0.06 && finalMask[index] < 0.94) uncertain++;
  }
  const foregroundRatio = foreground / finalMask.length;
  const uncertainRatio = uncertain / Math.max(1, foreground);
  const coverageScore = foregroundRatio >= 0.035 && foregroundRatio <= 0.88 ? 1 : 0;
  const edgeScore = Math.max(0, 1 - uncertainRatio / 0.62);
  const score = Math.round((coverageScore * 0.55 + edgeScore * 0.45) * 100);
  return {
    alpha: finalMask,
    quality: {
      foregroundRatio,
      uncertainRatio,
      score,
      status: score >= 72 ? 'good' : score >= 48 ? 'fair' : 'poor',
    } satisfies MatteQuality,
  };
}

export function cleanEdgeColours(
  pixels: Uint8ClampedArray,
  alpha: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const source = pixels.slice();
  const offsets = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [1, -1], [-1, 1], [1, 1],
  ];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const opacity = alpha[index];
      if (opacity <= 4 || opacity >= 246) continue;
      let red = 0, green = 0, blue = 0, samples = 0;
      for (let radius = 1; radius <= 8 && samples < 2; radius++) {
        for (const [dx, dy] of offsets) {
          const px = x + dx * radius;
          const py = y + dy * radius;
          if (px < 0 || px >= width || py < 0 || py >= height) continue;
          const nearby = py * width + px;
          if (alpha[nearby] < 238) continue;
          red += source[nearby * 4];
          green += source[nearby * 4 + 1];
          blue += source[nearby * 4 + 2];
          samples++;
        }
      }
      if (!samples) continue;
      const blend = Math.min(0.92, (1 - opacity / 255) * 1.15);
      pixels[index * 4] = source[index * 4] * (1 - blend) + (red / samples) * blend;
      pixels[index * 4 + 1] = source[index * 4 + 1] * (1 - blend) + (green / samples) * blend;
      pixels[index * 4 + 2] = source[index * 4 + 2] * (1 - blend) + (blue / samples) * blend;
    }
  }
}
