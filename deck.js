/* 手势塔罗 · 牌面美术（纯程序化 SVG，无外部图片）
   —— 78 张全套：22 张大阿卡纳 + 56 张小阿卡纳（权杖/圣杯/宝剑/星币 × 14）
   —— 每张牌都是一幅「画面」：天空渐变 + 远中近三层地貌 + 人物/道具 + 光影层次，
      而不是只有线条的符号。所有发光都用径向渐变实现（不挂滤镜），保证 78 张也能跑得动。 */
import { MINORS } from './minors.js?v=82';

/* ---------- 22 张大阿卡纳：名称、关键词、正/逆位诗行 ---------- */
const MAJOR_SRC = [
  {zh:'愚者',      en:'THE FOOL',            scene:'fool',    sym:5,  keys:['出发','信任','未知'],
   up:'背上没有行囊，脚下就是路。',       rev:'想得太多，第一步反而更沉。'},
  {zh:'魔术师',    en:'THE MAGICIAN',        scene:'magician',sym:6,  keys:['意志','能力','起手'],
   up:'你手里已有的东西，足够变出奇迹。', rev:'力气用错了方向，等于不动。'},
  {zh:'女祭司',    en:'THE HIGH PRIESTESS',  scene:'priestess',sym:8, keys:['直觉','沉默','月'],
   up:'答案不在外面，在你安静下来的那一刻。', rev:'把心里的声音，让给了别人的评价。'},
  {zh:'女皇',      en:'THE EMPRESS',         scene:'empress', sym:12, keys:['丰饶','照料','绽放'],
   up:'先把自己养好，花才会开。',         rev:'照顾全世界，却忘了自己也需要被照顾。'},
  {zh:'皇帝',      en:'THE EMPEROR',         scene:'emperor', sym:4,  keys:['秩序','边界','担当'],
   up:'把规则立起来，混乱自然退场。',     rev:'太硬的东西，最先碎。'},
  {zh:'教皇',      en:'THE HIEROPHANT',      scene:'hierophant',sym:3,keys:['传承','师承','信念'],
   up:'有人走过的路，值得听一听。',       rev:'别人的标准，不一定是你的答案。'},
  {zh:'恋人',      en:'THE LOVERS',          scene:'lovers',  sym:2,  keys:['选择','联结','心'],
   up:'值得的人，会让你更像你自己。',     rev:'将就也是一种选择，代价在后面。'},
  {zh:'战车',      en:'THE CHARIOT',         scene:'chariot', sym:6,  keys:['前进','掌控','意志'],
   up:'方向定了，风只是风。',             rev:'拉车的两匹马，先要让它们朝同一头。'},
  {zh:'力量',      en:'STRENGTH',            scene:'strength',sym:8,  keys:['温柔','克制','驯服'],
   up:'真正的强大，是不必用力。',         rev:'压住的东西不会消失，只会更响。'},
  {zh:'隐者',      en:'THE HERMIT',          scene:'hermit',  sym:9,  keys:['独处','内省','灯'],
   up:'一个人的夜里，也有一盏灯是自己点的。', rev:'躲得太久，灯会照不到路。'},
  {zh:'命运之轮',  en:'WHEEL OF FORTUNE',    scene:'wheel',   sym:8,  keys:['转机','周期','无常'],
   up:'轮子转到你这里了，伸手。',         rev:'低谷不是终点，是转弯处。'},
  {zh:'正义',      en:'JUSTICE',             scene:'justice', sym:4,  keys:['平衡','坦诚','因果'],
   up:'把秤端平，心里才有位置放别的东西。', rev:'对自己隐瞒的那部分，最重。'},
  {zh:'倒吊人',    en:'THE HANGED MAN',      scene:'hanged',  sym:3,  keys:['停','换角度','献出'],
   up:'换个方向看，困局原来是门。',       rev:'挂着不动，不叫等待，叫耗着。'},
  {zh:'死神',      en:'DEATH',               scene:'death',   sym:5,  keys:['结束','蜕变','清空'],
   up:'旧的结束了，新的才有地方住。',     rev:'舍不得的那部分，正拖着你。'},
  {zh:'节制',      en:'TEMPERANCE',          scene:'temper',  sym:6,  keys:['调和','节奏','适度'],
   up:'慢慢来，是最快的路。',             rev:'忽冷忽热，什么都留不住。'},
  {zh:'恶魔',      en:'THE DEVIL',           scene:'devil',   sym:4,  keys:['束缚','欲望','上瘾'],
   up:'锁链是活的，其实你会开。',         rev:'承认想要什么，比装作清高自由。'},
  {zh:'塔',        en:'THE TOWER',           scene:'tower',   sym:3,  keys:['崩塌','惊醒','真相'],
   up:'塌下来的从来不是地基，是伪装。',   rev:'你在硬撑那面本来就要倒的墙。'},
  {zh:'星星',      en:'THE STAR',            scene:'star',    sym:7,  keys:['希望','疗愈','远方'],
   up:'夜最深的时候，星星开始说话。',     rev:'别把光调暗，只是怕它照见自己。'},
  {zh:'月亮',      en:'THE MOON',            scene:'moon',    sym:9,  keys:['幻象','潜意识','迷雾'],
   up:'看不清不是错觉，是还没天亮的时刻。', rev:'雾散之后，你会发现路一直在这儿。'},
  {zh:'太阳',      en:'THE SUN',             scene:'sun',     sym:12, keys:['明亮','坦率','生机'],
   up:'嘴角扬起来的那个瞬间，答案就有了。', rev:'光还在，只是被自己挡住了。'},
  {zh:'审判',      en:'JUDGEMENT',           scene:'judge',   sym:6,  keys:['觉醒','召唤','翻篇'],
   up:'听见那声音，就该起身了。',         rev:'反复审判自己，不如重新写一遍。'},
  {zh:'世界',      en:'THE WORLD',           scene:'world',   sym:10, keys:['圆满','抵达','下一程'],
   up:'这一圈走完了，你已经不是原来的人。', rev:'差最后一步，别在门口坐下。'}
];
/* 大牌主色：清冷蓝紫为骨，少量暖色点缀 */
const MAJOR_HUES = [210, 44, 232, 332, 6, 196, 342, 218, 26, 244, 190, 152, 268, 258, 350, 12, 206, 186, 236, 40, 226, 316];

export const CARDS = [
  ...MAJOR_SRC.map((c, i) => ({ ...c, ci: i, hue: MAJOR_HUES[i], minor: false })),
  ...MINORS
];
/* 牌阶记号（大牌 0–XXI；小阿卡纳 Ⅰ–Ⅹ / 侍·骑·后·王） */
export const ROMAN = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI']
  .concat(MINORS.map(c => c.rm));

