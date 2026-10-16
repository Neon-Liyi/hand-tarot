/* 抽取记录：存在浏览器本地（localStorage），关掉网页也还在。
   best-effort：无痕模式或存储被封时静默降级，不影响抽卡。 */
import { CARDS, cardFrontSVG } from './art.js?v=82';
import { SPREAD_BY_ID } from './spreads.js?v=82';

const KEY = 'taro.history.v1';
const MAX = 80;

export function load() {
  try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; }
  catch { return []; }
}
function persist(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); return true; } catch { return false; }
}
export function save(session) {
  const rec = {
    id: 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    at: session.at || Date.now(),
    spreadId: session.spreadId, free: !!session.free,
    spreadName: session.free ? '自由抽牌' : ((SPREAD_BY_ID[session.spreadId] || {}).name || '抽牌'),
    cards: session.cards.map(c => ({ ci: c.ci, rev: !!c.rev, slot: c.slot }))
  };
  const list = [rec, ...load()];
  persist(list);
  return rec;
}
export function remove(id) { const l = load().filter(r => r.id !== id); persist(l); return l; }
export function clear() { persist([]); return []; }
export const cardLine = (rec) => rec.cards.map(c => `${(CARDS[c.ci] || {}).zh || '?'}${c.rev ? '逆' : '正'}`).join(' · ');
export const count = () => load().length;

const fmtTime = (ms) => {
  const d = new Date(ms), p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* 记录里的牌面布局：牌阵按每个槽的 c/r 摆回同样的形状；自由抽牌横向排开 */
function boardHTML(rec) {
  const sp = rec.free ? null : SPREAD_BY_ID[rec.spreadId];
  const n = rec.cards.length || 1;
  const mini = n >= 9 ? 44 : n >= 7 ? 50 : n >= 5 ? 58 : 66;      // 张数越多缩得越小，整盘不进滚动
  const cols = sp ? Math.max(1, sp.cols || 3) : Math.min(n, 5);
  return `<div class="hs-board" style="--cols:${cols};--mini:${mini}px">` + rec.cards.map((c, k) => {
    const sl = (sp && sp.slots[c.slot != null ? c.slot : k]) || { n: rec.free ? '这一张' : `第 ${k + 1} 张` };
    const cell = sp
      ? `grid-column:${sl.c || 1};grid-row:${sl.r || 1}`
      : `grid-column:${(k % cols) + 1};grid-row:${Math.floor(k / cols) + 1}`;
    const card = CARDS[c.ci] || CARDS[0];
    return `<div class="hs-slot${c.rev ? ' rev' : ''}${sl.cross ? ' cross' : ''}" style="${cell}">
      <div class="hs-face">${cardFrontSVG(card, c.ci || 0)}</div>
      <div class="hs-sn">${esc(sl.n)}</div>
      <div class="hs-cc">${esc(card.zh)} · ${c.rev ? '逆' : '正'}</div>
    </div>`;
  }).join('') + '</div>';
}

/* 记录列表 —— 每条能直接看到抽到的牌面（牌阵还带摆放位置），可"查看"重看解读或"删除" */
export function renderList() {
  const list = load();
  if (!list.length) return `<div class="hs-empty">还没有记录。<br><span>抽完一次牌，这里就会留下它。</span></div>`;
  return list.map(r => `
    <div class="hs-item" data-id="${r.id}">
      <div class="hs-main">
        <div class="hs-top"><b>${esc(r.spreadName)}</b><span class="hs-n">${r.cards.length} 张</span><span class="hs-time">${fmtTime(r.at)}</span></div>
        ${boardHTML(r)}
      </div>
      <div class="hs-acts">
        <button class="hs-open" data-open="${r.id}">查看</button>
        <button class="hs-del" data-del="${r.id}" title="删除这条">✕</button>
      </div>
    </div>`).join('');
}
