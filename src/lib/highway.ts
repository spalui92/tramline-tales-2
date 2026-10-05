// The highway in perspective, shared by the page (first frame) and the script that
// keeps it moving. `phase` slides every dash one step closer to the reader as it
// grows from 0 to 1, so animating it makes the road roll toward you without end.
export type RoadSpec = { w: number; h: number; half0: number; half1: number; dash0: number; dash1: number; n: number };

export const ROADS: Record<'phone' | 'wide', RoadSpec> = {
  phone: { w: 390, h: 300, half0: 14, half1: 264, dash0: 0.4, dash1: 3.6, n: 14 },
  wide: { w: 1440, h: 300, half0: 26, half1: 820, dash0: 0.7, dash1: 8.5, n: 14 },
};

const f = (n: number) => n.toFixed(1);

export function road(s: RoadSpec, phase = 0) {
  const cx = s.w / 2;
  const half = (t: number) => s.half0 + t * (s.half1 - s.half0);
  const mid: string[] = [], lanes: string[] = [];
  for (let i = 0; i < s.n; i++) {
    // dashes bunch up near the horizon and stretch out as they come closer
    const u = ((i + phase) % s.n) / s.n;
    const t1 = Math.pow(u, 1.7), t2 = Math.pow(u + 0.55 / s.n, 1.7);
    const y1 = t1 * s.h, y2 = t2 * s.h;
    const w1 = s.dash0 + t1 * (s.dash1 - s.dash0), w2 = s.dash0 + t2 * (s.dash1 - s.dash0);
    const quad = (x1: number, x2: number) => `M${f(x1 - w1)} ${f(y1)}L${f(x1 + w1)} ${f(y1)}L${f(x2 + w2)} ${f(y2)}L${f(x2 - w2)} ${f(y2)}Z`;
    mid.push(quad(cx, cx));
    lanes.push(quad(cx - half(t1) * 0.5, cx - half(t2) * 0.5), quad(cx + half(t1) * 0.5, cx + half(t2) * 0.5));
  }
  const edges = [-1, 1].map((side) => `M${f(cx + side * half(0))} 0L${f(cx + side * half(1))} ${s.h}`);
  return { mid, lanes, edges };
}
