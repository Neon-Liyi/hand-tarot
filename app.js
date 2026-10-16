/* 手势塔罗 · 引擎：手部追踪 → 惯性滑动 → 指认选中 → 捏合翻牌 + 光效/粒子/星云 */
import { FilesetResolver, HandLandmarker } from './vendor/vision_bundle.js';
import { CARDS, cardFrontSVG, cardBackSVG, cardBackDefs, ROMAN, cardArtURL } from './art.js?v=82';
import { SPREADS, SPREAD_BY_ID } from './spreads.js?v=82';
import * as READING from './reading.js?v=82';
import * as HIST from './history.js?v=82';

/* ============================ 0. 小工具 ============================ */
const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const fmt = (n) => (Math.round(n * 1000) / 1000);
const params = new URLSearchParams(location.search);

const N = CARDS.length;
let VW = innerWidth, VH = innerHeight;

/* ============================ 1. 背景：星云 + 星场 + 金尘 + 法阵 ============================ */
const bg = $('#bg'), bgx = bg.getContext('2d');
const hand = $('#handLayer'), hctx = hand.getContext('2d');
const fx = $('#fx'), fxc = fx.getContext('2d');
let DPR = Math.min(devicePixelRatio || 1, 1.5);

function sizeCanvas() {
  VW = innerWidth; VH = innerHeight; DPR = Math.min(devicePixelRatio || 1, 1.5);
  for (const c of [bg, fx, hand]) {
    c.width = Math.floor(VW * DPR); c.height = Math.floor(VH * DPR);
    c.style.width = VW + 'px'; c.style.height = VH + 'px';
  }
  bgx.setTransform(DPR, 0, 0, DPR, 0, 0); fxc.setTransform(DPR, 0, 0, DPR, 0, 0); hctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  bgBase = null;                                   // 尺寸变了，底色渐变随新尺寸重建
  layoutParams();
}

/* 星场分远近两层（远景慢、近景快）+ 一条斜向星河，构成视差纵深 */
const STARS_FAR = Array.from({ length: 150 }, () => ({
  x: Math.random(), y: Math.random(), r: rand(.5, 1.1),
  tw: rand(0, 6.2832), ts: rand(.22, .8), a: rand(.16, .46)
}));
const STARS_NEAR = Array.from({ length: 78 }, () => ({
  x: Math.random(), y: Math.random(), r: rand(.8, 1.9), z: rand(.55, 1),
  tw: rand(0, 6.2832), ts: rand(.5, 1.7), a: rand(.34, .92)
}));
const GALAXY = Array.from({ length: 54 }, () => ({
  u: Math.random(), v: rand(-.30, .30), r: rand(.4, 1.4), tw: rand(0, 6.2832), a: rand(.12, .5)
}));
const DUST = Array.from({ length: 90 }, () => ({
  x: Math.random(), y: Math.random(), r: rand(.6, 2.4), sp: rand(4, 16),
  ph: rand(0, 6.3), z: rand(.4, 1), hue: Math.random() < .35 ? 'pink' : 'gold'
}));
const NEB = [
  { x: .22, y: .18, r: .52, c: [88, 78, 220], dx: .010, dy: .006, p: 0, z: .35 },
  { x: .80, y: .30, r: .46, c: [214, 96, 190], dx: -.008, dy: .009, p: 1.7, z: .55 },
  { x: .50, y: .92, r: .60, c: [42, 130, 200], dx: .006, dy: -.007, p: 3.1, z: .25 },
  { x: .34, y: .62, r: .38, c: [120, 96, 232], dx: .005, dy: .008, p: 4.6, z: .80 }
];

/* —— 帧外缓存：底色渐变 / 星云精灵 / 星尘配色，避免主循环里反复建渐变与字符串 —— */
let bgBase = null;
const STAR_COL = Array.from({ length: 33 }, (_, k) => `rgba(226,232,255,${(k / 32).toFixed(3)})`);
const DUST_COL = {
  pink: Array.from({ length: 33 }, (_, k) => `rgba(255,160,214,${(k / 32).toFixed(3)})`),
  gold: Array.from({ length: 33 }, (_, k) => `rgba(240,212,150,${(k / 32).toFixed(3)})`)
};
/* 法阵配色：按呼吸亮度量化成 0..32 档缓存，避免每帧拼颜色串 */
const rub = (r, g, b, m) => Array.from({ length: 33 }, (_, k) => `rgba(${r},${g},${b},${(m * k / 32).toFixed(3)})`);
const RUNE = {
  ring: rub(214, 178, 106, .13), ring2: rub(180, 206, 255, .10),
  dash: rub(160, 190, 255, .12), dash2: rub(214, 178, 106, .10),
  tick: rub(214, 178, 106, .115), tick2: rub(214, 178, 106, .060),
  dot: rub(255, 206, 140, .16), mark: rub(206, 226, 255, .14)
};
const DASH_RUNE_A = [1.5, 8], DASH_RUNE_B = [2.5, 6];   // 虚线数组挪到帧外，避免每帧新建
const STAR_ORDER = [...STARS_FAR.keys()].sort(() => Math.random() - .5);
const NEAR_ORDER = [...STARS_NEAR.keys()].sort(() => Math.random() - .5);
const DUST_ORDER = [...DUST.keys()].sort(() => Math.random() - .5);
function softSprite(stops) {                     // 预渲染一张径向软光球，替代每帧 createRadialGradient
  const s = document.createElement('canvas'); s.width = s.height = 256;
  const g = s.getContext('2d');
  const rg = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [o, c] of stops) rg.addColorStop(o, c);
  g.fillStyle = rg; g.beginPath(); g.arc(128, 128, 128, 0, 6.2832); g.fill();
  return s;
}
const NEB_SPRITES = NEB.map(n => softSprite([
  [0, `rgba(${n.c[0]},${n.c[1]},${n.c[2]},.20)`],
  [.45, `rgba(${n.c[0]},${n.c[1]},${n.c[2]},.07)`],
  [1, 'rgba(0,0,0,0)']
]));
let galaxySpriteC = null;
function galaxySprite() {                        // 预渲染一条两端渐隐、上下柔边的星河光带（帧外一次）
  if (galaxySpriteC) return galaxySpriteC;
  const w = 512, h = 128, s = document.createElement('canvas'); s.width = w; s.height = h;
  const g = s.getContext('2d');
  const lg = g.createLinearGradient(0, 0, w, 0);
  lg.addColorStop(0, 'rgba(206,214,255,0)');
  lg.addColorStop(.30, 'rgba(206,214,255,.16)');
  lg.addColorStop(.52, 'rgba(230,212,255,.12)');
  lg.addColorStop(.76, 'rgba(178,206,255,.10)');
  lg.addColorStop(1, 'rgba(206,214,255,0)');
  g.fillStyle = lg; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-in';
  const vg = g.createLinearGradient(0, 0, 0, h);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(.5, '#000'); vg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = vg; g.fillRect(0, 0, w, h);
  galaxySpriteC = s; return s;
}

function drawBG(t) {
  bgx.clearRect(0, 0, VW, VH);
  // 深空底（渐变只在尺寸变化时重建）
  if (!bgBase) {
    bgBase = bgx.createLinearGradient(0, 0, VW * .35, VH);
    bgBase.addColorStop(0, '#05050f'); bgBase.addColorStop(.5, '#0a0820'); bgBase.addColorStop(1, '#070512');
  }
  bgx.fillStyle = bgBase; bgx.fillRect(0, 0, VW, VH);

  const par = scroll * 6;                       // 牌桌滚动量 → 视差基准
  bgx.globalCompositeOperation = 'lighter';
  const glowK = perfGlowK();

  // 星云：两层视差（远层慢、近层快；加色混合的预渲染软球，低帧率时收缩变淡）
  for (let i = 0; i < NEB.length; i++) {
    const n = NEB[i];
    const cx = (n.x + Math.sin(t * .07 + n.p) * n.dx * 6) * VW - par * n.z;
    const cy = (n.y + Math.cos(t * .05 + n.p) * n.dy * 6) * VH;
    const R = n.r * Math.max(VW, VH) * (.9 + Math.sin(t * .11 + n.p) * .08) * glowK;
    bgx.globalAlpha = n.z < .5 ? .92 : .85;
    bgx.drawImage(NEB_SPRITES[i], cx - R, cy - R, R * 2, R * 2);
  }
  bgx.globalAlpha = 1;

  // 斜向星河：一条极淡的光带 + 沿带分布的碎星（光带为预渲染精灵）
  const gl = Math.hypot(VW, VH) * 1.5;
  bgx.save();
  bgx.translate(VW * .5 - par * .55, VH * .56); bgx.rotate(-.30);
  bgx.globalAlpha = .55 + .10 * Math.sin(t * .13);
  bgx.drawImage(galaxySprite(), -gl * .5, -VH * .17, gl, VH * .34);
  bgx.globalAlpha = 1;
  const nGal = Math.round(GALAXY.length * (.5 + .5 * PERF.q));
  for (let k = 0; k < nGal; k++) {
    const s = GALAXY[k];
    const x = -gl * .5 + s.u * gl, y = s.v * VH * .55;
    const a = s.a * (.55 + .45 * Math.sin(t * .5 + s.tw));
    bgx.fillStyle = STAR_COL[Math.round(clamp(a, 0, 1) * 32)];
    bgx.fillRect(x, y, s.r, s.r);
  }
  bgx.restore();

  // 远景星场：视差最慢，用方块代替 arc（省路径开销）
  const nFar = Math.round(STARS_FAR.length * (.6 + .4 * PERF.q));
  for (let k = 0; k < nFar; k++) {
    const s = STARS_FAR[STAR_ORDER[k]];
    const a = s.a * (.45 + .55 * (.5 + .5 * Math.sin(t * s.ts + s.tw)));
    const x = ((s.x * VW - par * 2.0) % VW + VW) % VW, y = s.y * VH + Math.sin(t * .09 + s.tw) * 2.5;
    bgx.fillStyle = STAR_COL[Math.round(clamp(a, 0, 1) * 32)];
    bgx.fillRect(x, y, s.r * 1.1, s.r * 1.1);
  }

  // 近景星场：亮、略大、视差快（滑动时有贴脸的纵深感）
  const nNear = Math.round(STARS_NEAR.length * (.55 + .45 * PERF.q));
  for (let k = 0; k < nNear; k++) {
    const s = STARS_NEAR[NEAR_ORDER[k]];
    const a = s.a * (.35 + .65 * (.5 + .5 * Math.sin(t * s.ts + s.tw)));
    const x = ((s.x * VW - par * 11 * s.z) % VW + VW) % VW, y = s.y * VH + Math.sin(t * .18 + s.tw) * 3.4 * s.z;
    bgx.fillStyle = STAR_COL[Math.round(clamp(a * (.55 + .45 * s.z), 0, 1) * 32)];
    bgx.beginPath(); bgx.arc(x, y, s.r * s.z, 0, 6.2832); bgx.fill();
  }

  // 金尘（同样的质量系数控制数量，近的漂移更快）
  const nDust = Math.round(DUST.length * perfDustK());
  for (let k = 0; k < nDust; k++) {
    const d = DUST[DUST_ORDER[k]];
    const y = (d.y * VH - (t * d.sp) % (VH + 80) + VH + 80) % (VH + 80) - 40;
    const x = ((d.x * VW - par * 6 * d.z + Math.sin(t * .5 + d.ph) * 26) % VW + VW) % VW;
    const a = .16 + .26 * (.5 + .5 * Math.sin(t * 1.1 + d.ph));
    bgx.fillStyle = DUST_COL[d.hue][Math.round(clamp(a, 0, 1) * 32)];
    bgx.beginPath(); bgx.arc(x, y, d.r * (.7 + .3 * d.z), 0, 6.2832); bgx.fill();
  }

  // 背后的法阵：细线 + 缓慢呼吸的透明度（更细腻，不加粗）
  const cx = VW / 2, cy = VH * .52, R = Math.min(VW, VH) * .42;
  const br = .60 + .40 * (.5 + .5 * Math.sin(t * .31));
  const bi = Math.round(clamp(br, 0, 1) * 32);
  bgx.save(); bgx.translate(cx, cy); bgx.rotate(t * .03);
  bgx.lineWidth = .8;
  bgx.strokeStyle = RUNE.ring[bi];
  bgx.beginPath(); bgx.arc(0, 0, R, 0, 6.2832); bgx.stroke();
  bgx.strokeStyle = RUNE.ring2[bi];
  bgx.beginPath(); bgx.arc(0, 0, R * .985, 0, 6.2832); bgx.stroke();
  bgx.setLineDash(DASH_RUNE_A); bgx.lineDashOffset = -t * 6;
  bgx.strokeStyle = RUNE.dash[bi];
  bgx.beginPath(); bgx.arc(0, 0, R * .80, 0, 6.2832); bgx.stroke();
  bgx.setLineDash(DASH_RUNE_B); bgx.lineDashOffset = t * 4;
  bgx.strokeStyle = RUNE.dash2[bi];
  bgx.beginPath(); bgx.arc(0, 0, R * .62, 0, 6.2832); bgx.stroke();
  bgx.setLineDash([]);
  for (let i = 0; i < 24; i++) {
    const a = i * Math.PI / 12, long = i % 2 === 0;
    bgx.save(); bgx.rotate(a);
    bgx.strokeStyle = long ? RUNE.tick[bi] : RUNE.tick2[bi];
    bgx.beginPath(); bgx.moveTo(R * (long ? .877 : .925), 0); bgx.lineTo(R * .965, 0); bgx.stroke();
    if (long) { bgx.fillStyle = RUNE.dot[bi]; bgx.beginPath(); bgx.arc(R * .92, 0, 1.7, 0, 6.2832); bgx.fill(); }
    bgx.restore();
  }
  for (let i = 0; i < 3; i++) {                  // 内圈三颗缓慢自转的星位标记
    const a = t * .06 + i * 2.0944;
    bgx.fillStyle = RUNE.mark[bi];
    bgx.beginPath(); bgx.arc(Math.cos(a) * R * .80, Math.sin(a) * R * .80, 2.2, 0, 6.2832); bgx.fill();
  }
  bgx.restore();
  bgx.globalCompositeOperation = 'source-over';
}

