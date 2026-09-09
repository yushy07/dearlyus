/**
 * Photobooth Bezier Vector Math
 * Converts discrete pointer coordinate points into smooth quadratic bezier curves.
 */
export function pointsToBezierPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  if (pts.length === 2) {
    return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  }

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x} ${pts[i].y}, ${xc} ${yc}`;
  }
  const last = pts[pts.length - 1];
  const secondLast = pts[pts.length - 2];
  d += ` Q ${secondLast.x} ${secondLast.y}, ${last.x} ${last.y}`;
  return d;
}
