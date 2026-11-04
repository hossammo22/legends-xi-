/* LEGENDS XI — home, settings, about, credits, achievements. Created by Dr HOSSAM Mo */
(function () {
'use strict';
const LX = window.LX, D = LX.D, S = LX.S, esc = LX.esc, I = LX.I;
const SIGHTML = () => `<div class="footer-sig">Created by <b>Dr HOSSAM Mo</b></div>`;

/* ---------------- splash (short, skippable) */
LX.splash = () => new Promise(res => {
  if (sessionStorage.getItem('lxi.splashed')) return res();
  sessionStorage.setItem('lxi.splashed', '1');
  const el = document.createElement('div'); el.id = 'splash';
  el.innerHTML = `<div class="lights"></div><div class="pitch"></div>${LX.logo(170)}<div class="ttl">LEGENDS <b>XI</b></div><div class="sub">FOOTBALL TIME MACHINE</div><div class="sig">${LX.SIG}</div><button class="skip">تخطي</button>`;
  document.body.appendChild(el);
  let done = false; const out = () => { if (done) return; done = true; el.classList.add('out'); setTimeout(() => el.remove(), 520); res(); };
  el.querySelector('.skip').onclick = out; el.onclick = e => { if (e.target === el) out(); };
  setTimeout(out, 2600);
});

/* ---------------- home */
const ART = {
  squads: `<svg class="art" viewBox="0 0 120 120"><rect x="18" y="10" width="84" height="100" rx="6" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="3"/><line x1="18" y1="60" x2="102" y2="60" stroke="rgba(255,255,255,.35)" stroke-width="3"/><circle cx="60" cy="60" r="12" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="3"/>${[[60, 98], [32, 80], [50, 80], [70, 80], [88, 80], [40, 56], [60, 52], [80, 56], [35, 30], [60, 24], [85, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#D4AF37"/>`).join('')}</svg>`,
  guess: `<svg class="art" viewBox="0 0 120 120"><circle cx="60" cy="54" r="34" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.4)" stroke-width="3"/><text x="60" y="74" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="56" fill="#D4AF37">?</text></svg>`,
  link: `<svg class="art" viewBox="0 0 120 120"><g stroke="rgba(255,255,255,.5)" stroke-width="3" fill="none"><path d="M20 90 C40 40, 60 100, 82 50"/><path d="M82 50 L100 22"/></g>${[[20, 90], [52, 72], [82, 50], [100, 22]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === 0 || i === 3 ? 11 : 7}" fill="${i === 0 || i === 3 ? '#fff' : '#D4AF37'}"/>`).join('')}</svg>`
};
LX.route(/^\/home$/, root => {
  const e = LX.era(); const st = D.built;
  const main = LX.page(root, { title: '', back: false, right: `<button class="iconbtn" id="st" aria-label="الإعدادات">${I.gear}</button>` }, `
    <div class="hero">${LX.logo(92)}<h2 class="en">LEGENDS <b>XI</b></h2><div class="tag en">FOOTBALL TIME MACHINE</div><div class="signature">Created by <b>Dr HOSSAM Mo</b></div></div>
    <div class="section-t" style="margin-top:14px">${I.clock.replace('<svg', '<svg style="width:18px;height:18px;vertical-align:-4px;color:var(--gold)"')} ذاكرة الأجيال <small>${esc(e.ar)}</small></div>
    <div class="gens" id="gens" style="margin-top:0">${LX.ERAS.map(x => `<button class="gen ${x.id === e.id ? 'on' : ''}" data-e="${x.id}">${esc(x.label)}</button>`).join('')}</div>
    <div class="bigcards">
      <button class="bigcard bc1" data-g="/squads">${ART.squads}<span class="k">LEGENDARY SQUADS</span><span class="t">موسوعة التشكيلات التاريخية</span><span class="d">تشكيلات موثقة بالأرقام والمراكز والصور، وأرشيف لاعبين لكل موسم.</span></button>
      <button class="bigcard bc2" data-g="/guess">${ART.guess}<span class="k">GUESS THE LEGEND</span><span class="t">خمن اللاعب</span><span class="d">أدلة حقيقية من مسيرات موثقة · 4 مستويات · 3 فرص.</span></button>
      <button class="bigcard bc3" data-g="/connect">${ART.link}<span class="k">PLAYER CONNECTIONS</span><span class="t">وصلات اللاعبين</span><span class="d">من بيليه إلى رونالدو عبر زملاء حقيقيين — 9 أوضاع.</span></button>
    </div>
    <div class="smallcards">
      <button class="smallcard" data-g="/missing"><span class="ic">${I.puzzle}</span><span class="t">اللاعب الناقص</span><span class="d">WHO IS MISSING?</span></button>
      <button class="smallcard" data-g="/dream"><span class="ic">${I.star}</span><span class="t">فريق أحلامك</span><span class="d">DREAM XI</span></button>
      <button class="smallcard" data-g="/era"><span class="ic">${I.clock}</span><span class="t">ذاكرة الأجيال</span><span class="d">FOOTBALL TIME MACHINE</span></button>
      <button class="smallcard" data-g="/daily"><span class="ic">${I.cal}</span><span class="t">التحدي اليومي</span><span class="d">DAILY LEGEND CHALLENGE</span></button>
      <button class="smallcard" data-g="/legends"><span class="ic">${I.trophy}</span><span class="t">أسطورة بلده</span><span class="d">NATIONAL ICONS</span></button>
      <button class="smallcard" data-g="/story"><span class="ic">${I.info}</span><span class="t">حكاية لاعب</span><span class="d">PLAYER STORY</span></button>
    </div>
    <button class="prow" style="margin-top:12px" data-g="/search">${I.search.replace('<svg', '<svg style="width:22px;height:22px;color:var(--gold)"')}<div class="grow"><div class="n">ابحث عن أي لاعب</div><div class="s">${st.players} لاعب · ${st.squads} تشكيلة · ${Math.round(LX.linkCount).toLocaleString(LX.lang === 'en' ? 'en-US' : 'ar-EG')} رابط زمالة موثق</div></div></button>
    <button class="prow" style="margin-top:8px" data-g="/achievements">${I.trophy.replace('<svg', '<svg style="width:22px;height:22px;color:var(--gold)"')}<div class="grow"><div class="n">إنجازاتي</div><div class="s">${Object.keys(S.get('ach', {})).length} من ${LX.ACH.length} إنجاز</div></div></button>
    ${SIGHTML()}`);
  root.querySelector('.topbar h1').innerHTML = `<span class="en" style="letter-spacing:.14em;font-size:15px">LEGENDS <span class="gold">XI</span></span>`;
  main.onclick = ev => {
    const g = ev.target.closest('[data-g]'); if (g) { if (g.dataset.g === '/missing') LX._miss = null; return LX.go(g.dataset.g); }
    const b = ev.target.closest('[data-e]'); if (b) { LX.setEra(b.dataset.e); main.querySelectorAll('#gens .gen').forEach(x => x.classList.toggle('on', x === b)); root.querySelector('.section-t small').textContent = LX.era().ar; }
  };
  root.querySelector('#st').onclick = () => LX.go('/settings');
});

/* ---------------- global player search */
LX.route(/^\/search$/, root => {
  const main = LX.page(root, { title: 'البحث عن لاعب', gen: true }, `<div class="search">${I.search}<input id="q" placeholder="الاسم بالعربية أو الإنجليزية أو اللقب" autocomplete="off"></div><div class="plist" id="r"></div>`);
  const q = main.querySelector('#q'), r = main.querySelector('#r');
  const draw = () => { const res = q.value.trim() ? LX.search(q.value, 60) : LX.allPlayers.filter(p => p.t === 1 && LX.inEra(p)).slice(0, 40); r.innerHTML = res.map(p => LX.prow(p)).join('') || '<div class="empty">لا نتائج</div>'; LX.loadPhotos(r); };
  q.oninput = draw; draw(); setTimeout(() => q.focus(), 100);
  r.onclick = e => { const b = e.target.closest('[data-p]'); if (b) LX.go('/player/' + b.dataset.p); };
});

/* ---------------- achievements (cards carry the signature) */
LX.route(/^\/achievements$/, root => {
  const a = S.get('ach', {});
  const main = LX.page(root, { title: 'إنجازاتي', gen: false }, `
    <div class="rgrid"><div><b>${Object.keys(a).length}/${LX.ACH.length}</b><small>إنجازات</small></div><div><b>${LX.stat('gOK') || 0}</b><small>إجابات صحيحة</small></div><div><b>${LX.stat('cOK') || 0}</b><small>وصلات مكتملة</small></div></div>
    <div class="section-t">أفضل النتائج</div>
    <div class="card" style="padding:4px 12px"><table class="numtable">${LX.DIFFS.map(d => `<tr><td>${d.ar}</td><td class="n">${LX.best('g' + d.id)}</td><td class="muted" style="font-size:12px">خمن اللاعب</td><td class="n">${LX.best('c' + d.id)}</td><td class="muted" style="font-size:12px">الوصلات</td></tr>`).join('')}</table></div>
    <div class="ach">${LX.ACH.map(x => `<div class="achc ${a[x.id] ? 'on' : ''}"><div class="ic">${x.ic}</div><div class="t">${esc(x.t)}</div><div class="d">${esc(x.d)}</div>${a[x.id] ? `<div class="d en">${a[x.id]}</div>` : ''}<div class="sig">${LX.SIG}</div></div>`).join('')}</div>
    ${SIGHTML()}`);
});

/* ---------------- settings */
const THEMES = [['gold', 'ذهبي ليلي', ['#101827', '#1f2c4a', '#D4AF37']], ['pitch', 'أخضر الملعب', ['#0c1f16', '#1a4031', '#e8c547']], ['royal', 'أزرق ملكي', ['#0b1736', '#1c2f63', '#5fb4ff']],
  ['fire', 'أحمر ناري', ['#1a0d10', '#3a1c21', '#ff6b4a']], ['violet', 'بنفسجي', ['#150f26', '#2c2150', '#c48bff']], ['classic', 'أبيض وأسود كلاسيكي', ['#1b1b1b', '#303030', '#f2f2f2']], ['light', 'نهاري فاتح', ['#f3f5f9', '#ffffff', '#b8860b']]];
const FONTS = ['Cairo', 'Tajawal', 'Almarai', 'Changa', 'El Messiri', 'Noto Kufi Arabic'];
LX.route(/^\/settings$/, root => {
  const sw = (k, def) => `<button class="switch ${S.get(k, def) ? 'on' : ''}" data-sw="${k}" data-def="${def}"></button>`;
  const main = LX.page(root, { title: 'الإعدادات', gen: false }, `
    <div class="card" style="padding:0">
      <button class="setrow" style="width:100%;text-align:start" id="era"><div class="t">ذاكرة الأجيال<small>${esc(LX.era().label)} — ${esc(LX.era().ar)}</small></div>${I.back.replace('<svg', '<svg style="width:18px;transform:scaleX(-1)"')}</button>
      <div class="setrow"><div class="t">صور اللاعبين<small>جلب الصور المرخصة من ويكيميديا وحفظها للعمل دون إنترنت</small></div>${sw('photos', true)}</div>
      <div class="setrow"><div class="t">الاهتزاز<small>اهتزاز خفيف عند الإجابات</small></div>${sw('vibe', true)}</div>
      <div class="setrow"><div class="t">وضع المسؤول<small>يتيح استبدال صور اللاعبين الخاطئة أو المفقودة</small></div>${sw('admin', false)}</div>
    </div>
    <div class="section-t">المظهر</div>
    <div class="card" style="padding:0"><div class="themegrid" id="th">${THEMES.map(([k, l, c]) => `<button data-th="${k}" class="${S.get('theme', 'gold') === k ? 'on' : ''}"><span class="sw">${c.map(x => `<i style="background:${x}"></i>`).join('')}</span>${l}</button>`).join('')}</div></div>
    <div class="section-t">الخط</div>
    <div class="card" style="padding:0"><div class="fontgrid" id="fo">${FONTS.map(f => `<button data-fo="${f}" class="${S.get('font', 'Cairo') === f ? 'on' : ''}" style="font-family:'${f}'"><span class="smp">أساطير الكرة</span><small>${f}</small></button>`).join('')}</div>
    <div class="segs" id="fs">${[['s', 'صغير'], ['m', 'عادي'], ['l', 'كبير'], ['xl', 'كبير جدًا']].map(([k, l]) => `<button data-fs="${k}" class="${S.get('fsize', 'm') === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    <div class="section-t">اللغة</div>
    <div class="card" style="padding:0"><div class="segs" id="lg"><button data-lg="ar" class="${S.get('lang', 'ar') === 'ar' ? 'on' : ''}">العربية</button><button data-lg="en" class="${S.get('lang', 'ar') === 'en' ? 'on' : ''}">English</button></div></div>
    <div class="card" style="padding:0;margin-top:12px">
      <button class="setrow" style="width:100%;text-align:start" data-g="/about"><div class="t">عن التطبيق</div></button>
      <button class="setrow" style="width:100%;text-align:start" data-g="/credits"><div class="t">الحقوق والتراخيص والمصادر</div></button>
      <button class="setrow" style="width:100%;text-align:start" data-g="/achievements"><div class="t">إنجازاتي</div></button>
    </div>
    <div class="card" style="padding:0;margin-top:12px">
      <button class="setrow" style="width:100%;text-align:start" id="cph"><div class="t">مسح ذاكرة الصور<small>${LX.photoCredits().length} صورة محفوظة</small></div></button>
      <button class="setrow" style="width:100%;text-align:start;color:#ff9b9e" id="rst"><div class="t">إعادة ضبط النتائج والإنجازات</div></button>
    </div>
    ${SIGHTML()}`);
  const R = document.documentElement;
  main.querySelector('#th').onclick = e => { const b = e.target.closest('[data-th]'); if (!b) return; S.set('theme', b.dataset.th); R.setAttribute('data-theme', b.dataset.th); main.querySelectorAll('#th button').forEach(x => x.classList.toggle('on', x === b)); LX.statusBar && LX.statusBar(); };
  main.querySelector('#fo').onclick = e => { const b = e.target.closest('[data-fo]'); if (!b) return; S.set('font', b.dataset.fo); R.style.setProperty('--font', `'${b.dataset.fo}'`); main.querySelectorAll('#fo button').forEach(x => x.classList.toggle('on', x === b)); };
  main.querySelector('#fs').onclick = e => { const b = e.target.closest('[data-fs]'); if (!b) return; S.set('fsize', b.dataset.fs); R.setAttribute('data-fsize', b.dataset.fs); main.querySelectorAll('#fs button').forEach(x => x.classList.toggle('on', x === b)); };
  main.querySelector('#lg').onclick = e => { const b = e.target.closest('[data-lg]'); if (!b || S.get('lang', 'ar') === b.dataset.lg) return; S.set('lang', b.dataset.lg); location.reload(); };
  main.querySelectorAll('[data-sw]').forEach(b => b.onclick = () => { const k = b.dataset.sw; const v = !S.get(k, b.dataset.def === 'true'); S.set(k, v); b.classList.toggle('on', v); });
  main.querySelector('#era').onclick = () => LX.eraSheet();
  main.addEventListener('click', e => { const g = e.target.closest('[data-g]'); if (g) LX.go(g.dataset.g); });
  main.querySelector('#cph').onclick = async () => { await LX.clearPhotos(); LX.toast('تم مسح الصور المحفوظة', 'good'); LX.render(); };
  main.querySelector('#rst').onclick = () => { if (!confirm('سيتم حذف كل النتائج والإنجازات. متأكد؟')) return; ['stats', 'best', 'ach', 'daily', 'grecent'].forEach(S.del); LX.toast('تمت إعادة الضبط', 'good'); LX.render(); };
});