/* ============================ 2. 粒子 / 光效层 ============================ */
const P = [];
const RINGS = [];
const RAYS = [];

/* —— 帧率自适应：连续低于 45fps 就降级（粒子/光尘更少、光晕更小），高于 55fps 再逐步恢复 —— */
const PERF = { q: 1, low: 0, high: 0 };
const perfParticleCap = () => Math.round(520 + 380 * PERF.q);
const perfDustK = () => .45 + .55 * PERF.q;
const perfGlowK = () => .72 + .28 * PERF.q;
function perfTick() {
  if (fps < 45) { PERF.low++; PERF.high = 0; }
  else if (fps > 55) { PERF.high++; PERF.low = 0; }
  else { PERF.low = 0; PERF.high = 0; }
  if (PERF.low >= 2) { PERF.low = 0; PERF.q = Math.max(.35, PERF.q - .18); }   // 掉帧降级要快
  if (PERF.high >= 3) { PERF.high = 0; PERF.q = Math.min(1, PERF.q + .08); }    // 恢复慢一点，避免来回抖
}
function spark(x, y, o = {}) {
  if (P.length > perfParticleCap()) return;
  const a = o.ang != null ? o.ang : rand(0, 6.2832), sp = o.sp != null ? o.sp : rand(30, 260);
  P.push({
    x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0),
    life: 0, ttl: o.ttl || rand(.6, 1.5), r: o.r || rand(1, 3.2),
    c: o.c || (Math.random() < .5 ? '255,214,140' : (Math.random() < .5 ? '150,220,255' : '255,160,214')),
    g: o.g != null ? o.g : 26, drag: o.drag != null ? o.drag : 1.7
  });
}
function ring(x, y, o = {}) { RINGS.push({ x, y, r: o.r0 || 10, vr: o.vr || 420, life: 0, ttl: o.ttl || .8, w: o.w || 2.4, c: o.c || '255,224,160' }); }
function rays(x, y, n = 14, o = {}) {
  const base = Math.random() * 6.2832;
  for (let i = 0; i < n; i++) RAYS.push({ x, y, a: base + i * (6.2832 / n), len: 0, max: o.max || rand(90, 210), life: 0, ttl: o.ttl || .75, w: rand(1, 2.6) });
}
function burst(x, y, n = 46) {
  ring(x, y, { r0: 8, vr: 520, ttl: .85, c: '255,228,170' });
  ring(x, y, { r0: 4, vr: 300, ttl: 1.1, w: 1.4, c: '160,220,255' });
  rays(x, y, Math.round(16 * (.5 + .5 * PERF.q)), { max: rand(120, 230) });
  const nb = Math.round(n * (.4 + .6 * PERF.q));
  for (let i = 0; i < nb; i++) spark(x + rand(-14, 14), y + rand(-20, 20), { sp: rand(40, 330), ttl: rand(.7, 1.6) });
}

/* —— 颜色串/光柱精灵缓存：把每帧的模板字符串与 createLinearGradient 挪到帧外 —— */
const FX_COL = new Map();
function fxColor(c, a) {                          // 透明度量化到 1/32 后缓存，颜色种类有限，缓存不会膨胀
  const b = Math.round(clamp(a, 0, 1) * 32), key = c + '|' + b;
  let s = FX_COL.get(key);
  if (s === undefined) { s = `rgba(${c},${(b / 32).toFixed(3)})`; FX_COL.set(key, s); }
  return s;
}
let raySpriteC = null;
function raySprite() {                            // 预渲染一根渐隐光柱，画射线时只做旋转+缩放贴图
  if (raySpriteC) return raySpriteC;
  const s = document.createElement('canvas'); s.width = 128; s.height = 16;
  const g = s.getContext('2d');
  const lg = g.createLinearGradient(0, 0, 128, 0);
  lg.addColorStop(0, 'rgba(255,236,190,.55)');
  lg.addColorStop(1, 'rgba(255,236,190,0)');
  g.fillStyle = lg; g.fillRect(0, 0, 128, 16);
  raySpriteC = s; return s;
}
const DOT_SPRITES = new Map();
function dotSprite(c) {                           // 每个颜色预渲染一颗实心圆，粒子改用贴图+globalAlpha（免去逐粒解析颜色串/建路径）
  let s = DOT_SPRITES.get(c);
  if (!s) {
    const n = 32; s = document.createElement('canvas'); s.width = s.height = n;
    const g = s.getContext('2d');
    g.fillStyle = `rgba(${c},1)`;
    g.beginPath(); g.arc(n / 2, n / 2, n / 2, 0, 6.2832); g.fill();
    DOT_SPRITES.set(c, s);
  }
  return s;
}

function drawFX(dt, t) {
  fxc.clearRect(0, 0, VW, VH);
  fxc.globalCompositeOperation = 'lighter';
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i]; p.life += dt;
    if (p.life >= p.ttl) { P.splice(i, 1); continue; }
    const k = 1 - p.life / p.ttl;
    p.vy += p.g * dt; p.vx -= p.vx * p.drag * dt; p.vy -= p.vy * p.drag * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    const r = p.r * (.4 + k * .8);
    fxc.globalAlpha = k * .95;
    fxc.drawImage(dotSprite(p.c), p.x - r, p.y - r, r * 2, r * 2);
  }
  fxc.globalAlpha = 1;
  for (let i = RINGS.length - 1; i >= 0; i--) {
    const r = RINGS[i]; r.life += dt;
    if (r.life >= r.ttl) { RINGS.splice(i, 1); continue; }
    const k = 1 - r.life / r.ttl; r.r += r.vr * dt * (1 - .5 * (1 - k));
    fxc.strokeStyle = fxColor(r.c, k * .8); fxc.lineWidth = r.w * k + .3;
    fxc.beginPath(); fxc.arc(r.x, r.y, r.r, 0, 6.2832); fxc.stroke();
  }
  const rs = RAYS.length ? raySprite() : null;
  for (let i = RAYS.length - 1; i >= 0; i--) {
    const r = RAYS[i]; r.life += dt;
    if (r.life >= r.ttl) { RAYS.splice(i, 1); continue; }
    const k = 1 - r.life / r.ttl;
    const len = r.max * Math.min(1, r.life / (r.ttl * .35)) * (.6 + .4 * k);
    const w = Math.max(.4, r.w * k);
    fxc.save();
    fxc.globalAlpha = k; fxc.translate(r.x, r.y); fxc.rotate(r.a);
    fxc.drawImage(rs, 0, -w / 2, Math.max(1, len), w);
    fxc.restore();
  }
  // 聚焦牌周围的常驻微光尘
  const fc = focusedScreenPos();
  if (fc && Math.random() < .5 * PERF.q) {
    spark(fc.x + rand(-90, 90), fc.y + rand(-130, 130), { sp: rand(4, 16), ttl: rand(1.1, 2.2), r: rand(.7, 1.7), g: -6, up: rand(4, 18) });
  }
  rowEdges();          // 牌排两端渐隐 + 景深分层（只改视觉，不碰 stepPhysics 的排布）
  drawReturnTrail(dt); // 收回牌排时那一道短暂的金色轨迹光
  fxc.globalCompositeOperation = 'source-over';
}

/* ---- 牌排两端柔和渐隐 + 景深（.dim/.dim2 压暗模糊、.lit 高亮）：只改视觉 ---- */
function rowEdges() {
  const soft = VW * .075;                       // 越靠边越淡的过渡带
  const focus = focusedIdx();
  let anyPulled = false;
  for (const o of els) if (o.pulled || o.pull > .2) { anyPulled = true; break; }
  for (let i = 0; i < els.length; i++) {
    const o = els[i];
    const sx = VW / 2 + o.x;
    const k = clamp(Math.min(sx, VW - sx) / soft, 0, 1);   // 0 = 贴边，1 = 已在安全区内
    const base = parseFloat(o.el.style.opacity);
    o.el.style.opacity = ((isFinite(base) ? base : 1) * (.06 + .94 * k * k)).toFixed(3);
    // 景深分层：焦点牌 / 抽出的牌最清晰；离屏的牌不挂 filter（省光栅化）
    const hero = o.pulled || i === focus;
    const ad = Math.abs(i - scroll);
    const onScreen = Math.abs(o.x) < VW * .62;
    const tier = (hero || !onScreen) ? 0 : (anyPulled || ad > 2.4) ? 2 : ad > 1.05 ? 1 : 0;
    if (o.tier !== tier) {
      o.tier = tier;
      o.el.classList.toggle('dim', tier === 1);
      o.el.classList.toggle('dim2', tier === 2);
    }
    const lit = !!(hero || o.glow > .5);
    if (o.lit !== lit) { o.lit = lit; o.el.classList.toggle('lit', lit); }
  }
}

/* ---- 收回牌排：金色轨迹光（<0.4s 消失）。预分配槽位，由光效层观察牌的状态变化触发 ---- */
const RET = [];
for (let i = 0; i < N; i++) RET.push({ was: false, x: 0, y: 0, px: 0, py: 0, life: 9, ttl: .38 });
function drawReturnTrail(dt) {
  for (let i = 0; i < els.length; i++) {
    const o = els[i], r = RET[i];
    const cx = VW / 2 + o.x, cy = VH * .48 + o.y;
    if (o.pulled) { r.was = true; r.px = r.x; r.py = r.y; r.x = cx; r.y = cy; continue; }
    if (r.was) {                                  // 抽出 → 收回：起一道金色的光
      r.was = false; r.life = 0;
      r.px = r.x = cx; r.py = r.y = cy;
      ring(cx, cy, { r0: 26, vr: 120, ttl: .34, w: 1.6, c: '255,222,158' });
      for (let s = 0; s < 10; s++) {
        spark(cx + rand(-CW * .45, CW * .45), cy + rand(-CH * .45, CH * .45),
          { sp: rand(12, 70), ttl: rand(.18, .34), r: rand(.7, 1.9), g: 4, c: '255,214,150' });
      }
    }
    if (o.pull >= .03 && o.pull <= .82) {         // 收回途中一路留下金色余晖
      if (Math.random() < .8 * PERF.q) {
        spark(cx + rand(-CW * .4, CW * .4), cy + rand(-CH * .4, CH * .4),
          { sp: rand(5, 34), ttl: rand(.16, .32), r: rand(.7, 1.8), g: 2, c: '255,222,162' });
      }
      if (r.life < r.ttl) { r.px = r.x; r.py = r.y; r.x = cx; r.y = cy; }
    }
  }
  fxc.globalCompositeOperation = 'lighter';
  for (const r of RET) {
    if (r.life >= r.ttl) continue;
    r.life += dt;
    if (r.life >= r.ttl) continue;
    const k = 1 - r.life / r.ttl;
    const dx = r.x - r.px, dy = r.y - r.py, sp = Math.hypot(dx, dy);
    const w = clamp(sp * 1.8, 56, CW * .95);
    fxc.save();
    fxc.globalAlpha = k * .95;
    fxc.translate(r.x, r.y);
    fxc.rotate(sp > .5 ? Math.atan2(dy, dx) : 0);
    fxc.drawImage(raySprite(), -w, -9, w, 18);    // 拖在收回方向的后面
    fxc.restore();
    fxc.globalAlpha = k * .6;
    const g2 = 34 + (1 - k) * 30;                 // 一团随之淡掉的金色余晖
    fxc.drawImage(SPR.ringSoft, r.x - g2, r.y - g2, g2 * 2, g2 * 2);
  }
  fxc.globalAlpha = 1;
  fxc.globalCompositeOperation = 'source-over';
}

/* ============================ 3. 牌桌（弹簧物理 + 惯性） ============================ */
const row = $('#row');
let scroll = (N - 1) / 2, vel = 0, target = scroll;
let CW = 200, CH = 310, SP = 212, ARC = 10;
let layoutScale = 1;
const els = [];

function layoutParams() {
  CW = clamp(VW * .19, 132, 236);
  CH = CW * 340 / 220;
  SP = CW * 1.055;
  layoutScale = clamp(VH / 900, .68, 1.2);
  row.style.setProperty('--cw', CW + 'px');
  row.style.setProperty('--ch', CH + 'px');
}