const f = (n) => Math.round(n * 100) / 100;
/* 确定性伪随机：同一张牌每次渲染完全一致（不会闪） */
function rnd(seed) {
  let s = ((seed | 0) * 9301 + 49297) % 233280;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
function starPath(cx, cy, r, n, inner = 0.42, phase = -90) {
  let p = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (phase + i * 180 / n) * Math.PI / 180;
    const rr = i % 2 ? r * inner : r;
    p.push(`${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr)}`);
  }
  return `M${p.join(' L')} Z`;
}
function polygon(cx, cy, r, n, phase = -90) {
  let p = [];
  for (let i = 0; i < n; i++) {
    const a = (phase + i * 360 / n) * Math.PI / 180;
    p.push(`${f(cx + Math.cos(a) * r)},${f(cy + Math.sin(a) * r)}`);
  }
  return `M${p.join(' L')} Z`;
}
/* 山脊 / 沙丘：起伏路径闭合到底边 */
function ridge(seed, y0, amp, w, h, opts = {}) {
  const { jags = 7, bottom = h, sharp = true, rise = 0 } = opts;
  const r = rnd(seed);
  const n = jags + 2, pts = [];
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * w;
    const y = y0 + rise * Math.sin(i / n * Math.PI) - amp * (0.35 + r() * 0.95) + (sharp ? (i % 2 ? amp * 0.34 : -amp * 0.22) : 0);
    pts.push([x, y]);
  }
  let d = `M0 ${f(pts[0][1])}`;
  for (let i = 1; i <= n; i++) {
    if (sharp) d += ` L${f(pts[i][0])} ${f(pts[i][1])}`;
    else { const px = pts[i - 1][0], py = pts[i - 1][1], cx2 = (px + pts[i][0]) / 2;
      d += ` C${f(cx2)} ${f(py)} ${f(cx2)} ${f(pts[i][1])} ${f(pts[i][0])} ${f(pts[i][1])}`; }
  }
  return `${d} L${f(w)} ${f(bottom)} L0 ${f(bottom)} Z`;
}
function waveLine(y0, amp, len, w, phase = 0) {
  let d = `M0 ${f(y0 + Math.sin(phase) * amp)}`;
  for (let x = 0; x <= w; x += 6) d += ` L${f(x)} ${f(y0 + Math.sin(phase + x / len) * amp)}`;
  return d;
}
function water(y0, amp, len, w, h, phase = 0) { return `${waveLine(y0, amp, len, w, phase)} L${f(w)} ${f(h)} L0 ${f(h)} Z`; }
/* 云：几团同色椭圆叠加出的软体积（不用滤镜） */
function cloud(x, y, s, col, op) {
  return `<g fill="${col}" opacity="${op}">
    <ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(16 * s)}" ry="${f(5.2 * s)}"/>
    <ellipse cx="${f(x - 7 * s)}" cy="${f(y + 2 * s)}" rx="${f(10 * s)}" ry="${f(4 * s)}"/>
    <ellipse cx="${f(x + 8 * s)}" cy="${f(y + 1.6 * s)}" rx="${f(11 * s)}" ry="${f(4.4 * s)}"/>
    <ellipse cx="${f(x + 1 * s)}" cy="${f(y - 3.4 * s)}" rx="${f(8 * s)}" ry="${f(4.2 * s)}"/>
  </g>`;
}
function starField(seed, n, w, h, col = '#ffeec9') {
  const r = rnd(seed + 11);
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, s = 0.5 + r() * 1.3;
    out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" fill="${col}" opacity="${f(0.25 + r() * 0.6)}"/>`;
    if (r() > 0.86) out += `<path d="M${f(x - s * 3.4)} ${f(y)} L${f(x + s * 3.4)} ${f(y)} M${f(x)} ${f(y - s * 3.4)} L${f(x)} ${f(y + s * 3.4)}" stroke="${col}" stroke-width=".5" opacity=".55"/>`;
  }
  return out;
}
/* 天体：径向渐变光晕 + 亮核 */
function orb(id, x, y, r, col, coreOp = .95, halo = 4.6) {
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * halo)}" fill="url(#${id}ore)"/>
    <circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${col}" opacity="${coreOp}"/>
    <circle cx="${f(x)}" cy="${f(y)}" r="${f(r * .62)}" fill="#fff" opacity="${f(coreOp * .5)}"/>`;
}
const oreDef = (id, col) => `<radialGradient id="${id}ore"><stop offset="0%" stop-color="${col}" stop-opacity=".6"/><stop offset="36%" stop-color="${col}" stop-opacity=".28"/><stop offset="100%" stop-color="${col}" stop-opacity="0"/></radialGradient>`;
const lgDef = (id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</linearGradient>`;
const rgDef = (id, stops) => `<radialGradient id="${id}">${stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</radialGradient>`;

/* ---------------- 人物：袍 + 头 + 手臂（填色 + 明暗，不是线稿） ---------------- */
/* pose: stand | walk | sit | kneel | raise | back | lie | float */
function figure(id, x, y, s, pose = 'stand', opt = {}) {
  const { robe = '#1c1546', robe2 = '#0d0a26', skin = '#f0d6b4', hood = null, hair = null,
          arms = 'down', wings = false, crown = false, hairLong = false } = opt;
  const H = 30 * s, hy = y - H, hr = 3.6 * s;
  const body = () => {
    if (pose === 'sit') return `M${f(x - 7 * s)} ${f(y)} L${f(x - 6 * s)} ${f(y - 20 * s)} Q${f(x)} ${f(y - 26 * s)} ${f(x + 6 * s)} ${f(y - 20 * s)} L${f(x + 8 * s)} ${f(y)} Z`;
    if (pose === 'kneel') return `M${f(x - 8 * s)} ${f(y)} L${f(x - 5 * s)} ${f(y - 16 * s)} Q${f(x)} ${f(y - 21 * s)} ${f(x + 5 * s)} ${f(y - 16 * s)} L${f(x + 10 * s)} ${f(y)} Z`;
    if (pose === 'lie') return `M${f(x - 13 * s)} ${f(y)} L${f(x - 10 * s)} ${f(y - 7 * s)} L${f(x + 10 * s)} ${f(y - 6 * s)} L${f(x + 13 * s)} ${f(y)} Z`;
    if (pose === 'float') return `M${f(x - 7 * s)} ${f(y)} L${f(x - 5.6 * s)} ${f(y - H * .74)} Q${f(x)} ${f(y - H * .9)} ${f(x + 5.6 * s)} ${f(y - H * .74)} L${f(x + 7 * s)} ${f(y)} Z`;
    return `M${f(x - 7.2 * s)} ${f(y)} L${f(x - 6 * s)} ${f(y - H * .72)} Q${f(x)} ${f(y - H * .86)} ${f(x + 6 * s)} ${f(y - H * .72)} L${f(x + 7.6 * s)} ${f(y)} Z`;
  };
  const armPath = (side) => {
    const sx = x + side * 5.4 * s, sy = y - H * .74;
    if (arms === 'raise') return `M${f(sx)} ${f(sy)} Q${f(sx + side * 5 * s)} ${f(sy - 9 * s)} ${f(sx + side * 3.4 * s)} ${f(sy - 15 * s)}`;
    if (arms === 'up') return `M${f(sx)} ${f(sy)} Q${f(sx + side * 4 * s)} ${f(sy - 10 * s)} ${f(sx + side * 1.4 * s)} ${f(sy - 17 * s)}`;
    if (arms === 'hold') return `M${f(sx)} ${f(sy)} Q${f(sx + side * 6 * s)} ${f(sy + 3 * s)} ${f(sx + side * 2.2 * s)} ${f(sy + 8 * s)}`;
    if (arms === 'open') return `M${f(sx)} ${f(sy)} Q${f(sx + side * 8 * s)} ${f(sy - 1 * s)} ${f(sx + side * 10 * s)} ${f(sy + 5 * s)}`;
    if (arms === 'cross') return `M${f(sx)} ${f(sy)} Q${f(sx - side * 1 * s)} ${f(sy + 6 * s)} ${f(sx - side * 5 * s)} ${f(sy + 6 * s)}`;
    return `M${f(sx)} ${f(sy)} Q${f(sx + side * 3.4 * s)} ${f(sy + 7 * s)} ${f(sx + side * 1.6 * s)} ${f(sy + 13 * s)}`;
  };
  const head = pose === 'back'
    ? `<circle cx="${f(x)}" cy="${f(hy + hr)}" r="${f(hr)}" fill="${hood || hair || skin}"/>`
    : `<circle cx="${f(x)}" cy="${f(hy + hr)}" r="${f(hr)}" fill="${skin}"/>
       <path d="M${f(x - hr)} ${f(hy + hr - .6 * s)} Q${f(x)} ${f(hy - 1.4 * s)} ${f(x + hr)} ${f(hy + hr - .6 * s)}" fill="${hair || '#2a1c33'}"/>`;
  return `<g>
    <ellipse cx="${f(x)}" cy="${f(y + .6 * s)}" rx="${f(8.6 * s)}" ry="${f(1.5 * s)}" fill="#000" opacity=".32"/>
    ${wings ? `<path d="M${f(x)} ${f(y - H * .72)} C${f(x - 26 * s)} ${f(y - H * .98)} ${f(x - 30 * s)} ${f(y - H * .42)} ${f(x - 8 * s)} ${f(y - H * .34)} Z" fill="url(#${id}wg)" opacity=".92"/>
      <path d="M${f(x)} ${f(y - H * .72)} C${f(x + 26 * s)} ${f(y - H * .98)} ${f(x + 30 * s)} ${f(y - H * .42)} ${f(x + 8 * s)} ${f(y - H * .34)} Z" fill="url(#${id}wg)" opacity=".92"/>` : ''}
    <path d="${body()}" fill="url(#${id}rb)"/>
    <path d="M${f(x)} ${f(y - H * .8)} L${f(x)} ${f(y - H * .06)}" stroke="#000" stroke-opacity=".16" stroke-width="${f(.7 * s)}"/>
    <path d="M${f(x - 3.4 * s)} ${f(y - 2 * s)} L${f(x - 3.4 * s)} ${f(y)} M${f(x + 3.4 * s)} ${f(y - 2 * s)} L${f(x + 3.4 * s)} ${f(y)}" stroke="#000" stroke-opacity=".22" stroke-width="${f(.8 * s)}"/>
    <path d="${armPath(-1)}" fill="none" stroke="url(#${id}rb)" stroke-width="${f(2.6 * s)}" stroke-linecap="round"/>
    <path d="${armPath(1)}" fill="none" stroke="url(#${id}rb)" stroke-width="${f(2.6 * s)}" stroke-linecap="round"/>
    ${hairLong ? `<path d="M${f(x - hr * 1.1)} ${f(hy + hr)} Q${f(x - hr * 1.8)} ${f(hy + hr + 12 * s)} ${f(x - hr * .5)} ${f(hy + hr + 15 * s)} L${f(x + hr * .5)} ${f(hy + hr + 15 * s)} Q${f(x + hr * 1.8)} ${f(hy + hr + 12 * s)} ${f(x + hr * 1.1)} ${f(hy + hr)} Z" fill="${hair || '#2a1c33'}"/>` : ''}
    ${hood ? `<path d="M${f(x - hr * 1.5)} ${f(hy + hr * 1.5)} Q${f(x)} ${f(hy - hr * 1.5)} ${f(x + hr * 1.5)} ${f(hy + hr * 1.5)} Z" fill="${hood}"/>` : ''}
    ${head}
    ${crown ? `<path d="M${f(x - hr * 1.3)} ${f(hy + .4 * s)} L${f(x - hr * 1.3)} ${f(hy - 3 * s)} L${f(x - hr * .4)} ${f(hy - .6 * s)} L${f(x)} ${f(hy - 4 * s)} L${f(x + hr * .4)} ${f(hy - .6 * s)} L${f(x + hr * 1.3)} ${f(hy - 3 * s)} L${f(x + hr * 1.3)} ${f(hy + .4 * s)} Z" fill="url(#${id}gd)"/>` : ''}
  </g>`;
}
function figureDefs(id, robe = '#1c1546', robe2 = '#0d0a26', wing = '#e8e2ff') {
  return lgDef(id + 'rb', [[0, robe2], [.45, robe], [1, '#07061a']]) +
    lgDef(id + 'wg', [[0, wing, .95], [1, wing, .16]]);   /* gd 由 propDefs 统一提供 */
}
/* ---------------- 道具：填色 + 高光（不是线稿） ---------------- */
const PROPS = {
  wand: (id, x, y, s, rot = 0) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})">
    <rect x="-1.8" y="-30" width="3.6" height="60" rx="1.8" fill="url(#${id}wd)"/>
    <rect x="-1.8" y="-30" width="1.2" height="60" fill="#fff" opacity=".16"/>
    <circle cx="0" cy="-30" r="2.8" fill="url(#${id}gd)"/>
    <path d="M0 -22 C6 -26 8 -20 3 -18 Z" fill="url(#${id}lf)"/><path d="M0 -14 C-6 -18 -8 -12 -3 -10 Z" fill="url(#${id}lf)"/>
    <path d="M0 -6 C6 -10 8 -4 3 -2 Z" fill="url(#${id}lf)"/><path d="M0 2 C-6 -2 -8 4 -3 6 Z" fill="url(#${id}lf)"/>
  </g>`,
  cup: (id, x, y, s, rot = 0) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})">
    <path d="M-14 -14 L14 -14 C13 6 6 14 0 16 C-6 14 -13 6 -14 -14 Z" fill="url(#${id}cp)"/>
    <path d="M-14 -14 L14 -14 C13.4 -8 12 -4 10 -1 L-10 -1 C-12 -4 -13.4 -8 -14 -14 Z" fill="#fff" opacity=".12"/>
    <ellipse cx="0" cy="-14" rx="14" ry="3.4" fill="url(#${id}gd)"/>
    <rect x="-1.4" y="16" width="2.8" height="8" fill="url(#${id}gd)"/>
    <path d="M-8 24 L8 24 L6 27 L-6 27 Z" fill="url(#${id}gd)"/>
    <circle cx="0" cy="3" r="3" fill="url(#${id}gd)" opacity=".85"/>
  </g>`,
  sword: (id, x, y, s, rot = 0) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})">
    <path d="M-2.8 -34 L2.8 -34 L2.1 -1 L-2.1 -1 Z" fill="url(#${id}bl)"/>
    <path d="M-2.8 -34 L-0.7 -34 L-0.7 -1 L-2.1 -1 Z" fill="#fff" opacity=".3"/>
    <path d="M-9 -1 L9 -1 L6.4 3 L-6.4 3 Z" fill="url(#${id}gd)"/>
    <rect x="-1.6" y="3" width="3.2" height="10" rx="1.2" fill="url(#${id}hb)"/>
    <circle cx="0" cy="15" r="3" fill="url(#${id}gd)"/>
  </g>`,
  coin: (id, x, y, s, rot = 0) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})">
    <circle cx="0" cy="0" r="14" fill="url(#${id}cn)"/>
    <circle cx="0" cy="0" r="11.4" fill="none" stroke="#8a6a2c" stroke-width=".7" opacity=".75"/>
    <circle cx="0" cy="0" r="8.6" fill="none" stroke="#8a6a2c" stroke-width=".5" opacity=".5"/>
    <path d="${starPath(0, 0, 7.4, 5, .42)}" fill="none" stroke="#8a6a2c" stroke-width=".9" opacity=".85"/>
    <path d="M-9 -8 A12 12 0 0 1 5 -11" stroke="#fff" stroke-opacity=".4" stroke-width="1.4" fill="none"/>
  </g>`,
  crown: (id, x, y, s) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <path d="M-13 8 L-14 -8 L-6 1 L0 -12 L6 1 L14 -8 L13 8 Z" fill="url(#${id}gd)"/>
    <rect x="-13" y="8" width="26" height="4" rx="1.4" fill="url(#${id}gd)"/>
    <circle cx="-14" cy="-9" r="2" fill="#fff" opacity=".85"/><circle cx="0" cy="-13" r="2" fill="#fff" opacity=".85"/><circle cx="14" cy="-9" r="2" fill="#fff" opacity=".85"/>
  </g>`,
  key: (id, x, y, s, rot = 0) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})">
    <circle cx="0" cy="-12" r="8" fill="none" stroke="url(#${id}gd)" stroke-width="2.6"/><circle cx="0" cy="-12" r="3.4" fill="url(#${id}gd)"/>
    <rect x="-1.1" y="-4" width="2.2" height="26" fill="url(#${id}gd)"/>
    <rect x="-6" y="10" width="6" height="2" fill="url(#${id}gd)"/><rect x="-5" y="16" width="5" height="2" fill="url(#${id}gd)"/>
  </g>`,
  lantern: (id, x, y, s) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <circle cx="0" cy="-10" r="13" fill="url(#${id}ll)"/>
    <path d="M-5 -4 L-4 -18 L4 -18 L5 -4 Z" fill="url(#${id}lt)"/>
    <path d="M-8 -18 Q0 -24 8 -18" fill="none" stroke="url(#${id}gd)" stroke-width="1.4"/>
    <path d="M-3.4 -4 L-3.4 2 L3.4 2 L3.4 -4 Z" fill="url(#${id}gd)"/>
    <path d="${starPath(0, -11, 4.4, 6, .36)}" fill="#fff8dc" opacity=".95"/>
  </g>`,
  scale: (id, x, y, s) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <rect x="-1.2" y="-26" width="2.4" height="52" fill="url(#${id}gd)"/>
    <rect x="-16" y="-26" width="32" height="2" rx="1" fill="url(#${id}gd)"/>
    <path d="M-16 -24 L-24 -8 L-8 -8 Z" fill="url(#${id}gd)" opacity=".85"/>
    <path d="M16 -24 L8 -8 L24 -8 Z" fill="url(#${id}gd)" opacity=".85"/>
    <rect x="-10" y="26" width="20" height="2.6" rx="1.3" fill="url(#${id}gd)"/>
  </g>`,
  skull: (id, x, y, s) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <path d="M-11 0 C-11 -12 11 -12 11 0 C11 5 6 6 4 10 L-4 10 C-6 6 -11 5 -11 0 Z" fill="#e9e4d6"/>
    <circle cx="-4.4" cy="-1" r="2.8" fill="#1a1630"/><circle cx="4.4" cy="-1" r="2.8" fill="#1a1630"/>
    <path d="M0 3 L-2 8 L2 8 Z" fill="#1a1630"/>
    <path d="M-4 10 L-4 14 M0 10 L0 15 M4 10 L4 14" stroke="#e9e4d6" stroke-width="1.6"/>
  </g>`,
  chain: (id, x, y, s, rot = 0) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})" fill="none" stroke="url(#${id}gd)" stroke-width="2.4">
    ${[0, 1, 2, 3].map(i => `<ellipse cx="${-16 + i * 10}" cy="${i % 2 ? 2 : 0}" rx="6" ry="4" transform="rotate(${i % 2 ? 24 : -24} ${-16 + i * 10} ${i % 2 ? 2 : 0})"/>`).join('')}
  </g>`,
  wheel: (id, x, y, s) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <circle r="20" fill="url(#${id}wh)"/><circle r="20" fill="none" stroke="url(#${id}gd)" stroke-width="2.2"/>
    <circle r="13" fill="none" stroke="url(#${id}gd)" stroke-width="1.2" opacity=".8"/>
    <circle r="4" fill="url(#${id}gd)"/>
    ${[0,1,2,3,4,5,6,7].map(i => { const a = i * 45 * Math.PI / 180; return `<line x1="${f(Math.cos(a)*4)}" y1="${f(Math.sin(a)*4)}" x2="${f(Math.cos(a)*20)}" y2="${f(Math.sin(a)*20)}" stroke="url(#${id}gd)" stroke-width="1.1"/>`; }).join('')}
  </g>`,
  book: (id, x, y, s) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <path d="M-12 -8 L0 -11 L12 -8 L12 8 L0 11 L-12 8 Z" fill="url(#${id}cp)"/>
    <path d="M0 -11 L0 11" stroke="#8a6a2c" stroke-width=".8" opacity=".7"/>
    <path d="M-9 -4 L-3 -5.4 M-9 0 L-3 -1.4 M3 -5.4 L9 -4 M3 -1.4 L9 0" stroke="#fff" stroke-opacity=".32" stroke-width=".7"/>
  </g>`,
  bolt: (id, x, y, s, rot = 0) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})"><path d="M2 -22 L-8 2 L-1 2 L-4 20 L8 -4 L1 -4 Z" fill="#ffeaa8" opacity=".95"/><circle r="14" fill="url(#${id}bo)"/></g>`,
  flame: (id, x, y, s, col = '#ffb066') => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <path d="M0 0 C-9 -6 -7 -18 0 -24 C7 -18 9 -6 0 0 Z" fill="${col}" opacity=".9"/>
    <path d="M0 -2 C-4 -6 -3 -13 0 -17 C3 -13 4 -6 0 -2 Z" fill="#fff3c4" opacity=".85"/>
  </g>`,
  tree: (id, x, y, s, fruit = false) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <rect x="-2" y="-26" width="4" height="26" rx="2" fill="#3a2a20"/>
    <circle cx="0" cy="-32" r="13" fill="url(#${id}lf)" opacity=".92"/>
    <circle cx="-9" cy="-26" r="8" fill="url(#${id}lf)" opacity=".82"/>
    <circle cx="9" cy="-26" r="8" fill="url(#${id}lf)" opacity=".82"/>
    ${fruit ? `<circle cx="-6" cy="-32" r="2.2" fill="#ff8aa0"/><circle cx="5" cy="-28" r="2.2" fill="#ff8aa0"/><circle cx="2" cy="-38" r="2.2" fill="#ff8aa0"/>` : ''}
  </g>`,
  pillar: (id, x, y, s, tone = '#cfe4ff') => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <rect x="-7" y="-46" width="14" height="46" rx="1.6" fill="url(#${id}pl)"/>
    <rect x="-7" y="-46" width="14" height="46" rx="1.6" fill="${tone}" opacity=".12"/>
    <rect x="-8.6" y="-50" width="17.2" height="4.4" rx="1.4" fill="url(#${id}gd)"/>
    <rect x="-8.6" y="-1" width="17.2" height="3.4" rx="1.4" fill="url(#${id}gd)"/>
    <rect x="-7" y="-46" width="4" height="46" fill="#fff" opacity=".1"/>
  </g>`,
  towerB: (id, x, y, s, broken = false) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <path d="M-14 0 L-14 -40 L14 -40 L14 0 Z" fill="url(#${id}tw)"/>
    <path d="M-14 0 L-14 -40 L-6 -40 L-6 0 Z" fill="#fff" opacity=".07"/>
    <rect x="-9" y="-32" width="6" height="8" rx="2" fill="#ffe9a8" opacity=".8"/>
    <circle cx="6" cy="-27" r="3" fill="#ffe9a8" opacity=".5"/>
    <rect x="-4.4" y="-14" width="8.8" height="14" rx="3" fill="#0b0a22"/>
    ${broken ? `<path d="M-16 -46 L-8 -38 L-11 -30 M0 -46 L5 -39 L1 -33 M14 -46 L10 -38" stroke="#0a0820" stroke-width="3.4" fill="none"/>
      <rect x="-18" y="-46" width="36" height="6" rx="2" fill="url(#${id}gd)"/>` : `<rect x="-18" y="-46" width="36" height="6" rx="2" fill="url(#${id}gd)"/>`}
  </g>`,
  dog: (id, x, y, s, col = '#d9d3ea') => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <path d="M-8 0 C-9 -6 -5 -9 2 -9 C8 -9 11 -6 11 -2 L11 0 Z" fill="${col}"/>
    <circle cx="-9" cy="-9" r="3.6" fill="${col}"/>
    <path d="M-11 -12 L-8 -16 L-6 -12 Z" fill="${col}"/><path d="M-6 -12 L-4 -16 L-2 -12 Z" fill="${col}"/>
    <rect x="-8" y="0" width="2" height="5" fill="${col}"/><rect x="8" y="0" width="2" height="5" fill="${col}"/>
    <path d="M11 -6 C15 -10 16 -6 12 -4" fill="none" stroke="${col}" stroke-width="2"/>
    <circle cx="-10.4" cy="-9.6" r="1" fill="#2a2440"/>
  </g>`,
  horse: (id, x, y, s, col = '#f2eee4', facing = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s * facing} ${s})">
    <path d="M-20 -20 C-22 -34 -10 -40 2 -40 C14 -40 22 -33 20 -20 C8 -15 -10 -15 -20 -20 Z" fill="${col}"/>
    <path d="M14 -33 C18 -44 22 -52 27 -57 L32 -53 C28 -46 24 -40 22 -31 Z" fill="${col}"/>
    <path d="M25 -57 C30 -60.4 35 -61.4 39 -59.2 C40.6 -57.6 39.4 -55 36.6 -52.2 C34.6 -50.2 32.4 -49.4 30.6 -50.6 C28 -52.2 25.8 -54.6 25 -57 Z" fill="${col}"/>
    <path d="M25.6 -56.4 C28.6 -53.8 31 -51.6 33 -50.4" fill="none" stroke="#2a2440" stroke-width=".8" opacity=".22"/>
    <ellipse cx="28.6" cy="-54.6" rx="4" ry="3.2" fill="${col}"/>
    <circle cx="33.4" cy="-51.4" r=".95" fill="#2a2440" opacity=".55"/>
    <circle cx="31.4" cy="-56.6" r="1.05" fill="#2a2038"/>
    <path d="M24.6 -59.4 l-1.4 -6.4 l4 2.4 Z" fill="${col}"/><path d="M29.4 -60.4 l2.6 -5.8 l1.5 4.6 Z" fill="${col}"/>
    <path d="M13.6 -37.6 l-2.6 -3.4 l1.4 -2 l3.4 2.8 Z M17.4 -44.6 l-3 -3.8 l1.2 -2 l3.8 3.2 Z M21.8 -50.8 l-3.4 -4 l1 -2 l4.2 3.2 Z M26.2 -55.6 l-3.6 -3.6 l.8 -2.2 l4.4 2.6 Z" fill="#2a2440" opacity=".5"/>
    <path d="M-19 -28 C-29 -23 -35 -31 -31 -44 C-31.6 -36 -28.4 -31 -22 -29.6 Z" fill="${col}"/>
    <path d="M-22 -29.6 C-28 -27.6 -31 -32 -31 -39 M-21 -30.6 C-26.4 -30.6 -29 -34.6 -30 -40" fill="none" stroke="${col}" stroke-width="1.5" opacity=".8"/>
    <path d="M-15 -19 L-15 -1 M-9 -18 L-9 -1 M9 -18 L9 -1 M15 -19 L15 -1" stroke="${col}" stroke-width="2.6"/>
    <path d="M-17 .6 h4.4 M-11 .6 h4.4 M7 .6 h4.4 M13 .6 h4.4" stroke="#2a2038" stroke-width="2"/>
  </g>`,
  lion: (id, x, y, s, col = '#c98a3a') => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <path d="M-18 0 C-20 -12 -12 -19 0 -19 C12 -19 20 -12 18 0 Z" fill="${col}"/>
    <path d="M-8 -17 C-16 -15 -19 -6 -14 -1 C-19 -4 -23 -12 -20 -18 C-15 -24 -6 -24 -1 -21 Z" fill="#8a5a22"/>
    <circle cx="14" cy="-17" r="7.4" fill="${col}"/>
    <path d="M17 -23 C19 -28 24 -27 25 -23 C23 -20 19 -20 17 -22 Z" fill="${col}"/>
    <circle cx="16" cy="-18" r="1.1" fill="#1a1020"/>
    <path d="M20 -14 q3 .8 2 3" stroke="#7a4a1a" stroke-width=".9" fill="none"/>
    <path d="M-18 -5 C-27 -7 -31 -14 -29 -21" stroke="${col}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M-12 0 v3.4 M-6 0 v3.4 M6 0 v3.4 M12 0 v3.4" stroke="${col}" stroke-width="2.2"/>
  </g>`,
  butterfly: (id, x, y, s, col = '#cfe4ff') => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <path d="M0 0 C-14 -22 -26 -10 -16 4 C-10 12 -4 8 0 3 Z" fill="${col}" opacity=".92"/>
    <path d="M0 0 C14 -22 26 -10 16 4 C10 12 4 8 0 3 Z" fill="${col}" opacity=".92"/>
    <path d="M0 2 C-9 -9 -15 -3 -8 4 Z" fill="${col}" opacity=".65"/>
    <path d="M0 2 C9 -9 15 -3 8 4 Z" fill="${col}" opacity=".65"/>
    <ellipse cx="0" cy="0" rx="1.4" ry="7" fill="#2a2440"/>
    <path d="M-1 -7 C-4 -12 -7 -13 -9 -14 M1 -7 C4 -12 7 -13 9 -14" stroke="#2a2440" stroke-width=".8" fill="none"/>
  </g>`,
  birds: (id, x, y, s, col = '#c8b892') => `<g stroke="${col}" stroke-width="1.1" fill="none" opacity=".75">
    <path d="M${f(x)} ${f(y)} q4 -4 8 0 q4 -4 8 0"/><path d="M${f(x + 24)} ${f(y + 11)} q3 -3 6 0 q3 -3 6 0"/></g>`,
  coffin: (id, x, y, s) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <path d="M-9 0 L-7 -8 L7 -8 L9 0 Z" fill="#3a3157"/>
    <path d="M-9 0 L-7 -8 L-2 -8 L-3.4 0 Z" fill="#4b4270"/>
    <rect x="-10" y="0" width="20" height="2" rx="1" fill="#2a2440"/>
  </g>`,
  laurel: (x, y, s, col = '#8fbf7a') => {
    let out = '';
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2, rr = 33 * s;
      const cx = x + Math.cos(a) * rr, cy = y + Math.sin(a) * rr;
      out += `<path d="M${f(cx)} ${f(cy)} q${f(4.6 * s)} ${f(-7.4 * s)} ${f(9.4 * s)} 0 q${f(-4.6 * s)} ${f(7.4 * s)} ${f(-9.4 * s)} 0 Z" fill="${col}" opacity=".92" transform="rotate(${f(a * 57.2958 + 90)} ${f(cx)} ${f(cy)})"/>`;
    }
    return `<g>${out}<circle cx="${f(x)}" cy="${f(y)}" r="${f(33 * s)}" fill="none" stroke="${col}" stroke-width="${f(.5 * s)}" opacity=".25"/></g>`;
  },
  sea: (id, x, y, s, w) => `<g fill="${w}" opacity=".9">${[0,1,2,3].map(i => `<path d="M${f(x - 12 - i * 3)} ${f(y + i * 4)} q4 -3 8 0 q4 -3 8 0" stroke="${w}" stroke-width="1.4" fill="none" opacity="${f(.6 - i * .12)}"/>`).join('')}</g>`,
  hand: (id, x, y, s, rot = 0) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})">
    <path d="M0 0 C-7 -3 -12 -8 -14 -16 C-15 -21 -11 -22 -9 -18 L-6 -12 C-6 -22 -5 -27 -3 -27 C-1 -27 -1 -22 -1 -16 C-1 -25 0 -30 2 -30 C4 -30 4 -24 4 -16 C4 -24 6 -28 8 -27 C10 -26 9 -20 8 -14 C9 -18 12 -19 13 -16 C14 -12 10 -4 6 -1 Z" fill="#f0d6b4"/>
    <path d="M-2 -24 C0 -26 3 -25 4 -22" stroke="#c9a985" stroke-width=".8" fill="none"/>
    <path d="M-12 -14 C-16 -20 -20 -26 -24 -30" stroke="#e0c9a6" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/>
  </g>`,
  snake: (id, x, y, s, col = '#7fd6a0') => `<path transform="translate(${f(x)} ${f(y)}) scale(${s})" d="M-16 -6 C-8 -16 8 -14 12 -6 C15 0 8 6 2 4 C-4 2 -4 -4 2 -6" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`,
  eye: (id, x, y, s, col = '#cfe4ff') => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <path d="M-16 0 Q0 -14 16 0 Q0 14 -16 0 Z" fill="${col}" opacity=".28" stroke="${col}" stroke-width="1"/>
    <circle r="5.4" fill="${col}" opacity=".9"/><circle r="2.2" fill="#0d0b22"/>
  </g>`,
  banner: (id, x, y, s, col = '#e35d6a') => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <rect x="-1" y="-22" width="2" height="34" fill="url(#${id}gd)"/>
    <path d="M1 -22 L18 -18 L1 -12 Z" fill="${col}"/>
  </g>`,
  trumpet: (id, x, y, s, rot = 0) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})">
    <path d="M-18 0 L10 -7 L10 7 L-18 0 Z" fill="url(#${id}gd)"/>
    <path d="M10 -7 L18 -11 L18 11 L10 7 Z" fill="#f8ecca"/>
    <circle cx="-20" cy="0" r="3.4" fill="url(#${id}gd)"/>
  </g>`,
  sunface: (id, x, y, r, col = '#ffd37a') => {
    let rays = '';
    for (let i = 0; i < 16; i++) {
      const a = i * 22.5 * Math.PI / 180, r1 = r * 1.25, r2 = r * (i % 2 ? 1.6 : 1.95);
      rays += `<path d="M${f(x + Math.cos(a) * r1)} ${f(y + Math.sin(a) * r1)} L${f(x + Math.cos(a) * r2)} ${f(y + Math.sin(a) * r2)}" stroke="${col}" stroke-width="${i % 2 ? 1 : 1.8}" stroke-linecap="round" opacity=".9"/>`;
    }
    return `${rays}<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 3.4)}" fill="url(#${id}ore)"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${col}"/>
      <circle cx="${f(x - r * .3)}" cy="${f(y - r * .16)}" r="${f(r * .13)}" fill="#7a5020"/><circle cx="${f(x + r * .3)}" cy="${f(y - r * .16)}" r="${f(r * .13)}" fill="#7a5020"/>
      <path d="M${f(x - r * .34)} ${f(y + r * .26)} Q${f(x)} ${f(y + r * .62)} ${f(x + r * .34)} ${f(y + r * .26)}" stroke="#7a5020" stroke-width="${f(r * .09)}" fill="none" stroke-linecap="round"/>`;
  }
};
/* 道具渐变的公共 def */
function propDefs(id, hue) {
  return lgDef(id + 'gd', [[0, '#f8ecca'], [.45, '#dcb268'], [1, '#8e6a2c']]) +
    lgDef(id + 'wd', [[0, '#8a5a2b'], [.4, '#c9903f'], [1, '#5e3a18']]) +
    lgDef(id + 'lf', [[0, '#9ed08a', .95], [1, '#3f6b3a', .9]]) +
    lgDef(id + 'cp', [[0, `hsl(${f(hue)} 62% 78%)`, .95], [1, `hsl(${f(hue)} 58% 40%)`, .95]]) +
    lgDef(id + 'bl', [[0, '#eef3ff'], [.5, '#b9c6e6'], [1, '#8892b8']]) +
    lgDef(id + 'hb', [[0, '#6a5a8a'], [1, '#2e2749']]) +
    lgDef(id + 'cn', [[0, '#ffe9ad'], [.5, '#e3bd6a'], [1, '#a87d2c']]) +
    lgDef(id + 'lt', [[0, '#ffe9a8', .95], [1, '#c98a3a', .85]]) +
    lgDef(id + 'll', [[0, '#ffeaa8', .45], [1, '#ffeaa8', 0]]) +
    lgDef(id + 'pl', [[0, '#efe9f7'], [.4, '#c9c2dc'], [1, '#8d86a8']]) +
    lgDef(id + 'tw', [[0, '#5c527a'], [1, '#26204a']]) +
    lgDef(id + 'wh', [[0, `hsl(${f(hue)} 40% 26%)`], [1, '#0b0a22']]) +
    rgDef(id + 'bo', [[0, '#ffeaa8', .62], [1, '#ffeaa8', 0]]);
}

/* ---------------- 画面骨架：天空 + 天体 + 地貌层 ---------------- */
const PW = 184, PH = 230;
function backdrop(id, o = {}) {
  const { sky = ['#0a1030', '#221a4c', '#4a2b58'], sun = null, moon = null, stars = 0, seed = 1, layers = [], haze = null } = o;
  let d = lgDef(id + 'sky', [[0, sky[0]], [.55, sky[1]], [1, sky[2]]]);
  if (sun) d += oreDef(id, sun.col || '#ffd37a');
  if (moon) d += oreDef(id + 'm', moon.col || '#dfe6ff');
  let b = `<rect width="${PW}" height="${PH}" fill="url(#${id}sky)"/>`;
  if (stars) b += starField(seed, stars, PW, PH * .66);
  if (sun) b += orb(id, sun.x, sun.y, sun.r, sun.col || '#ffd37a', sun.op ?? .95, sun.halo ?? 4.6);
  if (moon) b += `<circle cx="${f(moon.x)}" cy="${f(moon.y)}" r="${f(moon.r * 4)}" fill="url(#${id}more)"/>
    <circle cx="${f(moon.x)}" cy="${f(moon.y)}" r="${f(moon.r)}" fill="${moon.col || '#e8ecff'}" opacity=".95"/>
    <circle cx="${f(moon.x - moon.r * .3)}" cy="${f(moon.y - moon.r * .2)}" r="${f(moon.r * .16)}" fill="#c9cfe8" opacity=".7"/>
    <circle cx="${f(moon.x + moon.r * .28)}" cy="${f(moon.y + moon.r * .26)}" r="${f(moon.r * .11)}" fill="#c9cfe8" opacity=".6"/>`;
  layers.forEach((L, i) => {
    const k = L.k || ('l' + i);
    d += lgDef(id + k, [[0, L.c1], [1, L.c2]], 0, 0, 0, 1);
    b += `<path d="${L.d}" fill="url(#${id}${k})" opacity="${L.op ?? 1}"/>`;
  });
  if (haze) { d += rgDef(id + 'hz', [[0, haze, .5], [1, haze, 0]]); b += `<rect width="${PW}" height="${PH}" fill="url(#${id}hz)"/>`; }
  return { d, b };
}

/* ---------------- 22 张大阿卡纳场景 ---------------- */
function majorScene(ci, id, hue) {
  const P = PROPS, gold = '#f0dcae';
  const S = {
    /* 0 愚者：山崖边出发，白狗在旁，太阳正升起 */
    fool: () => {
      const bd = backdrop(id, { sky: ['#122a4e', '#3a3a72', '#8a6a7a'], sun: { x: 132, y: 54, r: 13, col: '#ffd9a0' }, seed: ci + 3,
        layers: [{ d: ridge(ci + 1, 96, 16, PW, PH, { jags: 4 }), c1: '#3c3568', c2: '#241f4a' },
                 { d: ridge(ci + 2, 118, 12, PW, PH, { jags: 5, sharp: false }), c1: '#4a3a72', c2: '#2a2352' }] });
      bd.d += figureDefs(id, '#2a4a86', '#16264a', '#fff4d8'); bd.d += propDefs(id, hue);
      bd.b += `<path d="M0 178 L74 178 L74 ${PH} L0 ${PH} Z" fill="#151030"/>`;
      bd.b += `<path d="M74 178 C86 186 96 190 112 192 L112 ${PH} L74 ${PH} Z" fill="#1b1438"/>`;
      bd.b += `<path d="M0 176 L74 176 L74 179 L0 179 Z" fill="#6a5a8a" opacity=".5"/>`;
      bd.b += P.dog(id, 46, 176, 1.15);
      bd.b += figure(id, 62, 174, 1.5, 'walk', { robe: '#2a4a86', arms: 'hold', hair: '#3a2a3e' });
      bd.b += P.wand(id, 72, 138, .95, 22);
      bd.b += `<circle cx="96" cy="150" r="16" fill="url(#${id}lf)" opacity=".18"/>`;
      return bd;
    },
    /* 1 魔术师：玫瑰园里的桌子，四样道具，头顶无限 */
    magician: () => {
      const bd = backdrop(id, { sky: ['#1a1440', '#33234e', '#5a3050'], sun: { x: 92, y: 46, r: 15, col: '#ffd6a0', halo: 3.6 }, seed: ci + 5,
        layers: [{ d: ridge(ci + 4, 150, 8, PW, PH, { jags: 3, sharp: false }), c1: '#2f4a3a', c2: '#1b2c26' }] });
      bd.d += figureDefs(id, '#7a2a4a', '#3a1226', '#fff0d8'); bd.d += propDefs(id, hue);
      bd.d += rgDef(id + 'inf', [[0, gold, .5], [1, gold, 0]]);
      bd.b += P.tree(id, 24, 176, 1.1, true) + P.tree(id, 160, 176, 1.1);
      bd.b += `<g fill="#e8849a" opacity=".85">${[[38,120],[52,132],[28,140],[150,124],[164,136],[138,142]].map(([a,b2]) => `<circle cx="${a}" cy="${b2}" r="3"/>`).join('')}</g>`;
      bd.b += `<rect x="52" y="166" width="82" height="9" rx="3" fill="#4a3a20"/><rect x="52" y="175" width="82" height="3" fill="#2e2414"/>`;
      bd.b += P.cup(id, 68, 164, .78) + P.sword(id, 92, 160, .72) + P.coin(id, 118, 166, .9) + P.wand(id, 138, 160, .78);
      bd.b += figure(id, 92, 168, 1.75, 'stand', { robe: '#7a2a4a', arms: 'raise', hair: '#2a1c33' });
      bd.b += `<circle cx="92" cy="58" r="26" fill="url(#${id}inf)"/><path d="M74 58 C74 42 90 42 92 58 C94 74 110 74 110 58 C110 42 94 42 92 58 C90 74 74 74 74 58 Z" fill="none" stroke="${gold}" stroke-width="2.6"/>`;
      return bd;
    },
    /* 2 女祭司：两根柱子之间，脚下新月 */
    priestess: () => {
      const bd = backdrop(id, { sky: ['#0a1030', '#1b2452', '#2e2a62'], moon: { x: 92, y: 40, r: 12 }, stars: 26, seed: ci + 7,
        layers: [{ d: water(168, 3, 26, PW, PH), c1: '#24407a', c2: '#101a3a', op: .95 }] });
      bd.d += figureDefs(id, '#3a3a86', '#1a1a46', '#dfe8ff'); bd.d += propDefs(id, hue);
      bd.b += P.pillar(id, 36, 176, 1.5, '#2a3a7a') + P.pillar(id, 148, 176, 1.5, '#7a2a4a');
      bd.b += `<text x="36" y="140" text-anchor="middle" font-size="13" fill="${gold}" font-family="Georgia,serif">B</text>
               <text x="148" y="140" text-anchor="middle" font-size="13" fill="${gold}" font-family="Georgia,serif">J</text>`;
      bd.b += `<g opacity=".5">${[[62,120],[74,134],[86,118],[108,130],[120,114]].map(([a,b2],i) => `<circle cx="${a}" cy="${b2}" r="3.4" fill="#c9667e"/>`).join('')}</g>`;
      bd.b += figure(id, 92, 160, 1.7, 'sit', { robe: '#3a3a86', arms: 'hold', hair: '#241a33', hairLong: true });
      bd.b += P.wheel(id, 92, 190, .34);
      bd.b += `<path d="M78 168 Q92 178 106 168" stroke="${gold}" stroke-width="2.4" fill="none"/>`;
      return bd;
    },
    /* 3 女皇：麦田、瀑布、坐着的她 */
    empress: () => {
      const bd = backdrop(id, { sky: ['#152a3e', '#2e4a5a', '#6a6a5a'], sun: { x: 146, y: 40, r: 10, col: '#ffe6b0', halo: 3.4 }, seed: ci + 9,
        layers: [{ d: ridge(ci + 8, 74, 14, PW, PH, { jags: 4 }), c1: '#3a5a6a', c2: '#25384a' }] });
      bd.d += figureDefs(id, '#5a3a86', '#2a1a4a', '#fff0e0'); bd.d += propDefs(id, hue);
      bd.d += lgDef(id + 'wf', [[0, '#a8e0ff', .85], [1, '#3a6a9a', .1]]);
      bd.b += `<path d="M138 44 C142 70 148 96 146 128 L154 128 C152 96 150 70 146 44 Z" fill="url(#${id}wf)"/>`;
      bd.b += `<ellipse cx="146" cy="130" rx="14" ry="4" fill="#a8e0ff" opacity=".35"/>`;
      bd.b += `<path d="M0 150 C40 142 90 146 184 138 L184 ${PH} L0 ${PH} Z" fill="#3a4a2a"/>`;
      bd.b += `<g stroke="#c9a24a" stroke-width="1.4" opacity=".85">${Array.from({ length: 16 }, (_, i) => { const x = 8 + i * 11.6; return `<path d="M${f(x)} 208 L${f(x)} 186 M${f(x)} 192 l-4 -5 M${f(x)} 198 l4 -5"/>`; }).join('')}</g>`;
      bd.b += P.tree(id, 158, 176, .9, true);
      bd.b += figure(id, 76, 196, 1.8, 'sit', { robe: '#5a3a86', arms: 'hold', crown: true, hair: '#e8d0a0', hairLong: true });
      bd.b += `<path d="M52 200 L100 200 L100 206 L52 206 Z" fill="#6a4a2a"/>`;
      bd.b += `<path d="M62 196 L90 196 L90 200 L62 200 Z" fill="#8a6a3a"/>`;
      bd.b += P.wheel(id, 76, 190, .28);
      return bd;
    },
    /* 4 皇帝：岩山与石座，权杖与球 */
    emperor: () => {
      const bd = backdrop(id, { sky: ['#1a1a3e', '#3a2a4a', '#7a5a4a'], sun: { x: 40, y: 50, r: 8, col: '#ffb98a', op: .8, halo: 3 }, seed: ci + 11,
        layers: [{ d: ridge(ci + 10, 60, 20, PW, PH, { jags: 3 }), c1: '#4a3a5a', c2: '#2a1f3a' },
                 { d: ridge(ci + 13, 92, 16, PW, PH, { jags: 4 }), c1: '#5a3a4a', c2: '#30202f' }] });
      bd.d += figureDefs(id, '#8a5a2a', '#3a2410', '#ffd8a8'); bd.d += propDefs(id, hue);
      bd.b += `<path d="M0 150 C50 138 120 148 184 136 L184 ${PH} L0 ${PH} Z" fill="#2e2440"/>`;
      bd.b += `<path d="M56 200 L128 200 L128 206 L56 206 Z" fill="#4a3a2a"/><rect x="64" y="152" width="56" height="50" rx="3" fill="#6a5236"/>
               <rect x="64" y="152" width="10" height="50" fill="#7d6142"/>
               <path d="M64 152 L120 152 L114 142 L70 142 Z" fill="#8a6c46"/>`;
      bd.b += `<path d="M60 158 l-6 -6 M124 158 l6 -6" stroke="${gold}" stroke-width="1.6"/>`;
      bd.b += `<circle cx="70" cy="170" r="4" fill="${gold}" opacity=".8"/><circle cx="114" cy="170" r="4" fill="${gold}" opacity=".8"/>`;
      bd.b += figure(id, 92, 190, 1.7, 'sit', { robe: '#8a5a2a', arms: 'hold', crown: true, hair: '#4a3a2a' });
      bd.b += P.wand(id, 118, 172, .78, 12) + P.coin(id, 68, 176, .62);
      return bd;
    },
    /* 5 教皇：石殿、三重冠、两位跪者、交叉的钥匙 */
    hierophant: () => {
      const bd = backdrop(id, { sky: ['#131a3c', '#26305e', '#3a3a6a'], seed: ci + 15,
        layers: [{ d: ridge(ci + 14, 130, 6, PW, PH, { jags: 3, sharp: false }), c1: '#2e2a52', c2: '#1a1836' }] });
      bd.d += figureDefs(id, '#8a2a3a', '#3a1220', '#fff0d8'); bd.d += propDefs(id, hue);
      bd.b += P.pillar(id, 30, 182, 1.4, '#3a3a7a') + P.pillar(id, 154, 182, 1.4);
      bd.b += `<path d="M0 182 L184 182 L184 ${PH} L0 ${PH} Z" fill="#241f44"/>`;
      bd.b += `<path d="M40 182 L144 182 L144 186 L40 186 Z" fill="#3a3157" opacity=".8"/>`;
      bd.b += figure(id, 92, 186, 1.7, 'sit', { robe: '#8a2a3a', arms: 'raise', hair: '#c9b48a', hairLong: true });
      bd.b += P.crown(id, 92, 148, .62);
      bd.b += figure(id, 58, 198, 1.15, 'kneel', { robe: '#4a5a9a', arms: 'open', hair: '#2a1c33' });
      bd.b += figure(id, 126, 198, 1.15, 'kneel', { robe: '#4a5a9a', arms: 'open', hair: '#2a1c33' });
      bd.b += P.key(id, 84, 208, .5, -20) + P.key(id, 100, 208, .5, 20);
      return bd;
    },
    /* 6 恋人：大日、天使、两棵树、两个人 */
    lovers: () => {
      const bd = backdrop(id, { sky: ['#1e2a4e', '#4a3a6a', '#8a5a6a'], seed: ci + 17,
        layers: [{ d: ridge(ci + 16, 104, 16, PW, PH, { jags: 4 }), c1: '#403a70', c2: '#261f4a' },
                 { d: ridge(ci + 19, 140, 10, PW, PH, { jags: 5, sharp: false }), c1: '#4a4a3a', c2: '#2a2a24' }] });
      bd.d += figureDefs(id, '#6a5aa8', '#2a2258', '#fff4e0'); bd.d += propDefs(id, hue);
      bd.d += oreDef(id, '#ffd9a0');
      bd.b += `<circle cx="92" cy="40" r="58" fill="url(#${id}ore)"/>${P.sunface(id, 92, 40, 17, '#ffd88a')}`;
      bd.b += figure(id, 92, 104, 1.5, 'stand', { robe: '#e8e0ff', arms: 'open', wings: true, hair: '#e8d0a0' });
      bd.b += P.butterfly(id, 92, 20, .55, '#ffe9c0');
      bd.b += P.tree(id, 34, 190, 1.35, false) + P.tree(id, 150, 190, 1.35, true);
      bd.b += P.flame(id, 34, 168, .5, '#ffb066');
      bd.b += figure(id, 72, 190, 1.5, 'stand', { robe: '#3a5a9a', arms: 'hold', hair: '#2a1c33' });
      bd.b += figure(id, 114, 190, 1.45, 'stand', { robe: '#a85a7a', arms: 'hold', hair: '#e8d0a0', hairLong: true });
      return bd;
    },
    /* 7 战车：城墙前，星幕车盖，两只兽 */
    chariot: () => {
      const bd = backdrop(id, { sky: ['#101a3c', '#22306a', '#3a4a8a'], stars: 40, seed: ci + 21,
        layers: [{ d: ridge(ci + 20, 96, 6, PW, PH, { jags: 6 }), c1: '#2e2a5a', c2: '#1b1840' }] });
      bd.d += figureDefs(id, '#5a5aa8', '#22224a', '#fff0d8'); bd.d += propDefs(id, hue);
      bd.d += lgDef(id + 'cn2', [[0, '#2a2a5a', .85], [1, '#141230', .95]]);
      bd.b += `<rect x="0" y="104" width="184" height="26" fill="url(#${id}cn2)"/>`;
      bd.b += `<g fill="#1a1738">${Array.from({ length: 7 }, (_, i) => `<rect x="${4 + i * 26}" y="96" width="18" height="10" rx="2"/>`).join('')}</g>`;
      bd.b += `<g fill="#ffeec9" opacity=".85">${Array.from({ length: 12 }, (_, i) => `<circle cx="${8 + i * 15}" cy="${22 + (i % 3) * 7}" r="1.1"/>`).join('')}</g>`;
      bd.b += `<path d="M46 138 L138 138 L138 142 L46 142 Z" fill="#6a5a8a"/>`;
      bd.b += `<path d="M50 118 C70 108 114 108 134 118 L134 138 L50 138 Z" fill="#3a3a7a" opacity=".5"/>`;
      bd.b += `<g fill="#ffeec9" opacity=".8">${Array.from({ length: 9 }, (_, i) => `<circle cx="${58 + i * 9}" cy="${118 + (i % 2) * 4}" r="1.2"/>`).join('')}</g>`;
      bd.b += figure(id, 92, 138, 1.5, 'stand', { robe: '#c9c2dc', arms: 'hold', hair: '#2a1c33' });
      bd.b += P.wand(id, 92, 118, .6, 0);
      bd.b += `<g transform="translate(56 194)">${P.lion(id, 0, 0, .78, '#2a2a4a')}</g><g transform="translate(128 194) scale(-1,1)">${P.lion(id, 0, 0, .78, '#2a2a4a')}</g>`;
      bd.b += `<path d="M46 160 L138 160" stroke="${gold}" stroke-width="2.4"/><circle cx="92" cy="160" r="7" fill="url(#${id}gd)"/>`;
      return bd;
    },
    /* 8 力量：温柔按住狮子，头顶无限 */
    strength: () => {
      const bd = backdrop(id, { sky: ['#1a2a3e', '#3a4a5a', '#7a6a5a'], sun: { x: 148, y: 46, r: 9, col: '#ffe0a0', halo: 3.2 }, seed: ci + 23,
        layers: [{ d: ridge(ci + 22, 112, 14, PW, PH, { jags: 4, sharp: false }), c1: '#3a5a4a', c2: '#22382e' }] });
      bd.d += figureDefs(id, '#d8d0f0', '#5a5480', '#fff4e0'); bd.d += propDefs(id, hue);
      bd.d += rgDef(id + 'inf', [[0, gold, .5], [1, gold, 0]]);
      bd.b += `<path d="M0 158 C60 150 120 156 184 148 L184 ${PH} L0 ${PH} Z" fill="#2e4a3a"/>`;
      bd.b += P.lion(id, 96, 190, 1.5, '#b8762a');
      bd.b += figure(id, 74, 192, 1.6, 'stand', { robe: '#d8d0f0', arms: 'hold', hair: '#c9b48a', hairLong: true });
      bd.b += `<circle cx="82" cy="118" r="22" fill="url(#${id}inf)"/><path d="M68 118 C68 106 80 106 82 118 C84 130 96 130 96 118 C96 106 84 106 82 118 C80 130 68 130 68 118 Z" fill="none" stroke="${gold}" stroke-width="2.2"/>`;
      bd.b += `<g fill="#e8b0c0" opacity=".8">${[[30,180],[44,172],[160,178],[146,170]].map(([a,b2]) => `<circle cx="${a}" cy="${b2}" r="3.2"/>`).join('')}</g>`;
      return bd;
    },
    /* 9 隐者：雪峰上的灯 */
    hermit: () => {
      const bd = backdrop(id, { sky: ['#060a24', '#131a44', '#2a2a5a'], stars: 46, seed: ci + 25,
        layers: [{ d: ridge(ci + 24, 108, 26, PW, PH, { jags: 3 }), c1: '#3a3a6a', c2: '#1e1c44' },
                 { d: ridge(ci + 27, 150, 20, PW, PH, { jags: 4 }), c1: '#8a86a8', c2: '#3a3a6a' }] });
      bd.d += figureDefs(id, '#3a3a6a', '#1a1a3a', '#dfe8ff'); bd.d += propDefs(id, hue);
      bd.b += `<path d="M0 108 L60 60 L92 96 L120 74 L184 112 L184 ${PH} L0 ${PH} Z" fill="#5a5a86" opacity=".55"/>`;
      bd.b += figure(id, 92, 176, 1.7, 'stand', { robe: '#3a3a6a', arms: 'hold', hood: '#2a2a52', hair: '#c9c9e0' });
      bd.b += P.wand(id, 74, 176, .9, -6);
      bd.b += P.lantern(id, 106, 158, .95);
      bd.b += `<path d="M0 202 C60 196 130 206 184 198 L184 ${PH} L0 ${PH} Z" fill="#21203f"/>`;
      return bd;
    },
    /* 10 命运之轮：云上的轮 */
    wheel: () => {
      const bd = backdrop(id, { sky: ['#0d1234', '#242a5e', '#4a3a7a'], stars: 32, seed: ci + 29,
        layers: [{ d: ridge(ci + 28, 150, 10, PW, PH, { jags: 4, sharp: false }), c1: '#3a3a7a', c2: '#20204a' }] });
      bd.d += propDefs(id, hue);
      bd.d += figureDefs(id, '#5a4a8a', '#241a44', '#e8e2ff');
      bd.d += rgDef(id + 'hl', [[0, '#ffe9b0', .45], [1, '#ffe9b0', 0]]);
      bd.b += cloud(34, 46, 1.2, '#8a86c0', .34) + cloud(148, 38, 1, '#8a86c0', .3) + cloud(92, 214, 1.3, '#6a6aa8', .3);
      bd.b += `<circle cx="92" cy="118" r="62" fill="url(#${id}hl)"/>`;
      bd.b += P.wheel(id, 92, 118, 1.75);
      bd.b += `<g fill="#ffeec9" opacity=".8">${[[92, 210], [26, 118], [158, 118]].map(([a, b2]) => `<path d="${starPath(a, b2, 4.6, 4, .38)}"/>`).join('')}</g>`;
      bd.b += P.book(id, 92, 30, .72) + P.flame(id, 92, 90, .5, '#ffd6a0');
      bd.b += `<g fill="url(#${id}gd)" opacity=".8">${[[26, 36], [158, 36], [26, 200], [158, 200]].map(([a, b2]) =>
        `<path d="M${a} ${b2} C${a - 13} ${b2 - 8} ${a - 15} ${b2 + 5} ${a - 4} ${b2 + 7} Z"/>` +
        `<path d="M${a} ${b2} C${a + 13} ${b2 - 8} ${a + 15} ${b2 + 5} ${a + 4} ${b2 + 7} Z"/>`).join('')}</g>`;
      bd.b += P.snake(id, 30, 158, .85, '#9fe0b0');
      bd.b += figure(id, 158, 180, .95, 'stand', { arms: 'up', hood: '#2a2440' });
      bd.b += figure(id, 34, 214, .95, 'walk', { robe: '#8a86c0', arms: 'hold' });
      return bd;
    },
    /* 11 正义：举起的天平与剑 */
    justice: () => {
      const bd = backdrop(id, { sky: ['#141a3e', '#2e3162', '#5a4a7a'], seed: ci + 31,
        layers: [{ d: ridge(ci + 30, 156, 6, PW, PH, { jags: 3, sharp: false }), c1: '#2e2a5a', c2: '#1a1838' }] });
      bd.d += figureDefs(id, '#8a2a4a', '#3a1024', '#fff0d8'); bd.d += propDefs(id, hue);
      bd.b += P.pillar(id, 34, 176, 1.5) + P.pillar(id, 150, 176, 1.5);
      bd.b += `<path d="M0 176 L184 176 L184 ${PH} L0 ${PH} Z" fill="#241f44"/>`;
      bd.b += figure(id, 92, 184, 1.7, 'sit', { robe: '#8a2a4a', arms: 'raise', crown: true, hair: '#c9b48a' });
      bd.b += P.scale(id, 108, 142, .72);
      bd.b += P.sword(id, 74, 148, .8, 0);
      bd.b += `<path d="M56 186 L128 186 L128 190 L56 190 Z" fill="#3a3157" opacity=".8"/>`;
      return bd;
    },
    /* 12 倒吊人：树上倒挂，头顶光环 */
    hanged: () => {
      const bd = backdrop(id, { sky: ['#1a2440', '#3a3a5a', '#6a6a5a'], sun: { x: 92, y: 46, r: 8, col: '#ffe6b8', halo: 3 }, seed: ci + 33,
        layers: [{ d: ridge(ci + 32, 140, 12, PW, PH, { jags: 4, sharp: false }), c1: '#3a5a3a', c2: '#22382a' }] });
      bd.d += figureDefs(id, '#4a5a9a', '#1e2450', '#fff0d8'); bd.d += propDefs(id, hue);
      bd.d += rgDef(id + 'hal', [[0, '#ffeaa8', .55], [1, '#ffeaa8', 0]]);
      bd.b += `<path d="M0 152 C60 146 120 150 184 144 L184 ${PH} L0 ${PH} Z" fill="#2e4a2e"/>`;
      bd.b += `<rect x="62" y="74" width="7" height="88" rx="3" fill="#4a3a28"/>`;
      bd.b += `<rect x="62" y="70" width="64" height="7" rx="3" fill="#4a3a28"/>`;
      bd.b += `<g fill="#6a8a5a" opacity=".92"><ellipse cx="52" cy="64" rx="13" ry="6"/><ellipse cx="132" cy="64" rx="13" ry="6"/><ellipse cx="92" cy="58" rx="15" ry="6"/></g>`;
      bd.b += `<path d="M88 76 C90 96 92 112 92 126" stroke="#8a7a5a" stroke-width="2.2" fill="none"/>`;
      bd.b += `<g transform="translate(92 132) rotate(180)">${figure(id, 0, 0, 1.45, 'stand', { robe: '#4a5a9a', arms: 'down', hair: '#c9b48a' })}</g>`;
      bd.b += `<circle cx="92" cy="196" r="19" fill="url(#${id}hal)"/><circle cx="92" cy="196" r="11" fill="none" stroke="#ffeaa8" stroke-width="1.5" opacity=".8"/>`;
      bd.b += `<path d="M0 178 C50 172 120 180 184 174" stroke="#c9b48a" stroke-width="1.2" fill="none" opacity=".3"/>`;
      return bd;
    },
    /* 13 死神：白马上的枯骨骑士 */
    death: () => {
      const bd = backdrop(id, { sky: ['#1a1a3a', '#3a2a4a', '#8a6a5a'], seed: ci + 35,
        layers: [{ d: water(162, 3, 24, PW, PH), c1: '#2e4a7a', c2: '#16203e' },
                 { d: ridge(ci + 34, 132, 8, PW, PH, { jags: 3 }), c1: '#3a2f4a', c2: '#231d38' }] });
      bd.d += propDefs(id, hue);
      bd.d += figureDefs(id, '#2a2440', '#141230', '#efe9dc');
      bd.d += oreDef(id, '#ffc98a');
      bd.b += `<circle cx="92" cy="148" r="32" fill="url(#${id}ore)"/><circle cx="92" cy="148" r="13" fill="#ffd6a0" opacity=".95"/>`;
      bd.b += P.towerB(id, 16, 148, .82) + P.towerB(id, 168, 148, .82);
      bd.b += P.horse(id, 96, 192, 1.7, '#efe9dc', 1);
      bd.b += `<g transform="translate(88 158)">${figure(id, 0, 0, 1.28, 'sit', { robe: '#2a2440', arms: 'hold', hood: '#1b1730' })}</g>`;
      bd.b += P.skull(id, 88, 122, 1.05);
      bd.b += `<path d="M152 128 L112 176" stroke="#8a7a5a" stroke-width="2.6"/><path d="M152 128 C168 134 172 148 162 158 C160 144 154 134 152 128 Z" fill="#dfe8ff"/>`;
      bd.b += P.flame(id, 130, 186, .7, '#8ad0ff');
      bd.b += figure(id, 34, 212, 1.15, 'lie', { arms: 'down', crown: true, hair: '#c9a86a' });
      return bd;
    },
    /* 14 节制：天使在两杯之间倒水，一脚在水里 */
    temper: () => {
      const bd = backdrop(id, { sky: ['#1a2a4e', '#3a4a6a', '#8a7a6a'], sun: { x: 92, y: 36, r: 8, col: '#ffe6b8', halo: 3.2 }, seed: ci + 37,
        layers: [{ d: ridge(ci + 36, 88, 18, PW, PH, { jags: 4 }), c1: '#5a6a8a', c2: '#2e3a5a' },
                 { d: water(170, 3, 22, PW, PH), c1: '#2e5a7a', c2: '#16263e' }] });
      bd.d += figureDefs(id, '#e0e6ff', '#7a82b8', '#fff6e6'); bd.d += propDefs(id, hue);
      bd.d += lgDef(id + 'fl2', [[0, '#bfe6ff', .9], [1, '#4a86b8', .2]]);
      bd.b += `<path d="M0 176 C60 170 120 174 184 168 L184 ${PH} L0 ${PH} Z" fill="#2e5a3a" opacity=".75"/>`;
      bd.b += `<path d="M0 190 C60 184 120 190 184 182 L184 ${PH} L0 ${PH} Z" fill="#1e4430" opacity=".8"/>`;
      bd.b += figure(id, 92, 176, 1.75, 'stand', { robe: '#e0e6ff', arms: 'open', wings: true, hair: '#e8d0a0' });
      bd.b += P.cup(id, 66, 130, .85) + P.cup(id, 118, 152, .85, 180);
      bd.b += `<path d="M66 134 C84 140 108 148 118 150" stroke="url(#${id}fl2)" stroke-width="3.4" fill="none"/>`;
      bd.b += `<path d="M92 176 L92 206" stroke="#c9c2dc" stroke-width="2.2" opacity=".5"/>`;
      return bd;
    },
    /* 15 恶魔：烛火、锁链、两个被缚的人 */
    devil: () => {
      const bd = backdrop(id, { sky: ['#1a0e2e', '#2e1436', '#5a1a34'], seed: ci + 41,
        layers: [{ d: ridge(ci + 40, 164, 10, PW, PH, { jags: 3, sharp: false }), c1: '#2a1430', c2: '#160a20' }] });
      bd.d += figureDefs(id, '#4a2a66', '#1a0e28', '#3a1a3a'); bd.d += propDefs(id, hue);
      bd.d += rgDef(id + 'pv', [[0, '#ff9a5a', .55], [1, '#ff9a5a', 0]]);
      bd.b += `<circle cx="92" cy="126" r="56" fill="url(#${id}pv)"/>`;
      bd.b += `<path d="M56 180 L128 180 L140 210 L44 210 Z" fill="#2a1a36"/>`;
      bd.b += figure(id, 92, 180, 1.95, 'sit', { robe: '#4a2a66', arms: 'open', wings: true, hair: '#1a0e28' });
      bd.b += `<path d="M74 124 L66 106 L82 116 Z" fill="#c9563a"/><path d="M110 124 L118 106 L102 116 Z" fill="#c9563a"/>`;
      bd.b += `<g transform="rotate(180 92 84)"><path d="${starPath(92, 84, 13, 5, .42)}" fill="none" stroke="#ffcf8a" stroke-width="1.6"/></g>`;
      bd.b += P.flame(id, 38, 178, 1.2, '#ffb066') + P.flame(id, 148, 174, 1.05, '#ff9a5a');
      bd.b += figure(id, 58, 210, 1.15, 'stand', { hood: '#6a4a2a', arms: 'hold', hair: '#2a1c33' });
      bd.b += figure(id, 126, 210, 1.15, 'stand', { hood: '#6a4a2a', arms: 'hold', hair: '#e8d0a0', hairLong: true });
      bd.b += `<circle cx="92" cy="200" r="6.5" fill="none" stroke="url(#${id}gd)" stroke-width="2.4"/>`;
      bd.b += P.chain(id, 74, 194, .62, 14) + P.chain(id, 110, 194, .62, -14);
      return bd;
    },
    /* 16 塔：雷击的塔、掉落的王冠 */
    tower: () => {
      const bd = backdrop(id, { sky: ['#0d1030', '#242452', '#4a3a5a'], seed: ci + 43,
        layers: [{ d: ridge(ci + 42, 152, 24, PW, PH, { jags: 4 }), c1: '#3a3358', c2: '#1f1b3c' }] });
      bd.d += propDefs(id, hue);
      bd.d += figureDefs(id, '#5a5aa8', '#22224a', '#fff0d8');
      bd.d += oreDef(id, '#ffeaa8');
      bd.b += `<circle cx="30" cy="34" r="30" fill="url(#${id}ore)" opacity=".85"/>`;
      bd.b += `<path d="M0 170 L184 170 L184 ${PH} L0 ${PH} Z" fill="#1b1736"/>`;
      bd.b += P.flame(id, 80, 122, 1.15, '#ffb066') + P.flame(id, 118, 114, .9, '#ff8a5a');
      bd.b += P.towerB(id, 96, 176, 2.3, true);
      bd.b += P.bolt(id, 96, 30, 1.4, 4);
      bd.b += P.crown(id, 134, 60, .68);
      bd.b += `<g fill="#4a4278"><path d="M38 104 l7 -7 l7 7 l-7 7 Z"/><path d="M152 132 l6 -6 l6 6 l-6 6 Z"/><path d="M58 60 l5 -5 l5 5 l-5 5 Z"/><path d="M24 150 l4 -4 l4 4 l-4 4 Z"/></g>`;
      bd.b += `<g transform="translate(34 118) rotate(-20)">${figure(id, 0, 0, 1.05, 'stand', { arms: 'raise', hood: '#8a5a2a' })}</g>`;
      bd.b += `<g transform="translate(154 110) rotate(18)">${figure(id, 0, 0, 1.05, 'stand', { arms: 'raise', hood: '#5a5aa8' })}</g>`;
      bd.b += starField(ci + 44, 14, PW, 90, '#dfe6ff');
      return bd;
    },
    /* 17 星星：八角星、跪着倒水的她 */
    star: () => {
      const bd = backdrop(id, { sky: ['#071030', '#161c4a', '#302a62'], stars: 40, seed: ci + 45,
        layers: [{ d: ridge(ci + 44, 150, 12, PW, PH, { jags: 4, sharp: false }), c1: '#2a3a5a', c2: '#16203a' },
                 { d: water(186, 2.6, 20, PW, PH), c1: '#24507a', c2: '#101f3e' }] });
      bd.d += figureDefs(id, '#8aa0e0', '#3a4a8a', '#fff6e6'); bd.d += propDefs(id, hue);
      bd.d += rgDef(id + 'st', [[0, '#fff4d0', .9], [1, '#ffe9a8', 0]]);
      bd.b += `<circle cx="92" cy="56" r="52" fill="url(#${id}st)"/>`;
      bd.b += `<g fill="#fff8dc"><path d="${starPath(92, 56, 15, 8, .38)}"/></g>`;
      bd.b += `<g fill="#ffeec9" opacity=".9">${[[34,34],[150,30],[46,74],[142,70],[92,20],[24,58],[162,96]].map(([a,b2],i) => `<path d="${starPath(a, b2, i % 2 ? 4 : 5.4, 6, .36)}"/>`).join('')}</g>`;
      bd.b += P.tree(id, 150, 176, .95);
      bd.b += P.birds(id, 118, 46, 1);
      bd.b += figure(id, 74, 190, 1.6, 'kneel', { robe: '#8aa0e0', arms: 'hold', hair: '#e8d0a0', hairLong: true });
      bd.b += P.cup(id, 62, 168, .7, 150);
      bd.b += `<path d="M64 172 C58 182 52 190 44 196" stroke="#a8e0ff" stroke-width="2.6" fill="none" opacity=".85"/>`;
      bd.b += `<path d="M92 186 C98 194 104 200 112 204" stroke="#a8e0ff" stroke-width="2.6" fill="none" opacity=".85"/>`;
      return bd;
    },
    /* 18 月亮：月下有狼有路有两只塔 */
    moon: () => {
      const bd = backdrop(id, { sky: ['#0a0e30', '#1e2456', '#3a3a72'], stars: 34, seed: ci + 47,
        moon: { x: 92, y: 52, r: 14 },
        layers: [{ d: ridge(ci + 46, 140, 14, PW, PH, { jags: 5 }), c1: '#2e2a56', c2: '#1a1838' }] });
      bd.d += propDefs(id, hue); bd.d += figureDefs(id, '#3a3a7a', '#1a1a44', '#dfe8ff');
      bd.b += P.towerB(id, 26, 140, .7) + P.towerB(id, 158, 140, .7);
      bd.b += `<path d="M0 186 C50 176 120 190 184 178 L184 ${PH} L0 ${PH} Z" fill="#241f44"/>`;
      bd.b += `<path d="M92 230 C86 210 74 196 82 184 C88 176 100 178 100 186" fill="none" stroke="#6a5a8a" stroke-width="7" opacity=".5" stroke-linecap="round"/>`;
      bd.b += `<path d="M0 200 C40 194 90 202 184 192 L184 ${PH} L0 ${PH} Z" fill="#1b1736"/>`;
      bd.b += `<g transform="translate(44 196)">${P.dog(id, 0, 0, 1.3, '#8a86a8')}</g>`;
      bd.b += `<g transform="translate(142 198) scale(-1,1)">${P.dog(id, 0, 0, 1.5, '#c9c2dc')}</g>`;
      bd.b += `<g transform="translate(96 214) scale(1.1)"><path d="M-6 2 C-6 -3 6 -3 6 2 C6 5 -6 5 -6 2 Z" fill="#4a4278"/>
        <path d="M-6 0 C-12 -2 -14 2 -8 3 M6 0 C12 -2 14 2 8 3" stroke="#4a4278" stroke-width="1.6" fill="none"/></g>`;
      bd.b += starField(ci + 48, 10, PW, 60, '#cfd8ff');
      return bd;
    },
    /* 19 太阳：大笑的太阳、白马上的孩子、向日葵 */
    sun: () => {
      const bd = backdrop(id, { sky: ['#2a2a5a', '#5a4a6a', '#a87a5a'], seed: ci + 49,
        layers: [{ d: ridge(ci + 48, 116, 10, PW, PH, { jags: 4, sharp: false }), c1: '#4a5a3a', c2: '#2a3824' }] });
      bd.d += propDefs(id, hue); bd.d += figureDefs(id, '#e8c9a0', '#8a6a4a', '#fff6e6');
      bd.d += oreDef(id, '#ffd37a');
      bd.b += P.sunface(id, 92, 44, 22, '#ffd88a');
      bd.b += `<path d="M0 152 C60 144 120 152 184 144 L184 ${PH} L0 ${PH} Z" fill="#3a4a2a"/>`;
      bd.b += `<g fill="#ffd35a">${[[24,168],[38,182],[164,166],[150,180]].map(([a,b2]) => `<circle cx="${a}" cy="${b2}" r="5"/><circle cx="${a}" cy="${b2}" r="2" fill="#8a6a20"/>`).join('')}</g>`;
      bd.b += `<g stroke="#8fbf7a" stroke-width="1.6">${[[24,168],[38,182],[164,166],[150,180]].map(([a,b2]) => `<path d="M${a} ${b2 + 5} L${a} 196"/>`).join('')}</g>`;
      bd.b += P.horse(id, 96, 200, 1.35, '#f4f0e6', 1);
      bd.b += `<g transform="translate(84 172)">${figure(id, 0, 0, 1.05, 'sit', { robe: '#e8c9a0', arms: 'open', hair: '#c9a86a' })}</g>`;
      bd.b += P.banner(id, 112, 152, 1.1, '#e35d6a');
      bd.b += `<path d="M0 196 L184 196" stroke="#c9a86a" stroke-width="1" opacity=".3"/>`;
      return bd;
    },
    /* 20 审判：吹号的天使、起身的人 */
    judge: () => {
      const bd = backdrop(id, { sky: ['#131a3e', '#2e3a6a', '#5a5a8a'], seed: ci + 51,
        layers: [{ d: ridge(ci + 50, 122, 16, PW, PH, { jags: 4 }), c1: '#3a3a6a', c2: '#1e1c3e' },
                 { d: water(176, 2.6, 22, PW, PH), c1: '#2a4a7a', c2: '#121d3a' }] });
      bd.d += figureDefs(id, '#e8e2ff', '#8a86b8', '#fff6e6'); bd.d += propDefs(id, hue);
      bd.d += rgDef(id + 'hl2', [[0, '#ffeeb8', .5], [1, '#ffeeb8', 0]]);
      bd.b += `<circle cx="92" cy="74" r="58" fill="url(#${id}hl2)"/>`;
      bd.b += cloud(40, 122, .95, '#a8a4d8', .3) + cloud(146, 116, .9, '#a8a4d8', .28);
      bd.b += figure(id, 96, 124, 1.85, 'float', { robe: '#e8e2ff', arms: 'up', wings: true, hair: '#e8d0a0' });
      bd.b += P.trumpet(id, 122, 84, 1.15, -26);
      bd.b += P.banner(id, 46, 76, .95, '#c9667e');
      bd.b += `<path d="M126 78 L42 58" stroke="#e8d0a0" stroke-width="1.4" opacity=".65"/>`;
      bd.b += `<path d="M0 172 C60 166 120 174 184 166 L184 ${PH} L0 ${PH} Z" fill="#2a2a52"/>`;
      bd.b += P.coffin(id, 46, 210, 1.32) + P.coffin(id, 138, 214, 1.32);
      bd.b += figure(id, 46, 208, 1.32, 'raise', { robe: '#6a7ab8', arms: 'up' });
      bd.b += figure(id, 138, 212, 1.32, 'raise', { robe: '#b88a6a', arms: 'up' });
      return bd;
    },
    /* 21 世界：花环里起舞 */
    world: () => {
      const bd = backdrop(id, { sky: ['#1a1440', '#3a2a6a', '#6a4a8a'], stars: 26, seed: ci + 53,
        layers: [{ d: ridge(ci + 52, 172, 8, PW, PH, { jags: 3, sharp: false }), c1: '#3a2a62', c2: '#20163e' }] });
      bd.d += figureDefs(id, '#c9b0e8', '#5a3a8a', '#fff6e6'); bd.d += propDefs(id, hue);
      bd.d += rgDef(id + 'wm', [[0, '#ffe9c0', .42], [1, '#ffe9c0', 0]]);
      bd.b += `<circle cx="92" cy="118" r="74" fill="url(#${id}wm)"/>`;
      bd.b += P.laurel(92, 118, 2.95);
      bd.b += figure(id, 92, 152, 1.58, 'stand', { robe: '#c9b0e8', arms: 'open', hair: '#e8d0a0', hairLong: true });
      bd.b += `<path d="M60 142 C74 130 110 130 124 142" stroke="url(#${id}gd)" stroke-width="1.5" fill="none" opacity=".7"/>`;
      bd.b += `<g fill="url(#${id}gd)" opacity=".9">${[[30, 32], [154, 32]].map(([a, b2]) =>
        `<path d="M${a} ${b2} C${a - 12} ${b2 - 9} ${a - 14} ${b2 + 4} ${a - 3} ${b2 + 6} Z"/>` +
        `<path d="M${a} ${b2} C${a + 12} ${b2 - 9} ${a + 14} ${b2 + 4} ${a + 3} ${b2 + 6} Z"/>` +
        `<circle cx="${a}" cy="${b2 - 5}" r="3.4"/>`).join('')}</g>`;
      bd.b += P.lion(id, 28, 208, .44, '#c9a86a');
      bd.b += `<g fill="#c9a86a" opacity=".95"><path d="M146 208 C146 197 162 197 162 208 Z"/><path d="M144 199 C141 190 147 186 150 192 Z"/><path d="M164 199 C167 190 161 186 158 192 Z"/></g>`;
      return bd;
    }
  };
  const fn = S[CARDS[ci].scene] || S.fool;
  return fn();
}
/* ---------------- 小阿卡纳：四花色的底色与世界 ---------------- */
const SUIT_WORLD = {
  wands: { sky: ['#2a1430', '#5a2a38', '#8a4a34'], sun: { x: 128, y: 66, r: 15, col: '#ffb066', halo: 4.2 },
           g1: '#5a3a22', g2: '#2a1a10', kind: 'dune' },
  cups: { sky: ['#0a1430', '#123050', '#1d5a72'], moon: { x: 124, y: 46, r: 11 },
          g1: '#1a4050', g2: '#0a1c26', kind: 'sea' },
  swords: { sky: ['#101838', '#28386a', '#5a6a9a'], stars: 14,
            g1: '#3a4068', g2: '#191d34', kind: 'ridge' },
  pentacles: { sky: ['#122a2a', '#1e4a3c', '#3a6a4a'], sun: { x: 52, y: 56, r: 12, col: '#ffd37a', halo: 3.6 },
               g1: '#2e5238', g2: '#16281c', kind: 'field' }
};
/* 数字牌：经典的摆法（点数越大摆得越开） */
const PIP_LAYOUT = {
  2: [[62, 100], [124, 140]],
  3: [[60, 86], [92, 134], [126, 98]],
  4: [[62, 84], [124, 84], [62, 148], [124, 148]],
  5: [[58, 78], [128, 78], [93, 116], [58, 154], [128, 154]],
  6: [[60, 72], [126, 72], [60, 114], [126, 114], [60, 156], [126, 156]],
  7: [[56, 68], [130, 68], [56, 108], [130, 108], [93, 142], [56, 172], [130, 172]],
  8: [[58, 66], [128, 66], [58, 102], [128, 102], [58, 138], [128, 138], [93, 172], [93, 30]],
  9: [[56, 60], [93, 60], [130, 60], [56, 100], [93, 100], [130, 100], [56, 140], [93, 140], [130, 140]],
  10: [[56, 54], [93, 54], [130, 54], [56, 92], [93, 92], [130, 92], [56, 130], [93, 130], [130, 130], [93, 172]]
};
const SUIT_KIND = { wands: 'wand', cups: 'cup', swords: 'sword', pentacles: 'coin' };
const PIP_SCALE = {
  wand: { 2: 1.1, 3: .98, 4: .9, 5: .84, 6: .78, 7: .72, 8: .66, 9: .62, 10: .58 },
  cup:  { 2: 1.3, 3: 1.12, 4: 1.02, 5: .96, 6: .9, 7: .84, 8: .78, 9: .72, 10: .68 },
  sword:{ 2: 1.15, 3: 1, 4: .92, 5: .86, 6: .8, 7: .74, 8: .68, 9: .63, 10: .6 },
  coin: { 2: 1.7, 3: 1.5, 4: 1.35, 5: 1.25, 6: 1.15, 7: 1.05, 8: .98, 9: .9, 10: .84 }
};
function inst(id, suit, x, y, s, rot = 0) {
  const P = PROPS;
  if (suit === 'wands') return P.wand(id, x, y, s, rot);
  if (suit === 'cups') return P.cup(id, x, y, s, rot);
  if (suit === 'swords') return P.sword(id, x, y, s, rot);
  return P.coin(id, x, y, s, rot);
}
/* 四花色的地面/水面 */
function suitGround(id, suit, bd) {
  const W = SUIT_WORLD[suit];
  if (W.kind === 'sea') {
    bd.b += `<path d="${water(152, 3.4, 26, PW, PH)}" fill="url(#${id}g1)"/>`;
    bd.b += `<path d="${waveLine(160, 2.6, 20, PW, .8)}" stroke="#a8e0ff" stroke-width="1" fill="none" opacity=".28"/>`;
    bd.b += `<path d="${waveLine(174, 2.2, 16, PW, 2.1)}" stroke="#a8e0ff" stroke-width="1" fill="none" opacity=".22"/>`;
    bd.b += `<path d="${waveLine(190, 2, 13, PW, 3.4)}" stroke="#a8e0ff" stroke-width="1" fill="none" opacity=".16"/>`;
  } else if (W.kind === 'dune') {
    bd.b += `<path d="${ridge(7, 168, 10, PW, PH, { jags: 4, sharp: false })}" fill="url(#${id}g1)"/>`;
    bd.b += `<path d="${ridge(9, 196, 7, PW, PH, { jags: 3, sharp: false })}" fill="url(#${id}g2)"/>`;
  } else if (W.kind === 'ridge') {
    bd.b += `<path d="${ridge(5, 150, 18, PW, PH, { jags: 4 })}" fill="url(#${id}g1)"/>`;
    bd.b += `<path d="${ridge(6, 186, 12, PW, PH, { jags: 3 })}" fill="url(#${id}g2)"/>`;
  } else {
    bd.b += `<path d="${ridge(3, 158, 5, PW, PH, { jags: 3, sharp: false })}" fill="url(#${id}g1)"/>`;
    bd.b += `<path d="${ridge(4, 190, 4, PW, PH, { jags: 3, sharp: false })}" fill="url(#${id}g2)"/>`;
    bd.b += `<g stroke="#8fbf7a" stroke-width="1.2" opacity=".55">${Array.from({ length: 12 }, (_, i) => { const x = 10 + i * 15; return `<path d="M${f(x)} 176 L${f(x)} 160"/>`; }).join('')}</g>`;
  }
  bd.d += lgDef(id + 'g1', [[0, W.g1], [1, W.g2]]) + lgDef(id + 'g2', [[0, W.g2], [1, '#0a0818']]);
}
/* 宝座 */
function throne(id, x, y, s, tone = '#6a5236') {
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <rect x="-24" y="-52" width="48" height="10" rx="3" fill="${tone}"/>
    <rect x="-18" y="-42" width="36" height="30" rx="2" fill="${tone}"/>
    <rect x="-18" y="-42" width="8" height="30" fill="#fff" opacity=".08"/>
    <rect x="-26" y="-12" width="52" height="10" rx="3" fill="url(#${id}gd)"/>
    <rect x="-22" y="-2" width="44" height="4" fill="#2a2038"/>
    <circle cx="0" cy="-56" r="6" fill="url(#${id}gd)"/>
    <path d="M-14 -46 l-6 -6 M14 -46 l6 -6" stroke="url(#${id}gd)" stroke-width="1.4"/>
  </g>`;
}
/* ---------------- 数字牌 2–10 的场景（韦特式叙事） ----------------
   每张牌都是一个小画面：有人物、有动作、有道具，而不是把同一个符号复制 N 遍。
   坐标都在画框局部空间（0..184 × 0..230）：地平线约 y≈180–205，顶部中间 y<42 是编号铭牌。 */
