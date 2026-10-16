/* 解读引擎：把一次抽取（单张 / 多张 / 牌阵）变成一份完整解读
   —— 逐张牌义（含牌位含义）→ 分场景（学业/事业/感情/社交/财运/健康）→ 总结（注意什么 / 怎么做）→ 赠言
   全部离线本地生成，不调用任何网络接口。 */
import { CARDS, ROMAN, cardFrontSVG } from './art.js?v=82';
import { SPREAD_BY_ID, SCENES } from './spreads.js?v=82';
import { MEANINGS } from './meanings.js?v=82';

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const M = (ci) => MEANINGS[ci] || { u: '', r: '', core: '', s: {} };

/* 牌位：把一次抽取里的每张牌配上它的位置与读法 */
export function positions(session) {
  const sp = session.free ? null : SPREAD_BY_ID[session.spreadId];
  return session.cards.map((c, k) => {
    const slot = (sp && sp.slots[c.slot != null ? c.slot : k]) || { n: session.free ? '这一张' : `第 ${k + 1} 张`, m: '' };
    const card = CARDS[c.ci], m = M(c.ci);
    const s = m.s || {};
    return {
      k, ci: c.ci, rev: !!c.rev, card, m, slot,
      pos: c.rev ? '逆位' : '正位',
      keys: (c.rev ? m.r : m.u) || (card.keys || []).join(' · '),
      line: c.rev ? card.rev : card.up,
      roman: ROMAN[c.ci] || ''
    };
  });
}

/* 单张牌在某个场景里的一句话（按正逆位取） */
export function sceneLine(ci, rev, sceneId) {
  const s = (M(ci).s || {})[sceneId];
  if (!s) return '';
  return rev ? (s[1] || s[0] || '') : (s[0] || '');
}

function toneOf(ups, revs) {
  if (revs === 0) return { k: 'good', n: '整体顺流', d: '牌面全是正位，能量是通的，可以往前走。' };
  if (revs === 1 && ups >= 1) return { k: 'ok', n: '大体顺，一处要留意', d: '只有一张逆位，它是提醒而不是判决。' };
  if (revs >= ups) return { k: 'tight', n: '阻力偏多，先处理再看', d: '逆位占了一半以上，先把卡住的地方解决掉，别的才动得起来。' };
  return { k: 'ok', n: '有机会，但要绕一下', d: '正逆参半，方向没问题，节奏要慢一点。' };
}

/* 场景汇总：每张牌在该场景各说一句，再给一句小结 */
export function sceneBlocks(session) {
  const ps = positions(session);
  return SCENES.map(sc => {
    const lines = ps.map(p => ({ p, t: sceneLine(p.ci, p.rev, sc.id) })).filter(x => x.t);
    const ups = lines.filter(x => !x.p.rev).length, revs = lines.filter(x => x.p.rev).length;
    let note = '';
    if (lines.length) {
      if (revs === 0) note = '整块都在正位上——这件事可以放心投入。';
      else if (revs >= Math.max(1, Math.ceil(lines.length / 2))) note = '这一块逆位集中，先解决阻力，别硬冲。';
      else note = '这块大体可以，个别地方要绕开。';
    }
    return { sc, lines, ups, revs, note };
  }).filter(b => b.lines.length);
}

const HEAVY = { 13: '「结束」出现了——有一件事该收尾了，不是坏事。', 15: '「恶魔」出现了——留意依赖与上瘾式的投入，能松手就先松一点。', 16: '「塔」出现了——会有一次突然的动摇，提前留好缓冲（时间、钱、情绪）。', 18: '「月亮」出现了——现在信息不全，别在雾里做大决定。' };