/* 78 张牌的正面有 ~19000 个节点，一次性生成会卡顿 → 正面按需生成：
   抽出到位（onCardReveal）时才画这一张，洗牌时只作废、不重画。 */
function buildFace(o) {
  if (o.faceBuilt) return;
  o.el.querySelector('.front').innerHTML = cardFrontSVG(CARDS[o.ci], o.ci) + '<div class="rev">逆位</div>';
  o.faceBuilt = true;
}

function buildRow() {
  const seeded = [...CARDS.keys()].sort(() => Math.random() - .5); // 洗牌
  row.innerHTML = '';
  for (let i = 0; i < N; i++) {
    const ci = seeded[i];
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.i = i; el.dataset.card = ci;
    el.innerHTML = `
      <div class="card-inner">
        <div class="face back">${cardBackSVG()}</div>
        <div class="face front"></div>
        <div class="halo"></div>
      </div>
      <div class="tag"></div>`;
    const inner = el.querySelector('.card-inner');
    els.push({
      el, inner, ci, card: CARDS[ci], faceBuilt: false,
      flipK: 0, flipped: false, rev: Math.random() < .3,
      pulled: false, pull: 0, pullX0: undefined, panelTimer: null,   // 抽出来：pulled=在桌上，pull=抽出进度，pullX0=冻结槽位
      glow: 0, lift: 0, tagShown: false, x: 0, y: 0, z: 0, ry: 0, sc: 1, skew: 0,
      tier: -1, lit: false
    });
    if (els[els.length - 1].rev) inner.classList.add('is-rev');
    row.appendChild(el);
  }
  scroll = target = (N - 1) / 2; vel = 0;
}

const focusedIdx = () => clamp(Math.round(scroll), 0, N - 1);
const screenXOfCard = (i) => VW / 2 + (i - scroll) * SP;
function focusedScreenPos() { const i = focusedIdx(); return els[i] ? { x: screenXOfCard(i), y: VH * .53 } : null; }

let springK = 24, springD = 7.4;
function stepPhysics(dt, t) {
  if (dragging) target = dragScroll;
  vel += (target - scroll) * springK * dt;
  vel *= Math.exp(-springD * dt);
  scroll += vel * dt;
  if (Math.abs(vel) < .0015 && Math.abs(target - scroll) < .0015) { scroll = target; vel = 0; }

  const speed = Math.abs(vel);
  const focus = focusedIdx();
  // 同一时刻只允许一张牌在"桌上"（抽出来了）
  let pulledIdx = -1;
  for (let i = 0; i < N; i++) if (els[i].pulled) { pulledIdx = i; break; }
  const outAmt = pulledIdx >= 0 ? els[pulledIdx].pull : 0;
  const glowK = perfGlowK();                                   // 低帧率时同步收小牌面光晕半径

  for (let i = 0; i < N; i++) {
    const o = els[i], dx = i - scroll;
    const ad = Math.abs(dx);
    const s = layoutScale;
    const depth = 1 / (1 + ad * .055);
    let x = dx * SP;
    let y = (ad * ad * .55 + Math.pow(ad, 1.45) * 3.2) * s;      // 抛物弧
    let z = -ad * 88 * s, ry = clamp(-dx * 11.5, -46, 46);
    let sc = clamp((1 - ad * .042) * (0.75 + 0.25 * depth), .42, 1);
    const isF = i === focus;
    o.glow = lerp(o.glow, (o.pulled || isF) ? 1 : 0, 1 - Math.exp(-9 * dt));
    // 惯性倾斜：滑动时整排轻微侧倾，速率越大越明显
    o.skew = lerp(o.skew, clamp(-vel * 1.15, -9, 9), 1 - Math.exp(-6 * dt));
    o.lift = lerp(o.lift, (isF ? 1 : 0) * (o.flipped ? 10 : 16) + (o.flipped ? 6 : 0), 1 - Math.exp(-8 * dt));

    /* —— 抽出：先离排、升起、朝观众推出来，稳定后才翻面 —— */
    o.pull = lerp(o.pull, o.pulled ? 1 : 0, 1 - Math.exp(-(o.pulled ? 3.6 : 7.4) * dt));
    const pt = o.pull;
    if (pt < .012 && !o.pulled) o.pullX0 = undefined;             // 回到牌排后解冻
    if (pt > .002) {
      // 抽出瞬间的槽位冻结：之后牌排怎么滑，手里这张都稳稳停在原位直到收回
      if (o.pullX0 === undefined) o.pullX0 = x;
      const from = lerp(x, o.pullX0, Math.min(1, pt * 3));
      x = lerp(from, 0, .82 * pt);                               // 收到画面正中
      y -= 56 * pt + Math.sin(t * 1.7) * 4.5 * pt;               // 抬起 + 悬浮呼吸
      z += 300 * pt;                                             // 朝观众推近
      ry *= (1 - pt);                                            // 摆正
      sc *= (1 + .36 * pt);                                      // 放大
    }
    if (pulledIdx >= 0 && i !== pulledIdx && outAmt > .01) {      // 左右两边的牌让开
      const d = i - pulledIdx;
      x += Math.sign(d) * (44 / Math.abs(d)) * outAmt;
    }

    o.x = x; o.y = y - o.lift * s; o.z = z + (isF && !o.pulled ? 40 * s : 0); o.ry = ry; o.sc = sc;
    let opacity = clamp(1 - Math.max(0, ad - 8.4) * .5, 0, 1);
    if (pulledIdx >= 0 && i !== pulledIdx) opacity *= 1 - .5 * outAmt;    // 其余牌压暗，突出抽出的那张
    o.el.style.opacity = opacity.toFixed(3);
    o.el.style.zIndex = String(o.pulled ? 3000 : 1000 - Math.round(ad * 10));
    o.el.style.transform =
      `translate3d(${fmt(x)}px,${fmt(o.y)}px,${fmt(o.z)}px) rotateY(${fmt(ry)}deg) skewY(${fmt(o.skew * .35)}deg) scale(${fmt(sc)})`;
    o.el.style.setProperty('--glow', (o.glow * glowK).toFixed(3));
    o.el.style.setProperty('--tilt', (ry / 46).toFixed(3));
    o.el.style.setProperty('--pull', pt.toFixed(3));

    // 抽出过程中的金尘拖尾
    if (pt > .04 && pt < .96 && Math.random() < .85 * PERF.q) {
      spark(VW / 2 + x + rand(-CW * .52, CW * .52), VH * .48 + o.y + rand(-CH * .55, CH * .55),
        { sp: rand(10, 62), ttl: rand(.35, .95), r: rand(.6, 2.1), g: 14 });
    }
    if (speed > .9 && !o.pulled && Math.random() < .25 * PERF.q) {
      spark(VW / 2 + x * .98, VH * .52 + o.y + rand(-CH * .5, CH * .5), { sp: rand(6, 34), ttl: rand(.4, 1), r: rand(.6, 1.8), g: 8 });
    }

    /* —— 出到位才翻面；收回时自动合上 —— */
    if (o.pulled && !o.flipped && pt > .72) onCardReveal(o);
    if (!o.pulled && o.flipped && pt < .3) o.flipped = false;

    // 牌面翻转：抽出到位后先亮着牌背（FLIP_HOLD 毫秒），再翻过去
    const nowMs = performance.now();
    const holdDone = !o.flipHoldUntil || nowMs >= o.flipHoldUntil;
    o.flipK = lerp(o.flipK, (o.flipped && holdDone) ? 1 : 0, 1 - Math.exp(-FLIP_RATE * dt));
    o.inner.style.transform = `rotateY(${fmt(180 * o.flipK)}deg)`;

    // 翻到位 → 再等 FACE_DELAY，正面细节才浮出来（配 CSS 的 .face-in 淡入）
    if (o.flipped && holdDone && !o.faceIn) {
      if (o.flipK > .96 && !o.faceTimer) {
        o.faceTimer = setTimeout(() => {
          o.faceTimer = null;
          if (!o.flipped) return;
          o.faceIn = true; o.el.classList.add('face-in'); sound('face');
        }, FACE_DELAY);
      }
    } else if (!o.flipped && (o.faceIn || o.faceTimer)) {
      clearTimeout(o.faceTimer); o.faceTimer = null;
      o.faceIn = false; o.el.classList.remove('face-in');
    }

    // 名牌：牌面浮出来之后才显示名字（牌背朝上时一律不显示）
    const wantTag = o.flipped && o.faceIn && Math.abs(dx) < 4.2;
    if (wantTag !== o.tagShown) {
      o.tagShown = wantTag;
      const tag = o.el.querySelector('.tag');
      tag.textContent = `${o.card.zh} · ${o.rev ? '逆位' : '正位'}`;
      tag.classList.toggle('show', wantTag);
    }
  }
  updateHUD();
}

/* ============================ 4. 翻牌 / 洗牌 / 解读 ============================ */
/* 翻牌时序：抽出到位 → 先亮着牌背（FLIP_HOLD）→ 翻转（FLIP_RATE）→ 正面细节延迟浮现（FACE_DELAY）
   想调"慢一点 / 等久一点"只改这三个常量；验收脚本用 window.taro.timing() 读取。 */
const FLIP_HOLD = 360;      // ms：抽出到位后，保持牌背朝上的时间（悬念）
const FLIP_RATE = 5.2;      // 翻转速度（越小翻得越慢）
const FACE_DELAY = 320;     // ms：翻到位后再等这么久，正面细节（图徽/铭牌/主色）才浮出来
const FLIP_TOTAL = FLIP_HOLD + 640 + FACE_DELAY;   // 从"抽出到位"到"细节完全浮现"的总时长
let revealed = 0;
/* 抽出一张牌：先离排 → 升起推出 → 到位后再翻面（翻面时机在 stepPhysics 里按进度触发） */
function flipCard(i, silent) {
  const o = els[i]; if (!o) return;
  if (SESSION && o.pulled) { toast('这张刚刚抽过，等它落位'); return; }
  if (SESSION && SESSION.cards.some(c => c.ci === o.ci)) { toast('这张牌已经在牌阵里了 —— 换一张'); return; }
  if (o.pulled) {                                  // 已经在桌上：把解读面板叫回来
    clearTimeout(o.panelTimer);
    if (o.flipped) showReading(o);
    return;
  }
  for (const e of els) if (e.pulled) { e.pulled = false; clearTimeout(e.panelTimer); }   // 上一张先滑回去
  hideReading();
  o.pulled = true;
  if (!silent) sound('draw');
  ring(VW / 2, VH * .48, { r0: 8, vr: 520, ttl: .55, w: 2, c: '180,222,255' });
  toast('抽出…');
  updateHUD();
}
/* 抽出到位的瞬间：光爆 + 圆环 + 光柱，再浮出解读 */
function onCardReveal(o) {
  buildFace(o);                                            // 正面此刻才生成（78 张不可能全预生成）
  o.flipped = true; revealed++;
  o.flipHoldUntil = performance.now() + FLIP_HOLD;          // 先保持牌背朝上，翻面延后
  clearTimeout(o.faceTimer); o.faceTimer = null;
  o.faceIn = false; o.el.classList.remove('face-in');
  const px = VW / 2 + o.x, py = VH * .48 + o.y;
  burst(px, py, 70);
  ring(px, py, { r0: 24, vr: 660, ttl: .95, w: 3 });
  rays(px, py, 18, { max: 320 });
  document.body.classList.add('pulse');
  setTimeout(() => document.body.classList.remove('pulse'), 520);
  sound('flip');
  clearTimeout(o.panelTimer);
  if (SESSION) {                                   // 牌阵模式：先落位，抽满整个牌阵再一起解读
    onSpreadDraw(o);
  } else {
    /* 自由抽牌：翻牌落定就先记一条（面板晚一点才弹，也不怕用户提前收牌丢记录） */
    if (!o._sess) o._sess = { free: true, spreadId: null, at: Date.now(), cards: [{ ci: o.ci, rev: !!o.rev, slot: 0 }], savedId: null };
    if (!o._sess.savedId) { try { o._sess.savedId = HIST.save(o._sess).id; refreshHistN(); } catch (e) { } }
    o.panelTimer = setTimeout(() => { if (o.pulled && o.flipped) showReading(o); }, FLIP_TOTAL + 180);
  }
  toast(`${o.card.zh} · ${o.rev ? '逆位' : '正位'}${SESSION ? ` · 第 ${SESSION.cards.length} 张` : ''}`);
}
/* 收好：把桌上的牌滑回牌排（同时合上牌面） */
function putBack() {
  for (const e of els) {
    if (e.pulled) { e.pulled = false; clearTimeout(e.panelTimer); }
    clearTimeout(e.faceTimer); e.faceTimer = null; e.flipHoldUntil = 0;
  }
  hideReading();
  updateHUD();
}
function chooseAgain() {
  for (const o of els) {
    o.flipped = false; o.pulled = false; o.pullX0 = undefined; clearTimeout(o.panelTimer);
    clearTimeout(o.faceTimer); o.faceTimer = null; o.flipHoldUntil = 0;
    o.faceIn = false; o.el.classList.remove('face-in');
    o.rev = Math.random() < .3; o.inner.classList.toggle('is-rev', o.rev);
    o._sess = null; o.el.querySelectorAll('.used-tag').forEach(n => n.remove());
  }
  revealed = 0;
  if (SESSION) { SESSION.cards = []; SESSION.at = null; renderBoard(); }   // 重新洗牌 = 本局重来
  const order = [...els.keys()].sort(() => Math.random() - .5).map(i => els[i].ci);
  els.forEach((o, k) => { o.ci = order[k]; o.card = CARDS[o.ci]; });
  // 洗牌后每张牌换了内容：作废已生成的正面（下一次翻牌时再按需重画）
  els.forEach((o) => {
    o.el.dataset.card = o.ci;
    o.faceBuilt = false;
    o.el.querySelector('.front').innerHTML = '';
  });
  const i = clamp(Math.round(scroll), 0, N - 1);
  burst(screenXOfCard(i), VH * .52, 36);
  rays(screenXOfCard(i), VH * .52, 20, { max: 260 });
  hideReading(); sound('shuffle'); toast('牌已重新洗过，再选一张');
  updateHUD();
}
function showReading(o) {                             // 自由抽牌：这一张的完整解读
  if (!o._sess) o._sess = { free: true, spreadId: null, at: Date.now(), cards: [{ ci: o.ci, rev: !!o.rev, slot: 0 }] };
  showSession(o._sess);
}
function hideReading() { $('#reading').classList.remove('show'); }

