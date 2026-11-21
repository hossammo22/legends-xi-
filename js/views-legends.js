/* LEGENDS XI — "أسطورة بلده" (country legends) and "حكاية لاعب" (player story). Created by Dr HOSSAM Mo */
(function () {
'use strict';
const LX = window.LX, D = LX.D, S = LX.S, esc = LX.esc, I = LX.I;
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const dateAr = b => { if (!b) return ''; const [y, m, d] = b.split('-').map(Number); return m && d ? `${d} ${MONTHS[m - 1]} ${y}` : String(y); };
const joinAr = a => a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join('، ') + ' و' + a[a.length - 1];
const HONTXT = { WC: 'كأس العالم', EURO: 'كأس أمم أوروبا', CA: 'كوبا أمريكا', AFCON: 'كأس أمم أفريقيا', CL: 'دوري أبطال أوروبا', BDO: 'الكرة الذهبية', LIB: 'كوبا ليبرتادوريس' };
const LEG = D.legends || [];
const LEGBY = {}; LEG.forEach(l => { LEGBY[l.nat] = l; });
LX.LEGBY = LEGBY;

/* ---------------- narrative ("حكاية لاعب"): built only from the app's records, in order */
LX.story = p => {
  const x = p.x || {}, out = [];
  const nat = LX.natName(p), pos = LX.POSDETAIL[p.pos] || LX.POSAR[p.pos] || '';
  let intro = `${p.ar} (${p.en})${pos ? '، ' + pos : ''} من ${nat}`;
  if (p.b) intro += `، وُلد في ${dateAr(p.b)}`;
  intro += '.';
  if (x.nick) intro += ` يُلقب بـ«${x.nick[0]}»${x.nick[1] ? ` (${x.nick[1]})` : ''}.`;
  if (x.role) intro += ` عُرف بدوره ${x.role.startsWith('لاعب') || x.role.startsWith('حارس') ? 'كـ' : 'في مركز '}${x.role}.`;
  out.push(intro);
  if (x.tags && x.tags.length) out.push(`ما يميّزه داخل الملعب: ${joinAr(x.tags.map(t => LX.TAGAR[t]))}.${x.desc ? ' ' + x.desc + '.' : ''}`.replace('..', '.'));
  else if (x.desc) out.push(x.desc + '.');
  const cl = p.cl.filter(c => LX.T(c[0]) && LX.T(c[0]).type === 'club');
  if (cl.length) {
    const sp = c => `${LX.teamName(c[0])} (${LX.spell(c)})`;
    let t = `بدأ مسيرته المسجلة لدينا مع ${sp(cl[0])}`;
    if (cl.length === 2) t += `، ثم انتقل إلى ${sp(cl[1])}`;
    else if (cl.length > 2) t += `، ثم تنقل بين ${joinAr(cl.slice(1, -1).map(sp))}، قبل أن يصل إلى ${sp(cl[cl.length - 1])}`;
    out.push(t + '.' + (p.cs === 'tm' ? ' (مسيرة الأندية من سجلات انتقالات Transfermarkt).' : ''));
  }
  (x.best || []).forEach(b => out.push(`أفضل مواسمه كان مع ${b[0] === p.nat ? 'منتخب ' + nat : LX.teamName(b[0])} ${b[0] === p.nat ? 'عام ' + b[1] : 'موسم ' + LX.seasonLabel(b[1])}: ${b[2]}.`));
  (x.stat || []).forEach(s => out.push(`من أرقامه اللافتة: ${s}.`));
  (x.story || []).forEach(s => out.push(s[0] ? `ومع ${LX.teamName(s[0])}: ${s[1]}.` : s[1] + '.'));
  const wc = p.wc || [];
  let nt = '';
  if (p.nt) nt = `مثّل منتخب ${nat} دوليًا بين عامي ${p.nt[0]} و${p.nt[1]}`;
  if (wc.length) nt += `${nt ? '، و' : ''}شارك في كأس العالم ${wc.length === 1 ? 'مرة واحدة (' + wc[0][0] + ')' : wc.length + ' مرات: ' + joinAr(wc.map(w => String(w[0])))}`;
  if (nt) out.push(nt + '.');
  const nos = Object.entries(x.no || {});
  if (nos.length) out.push(`ارتدى ${joinAr(nos.map(([t, ns]) => `${ns.length > 1 ? 'الأرقام' : 'الرقم'} ${ns.join(' و')} مع ${t === p.nat ? 'المنتخب' : LX.teamName(t)}`))}.`);
  const hon = [...new Set(p.h.map(h => HONTXT[h[0]] + ' ' + h[1]))];
  if (x.ind && x.ind.length) out.push(`جوائزه الفردية: ${joinAr(x.ind)}.`);
  if (x.tit && x.tit.length) out.push(`ألقابه الجماعية: ${joinAr(x.tit)}.`);
  else if (hon.length) out.push(`من أبرز ألقابه: ${joinAr(hon.slice(0, 6))}.`);
  const mates = LX.mates(p.id).map(LX.P).filter(q => q && q.t <= 2).sort((a, b) => a.t - b.t || b.cl.length - a.cl.length).slice(0, 5);
  if (mates.length) out.push(`ومن أبرز من زاملهم: ${joinAr(mates.map(q => q.ar))}.`);
  const sq = LX.squadsOf[p.id] || [];
  if (sq.length) out.push(`يظهر في ${sq.length === 1 ? 'تشكيلة تاريخية واحدة' : sq.length === 2 ? 'تشكيلتين تاريخيتين' : sq.length + ' تشكيلات تاريخية'} في التطبيق، منها: ${sq.slice(-2).map(s => LX.teamName(s.team) + ' — ' + s.comp).join('، ')}.`);
  if (LEGBY[p.nat] && LEGBY[p.nat].p.includes(p.id)) out.push(`ويُعد من أساطير ${nat}: ${LEGBY[p.nat].why}`);
  return out.map(s => s.replace(/[\u2066\u2069]/g, '').replace(/\.\./g, '.'));
};

const storyHtml = p => `<div class="storyhead">${LX.ph(p.id, 84)}<div><div class="n">${esc(p.ar)}</div><div class="muted en">${esc(p.en)}</div><div class="muted" style="font-size:12px">${LX.flag((LX.T(p.nat) || {}).cc)} ${esc(LX.natName(p))} · ${esc(LX.POSDETAIL[p.pos] || '')}</div></div></div>
  <div class="storytext">${LX.story(p).map(t => `<p>${LX.nums(esc(t))}</p>`).join('')}</div>
  <p class="muted" style="font-size:11px">الحكاية مكتوبة آليًا من بيانات التطبيق الموثقة فقط (المسيرة، التشكيلات، كأس العالم، البطاقة التعريفية).</p>`;

/* ---------------- "حكاية لاعب": type a name, read the story */
LX.route(/^\/story(?:\/([^/]+))?$/, (root, pid) => {
  const main = LX.page(root, { title: 'حكاية لاعب' }, `
    <div class="answer"><div class="search">${I.search}<input id="sq" placeholder="ابدأ كتابة اسم أي لاعب…" autocomplete="off"></div></div>
    <div id="st"></div>`);
  const inp = main.querySelector('#sq'), st = main.querySelector('#st');
  const show = p => {
    st.innerHTML = storyHtml(p) + `<div class="row" style="margin-top:10px"><button class="btn grow" id="pf">الملف الكامل</button><button class="btn gold grow" id="sh">${I.share} مشاركة الحكاية</button></div>`;
    LX.loadPhotos(st);
    st.querySelector('#pf').onclick = () => LX.go('/player/' + p.id);
    st.querySelector('#sh').onclick = async () => {
      const text = `${p.ar}\n\n${LX.story(p).join('\n\n')}\n\nLEGENDS XI — Created by Dr HOSSAM Mo`;
      try { const Sh = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Share; if (Sh) await Sh.share({ title: p.ar, text }); else if (navigator.share) await navigator.share({ title: p.ar, text }); else { await navigator.clipboard.writeText(text); LX.toast('نُسخت الحكاية', 'good'); } } catch (e) { /* cancelled */ }
    };
    if (location.hash !== '#/story/' + p.id) history.replaceState(null, '', '#/story/' + p.id);
  };
  LX.autoAnswer(inp, p => { inp.value = ''; show(p); });
  inp.onkeydown = e => { if (e.key === 'Enter') { const r = LX.search(inp.value, 1)[0]; if (r) { inp.value = ''; show(r); } } };
  const p0 = pid && LX.P(pid);
  if (p0) show(p0);
  else {
    st.innerHTML = `<div class="section-t">اقتراحات</div><div class="plist">${LX.shuffle(LX.allPlayers.filter(p => p.x), LX.rng(LX.hash(LX.today()))).slice(0, 8).map(p => LX.prow(p)).join('')}</div>`;
    LX.loadPhotos(st);
    st.onclick = e => { const b = e.target.closest('[data-p]'); if (b) show(LX.P(b.dataset.p)); };
    setTimeout(() => inp.focus(), 80);
  }
});

/* ---------------- country legends */
const CONT = { AF: 'أفريقيا', AS: 'آسيا', EU: 'أوروبا', AM: 'الأمريكتان', OC: 'أوقيانوسيا' };
const CONTOF = { LBR: 'AF', GAB: 'AF', TOG: 'AF', GHA: 'AF', MLI: 'AF', ALG: 'AF', CMR: 'AF', NGA: 'AF', CIV: 'AF', RSA: 'AF', JPN: 'AS', KOR: 'AS', KSA: 'AS', UAE: 'AS', IRN: 'AS', IRQ: 'AS', AUS: 'OC',
  PAR: 'AM', COL: 'AM', CRC: 'AM', TRI: 'AM', CHI: 'AM', PER: 'AM', ECU: 'AM', USA: 'AM', CAN: 'AM' };
const contOf = nat => CONTOF[nat.slice(2)] || 'EU';
LX.route(/^\/legends$/, root => {
  const main = LX.page(root, { title: 'أسطورة بلده' }, `
    <div class="leghero"><div class="t">بلاد صغيرة في تاريخ الكرة… وأساطير لا تُنسى</div><div class="d">${LEG.length} دولة لم تكتب تاريخًا كبيرًا في كرة القدم، لكنها قدّمت لاعبًا أو اثنين لا ينساهم أحد.</div>
    <button class="btn gold block" id="qz" style="margin-top:10px">${I.q} اختبار: من أسطورة هذا البلد؟</button></div>
    <div class="gens" id="ct"><button class="gen on" data-c="">الكل</button>${Object.entries(CONT).map(([k, v]) => `<button class="gen" data-c="${k}">${v}</button>`).join('')}</div>
    <div class="leggrid" id="g"></div>`);
  let c = '';
  const draw = () => {
    main.querySelector('#g').innerHTML = LEG.filter(l => !c || contOf(l.nat) === c).map(l => {
      const t = LX.T(l.nat), ps = l.p.map(LX.P);
      return `<button class="legcard" data-n="${l.nat}"><div class="fl">${LX.flag(t.cc)}</div><div class="c">${esc(t.ar)}</div>${LX.ph(ps[0].id, 54)}<div class="n">${esc(ps.map(p => LX.shortName(p)).join(' · '))}</div></button>`;
    }).join('');
    LX.loadPhotos(main);
  };
  draw();
  main.querySelector('#ct').onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; c = b.dataset.c; main.querySelectorAll('#ct .gen').forEach(x => x.classList.toggle('on', x === b)); draw(); };
  main.querySelector('#g').onclick = e => { const b = e.target.closest('[data-n]'); if (b) LX.go('/legend/' + b.dataset.n); };
  main.querySelector('#qz').onclick = () => LX.go('/legends/quiz');
});

LX.route(/^\/legend\/([^/]+)$/, (root, nat) => {
  const l = LEGBY[nat]; if (!l) return LX.go('/legends');
  const t = LX.T(nat), ps = l.p.map(LX.P);
  const others = LX.allPlayers.filter(p => p.nat === nat && !l.p.includes(p.id) && p.t <= 3).sort((a, b) => a.t - b.t || (b.wc || []).length - (a.wc || []).length).slice(0, 12);
  const main = LX.page(root, { title: esc(t.ar) }, `
    <div class="legtop"><div class="fl">${LX.flag(t.cc)}</div><div class="t">${esc(t.ar)}</div><p>${LX.nums(esc(l.why))}</p></div>
    ${ps.map(p => `<div class="card legp">${storyHtml(p)}<button class="btn block" data-p="${p.id}">الملف الكامل</button></div>`).join('')}
    ${others.length ? `<div class="section-t">لاعبون آخرون من ${esc(t.ar)} في التطبيق</div><div class="plist">${others.map(p => LX.prow(p)).join('')}</div>` : ''}`);
  LX.loadPhotos(main);
  main.onclick = e => { const b = e.target.closest('[data-p]'); if (b) LX.go('/player/' + b.dataset.p); };
});

/* quiz: the flag and the country are shown, the player types the legend (any listed legend counts) */
LX.route(/^\/legends\/quiz$/, root => {
  const order = LX.shuffle(LEG.slice(), LX.rng(Date.now())).slice(0, 10);
  let i = 0, score = 0, hints = 0;
  const main = LX.page(root, { title: 'من أسطورة هذا البلد؟' }, `<div id="qz"></div>`);
  const box = main.querySelector('#qz');
  const hintsFor = l => {
    const p = LX.P(l.p[0]), cl = p.cl.filter(c => LX.T(c[0]) && LX.T(c[0]).type === 'club');
    const ys = [...p.cl.map(c => c[1]), ...(p.nt || []), ...(p.wc || []).map(w => w[0])];
    const out = [`مركزه: ${LX.POSDETAIL[p.pos] || LX.POSAR[p.pos] || '—'}`];
    if (ys.length) out.push(`لمع في الفترة ${LX.span(Math.min(...ys), Math.max(...ys))}`);
    if (cl.length) out.push(`من أنديته: ${LX.teamName(cl[cl.length > 1 ? 1 : 0][0])}`);
    out.push(`أول حرف من اسمه: «${p.ar.trim()[0]}»`);
    return out;
  };
  const draw = msg => {
    if (i >= order.length) {
      box.innerHTML = `<div class="qbox reveal"><div class="q">النتيجة</div><div class="bigscore">${score}</div><div class="muted">من ${order.length}</div><div class="row" style="margin-top:12px"><button class="btn grow" id="bk">قائمة الدول</button><button class="btn gold grow" id="ag">إعادة</button></div></div>`;
      LX.bump('legq'); box.querySelector('#bk').onclick = () => LX.go('/legends'); box.querySelector('#ag').onclick = () => LX.render();
      return;
    }
    const l = order[i], t = LX.T(l.nat), hs = hintsFor(l);
    box.innerHTML = `<div class="qbox"><div class="muted" style="font-size:12px">سؤال ${i + 1} من ${order.length} · النقاط ${score}</div>
      <div class="bigflag">${LX.flag(t.cc)}</div><div class="q">من أسطورة ${esc(t.ar)}؟</div>
      <div class="clues">${hs.slice(0, hints).map((c, k) => `<div class="clue"><span class="i">${k + 1}</span><span class="x">${LX.nums(esc(c))}</span></div>`).join('')}</div>
      <div class="answer"><div class="search"><input id="la" placeholder="ابدأ كتابة اسم اللاعب…" autocomplete="off"></div><button class="btn gold" id="lc">تحقق</button></div>
      <div class="row" style="margin-top:10px"><button class="btn sm grow" id="lh" ${hints >= hs.length ? 'disabled style="opacity:.4"' : ''}>${I.q} تلميح</button><button class="btn sm grow" id="ls">أظهر الإجابة</button></div>
      ${msg ? `<div class="muted" style="margin-top:8px">${msg}</div>` : ''}</div>`;
    const inp = box.querySelector('#la');
    const reveal = ok => {
      if (ok) score += Math.max(1, 3 - hints);
      box.innerHTML = `<div class="qbox reveal ${ok ? '' : 'bad'}"><div class="bigflag">${LX.flag(t.cc)}</div>${l.p.map(id => { const p = LX.P(id); return `<div class="legans">${LX.ph(id, 64)}<div><b>${esc(p.ar)}</b><div class="muted en">${esc(p.en)}</div></div></div>`; }).join('')}
        <p style="margin-top:10px;font-size:13.5px;line-height:1.7">${LX.nums(esc(l.why))}</p><button class="btn gold block" id="nx">التالي</button></div>`;
      LX.loadPhotos(box); box.querySelector('#nx').onclick = () => { i++; hints = 0; draw(); };
    };
    const go = () => {
      if (!inp.value.trim()) return;
      const ok = l.p.some(id => LX.answerCheck(inp, id).ok);
      if (ok) { LX.toast('صحيح!', 'good'); reveal(true); } else { LX.buzz(80); draw('ليس أسطورة هذا البلد — جرّب تلميحًا'); }
    };
    LX.autoAnswer(inp, go);
    box.querySelector('#lc').onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); };
    box.querySelector('#lh').onclick = () => { hints++; draw(); };
    box.querySelector('#ls').onclick = () => reveal(false);
    setTimeout(() => inp.focus(), 60);
  };
  draw();
});
})();