/* 总结：注意什么 + 怎么做 */
export function summary(session) {
  const ps = positions(session);
  const ups = ps.filter(p => !p.rev), revs = ps.filter(p => p.rev);

  const watch = [];
  const blockSlot = ps.find(p => /阻碍|障碍|阻力/.test(p.slot.n));
  if (blockSlot) watch.push(`「${blockSlot.slot.n}」位上的是 ${esc(blockSlot.card.zh)}·${blockSlot.pos}：${blockSlot.rev ? (M(blockSlot.ci).s.career[1] || '这块阻力需要你先动手处理') : '这里的阻力不大，可以借力往前'}。`);
  const outcome = ps.find(p => /结果|趋势|走向|未来|落/.test(p.slot.n));
  if (revs.length) watch.push(`逆位出现在 ${revs.map(p => `${p.card.zh}（${p.slot.n}）`).join('、')} —— 逆位不是"坏牌"，是告诉你要先调整的地方。`);
  else {
    watch.push('这一局没有逆位——相对少见，说明时机和心态都在你这边。');
    watch.push(`顺风时最容易过头：把节奏放稳，别把好运当成实力；${outcome ? `落点「${outcome.slot.n}」也提醒你——${outcome.line}` : '先在现实里验证一次，再决定要不要加码'}。`);
  }
  if (outcome && !blockSlot) watch.push(`留意「${outcome.slot.n}」这一格：${outcome.card.zh}·${outcome.pos}，${outcome.rev ? '这里需要你先动手，结果才会松动' : '这是你最后会站上的位置，方向和它一致就别偏航'}。`);
  ps.forEach(p => { if (HEAVY[p.ci]) watch.push(HEAVY[p.ci]); });
  const heavyScene = sceneBlocks(session).filter(b => b.revs >= Math.max(1, Math.ceil(b.lines.length / 2))).map(b => b.sc.n);
  if (heavyScene.length) watch.push(`场景里 ${heavyScene.join('、')} 这几块阻力最集中，别同时开战。`);

  const doList = [];
  const adviseSlot = ps.find(p => /建言|建议|指引/.test(p.slot.n));
  if (adviseSlot) doList.push(`按「${adviseSlot.slot.n}」位给的指引走：${sceneLine(adviseSlot.ci, adviseSlot.rev, 'career') || adviseSlot.line}。`);
  ups.slice(0, 2).forEach(p => doList.push(`把 ${p.card.zh} 的能量用出来：${sceneLine(p.ci, false, 'study') || p.line}。`));
  const last = ps[ps.length - 1];
  if (last && !adviseSlot) doList.push(`最后落点看「${last.slot.n}」：${last.line}。`);
  doList.push('先做一件 15 分钟内能完成的小事（发一条消息、写三行计划、整理一次桌面）——把牌面给的方向落到地上。');

  if (watch.length < 2) watch.push('正位与逆位都只是提示，不是判决——先花一周观察现实里的信号，再决定要不要加码。');
  const sig = (ps.find(p => /结果|结局|趋势|落/.test(p.slot.n)) || last || ps[0]);
  return { tone: toneOf(ups.length, revs.length), watch: watch.slice(0, 4), doList: doList.slice(0, 4), gift: sig ? `${sig.card.zh}：${sig.line}` : '' };
}

