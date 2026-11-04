/* LEGENDS XI — Guess the Legend. Created by Dr HOSSAM Mo */
(function () {
'use strict';
const LX = window.LX, D = LX.D, S = LX.S, esc = LX.esc, I = LX.I;

const BIG = new Set(['RMA', 'BAR', 'MUN', 'LIV', 'MIL', 'INT', 'JUV', 'BAY', 'ARS', 'CHE', 'PSG', 'AJA', 'BVB', 'ATM', 'MCI']);
LX.CATS = [
  ['mix', 'متنوع'], ['career', 'المسيرة'], ['nat', 'الجنسية'], ['pos', 'المركز'], ['clubs', 'الأندية'],
  ['mates', 'الزملاء'], ['shirt', 'رقم القميص'], ['hon', 'الإنجازات'], ['photo', 'الصورة'], ['squad', 'التشكيلة التاريخية']
];
const yr = p => p.b ? +p.b.slice(0, 4) : null;

/** all clue facts for a player */
function facts(p, r) {
  const F = [];
  const nat = LX.natName(p);
  F.push({ c: 'nat', g: 'nat', x: `جنسيته: ${nat}`, t: q => q.nat === p.nat });
  F.push({ c: 'pos', g: 'pos', x: `مركزه الأساسي: ${LX.POSAR[LX.posGroup(p.pos)]}`, t: q => LX.posGroup(q.pos) === LX.posGroup(p.pos) });
  F.push({ c: 'pos', g: 'pos', x: `يلعب غالبًا في مركز: ${LX.POSDETAIL[p.pos] || p.pos}`, t: q => q.pos === p.pos, w: 1 });
  p.cl.forEach((c, i) => {
    const tn = LX.teamName(c[0]);
    F.push({ c: 'clubs', g: 'c' + c[0], x: `لعب لنادي ${tn}`, t: q => q.cl.some(z => z[0] === c[0]), big: BIG.has(c[0]) });
    F.push({ c: 'career', g: 'c' + c[0], x: `لعب لـ${tn} في الفترة ${LX.span(c[1], Math.min(c[2], LX.NOW))}`, t: q => q.cl.some(z => z[0] === c[0] && Math.min(z[2], c[2]) - Math.max(z[1], c[1]) >= 1) });
    const nx = p.cl[i + 1];
    if (nx && nx[0] !== c[0]) F.push({ c: 'career', x: `انتقل من ${tn} إلى ${LX.teamName(nx[0])}${Math.abs(nx[1] - c[2]) <= 1 ? ` عام ${nx[1]}` : ''}`, t: q => q.cl.some((z, k) => z[0] === c[0] && q.cl.slice(k + 1).some(w => w[0] === nx[0])) });
  });
  if (p.cl.length >= 2) F.push({ c: 'career', x: `مثّل ${new Set(p.cl.map(c => c[0])).size} أندية في مسيرته المسجلة`, t: q => new Set(q.cl.map(c => c[0])).size === new Set(p.cl.map(c => c[0])).size, w: 1 });
  const hon = {}; p.h.forEach(([k, y]) => (hon[k] = hon[k] || []).push(y));
  Object.entries(hon).forEach(([k, ys]) => {
    F.push({ c: 'hon', g: 'h' + k, x: `فاز بـ${LX.HONAR[k]}${ys.length > 1 ? ` ${ys.length} مرات` : ''}`, t: q => q.h.filter(h => h[0] === k).length === ys.length });
    const y = LX.pick(ys, r);
    F.push({ c: 'hon', g: 'h' + k, x: `توّج بـ${LX.HONAR[k]} عام ${y}`, t: q => q.h.some(h => h[0] === k && h[1] === y) });
  });
  if (p.nt) F.push({ c: 'nat', g: 'nat', x: `لعب دوليًا مع ${nat} منذ ${p.nt[0]}`, t: q => q.nat === p.nat && q.nt && Math.abs(q.nt[0] - p.nt[0]) <= 1 });
  if (yr(p)) F.push({ c: 'career', x: `وُلد عام ${yr(p)}`, t: q => yr(q) === yr(p) });
  if (p.yr) F.push({ c: 'career', x: `جيله: نشط بين ${p.yr[0]} و${Math.min(p.yr[1], LX.NOW) >= LX.NOW ? 'اليوم' : p.yr[1]}`, t: q => q.yr && Math.abs(q.yr[0] - p.yr[0]) <= 2, w: 1 });
  // teammates (prefer famous ones)
  const mates = (LX.ADJ[p.id] || []).map(([id, ev]) => ({ m: LX.P(id), ev: LX.bestEv(ev) })).filter(o => o.m.t <= 2);
  LX.shuffle(mates, r).slice(0, 4).forEach(o => {
    F.push({ c: 'mates', x: `زامل ${o.m.ar} في ${LX.teamName(o.ev.t)}`, t: q => { const ev = LX.evidence(q.id, o.m.id); return !!ev && ev.some(e => e.t === o.ev.t); } });
  });
  // shirt numbers & squads
  (LX.squadsOf[p.id] || []).forEach(s => {
    const x = s.p.find(z => z[2] === p.id);
    if (x[0] != null) F.push({ c: 'shirt', x: `ارتدى القميص رقم ${x[0]} مع ${LX.teamName(s.team)} في ${s.comp}`, t: q => s.p.some(z => z[2] === q.id && z[0] === x[0]) });
    F.push({ c: 'squad', x: `كان ضمن تشكيلة ${LX.teamName(s.team)} في ${s.comp}`, t: q => s.p.some(z => z[2] === q.id) });
  });
  return F;
}
const POOLMAP = { 1: [1], 2: [2, 1], 3: [3, 2], 4: [4, 3] };
/** Build a question. opts {diff, cat, era, r (rng), pool (array of ids), recent:Set} */
LX.makeQuestion = (opts) => {
  const r = opts.r || Math.random, d = LX.diff(opts.diff);
  const era = opts.era || LX.era();
  let base = (opts.pool ? opts.pool.map(LX.P) : LX.allPlayers).filter(p => p.cl.length && !p.pa);
  if (!opts.pool) base = base.filter(p => LX.inEra(p, era));
  const tiers = POOLMAP[d.id];
  let pool = opts.pool ? base : base.filter(p => tiers.includes(p.t));
  if (opts.cat === 'shirt' || opts.cat === 'squad') pool = pool.filter(p => (LX.squadsOf[p.id] || []).length);
  if (opts.cat === 'hon') pool = pool.filter(p => p.h.length);
  if (pool.length < 4) pool = base;
  const recent = opts.recent || new Set();
  const fresh = pool.filter(p => !recent.has(p.id)); if (fresh.length >= 3) pool = fresh;
  // weight by primary tier for this difficulty
  for (let tries = 0; tries < 40; tries++) {
    let p = LX.pick(pool, r);
    if (!opts.pool && p.t !== tiers[0] && r() < .5) p = LX.pick(pool, r);
    let F = facts(p, r);
    if (opts.cat && opts.cat !== 'mix' && opts.cat !== 'photo') {
      const pref = F.filter(f => f.c === opts.cat); if (!pref.length) continue;
    }
    // medium: avoid obscure-only facts; legendary: avoid giveaway facts (BDO, WC)
    if (d.id === 4) F = F.filter(f => !/الكرة الذهبية|كأس العالم/.test(f.x));
    const N = d.clues;
    const cand = list => LX.allPlayers.filter(q => list.every(f => f.t(q)));
    let chosen = [];
    if (opts.cat && opts.cat !== 'mix' && opts.cat !== 'photo') {
      const pref = LX.shuffle(F.filter(f => f.c === opts.cat), r)[0]; chosen.push(pref);
    }
    if (d.id === 1) { const nf = F.find(f => f.c === 'nat'); if (nf && !chosen.includes(nf)) chosen.push(nf); }
    if (d.id <= 2) { const big = F.find(f => f.big); if (big && !chosen.includes(big) && chosen.length < N) chosen.push(big); }
    let C = cand(chosen.length ? chosen : [F[0]]);
    while (chosen.length < N) {
      const used = new Set(chosen.map(f => f.g).filter(Boolean));
      const rest = F.filter(f => !chosen.includes(f) && !(f.g && used.has(f.g)));
      if (!rest.length) break;
      // pick the fact that narrows the field the most, with some variety
      const scored = LX.shuffle(rest, r).map(f => [C.filter(q => f.t(q)).length, f]).sort((a, b) => a[0] - b[0]);
      const k = (C.length > 1) ? 0 : Math.min(scored.length - 1, Math.floor(r() * scored.length));
      const f = scored[k][1]; chosen.push(f); C = C.filter(q => f.t(q));
    }
    if (C.length !== 1 || C[0].id !== p.id) continue;
    // order: vaguest first
    chosen = chosen.map(f => [LX.allPlayers.filter(q => f.t(q)).length, f]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
    const extras = LX.shuffle(F.filter(f => !chosen.includes(f)), r).slice(0, 4);
    return { p, clues: chosen.map(f => f.x), extras: extras.map(f => f.x), photo: opts.cat === 'photo' };
  }
  return null;
};

/* ---------------- setup screen */
LX.route(/^\/guess$/, root => {
  const cur = S.get('gdiff', 1), cat = S.get('gcat', 'mix'), prac = S.get('gprac', false);
  const main = LX.page(root, { title: 'خمن اللاعب', gen: true }, `
    <div class="card" style="text-align:center"><div style="font-size:30px;font-weight:900">مين اللاعب ده؟</div><div class="muted" style="font-size:13px">أدلة حقيقية من مسيرات موثقة · 3 فرص قبل نهاية الجولة</div></div>
    <div class="section-t">اختر المستوى</div>
    <div class="diffs">${LX.DIFFS.map(d => `<button class="diff ${d.cls} ${d.id === cur ? 'on' : ''}" data-d="${d.id}"><span class="lv">LEVEL ${d.id} · ${d.en}</span><span class="t">${d.ar}</span><span class="d">${d.d} ${d.clues} أدلة.</span><span class="pts"><span>حتى <b>${d.pts}</b> نقطة</span><span>أفضل: <b>${LX.best('g' + d.id)}</b></span></span></button>`).join('')}</div>
    <div class="section-t">نوع الأسئلة</div>
    <div class="gens" id="cats">${LX.CATS.map(([k, l]) => `<button class="gen ${k === cat ? 'on' : ''}" data-c="${k}">${l}</button>`).join('')}</div>
    <div class="card setrow" style="padding:12px;margin-top:8px"><div class="t">وضع التدريب<small>بدون حد للأخطاء — لا تُحتسب النقاط القياسية</small></div><button class="switch ${prac ? 'on' : ''}" id="pr"></button></div>
    <button class="btn gold block" style="margin-top:16px;font-size:17px;padding:15px" id="go">ابدأ التحدي</button>`);
  main.querySelector('.diffs').onclick = e => { const b = e.target.closest('[data-d]'); if (!b) return; S.set('gdiff', +b.dataset.d); main.querySelectorAll('.diff').forEach(x => x.classList.toggle('on', x === b)); };
  main.querySelector('#cats').onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; S.set('gcat', b.dataset.c); main.querySelectorAll('#cats .gen').forEach(x => x.classList.toggle('on', x === b)); };
  main.querySelector('#pr').onclick = e => { e.currentTarget.classList.toggle('on'); S.set('gprac', e.currentTarget.classList.contains('on')); };
  main.querySelector('#go').onclick = () => LX.go('/guess/play');
});

/* ---------------- gameplay */
LX.route(/^\/guess\/play(?:\/(rel))?$/, (root, rel) => {
  const d = LX.diff(S.get('gdiff', 1)), cat = S.get('gcat', 'mix'), prac = S.get('gprac', false);
  const relP = rel ? LX.P(S.get('guessRel')) : null;
  const pool = relP ? (LX.ADJ[relP.id] || []).map(x => x[0]).filter(id => LX.P(id).cl.length) : null;
  const st = { score: 0, lives: 3, ok: 0, bad: 0, streak: 0, maxStreak: 0, q: null, shown: 0, hints: 0, t0: 0, recent: new Set(S.get('grecent', [])), done: false };
  const main = LX.page(root, { title: relP ? `زملاء ${esc(relP.ar)}` : 'خمن اللاعب', gen: true }, `
    <div class="hud"><div class="lives" id="lv"></div><div class="grow muted" style="font-size:12px;text-align:center"><span class="chip">${d.ar}</span> <span class="chip">${esc((LX.CATS.find(c => c[0] === cat) || [])[1] || '')}</span>${prac ? ' <span class="chip green">تدريب</span>' : ''}</div><div class="score" id="sc">0</div></div>
    <div id="stage"></div>`);
  const stage = main.querySelector('#stage');
  const drawHud = () => {
    main.querySelector('#lv').innerHTML = prac ? `<span class="chip">∞</span>` : [0, 1, 2].map(i => `<span class="${i < st.lives ? '' : 'off'}">${I.heart}</span>`).join('');
    main.querySelector('#sc').textContent = st.score;
  };
  const next = () => {
    const q = LX.makeQuestion({ diff: d.id, cat, pool, recent: st.recent });
    if (!q) { stage.innerHTML = '<div class="empty">لا توجد أسئلة كافية لهذا الاختيار في الجيل الحالي. جرّب جيلًا آخر أو نوع أسئلة مختلف.</div>'; return; }
    st.q = LX._q = q; st.shown = q.clues.length; st.hints = 0; st.t0 = Date.now();
    st.recent.add(q.p.id); S.set('grecent', [...st.recent].slice(-80));
    drawQ();
  };
  const drawQ = () => {
    const q = st.q; const all = q.clues.concat(q.extras.slice(0, st.hints));
    stage.innerHTML = `<div class="qbox">
      <div class="mystery ${q.photo ? 'photo' : ''}">${q.photo ? LX.ph(q.p.id, 104) : '?'}</div>
      <div class="q">مين اللاعب ده؟</div>
      <div class="clues">${all.map((c, i) => `<div class="clue"><span class="i">${i + 1}</span><span class="x">${esc(c)}</span></div>`).join('')}</div>
      <div class="answer"><div class="search"><input id="ans" placeholder="اكتب الاسم بالعربي أو الإنجليزي" autocomplete="off" autocapitalize="off"></div><button class="btn gold" id="chk">تحقق</button></div>
      <div class="row" style="margin-top:10px"><button class="btn sm grow" id="hint" ${st.hints >= q.extras.length ? 'disabled style="opacity:.4"' : ''}>${I.q} دليل إضافي (${LX.iso('−' + Math.round(d.pts * .15))})</button><button class="btn sm grow" id="give">استسلام${prac ? '' : ' (−فرصة)'}</button></div></div>`;
    LX.loadPhotos(stage);
    const inp = stage.querySelector('#ans'); setTimeout(() => inp.focus(), 50);
    inp.onkeydown = e => { if (e.key === 'Enter') check(); };
    stage.querySelector('#chk').onclick = check;
    stage.querySelector('#hint').onclick = () => { if (st.hints < q.extras.length) { st.hints++; drawQ(); } };
    stage.querySelector('#give').onclick = () => { wrong(true); };
  };
  const check = () => {
    const v = stage.querySelector('#ans').value; if (!v.trim()) return;
    const m = LX.matchAnswer(v, st.q.p.id);
    if (m.ok) return right(m);
    const other = m.other && m.other.length === 1 && LX.P(m.other[0]);
    LX.toast(other ? `${other.ar}؟ لا، ليس هو` : (m.amb ? 'الاسم يطابق أكثر من لاعب، اكتب الاسم كاملًا' : 'إجابة خاطئة'), 'bad');
    if (m.amb && !m.ok && !other) return;
    wrong(false);
  };
  const lose = () => { if (!prac) st.lives--; st.bad++; st.streak = 0; LX.buzz(120); drawHud(); };
  const wrong = (gaveUp) => {
    lose(); const box = stage.querySelector('.qbox'); box && box.classList.add('shake');
    if (gaveUp || (!prac && st.lives <= 0)) return reveal(false);
    setTimeout(() => box && box.classList.remove('shake'), 400);
    stage.querySelector('#ans').select();
  };
  const right = () => {
    const secs = (Date.now() - st.t0) / 1000; const base = d.pts;
    st.streak++; st.ok++; st.maxStreak = Math.max(st.maxStreak, st.streak);
    const b = [['النقاط الأساسية', base]];
    if (st.hints) b.push([`أدلة إضافية ×${st.hints}`, -Math.round(base * .15 * st.hints)]);
    else b.push(['بدون أدلة إضافية', Math.round(base * .2)]);
    if (secs < 15) b.push(['إجابة سريعة', Math.round(base * .2)]); else if (secs < 30) b.push(['إجابة في الوقت', Math.round(base * .1)]);
    if (st.streak > 1) b.push([`سلسلة ×${st.streak}`, 10 * Math.min(st.streak - 1, 10)]);
    if (st.q.p.t >= 3) b.push(['مسيرة نادرة', 50]);
    const pts = Math.max(10, b.reduce((a, x) => a + x[1], 0));
    st.score += pts; LX.buzz(30); drawHud();
    LX.unlock('first'); if (st.streak >= 5) LX.unlock('streak5'); if (st.streak >= 10) LX.unlock('streak10'); if (d.id === 4) LX.unlock('legend'); if (st.score >= 1000) LX.unlock('k1000');
    LX.bump('gOK');
    reveal(true, b, pts);
  };
  const reveal = (ok, b, pts) => {
    const p = st.q.p; const over = !prac && st.lives <= 0;
    stage.innerHTML = `<div class="qbox reveal ${ok ? '' : 'bad'}">${LX.ph(p.id, 110)}<div style="font-size:22px;font-weight:900;margin-top:10px">${esc(p.ar)}</div><div class="muted ltr">${esc(p.en)}</div>
      <div style="margin-top:6px">${ok ? `<span class="chip green">إجابة صحيحة ${LX.iso('+' + pts)}</span>` : '<span class="chip red">الإجابة الصحيحة</span>'}</div>
      ${ok ? `<div class="breakdown">${b.map(x => `<div><span>${esc(x[0])}</span><b class="${x[1] < 0 ? '' : 'gold'}">${x[1] > 0 ? '+' : ''}${x[1]}</b></div>`).join('')}</div>` : ''}
      <div class="row" style="margin-top:14px"><button class="btn grow" id="prof">الملف الكامل</button><button class="btn gold grow" id="nx">${over ? 'النتيجة النهائية' : 'السؤال التالي'}</button></div></div>`;
    LX.loadPhotos(stage);
    stage.querySelector('#prof').onclick = () => LX.go('/player/' + p.id);
    stage.querySelector('#nx').onclick = () => over ? finish() : next();
  };
  const finish = () => {
    const tot = st.ok + st.bad, acc = tot ? Math.round(st.ok * 100 / tot) : 0;
    const pb = !prac && LX.best('g' + d.id, st.score);
    stage.innerHTML = `<div class="qbox result"><div class="muted">انتهت الجولة</div><div class="big">${st.score}</div><div>نقطة ${pb ? '<span class="chip gold">رقم قياسي جديد!</span>' : ''}</div>
      <div class="rgrid"><div><b>${st.ok}</b><small>صحيحة</small></div><div><b>${st.bad}</b><small>خاطئة</small></div><div><b>${acc}%</b><small>الدقة</small></div><div><b>${st.maxStreak}</b><small>أطول سلسلة</small></div><div><b style="font-size:15px">${d.ar}</b><small>المستوى</small></div><div><b style="font-size:15px">${esc(LX.era().label)}</b><small>الجيل</small></div></div>
      <div class="muted" style="margin-top:10px">أفضل نتيجة شخصية: <b class="gold">${LX.best('g' + d.id)}</b></div>
      <div class="row" style="margin-top:14px"><button class="btn grow" id="sh">${I.share}مشاركة</button><button class="btn gold grow" id="again">جولة جديدة</button></div>
      <div class="footer-sig">${LX.SIG.replace('Dr HOSSAM Mo', '<b>Dr HOSSAM Mo</b>')}</div></div>`;
    stage.querySelector('#again').onclick = () => LX.render();
    stage.querySelector('#sh').onclick = () => shareResult({ title: 'خمن اللاعب', score: st.score, lines: [[`${st.ok}`, 'صحيحة'], [`${acc}%`, 'الدقة'], [`${st.maxStreak}`, 'أطول سلسلة']], sub: `${d.ar} · ${LX.era().label}` });
  };
  // also allow ending session voluntarily
  const end = document.createElement('button'); end.className = 'btn sm'; end.textContent = 'إنهاء'; end.onclick = () => finish();
  root.querySelector('.topbar').appendChild(end);
  drawHud(); next();
});

/* shared result card */
const shareResult = LX.shareResult = async ({ title, score, lines, sub }) => {
  const { c, ctx } = LX.frame(1080, 1080, title);
  ctx.textAlign = 'center'; ctx.fillStyle = '#D4AF37'; ctx.font = '700 220px Oswald'; ctx.fillText(String(score), 540, 460);
  ctx.fillStyle = '#fff'; ctx.font = '700 40px Cairo'; ctx.direction = 'rtl'; ctx.fillText('نقطة', 540, 530);
  lines.forEach((l, i) => { const x = 220 + i * 320; ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(x - 140, 600, 280, 170); ctx.fillStyle = '#fff'; ctx.font = '700 70px Oswald'; ctx.fillText(l[0], x, 700); ctx.fillStyle = '#93a0b8'; ctx.font = '600 30px Cairo'; ctx.fillText(l[1], x, 748); });
  ctx.fillStyle = '#f0d277'; ctx.font = '600 34px Cairo'; ctx.fillText(sub || '', 540, 860); ctx.direction = 'ltr';
  await LX.shareCanvas(c, 'legends-xi-result', `حققت ${score} نقطة في LEGENDS XI — ${LX.SIG}`);
};
})();