/* ---------------- about */
LX.route(/^\/about$/, root => {
  const st = D.built; const src = D.squads.filter(s => s.ver === 'src' || s.ver === 'wcdb').length;
  LX.page(root, { title: 'عن التطبيق', gen: false }, `
    <div class="hero">${LX.logo(110)}<h2 class="en">LEGENDS <b>XI</b></h2><div class="tag en">FOOTBALL TIME MACHINE</div><div class="signature">Created by <b>Dr HOSSAM Mo</b></div><div class="muted en" style="font-size:12px;margin-top:4px">v1.0.0</div></div>
    <div class="card" style="margin-top:14px;font-size:14px">موسوعة تاريخية لكرة القدم وألعاب معرفة تجمع بين حنين الكرة الكلاسيكية وتقنيات الألعاب الحديثة. كل الأقسام تعتمد على قاعدة بيانات واحدة، فاللاعب نفسه يظهر بنفس السجل في التشكيلات والألعاب والوصلات.</div>
    <div class="rgrid"><div><b>${st.players}</b><small>لاعب</small></div><div><b>${st.squads}</b><small>تشكيلة</small></div><div><b>${Math.round(LX.linkCount).toLocaleString('en')}</b><small>رابط زمالة</small></div><div><b>${st.full}</b><small>مسيرة أندية كاملة</small></div><div><b>${Object.keys(D.teams).length}</b><small>فريق ومنتخب</small></div><div><b>${src}</b><small>تشكيلة مراجعة</small></div></div>
    <div class="section-t">منهجية التوثيق</div>
    <div class="card" style="font-size:13px;line-height:1.8">
      • <b>تشكيلات المباريات</b> تُعرض كما سُجلت في تلك المباراة بأرقامها؛ الرقم غير المعروف يظهر "غير موثق" ولا يُخمَّن.<br>
      • شارة <span class="verbadge src">موثقة</span> تعني أن التشكيلة روجعت مقابل سجل المباراة المنشور أثناء البناء، و<span class="verbadge kb">معرفة تاريخية</span> تعني أنها من المعرفة التاريخية بانتظار مراجعة مصدر ثانٍ.<br>
      • <b>رابط الزمالة بين الأندية</b> لا يُقبل إلا إذا تداخلت فترتا اللاعبين في الفريق الأول موسمًا كاملًا على الأقل؛ اللعب لنفس النادي في سنوات مختلفة لا يكفي.<br>
      • <b>روابط المنتخبات</b> تُستخرج فقط من تشكيلات موثقة، ولا تُستنتج من تداخل السنوات.<br>
      • لا يُعرض أي تحدٍ في الوصلات قبل التحقق من وجود حل موثق تحت نفس القيود.<br>
      • لاعبو كأس العالم وقوائم المنتخبات وتشكيلات آخر مباراة لكل منتخب (1962–2022) مأخوذة من قاعدة بيانات Fjelstul المفتوحة لكأس العالم، وتحمل شارة <span class="verbadge wcdb">قاعدة كأس العالم</span>. مسيرة الأندية لهؤلاء اللاعبين لم تُضف بعد، فلا تُعرض لهم سنوات أندية غير موثقة.
    </div>
    ${SIGHTML()}`);
});