const R_BY_SUIT = {
  wands: ['#7a5228', '#2a1a10', '#2a1c33'],
  cups: ['#3a5a9a', '#1a2a52', '#c9b48a'],
  swords: ['#5a5a9a', '#22224a', '#2a1c33'],
  pentacles: ['#4a6a3a', '#1a2a18', '#3a2a20']
};
const FN = (id, x, y, s, pose, o) => figure(id, x, y, s, pose, o);
const PIP_SCENE = {
  wands: {
    /* 2 · 城墙上，手里一颗地球仪 */
    2: (id) => `<path d="M0 178 H184 V230 H0 Z" fill="#38281a"/>
      <path d="M6 178 v-16 h18 v16 M44 178 v-16 h18 v16 M122 178 v-16 h18 v16 M160 178 v-16 h18 v16" fill="#4a3520"/>
      ${inst(id, 'wands', 30, 194, 1.05, -7)}${inst(id, 'wands', 154, 194, 1.05, 7)}
      ${FN(id, 86, 194, 1.7, 'stand', { arms: 'hold', hair: '#2a1c33' })}
      ${PROPS.coin(id, 112, 158, .62)}
      <g opacity=".7">${PROPS.tree(id, 20, 190, .7)}</g>`,
    /* 3 · 崖上背身远眺，海上两条船 */
    3: (id) => `<path d="M0 198 C36 188 76 202 116 192 C146 186 166 194 184 190 L184 230 L0 230 Z" fill="#3a2a18"/>
      ${inst(id, 'wands', 26, 206, 1.05, -9)}${inst(id, 'wands', 158, 206, 1.05, 9)}
      ${FN(id, 92, 206, 1.7, 'back', { arms: 'hold', hair: '#2a1c33' })}
      ${inst(id, 'wands', 124, 168, 1.05, 18)}
      <g fill="#c9a86a" opacity=".85"><path d="M20 118 l11 -9 l11 9 z"/><path d="M150 134 l9 -7 l9 7 z"/></g>
      <g stroke="#8a7a5a" stroke-width="1" opacity=".45"><path d="M20 121 h22 M150 137 h18"/></g>`,
    /* 4 · 花环下的庆典，两个人举着花束 */
    4: (id) => `${[22, 64, 120, 162].map(x => inst(id, 'wands', x, 206, 1.2, 0)).join('')}
      <path d="M22 150 C60 128 124 128 162 150" stroke="#8fbf7a" stroke-width="3.4" fill="none"/>
      <g fill="#ffd0e0">${[38, 58, 78, 98, 118, 146].map((x, i) => `<circle cx="${x}" cy="${144 - (i % 2 ? 5 : 0) - Math.round(Math.sin(i) * 5)}" r="3.6"/>`).join('')}</g>
      ${FN(id, 46, 208, 1.35, 'stand', { arms: 'up', hair: '#c9b48a' })}
      ${FN(id, 138, 208, 1.35, 'stand', { arms: 'up', hair: '#3a2a20' })}
      <path d="M0 208 H184 V230 H0 Z" fill="#3a2a18"/>`,
    /* 5 · 五个年轻人挥杖混战 */
    5: (id) => `<path d="M0 202 H184 V230 H0 Z" fill="#3a2a18"/>
      ${inst(id, 'wands', 26, 180, 1.25, -40)}${inst(id, 'wands', 58, 188, 1.25, 30)}${inst(id, 'wands', 100, 174, 1.25, -48)}
      ${inst(id, 'wands', 130, 190, 1.25, 34)}${inst(id, 'wands', 160, 182, 1.25, -30)}
      ${FN(id, 44, 206, 1.45, 'walk', { arms: 'raise', hair: '#2a1c33' })}
      ${FN(id, 92, 208, 1.45, 'stand', { arms: 'raise', hair: '#c9b48a' })}
      ${FN(id, 142, 206, 1.45, 'walk', { arms: 'up', hair: '#3a2a20' })}`,
    /* 6 · 戴桂冠的骑者，六杖夹道欢迎 */
    6: (id) => `<path d="M0 202 H184 V230 H0 Z" fill="#3a2a18"/>
      ${[18, 42, 66, 118, 142, 166].map(x => inst(id, 'wands', x, 198, 1, 0)).join('')}
      ${PROPS.horse(id, 92, 202, 1.45, '#efe9dc', 1)}
      ${FN(id, 84, 176, 1.2, 'sit', { arms: 'hold', hair: '#2a1c33' })}
      <path d="M112 156 l12 -7 l-12 -7 z" fill="#e35d6a"/>
      <path d="M112 149 h-22" stroke="#8a7a5a" stroke-width="1.6"/>
      <g fill="#c9b48a" opacity=".75">${[30, 56, 128, 154].map(x => `<circle cx="${x}" cy="198" r="4.6"/>`).join('')}</g>`,
    /* 7 · 高地上一个人挥杖挡住下面六根 */
    7: (id) => `<path d="M0 204 H184 V230 H0 Z" fill="#3a2a18"/>
      <path d="M50 204 C70 176 114 176 134 204 Z" fill="#4a3520"/>
      ${[[22, 198, -34], [42, 196, -30], [58, 190, -24], [126, 190, 24], [146, 196, 30], [166, 198, 34]].map(([x, y, rr]) => inst(id, 'wands', x, y, 1.15, rr)).join('')}
      ${FN(id, 92, 200, 1.7, 'stand', { arms: 'raise', hair: '#2a1c33' })}
      ${inst(id, 'wands', 108, 166, 1.15, 26)}`,
    /* 8 · 八根杖飞过天空（速度感） */
    8: (id) => `<path d="M0 210 H184 V230 H0 Z" fill="#3a2a18"/>
      ${[[16, 150, -25], [52, 138, -25], [88, 126, -25], [124, 114, -25], [158, 102, -25],
         [30, 86, -25], [66, 74, -25], [102, 62, -25]].map(([x, y, rr]) => inst(id, 'wands', x, y, 1.1, rr)).join('')}
      <g stroke="#ffcf9a" stroke-width="1.5" opacity=".32">${[[8, 172], [44, 160], [80, 148], [116, 136], [152, 124]].map(([x, y]) => `<path d="M${x} ${y} l26 -14"/>`).join('')}</g>`,
    /* 9 · 受伤的守夜人，身后八根杖当栅栏 */
    9: (id) => `<path d="M0 202 H184 V230 H0 Z" fill="#3a2a18"/>
      ${[10, 32, 54, 78, 106, 128, 150, 172].map(x => inst(id, 'wands', x, 196, 1, 0)).join('')}
      ${FN(id, 92, 208, 1.55, 'stand', { arms: 'hold', hair: '#2a1c33' })}
      ${inst(id, 'wands', 98, 190, 1, -7)}
      <path d="M62 176 h18 M62 184 h18" stroke="#efe9dc" stroke-width="3" opacity=".85"/>`,
    /* 10 · 扛着十根杖走向村子 */
    10: (id) => `<path d="M0 204 H184 V230 H0 Z" fill="#3a2a18"/>
      <g opacity=".85"><path d="M12 192 h30 v12 H12 Z" fill="#4a3520"/><path d="M150 190 h30 v14 h-30 Z" fill="#4a3520"/><path d="M56 194 h18 v10 H56 Z" fill="#4a3520"/></g>
      ${FN(id, 96, 206, 1.5, 'walk', { arms: 'up', hair: '#2a1c33' })}
      ${[[70, 156, -62], [82, 148, -54], [94, 142, -46], [106, 144, -38], [118, 150, -30], [76, 166, -66], [112, 132, -34], [64, 176, -70]].map(([x, y, rr]) => inst(id, 'wands', x, y, .9, rr)).join('')}
      ${inst(id, 'wands', 126, 168, .9, 22)}${inst(id, 'wands', 108, 178, .9, 14)}`
  },
  cups: {
    /* 2 · 两人交换杯子，中间一根双蛇杖 */
    2: (id) => `${PROPS.cup(id, 40, 178, 1.05)}${PROPS.cup(id, 144, 178, 1.05)}
      ${FN(id, 58, 202, 1.6, 'stand', { arms: 'hold', hair: '#c9b48a' })}
      ${FN(id, 126, 202, 1.6, 'stand', { arms: 'hold', hair: '#2a1c33' })}
      <path d="M92 106 v50" stroke="url(#${id}gd)" stroke-width="2.4"/>
      <path d="M76 116 C85 102 99 102 108 116 C98 109 86 109 76 116 Z" fill="url(#${id}gd)"/>
      <circle cx="92" cy="102" r="5.6" fill="url(#${id}cn)"/>`,
    /* 3 · 三个人举杯共舞 */
    3: (id) => `${PROPS.cup(id, 30, 152, .95)}${PROPS.cup(id, 92, 140, .95)}${PROPS.cup(id, 154, 152, .95)}
      ${FN(id, 38, 204, 1.5, 'stand', { arms: 'up', hair: '#c9b48a' })}
      ${FN(id, 92, 206, 1.5, 'stand', { arms: 'up', hair: '#2a1c33' })}
      ${FN(id, 146, 204, 1.5, 'stand', { arms: 'up', hair: '#3a2a20' })}
      <g fill="#8fbf7a" opacity=".8">${[14, 170].map(x => `<circle cx="${x}" cy="198" r="6"/>`).join('')}</g>`,
    /* 4 · 树下的人不看云里递来的那只杯 */
    4: (id) => `${PROPS.tree(id, 148, 200, 1.05, true)}
      ${PROPS.cup(id, 34, 192, .95)}${PROPS.cup(id, 56, 192, .95)}${PROPS.cup(id, 22, 178, .95)}
      ${cloud(100, 80, .95, '#c9c2dc', .3)}${PROPS.hand(id, 112, 98, .9, 16)}${PROPS.cup(id, 116, 110, .85)}
      ${FN(id, 76, 202, 1.55, 'sit', { arms: 'cross', hair: '#2a1c33' })}`,
    /* 5 · 披风人回头看着三只倒下的杯 */
    5: (id) => `${[34, 66, 98].map((x, i) => `<g transform="translate(${x} ${198 + i * 3}) rotate(${i % 2 ? 104 : -104})">${PROPS.cup(id, 0, 0, .9)}</g>`).join('')}
      ${PROPS.cup(id, 148, 168, .95)}${PROPS.cup(id, 166, 176, .95)}
      ${FN(id, 56, 204, 1.6, 'back', { arms: 'cross', hood: '#241a44' })}
      <path d="M20 208 C48 202 88 208 116 202" stroke="#a8e0ff" stroke-width="1.4" fill="none" opacity=".4"/>`,
    /* 6 · 两个小孩互赠插花的杯 */
    6: (id) => `${[[26, 152], [48, 142], [68, 134], [116, 134], [136, 144]].map(([x, y]) =>
      `${PROPS.cup(id, x, y, .82)}<g fill="#ffd0a0">${[[-4, -17], [4, -17], [0, -23]].map(([a, b]) => `<circle cx="${x + a}" cy="${y + b}" r="2.4"/>`).join('')}</g>`).join('')}
      ${FN(id, 74, 204, 1.4, 'stand', { arms: 'hold', hair: '#c9b48a' })}
      ${FN(id, 110, 204, 1.4, 'stand', { arms: 'hold', hair: '#2a1c33' })}
      ${PROPS.cup(id, 92, 172, .95)}
      <path d="M92 156 v-6" stroke="#ffd0a0" stroke-width="1.2" opacity=".7"/>`,
    /* 7 · 云里七只杯，底下一个人张开手 */
    7: (id) => `${cloud(92, 68, 1.5, '#c9c2dc', .3)}${cloud(38, 90, 1, '#c9c2dc', .22)}${cloud(148, 92, 1, '#c9c2dc', .22)}
      ${[[36, 96], [64, 74], [92, 62], [120, 74], [148, 96], [58, 126], [126, 126]].map(([x, y]) => PROPS.cup(id, x, y, .8)).join('')}
      <g fill="#ffe9a8" opacity=".9">${[[36, 86], [92, 52], [148, 86]].map(([x, y]) => `<path d="${starPath(x, y, 4, 6, .34)}"/>`).join('')}</g>
      ${FN(id, 92, 210, 1.7, 'back', { arms: 'raise', hood: '#241a44' })}`,
    /* 8 · 转身离开堆好的八只杯，月亮照着 */
    8: (id) => `<g opacity=".9">${[[20, 198], [40, 198], [60, 198], [20, 178], [40, 178], [60, 158], [30, 158], [50, 158]].map(([x, y]) => PROPS.cup(id, x, y, .62)).join('')}</g>
      <path d="M0 210 H74 V230 H0 Z" fill="#16202e"/>
      ${FN(id, 132, 206, 1.6, 'walk', { arms: 'down', hood: '#241a44' })}`,
    /* 9 · 心满意足的人，身后九只杯 */
    9: (id) => `${[[24, 150], [46, 136], [70, 128], [94, 126], [118, 128], [142, 136], [164, 150], [64, 164], [124, 164]].map(([x, y]) => PROPS.cup(id, x, y, .78)).join('')}
      <path d="M10 186 H54 V196 H10 Z" fill="#4a3a5a"/>
      <path d="M10 186 v-16 h10 v16" fill="#4a3a5a"/>
      ${FN(id, 34, 186, 1.6, 'sit', { arms: 'hold', hair: '#c9b48a' })}`,
    /* 10 · 彩虹下的家，十只杯 */
    10: (id) => `<path d="M6 122 C50 68 134 68 178 122" stroke="#ffb0d0" stroke-width="3" fill="none" opacity=".55"/>
      <path d="M14 126 C54 78 130 78 170 126" stroke="#a8e0ff" stroke-width="2.6" fill="none" opacity=".45"/>
      ${[[24, 106], [52, 86], [80, 76], [108, 76], [136, 86], [162, 106]].map(([x, y]) => PROPS.cup(id, x, y, .6)).join('')}
      ${[[40, 176], [146, 176], [30, 196], [156, 196]].map(([x, y]) => PROPS.cup(id, x, y, .62)).join('')}
      ${FN(id, 66, 206, 1.45, 'stand', { arms: 'open', hair: '#3a2a20' })}
      ${FN(id, 94, 206, 1.3, 'stand', { arms: 'up', hair: '#c9b48a' })}
      ${FN(id, 120, 206, 1.45, 'stand', { arms: 'open', hair: '#c9b48a' })}
      <path d="M0 212 H184 V230 H0 Z" fill="#162a34"/>`
  },
  swords: {
    /* 2 · 蒙眼的人，两把剑交叉抱在胸前，背后是水 */
    2: (id) => `<path d="M0 178 C40 172 90 180 184 174 L184 230 L0 230 Z" fill="#2a3050"/>
      <path d="${waveLine(198, 2.4, 20, PW, .6)}" stroke="#a8e0ff" stroke-width="1" fill="none" opacity=".3"/>
      ${FN(id, 92, 206, 1.7, 'stand', { arms: 'cross', hair: '#2a1c33' })}
      <path d="M76 156 h32" stroke="#dfe8ff" stroke-width="2.6" opacity=".92"/>
      ${inst(id, 'swords', 60, 150, 1.1, -38)}${inst(id, 'swords', 124, 150, 1.1, 38)}`,
    /* 3 · 三把剑穿过一颗心，下着雨 */
    3: (id) => `<path d="M0 176 H184 V230 H0 Z" fill="#252a48"/>
      <path d="M92 170 C68 150 60 132 76 120 C84 114 92 120 92 127 C92 120 100 114 108 120 C124 132 116 150 92 170 Z" fill="#e0687a"/>
      ${inst(id, 'swords', 92, 106, 1.05, 0)}${inst(id, 'swords', 62, 122, 1, 54)}${inst(id, 'swords', 122, 122, 1, -54)}
      <g stroke="#cfe0ff" stroke-width="1" opacity=".38">${[26, 58, 130, 158].map((x, i) => `<path d="M${x} ${72 + i * 7} l-7 22"/>`).join('')}</g>`,
    /* 4 · 石棺上的骑士像，墙上三把剑 */
    4: (id) => `<path d="M0 188 H184 V230 H0 Z" fill="#252a48"/>
      <path d="M36 188 h112 v-12 H36 Z" fill="#3a4068"/>
      <path d="M54 176 h76 v-6 H54 Z" fill="#4a5080"/>
      ${FN(id, 92, 176, 1.45, 'lie', { arms: 'cross', crown: true, hair: '#c9b48a' })}
      ${[44, 92, 140].map(x => inst(id, 'swords', x, 118, 1.05, 0)).join('')}
      <path d="M28 124 H156" stroke="#5a6a9a" stroke-width="1.4" opacity=".55"/>
      ${inst(id, 'swords', 92, 164, 1, 90)}`,
    /* 5 · 一个人捡起剑，另外两个走了 */
    5: (id) => `<path d="M0 202 H184 V230 H0 Z" fill="#252a48"/>
      ${inst(id, 'swords', 20, 208, .9, 84)}${inst(id, 'swords', 52, 202, .9, 92)}${inst(id, 'swords', 152, 212, .85, 88)}${inst(id, 'swords', 176, 204, .85, 86)}
      ${FN(id, 96, 206, 1.6, 'kneel', { arms: 'hold', hair: '#2a1c33' })}
      ${inst(id, 'swords', 116, 168, 1, 52)}
      ${FN(id, 160, 202, 1.35, 'walk', { arms: 'down', hair: '#c9b48a' })}
      <path d="M124 220 h40" stroke="#dfe8ff" stroke-width="1.2" opacity=".45"/>`,
    /* 6 · 渡船载着披风人，船里立着六把剑 */
    6: (id) => `<path d="M0 188 H184 V230 H0 Z" fill="#182040"/>
      <path d="${waveLine(198, 2.2, 18, PW, .5)}" stroke="#a8e0ff" stroke-width="1" fill="none" opacity=".28"/>
      ${FN(id, 92, 190, 1.3, 'sit', { arms: 'cross', hood: '#241a44' })}
      <path d="M34 198 C60 214 130 214 154 198 Z" fill="#3a3157"/>
      ${[50, 68, 86, 104, 122, 140].map(x => inst(id, 'swords', x, 170, 1.05, 0)).join('')}`,
    /* 7 · 抱着五把剑溜走，营地里留下两把 */
    7: (id) => `<path d="M0 204 H184 V230 H0 Z" fill="#252a48"/>
      <path d="M124 204 l16 -22 l16 22 z" fill="#3a3157"/><path d="M100 204 l14 -18 l14 18 z" fill="#3a3157"/>
      ${inst(id, 'swords', 26, 212, .9, 88)}${inst(id, 'swords', 46, 214, .9, 92)}
      ${FN(id, 62, 206, 1.5, 'walk', { arms: 'hold', hair: '#2a1c33' })}
      ${[[78, 176, -30], [92, 168, -24], [106, 164, -18], [120, 168, -12], [134, 176, -6]].map(([x, y, rr]) => inst(id, 'swords', x, y, .88, rr)).join('')}`,
    /* 8 · 被绑住的人，八把剑围成一圈 */
    8: (id) => `<path d="M0 198 H184 V230 H0 Z" fill="#252a48"/>
      ${[16, 44, 72, 100, 128, 156].map(x => inst(id, 'swords', x, 198, 1, 0)).join('')}
      ${inst(id, 'swords', 56, 142, 1, 90)}${inst(id, 'swords', 128, 142, 1, 90)}
      ${FN(id, 92, 204, 1.5, 'stand', { arms: 'cross', hair: '#2a1c33' })}
      <path d="M74 170 q18 -9 36 0" stroke="#dfe8ff" stroke-width="1.6" fill="none" opacity=".55"/>`,
    /* 9 · 床上惊醒的人，墙上挂着九把剑 */
    9: (id) => `<path d="M0 198 H184 V230 H0 Z" fill="#252a48"/>
      <path d="M92 216 h84 v-12 H92 Z" fill="#3a3157"/>
      <path d="M156 204 v-24 h8 v24" fill="#3a3157"/>
      ${[10, 32, 54, 76, 98, 120, 142, 164].map(x => inst(id, 'swords', x, 116, 1, 0)).join('')}
      ${inst(id, 'swords', 92, 138, 1, 90)}
      ${FN(id, 122, 202, 1.5, 'sit', { arms: 'cross', hair: '#c9b48a' })}`,
    /* 10 · 十把剑钉在地上的人，天很黑 */
    10: (id) => `<path d="M0 180 H184 V230 H0 Z" fill="#1a2040"/>
      ${FN(id, 92, 204, 1.5, 'lie', { arms: 'open', hair: '#c9b48a' })}
      ${[[62, 188, -74], [74, 178, -60], [86, 168, -46], [98, 160, -32], [110, 156, -18], [122, 158, -4],
         [134, 166, 10], [146, 176, 24], [56, 198, -86], [158, 188, 38]].map(([x, y, rr]) => inst(id, 'swords', x, y, .92, rr)).join('')}
      <path d="M0 62 C50 54 120 64 184 56" stroke="#5a6a9a" stroke-width="2.2" fill="none" opacity=".38"/>`
  },
  pentacles: {
    /* 2 · 一个人耍着两枚钱，头顶一只无穷符号，身后是浪 */
    2: (id) => `<path d="M0 198 H184 V230 H0 Z" fill="#2e5238"/>
      <g fill="none" stroke="#8ad0a0" stroke-width="2.6" opacity=".5">${[0, 1, 2].map(i => `<path d="M6 ${196 + i * 9} q22 -12 44 0 q22 12 44 0 q22 -12 44 0 q22 12 44 0"/>`).join('')}</g>
      <circle cx="84" cy="122" r="9" fill="none" stroke="url(#${id}gd)" stroke-width="1.6"/>
      <circle cx="102" cy="122" r="9" fill="none" stroke="url(#${id}gd)" stroke-width="1.6"/>
      ${FN(id, 66, 208, 1.7, 'stand', { arms: 'up', hair: '#2a1c33' })}
      ${PROPS.coin(id, 132, 152, .95)}${PROPS.coin(id, 132, 198, .95)}`,
    /* 3 · 教堂拱门下干活的工匠，三枚钱挂在墙上 */
    3: (id) => `<path d="M0 202 H184 V230 H0 Z" fill="#2e5238"/>
      <path d="M32 202 V152 A56 56 0 0 1 144 152 V202" fill="none" stroke="#16301f" stroke-width="10"/>
      <path d="M32 202 V152 A56 56 0 0 1 144 152 V202" fill="none" stroke="#3a5a44" stroke-width="5"/>
      ${FN(id, 76, 202, 1.55, 'stand', { arms: 'raise', hair: '#3a2a20' })}
      ${[[112, 148], [112, 176], [136, 162]].map(([x, y]) => PROPS.coin(id, x, y, .78)).join('')}
      <path d="M52 202 h74" stroke="#5a4228" stroke-width="6" opacity=".75"/>`,
    /* 4 · 抱着钱坐着的人：头顶一枚、怀里一枚、脚下两枚 */
    4: (id) => `<path d="M0 198 H184 V230 H0 Z" fill="#2e5238"/>
      <g fill="#20303a" opacity=".9"><path d="M8 196 v-26 h20 v26 Z"/><path d="M34 196 v-36 h22 v36 Z"/><path d="M134 196 v-30 h20 v30 Z"/><path d="M158 196 v-24 h18 v24 Z"/></g>
      ${PROPS.coin(id, 92, 134, .78)}
      ${FN(id, 92, 198, 1.6, 'sit', { arms: 'cross', crown: true, hair: '#3a2a20' })}
      <path d="M76 190 m-2 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0" fill="#dfefff" opacity=".45"/>
      ${PROPS.coin(id, 92, 170, .62)}
      ${PROPS.coin(id, 68, 204, .48)}${PROPS.coin(id, 116, 204, .48)}`,
    /* 5 · 雪夜里两个穷人走过亮着五扇窗的门 */
    5: (id) => `<path d="M0 196 H184 V230 H0 Z" fill="#1e3a44" opacity=".7"/>
      <path d="M112 122 h58 v74 h-58 Z" fill="#16262a"/>
      ${[[138, 136], [154, 148], [148, 165], [128, 165], [122, 148]].map(([x, y]) => PROPS.coin(id, x, y, .58)).join('')}
      ${FN(id, 44, 200, 1.5, 'walk', { arms: 'cross', hood: '#3a4a5a' })}
      ${FN(id, 72, 202, 1.3, 'walk', { arms: 'cross', hood: '#2a3a4a' })}
      <g fill="#fff" opacity=".55">${[[20, 74], [40, 116], [16, 152], [96, 60], [160, 60], [88, 96]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5"/>`).join('')}</g>`,
    /* 6 · 商人拿着天平，两个跪着的人各得一枚 */
    6: (id) => `<path d="M0 200 H184 V230 H0 Z" fill="#2e5238"/>
      ${FN(id, 92, 200, 1.7, 'stand', { arms: 'open', hair: '#2a1c33' })}
      ${PROPS.scale(id, 92, 156, .8)}
      ${FN(id, 42, 208, 1.3, 'kneel', { arms: 'raise', hood: '#3a2a4a' })}
      ${FN(id, 142, 208, 1.3, 'kneel', { arms: 'raise', hood: '#2a3a5a' })}
      ${PROPS.coin(id, 24, 196, .5)}${PROPS.coin(id, 68, 176, .5)}${PROPS.coin(id, 118, 176, .5)}${PROPS.coin(id, 160, 196, .5)}
      ${PROPS.coin(id, 68, 200, .5)}${PROPS.coin(id, 118, 200, .5)}`,
    /* 7 · 农夫拄着锄头，看着藤上七枚钱 */
    7: (id) => `<path d="M0 204 H184 V230 H0 Z" fill="#2e5238"/>
      <path d="M40 204 C62 150 124 150 152 204" stroke="#3a6a44" stroke-width="2.2" fill="none"/>
      ${[[54, 178], [76, 162], [102, 152], [128, 160], [148, 176], [88, 180], [116, 182]].map(([x, y]) => PROPS.coin(id, x, y, .6)).join('')}
      ${FN(id, 34, 206, 1.6, 'stand', { arms: 'hold', hair: '#3a2a20' })}
      <path d="M46 178 v28" stroke="#8a6a3a" stroke-width="2.4"/>
      <path d="M42 178 h10 v-6 h-10 Z" fill="#5a4228"/>`,
    /* 8 · 学徒在刻第八枚钱，另外七枚钉在木柱上 */
    8: (id) => `<path d="M0 204 H184 V230 H0 Z" fill="#2e5238"/>
      <path d="M14 204 v-98 h36 v98 Z" fill="#3a4a38"/>
      ${[[24, 152], [40, 160], [24, 172], [40, 180], [24, 130], [40, 138], [32, 112]].map(([x, y]) => PROPS.coin(id, x, y, .55)).join('')}
      ${FN(id, 110, 206, 1.6, 'stand', { arms: 'hold', hair: '#c9b48a' })}
      <path d="M124 180 h16" stroke="#dfefff" stroke-width="1.6"/>
      ${PROPS.coin(id, 140, 178, .6)}`,
    /* 9 · 葡萄园里的女子与一只猎鹰，九枚钱挂在藤间 */
    9: (id) => `<path d="M0 204 H184 V230 H0 Z" fill="#2e5238"/>
      <g fill="#8fbf7a" opacity=".5">${[[20, 168], [38, 146], [24, 122], [44, 102], [150, 164], [166, 144], [152, 120], [132, 102]].map(([x, y]) => `<path d="M${x} ${y} q7 -9 14 0 q-7 9 -14 0 Z"/>`).join('')}</g>
      ${[[30, 176], [46, 156], [34, 132], [152, 174], [166, 154], [156, 130], [140, 110], [44, 108], [124, 98]].map(([x, y]) => PROPS.coin(id, x, y, .58)).join('')}
      ${FN(id, 94, 208, 1.7, 'stand', { arms: 'raise', hair: '#c9b48a', hairLong: true })}
      <path d="M114 168 q11 -7 18 2 q-9 5 -18 -2 Z" fill="#6a5236"/>
      <circle cx="134" cy="166" r="2.2" fill="#ffe9a8"/>`,
    /* 10 · 拱门下的老人与两条狗，十枚钱排成一棵树 */
    10: (id) => `<path d="M0 200 H184 V230 H0 Z" fill="#2e5238"/>
      <path d="M22 200 V144 A68 68 0 0 1 158 144 V200" fill="none" stroke="#4a5a44" stroke-width="8" opacity=".8"/>
      <g fill="#2a4a32">${[[44, 118], [72, 100], [100, 96], [128, 102], [152, 120], [58, 148], [86, 136], [114, 134], [140, 146], [92, 166]].map(([x, y]) => `<g opacity=".92">${PROPS.coin(id, x, y, .5)}</g>`).join('')}</g>
      ${FN(id, 92, 204, 1.5, 'stand', { arms: 'hold', hair: '#c9b48a' })}
      ${PROPS.dog(id, 142, 208, .8)}${PROPS.dog(id, 40, 208, .8)}
      <path d="M20 204 h44 M132 204 h44" stroke="#5a4228" stroke-width="1.2" opacity=".45"/>`
  }

};
function minorScene(card, id) {
  const suit = card.suit, S = SUIT_WORLD[suit], P = PROPS, r = card.rank, court = card.court;
  const bd = backdrop(id, { sky: S.sky, sun: S.sun || null, moon: S.moon || null, stars: S.stars || 0,
    seed: card.ci * 3 + 1, haze: suit === 'swords' ? '#cfe0ff' : null });
  bd.d += propDefs(id, card.hue);
  bd.d += rgDef(id + 'gl', [[0, `hsl(${f(card.hue)} 82% 72%)`, .52], [.45, `hsl(${f(card.hue)} 70% 52%)`, .2], [1, '#000', 0]]);
  /* 王牌：云里递出一只手，捧着这一花色的第一件东西 */
  if (r === 1) {
    bd.b += cloud(92, 44, 1.5, '#c9c2dc', .34) + cloud(60, 52, 1, '#c9c2dc', .24) + cloud(124, 50, .95, '#c9c2dc', .22);
    bd.b += `<circle cx="92" cy="104" r="52" fill="url(#${id}gl)"/>`;
    bd.b += `<g transform="translate(0 4)">${P.hand(id, 92, 96, 1.5, 20)}</g>`;
    bd.b += inst(id, suit, 100, 96, suit === 'coin' ? 1.7 : 1.6, suit === 'cups' ? -10 : 10);
    suitGround(id, suit, bd);
    bd.b += `<g fill="hsl(${f(card.hue)} 70% 70%)" opacity=".85">${[[30,84],[154,80],[44,120],[146,124]].map(([a,b2],i) => `<path d="${starPath(a, b2, i % 2 ? 5 : 7, 4, .34)}"/>`).join('')}</g>`;
    return bd;
  }
  /* 宫廷牌：侍从 / 骑士 / 王后 / 国王 */
  if (court) {
    suitGround(id, suit, bd);
    const robe = `hsl(${f(card.hue)} 42% ${court === 'knight' ? 30 : 34}%)`;
    bd.d += figureDefs(id, robe, '#12102c', '#e8e2ff');
    if (court === 'page') {
      bd.b += `<path d="M0 168 C50 160 120 168 184 158 L184 ${PH} L0 ${PH} Z" fill="#1b1736" opacity=".5"/>`;
      bd.b += figure(id, 66, 190, 1.6, 'walk', { robe, arms: 'hold', hair: '#c9b48a' });
      bd.b += inst(id, suit, 100, 168, suit === 'coin' ? 1.4 : 1.3, suit === 'cups' ? -14 : 14);
      if (suit === 'cups') bd.b += P.butterfly(id, 128, 128, .5, '#cfe4ff');
      if (suit === 'wands') bd.b += P.flame(id, 128, 132, .55, '#ffb066');
      if (suit === 'pentacles') bd.b += P.tree(id, 138, 176, .8, true);
      if (suit === 'swords') bd.b += P.birds(id, 120, 116, 1);
      return bd;
    }
    if (court === 'knight') {
      bd.b += `<path d="M0 176 C50 168 120 176 184 166 L184 ${PH} L0 ${PH} Z" fill="#1b1736" opacity=".55"/>`;
      bd.b += P.horse(id, 100, 186, 1.55, suit === 'swords' ? '#c9c2dc' : '#efe9dc', 1);
      bd.b += `<g transform="translate(92 158)">${figure(id, 0, 0, 1.15, 'sit', { robe, arms: 'hold', hair: '#2a1c33' })}</g>`;
      bd.b += inst(id, suit, 128, 130, suit === 'coin' ? 1.2 : 1.1, 26);
      if (suit === 'cups') bd.b += `<path d="M0 196 C50 190 120 198 184 190" stroke="#a8e0ff" stroke-width="1.6" fill="none" opacity=".4"/>`;
      if (suit === 'wands') bd.b += P.flame(id, 40, 168, .6, '#ffb066');
      if (suit === 'swords') bd.b += `<g stroke="#dfe8ff" stroke-width="1.1" opacity=".45"><path d="M0 60 C40 56 80 62 184 54"/><path d="M0 96 C60 92 110 98 184 92"/></g>`;
      if (suit === 'pentacles') bd.b += P.tree(id, 34, 180, .85, false);
      return bd;
    }
    /* 王后 / 国王 */
    const king = court === 'king';
    bd.b += `<path d="M0 186 L184 186 L184 ${PH} L0 ${PH} Z" fill="#1b1736" opacity=".6"/>`;
    bd.b += throne(id, 92, 196, king ? 1.25 : 1.1, king ? '#7a5c34' : '#5a4a5a');
    bd.b += figure(id, 92, 186, king ? 1.75 : 1.7, 'sit', { robe, arms: 'hold', crown: king, hair: king ? '#4a3a2a' : '#c9b48a', hairLong: !king });
    bd.b += inst(id, suit, 128, 150, suit === 'coin' ? 1.3 : 1.2, suit === 'swords' ? 8 : 18);
    if (!king) {
      if (suit === 'cups') bd.b += `<path d="${water(196, 2.4, 22, PW, PH)}" fill="#1a4050" opacity=".8"/>`;
      if (suit === 'pentacles') bd.b += P.tree(id, 30, 190, .9, true);
      if (suit === 'wands') bd.b += P.flame(id, 32, 178, .6, '#ffb066');
      if (suit === 'swords') bd.b += P.birds(id, 24, 120, 1);
    } else {
      bd.b += `<path d="M40 186 l-6 -10 l12 0 Z M144 186 l-6 -10 l12 0 Z" fill="url(#${id}gd)" opacity=".8"/>`;
      if (suit === 'pentacles') bd.b += P.tree(id, 26, 192, .95, true);
      if (suit === 'wands') bd.b += P.flame(id, 158, 176, .6, '#ffb066');
      if (suit === 'cups') bd.b += `<path d="${water(200, 2.2, 20, PW, PH)}" fill="#1a4050" opacity=".7"/>`;
      if (suit === 'swords') bd.b += P.birds(id, 140, 108, 1);
    }
    return bd;
  }
  /* 数字牌 2–10：一张牌一个场景（韦特式叙事），不再把符号复制 N 遍 */
  suitGround(id, suit, bd);
  bd.d += figureDefs(id, R_BY_SUIT[suit][0], R_BY_SUIT[suit][1], R_BY_SUIT[suit][2]);
  const scene = PIP_SCENE[suit] && PIP_SCENE[suit][r];
  if (scene) {
    bd.b += `<circle cx="92" cy="112" r="54" fill="url(#${id}gl)" opacity=".5"/>` + scene(id);
    return bd;
  }
  const pts = PIP_LAYOUT[r] || PIP_LAYOUT[4];
  const s = (PIP_SCALE[SUIT_KIND[suit]][r] || .8);
  bd.b += `<circle cx="${f(pts[Math.floor(pts.length / 2)][0])}" cy="${f(pts[Math.floor(pts.length / 2)][1])}" r="46" fill="url(#${id}gl)" opacity=".62"/>`;
  pts.forEach(([x, y], k) => { bd.b += inst(id, suit, x, y, s, suit === 'wands' || suit === 'swords' ? (k % 2 ? -7 : 7) : 0); });
  /* 几张关键牌加一点叙事元素 */
  if (suit === 'cups' && r === 6) bd.b += P.butterfly(id, 30, 116, .45, '#ffe9c0') + P.butterfly(id, 152, 108, .42, '#ffd0e0');
  if (suit === 'cups' && r === 10) bd.b += `<path d="M12 60 C50 30 130 30 172 60" stroke="#ffd0a0" stroke-width="3" fill="none" opacity=".55"/><path d="M22 62 C56 38 124 38 162 62" stroke="#a8e0ff" stroke-width="2" fill="none" opacity=".4"/>`;
  if (suit === 'swords' && r === 8) bd.b += figure(id, 92, 196, 1.5, 'stand', { robe: '#4a4a7a', arms: 'open', hair: '#2a1c33' });
  if (suit === 'swords' && r === 10) bd.b += figure(id, 92, 206, 1.5, 'lie', { robe: '#3a3a6a', arms: 'down', hair: '#c9b48a' });
  if (suit === 'wands' && r === 10) bd.b += figure(id, 92, 196, 1.4, 'walk', { robe: '#6a4a2a', arms: 'cross', hair: '#2a1c33' });
  if (suit === 'pentacles' && r === 10) bd.b += P.dog(id, 146, 178, 1) + P.tree(id, 34, 180, .95, false);
  if (suit === 'cups' && r === 7) bd.b += cloud(92, 60, 1.4, '#c9c2dc', .3);
  if (suit === 'pentacles' && r === 5) bd.b += `<path d="M0 168 C60 160 120 170 184 160 L184 ${PH} L0 ${PH} Z" fill="#dfefff" opacity=".14"/>`;
  return bd;
}

/* ---------------- 牌面组装 ---------------- */
/* 角花：四角各一枚卷草 + 圆点 */
function cornerFlourish(x, y, sx, sy, gid) {
  return `<g transform="translate(${x} ${y}) scale(${sx} ${sy})">
    <path d="M0 18 C0 8.5 8.5 0 18 0" fill="none" stroke="url(#${gid}gd)" stroke-width="1.1" stroke-opacity=".85"/>
    <path d="M4.5 26 C4.5 15 15 4.5 26 4.5" fill="none" stroke="url(#${gid}gd)" stroke-width=".7" stroke-opacity=".4"/>
    <path d="M6 0 L11 0 M0 6 L0 11" stroke="url(#${gid}gd)" stroke-width=".8" stroke-opacity=".7"/>
    <circle cx="3.2" cy="3.2" r="1.5" fill="url(#${gid}gd)"/>
  </g>`;
}
/* 牌面插画层：AI 绘制的成图（assets/cards/<ci>.webp）铺满整张牌面。
   图上没有任何文字 —— 牌名/罗马数字/金框仍由本文件叠在上面。
   图不存在时这一层不画东西，被它盖住的矢量场景就自然成为兜底。 */
const ART_VER = 78;
/* 牌面图地址（唯一来源）：app.js 的预取和这里的 <image> 都用它 */
export const cardArtURL = (idx) => `assets/cards/${String(idx).padStart(2, '0')}.webp?v=${ART_VER}`;
function artImage(idx) {
  const src = cardArtURL(idx);
  return `<image class="art" x="0" y="0" width="220" height="340" preserveAspectRatio="xMidYMid slice" href="${src}" xlink:href="${src}"/>`;
}

export function cardFrontSVG(card, idx) {
  const id = 'c' + idx + 'x';
  const hue = card.hue != null ? card.hue : 210;
  const acc = `hsl(${f(hue)} 78% 68%)`, accDim = `hsl(${f(hue)} 58% 46%)`;
  const sc = card.minor ? minorScene(card, id) : majorScene(idx, id, hue);
  const suitSigil = card.minor ? `<g opacity=".9" transform="translate(30 32) scale(.34)">${inst(id, card.suit, 0, 0, 1)}</g>` : '';
  return `<svg viewBox="0 0 220 340" class="face-svg" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${lgDef(id + 'bg', [[0, '#08081a'], [.52, '#13102f'], [1, '#1b1039']])}
    ${rgDef(id + 'halo', [[0, '#ffe0ab', .18], [.34, acc, .12], [1, '#000', 0]])}
    ${rgDef(id + 'vig', [[0, '#000', 0], [.62, '#000', .12], [1, '#000', .55]])}
    ${lgDef(id + 'top', [[0, '#fff', .1], [1, '#fff', 0]])}
    ${lgDef(id + 'shade', [[0, '#000', 0], [1, '#000', .34]])}
    ${lgDef(id + 'gold', [[0, '#f8ecca'], [.42, '#dcb268'], [1, '#8e6a2c']])}
    ${lgDef(id + 'acg', [[0, acc, .95], [1, accDim, .5]])}
    ${sc.d}
  </defs>
  <rect x="0" y="0" width="220" height="340" rx="13" fill="url(#${id}bg)"/>
  <rect x="0" y="0" width="220" height="340" rx="13" fill="url(#${id}halo)"/>
  <clipPath id="${id}clip"><rect x="18" y="16" width="184" height="230" rx="7"/></clipPath>
  <g clip-path="url(#${id}clip)">
    ${sc.b}
    <rect x="18" y="16" width="184" height="230" fill="url(#${id}vig)" opacity=".8"/>
    <rect x="18" y="16" width="184" height="230" fill="url(#${id}top)" opacity=".7"/>
  </g>
  ${artImage(idx)}
  <rect x="18" y="16" width="184" height="230" rx="7" fill="none" stroke="url(#${id}gold)" stroke-width="1.1" stroke-opacity=".85"/>
  <rect x="21" y="19" width="178" height="224" rx="5" fill="none" stroke="url(#${id}acg)" stroke-width=".5" stroke-opacity=".32" stroke-dasharray="1 5"/>
  ${suitSigil}
  <g class="orn">
    <rect x="6.5" y="6.5" width="207" height="327" rx="10" fill="none" stroke="url(#${id}gold)" stroke-width="1.1"/>
    <rect x="11" y="11" width="198" height="318" rx="7" fill="none" stroke="url(#${id}gold)" stroke-width=".45" stroke-opacity=".5"/>
    ${cornerFlourish(17, 17, 1, 1, id)}${cornerFlourish(203, 17, -1, 1, id)}${cornerFlourish(17, 323, 1, -1, id)}${cornerFlourish(203, 323, -1, -1, id)}
  </g>
  <rect x="0" y="240" width="220" height="100" fill="url(#${id}shade)" opacity=".45"/>
  <g class="plate">
    <rect x="74" y="18" width="72" height="22" rx="11" fill="rgba(8,6,20,.55)"/>
    <rect x="74" y="18" width="72" height="22" rx="11" fill="none" stroke="url(#${id}gold)" stroke-width=".6" stroke-opacity=".7"/>
    <path d="M64 29 l4 3.2 l-4 3.2 l-4 -3.2 z" fill="url(#${id}acg)"/>
    <path d="M156 29 l4 3.2 l-4 3.2 l-4 -3.2 z" fill="url(#${id}acg)"/>
    <text x="110" y="34.5" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="13" letter-spacing="1.4" fill="url(#${id}gold)">${ROMAN[idx]}</text>
  </g>
  <g class="plate">
    <text x="110" y="266" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="7" letter-spacing=".14em" fill="#c9b892">${(card.keys || []).join(' · ')}</text>
    <path d="M44 275 L98 275 M122 275 L176 275" stroke="url(#${id}gold)" stroke-width=".55" stroke-opacity=".4"/>
    <path d="M110 271.5 l3.6 3.5 l-3.6 3.5 l-3.6 -3.5 z" fill="url(#${id}acg)"/>
    <rect x="30" y="283" width="160" height="42" rx="8" fill="rgba(8,6,20,.5)"/>
    <rect x="30" y="283" width="160" height="42" rx="8" fill="none" stroke="url(#${id}gold)" stroke-width=".5" stroke-opacity=".5"/>
    <path d="M35.5 289 L35.5 295 M35.5 289 L41.5 289" fill="none" stroke="url(#${id}acg)" stroke-width=".9" stroke-opacity=".6"/>
    <path d="M184.5 318 L184.5 312 M184.5 318 L178.5 318" fill="none" stroke="url(#${id}acg)" stroke-width=".9" stroke-opacity=".6"/>
    <text x="110" y="305" text-anchor="middle" font-family="'Songti SC','STSong','Noto Serif SC','Source Han Serif SC',SimSun,serif" font-size="19" letter-spacing="${card.zh.length > 4 ? 2 : 4.2}" fill="#ecdfc0">${card.zh}</text>
    <text x="110" y="318" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="6.6" letter-spacing=".16em" fill="#c2ad84">${card.en}</text>
  </g>
  </svg>`;
}

/* ---------- 牌背：对称蝶翼 + 菱格 + 蓝粉辉光 ----------
   78 张牌背完全相同 → 用一个共享 <symbol>，页面里注入一次，每张牌只用 <use> 引用，
   省掉 78 份重复节点（这是 78 张牌能跑顺的关键之一）。 */
export function cardBackDefs() {
  const cx = 110, cy = 170;
  let lattice = '';
  for (let y = 46; y < 320; y += 26) for (let x = 34; x < 195; x += 26) {
    lattice += `<path d="${starPath(x + ((y / 26 | 0) % 2 ? 13 : 0), y, 6, 4, .32)}" fill="none" stroke="#c8b489" stroke-width=".5" stroke-opacity=".34"/>`;
  }
  return `<svg width="0" height="0" style="position:absolute;left:-9999px" aria-hidden="true"><defs>
    <linearGradient id="tbG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1030"/><stop offset="42%" stop-color="#1b1449"/><stop offset="100%" stop-color="#2a1246"/>
    </linearGradient>
    <radialGradient id="tbB1" cx="30%" cy="26%" r="60%"><stop offset="0%" stop-color="#6fe0ff" stop-opacity=".34"/><stop offset="100%" stop-color="#6fe0ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="tbB2" cx="74%" cy="76%" r="62%"><stop offset="0%" stop-color="#ff8fd0" stop-opacity=".32"/><stop offset="100%" stop-color="#ff8fd0" stop-opacity="0"/></radialGradient>
    <linearGradient id="tbGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f7e6bb"/><stop offset="50%" stop-color="#d3ab63"/><stop offset="100%" stop-color="#8a6628"/></linearGradient>
    <symbol id="taroBack" viewBox="0 0 220 340">
      <rect width="220" height="340" rx="13" fill="url(#tbG)"/>
      <rect width="220" height="340" rx="13" fill="url(#tbB1)"/>
      <rect width="220" height="340" rx="13" fill="url(#tbB2)"/>
      ${lattice}
      <rect x="7.5" y="7.5" width="205" height="325" rx="9" fill="none" stroke="url(#tbGold)" stroke-width="1.1"/>
      <rect x="14" y="14" width="192" height="312" rx="6" fill="none" stroke="url(#tbGold)" stroke-width=".5" stroke-opacity=".6"/>
      <g fill="none" stroke="url(#tbGold)" stroke-width="1.3" stroke-linecap="round">
        <path d="M${cx} ${cy - 26} C${cx - 32} ${cy - 76} ${cx - 70} ${cy - 58} ${cx - 58} ${cy - 18} C${cx - 50} ${cy + 6} ${cx - 22} ${cy + 2} ${cx} ${cy + 10} Z"/>
        <path d="M${cx} ${cy - 26} C${cx + 32} ${cy - 76} ${cx + 70} ${cy - 58} ${cx + 58} ${cy - 18} C${cx + 50} ${cy + 6} ${cx + 22} ${cy + 2} ${cx} ${cy + 10} Z"/>
        <path d="M${cx - 2} ${cy + 16} C${cx - 26} ${cy + 10} ${cx - 52} ${cy + 34} ${cx - 38} ${cy + 60} C${cx - 24} ${cy + 82} ${cx - 6} ${cy + 56} ${cx - 1} ${cy + 42} Z"/>
        <path d="M${cx + 2} ${cy + 16} C${cx + 26} ${cy + 10} ${cx + 52} ${cy + 34} ${cx + 38} ${cy + 60} C${cx + 24} ${cy + 82} ${cx + 6} ${cy + 56} ${cx + 1} ${cy + 42} Z"/>
        <ellipse cx="${cx}" cy="${cy + 8}" rx="3.4" ry="36" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy - 32}" r="4.2" stroke-width="1"/>
        <path d="M${cx - 3} ${cy - 35} C${cx - 12} ${cy - 54} ${cx - 20} ${cy - 62} ${cx - 31} ${cy - 68}" stroke-width=".9"/>
        <path d="M${cx + 3} ${cy - 35} C${cx + 12} ${cy - 54} ${cx + 20} ${cy - 62} ${cx + 31} ${cy - 68}" stroke-width=".9"/>
        <path d="M${cx - 6} ${cy - 14} C${cx - 22} ${cy - 30} ${cx - 34} ${cy - 30} ${cx - 44} ${cy - 34}" stroke-width=".6" stroke-opacity=".7"/>
        <path d="M${cx + 6} ${cy - 14} C${cx + 22} ${cy - 30} ${cx + 34} ${cy - 30} ${cx + 44} ${cy - 34}" stroke-width=".6" stroke-opacity=".7"/>
        <circle cx="${cx - 31}" cy="${cy - 68}" r="2.4" fill="url(#tbGold)" stroke="none"/>
        <circle cx="${cx + 31}" cy="${cy - 68}" r="2.4" fill="url(#tbGold)" stroke="none"/>
        <path d="M${cx} ${cy - 34} L${cx} ${cy + 40}" stroke-width=".8" stroke-opacity=".8"/>
        <path d="M${cx} ${cy - 34} L${cx - 16} ${cy - 52} M${cx} ${cy - 34} L${cx + 16} ${cy - 52}" stroke-width=".8"/>
        <path d="M${cx - 36} ${cy + 8} C${cx - 22} ${cy - 6} ${cx - 10} ${cy - 12} ${cx - 4} ${cy - 16} M${cx + 36} ${cy + 8} C${cx + 22} ${cy - 6} ${cx + 10} ${cy - 12} ${cx + 4} ${cy - 16}" stroke-width=".7" stroke-opacity=".75"/>
        <circle cx="${cx}" cy="${cy - 6}" r="9" stroke-width=".9"/>
      </g>
      <circle cx="${cx}" cy="${cy - 6}" r="72" fill="none" stroke="url(#tbGold)" stroke-width=".5" stroke-opacity=".4" stroke-dasharray="2 6"/>
      <path d="M62 44 L158 44 M62 296 L158 296" stroke="url(#tbGold)" stroke-width=".6" stroke-opacity=".5"/>
      <path d="${starPath(110, 30, 7, 6, .34)}" fill="url(#tbGold)"/>
      <path d="${starPath(110, 310, 7, 6, .34)}" fill="url(#tbGold)"/>
    </symbol>
  </defs></svg>`;
}
export function cardBackSVG() {
  return `<svg viewBox="0 0 220 340" class="face-svg"><use href="#taroBack" xlink:href="#taroBack"/></svg>`;
}
