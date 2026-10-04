// The Hooghly at night, under Howrah Bridge: a single fragment shader.
// Dark water, warm city haze on the horizon, and the bridge lamps reflected
// as broken streaks that ripple. The pointer stirs the water. It renders at
// reduced resolution, only while the hero is on screen, and draws a single
// still frame when motion is reduced. Without WebGL the CSS fallback shows.

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uHorizon;
uniform float uGap;
uniform float uOffset;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y);
}
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; } return v; }

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes;
  float aspect = uRes.x / uRes.y;
  float h = uHorizon;
  vec3 col;

  // sky: ink above, a sodium-lit haze sitting on the far bank
  float sy = max(uv.y - h, 0.);
  vec3 sky = vec3(.047, .043, .036);
  sky += vec3(.32, .16, .06) * exp(-sy * 8.) * .5;
  sky += .03 * fbm(vec2(uv.x * 2.5 + uTime * .015, uv.y * 5.)) * vec3(1., .8, .6);

  if (uv.y >= h) {
    col = sky;
  } else {
    float d = h - uv.y;
    float z = 1. / (d * 6. + .06);
    vec2 p = vec2((uv.x - .5) * aspect * z * .9, z + uTime * .32);
    float waves = fbm(p * vec2(2.2, 1.3));
    float fine = noise(vec2(uv.x * aspect * 90. * (d + .08), z * 14. + uTime * 1.3));

    vec2 dm = (uv - uMouse) * vec2(aspect, 1.);
    float r = length(dm);
    float ring = sin(r * 70. - uTime * 5.) * exp(-r * 6.);

    float wob = (waves - .5) * .06 * (d * 3. + .25) + ring * .012;
    vec3 water = vec3(.018, .022, .03) + vec3(.22, .12, .05) * exp(-d * 13.) * .55;
    water += vec3(.03, .034, .044) * waves;

    // each bridge lamp throws a broken column of light down the water
    float x = uv.x + wob;
    float k = (x - uOffset) / uGap;
    float cell = fract(k) - .5;
    float lamp = .45 + .55 * hash(vec2(floor(k + .5), 3.1));
    float width = .0016 + d * .009;
    float streak = exp(-pow(cell * uGap / width, 2.));
    float broken = smoothstep(.5, .85, fine * .6 + waves * .5);
    float refl = streak * broken * lamp * lamp * exp(-d * 4.5) * .85;
    col = water + vec3(1., .62, .25) * refl;
    col += vec3(.4, .25, .12) * pow(max(0., 1. - d * 28.), 3.) * .22 * (.6 + .4 * fine);
    col += vec3(.9, .55, .25) * max(ring, 0.) * .02 * exp(-d * 2.);
  }

  col += (hash(frag + fract(uTime)) - .5) * .03;
  float v = smoothstep(1.35, .35, length((uv - .5) * vec2(aspect * .7, 1.)));
  col *= mix(.5, 1., v);
  gl_FragColor = vec4(col, 1.);
}`;

export function initRiver(canvas: HTMLCanvasElement, hero: HTMLElement, motion: boolean) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) { canvas.remove(); return; }

  const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = u('uRes'), uTime = u('uTime'), uMouse = u('uMouse'), uHorizon = u('uHorizon'), uGap = u('uGap'), uOffset = u('uOffset');

  const mouse = { x: 0.5, y: 0.2, tx: 0.5, ty: 0.2 };

  // line the water up with wherever the bridge drawing actually sits
  function measure() {
    const scale = Math.min(devicePixelRatio || 1, 1.5) * 0.75;
    const w = hero.clientWidth, hgt = hero.clientHeight;
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(hgt * scale);
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.uniform2f(uRes, canvas.width, canvas.height);
    const bridge = hero.querySelector('.bridge:not(.mirror)');
    const hr = hero.getBoundingClientRect();
    if (bridge) {
      const br = bridge.getBoundingClientRect();
      gl!.uniform1f(uHorizon, (hr.bottom - br.bottom) / hgt);
      gl!.uniform1f(uGap, (56 / 1600) * br.width / w);
      gl!.uniform1f(uOffset, (br.left - hr.left + (30 / 1600) * br.width) / w);
    } else {
      gl!.uniform1f(uHorizon, 0.36); gl!.uniform1f(uGap, 0.04); gl!.uniform1f(uOffset, 0.02);
    }
  }

  let visible = true, raf = 0;
  const start = performance.now();
  function frame(now: number) {
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    gl!.uniform1f(uTime, (now - start) / 1000);
    gl!.uniform2f(uMouse, mouse.x, mouse.y);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    if (motion && visible) raf = requestAnimationFrame(frame);
  }

  measure();
  if (!motion) {
    gl.uniform1f(uTime, 14); gl.uniform2f(uMouse, -1, -1); gl.drawArrays(gl.TRIANGLES, 0, 3);
    addEventListener('resize', () => { measure(); gl.uniform1f(uTime, 14); gl.drawArrays(gl.TRIANGLES, 0, 3); });
    return;
  }
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = window.setTimeout(measure, 120); });
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    mouse.tx = (e.clientX - r.left) / r.width;
    mouse.ty = 1 - (e.clientY - r.top) / r.height;
  });
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(frame);
  }).observe(hero);
}