/* ---------------- credits & licences */
LX.route(/^\/credits$/, root => {
  const cr = LX.photoCredits();
  LX.page(root, { title: 'الحقوق والتراخيص', gen: false }, `
    <div class="card" style="font-size:13px;line-height:1.8"><b>LEGENDS XI</b> — Football Time Machine<br>Created by <b class="gold">Dr HOSSAM Mo</b><br>الشعار والهوية البصرية تصميم أصلي للتطبيق. شارات الفرق داخل التطبيق رموز مولدة بالألوان والحروف وليست شعارات الأندية الرسمية.</div>
    <div class="section-t">مصادر البيانات</div>
    <div class="card" style="font-size:13px;line-height:1.8">سجلات المباريات النهائية (التشكيلات وأرقام القمصان والبدلاء) روجعت مقابل صفحات المباريات المنشورة على ويكيبيديا ونسخها المؤرشفة، وسجل نادي ليفربول التاريخي (lfchistory.net). مسيرات اللاعبين مُدخلة على مستوى المواسم ويمكن تصحيحها وتوسيعها في ملفات المصدر.</div>
    <div class="card" style="font-size:13px;line-height:1.8;margin-top:10px">بيانات كأس العالم (القوائم، أرقام القمصان، المراكز، تواريخ الميلاد، تشكيلات المباريات): <b>The Fjelstul World Cup Database</b> — Joshua C. Fjelstul — مرخصة بموجب <span class="ltr">CC-BY-SA 4.0</span>.</div>
    <div class="card" style="font-size:13px;line-height:1.8;margin-top:10px">تشكيلات أجيال الأندية ذات شارة "موثقة" (الدوريات الكبرى 2003–2024 وبعض نهائيات دوري الأبطال) مأخوذة من <b>StatsBomb Open Data</b> (<span class="ltr">github.com/statsbomb/open-data</span>) — البيانات مقدمة من StatsBomb. وتشكيلات الأجيال ذات شارة "معرفة تاريخية" مكتوبة من المعرفة التاريخية بانتظار مراجعة مصدر ثانٍ، والرقم غير المؤكد يظهر "غير موثق".</div>
    <div class="card" style="font-size:13px;line-height:1.8;margin-top:10px">مسيرات أندية لاعبي كأس العالم: سجلات انتقالات <b>Transfermarkt</b> المنشورة في مستودع <span class="ltr">ewenme/transfers</span>. البطاقات التعريفية وحكايات اللاعبين وصفحات "أسطورة بلده": نصوص تحريرية من المعرفة التاريخية العامة.</div>
    <div class="section-t">صور اللاعبين <small>${cr.length} صورة محفوظة</small></div>
    <div class="card" style="font-size:12.5px">تُجلب الصور من ويكيبيديا / ويكيميديا كومنز. قبل العرض يتحقق التطبيق من أن الصفحة للاعب كرة قدم وأن ترخيص الملف ليس "غير حر"، ويحفظ اسم الملف والترخيص والمصوّر. الصور ملك أصحابها وفق تراخيصها المذكورة.</div>
    <div class="plist">${cr.map(c => { const p = LX.P(c.pid); return p ? `<a class="prow" href="${esc(c.src)}" target="_blank" rel="noopener">${LX.ph(p.id, 40)}<div class="grow"><div class="n">${esc(p.ar)}</div><div class="s ltr" style="text-align:right">${esc(c.lic)}${c.art ? ' · ' + esc(c.art) : ''}</div></div></a>` : ''; }).join('') || '<div class="empty">لم تُحفظ صور بعد — تصفح التشكيلات وستظهر هنا مع تراخيصها</div>'}</div>
    <div class="section-t">الخطوط</div>
    <div class="card" style="font-size:12.5px">الخطوط Cairo وTajawal وAlmarai وChanga وEl Messiri وNoto Kufi Arabic وOswald — مرخصة بموجب SIL Open Font License 1.1 (عبر Fontsource).</div>
    ${SIGHTML()}`);
});
})();