/* 渲染成面板 HTML */
export function renderReading(session, opt = {}) {
  const ps = positions(session);
  const sp = session.free ? null : SPREAD_BY_ID[session.spreadId];
  const when = new Date(session.at || Date.now());
  const timestr = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, '0')}-${String(when.getDate()).padStart(2, '0')} ${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`;

  const mini = ps.length >= 9 ? 76 : ps.length >= 7 ? 90 : ps.length >= 5 ? 104 : 118;   // 张数越多，牌面越小，保证整张牌阵不进滚动
  const board = sp ? `<div class="rd-board" data-sp="${sp.id}" style="--gc:${sp.cols || 3};--mini:${mini}px">${ps.map(p => `
      <div class="rd-slot${p.rev ? ' rev' : ''}${p.slot.cross ? ' cross' : ''}" style="grid-column:${p.slot.c};grid-row:${p.slot.r}">
        <div class="rd-slot-n">${esc(p.slot.n)}</div>
        <div class="rd-mini">${cardFrontSVG(p.card, p.ci)}</div>
        <div class="rd-slot-c">${esc(p.card.zh)} · ${p.pos}</div>
      </div>`).join('')}</div>` : '';

  const perCard = ps.map(p => `
    <div class="rd-card">
      <div class="rd-c-head">
        <span class="rd-c-slot">${esc(p.slot.n)}</span>
        <span class="rd-c-name">${esc(p.card.zh)}<i>${esc(p.card.en || '')}</i></span>
        <span class="rd-c-pos ${p.rev ? 'rev' : ''}">${p.pos}</span>
      </div>
      <div class="rd-c-kw">${esc(p.keys)}</div>
      ${p.slot.m ? `<div class="rd-c-slotm">位置含义：${esc(p.slot.m)}</div>` : ''}
      <div class="rd-c-line">「${esc(p.line)}」</div>
      <div class="rd-c-core">${esc((p.rev && p.m.coreR) ? p.m.coreR : (p.m.core || ''))}</div>
      <div class="rd-c-scenes">${SCENES.map(sc => { const t = sceneLine(p.ci, p.rev, sc.id); return t ? `<span><b>${sc.n}</b>${esc(t)}</span>` : ''; }).join('')}</div>
    </div>`).join('');

  const blocks = sceneBlocks(session).map(b => `
    <div class="rd-scene">
      <div class="rd-scene-h"><span class="rd-scene-ic">${b.sc.ic}</span><b>${b.sc.n}</b><i>${esc(b.sc.hint)}</i></div>
      <ul>${b.lines.map(x => `<li><b>${esc(x.p.card.zh)}${x.p.rev ? '·逆' : ''}</b>${esc(x.t)}</li>`).join('')}</ul>
      <div class="rd-scene-note">${b.note}</div>
    </div>`).join('');

  const sm = summary(session);
  return `
    <div class="rd-scroll">
      <div class="rd-head">
        <div class="rd-spread">${esc(session.free ? '自由抽牌' : (sp ? sp.name : '解读'))}<i>${ps.length} 张</i></div>
        <div class="rd-time">${timestr}</div>
      </div>
      ${board}
      <div class="rd-sec"><h3><span>一</span>逐张解读</h3>${perCard}</div>
      ${blocks ? `<div class="rd-sec"><h3><span>二</span>分场景解读</h3>${blocks}</div>` : ''}
      <div class="rd-sec">
        <h3><span>三</span>总结</h3>
        <div class="rd-tone ${sm.tone.k}"><b>${sm.tone.n}</b>${esc(sm.tone.d)}</div>
        <div class="rd-sum"><b>该注意什么</b><ul>${sm.watch.map(t => `<li>${t}</li>`).join('')}</ul></div>
        <div class="rd-sum"><b>该怎么做</b><ul>${sm.doList.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
        ${sm.gift ? `<div class="rd-gift">${esc(sm.gift)}</div>` : ''}
      </div>
    </div>
    <div class="rd-acts">
      <button class="btn" id="rdAgain">再抽一次</button>
      <button class="btn ghost" id="rdCopy">复制解读</button>
      <button class="btn ghost" id="rdSave">${opt.saved ? '已记录' : '保存记录'}</button>
      <button class="btn ghost" id="rdClose">收好</button>
    </div>`;
}

/* 纯文本版（复制到微信/备忘录用） */
export function readingText(session) {
  const ps = positions(session);
  const sp = session.free ? null : SPREAD_BY_ID[session.spreadId];
  const sm = summary(session);
  const L = [];
  L.push(`【手势塔罗】${session.free ? '自由抽牌' : (sp ? sp.name : '')} · ${ps.length} 张`);
  L.push('');
  ps.forEach(p => L.push(`${p.slot.n}｜${p.card.zh}（${p.pos}）${p.keys}\n  ${p.line}${p.slot.m ? '\n  位置含义：' + p.slot.m : ''}`));
  L.push('', '—— 分场景 ——');
  sceneBlocks(session).forEach(b => {
    L.push(`${b.sc.n}：`);
    b.lines.forEach(x => L.push(`  · ${x.p.card.zh}${x.p.rev ? '(逆)' : ''}：${x.t}`));
    L.push(`  小结：${b.note}`);
  });
  L.push('', `—— 总结 ——`, `整体：${sm.tone.n}。${sm.tone.d}`);
  L.push('该注意什么：');
  sm.watch.forEach(t => L.push(`  · ${t.replace(/<[^>]+>/g, '')}`));
  L.push('该怎么做：');
  sm.doList.forEach(t => L.push(`  · ${t}`));
  if (sm.gift) L.push('', `赠言 —— ${sm.gift}`);
  return L.join('\n');
}