/* ============================ 4.5 牌阵 · 抽取记录 · 解读 ============================ */
let SESSION = null;                 // 当前这一局（null = 自由抽牌：一张一张来）

const sheetOpen = (id) => $('#' + id).classList.contains('show');
const openSheet = (id) => $('#' + id).classList.add('show');
const closeSheet = (id) => $('#' + id).classList.remove('show');
const showBoard = () => $('#board').classList.add('show');
const hideBoard = () => $('#board').classList.remove('show');
function refreshHistN() { const el = $('#histN'); if (el) el.textContent = HIST.count(); }

/* —— 牌阵选择面板 —— */
function renderSpreadGrid() {
  $('#spGrid').innerHTML = SPREADS.map(s => `
    <button class="sp-card${SESSION && SESSION.spreadId === s.id ? ' sel' : ''}" data-sp="${s.id}">
      <div class="sp-h"><b>${s.name}</b><span class="sp-n">${s.cards} 张</span><span class="sp-tag">${s.tag}</span></div>
      <div class="sp-d">${s.desc}</div>
      <div class="sp-u">${s.use}</div>
      <div class="sp-slots">${s.slots.map(x => `<i>${x.n}</i>`).join('')}</div>
      <span class="sp-num" data-num="${s.id}">用数字抽这个牌阵</span>
    </button>`).join('') + `
    <button class="sp-card" data-sp="__free">
      <div class="sp-h"><b>自由抽牌</b><span class="sp-n">想抽几张抽几张</span><span class="sp-tag">随意</span></div>
      <div class="sp-d">不设牌阵，你一张张抽，每抽一张就给你一份完整解读。</div>
      <div class="sp-u">适合：随便看看 / 边抽边想</div>
    </button>`;
  $('#spGrid').querySelectorAll('[data-num]').forEach(b => {
    b.onclick = (e) => {                       // 内层入口：先选中这个牌阵，再打开数字面板
      e.stopPropagation();
      sound('select');
      startSpread(b.dataset.num);
      closeSheet('spreadPanel');
      setTimeout(openNumPanel, 200);
    };
  });
  $('#spGrid').querySelectorAll('.sp-card').forEach(b => {
    b.onclick = () => {
      const id = b.dataset.sp; sound('select');
      if (id === '__free') startFree(); else startSpread(id);
      closeSheet('spreadPanel');
    };
  });
}
function openSpreadPanel() { renderSpreadGrid(); openSheet('spreadPanel'); }

function startFree() {
  chooseAgain();
  SESSION = null; hideBoard();
  toast('自由模式：一张张抽，每张都给你完整解读');
  updateHUD();
}
function startSpread(id) {
  const sp = SPREAD_BY_ID[id]; if (!sp) return;
  chooseAgain();
  SESSION = { spreadId: id, cards: [], at: null, savedId: null };
  renderBoard(); showBoard();
  toast(`《${sp.name}》共 ${sp.cards} 张 · 捏合抽出第 1 张「${sp.slots[0].n}」`);
  updateHUD();
}

/* —— 牌阵板：抽到的牌按位置摆好 —— */
function renderBoard() {
  const box = $('#board');
  if (!SESSION) { box.innerHTML = ''; return; }
  const sp = SPREAD_BY_ID[SESSION.spreadId];
  box.innerHTML = `<div class="bd-t">${sp.name} · 已抽 ${SESSION.cards.length} / ${sp.cards}</div>` +
    sp.slots.map((sl, k) => {
      const c = SESSION.cards[k];
      return `<div class="bd-slot${c && c.rev ? ' rev' : ''}">
        <div class="bd-n">${sl.n}</div>
        ${c ? `<div class="bd-card">${cardFrontSVG(CARDS[c.ci], c.ci)}</div><div class="bd-c">${CARDS[c.ci].zh}·${c.rev ? '逆' : '正'}</div>`
            : `<div class="bd-empty"></div><div class="bd-c">待抽</div>`}
      </div>`;
    }).join('');
}

/* —— 牌阵模式：每翻开一张 → 落到牌阵板 → 牌自己滑回牌排 → 抽满就出解读 —— */
function onSpreadDraw(o) {
  const sp = SPREAD_BY_ID[SESSION.spreadId];
  SESSION.cards.push({ ci: o.ci, rev: !!o.rev, slot: SESSION.cards.length });
  if (!SESSION.at) SESSION.at = Date.now();
  o.el.insertAdjacentHTML('beforeend', '<div class="used-tag">已抽</div>');
  renderBoard();
  ring(VW / 2, VH * .62, { r0: 12, vr: 420, ttl: .5, w: 1.6, c: '230,201,140' });
  const next = sp.slots[SESSION.cards.length];
  if (next) toast(`第 ${SESSION.cards.length} 张已落位 · 接着抽「${next.n}」`);
  updateHUD();
  setTimeout(() => { if (o.pulled) o.pulled = false; }, FLIP_TOTAL + 620);
  if (SESSION.cards.length >= sp.cards) {
    if (!SESSION.savedId) { try { SESSION.savedId = HIST.save(SESSION).id; refreshHistN(); } catch (e) { } }   // 最后一张落定即记录
    setTimeout(() => { if (SESSION && SESSION.cards.length >= sp.cards) showSession(SESSION, { complete: true }); }, FLIP_TOTAL + 760);
  }
}

/* —— 解读面板（牌阵与自由抽牌共用；打开即自动存进记录）—— */
function showSession(session, opt = {}) {
  const box = $('#reading');
  if (!session.savedId) { try { session.savedId = HIST.save(session).id; } catch (e) { } }
  box.innerHTML = READING.renderReading(session, opt);
  box.classList.add('show');
  hideBoard();
  const on = (sel, fn) => { const el = box.querySelector(sel); if (el) el.onclick = fn; };
  on('#rdAgain', () => { if (session.spreadId) startSpread(session.spreadId); else { putBack(); toast('再抽一张：捏合 / 空格 / 点牌'); } });
  on('#rdCopy', async () => {
    const txt = READING.readingText(session);
    try { await navigator.clipboard.writeText(txt); toast('解读已复制，可粘贴到微信或备忘录'); }
    catch (e) { toast('复制失败：可以长按选中文字手动复制'); }
  });
  on('#rdSave', () => { HIST.save(session); refreshHistN(); toast('已存进抽取记录'); const s = box.querySelector('#rdSave'); if (s) s.textContent = '已记录'; });
  on('#rdClose', () => { putBack(); hideBoard(); });
  refreshHistN();
}

/* —— 抽取记录面板 —— */
function renderHistory() {
  const body = $('#histBody');
  body.innerHTML = HIST.renderList();
  body.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openRecord(b.dataset.open));
  body.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { HIST.remove(b.dataset.del); renderHistory(); refreshHistN(); toast('已删除这条记录'); });
}
function openHistory() { renderHistory(); openSheet('histPanel'); }
function openRecord(id) {
  const rec = HIST.load().find(r => r.id === id); if (!rec) return;
  closeSheet('histPanel');
  showSession({ spreadId: rec.spreadId, free: !!rec.free, at: rec.at, cards: rec.cards.slice(), savedId: rec.id });
}

/* ============================ 4.7 数字抽牌（单抽 / 牌阵都行） ============================
   号码 = 洗好的牌堆里的第几张牌，范围 1–78（78 = 全套大小阿卡纳）。单抽只需要 1 个号码；
   牌阵需要「牌阵张数」个号码，并按号码顺序落到第 1、2、3…个牌位上。 */
let NUMSEL = [];                      // 已选号码（按选择顺序）
let NUMQ = null, numTimer = null;     // 待抽号码队列（牌堆下标）
const numNeed = () => SESSION ? ((SPREAD_BY_ID[SESSION.spreadId] || {}).cards || 1) : 1;
const numUsed = () => new Set((SESSION ? SESSION.cards : []).map(c => c.ci));

function renderNumPanel(syncText) {
  const need = numNeed(), used = numUsed();
  const sp = SESSION ? SPREAD_BY_ID[SESSION.spreadId] : null;
  $('#numLead').innerHTML = `在 <b>1 – ${N}</b> 之间选 <b>${need}</b> 个不重复的自然数（号码 = 牌堆里的第几张牌）。`;
  $('#numMode').innerHTML = sp
    ? `当前牌阵《<b>${sp.name}</b>》· 需要 <b>${need}</b> 个号码 —— 第 1 个号码落在「${sp.slots[0].n}」位`
    : `当前：<b>自由抽牌</b> · 只需要 <b>1</b> 个号码（想按牌阵抽：先去「牌阵」选一个，或点牌阵卡上的「数字抽」）`;
  $('#numGrid').innerHTML = Array.from({ length: N }, (_, k) => {
    const n = k + 1, on = NUMSEL.includes(n), u = used.has(els[k].ci);
    return `<button class="num-btn${on ? ' on' : ''}${u ? ' used' : ''}" data-n="${n}"${u ? ' disabled' : ''}>${n}</button>`;
  }).join('');
  $('#numGrid').querySelectorAll('.num-btn').forEach(b => {
    b.onclick = () => {
      if (b.disabled) return;
      const n = +b.dataset.n, at = NUMSEL.indexOf(n);
      if (at >= 0) NUMSEL.splice(at, 1);
      else if (NUMSEL.length >= need) { toast(`这次只需要 ${need} 个号码`); return; }
      else NUMSEL.push(n);
      sound('select'); renderNumPanel(true);
    };
  });
  if (syncText) $('#numText').value = NUMSEL.join(' ');
  $('#numSeq').textContent = NUMSEL.length
    ? `抽取顺序：${NUMSEL.map((n, k) => `${k + 1} → ${n} 号`).join('，')}`
    : '还没选号码';
  $('#numHint').innerHTML = `已选 <b>${NUMSEL.length}</b> / ${need} 个 · 选够后点「开始抽牌」，也可以直接在上面输入数字`;
  $('#numGo').disabled = NUMSEL.length !== need;
}

function openNumPanel() { NUMSEL = []; renderNumPanel(true); openSheet('numPanel'); }

function startNumberDraw() {
  const need = numNeed();
  if (NUMSEL.length !== need) { toast(`还差 ${need - NUMSEL.length} 个号码`); return; }
  const seq = NUMSEL.slice();
  NUMQ = seq.map(n => n - 1);
  NUMSEL = [];
  $('#numText').value = '';
  closeSheet('numPanel');
  sound('shuffle');
  toast(`按号码抽牌：${seq.join(' → ')}`);
  clearInterval(numTimer);
  /* 一张一张来：上一张还在桌上（或解读面板开着）就先等，落定了再抽下一张 */
  numTimer = setInterval(() => {
    if (!NUMQ || !NUMQ.length) { clearInterval(numTimer); numTimer = null; return; }
    if (els.some(o => o.pulled) || $('#reading').classList.contains('show')) return;
    const i = NUMQ.shift();
    if (els[i]) flipCard(i, true);
  }, 320);
}



/* ====== 手部锚点层：21 关节 + 渐变光带骨骼 + 掌心法阵 + 捏合能量流 ======
   全部用帧外预渲染的精灵绘制（不逐帧建渐变对象）；残影/汇聚光点用预分配池，主循环里不 new。 */
