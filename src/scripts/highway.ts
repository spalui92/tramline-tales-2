// Keeps the highway rolling: every dash slides steadily toward the reader and a new
// one appears at the horizon, without end. Runs only while the hero is on screen
// and only for the road that is showing (desktop or phone). With reduced motion
// the road stays as drawn.
import gsap from 'gsap';
import { ROADS, road } from '../lib/highway';

const SPEED = 0.85; // dashes per second

export function initHighways(hero: HTMLElement, motion: boolean) {
  if (!motion) return;
  const roads = Array.from(hero.querySelectorAll<SVGSVGElement>('[data-highway]')).map((svg) => ({
    svg,
    spec: ROADS[svg.dataset.highway as 'phone' | 'wide'],
    mid: Array.from(svg.querySelectorAll<SVGPathElement>('.mid')),
    lanes: Array.from(svg.querySelectorAll<SVGPathElement>('.lane')),
    shown: false,
  }));
  // which road is showing can change with the window (and isn't settled until the styles
  // have applied), so look again every half second rather than only once
  const check = () => roads.forEach((r) => { r.shown = getComputedStyle(r.svg).display !== 'none'; });
  let sinceCheck = Infinity;

  let visible = true, phase = 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
  gsap.ticker.add((_, dt) => {
    if (!visible) return;
    sinceCheck += dt;
    if (sinceCheck > 500) { check(); sinceCheck = 0; }
    phase = (phase + (dt / 1000) * SPEED) % 1000;
    for (const r of roads) {
      if (!r.shown) continue;
      const g = road(r.spec, phase % r.spec.n);
      r.mid.forEach((p, i) => p.setAttribute('d', g.mid[i]));
      r.lanes.forEach((p, i) => p.setAttribute('d', g.lanes[i]));
    }
  });
}