function spriteBand(w, h, stops, endFade) {      // 横向渐变光带：上下柔边 + 两端收圆
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), f = endFade == null ? .16 : endFade;
  const lg = g.createLinearGradient(0, 0, w, 0);
  for (const [p, col] of stops) lg.addColorStop(p, col);
  g.fillStyle = lg; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-in';
  const vg = g.createLinearGradient(0, 0, 0, h);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(.5, '#000'); vg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = vg; g.fillRect(0, 0, w, h);
  const hg = g.createLinearGradient(0, 0, w, 0);
  hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(f, '#000'); hg.addColorStop(1 - f, '#000'); hg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = hg; g.fillRect(0, 0, w, h);
  return c;
}
const SPR = {
  tip: softSprite([[0, 'rgba(255,247,229,.95)'], [.26, 'rgba(255,214,150,.42)'], [.6, 'rgba(255,182,124,.12)'], [1, 'rgba(255,170,110,0)']]),
  joint: softSprite([[0, 'rgba(240,249,255,.86)'], [.3, 'rgba(154,216,255,.32)'], [.7, 'rgba(126,172,255,.07)'], [1, 'rgba(126,172,255,0)']]),
  core: softSprite([[0, 'rgba(255,255,255,1)'], [.3, 'rgba(255,249,232,.95)'], [.58, 'rgba(255,226,178,.45)'], [1, 'rgba(255,214,150,0)']]),
  ring: softSprite([[0, 'rgba(0,0,0,0)'], [.62, 'rgba(0,0,0,0)'], [.78, 'rgba(255,228,172,.8)'], [.9, 'rgba(255,206,150,.22)'], [1, 'rgba(255,200,140,0)']]),
  ringSoft: softSprite([[0, 'rgba(0,0,0,0)'], [.5, 'rgba(0,0,0,0)'], [.8, 'rgba(255,238,204,.34)'], [1, 'rgba(255,220,170,0)']]),
  band: spriteBand(160, 26, [[0, 'rgba(255,186,96,.95)'], [.45, 'rgba(255,224,176,.82)'], [1, 'rgba(120,192,255,.92)']], .15),
  bandPalm: spriteBand(160, 26, [[0, 'rgba(255,176,86,.82)'], [.45, 'rgba(240,222,200,.70)'], [1, 'rgba(122,190,255,.88)']], .18)
};
let handAlpha = 0, lastAnchor = null, anchorNow = 0, prevTight = 0;
const AX = new Float32Array(21), AY = new Float32Array(21), WR = new Float32Array(21);
const TIP5 = [4, 8, 12, 16, 20];
/* 指尖残影：5 条指尖各一条长度 4 的环形缓冲（预分配，绝不每帧新建） */
const TRAIL = TIP5.map(() => {
  const buf = []; for (let k = 0; k < 4; k++) buf.push({ x: 0, y: 0, a: 0 });
  return { buf, head: 0, lastX: 0, lastY: 0, has: false };
});
/* 捏合时向中点汇聚的小光点 + 松手扩散波纹：固定池 */
const CONV = []; for (let k = 0; k < 10; k++) CONV.push({ u: Math.random(), side: k % 2 ? 1 : -1 });
const PUFF = []; for (let k = 0; k < 3; k++) PUFF.push({ life: 9, ttl: .62, x: 0, y: 0 });
let puffIdx = 0;
const DASH_PALM_A = [7, 10], DASH_PALM_B = [3, 7];   // 虚线数组挪到帧外

function drawAnchors(lm, now) {
  if (!hctx) return;
  const t = now / 1000;
  const dt = clamp((now - anchorNow) / 1000, 0, .05); anchorNow = now;
  if (lm) lastAnchor = lm;
  // 手进入快速浮现；离场约 0.5s 线性淡出（不瞬间消失）
  const target = lm ? 1 : 0, sp = lm ? 1 / .16 : 1 / .50;
  handAlpha = clamp(handAlpha + (target > handAlpha ? sp * dt : -sp * dt), 0, 1);
  hctx.clearRect(0, 0, VW, VH);
  if (handAlpha < .015 || !lastAnchor) return;
  const l = lastAnchor;
  // 背景视频是 object-fit:cover + 水平镜像，锚点按同一规则贴合
  const vw = (video && video.videoWidth) || 960, vh = (video && video.videoHeight) || 540;
  const sc = Math.max(VW / vw, VH / vh);
  const dw = vw * sc, dh = vh * sc, ox = (VW - dw) / 2, oy = (VH - dh) / 2;
  for (let i = 0; i < 21; i++) { const q = l[i]; AX[i] = ox + (1 - q.x) * dw; AY[i] = oy + q.y * dh; }
  const wx = AX[0], wy = AY[0];
  for (let i = 0; i < 21; i++) WR[i] = Math.hypot(AX[i] - wx, AY[i] - wy);
  const breath = 1 + Math.sin(t * 1.05) * .05;   // 呼吸：幅度小、周期慢（约 6s）
  const live = !!lm;

  hctx.save();
  hctx.globalCompositeOperation = 'lighter';
  hctx.lineCap = 'round';

  // 骨骼：暖金→冷蓝的渐变光带，接头圆润；腕端在左（暖），指端在右（冷）
  for (const [a, b] of CONN) {
    const palm = (a === 0 && (b === 5 || b === 17)) || (a === 5 && b === 9) || (a === 9 && b === 13) || (a === 13 && b === 17);
    let x0 = AX[a], y0 = AY[a], x1 = AX[b], y1 = AY[b];
    if (WR[a] > WR[b]) { const tx = x0, ty = y0; x0 = x1; y0 = y1; x1 = tx; y1 = ty; }   // 暖端靠腕
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || .01;
    const wide = (palm ? 7.6 : 5.3) * breath;
    hctx.globalAlpha = handAlpha * (palm ? .78 : .68);
    hctx.save();
    hctx.translate(x0, y0); hctx.rotate(Math.atan2(dy, dx));
    hctx.drawImage(palm ? SPR.bandPalm : SPR.band, 0, -wide / 2, len, wide);
    // 光带里再压一根极细亮线：既有柔光又有骨骼结构感
    hctx.globalAlpha = handAlpha * (palm ? .30 : .34);
    hctx.strokeStyle = 'rgba(255,244,222,.9)'; hctx.lineWidth = .9;
    hctx.beginPath(); hctx.moveTo(1.5, 0); hctx.lineTo(Math.max(2, len - 1.5), 0); hctx.stroke();
    hctx.restore();
  }

  // 21 关节：呼吸脉冲；指尖最亮 + 一圈细光环，掌指关节居中，其余柔和过渡
  for (let i = 0; i < 21; i++) {
    const bx = AX[i], by = AY[i];
    const tip = IS_TIP[i], mcp = IS_MCP[i];
    const pulse = 1 + Math.sin(t * 1.06 + i * .62) * .05;
    const R = (tip ? 22 : mcp ? 14 : 11) * pulse * breath;
    hctx.globalAlpha = handAlpha * (tip ? .95 : mcp ? .74 : .6);
    hctx.drawImage(tip ? SPR.tip : SPR.joint, bx - R, by - R, R * 2, R * 2);
    if (tip) {
      const rr = (17 + Math.sin(t * 1.3 + i * .5) * .9) * breath;
      hctx.globalAlpha = handAlpha * .78;
      hctx.drawImage(SPR.ring, bx - rr, by - rr, rr * 2, rr * 2);
    }
    const cr = (tip ? 4.6 : mcp ? 3.1 : 2.5) * pulse;
    hctx.globalAlpha = handAlpha * (tip ? 1 : .92);
    hctx.drawImage(SPR.core, bx - cr * 2.1, by - cr * 2.1, cr * 4.2, cr * 4.2);
  }

  // 指尖残影：只在快速移动时落点，最多 4 个渐隐残点（环形缓冲，不新建数组）
  if (live) {
    for (let k = 0; k < 5; k++) {
      const ti = TIP5[k], tr = TRAIL[k], bx = AX[ti], by = AY[ti];
      const moved = tr.has ? Math.hypot(bx - tr.lastX, by - tr.lastY) : 0;
      if (moved > 2.6) { const s = tr.buf[tr.head]; s.x = bx; s.y = by; s.a = 1; tr.head = (tr.head + 1) % 4; }
      tr.lastX = bx; tr.lastY = by; tr.has = true;
    }
  }
  for (let k = 0; k < 5; k++) {
    const buf = TRAIL[k].buf;
    for (let j = 0; j < 4; j++) {
      const s = buf[j];
      if (s.a <= .04) continue;
      s.a -= dt / .30;
      if (s.a <= .04) { s.a = 0; continue; }
      const R = 16 * s.a * breath;
      hctx.globalAlpha = handAlpha * s.a * .8;
      hctx.drawImage(SPR.tip, s.x - R, s.y - R, R * 2, R * 2);
    }
  }

  // 掌心：缓慢旋转的虚线法阵（细内环 + 十字锚），跟着手掌呼吸
  const cxp = (AX[0] + AX[5] + AX[9] + AX[13] + AX[17]) / 5;
  const cyp = (AY[0] + AY[5] + AY[9] + AY[13] + AY[17]) / 5;
  const pr = (WR[9] * .58 + 18) * breath;
  hctx.globalAlpha = handAlpha * .5;
  hctx.strokeStyle = 'rgba(255,190,230,.9)'; hctx.lineWidth = 1.1;
  hctx.setLineDash(DASH_PALM_A); hctx.lineDashOffset = -t * 24;
  hctx.beginPath(); hctx.arc(cxp, cyp, pr, 0, 6.2832); hctx.stroke();
  hctx.globalAlpha = handAlpha * .38;
  hctx.strokeStyle = 'rgba(160,210,255,.9)'; hctx.lineWidth = .9;
  hctx.setLineDash(DASH_PALM_B); hctx.lineDashOffset = t * 16;
  hctx.beginPath(); hctx.arc(cxp, cyp, pr * .62, 0, 6.2832); hctx.stroke();
  hctx.setLineDash([]);
  hctx.globalAlpha = handAlpha * .5;
  hctx.strokeStyle = 'rgba(255,224,190,.85)'; hctx.lineWidth = 1.1;
  hctx.beginPath();
  hctx.moveTo(cxp - 9, cyp); hctx.lineTo(cxp + 9, cyp);
  hctx.moveTo(cxp, cyp - 9); hctx.lineTo(cxp, cyp + 9); hctx.stroke();

  // 腕点：菱形锚记（保留）+ 一圈柔光
  hctx.globalAlpha = handAlpha * .5;
  hctx.drawImage(SPR.joint, wx - 15 * breath, wy - 15 * breath, 30 * breath, 30 * breath);
  hctx.save(); hctx.translate(wx, wy); hctx.rotate(Math.PI / 4);
  hctx.globalAlpha = handAlpha * .9;
  hctx.strokeStyle = 'rgba(190,232,255,.95)'; hctx.lineWidth = 1.5;
  hctx.strokeRect(-4.4 * breath, -4.4 * breath, 8.8 * breath, 8.8 * breath);
  hctx.globalAlpha = handAlpha * .8;
  hctx.fillStyle = 'rgba(255,250,235,.95)';
  hctx.fillRect(-1.3, -1.3, 2.6, 2.6);
  hctx.restore();

  // 捏合：越紧 → 连线越亮越宽 + 光点向中点汇聚；松手 → 一次轻柔扩散
  const tight = clamp(live ? G.pinch : prevTight * .92, 0, 1);
  const p4x = AX[4], p4y = AY[4];
  const d8 = Math.hypot(p4x - AX[8], p4y - AY[8]), d12 = Math.hypot(p4x - AX[12], p4y - AY[12]);
  const tx = d8 <= d12 ? AX[8] : AX[12], ty = d8 <= d12 ? AY[8] : AY[12];
  const mx = (p4x + tx) / 2, my = (p4y + ty) / 2;
  if (tight > .04) {
    const dx = tx - p4x, dy = ty - p4y, len = Math.hypot(dx, dy) || .01;
    const wide = (7 + tight * 5) * breath;
    hctx.globalAlpha = handAlpha * (.24 + tight * .66);
    hctx.save();
    hctx.translate(p4x, p4y); hctx.rotate(Math.atan2(dy, dx));
    hctx.drawImage(SPR.band, 0, -wide / 2, len, wide);
    hctx.restore();
    const cr = 4 + tight * 8;                                   // 中点能量核
    hctx.globalAlpha = handAlpha * (.16 + tight * .38);
    hctx.drawImage(SPR.tip, mx - cr, my - cr, cr * 2, cr * 2);
    for (const cv of CONV) {                                    // 汇聚光点流
      cv.u += dt * (1.6 + tight * 2.4);
      if (cv.u > 1) cv.u -= 1;
      const fromTip = cv.side > 0, u = fromTip ? cv.u : 1 - cv.u;
      const e = 1 - (1 - u) * (1 - u);
      const x = fromTip ? tx + (mx - tx) * e : mx + (p4x - mx) * e;
      const y = fromTip ? ty + (my - ty) * e : my + (p4y - my) * e;
      const al = Math.sin(Math.PI * u) * tight;
      const R2 = 1.7 + 3.1 * al;
      hctx.globalAlpha = handAlpha * al;
      hctx.drawImage(SPR.core, x - R2 * 2, y - R2 * 2, R2 * 4, R2 * 4);
    }
  }
  if (live && prevTight > .34 && tight < .18) {                 // 松手那一下：轻微扩散
    const pf = PUFF[puffIdx++ % PUFF.length];
    pf.life = 0; pf.x = mx; pf.y = my;
  }
  prevTight = tight;
  for (const pf of PUFF) {                                      // 扩散波纹
    if (pf.life >= pf.ttl) continue;
    pf.life += dt;
    const k = clamp(1 - pf.life / pf.ttl, 0, 1);
    const R = (16 + (1 - k) * 58) * breath;
    hctx.globalAlpha = handAlpha * k * .42;
    hctx.drawImage(SPR.ringSoft, pf.x - R, pf.y - R, R * 2, R * 2);
  }
  hctx.restore();
}

/* ============================ 5. 手势识别 ============================ */
const CONN = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
const TIPS = [4, 8, 12, 16, 20], PIPS = [3, 6, 10, 14, 18];
const IS_TIP = Array.from({ length: 21 }, (_, i) => TIPS.includes(i));      // 预计算，避免逐帧建数组
const IS_MCP = Array.from({ length: 21 }, (_, i) => [5, 9, 13, 17].includes(i));
/* 判定参数：进入/退出迟滞带 + 指数平滑 + 指认死区/最小稳定帧数 */
const PINCH_IN = .30, PINCH_OUT = .45;               // 捏合：进入 < 0.30 / 退出 > 0.45（迟滞带）
const PINCH_TAU_FAST = .06, PINCH_TAU_SLOW = .12;    // 距离比平滑：收拢 60ms / 松开 120ms
const REACQ_GAP = .25;                               // 超过 250ms 没有手势帧 → 视为重新捕获
const PT_DEAD = .25, PT_MARGIN = .45, PT_FRAMES = 5, PT_GAIN = 10.8; // 指认：死区(张)/未确认前落位范围/最小稳定帧数/指尖位移→牌数增益

const G = {
  mode: 'idle',        // idle | drag | point | pinch | fist
  handX: .5,           // 平滑后的手（屏幕镜像坐标 0..1）
  tipX: .5, tipY: .5,
  pinch: 0, pinchHold: 0, pinchOn: false, cool: 0,
  pinchSm: 1,          // 捏合距离比的指数平滑值（抗单帧抖动，进入阈值只看它）
  lastApply: 0,        // 上一手势帧时间戳：算帧间隔 / 判断是否重新捕获
  reacq: 1,            // 重新捕获后的缓入 0→1（位置插值先慢后快，避免突兀跳变）
  pointCand: -1, pointHold: 0, pointStay: -999,  // 指认：已确认牌号 / 候选连续帧数 / 当前候选
  fistHold: 0,
  anchor: (N - 1) / 2,
  tipBase: -1,         // 指认基准：进入指认/每次换牌时的指尖位置（绝对映射，避免锚点追牌导致牌阵持续漂移）
  lastSeen: -1e9, present: false, dragVX: 0, lastX: null,
  ctx: null
};

function dist(a, b) { const dx = a.x - b.x, dy = a.y - b.y, dz = (a.z || 0) - (b.z || 0); return Math.hypot(dx, dy, dz * .6); }
function extended(lm, tip, pip, wrist, hs) { return dist(lm[tip], wrist) > dist(lm[pip], wrist) * 1.14; }

/* 由 21 个关键点解出手势特征（摄像头与离线探针共用）。
   阈值取自 MediaPipe 官方测试姿态的真实关键点（fist / pointing_up / thumb_up / victory）：
   光看"拇指离指尖近"会把握拳和食指指认误判成捏合（实测比值 0.20 vs 捏合 <0.15），
   所以捏合必须同时满足：那根手指是伸开的（指尖离自己掌指关节足够远）。 */
function analyzeHand(lm) {
  const hs = Math.max(.02, dist(lm[0], lm[9]));
  const wrist = lm[0];
  const ext = [extended(lm, 8, 6, wrist, hs), extended(lm, 12, 10, wrist, hs), extended(lm, 16, 14, wrist, hs), extended(lm, 20, 18, wrist, hs)];
  const nExt = ext.filter(Boolean).length;
  const palm = { x: (lm[0].x + lm[5].x + lm[9].x + lm[13].x + lm[17].x) / 5, y: (lm[0].y + lm[5].y + lm[9].y + lm[13].y + lm[17].y) / 5 };
  const d48 = dist(lm[4], lm[8]) / hs, d412 = dist(lm[4], lm[12]) / hs;
  const tip8mcp5 = dist(lm[8], lm[5]) / hs, tip12mcp9 = dist(lm[12], lm[9]) / hs;
  const idxPinch = d48 < .30 && tip8mcp5 > .45;      // 拇指+食指捏合
  const midPinch = d412 < .30 && tip12mcp9 > .45;    // 拇指+中指捏合
  const pinchRaw = Math.min(idxPinch ? d48 : 9, midPinch ? d412 : 9);
  const strength = clamp(1 - (pinchRaw - .10) / (.30 - .10), 0, 1);
  const thumbPinky = dist(lm[4], lm[17]) / hs;       // 握拳 vs 竖拇指：拇指尖离小指根的距离
  return {
    hs, ext, nExt, palm, pinchRaw, strength, d48, d412, tip8mcp5, tip12mcp9, thumbPinky,
    sx: 1 - palm.x, tipSX: 1 - lm[8].x, tipSY: lm[8].y,
    pointing: ext[0] && !ext[1] && !ext[2] && !ext[3],
    openPalm: nExt >= 4 || (nExt === 3 && ext[0] && ext[1]),
    fist: nExt === 0 && thumbPinky < 1.10
  };
}

function applyHand(lm, now) {
  const A = analyzeHand(lm);
  const { hs, ext, nExt, pinchRaw, strength } = A;
  const sx = A.sx, tipSX = A.tipSX, tipSY = A.tipSY;

  // 帧间隔：手移出画面/被遮挡/刚回来（间隔过大）时按"重新捕获"处理
  const gap = G.lastApply ? (now - G.lastApply) / 1000 : 1e9;
  const dt = clamp(gap, 0, .1);
  G.lastApply = now;
  const reacquired = !G.present || gap > REACQ_GAP;
  if (reacquired) {
    // 平滑器从"张开"先验种入（≤1.0）：既不跳变，也不会把刚出现的那一下当成一次捏合
    G.pinchSm = Math.min(pinchRaw, 1);
    G.pinch = strength;
    G.pinchHold = 0;
    G.lastX = null; G.dragVX = 0;
    G.tipBase = -1; G.pointCand = -1; G.pointHold = 0; G.pointStay = -999;
  } else {
    const tau = pinchRaw < G.pinchSm ? PINCH_TAU_FAST : PINCH_TAU_SLOW;   // 收拢快、松开慢
    G.pinchSm += (pinchRaw - G.pinchSm) * (1 - Math.exp(-dt / tau));
    G.pinch += (strength - G.pinch) * (1 - Math.exp(-dt / .12));
  }
  // 重新捕获后位置缓入：插值系数先慢后快，杜绝手回来时牌阵突兀跳变
  G.reacq = reacquired ? 0 : Math.min(1, G.reacq + dt / .35);
  const alpha = lerp(.10, .34, G.reacq);
  G.handX = lerp(G.handX, clamp(sx, 0, 1), alpha);
  G.tipX = lerp(G.tipX, clamp(tipSX, 0, 1), alpha);
  G.tipY = lerp(G.tipY, tipSY, alpha);
  // 指认基准必须在位置平滑之后取，否则刚回来时基准和指尖对不上，会自己走牌
  if (G.tipBase < 0) { G.tipBase = G.tipX; G.pointCand = focusedIdx(); }
  G.present = true; G.lastSeen = now;

  const { pointing, openPalm, fist } = A;

  // 捏合：进入看平滑值（抗单帧抖动），退出看原始值（松手立刻解锁）；迟滞 0.30/0.45，保持约 0.08s，冷却 0.7s
  const pinching = G.pinchOn
    ? pinchRaw < PINCH_OUT
    : (G.pinchSm < PINCH_IN && pinchRaw < PINCH_OUT);
  // 只有"当前这一帧真的在捏"才累计保持帧；否则清零。
  // （否则 pinchHold 残留 + 刚松开 + 冷却结束，会在手掌张开时凭空翻牌 —— 实测踩过）
  if (pinching && !G.pinchOn) { G.pinchHold += 1; } else { G.pinchHold = 0; }
  if (G.cool > 0) G.cool--;
  if (pinching && G.pinchHold > 4 && !G.pinchOn && G.cool <= 0) {
    G.pinchOn = true; G.cool = 42;
    flipCard(clamp(Math.round(target), 0, N - 1));
  }
  if (G.pinchOn && pinchRaw > PINCH_OUT) G.pinchOn = false;

  // 模式判定（优先级 捏合 > 指认 > 张掌 > 握拳）
  const mode = pinching ? 'pinch' : pointing ? 'point' : openPalm ? 'drag' : fist ? 'fist' : 'hold';
  if (mode !== G.mode) {
    G.mode = mode; hudMode(mode);
    if (mode === 'point') { G.tipBase = G.tipX; G.pointCand = focusedIdx(); G.pointHold = 0; G.pointStay = -999; }
    if (mode === 'drag') { G.lastX = null; }
  }

  if (mode === 'drag') {
    // 手掌左右移动 → 牌跟随滑动；越快惯性越大
    const g = 8.6;
    const t = clamp((N - 1) / 2 - (G.handX - .5) * 2 * g, -1.2, N - .0 + 1.2);
    if (G.lastX != null) G.dragVX = lerp(G.dragVX, (G.handX - G.lastX) / Math.max(1e-3, 1), .3);
    G.lastX = G.handX;
    target = clamp(t, -1.5, N - .5);
    G.anchor = target;
  } else if (mode === 'point') {
    // 指认：以"已确认牌号 + 指尖相对基准的位移"做绝对映射（不让锚点追牌，静止指认时牌阵不再漂）
    if (G.pointCand < 0) G.pointCand = focusedIdx();
    const want = G.pointCand + (G.tipX - G.tipBase) * PT_GAIN;
    const wantCard = clamp(Math.round(want), 0, N - 1);
    if (wantCard !== G.pointCand && Math.abs(want - G.pointCand) > .5 + PT_DEAD) {
      if (G.pointStay !== wantCard) { G.pointStay = wantCard; G.pointHold = 0; }
      else G.pointHold += 1;
      if (G.pointHold >= PT_FRAMES) {                      // 一次只确认相邻一张，避免整排瞬间甩过去
        G.pointCand = clamp(G.pointCand + Math.sign(wantCard - G.pointCand), 0, N - 1);
        G.tipBase = G.tipX;                                // 换牌后重取基准，指头不动就不会继续走牌
        G.pointHold = 0; G.pointStay = -999;
      }
    } else { G.pointHold = 0; G.pointStay = -999; }
    // 未确认切换前把落位限制在当前牌内（±0.45），focus 就不会在两张牌之间来回抖
    const idx = G.pointCand === wantCard ? want
      : clamp(want, G.pointCand - PT_MARGIN, G.pointCand + PT_MARGIN);
    target = clamp(idx, 0, N - 1);
  } else if (mode === 'fist') {
    G.fistHold++;
    if (G.fistHold > 70) { G.fistHold = -60; chooseAgain(); }
  } else if (mode === 'pinch') {
    // 捏合时轻微前推：牌浮起
    target = clamp(target, 0, N - 1);
  }
  G.ctx = { lm, ext, hs, pinchRaw };
}

function handLost(now) {
  if (G.present && now - G.lastSeen > 230) {
    // 手离开画面：保留最后一次动量 → 惯性滑行
    if (Math.abs(vel) > 1.2) target = clamp(scroll + vel * .42, -1.5, N - .5);
    // 不解除捏合锁：检测卡顿/手暂离后，必须先张开手再捏合，避免同一动作翻两张
    // 同时清掉保持帧/指认候选，手回来时不会接着残留计数凭空触发
    G.present = false; G.mode = 'idle'; G.fistHold = 0;
    G.pinchHold = 0; G.pointHold = 0; G.pointStay = -999;
    hudMode('idle');
  }
}

/* 摄像头 + MediaPipe */
let video, ocv, octx, landmarker = null, landmarkerImg = null, camOn = false, lastVideoTime = -1;
async function startCamera() {
  $('#veil').classList.add('gone');
  const status = $('#camStatus');
  status.textContent = '正在载入手部模型…';
  try {
    landmarker = await HandLandmarker.createFromOptions(await FilesetResolver.forVisionTasks('./vendor/wasm'), {
      baseOptions: { modelAssetPath: './models/hand_landmarker.task', delegate: 'GPU' },
      runningMode: 'VIDEO', numHands: 1, minHandDetectionConfidence: .5, minHandPresenceConfidence: .5, minTrackingConfidence: .5
    });
  } catch (e) {
    try {
      landmarker = await HandLandmarker.createFromOptions(await FilesetResolver.forVisionTasks('./vendor/wasm'), {
        baseOptions: { modelAssetPath: './models/hand_landmarker.task' },
        runningMode: 'VIDEO', numHands: 1
      });
    } catch (e2) {
      status.textContent = '模型载入失败 · 已切换鼠标模式';
      mouseMode(); toast('手部模型载入失败，可用鼠标操作'); return;
    }
  }
  try {
    const st = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 960 }, height: { ideal: 540 }, facingMode: 'user' }, audio: false });
    video.srcObject = st; await video.play();
    document.body.classList.add('cam-on');           // 露出模糊人像层 + 手部锚点层
    camOn = true; status.textContent = '摄像头已就绪 · 抬手试试';
    $('#camDot').classList.add('on');
    $('#camWrap').classList.add('live');
    toast('识别已开启 · 抬手试试');
  } catch (e) {
    status.textContent = '摄像头未授权 · 已切换鼠标模式（拖动滑动 / 点击翻牌）';
    mouseMode(); toast('摄像头未授权，已切换鼠标模式');
  }
}
function mouseMode() {
  camOn = false; document.body.classList.add('nomouse'); document.body.classList.remove('cam-on');
  if (hctx) hctx.clearRect(0, 0, VW, VH); handAlpha = 0;
}

function detect(now) {
  if (!camOn || !landmarker || !video || video.readyState < 2) return;
  const vt = video.currentTime;
  if (vt !== lastVideoTime) {
    lastVideoTime = vt;
    let res = null;
    try { res = landmarker.detectForVideo(video, now); } catch (e) { return; }
    octx.save(); octx.clearRect(0, 0, ocv.width, ocv.height);
    octx.translate(ocv.width, 0); octx.scale(-1, 1);
    if (res && res.landmarks && res.landmarks.length) {
      const sm = smoothLm(res.landmarks[0]);
      drawSkeleton(res.landmarks[0], octx);
      drawAnchors(sm, now);                       // 全屏手部锚点（人像已模糊，只留发光骨架）
      applyHand(sm, now);
    } else {
      drawAnchors(null, now);
      handLost(now);
    }
    octx.restore();
    $('#camWrap').classList.toggle('active', !!(res && res.landmarks && res.landmarks.length));
  }
  handLost(now);
}
function smoothLm(lm) {
  if (!G._sm || G._sm.length !== 21) G._sm = lm.map(p => ({ ...p }));
  else for (let i = 0; i < 21; i++) {
    G._sm[i].x = lerp(G._sm[i].x, lm[i].x, .55);
    G._sm[i].y = lerp(G._sm[i].y, lm[i].y, .55);
    G._sm[i].z = lerp(G._sm[i].z || 0, lm[i].z || 0, .55);
  }
  return G._sm;
}
function drawSkeleton(lm, ctx) {
  const X = (p) => p.x * ocv.width, Y = (p) => p.y * ocv.height;
  ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(255,222,156,.75)';
  for (const [a, b] of CONN) { ctx.beginPath(); ctx.moveTo(X(lm[a]), Y(lm[a])); ctx.lineTo(X(lm[b]), Y(lm[b])); ctx.stroke(); }
  for (let i = 0; i < 21; i++) {
    const big = IS_TIP[i];
    ctx.fillStyle = big ? 'rgba(150,225,255,.95)' : 'rgba(255,180,220,.75)';
    ctx.beginPath(); ctx.arc(X(lm[i]), Y(lm[i]), big ? 3.4 : 2, 0, 6.2832); ctx.fill();
  }
  const p = G.pinch;
  ctx.strokeStyle = `rgba(255,236,180,${.25 + p * .7})`; ctx.lineWidth = 1 + p * 2.2;
  ctx.beginPath(); ctx.arc(X(lm[4]), Y(lm[4]), 8 + p * 12, 0, 6.2832); ctx.stroke();
}

/* ============================ 6. 鼠标 / 触摸 / 键盘兜底 ============================ */
let dragging = false, dragScroll = 0, dragX = 0, dragT = 0, dragVel = 0;
let pressI = -1, pressX = 0, pressY = 0, moved = 0;
const stage = $('#stage');
stage.addEventListener('pointerdown', (e) => {
  const hit = e.target.closest ? e.target.closest('.card') : null;
  pressI = hit ? +hit.dataset.i : -1;
  pressX = e.clientX; pressY = e.clientY; moved = 0;
  dragging = true; dragX = e.clientX; dragT = performance.now(); dragScroll = scroll; dragVel = 0;
  try { stage.setPointerCapture(e.pointerId); } catch (err) {}
});
stage.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  moved = Math.max(moved, Math.hypot(e.clientX - pressX, e.clientY - pressY));
  const now = performance.now(), dt = Math.max(8, now - dragT);
  const ns = dragScroll - (e.clientX - dragX) / SP;
  dragVel = lerp(dragVel, (ns - scroll) / (dt / 1000), .25);
  dragScroll = ns; target = ns;
  dragX = e.clientX; dragT = now;
});
function endDrag() {
  if (!dragging) return;
  dragging = false;
  if (moved < 7) {                       // 轻点：不当作滑动
    target = dragScroll;
    if (pressI >= 0) onCardClick(pressI);
    return;
  }
  if (Math.abs(dragVel) > 2.2) target = clamp(scroll + dragVel * .42, -1.5, N - .5);   // 甩动 → 惯性滑行
}
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);
stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  target = clamp(target + Math.sign(e.deltaY) * -1 * Math.min(1.4, Math.abs(e.deltaY) / 90), -1.5, N - .5);
}, { passive: false });
addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'd') target = clamp(Math.round(target) + 1, 0, N - 1);
  if (e.key === 'ArrowLeft' || e.key === 'a') target = clamp(Math.round(target) - 1, 0, N - 1);
  if (e.key === ' ' || e.key === 'Enter') { flipCard(clamp(Math.round(target), 0, N - 1)); e.preventDefault(); }
  if (e.key === 'r') chooseAgain();
  if (e.key === 'p' || e.key === 'P') openSpreadPanel();
  if (e.key === 'h' || e.key === 'H') openHistory();
  if (e.key === 'n' || e.key === 'N') openNumPanel();
  if (e.key === 'v' || e.key === 'V') $('#camWrap').classList.toggle('show');
  if (e.key === 'm' || e.key === 'M') { muted = !muted; $('#sndBtn').textContent = muted ? '🔇' : '🔊'; }
  if (e.key === 'Escape') {                       // 先关面板 → 再收好牌 → 最后退出摄像头模式
    if (sheetOpen('spreadPanel') || sheetOpen('histPanel') || sheetOpen('numPanel')) { closeSheet('spreadPanel'); closeSheet('histPanel'); closeSheet('numPanel'); }
    else if (els.some(o => o.pulled) || $('#reading').classList.contains('show')) { putBack(); hideBoard(); }
    else if (G.camOn) mouseMode('已切到鼠标模式：拖动滑动 · 点击翻牌');
  }
});
function onCardClick(i) {
  if (i === focusedIdx() || (screenXOfCard(i) > VW * .3 && screenXOfCard(i) < VW * .7)) flipCard(i);
  else target = clamp(i, 0, N - 1);      // 点侧边的牌 → 先滑到中间
}
function focusCard(i, flipAlso) { target = clamp(i, 0, N - 1); if (flipAlso) setTimeout(() => flipCard(i), 380); }

/* ============================ 7. 声音（WebAudio 合成，无外部文件） ============================ */
let actx = null, muted = false;
function sound(kind) {
  if (muted) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t0 = actx.currentTime;
    const notes = kind === 'flip' ? [880, 1320, 1760] : kind === 'draw' ? [300, 470, 660] : kind === 'shuffle' ? [520, 660, 780, 1040] : [660, 990];
    notes.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = f * (kind === 'select' ? 1 : 1);
      g.gain.setValueAtTime(0, t0 + i * .05);
      g.gain.linearRampToValueAtTime(kind === 'flip' ? .12 : kind === 'draw' ? .05 : .07, t0 + i * .05 + .01);
      g.gain.exponentialRampToValueAtTime(.0008, t0 + i * .05 + (kind === 'shuffle' ? 1.1 : .9));
      o.connect(g).connect(actx.destination); o.start(t0 + i * .05); o.stop(t0 + i * .05 + 1.3);
    });
  } catch (e) { /* 静默 */ }
}

/* ============================ 8. HUD / 提示 ============================ */
const MODE_TXT = {
  idle: ['待机', '抬手进入识别范围'],
  drag: ['✦ 移动中', '手掌左右移动，卡牌跟随滑动'],
  point: ['☝ 指认', '指向哪张就选中哪张 —— 捏合把它抽出来'],
  pinch: ['🤏 捏合', '拇指+食指/中指捏合 → 抽出并翻开'],
  fist: ['✊ 握拳', '保持握拳约 1 秒 → 重新洗牌'],
  hold: ['· 保持', '伸直五指可滑动，食指单指可指认']
};
function hudMode(m) { const [a, b] = MODE_TXT[m] || MODE_TXT.idle; $('#modeName').textContent = a; $('#modeHint').textContent = b; }
let lastFoc = -1, lastSel = -1;
function updateHUD() {
  const i = focusedIdx();
  if (i !== lastFoc) {
    lastFoc = i;
    $('#focusName').textContent = `${ROMAN[els[i].ci]} ${els[i].card.zh}`;
    if (G.mode === 'point' && lastSel !== i) { lastSel = i; sound('select'); }
  }
  $('#pinchBar').style.width = (G.pinch * 100).toFixed(0) + '%';
  $('#pinchBar').style.opacity = G.present ? 1 : .25;
  $('#count').textContent = SESSION ? `${SESSION.cards.length} / ${SPREAD_BY_ID[SESSION.spreadId].cards} 张` : `${revealed} / ${N}`;
  $('#fps').textContent = fps.toFixed(0);
}

let toastT = 0;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800);
}

/* ============================ 9. 演示模式（无摄像头验收 / ?demo=1） ============================ */
function syntheticHand(px, py, kind = 'open', t = 0) {
  // 按 MediaPipe 21 点顺序生成：0 腕；1-4 拇指；5-8 食指；9-12 中指；13-16 无名指；17-20 小指
  const lm = new Array(21);
  const jit = Math.sin(t * 6.1) * .0015;
  lm[0] = { x: px, y: py + .21, z: 0 };
  const MCP = [5, 9, 13, 17], PIP = [6, 10, 14, 18], DIP = [7, 11, 15, 19], TIP = [8, 12, 16, 20];
  const mcpX = [-.052, -.018, .016, .048], mcpY = [.035, .02, .018, .03];
  const lenBase = [.150, .163, .150, .120];
  for (let f = 0; f < 4; f++) {
    const bx = px + mcpX[f], by = py + mcpY[f];
    lm[MCP[f]] = { x: bx, y: by, z: 0 };
    let L = lenBase[f], dx = f * .16 - .24, dy = -1;
    if (kind === 'fist') { L *= .42; dx = (f - 1.5) * .12; dy = .55; }
    else if (kind === 'point' && f > 0) { L *= .50; dx = (f - 1.5) * .12; dy = .60; }
    else if (kind === 'pinch') { if (f === 0) { L *= .98; dx = -.05; dy = -1; } else { L *= .55; dx = (f - 1.5) * .12; dy = .45; } }
    const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n;
    const ks = [.45, .74, 1.0];
    [PIP[f], DIP[f], TIP[f]].forEach((idx, k) => {
      lm[idx] = { x: bx + dx * L * ks[k] + jit, y: by + dy * L * ks[k] + jit * .5, z: 0 };
    });
  }
  if (kind === 'pinch') {                        // 拇指尖贴到食指尖
    const it = lm[8];
    lm[1] = { x: px - .046, y: py + .112, z: 0 };
    lm[2] = { x: px - .034, y: py + .045, z: 0 };
    lm[3] = { x: it.x - .026, y: it.y + .012, z: 0 };
    lm[4] = { x: it.x - .013, y: it.y + .019, z: 0 };
  } else if (kind === 'fist') {                  // 拇指压在四指外侧
    lm[1] = { x: px - .050, y: py + .115, z: 0 };
    lm[2] = { x: px - .078, y: py + .075, z: 0 };
    lm[3] = { x: px - .090, y: py + .030, z: 0 };
    lm[4] = { x: px - .096, y: py - .005, z: 0 };
  } else {                                       // 自然张开
    lm[1] = { x: px - .050, y: py + .120, z: 0 };
    lm[2] = { x: px - .085, y: py + .070, z: 0 };
    lm[3] = { x: px - .105, y: py + .030, z: 0 };
    lm[4] = { x: px - .112, y: py - .005, z: 0 };
  }
  return lm;
}

let demo = params.get('demo') !== null && params.get('demo') !== '0';
let demoStart = 0;
function runDemo(now) {
  if (!demoStart) demoStart = now;
  const t = (now - demoStart) / 1000;
  const T = t % 16;
  let lm = null;
  if (T < 3.6)       lm = syntheticHand(.28 + (T / 3.6) * .44, .60, 'open', t);   // 张掌向右
  else if (T < 5.2)  lm = syntheticHand(.72 - ((T - 3.6) / 1.6) * .5, .60, 'open', t); // 惯性回摆
  else if (T < 8.0)  lm = syntheticHand(.44, .58, 'point', t);                     // 指认
  else if (T < 10.4) lm = syntheticHand(.46, .58, 'pinch', t);                     // 捏合翻牌
  else if (T < 12.4) lm = syntheticHand(.56, .60, 'open', t);                      // 保持
  if (lm) { drawAnchors(lm, now); applyHand(lm, now); }
  else { drawAnchors(null, now + 400); handLost(now + 400); G.present = false; }   // 手离场 → 惯性
  requestAnimationFrame(runDemo);
}

/* ============================ 10. 主循环 ============================ */
let last = performance.now(), fps = 60, fpsAcc = 0, fpsN = 0, jsEma = 0;
function frame(now) {
  const js0 = performance.now();
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  const t = now / 1000;
  fpsAcc += 1 / Math.max(dt, 1e-3); fpsN++;
  if (fpsN > 20) { fps = fpsAcc / fpsN; fpsAcc = 0; fpsN = 0; perfTick(); }

  drawBG(t);
  stepPhysics(dt, t);
  drawFX(dt, t);
  if (camOn) detect(now);
  jsEma += ((performance.now() - js0) - jsEma) * .05;   // 每帧 JS 耗时指数平均（性能回归对比用）
  requestAnimationFrame(frame);
}

/* ============================ 11. 启动 ============================ */
/* 牌面画预取：78 张 webp（合计约 7MB）在空闲时按帧分摊后台取一遍，
   抽牌就不会再出现「先看到矢量兜底画、再一下跳成插画」。
   省流/慢网（saveData 或 2G）不预取，仍按需加载。 */
function prefetchFaces() {
  const c = navigator.connection;
  if (c && (c.saveData || /2g/.test(c.effectiveType || ''))) return;   // 省流/慢网就不预取
  /* 注意：不要用 new Image() —— 不保留引用的图片对象会被 GC 掉，
     请求中途被取消，缓存里什么也没留下（实测翻牌时仍要重新下载 96KB）。
     用 fetch 并把 body 读成 blob 再丢掉，响应才会真正落进 HTTP 缓存。 */
  const urls = [];
  for (let i = 0; i < CARDS.length; i++) urls.push(cardArtURL(i));
  let k = 0;
  const next = () => {
    if (k >= urls.length) return;
    fetch(urls[k++], { cache: 'force-cache' }).then((r) => r.blob()).catch(() => { });
    setTimeout(next, 120);          // 每 120ms 起一张：78 张约 9 秒排完，不抢翻牌动画
  };
  setTimeout(next, 1200);           // 等首屏稳定后再开始
}

function boot() {
  video = $('#video'); ocv = $('#overlay'); octx = ocv.getContext('2d');
  ocv.width = 320; ocv.height = 240;
  sizeCanvas();
  document.body.insertAdjacentHTML('beforeend', cardBackDefs());   // 78 张共用的牌背 symbol
  buildRow();
  prefetchFaces();
  addEventListener('resize', sizeCanvas);
  $('#pinchBar').style.width = '0%';
  hudMode('idle');
  updateHUD();
  // 左下角 HUD 补一句隐私说明（不改 index.html，就地插入）
  const priv = document.createElement('div');
  priv.id = 'privacyNote';
  priv.textContent = '摄像头只用于识别手势，画面不会出现在屏幕上';
  priv.style.cssText = 'margin-top:9px;font-size:10.5px;line-height:1.6;letter-spacing:.06em;color:#7d76a4';
  $('#hud').appendChild(priv);
  requestAnimationFrame(frame);

  $('#startBtn').onclick = () => { sound('select'); startCamera(); };
  $('#mouseBtn').onclick = () => { $('#veil').classList.add('gone'); mouseMode(); $('#camStatus').textContent = '鼠标模式：拖动滑动 · 点击翻牌'; if (!params.has('demo')) setTimeout(openSpreadPanel, 500); };  /* 验收脚本用 ?demo= 运行，不自动弹面板 */
  $('#sndBtn').onclick = () => { muted = !muted; $('#sndBtn').textContent = muted ? '🔇' : '🔊'; };
  $('#camToggle').onclick = () => $('#camWrap').classList.toggle('show');
  $('#againTop').onclick = chooseAgain;
  $('#spreadBtn').onclick = () => { sound('select'); openSpreadPanel(); };
  $('#histBtn').onclick = () => { sound('select'); openHistory(); };
  $('#spreadX').onclick = () => closeSheet('spreadPanel');
  $('#histX').onclick = () => closeSheet('histPanel');
  $('#numBtn').onclick = () => { sound('select'); openNumPanel(); };
  $('#numX').onclick = () => closeSheet('numPanel');
  $('#numGo').onclick = () => startNumberDraw();
  $('#numText').addEventListener('input', () => {          // 直接打数字：1 3 12 / 1,3,12 都认
    const need = numNeed(), out = [], seen = new Set();
    let bad = '';
    for (const tok of $('#numText').value.split(/[^0-9]+/).filter(Boolean)) {
      const n = +tok;
      if (n < 1 || n > N) { bad = `号码要在 1 – ${N} 之间`; continue; }
      if (seen.has(n)) { bad = `${n} 号重复了`; continue; }
      seen.add(n); out.push(n);
    }
    NUMSEL = out.slice(0, need);
    if (out.length > need) bad = `只需要 ${need} 个号码，多的已忽略`;
    renderNumPanel(false);
    if (bad) $('#numHint').innerHTML = `<span style="color:#ffabd6">${bad}</span> · 已选 <b>${NUMSEL.length}</b> / ${need} 个`;
  });
  $('#histClear').onclick = () => { if (confirm('清空全部抽取记录？此操作不可撤销。')) { HIST.clear(); renderHistory(); refreshHistN(); toast('记录已清空'); } };
  refreshHistN();
  if (demo) { $('#veil').classList.add('gone'); document.body.classList.add('demo'); requestAnimationFrame(runDemo); }

  // 供自动化验收调用
  window.taro = {
    /* 拿一张真实手掌照片跑一遍手部模型 + 手势判定（离线，不需要摄像头） */
    probeImage: async (url) => {
      const img = new Image(); img.crossOrigin = 'anonymous';
      await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('image load failed: ' + url)); img.src = url; });
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || 640; c.height = img.naturalHeight || 480;
      c.getContext('2d').drawImage(img, 0, 0);
      if (!landmarkerImg) {
        landmarkerImg = await HandLandmarker.createFromOptions(await FilesetResolver.forVisionTasks('./vendor/wasm'), {
          baseOptions: { modelAssetPath: './models/hand_landmarker.task' }, runningMode: 'IMAGE', numHands: 1
        });
      }
      const res = landmarkerImg.detect(c);
      const lms = (res.landmarks && res.landmarks[0]) || null;
      if (!lms) return { ok: true, hands: 0, size: [c.width, c.height] };
      const A = analyzeHand(lms);
      return {
        ok: true, hands: res.landmarks.length, size: [c.width, c.height],
        nExt: A.nExt, ext: A.ext, pinchRaw: +A.pinchRaw.toFixed(3), strength: +A.strength.toFixed(3),
        pointing: A.pointing, openPalm: A.openPalm, fist: A.fist, palmX: +A.palm.x.toFixed(3), screenX: +A.sx.toFixed(3),
        lm: lms.map(q => ({ x: +q.x.toFixed(4), y: +q.y.toFixed(4), z: +(q.z || 0).toFixed(4) }))
      };
    },
    /* 合成手势（用于无摄像头回归测试）：kind = open | point | pinch | fist */
    synth: (px, py, kind, t) => syntheticHand(px, py, kind, t || 0),
    /* 把关键点直接喂进手势链路（等价于摄像头识别到的那一帧） */
    feed: (lm, now) => {
      const t = now || performance.now();
      if (!lm) { drawAnchors(null, t); handLost(t); return G.mode; }   // null = 手离开画面
      drawAnchors(lm, t); applyHand(lm, t); return G.mode;              // 与摄像头路径一致：锚点 + 手势
    },
    mode: () => G.mode,
    /* —— 牌阵 / 记录 / 解读：新增钩子，原有字段语义不变 —— */
    spreads: () => SPREADS.map(s => ({ id: s.id, name: s.name, cards: s.cards, slots: s.slots.map(x => x.n) })),
    startSpread: (id) => { startSpread(id); return SESSION ? SESSION.spreadId : null; },
    startFree: () => { startFree(); return true; },
    session: () => SESSION ? { spreadId: SESSION.spreadId, n: SESSION.cards.length, cards: SESSION.cards.map(c => ({ ci: c.ci, rev: c.rev, slot: c.slot })) } : null,
    spreadDone: () => !!(SESSION && SPREAD_BY_ID[SESSION.spreadId] && SESSION.cards.length >= SPREAD_BY_ID[SESSION.spreadId].cards),
    readingOpen: () => $('#reading').classList.contains('show'),
    readingHTML: () => $('#reading').innerHTML,
    readingText: (c) => READING.readingText(c || SESSION || { free: true, cards: [{ ci: els[focusedIdx()].ci, rev: els[focusedIdx()].rev, slot: 0 }] }),
    renderReading: (c) => READING.renderReading(c),
    boardOpen: () => $('#board').classList.contains('show'),
    boardSlots: () => [...document.querySelectorAll('#board .bd-slot')].map(s => s.querySelector('.bd-c').textContent),
    history: () => HIST.load(),
    historyCount: () => HIST.count(),
    clearHistory: () => { HIST.clear(); refreshHistN(); return HIST.load(); },
    openHistory: () => { openHistory(); return HIST.renderList(); },
    openRecord: (id) => { openRecord(id); return $('#reading').classList.contains('show'); },
    /* —— 翻牌时序 / 数字抽牌：新增钩子（原有字段语义不变）—— */
    timing: () => ({ hold: FLIP_HOLD, rate: FLIP_RATE, faceDelay: FACE_DELAY, total: FLIP_TOTAL }),
    faceIn: (i) => els[i].el.classList.contains('face-in'),
    flipped: (i) => !!els[i].flipped,
    flipK: (i) => +els[i].flipK.toFixed(3),
    numOpen: () => sheetOpen('numPanel'),
    numRange: () => ({ min: 1, max: N, need: numNeed() }),
    openNumPanel: () => { openNumPanel(); return { need: numNeed(), buttons: $('#numGrid').children.length, hint: $('#numHint').textContent }; },
    numPick: (n) => { const b = [...$('#numGrid').querySelectorAll('.num-btn')].find(x => +x.dataset.n === n); if (b) b.click(); return NUMSEL.slice(); },
    numType: (s) => { const el = $('#numText'); el.value = s; el.dispatchEvent(new Event('input')); return { sel: NUMSEL.slice(), hint: $('#numHint').textContent }; },
    numGo: () => { startNumberDraw(); return { queue: NUMQ ? NUMQ.slice() : [], open: sheetOpen('numPanel') }; },
    numQueue: () => (NUMQ || []).slice(),
    histFaces: () => [...document.querySelectorAll('#histBody .hs-item')].map(it => ({
      name: it.querySelector('.hs-top b').textContent,
      faces: it.querySelectorAll('.hs-face svg').length,
      slots: [...it.querySelectorAll('.hs-sn')].map(x => x.textContent),
      cells: [...it.querySelectorAll('.hs-slot')].map(x => x.getAttribute('style'))
    })),
    currentSpread: () => (SESSION ? SESSION.spreadId : null),
    numPanelOpen: () => sheetOpen('numPanel'),
    spreadPanelOpen: () => $('#spreadPanel').classList.contains('show'),
    openSpreadPanel: () => { openSpreadPanel(); return $('#spGrid').children.length; },
    cardAt: (i) => ({ ci: els[i].ci, rev: !!els[i].rev, zh: els[i].card.zh, flipped: els[i].flipped }),
    flip: (i) => flipCard(i === undefined ? focusedIdx() : i),
    focus: (i, also) => focusCard(i, also),
    again: chooseAgain,
    putBack: () => putBack(),
    scrollTo: (v) => { target = clamp(v, 0, N - 1); },
    setScroll: (v) => { scroll = target = v; vel = 0; },
    state: () => ({
      scroll: +scroll.toFixed(3), target: +target.toFixed(3), vel: +vel.toFixed(3),
      focus: focusedIdx(), mode: G.mode, pinch: +G.pinch.toFixed(3), present: G.present,
      revealed, camOn, demo,
      flippedIds: els.map((o, i) => o.flipped ? i : -1).filter(i => i >= 0),
      pulledIds: els.map((o, i) => o.pulled ? i : -1).filter(i => i >= 0),
      tags: [...document.querySelectorAll('.tag.show')].map(t => t.textContent),
      cards: els.map(o => ({ i: o.el.dataset.i, ci: o.ci, zh: o.card.zh, x: Math.round(o.x), y: Math.round(o.y), z: Math.round(o.z), ry: Math.round(o.ry), sc: +o.sc.toFixed(3), pull: +o.pull.toFixed(3), pulled: o.pulled, flipped: o.flipped, op: +(+o.el.style.opacity || 0).toFixed(2) })),
      particles: P.length
    })
  };
  // 非验收钩子：仅用于观察帧率自适应状态，window.taro 的结构与语义保持不变
  window.__taroPerf = () => ({
    q: +PERF.q.toFixed(3), fps: +fps.toFixed(1),
    particleCap: perfParticleCap(), stars: Math.round(STARS_FAR.length * (.6 + .4 * PERF.q)),
    nearStars: Math.round(STARS_NEAR.length * (.55 + .45 * PERF.q)),
    dust: Math.round(DUST.length * perfDustK()), glowK: +perfGlowK().toFixed(3),
    jsMs: +jsEma.toFixed(3)
  });
}
boot();
