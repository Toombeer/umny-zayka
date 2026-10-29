'use strict';
/* ==========================================================================
   Умный Зайка — CRM детского центра. Рабочая версия на одном устройстве:
   все данные хранятся в браузере (localStorage), резервная копия — файлом.
   ========================================================================== */

/* ---------- базовые помощники ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const money = n => Math.round(n || 0).toLocaleString('ru-RU') + ' ₸';
const pad = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const TODAY = iso(new Date());
const addDays = (d, n) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n); return iso(x); };
const dmy = d => d ? d.slice(8, 10) + '.' + d.slice(5, 7) + '.' + d.slice(0, 4) : '';
const dm = d => d === TODAY ? 'сегодня' : d.slice(8, 10) + '.' + d.slice(5, 7);
const ymOf = d => d.slice(0, 7);
const CUR_YM = ymOf(TODAY);
const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const MONTHS_FULL = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const DAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const DSH = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const dowOf = d => new Date(d + 'T12:00:00').getDay();
const shiftYm = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); };
const lastMonths = n => Array.from({length: n}, (_, i) => shiftYm(CUR_YM, i - n + 1));
const pct = x => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(1).replace('.', ',') + '%';
const plural = (n, a, b, c) => { const m = Math.abs(n) % 100, l = m % 10; return m > 10 && m < 20 ? c : l > 1 && l < 5 ? b : l === 1 ? a : c; };

const STAGES = ['Новая', 'Связались', 'Пробное', 'Купил', 'Отказ'];
const STAGEC = [1, 0, 3, 4, 2];
const REASONS = ['Дорого', 'Далеко от дома', 'Нет времени', 'Выбрали другой центр', 'Не подошёл возраст', 'Не отвечает', 'Другое'];
const SOURCES = ['Instagram', 'WhatsApp', 'Сайт', 'Рекомендация', '2ГИС', 'Другое'];
const STATUSES = {trial: 'Пробный', active: 'Активный', pause: 'Пауза', left: 'Ушёл'};
const EXP_CATS = ['Аренда', 'Зарплаты', 'Материалы', 'Реклама', 'Коммунальные', 'Налоги', 'Прочее'];
const METHODS = {cash: 'Наличные', kaspi: 'Kaspi', transfer: 'Перевод'};
const MC = {cash: 4, kaspi: 2, transfer: 1};
const STN = {was: 'был', late: 'опоздал', absent: 'не был', excused: 'уважительная'};

/* ---------- цвета и значки ---------- */
const PAL = [['--c-violet', '--c-violet-s'], ['--c-blue', '--c-blue-s'], ['--c-pink', '--c-pink-s'], ['--c-amber', '--c-amber-s'], ['--c-teal', '--c-teal-s']];
const pal = i => `--c:var(${PAL[((i % 5) + 5) % 5][0]});--s:var(${PAL[((i % 5) + 5) % 5][1]})`;
const hashIdx = s => { let h = 0; for (const c of String(s || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 5; };
const initials = n => String(n || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const av = (name, id) => `<span class="av" style="${pal(id)}">${esc(initials(name))}</span>`;
const dirTag = d => d ? `<span class="dir" style="${pal(hashIdx(d))}">${esc(d)}</span>` : '';
const mtag = m => `<span class="dir" style="${pal(MC[m] ?? 0)}">${METHODS[m] || esc(m)}</span>`;
const svg = (p, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC = {
  today: '<path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  schedule: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  students: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5.2a3 3 0 0 1 0 5.6M21 20c0-2.6-1.5-4.7-3.8-5.6"/>',
  leads: '<path d="M3 5h18l-7 8v6l-4-2v-4z"/>',
  pay: '<path d="M3 7a2 2 0 0 1 2-2h13v3"/><path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2z"/><circle cx="16.5" cy="14.5" r="1.2"/>',
  mk: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M12 3 22 20H2z"/><path d="M12 10v4M12 17h.01"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  msg: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>'
};
const bunny = (s = 26) => `<svg viewBox="0 0 30 30" width="${s}" height="${s}" aria-hidden="true"><ellipse cx="11" cy="9" rx="3" ry="7" transform="rotate(-10 11 9)" fill="#fff"/><ellipse cx="19" cy="9" rx="3" ry="7" transform="rotate(10 19 9)" fill="#fff"/><ellipse cx="15" cy="20" rx="9" ry="7.5" fill="#fff"/><circle cx="11.5" cy="19.5" r="1.3" fill="#3B1D9A"/><circle cx="18.5" cy="19.5" r="1.3" fill="#3B1D9A"/><ellipse cx="15" cy="22.4" rx="1.4" ry="1" fill="#FF7FB5"/></svg>`;
const BUNNY_HERO = `<svg viewBox="0 0 140 130" aria-hidden="true"><ellipse cx="50" cy="38" rx="13" ry="34" transform="rotate(-12 50 38)" fill="#fff"/><ellipse cx="50" cy="40" rx="6" ry="23" transform="rotate(-12 50 40)" fill="#FFB8D5"/><ellipse cx="90" cy="38" rx="13" ry="34" transform="rotate(12 90 38)" fill="#fff"/><ellipse cx="90" cy="40" rx="6" ry="23" transform="rotate(12 90 40)" fill="#FFB8D5"/><ellipse cx="70" cy="90" rx="42" ry="35" fill="#fff"/><circle cx="56" cy="86" r="11" fill="none" stroke="#2A1B5E" stroke-width="3"/><circle cx="84" cy="86" r="11" fill="none" stroke="#2A1B5E" stroke-width="3"/><path d="M67 86h6" stroke="#2A1B5E" stroke-width="3" stroke-linecap="round"/><circle cx="56" cy="86" r="4.5" fill="#2A1B5E"/><circle cx="84" cy="86" r="4.5" fill="#2A1B5E"/><ellipse cx="70" cy="101" rx="5" ry="3.6" fill="#FF8FBF"/><path d="M63 107q7 6 14 0" fill="none" stroke="#2A1B5E" stroke-width="3" stroke-linecap="round"/><circle cx="44" cy="102" r="6" fill="#FFC6DD" opacity=".85"/><circle cx="96" cy="102" r="6" fill="#FFC6DD" opacity=".85"/></svg>`;

/* ---------- хранение ---------- */
const KEY = 'zayka-db';
let db = null;
function blankDb(name, city) {
  return {v: 2, demo: false, seq: 1, created: TODAY,
    center: {name: name || 'Мой центр', city: city || '', price: 3000, pack: 8, sib2: 10, sib3: 15, tax: 4, kaspiPoint: '', kaspiLink: '', instagram: ''},
    groups: [], families: [], kids: [], leads: [], invoices: [], payments: [], expenses: [], items: [], att: {}, selCur: ['USD', 'RUB']};
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { toast('Не удалось сохранить: память браузера недоступна'); } }
function load() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.v === 2) db = s; } catch (e) {} }
const nid = () => db.seq++;

/* ---------- модель ---------- */
const grp = id => db.groups.find(g => g.id === id);
const fam = id => db.families.find(f => f.id === id);
const kidById = id => db.kids.find(k => k.id === id);
const kidsOf = gid => db.kids.filter(k => k.gid === gid && k.status !== 'left');
const famKids = fid => db.kids.filter(k => k.fid === fid);
const priceOf = gid => (grp(gid) && grp(gid).price) || db.center.price;
const invTotal = fid => db.invoices.filter(i => i.fid === fid).reduce((s, i) => s + i.amount, 0);
const paidOf = fid => db.payments.filter(p => p.fid === fid).reduce((s, p) => s + p.amount, 0);
const debtOf = fid => Math.max(0, invTotal(fid) - paidOf(fid));
const famName = fid => fam(fid) ? fam(fid).parent : 'Без семьи';
const sumBy = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
const monthPay = ym => sumBy(db.payments.filter(p => ymOf(p.date) === ym), p => p.amount);
const monthExp = ym => sumBy(db.expenses.filter(e => ymOf(e.date) === ym), e => e.amount);
const groupsOn = date => db.groups.filter(g => g.days.includes(dowOf(date))).sort((a, b) => a.time.localeCompare(b.time));
const dirs = () => [...new Set(db.groups.map(g => g.dir).filter(Boolean))];

function allocate(fid) {
  let left = paidOf(fid);
  db.invoices.filter(i => i.fid === fid).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id).forEach(i => {
    const cov = Math.min(Math.max(left, 0), i.amount); left -= cov; i.paid = cov;
    if (cov >= i.amount && !i.applied) {
      i.applied = true;
      (i.kids || []).forEach(id => { const k = kidById(id); if (k) { k.left += i.lessons || 0; if (k.status === 'trial') k.status = 'active'; } });
    }
  });
}
function quote(kidIds, lessons, extra) {
  const ks = kidIds.map(kidById).filter(Boolean).sort((a, b) => a.id - b.id);
  let base = 0, fam = 0;
  ks.forEach((k, i) => { const b = lessons * priceOf(k.gid); base += b; fam += b * (i === 0 ? 1 : i === 1 ? 1 - db.center.sib2 / 100 : 1 - db.center.sib3 / 100); });
  const ex = fam * (extra || 0) / 100;
  return {base, sib: base - fam, ex, total: Math.round(fam - ex)};
}
const getAtt = (date, gid) => (db.att[date] && db.att[date][gid]) || {};
function setAtt(date, gid, kid, st) {
  const day = db.att[date] || (db.att[date] = {}), g = day[gid] || (day[gid] = {});
  const k = kidById(kid), prev = g[kid], used = s => s === 'was' || s === 'late';
  if (!k) return;
  if (prev === st) { delete g[kid]; if (used(prev)) k.left += 1; return; }
  if (!used(prev) && used(st)) k.left -= 1;
  if (used(prev) && !used(st)) k.left += 1;
  g[kid] = st;
}
function attStats(kid, days = 30) {
  const from = addDays(TODAY, -days); let was = 0, abs = 0, all = 0;
  Object.keys(db.att).forEach(d => { if (d < from || d > TODAY) return; Object.values(db.att[d]).forEach(g => { const s = g[kid]; if (!s) return; all++; if (s === 'absent') abs++; if (s === 'was' || s === 'late') was++; }); });
  return {was, abs, all};
}
function risk(k) {
  if (k.status === 'left') return {score: 0, why: []};
  const a = attStats(k.id), debt = debtOf(k.fid);
  const s = a.abs * 22 + (k.left <= 2 ? 28 : 0) + (debt > 0 ? 18 : 0) + (k.status === 'trial' ? 12 : 0);
  const why = [];
  if (a.abs >= 2) why.push(a.abs + ' ' + plural(a.abs, 'пропуск', 'пропуска', 'пропусков') + ' за месяц');
  if (k.left <= 2) why.push(k.left <= 0 ? 'занятия закончились' : 'осталось ' + k.left + ' зан.');
  if (debt > 0) why.push('долг ' + money(debt));
  return {score: Math.min(100, s), why};
}
const riskPill = r => r.score >= 70 ? '<span class="pill p-bad">высокий риск</span>' : r.score >= 40 ? '<span class="pill p-warn">средний риск</span>' : '';
const phoneDigits = p => { let d = String(p || '').replace(/\D/g, ''); if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1); if (d.length === 10) d = '7' + d; return d; };
const waLink = (phone, text) => `https://wa.me/${phoneDigits(phone)}?text=${encodeURIComponent(text)}`;

/* ---------- состояние интерфейса ---------- */
let view = 'today', fin = 'overview', filter = 'all', query = '', payFilter = 'all', pd = {fid: 0, method: 'cash'}, curForm = null, priceEdit = 0;
const $view = () => $('#view');
function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, 3200); }
function open(html) { $('#modal').innerHTML = `<div class="ov" data-act="close"><div class="panel" role="dialog" aria-modal="true">${html}</div></div>`; const f = $('.panel input:not([type=hidden]):not([type=checkbox]), .panel select'); if (f && !('ontouchstart' in window)) f.focus(); }
function closeM() { $('#modal').innerHTML = ''; curForm = null; }
const stat = (i, icon, l, v, d, cls = '') => `<div class="card stat" style="${pal(i)}"><span class="ico">${svg(IC[icon])}</span><div class="l">${l}</div><div class="v">${v}</div><div class="d ${cls}">${d}</div></div>`;
const hb = (l, v, max, i, txt) => `<div class="hb" style="${pal(i)}"><span>${esc(l)}</span><div class="ht"><i style="width:${max ? Math.max(3, v / max * 100) : 3}%"></i></div><b>${txt ?? v}</b></div>`;
const empty = (text, act, label) => `<div class="empty-card"><p>${text}</p>${act ? `<button class="btn pri" data-act="${act}">${label}</button>` : ''}</div>`;
const head = (title, sub, actions = '') => `<div class="vhead"><div><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>${actions ? `<div class="bar" style="margin:0">${actions}</div>` : ''}</div>`;

/* ---------- универсальная форма ---------- */
function field(f) {
  const id = 'f-' + f.id, v = f.value ?? '', cls = f.cls ? ` class="${f.cls}"` : '';
  if (f.type === 'select') return `<label${cls}>${f.label}<select id="${id}">${f.options.map(([val, t]) => `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
  if (f.type === 'days') return `<fieldset class="chips-set"><legend>${f.label}</legend>${ORDER.map(d => `<label class="chk"><input type="checkbox" name="${id}" value="${d}" ${v.includes(d) ? 'checked' : ''}>${DSH[d]}</label>`).join('')}</fieldset>`;
  if (f.type === 'checks') return `<fieldset class="chips-set"><legend>${f.label}</legend>${f.options.length ? f.options.map(([val, t]) => `<label class="chk"><input type="checkbox" name="${id}" value="${esc(val)}" ${v.map(String).includes(String(val)) ? 'checked' : ''}>${esc(t)}</label>`).join('') : '<span class="note2" style="margin:0">Нет вариантов</span>'}</fieldset>`;
  if (f.type === 'textarea') return `<label${cls}>${f.label}<textarea id="${id}" ${f.ph ? `placeholder="${esc(f.ph)}"` : ''}>${esc(v)}</textarea></label>`;
  if (f.type === 'html') return f.html;
  const attrs = [f.required ? 'required' : '', f.min != null ? `min="${f.min}"` : '', f.max != null ? `max="${f.max}"` : '', f.step ? `step="${f.step}"` : '', f.ph ? `placeholder="${esc(f.ph)}"` : '', f.list ? `list="${f.list}"` : '', f.type === 'tel' ? 'inputmode="tel"' : '', f.pattern ? `pattern="${f.pattern}"` : ''].join(' ');
  return `<label${cls}>${f.label}<input id="${id}" type="${f.type || 'text'}" value="${esc(v)}" ${attrs}></label>`;
}
function formModal(o) {
  curForm = o;
  open(`<header><div><h2>${o.title}</h2>${o.sub ? `<div class="hsub">${o.sub}</div>` : ''}</div><button class="btn sm" data-act="close">Закрыть</button></header>${o.intro ? `<p class="sub">${o.intro}</p>` : ''}
  <form id="gform" novalidate>${o.fields.filter(f => !f.hiddenField).map(field).join('')}${o.extra || ''}
  <div class="bar" style="margin-top:6px"><button class="btn pri" type="submit">${o.submit || 'Сохранить'}</button>${o.del ? `<button type="button" class="btn danger" data-act="del" data-t="${o.del[0]}" data-id="${o.del[1]}">Удалить</button>` : ''}</div></form>`);
  o.after && o.after();
}
function formVals(o) {
  const r = {};
  o.fields.forEach(f => {
    if (!f.id || f.type === 'html') return;
    const id = 'f-' + f.id;
    if (f.type === 'days') r[f.id] = $$(`input[name="${id}"]:checked`).map(x => +x.value);
    else if (f.type === 'checks') r[f.id] = $$(`input[name="${id}"]:checked`).map(x => x.value);
    else { const el = $('#' + id); r[f.id] = f.type === 'number' ? (el.value === '' ? null : +el.value) : el.value.trim(); }
  });
  return r;
}

/* ---------- тема ---------- */
const root = document.documentElement;
try { const s = localStorage.getItem('zt'); if (s === 'dark' || s === 'light') root.setAttribute('data-theme', s); } catch (e) {}
const effTheme = () => root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
function toggleTheme() { const next = effTheme() === 'dark' ? 'light' : 'dark'; root.setAttribute('data-theme', next); try { localStorage.setItem('zt', next); } catch (e) {} render(); }

/* ===================== ЭКРАНЫ ===================== */

function onboardView() {
  return `<div class="card onb"><div class="mark big">${bunny(64)}</div><h1>Умный Зайка</h1>
  <p class="sub">CRM для детского центра: расписание, ученики, оплаты, финансы. Данные хранятся на этом устройстве.</p>
  <form id="onb"><label>Название вашего центра<input id="o-name" required placeholder="Например: Умный Зайка"></label><label>Город<input id="o-city" placeholder="Астана"></label><button class="btn pri big">Начать с нуля</button></form>
  <div class="bar" style="justify-content:center;margin-top:14px"><button class="btn" data-act="demo">Посмотреть с примерами</button><label class="btn" for="imp">Восстановить из копии</label></div>
  <input type="file" id="imp" accept="application/json,.json" hidden></div>`;
}

function setupChecklist() {
  const steps = [
    [true, 'Название центра', ''],
    [db.groups.length > 0, 'Создать первую группу', 'addgroup'],
    [db.kids.length > 0, 'Добавить учеников', 'addkid'],
    [!!db.center.kaspiLink, 'Привязать Kaspi: ссылку на оплату', 'gokaspi'],
    [db.invoices.length > 0, 'Выставить первый счёт', 'addinv']
  ];
  if (steps.every(s => s[0])) return '';
  return `<div class="card" style="margin-bottom:16px"><h2>Начало работы</h2>${steps.map(([ok, t, act]) => `<div class="row"><span class="stepdot ${ok ? 'ok' : ''}">${ok ? '✓' : ''}</span><div class="grow"><div class="t" style="${ok ? 'color:var(--muted);text-decoration:line-through' : ''}">${t}</div></div>${!ok && act ? `<button class="btn sm pri" data-act="${act}">Сделать</button>` : ''}</div>`).join('')}</div>`;
}

function todayView() {
  const ls = groupsOn(TODAY), active = db.kids.filter(k => k.status === 'active' || k.status === 'trial');
  const debtFam = db.families.filter(f => debtOf(f.id) > 0), debt = sumBy(debtFam, f => debtOf(f.id));
  const risky = active.map(k => ({k, r: risk(k)})).filter(x => x.r.score >= 40).sort((a, b) => b.r.score - a.r.score).slice(0, 5);
  const rev = monthPay(CUR_YM), prev = monthPay(shiftYm(CUR_YM, -1));
  const h = new Date().getHours(), hi = h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
  const inWork = db.leads.filter(l => l.stage < 3).length, trial = db.leads.filter(l => l.stage === 2).length;
  return `${db.demo ? `<div class="banner"><span>Сейчас открыты демо-данные. Когда посмотрите, начните со своими.</span><button class="btn sm" data-act="startreal">Начать со своими данными</button></div>` : ''}
  <div class="hero"><div><h1>${hi}!</h1><p>${DAYS[dowOf(TODAY)]}, ${dmy(TODAY)}. ${esc(db.center.name)}${db.center.city ? ', ' + esc(db.center.city) : ''}.</p>
    <div class="chips"><span class="chip">${ls.length} ${plural(ls.length, 'занятие', 'занятия', 'занятий')} сегодня</span><span class="chip">${active.length} ${plural(active.length, 'ученик', 'ученика', 'учеников')}</span>${debtFam.length ? `<span class="chip">${debtFam.length} ${plural(debtFam.length, 'семья должна', 'семьи должны', 'семей должны')}</span>` : ''}</div></div>${BUNNY_HERO}</div>
  ${setupChecklist()}
  <div class="grid g4" style="margin-bottom:16px">
    ${stat(0, 'pay', 'Выручка за ' + MONTHS_FULL[+CUR_YM.slice(5) - 1], money(rev), prev ? (rev >= prev ? '▲ ' : '▼ ') + pct((rev - prev) / prev * 100).replace(/^[+−]/, '') + ' к прошлому месяцу' : 'оплаты за этот месяц', prev ? (rev >= prev ? 'up' : 'dn') : '')}
    ${stat(3, 'clock', 'Долги семей', money(debt), debtFam.length ? debtFam.length + ' ' + plural(debtFam.length, 'семья', 'семьи', 'семей') : 'долгов нет')}
    ${stat(1, 'leads', 'Заявки в работе', inWork, trial + ' на пробном')}
    ${stat(2, 'alert', 'Риск ухода', risky.filter(x => x.r.score >= 70).length, 'ещё ' + risky.filter(x => x.r.score < 70).length + ' со средним')}
  </div>
  <div class="grid g2">
    <div class="card"><h2>Занятия сегодня</h2>${ls.length ? ls.map(g => {
      const a = getAtt(TODAY, g.id), done = Object.keys(a).length, n = kidsOf(g.id).length;
      return `<div class="row"><div class="time" style="${pal(hashIdx(g.dir))}">${esc(g.time)}</div><div class="grow"><div class="t">${esc(g.name)}</div><div class="m">${dirTag(g.dir)} ${esc(g.teacher || '')}${g.room ? ' · ' + esc(g.room) : ''}</div></div>
      ${n && done >= n ? '<span class="pill p-good">отмечено</span>' : ''}<button class="btn sm pri" data-act="journal" data-id="${g.id}" data-d="${TODAY}">${done ? 'Журнал ' + done + '/' + n : 'Отметить'}</button></div>`;
    }).join('') : db.groups.length ? '<p class="empty">Сегодня занятий нет.</p>' : empty('Пока нет ни одной группы.', 'addgroup', '+ Создать группу')}</div>
    <div class="card"><h2>Риск ухода</h2>${risky.length ? risky.map(({k, r}) => `<div class="row">${av(k.name, k.id)}<div class="grow"><div class="t">${esc(k.name)}</div><div class="m">${r.why.join(', ')}</div></div>${riskPill(r)}<button class="btn sm" data-act="kid" data-id="${k.id}">Открыть</button></div>`).join('') : '<p class="empty">Детей с риском ухода нет.</p>'}</div>
  </div>
  ${ratesMini()}`;
}

function scheduleView() {
  return `${head('Расписание', 'Группы и занятия по дням недели.', '<button class="btn pri" data-act="addgroup">+ Группа</button>')}
  ${db.groups.length ? `<div class="week">${ORDER.map(d => {
    const ls = db.groups.filter(g => g.days.includes(d)).sort((a, b) => a.time.localeCompare(b.time));
    if (!ls.length) return '';
    return `<div class="card day"><h2>${DAYS[d]} ${d === dowOf(TODAY) ? '<span class="pill p-good">сегодня</span>' : ''}</h2>${ls.map(g => `<div class="row"><div class="time" style="${pal(hashIdx(g.dir))}">${esc(g.time)}</div><div class="grow"><div class="t">${esc(g.name)}</div><div class="m">${dirTag(g.dir)} ${esc(g.teacher || '')}${g.room ? ' · ' + esc(g.room) : ''}</div></div><span class="pill p-mute">${kidsOf(g.id).length}/${g.cap || '∞'}</span><button class="btn sm" data-act="journal" data-id="${g.id}">Журнал</button></div>`).join('')}</div>`;
  }).join('')}</div>
  <div class="card" style="margin-top:16px"><h2>Все группы</h2>${db.groups.map(g => `<div class="row"><div class="grow"><div class="t">${esc(g.name)}</div><div class="m">${dirTag(g.dir)} ${g.days.map(d => DSH[d]).join(', ') || 'дни не выбраны'} в ${esc(g.time)} · ${g.ages[0] || '?'}–${g.ages[1] || '?'} лет · ${money(priceOf(g.id))} за занятие</div></div><span class="pill p-mute">${kidsOf(g.id).length}/${g.cap || '∞'}</span><button class="btn sm" data-act="editgroup" data-id="${g.id}">Изменить</button></div>`).join('')}</div>`
  : `<div class="card">${empty('Создайте первую группу: название, направление, педагог, дни и время занятий.', 'addgroup', '+ Создать группу')}</div>`}`;
}

function studentsView() {
  const q = query.toLowerCase();
  const list = db.kids.map(k => ({k, r: risk(k)})).filter(({k, r}) => (!q || k.name.toLowerCase().includes(q) || (fam(k.fid) && fam(k.fid).parent.toLowerCase().includes(q))) &&
    (filter === 'all' ? k.status !== 'left' : filter === 'risk' ? r.score >= 40 : filter === 'debt' ? debtOf(k.fid) > 0 : filter === 'trial' ? k.status === 'trial' : filter === 'nogroup' ? !grp(k.gid) && k.status !== 'left' : filter === 'left' ? k.status === 'left' : true))
    .sort((a, b) => a.k.name.localeCompare(b.k.name, 'ru'));
  const btn = (v, t) => `<button data-act="filter" data-v="${v}" aria-pressed="${filter === v}">${t}</button>`;
  return `${head('Ученики', db.kids.filter(k => k.status !== 'left').length + ' в центре', '<button class="btn pri" data-act="addkid">+ Ученик</button>')}
  <div class="bar"><input type="search" id="q" placeholder="Поиск по ребёнку или родителю" value="${esc(query)}" aria-label="Поиск"><div class="seg">${btn('all', 'Все')}${btn('risk', 'Риск')}${btn('debt', 'С долгом')}${btn('trial', 'Пробные')}${btn('nogroup', 'Без группы')}${btn('left', 'Ушедшие')}</div></div>
  <div class="card">${db.kids.length ? (list.map(({k, r}) => {
    const g = grp(k.gid), d = debtOf(k.fid);
    return `<div class="row">${av(k.name, k.id)}<div class="grow"><div class="t">${esc(k.name)}${k.age ? ', ' + k.age + ' л.' : ''}</div><div class="m">${g ? dirTag(g.dir) + ' ' + esc(g.name) : 'без группы'} · <span style="${k.left <= 0 ? 'color:var(--bad)' : ''}">${k.left} зан.</span>${fam(k.fid) ? ' · ' + esc(fam(k.fid).parent) : ''}</div></div>${k.status !== 'active' ? `<span class="pill p-mute">${STATUSES[k.status]}</span>` : ''}${d ? '<span class="pill p-warn">долг</span>' : ''}${riskPill(r)}<button class="btn sm" data-act="kid" data-id="${k.id}">Открыть</button></div>`;
  }).join('') || '<p class="empty">Никого не найдено.</p>') : empty('Учеников пока нет. Добавьте первого: имя, группу и контакты родителя.', 'addkid', '+ Добавить ученика')}</div>`;
}

function leadsView() {
  const col = i => db.leads.filter(l => l.stage === i).sort((a, b) => b.date.localeCompare(a.date));
  return `${head('Заявки', 'От первого сообщения до покупки абонемента.', '<button class="btn pri" data-act="addlead">+ Заявка</button>')}
  ${db.leads.length ? '' : `<div class="card" style="margin-bottom:16px">${empty('Записывайте сюда каждое обращение из Instagram, WhatsApp и звонков. По ним строится аналитика: откуда приходят и почему отказываются.', 'addlead', '+ Первая заявка')}</div>`}
  <div class="kan">${STAGES.map((s, i) => `<div class="col" style="${pal(STAGEC[i])}"><h3><i></i>${s}<span>${col(i).length}</span></h3>${col(i).map(l => `<div class="lead"><div class="top">${av(l.child || l.parent, l.id)}<div style="min-width:0"><div class="t">${esc(l.child || 'Ребёнок')}${l.age ? ', ' + l.age + ' л.' : ''}</div><div class="m">${esc(l.dir || '—')} · ${esc(l.parent)} · ${esc(l.src)}${i === 4 && l.reason ? ' · ' + esc(l.reason) : ''}</div></div></div>
    <div class="mv">${i > 0 && i < 4 ? `<button class="btn sm" data-act="mv" data-id="${l.id}" data-to="${i - 1}" aria-label="Назад">←</button>` : ''}${i < 2 ? `<button class="btn sm pri" data-act="mv" data-id="${l.id}" data-to="${i + 1}">${STAGES[i + 1]} →</button>` : ''}${i === 2 ? `<button class="btn sm pri" data-act="buy" data-id="${l.id}">Купил →</button>` : ''}${i < 3 ? `<button class="btn sm" data-act="refuse" data-id="${l.id}">Отказ</button>` : ''}${i === 4 ? `<button class="btn sm" data-act="mv" data-id="${l.id}" data-to="0">Вернуть</button>` : ''}<button class="btn sm" data-act="editlead" data-id="${l.id}">Изменить</button>${l.phone ? `<a class="btn sm" href="${waLink(l.phone, 'Здравствуйте! Это ' + db.center.name + '.')}" target="_blank" rel="noopener">WhatsApp</a>` : ''}</div></div>`).join('')}</div>`).join('')}</div>`;
}

/* ---------- финансы ---------- */
function payView() {
  const tabs = [['overview', 'Обзор'], ['payments', 'Оплаты и долги'], ['purchases', 'Закупки'], ['calc', 'Калькулятор'], ['rates', 'Курсы валют']];
  const body = {overview: finOverview, payments: paymentsView, purchases: purchasesView, calc: calcView, rates: ratesView}[fin]();
  return `${head('Финансы', 'Оплаты, долги, расходы, налоги, закупки и курсы валют.')}
  <div class="seg" style="margin-bottom:16px">${tabs.map(([v, t]) => `<button data-act="fin" data-v="${v}" aria-pressed="${fin === v}">${t}</button>`).join('')}</div>${body}`;
}
function finOverview() {
  const rev = monthPay(CUR_YM), exp = monthExp(CUR_YM), profit = rev - exp, tax = rev * db.center.tax / 100;
  const byM = Object.keys(METHODS).map(m => [m, sumBy(db.payments.filter(p => ymOf(p.date) === CUR_YM && p.method === m), p => p.amount)]);
  const maxM = Math.max(1, ...byM.map(x => x[1]));
  const months = lastMonths(6), mr = months.map(m => [monthPay(m), monthExp(m)]), mx = Math.max(1, ...mr.flat());
  const expList = db.expenses.filter(e => ymOf(e.date) === CUR_YM).sort((a, b) => b.date.localeCompare(a.date));
  const byCat = EXP_CATS.map((c, i) => [c, sumBy(expList.filter(e => e.cat === c), e => e.amount), i]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
  const kaspiOn = !!db.center.kaspiLink;
  return `<div class="grid g4" style="margin-bottom:16px">
    ${stat(0, 'pay', 'Выручка за ' + MONTHS_FULL[+CUR_YM.slice(5) - 1], money(rev), 'все принятые оплаты')}
    ${stat(3, 'clock', 'Расходы', money(exp), expList.length + ' ' + plural(expList.length, 'запись', 'записи', 'записей'))}
    ${stat(4, 'leads', 'Прибыль до налога', money(profit), rev ? Math.round(profit / rev * 100) + '% от выручки' : '—', profit < 0 ? 'dn' : '')}
    ${stat(1, 'alert', 'Налог', money(tax), db.center.tax + '% от дохода (меняется в настройках)')}
  </div>
  <div class="card" style="margin-bottom:16px"><h2>Выручка и расходы за 6 месяцев</h2>
    <div class="legend"><span><i style="background:var(--accent)"></i>выручка</span><span><i style="background:var(--c-amber)"></i>расходы</span></div>
    <div class="bars2">${months.map((m, i) => `<div class="mcol"><div class="pair"><div style="height:${mr[i][0] / mx * 100}%;background:var(--accent)" title="${money(mr[i][0])}"></div><div style="height:${mr[i][1] / mx * 100}%;background:var(--c-amber)" title="${money(mr[i][1])}"></div></div><span>${MONTHS[+m.slice(5) - 1]}</span></div>`).join('')}</div></div>
  <div class="grid g2" style="margin-bottom:16px">
    <div class="card"><h2 class="hrow"><span>Расходы за месяц</span><button class="btn sm pri" data-act="addexp">+ Расход</button></h2>
      ${byCat.map(([c, v, i]) => hb(c, v, byCat[0][1], i, money(v))).join('')}
      ${expList.length ? expList.slice(0, 8).map(e => `<div class="row"><div class="grow"><div class="t">${esc(e.cat)}${e.note ? ' · ' + esc(e.note) : ''}</div><div class="m">${dm(e.date)}</div></div><b>${money(e.amount)}</b><button class="btn sm" data-act="editexp" data-id="${e.id}">Изменить</button></div>`).join('') : '<p class="empty">Расходов в этом месяце нет. Добавьте аренду, зарплаты, материалы.</p>'}</div>
    <div class="card"><h2>Как платят в этом месяце</h2>${byM.map(([m, v]) => hb(METHODS[m], v, maxM, MC[m], money(v))).join('')}
      <h2 style="margin-top:18px">Kaspi Pay ${kaspiOn ? '<span class="pill p-good">привязан</span>' : '<span class="pill p-mute">не привязан</span>'}</h2>
      <p class="note2" style="margin:0 0 10px">${kaspiOn ? 'Точка: ' + esc(db.center.kaspiPoint || '—') + '. Ссылка на оплату добавляется в счета, которые вы отправляете в WhatsApp. Оплату отмечайте, когда придёт уведомление Kaspi.' : 'Вставьте ссылку на оплату из приложения Kaspi Pay (Удалённая оплата → Ссылка для оплаты). Она будет добавляться в счета для родителей.'}</p>
      <button class="btn ${kaspiOn ? '' : 'pri'}" data-act="gokaspi">${kaspiOn ? 'Изменить' : 'Привязать Kaspi'}</button></div>
  </div>
  <div class="card"><h2>Налоги и бухгалтер</h2>
    <p style="margin:0 0 10px;color:var(--muted)">Для ИП на упрощённой декларации: форма 910.00 сдаётся до 15 августа и до 15 февраля, налог платится до 25 числа того же месяца. Ставку можно поменять в настройках.</p>
    <div class="bar" style="margin:0"><button class="btn pri" data-act="csv">Выгрузить оплаты за месяц (Excel)</button><button class="btn" data-act="csvexp">Выгрузить расходы (Excel)</button></div></div>`;
}
function paymentsView() {
  const today = db.payments.filter(p => p.date === TODAY), sumT = m => sumBy(today.filter(p => !m || p.method === m), p => p.amount);
  const debtors = db.families.map(f => ({f, d: debtOf(f.id)})).filter(x => x.d > 0).sort((a, b) => b.d - a.d);
  const list = db.payments.filter(p => payFilter === 'all' || p.method === payFilter).slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const invs = db.invoices.slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 30);
  const fb = (v, t) => `<button data-act="pfilter" data-v="${v}" aria-pressed="${payFilter === v}">${t}</button>`;
  return `<div class="bar"><button class="btn pri" data-act="addinv">+ Выставить счёт</button><button class="btn" data-act="addpay">+ Принять оплату</button></div>
  <div class="grid g4" style="margin-bottom:16px">
    ${stat(4, 'pay', 'Принято сегодня', money(sumT()), today.length + ' ' + plural(today.length, 'оплата', 'оплаты', 'оплат'))}
    ${stat(3, 'clock', 'Наличные сегодня', money(sumT('cash')), 'должно быть в кассе')}
    ${stat(2, 'pay', 'Kaspi сегодня', money(sumT('kaspi')), 'сверьте с Kaspi Pay')}
    ${stat(1, 'alert', 'Не оплатили', money(sumBy(debtors, x => x.d)), debtors.length + ' ' + plural(debtors.length, 'семья', 'семьи', 'семей'))}
  </div>
  <div class="card" style="margin-bottom:16px"><h2>Кто должен</h2>${debtors.length ? debtors.map(({f, d}) => `<div class="row">${av(f.parent, f.id)}<div class="grow"><div class="t">${esc(f.parent)}</div><div class="m">выставлено ${money(invTotal(f.id))} · оплачено ${money(paidOf(f.id))}</div></div><b style="color:var(--bad)">${money(d)}</b><button class="btn sm pri" data-act="pay" data-id="${f.id}">Принять</button>${f.phone ? `<a class="btn sm" href="${waLink(f.phone, `Здравствуйте, ${f.parent}! Напоминаем об оплате занятий в «${db.center.name}»: ${money(d)}.${db.center.kaspiLink ? ' Оплатить через Kaspi: ' + db.center.kaspiLink : ''}`)}" target="_blank" rel="noopener">Напомнить</a>` : ''}</div>`).join('') : '<p class="empty">Все счета оплачены.</p>'}</div>
  <div class="card" style="margin-bottom:16px"><h2>Счета</h2>${invs.length ? invs.map(i => `<div class="row">${av(famName(i.fid), i.fid)}<div class="grow"><div class="t">${esc(famName(i.fid))}</div><div class="m">${dm(i.date)} · ${esc(i.note || (i.lessons ? i.lessons + ' зан.' : 'счёт'))}${(i.kids || []).length ? ' · ' + i.kids.map(id => kidById(id) ? esc(kidById(id).name.split(' ')[0]) : '').filter(Boolean).join(', ') : ''}</div></div><b>${money(i.amount)}</b>${(i.paid || 0) >= i.amount ? '<span class="pill p-good">оплачен</span>' : i.paid ? '<span class="pill p-warn">частично</span>' : '<span class="pill p-bad">не оплачен</span>'}<button class="btn sm" data-act="editinv" data-id="${i.id}">Изменить</button></div>`).join('') : empty('Счетов пока нет. Счёт — это сколько семья должна заплатить за абонемент.', 'addinv', '+ Выставить счёт')}</div>
  <div class="card"><h2>Оплаты</h2><div class="seg" style="margin-bottom:8px">${fb('all', 'Все')}${fb('cash', 'Наличные')}${fb('kaspi', 'Kaspi')}${fb('transfer', 'Перевод')}</div>
    ${list.length ? list.slice(0, 60).map(p => `<div class="row">${av(famName(p.fid), p.fid || 0)}<div class="grow"><div class="t">${esc(famName(p.fid))}</div><div class="m">${dm(p.date)} ${mtag(p.method)}${p.note ? ' · ' + esc(p.note) : ''}</div></div><b>${money(p.amount)}</b><button class="btn sm" data-act="editpay" data-id="${p.id}">Изменить</button></div>`).join('') : '<p class="empty">Оплат пока нет.</p>'}</div>`;
}

/* ---------- закупки ---------- */
const curP = it => it.h[it.h.length - 1][1];
const prevP = it => it.h.length > 1 ? it.h[it.h.length - 2][1] : curP(it);
function spark(h, color) {
  const v = h.map(x => x[1]), mn = Math.min(...v), mx = Math.max(...v), w = 120, ht = 34, p = 4;
  const pts = v.map((y, i) => [p + i * (w - 2 * p) / Math.max(1, v.length - 1), mx === mn ? ht / 2 : ht - p - (y - mn) / (mx - mn) * (ht - 2 * p)]);
  const last = pts[pts.length - 1];
  return `<svg viewBox="0 0 ${w} ${ht}" width="${w}" height="${ht}" aria-hidden="true"><polyline points="${pts.map(q => q.map(n => n.toFixed(1)).join(',')).join(' ')}" fill="none" style="stroke:${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="3.2" style="fill:${color}"/></svg>`;
}
function purchasesView() {
  const items = db.items;
  const up = items.filter(i => curP(i) > prevP(i)).length, down = items.filter(i => curP(i) < prevP(i)).length, buy = items.filter(i => i.target > 0 && curP(i) <= i.target).length;
  return `<div class="bar"><button class="btn pri" data-act="additem">+ Товар в список</button></div>
  <div class="grid g4" style="margin-bottom:16px">${stat(0, 'leads', 'В списке', items.length, 'товаров для закупки')}${stat(2, 'alert', 'Подорожало', up, 'к прошлой записи', up ? 'dn' : '')}${stat(4, 'mk', 'Подешевело', down, 'к прошлой записи', down ? 'up' : '')}${stat(1, 'pay', 'Можно покупать', buy, 'цена не выше вашей цели')}</div>
  ${items.length ? `<div class="grid g2">${items.map(it => {
    const cur = curP(it), prev = prevP(it), first = it.h[0][1], d = (cur - prev) / prev * 100, all = (cur - first) / first * 100;
    const col = cur > prev ? 'var(--bad)' : cur < prev ? 'var(--good)' : 'var(--muted)';
    const chg = cur > prev ? `<span class="pill p-bad">▲ ${pct(d)}</span>` : cur < prev ? `<span class="pill p-good">▼ ${pct(d)}</span>` : '<span class="pill p-mute">без изменений</span>';
    const goal = it.target > 0 ? (cur <= it.target ? `<span class="pill p-good">ниже цели ${money(it.target)}: можно покупать</span>` : `<span class="pill p-mute">цель ${money(it.target)}, выше на ${money(cur - it.target)}</span>`) : '';
    return `<div class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:start"><div style="min-width:0"><div class="t" style="font-weight:600;overflow-wrap:anywhere">${esc(it.name)}</div><div class="note2" style="margin:2px 0 0">${esc(it.unit)} · ${it.link ? `<a href="${esc(it.link)}" target="_blank" rel="noopener">открыть товар</a>` : 'без ссылки'}</div></div>${spark(it.h, col)}</div>
      <div style="display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;margin:10px 0 6px"><span class="bignum">${money(cur)}</span>${chg}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${goal}</div>
      <p class="note2">С первой записи (${dmy(it.h[0][0])}): ${pct(all)}. Записей цены: ${it.h.length}.</p>
      <div class="bar" style="margin:10px 0 0"><button class="btn sm pri" data-act="itemprice" data-id="${it.id}">Обновить цену</button><button class="btn sm" data-act="edititem" data-id="${it.id}">Изменить</button></div></div>`;
  }).join('')}</div>` : `<div class="card">${empty('Добавьте товары, которые регулярно покупаете (бумага, краски, конструкторы). Обновляйте цену, когда смотрите её в магазине, и приложение покажет, насколько она выросла или упала.', 'additem', '+ Добавить товар')}</div>`}
  <p class="note2">Цены вносятся вручную. Автоматически читать цены с Kaspi.kz приложение не умеет.</p>`;
}

/* ---------- калькулятор ---------- */
function calcView() {
  const c = db.center;
  return `<div class="grid g2"><div class="card"><h2>Калькулятор абонемента</h2><form id="calc">
    <label>Занятий в абонементе<input id="c-n" type="number" min="1" value="${c.pack}"></label>
    <label>Цена за занятие, ₸<input id="c-p" type="number" min="0" value="${c.price}"></label>
    <label>Детей в семье<select id="c-k"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></label>
    <label>Дополнительная скидка, %<input id="c-d" type="number" min="0" max="100" value="0"></label>
    <label>Способ оплаты<select id="c-m"><option value="cash">Наличные</option><option value="kaspi">Kaspi</option><option value="transfer">Перевод</option></select></label>
    <label id="c-rl">Получено наличными, ₸<input id="c-r" type="number" min="0" placeholder="Сколько дал клиент"></label></form></div>
  <div class="card" id="calcOut"></div></div>`;
}
function updateCalc() {
  const n = +$('#c-n').value || 0, p = +$('#c-p').value || 0, k = +$('#c-k').value || 1, m = $('#c-m').value, c = db.center;
  const d = Math.min(100, Math.max(0, +$('#c-d').value || 0)), base = n * p;
  let fam = 0; for (let i = 0; i < k; i++) fam += base * (i === 0 ? 1 : i === 1 ? 1 - c.sib2 / 100 : 1 - c.sib3 / 100);
  const sib = base * k - fam, ex = fam * d / 100, total = fam - ex, cnt = n * k;
  $('#c-rl').hidden = m !== 'cash';
  const rvRaw = $('#c-r').value, rv = rvRaw === '' ? null : +rvRaw;
  $('#calcOut').innerHTML = `<h2>Итог</h2>
    <div class="row"><div class="grow">Без скидок (${k} × ${n} зан.)</div><b>${money(base * k)}</b></div>
    <div class="row"><div class="grow">Семейная скидка (2-й −${c.sib2}%, 3-й и далее −${c.sib3}%)</div><b>−${money(sib)}</b></div>
    <div class="row"><div class="grow">Дополнительная скидка ${d}%</div><b>−${money(ex)}</b></div>
    <div class="row"><div class="grow t">К оплате</div><b class="bignum">${money(total)}</b></div>
    <p class="note2">В среднем ${money(cnt ? total / cnt : 0)} за занятие.</p>
    ${m === 'cash' && rv !== null ? `<div class="preview">${rv >= total ? 'Сдача: <b>' + money(rv - total) + '</b>' : 'Не хватает: <b>' + money(total - rv) + '</b>'}</div>` : ''}`;
}

/* ---------- курсы валют ---------- */
let RATES_DATE = '2026-10-29';
let RATES = [
  ['USD', 'Доллар США', 1, 457.09], ['RUB', 'Российский рубль', 1, 5.67], ['EUR', 'Евро', 1, 508.42], ['CNY', 'Китайский юань', 1, 68.56],
  ['KGS', 'Киргизский сом', 1, 5.23], ['UZS', 'Узбекский сум', 100, 3.81], ['TRY', 'Турецкая лира', 1, 9.17], ['AED', 'Дирхам ОАЭ', 1, 124.45],
  ['GBP', 'Фунт стерлингов', 1, 606.79], ['KRW', 'Южнокорейская вона', 100, 34.15], ['JPY', 'Японская иена', 1, 2.89], ['CHF', 'Швейцарский франк', 1, 550.51],
  ['AUD', 'Австралийский доллар', 1, 321.2], ['AZN', 'Азербайджанский манат', 1, 269.67], ['AMD', 'Армянский драм', 10, 12.8], ['BYN', 'Белорусский рубль', 1, 155.37],
  ['BRL', 'Бразильский реал', 1, 85.45], ['HUF', 'Венгерский форинт', 10, 13.85], ['VND', 'Вьетнамский донг', 1000, 17.68], ['HKD', 'Гонконгский доллар', 1, 58.27],
  ['GEL', 'Грузинский лари', 1, 178.2], ['DKK', 'Датская крона', 1, 68.03], ['EGP', 'Египетский фунт', 1, 8.14], ['ILS', 'Израильский шекель', 1, 146.77],
  ['INR', 'Индийская рупия', 1, 4.8], ['IDR', 'Индонезийская рупия', 1000, 25.15], ['IRR', 'Иранский риал', 10000, 2.46], ['CAD', 'Канадский доллар', 1, 325.26],
  ['QAR', 'Катарский риал', 1, 125.4], ['KWD', 'Кувейтский динар', 1, 1482.61], ['MYR', 'Малайзийский ринггит', 1, 112.2], ['MXN', 'Мексиканское песо', 1, 24.5],
  ['MDL', 'Молдавский лей', 1, 25.61], ['MNT', 'Монгольский тугрик', 100, 12.7], ['NOK', 'Норвежская крона', 1, 49.04], ['OMR', 'Оманский риал', 1, 1187.28],
  ['PKR', 'Пакистанская рупия', 1, 1.65], ['PLN', 'Польский злотый', 1, 115.37], ['SAR', 'Саудовский риял', 1, 121.81], ['RON', 'Румынский лей', 1, 95.08],
  ['XDR', 'СДР', 1, 618.27], ['SGD', 'Сингапурский доллар', 1, 356.46], ['TJS', 'Таджикский сомони', 1, 49.9], ['THB', 'Тайский бат', 1, 13.54],
  ['UAH', 'Украинская гривна', 1, 10.03], ['CZK', 'Чешская крона', 1, 20.87], ['SEK', 'Шведская крона', 1, 46], ['ZAR', 'Южноафриканский рэнд', 1, 27.44]
];
let RHIST = {
  USD: [['2026-09-30', 439.37], ['2026-10-01', 440.86], ['2026-10-02', 441.91], ['2026-10-05', 447.73], ['2026-10-06', 454.98], ['2026-10-23', 447.94], ['2026-10-27', 451.05], ['2026-10-29', 457.09]],
  RUB: [['2026-09-30', 5.22], ['2026-10-01', 5.27], ['2026-10-02', 5.30], ['2026-10-05', 5.35], ['2026-10-06', 5.37], ['2026-10-23', 5.52], ['2026-10-27', 5.60], ['2026-10-29', 5.67]]
};
let ratesLive = false;
const rateOf = c => RATES.find(r => r[0] === c);
const fmtR = n => n.toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const selCur = () => (db && db.selCur && db.selCur.filter(rateOf).length ? db.selCur.filter(rateOf) : ['USD', 'RUB']);
function applyRates(j) {
  if (!j || !j.rates || !j.date) return;
  const names = Object.fromEntries(RATES.map(r => [r[0], r[1]]));
  const front = ['USD', 'RUB', 'EUR', 'CNY', 'KGS', 'UZS'];
  RATES = Object.entries(j.rates).map(([c, v]) => [c, names[c] || v.name || c, v.nom || 1, v.rate])
    .sort((a, b) => (front.indexOf(a[0]) + 1 || 99) - (front.indexOf(b[0]) + 1 || 99) || a[1].localeCompare(b[1], 'ru'));
  RATES_DATE = j.date;
  if (j.history) Object.entries(j.history).forEach(([c, h]) => { const m = new Map((RHIST[c] || []).map(x => [x[0], x[1]])); h.forEach(([d, r]) => m.set(d, r)); RHIST[c] = [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])); });
  ratesLive = true;
}
function curChange(c) {
  const h = RHIST[c]; if (!h || h.length < 2) return null;
  const cur = h[h.length - 1][1], prev = h[h.length - 2][1], first = h[0][1];
  return {d: cur - prev, p: (cur - prev) / prev * 100, prevDate: h[h.length - 2][0], firstDate: h[0][0], all: (cur - first) / first * 100, h: h.slice(-30)};
}
function chgPill(ch) {
  if (!ch) return '<span class="pill p-mute">нет истории</span>';
  const s = (ch.d > 0 ? '+' : ch.d < 0 ? '−' : '') + fmtR(Math.abs(ch.d)) + ' ₸ (' + pct(ch.p) + ')';
  return ch.d > 0 ? `<span class="pill p-bad">▲ ${s} к ${dm(ch.prevDate)}</span>` : ch.d < 0 ? `<span class="pill p-good">▼ ${s} к ${dm(ch.prevDate)}</span>` : `<span class="pill p-mute">без изменений к ${dm(ch.prevDate)}</span>`;
}
function curCard(c) {
  const [code, name, nom, rate] = rateOf(c), ch = curChange(c);
  const col = !ch ? 'var(--muted)' : ch.d > 0 ? 'var(--bad)' : ch.d < 0 ? 'var(--good)' : 'var(--muted)';
  return `<div class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:start"><div style="min-width:0"><div class="t" style="font-weight:700">${nom > 1 ? nom + ' ' : ''}${code} → KZT</div><div class="note2" style="margin:2px 0 0">${esc(name)}</div></div>${ch ? spark(ch.h, col) : ''}</div>
    <div style="display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;margin:10px 0 6px"><span class="bignum">${fmtR(rate)} ₸</span>${chgPill(ch)}</div>
    ${ch ? `<p class="note2">С ${dmy(ch.firstDate)}: ${pct(ch.all)}. ${ch.d > 0 ? 'Тенге ослаб к этой валюте.' : ch.d < 0 ? 'Тенге укрепился к этой валюте.' : ''}</p>` : '<p class="note2">История по этой валюте появится после следующих обновлений.</p>'}
    ${selCur().length > 1 ? `<div class="bar" style="margin:10px 0 0"><button class="btn sm" data-act="curdel" data-c="${code}">Убрать</button></div>` : ''}</div>`;
}
function ratesMini() {
  return `<div class="card" style="margin-top:16px"><h2 class="hrow"><span>Курсы НБ РК на ${dmy(RATES_DATE)}</span><button class="btn sm" data-act="gorates">Все курсы</button></h2>
    ${selCur().map(c => { const [code, name, nom, rate] = rateOf(c); return `<div class="row"><div class="grow"><div class="t">${nom > 1 ? nom + ' ' : ''}${code}</div><div class="m">${esc(name)}</div></div><b style="font-variant-numeric:tabular-nums">${fmtR(rate)} ₸</b>${chgPill(curChange(c))}</div>`; }).join('')}</div>`;
}
function ratesView() {
  const sel = selCur(), rest = RATES.filter(r => !sel.includes(r[0]));
  return `<div class="grid g2" style="margin-bottom:16px">${sel.map(curCard).join('')}</div>
  <div class="grid g2" style="margin-bottom:16px">
    <div class="card"><h2>Выбрать валюты</h2><p class="note2" style="margin:-4px 0 10px">По умолчанию рубль и доллар. Можно добавить любые.</p>
      <div class="bar" style="margin:0"><select id="cur-add" aria-label="Валюта">${rest.map(r => `<option value="${r[0]}">${r[0]} · ${esc(r[1])}</option>`).join('')}</select><button class="btn pri" data-act="curadd">Добавить</button><button class="btn" data-act="curreset">Сбросить</button></div></div>
    <div class="card"><h2>Конвертер</h2><form id="conv"><div class="grid g4">
      <label>Сумма<input id="cv-a" type="number" min="0" step="any" value="100"></label>
      <label>Валюта<select id="cv-c">${RATES.map(r => `<option value="${r[0]}" ${r[0] === 'USD' ? 'selected' : ''}>${r[0]}</option>`).join('')}</select></label>
      <label>Направление<select id="cv-d"><option value="to">в тенге</option><option value="from">из тенге</option></select></label></div></form>
      <div class="preview" id="cv-out" style="margin-top:12px"></div></div>
  </div>
  <div class="card"><h2>Все официальные курсы на ${dmy(RATES_DATE)}</h2>
    <div class="bar"><input type="search" id="rq" placeholder="Поиск: код или название" aria-label="Поиск валюты"></div>
    <div class="tblw"><table class="tbl" id="rtbl"><thead><tr><th>Код</th><th>Валюта</th><th class="n">Номинал</th><th class="n">Курс, ₸</th><th class="n">Изменение</th></tr></thead><tbody>${RATES.map(([c, n, nom, r]) => { const ch = curChange(c); return `<tr data-s="${esc((c + ' ' + n).toLowerCase())}"><td>${nom > 1 ? nom + ' ' : ''}<b>${c}</b></td><td>${esc(n)}</td><td class="n">${nom}</td><td class="n">${fmtR(r)}</td><td class="n" style="color:${!ch ? 'var(--muted)' : ch.d > 0 ? 'var(--bad)' : ch.d < 0 ? 'var(--good)' : 'var(--muted)'}">${ch ? (ch.d > 0 ? '▲ ' : ch.d < 0 ? '▼ ' : '') + pct(ch.p) : '—'}</td></tr>`; }).join('')}</tbody></table></div>
    <p class="note2">Источник: <a href="https://nationalbank.kz/ru/exchangerates/ezhednevnye-oficialnye-rynochnye-kursy-valyut" target="_blank" rel="noopener">Национальный банк РК</a>. ${ratesLive ? 'Курсы обновляются автоматически каждый день.' : 'Показан сохранённый снимок курсов: свежие загрузятся, когда будет интернет.'}</p></div>`;
}
function updateConv() {
  const a = +$('#cv-a').value || 0, r = rateOf($('#cv-c').value), per = r[3] / r[2];
  $('#cv-out').innerHTML = $('#cv-d').value === 'to'
    ? `${a.toLocaleString('ru-RU')} ${r[0]} = <b>${(a * per).toLocaleString('ru-RU', {maximumFractionDigits: 2})} ₸</b>`
    : `${a.toLocaleString('ru-RU')} ₸ = <b>${(a / per).toLocaleString('ru-RU', {maximumFractionDigits: 2})} ${r[0]}</b>`;
}

/* ---------- аналитика ---------- */
function analyticsView() {
  const from = addDays(TODAY, -30), L = db.leads, L30 = L.filter(l => l.date >= from);
  const count = (arr, f) => { const m = {}; arr.forEach(x => { const k = f(x) || 'Не указано'; m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const src = count(L, l => l.src), dirsC = count(L, l => l.dir), why = count(L.filter(l => l.stage === 4), l => l.reason);
  const bought = L.filter(l => l.stage === 3).length, conv = L.length ? Math.round(bought / L.length * 100) : 0;
  const reached = i => L.filter(l => l.stage !== 4 ? l.stage >= i : (l.maxStage || 0) >= i).length;
  let was = 0, all = 0; Object.keys(db.att).forEach(d => { if (d < from) return; Object.values(db.att[d]).forEach(g => Object.values(g).forEach(s => { all++; if (s === 'was' || s === 'late') was++; })); });
  const cap = sumBy(db.groups, g => g.cap || 0), filled = sumBy(db.groups, g => kidsOf(g.id).length);
  const block = (title, rows, i0) => `<div class="card"><h2>${title}</h2>${rows.length ? rows.map(([l, v], i) => hb(l, v, rows[0][1], i0 === null ? hashIdx(l) : i0 + i)).join('') : '<p class="empty">Пока нет данных.</p>'}</div>`;
  return `${head('Аналитика', 'Считается по вашим заявкам, посещаемости и группам.')}
  <div class="grid g4" style="margin-bottom:16px">
    ${stat(0, 'leads', 'Заявок за 30 дней', L30.length, 'всего в базе ' + L.length)}
    ${stat(4, 'pay', 'Конверсия в покупку', conv + '%', bought + ' из ' + L.length + ' купили')}
    ${stat(1, 'students', 'Посещаемость', all ? Math.round(was / all * 100) + '%' : '—', 'за 30 дней, ' + all + ' отметок')}
    ${stat(3, 'schedule', 'Заполненность групп', cap ? Math.round(filled / cap * 100) + '%' : '—', filled + ' мест из ' + cap)}
  </div>
  <div class="grid g2" style="margin-bottom:16px">${block('Откуда приходят', src, 0)}
    <div class="card"><h2>Воронка</h2>${L.length ? hb('Заявки', L.length, L.length, 1) + hb('Связались', reached(1), L.length, 0) + hb('Пробное', reached(2), L.length, 3) + hb('Купили', bought, L.length, 4) : '<p class="empty">Пока нет данных.</p>'}</div></div>
  <div class="grid g2" style="margin-bottom:16px">${block('Что интересует', dirsC, null)}${block('Почему отказываются', why, 2)}</div>
  <div class="card"><h2>Группы: заполненность</h2>${db.groups.length ? db.groups.map(g => hb(g.name, kidsOf(g.id).length, g.cap || Math.max(1, kidsOf(g.id).length), hashIdx(g.dir), kidsOf(g.id).length + '/' + (g.cap || '∞'))).join('') : '<p class="empty">Групп пока нет.</p>'}
    <p class="note2">Охваты Instagram, лайки и реклама появятся в версии с сервером: для них нужно одобрение Meta.</p></div>`;
}

/* ---------- настройки ---------- */
function settingsView() {
  const c = db.center;
  const bytes = (() => { try { return (localStorage.getItem(KEY) || '').length; } catch (e) { return 0; } })();
  return `${head('Настройки', 'Центр, цены, Kaspi и ваши данные.')}
  <div class="grid g2">
    <div class="card"><h2>Центр и цены</h2><form id="cf">
      <label>Название центра<input id="s-name" required value="${esc(c.name)}"></label>
      <label>Город<input id="s-city" value="${esc(c.city)}"></label>
      <div class="grid g4"><label>Цена занятия, ₸<input id="s-price" type="number" min="0" value="${c.price}"></label><label>Занятий в абонементе<input id="s-pack" type="number" min="1" value="${c.pack}"></label></div>
      <div class="grid g4"><label>Скидка 2-му ребёнку, %<input id="s-sib2" type="number" min="0" max="100" value="${c.sib2}"></label><label>Скидка 3-му и далее, %<input id="s-sib3" type="number" min="0" max="100" value="${c.sib3}"></label></div>
      <label>Налог, % от дохода<input id="s-tax" type="number" min="0" max="50" step="0.1" value="${c.tax}"></label>
      <label>Instagram центра<input id="s-ig" value="${esc(c.instagram)}" placeholder="@umny_zayka"></label>
      <button class="btn pri">Сохранить</button></form></div>
    <div class="card" id="kaspi-card"><h2>Kaspi Pay</h2><form id="kf">
      <p class="note2" style="margin:-4px 0 6px">В приложении Kaspi Pay откройте «Удалённая оплата» → «Ссылка для оплаты» и скопируйте ссылку. Она будет добавляться в счета и напоминания родителям.</p>
      <label>Название точки продаж<input id="k-point" value="${esc(c.kaspiPoint)}" placeholder="Умный Зайка, Астана"></label>
      <label>Ссылка для оплаты<input id="k-link" type="url" value="${esc(c.kaspiLink)}" placeholder="https://"></label>
      <div class="bar" style="margin:0"><button class="btn pri">Сохранить</button>${c.kaspiLink ? '<button type="button" class="btn" data-act="kaspioff">Отвязать</button>' : ''}</div>
      <p class="note2">Подтверждение оплаты пока ручное: отмечайте оплату, когда придёт уведомление Kaspi.</p></form></div>
  </div>
  <div class="card" style="margin-top:16px"><h2>Ваши данные</h2>
    <p class="note2" style="margin:-4px 0 10px">Все данные хранятся только на этом устройстве (${Math.ceil(bytes / 1024)} КБ). Если очистить данные браузера или потерять телефон, они пропадут. Раз в неделю сохраняйте резервную копию и держите файл в надёжном месте.</p>
    <div class="bar" style="margin:0"><button class="btn pri" data-act="backup">Сохранить резервную копию</button><label class="btn" for="imp">Восстановить из копии</label><input type="file" id="imp" accept="application/json,.json" hidden>
    <button class="btn danger" data-act="del" data-t="all" data-id="0">Удалить все данные</button></div>
    <p class="note2">Восстановление заменит текущие данные данными из файла.</p></div>`;
}

/* ===================== ОКНА ===================== */
function journalModal(gid, date) {
  const g = grp(gid); if (!g) return;
  date = date || (g.days.includes(dowOf(TODAY)) ? TODAY : lastLessonDate(g));
  const list = kidsOf(gid).sort((a, b) => a.name.localeCompare(b.name, 'ru')), a = getAtt(date, gid), isLesson = g.days.includes(dowOf(date));
  open(`<header><div><h2>${esc(g.name)}</h2><div class="hsub">${dirTag(g.dir)} ${esc(g.teacher || '')} · ${g.days.map(d => DSH[d]).join(', ')} в ${esc(g.time)}</div></div><button class="btn sm" data-act="close">Закрыть</button></header>
  <div class="bar"><label style="display:flex;gap:8px;align-items:center;font-size:14px">Дата <input type="date" id="j-date" value="${date}" max="${TODAY}" data-g="${gid}"></label><button class="btn sm" data-act="editgroup" data-id="${gid}">Изменить группу</button></div>
  ${!isLesson ? `<p class="note2" style="margin:-4px 0 10px">В этот день у группы нет занятия по расписанию. Отметить всё равно можно (например, перенос).</p>` : ''}
  ${list.length ? `<div class="card" style="margin-bottom:12px;box-shadow:none"><h2>Быстрая отметка текстом</h2><textarea id="vt" placeholder="Например: все были, кроме Маши, Тимур опоздал"></textarea><div class="bar" style="margin:8px 0 0"><button class="btn" data-act="parse" data-id="${gid}" data-d="${date}">Разобрать</button><button class="btn" data-act="allwas" data-id="${gid}" data-d="${date}">Все были</button></div><div id="pv"></div></div>` : ''}
  ${list.map(k => `<div class="row">${av(k.name, k.id)}<div class="grow"><div class="t">${esc(k.name)}</div><div class="m" style="${k.left <= 0 ? 'color:var(--bad)' : ''}">осталось ${k.left} зан.</div></div><div class="st">${['was', 'late', 'absent', 'excused'].map(s => `<button class="s-${s}" data-act="set" data-g="${gid}" data-k="${k.id}" data-s="${s}" data-d="${date}" aria-pressed="${a[k.id] === s}">${STN[s]}</button>`).join('')}</div></div>`).join('') || empty('В группе пока нет учеников.', 'addkid', '+ Добавить ученика')}
  <p class="note2">«Был» и «опоздал» списывают занятие с абонемента. Нажмите статус ещё раз, чтобы снять отметку.</p>`);
}
function lastLessonDate(g) { for (let i = 0; i < 7; i++) { const d = addDays(TODAY, -i); if (g.days.includes(dowOf(d))) return d; } return TODAY; }
let pending = {};
function parseVoice(text, gid) {
  const t = text.toLowerCase().replace(/ё/g, 'е'), list = kidsOf(gid), out = {};
  if (/\bвсе\b/.test(t)) list.forEach(k => out[k.id] = 'was');
  const ALIAS = {мария: ['маша'], александр: ['саша'], александра: ['саша'], елизавета: ['лиза'], екатерина: ['катя'], анастасия: ['настя'], софья: ['соня'], софия: ['соня'], дмитрий: ['дима'], михаил: ['миша'], артем: ['тема'], алексей: ['леша'], никита: [], иван: ['ваня'], анна: ['аня'], дарья: ['даша'], евгений: ['женя'], егор: ['гоша'], владимир: ['вова'], сергей: ['сережа'], ксения: ['ксюша'], полина: ['поля'], виктория: ['вика']};
  const names = k => { const f = k.name.toLowerCase().replace(/ё/g, 'е').split(/\s+/)[0]; return [f, ...(ALIAS[f] || [])]; };
  const find = part => list.filter(k => names(k).some(n => { const stem = n.slice(0, Math.max(3, n.length - 1)); return part.split(/\s+/).some(w => w.startsWith(stem)); }));
  t.split(/[,.;]|\sи\s|\sа\s/).forEach(part => {
    let st = null;
    if (/болеет|болел|заболел|простуд|уважит/.test(part)) st = 'excused';
    else if (/опозда/.test(part)) st = 'late';
    else if (/кроме|не был|не приш|нет |отсутств|прогул/.test(part + ' ')) st = 'absent';
    else if (/был|приш|на месте/.test(part) && !/\bвсе\b/.test(part)) st = 'was';
    if (st) find(part).forEach(k => out[k.id] = st);
  });
  return out;
}

function groupForm(g) {
  g = g || {name: '', dir: '', teacher: '', room: '', ages: [null, null], cap: 8, days: [], time: '16:00', price: null};
  formModal({title: g.id ? 'Группа' : 'Новая группа', submit: g.id ? 'Сохранить' : 'Создать группу', del: g.id ? ['group', g.id] : null,
    fields: [
      {id: 'name', label: 'Название группы', value: g.name, required: true, ph: 'Например: Совята'},
      {id: 'dir', label: 'Направление', value: g.dir, list: 'dirs-list', ph: 'Английский, Робототехника…'},
      {id: 'teacher', label: 'Педагог', value: g.teacher},
      {id: 'room', label: 'Кабинет', value: g.room},
      {type: 'html', html: `<datalist id="dirs-list">${dirs().map(d => `<option value="${esc(d)}">`).join('')}</datalist><div class="grid g4">${field({id: 'a1', label: 'Возраст от', type: 'number', min: 1, max: 18, value: g.ages[0] ?? ''})}${field({id: 'a2', label: 'Возраст до', type: 'number', min: 1, max: 18, value: g.ages[1] ?? ''})}${field({id: 'cap', label: 'Мест в группе', type: 'number', min: 1, value: g.cap ?? ''})}${field({id: 'time', label: 'Время', type: 'time', value: g.time, required: true})}</div>`},
      {id: 'days', label: 'Дни занятий', type: 'days', value: g.days},
      {id: 'price', label: 'Цена занятия, ₸ (пусто — как в настройках: ' + money(db.center.price) + ')', type: 'number', min: 0, value: g.price ?? ''}
    ].concat([{id: 'a1', type: 'number', hiddenField: true}, {id: 'a2', type: 'number', hiddenField: true}, {id: 'cap', type: 'number', hiddenField: true}, {id: 'time', type: 'time', hiddenField: true}]),
    onSubmit: v => {
      if (!v.name) return 'Укажите название группы';
      if (!v.days.length) return 'Выберите хотя бы один день занятий';
      const data = {name: v.name, dir: v.dir, teacher: v.teacher, room: v.room, ages: [v.a1, v.a2], cap: v.cap, days: v.days, time: v.time || '16:00', price: v.price || null};
      if (g.id) Object.assign(grp(g.id), data); else db.groups.push({id: nid(), ...data});
      return g.id ? 'Группа сохранена' : 'Группа создана';
    }});
}

function kidForm(k, preset) {
  const isNew = !k;
  k = k || Object.assign({name: '', age: null, gid: db.groups[0] ? db.groups[0].id : 0, status: 'active', left: 0, fid: 0, note: ''}, preset || {});
  const f = fam(k.fid) || {parent: (preset && preset.parent) || '', phone: (preset && preset.phone) || ''};
  formModal({title: isNew ? 'Новый ученик' : 'Ученик', submit: isNew ? 'Добавить' : 'Сохранить', del: isNew ? null : ['kid', k.id],
    fields: [
      {id: 'name', label: 'Имя и фамилия ребёнка', value: k.name, required: true},
      {type: 'html', html: `<div class="grid g4">${field({id: 'age', label: 'Возраст', type: 'number', min: 1, max: 18, value: k.age ?? ''})}${field({id: 'left', label: 'Осталось занятий', type: 'number', value: k.left})}</div>`},
      {id: 'gid', label: 'Группа', type: 'select', value: k.gid, options: [[0, 'Без группы']].concat(db.groups.map(g => [g.id, g.name + (g.dir ? ' · ' + g.dir : '')]))},
      {id: 'status', label: 'Статус', type: 'select', value: k.status, options: Object.entries(STATUSES)},
      {id: 'fam', label: 'Семья', type: 'select', value: k.fid || 0, options: [[0, '+ Новая семья']].concat(db.families.map(x => [x.id, x.parent + (x.phone ? ' · ' + x.phone : '')]))},
      {id: 'parent', label: 'Родитель (имя)', value: f.parent},
      {id: 'phone', label: 'Телефон родителя (для WhatsApp)', type: 'tel', value: f.phone, ph: '+7 7__ ___ __ __'},
      {id: 'note', label: 'Заметка (аллергии, кто забирает и т. п.)', type: 'textarea', value: k.note},
      {id: 'age', type: 'number', hiddenField: true}, {id: 'left', type: 'number', hiddenField: true}
    ],
    after: () => { $('#f-fam').addEventListener('change', e => { const x = fam(+e.target.value); $('#f-parent').value = x ? x.parent : ''; $('#f-phone').value = x ? x.phone : ''; }); },
    onSubmit: v => {
      if (!v.name) return 'Укажите имя ребёнка';
      let fid = +v.fam;
      if (!fid) { if (!v.parent) return 'Укажите имя родителя'; fid = nid(); db.families.push({id: fid, parent: v.parent, phone: v.phone}); }
      else { const x = fam(fid); if (v.parent) x.parent = v.parent; x.phone = v.phone; }
      const data = {name: v.name, age: v.age, gid: +v.gid, status: v.status, left: v.left ?? 0, fid, note: v.note};
      if (isNew) { db.kids.push({id: nid(), ...data}); if (preset && preset.leadId) { const l = db.leads.find(x => x.id === preset.leadId); if (l) { l.stage = 3; l.maxStage = 3; } } }
      else Object.assign(kidById(k.id), data);
      return isNew ? 'Ученик добавлен' : 'Сохранено';
    }});
}

function kidModal(id) {
  const k = kidById(id); if (!k) return;
  const g = grp(k.gid), f = fam(k.fid), r = risk(k), a = attStats(k.id), debt = debtOf(k.fid);
  const hist = [];
  Object.keys(db.att).sort().reverse().forEach(d => Object.entries(db.att[d]).forEach(([gid, m]) => { if (m[k.id]) hist.push([d, +gid, m[k.id]]); }));
  open(`<header><div style="display:flex;gap:12px;align-items:center">${av(k.name, k.id)}<div><h2>${esc(k.name)}</h2><div class="hsub">${k.age ? k.age + ' лет · ' : ''}${g ? esc(g.name) : 'без группы'} · ${STATUSES[k.status]}</div></div></div><button class="btn sm" data-act="close">Закрыть</button></header>
  <div class="grid g4" style="margin-bottom:14px"><div class="card stat" style="${pal(0)};box-shadow:none"><div class="l">Осталось занятий</div><div class="v" style="${k.left <= 0 ? 'color:var(--bad)' : ''}">${k.left}</div></div><div class="card stat" style="${pal(2)};box-shadow:none"><div class="l">Пропусков за месяц</div><div class="v">${a.abs}</div></div></div>
  ${r.score >= 40 ? `<div class="card" style="box-shadow:none;margin-bottom:14px"><h2>Риск ухода ${riskPill(r)}</h2><div style="color:var(--muted)">${r.why.join(', ')}</div></div>` : ''}
  <div class="card" style="box-shadow:none;margin-bottom:14px"><h2>Семья</h2>${f ? `<div class="t" style="font-weight:600">${esc(f.parent)}</div><div style="color:var(--muted)">${esc(f.phone || 'телефон не указан')}</div>
    <div style="margin-top:8px">${debt ? '<span class="pill p-warn">долг ' + money(debt) + '</span>' : '<span class="pill p-good">без долгов</span>'}</div>
    <div class="bar" style="margin:12px 0 0"><button class="btn sm pri" data-act="addinv" data-id="${f.id}">Выставить счёт</button>${debt ? `<button class="btn sm" data-act="pay" data-id="${f.id}">Принять оплату</button>` : ''}${f.phone ? `<a class="btn sm" href="${waLink(f.phone, 'Здравствуйте, ' + f.parent + '! Это ' + db.center.name + '.')}" target="_blank" rel="noopener">WhatsApp</a>` : ''}</div>` : '<p class="empty">Семья не указана.</p>'}</div>
  ${k.note ? `<div class="card" style="box-shadow:none;margin-bottom:14px"><h2>Заметка</h2><div style="white-space:pre-wrap">${esc(k.note)}</div></div>` : ''}
  <div class="card" style="box-shadow:none;margin-bottom:14px"><h2>Посещения</h2>${hist.length ? hist.slice(0, 10).map(([d, gid, s]) => `<div class="row"><div class="grow"><div class="t">${dmy(d)}</div><div class="m">${grp(gid) ? esc(grp(gid).name) : 'группа удалена'}</div></div><span class="pill ${s === 'absent' ? 'p-bad' : s === 'late' ? 'p-warn' : s === 'excused' ? 'p-mute' : 'p-good'}">${STN[s]}</span></div>`).join('') : '<p class="empty">Отметок пока нет.</p>'}</div>
  <div class="bar"><button class="btn pri" data-act="editkid" data-id="${k.id}">Изменить</button></div>`);
}

function leadForm(l, stagePreset) {
  const isNew = !l;
  l = l || {parent: '', phone: '', child: '', age: null, dir: dirs()[0] || '', src: 'Instagram', stage: stagePreset || 0, reason: '', note: ''};
  formModal({title: isNew ? 'Новая заявка' : 'Заявка', submit: isNew ? 'Добавить' : 'Сохранить', del: isNew ? null : ['lead', l.id],
    fields: [
      {id: 'parent', label: 'Родитель', value: l.parent, required: true},
      {id: 'phone', label: 'Телефон', type: 'tel', value: l.phone},
      {id: 'child', label: 'Ребёнок', value: l.child},
      {type: 'html', html: `<datalist id="dirs-list">${dirs().map(d => `<option value="${esc(d)}">`).join('')}</datalist><div class="grid g4">${field({id: 'age', label: 'Возраст', type: 'number', min: 1, max: 18, value: l.age ?? ''})}${field({id: 'dir', label: 'Интерес', value: l.dir, list: 'dirs-list'})}</div>`},
      {id: 'src', label: 'Откуда узнали', type: 'select', value: l.src, options: SOURCES.map(s => [s, s])},
      {id: 'stage', label: 'Этап', type: 'select', value: l.stage, options: STAGES.map((s, i) => [i, s])},
      {id: 'reason', label: 'Причина отказа (если отказ)', type: 'select', value: l.reason, options: [['', '—']].concat(REASONS.map(r => [r, r]))},
      {id: 'note', label: 'Заметка', type: 'textarea', value: l.note},
      {id: 'age', type: 'number', hiddenField: true}, {id: 'dir', hiddenField: true}
    ],
    onSubmit: v => {
      if (!v.parent) return 'Укажите родителя';
      const stage = +v.stage;
      if (stage === 4 && !v.reason) return 'Выберите причину отказа: по ней строится аналитика';
      const data = {parent: v.parent, phone: v.phone, child: v.child, age: v.age, dir: v.dir, src: v.src, stage, reason: stage === 4 ? v.reason : '', note: v.note};
      if (isNew) db.leads.push({id: nid(), date: TODAY, maxStage: Math.min(stage, 3), ...data});
      else { const x = db.leads.find(y => y.id === l.id); if (stage !== 4) data.maxStage = Math.max(x.maxStage || 0, stage); Object.assign(x, data); }
      return isNew ? 'Заявка добавлена' : 'Сохранено';
    }});
}
function refuseForm(l) {
  formModal({title: 'Отказ', sub: esc(l.parent) + (l.child ? ', ' + esc(l.child) : ''), submit: 'Сохранить',
    fields: [{id: 'reason', label: 'Почему отказались', type: 'select', value: REASONS[0], options: REASONS.map(r => [r, r])}, {id: 'note', label: 'Комментарий', type: 'textarea', value: l.note}],
    onSubmit: v => { l.maxStage = Math.max(l.maxStage || 0, l.stage); l.stage = 4; l.reason = v.reason; l.note = v.note; return 'Отказ записан'; }});
}

function invForm(fid, inv) {
  const isNew = !inv;
  fid = inv ? inv.fid : (fid || (db.families[0] && db.families[0].id) || 0);
  if (!db.families.length) { toast('Сначала добавьте ученика с семьёй'); return; }
  const c = db.center, kidsSel = inv ? inv.kids : famKids(fid).filter(k => k.status !== 'left').map(k => k.id);
  formModal({title: isNew ? 'Новый счёт' : 'Счёт', submit: isNew ? 'Выставить счёт' : 'Сохранить', del: isNew ? null : ['inv', inv.id],
    intro: isNew ? 'Когда счёт оплатят полностью, занятия добавятся детям автоматически.' : (inv.applied ? 'Счёт оплачен, занятия уже добавлены.' : ''),
    fields: [
      {id: 'fam', label: 'Семья', type: 'select', value: fid, options: db.families.map(x => [x.id, x.parent])},
      {type: 'html', html: `<div id="inv-kids">${field({id: 'kids', label: 'Дети', type: 'checks', value: kidsSel, options: famKids(fid).map(k => [k.id, k.name])})}</div>`},
      {type: 'html', html: `<div class="grid g4">${field({id: 'lessons', label: 'Занятий', type: 'number', min: 0, value: inv ? inv.lessons : c.pack})}${field({id: 'extra', label: 'Доп. скидка, %', type: 'number', min: 0, max: 100, value: 0})}</div>`},
      {id: 'amount', label: 'Сумма к оплате, ₸', type: 'number', min: 1, value: inv ? inv.amount : '', required: true},
      {type: 'html', html: '<div class="preview" id="inv-calc"></div>'},
      {id: 'note', label: 'Комментарий', value: inv ? inv.note : '', ph: 'Например: абонемент на ноябрь'},
      {id: 'date', label: 'Дата', type: 'date', value: inv ? inv.date : TODAY},
      {id: 'kids', type: 'checks', hiddenField: true}, {id: 'lessons', type: 'number', hiddenField: true}, {id: 'extra', type: 'number', hiddenField: true}
    ],
    after: () => {
      let manual = !isNew;
      const recalc = () => {
        const ids = $$('input[name="f-kids"]:checked').map(x => +x.value), q = quote(ids, +$('#f-lessons').value || 0, +$('#f-extra').value || 0);
        $('#inv-calc').innerHTML = ids.length ? `Расчёт: ${money(q.base)}${q.sib ? ' − семейная скидка ' + money(q.sib) : ''}${q.ex ? ' − доп. скидка ' + money(q.ex) : ''} = <b>${money(q.total)}</b>` : 'Выберите детей';
        if (!manual) $('#f-amount').value = q.total || '';
      };
      $('#f-fam').addEventListener('change', e => { $('#inv-kids').innerHTML = field({id: 'kids', label: 'Дети', type: 'checks', value: famKids(+e.target.value).filter(k => k.status !== 'left').map(k => k.id), options: famKids(+e.target.value).map(k => [k.id, k.name])}); manual = false; recalc(); });
      $('#gform').addEventListener('input', e => { if (e.target.id === 'f-amount') manual = true; else if (e.target.id !== 'f-note' && e.target.id !== 'f-date') { if (e.target.name === 'f-kids' || e.target.id === 'f-lessons' || e.target.id === 'f-extra') manual = false; recalc(); } });
      recalc();
    },
    onSubmit: v => {
      if (!(v.amount > 0)) return 'Укажите сумму';
      const data = {fid: +v.fam, kids: v.kids.map(Number), lessons: v.lessons || 0, amount: v.amount, note: v.note, date: v.date || TODAY};
      let id;
      if (isNew) { id = nid(); db.invoices.push({id, paid: 0, applied: false, ...data}); }
      else { id = inv.id; Object.assign(inv, data); }
      allocate(data.fid);
      if (isNew) setTimeout(() => invSent(id), 0);
      return isNew ? 'Счёт выставлен' : 'Сохранено';
    }});
}
function invText(i) {
  const f = fam(i.fid), names = (i.kids || []).map(id => kidById(id)).filter(Boolean).map(k => k.name.split(' ')[0]);
  return `Здравствуйте, ${f.parent}! Счёт от «${db.center.name}»${i.lessons ? `: ${i.lessons} ${plural(i.lessons, 'занятие', 'занятия', 'занятий')}` : ''}${names.length ? ' (' + names.join(', ') + ')' : ''}${i.note ? ', ' + i.note : ''}. К оплате: ${money(i.amount)}.${db.center.kaspiLink ? ' Оплатить через Kaspi: ' + db.center.kaspiLink : ''}`;
}
function invSent(id) {
  const i = db.invoices.find(x => x.id === id), f = fam(i.fid), text = invText(i);
  open(`<header><div><h2>Счёт выставлен</h2><div class="hsub">${esc(f.parent)} · ${money(i.amount)}</div></div><button class="btn sm" data-act="close">Закрыть</button></header>
  <p class="sub">Отправьте родителю сообщение со счётом${db.center.kaspiLink ? ' и ссылкой Kaspi' : ''}.</p>
  <div class="preview" id="inv-text" style="white-space:pre-wrap">${esc(text)}</div>
  <div class="bar" style="margin-top:12px">${f.phone ? `<a class="btn pri" href="${waLink(f.phone, text)}" target="_blank" rel="noopener">Отправить в WhatsApp</a>` : ''}<button class="btn" data-act="copy" data-id="${id}">Скопировать текст</button><button class="btn" data-act="pay" data-id="${f.id}">Принять оплату сейчас</button></div>
  ${!db.center.kaspiLink ? '<p class="note2">Совет: привяжите ссылку Kaspi в настройках, и она будет добавляться в каждый счёт.</p>' : ''}`);
}

function payModal(fid, p) {
  if (!db.families.length) { toast('Сначала добавьте ученика с семьёй'); return; }
  pd = {fid: p ? p.fid : (fid || db.families[0].id), method: p ? p.method : (db.center.kaspiLink ? 'kaspi' : 'cash'), edit: p ? p.id : 0};
  renderPay(p);
}
function renderPay(p) {
  const fid = pd.fid, debt = debtOf(fid) + (p ? p.amount : 0);
  const mb = m => `<button type="button" data-act="pm" data-m="${m}" aria-pressed="${pd.method === m}">${METHODS[m]}</button>`;
  open(`<header><div><h2>${pd.edit ? 'Оплата' : 'Принять оплату'}</h2></div><button class="btn sm" data-act="close">Закрыть</button></header>
  <form id="pf" novalidate>
    <label>Семья<select id="pm-fam">${db.families.map(f => `<option value="${f.id}" ${f.id === fid ? 'selected' : ''}>${esc(f.parent)}${debtOf(f.id) ? ' · долг ' + money(debtOf(f.id)) : ''}</option>`).join('')}</select></label>
    <div class="preview" id="pm-info">Выставлено ${money(invTotal(fid))}, оплачено ${money(paidOf(fid) - (p ? p.amount : 0))}. ${debt ? 'Долг: <b>' + money(debt) + '</b>' : 'Долга нет: оплата пойдёт в счёт будущих счетов.'}</div>
    <div class="seg">${mb('cash')}${mb('kaspi')}${mb('transfer')}</div>
    <label>Сумма оплаты, ₸<input id="pm-amount" type="number" min="1" value="${p ? p.amount : debt || ''}" required></label>
    ${pd.method === 'cash' ? `<label>Получено от клиента, ₸<input id="pm-recv" type="number" min="0" value="${p ? p.amount : debt || ''}"></label><div class="preview" id="pm-out"></div>` : ''}
    <div class="grid g4"><label>Дата<input id="pm-date" type="date" value="${p ? p.date : TODAY}" max="${TODAY}"></label><label>Комментарий<input id="pm-note" value="${esc(p ? p.note : '')}"></label></div>
    <div id="pm-left" class="note2"></div>
    <div class="bar"><button class="btn pri" type="submit">${pd.edit ? 'Сохранить' : 'Принять'}</button>${pd.edit ? `<button type="button" class="btn danger" data-act="del" data-t="pay" data-id="${pd.edit}">Удалить</button>` : ''}</div></form>`);
  $('#pm-fam').addEventListener('change', e => { pd.fid = +e.target.value; renderPay(p && +e.target.value === p.fid ? p : null); });
  updatePay();
}
function updatePay() {
  const p = pd.edit ? db.payments.find(x => x.id === pd.edit) : null, debt = debtOf(pd.fid) + (p && p.fid === pd.fid ? p.amount : 0);
  const a = +($('#pm-amount') && $('#pm-amount').value || 0), r = $('#pm-recv');
  if (r) { const ch = (+r.value || 0) - a; $('#pm-out').innerHTML = ch >= 0 ? 'Сдача: <b>' + money(ch) + '</b>' : 'Не хватает: <b>' + money(-ch) + '</b>'; }
  $('#pm-left').textContent = !debt ? '' : a >= debt ? 'После оплаты долг будет закрыт' + (a > debt ? ', переплата ' + money(a - debt) + ' пойдёт в будущие счета' : '') : 'После оплаты останется долг ' + money(debt - a);
}

function expForm(e) {
  const isNew = !e; e = e || {cat: 'Аренда', amount: '', date: TODAY, note: ''};
  formModal({title: isNew ? 'Новый расход' : 'Расход', submit: isNew ? 'Добавить' : 'Сохранить', del: isNew ? null : ['exp', e.id],
    fields: [{id: 'cat', label: 'Категория', type: 'select', value: e.cat, options: EXP_CATS.map(c => [c, c])}, {id: 'amount', label: 'Сумма, ₸', type: 'number', min: 1, value: e.amount, required: true}, {id: 'date', label: 'Дата', type: 'date', value: e.date}, {id: 'note', label: 'Комментарий', value: e.note, ph: 'Например: аренда за ноябрь'}],
    onSubmit: v => { if (!(v.amount > 0)) return 'Укажите сумму'; const d = {cat: v.cat, amount: v.amount, date: v.date || TODAY, note: v.note}; if (isNew) db.expenses.push({id: nid(), ...d}); else Object.assign(db.expenses.find(x => x.id === e.id), d); return isNew ? 'Расход добавлен' : 'Сохранено'; }});
}
function itemForm(it) {
  const isNew = !it; it = it || {name: '', unit: 'шт.', target: '', link: ''};
  formModal({title: isNew ? 'Товар в список' : 'Товар', submit: isNew ? 'Добавить' : 'Сохранить', del: isNew ? null : ['item', it.id],
    fields: [{id: 'name', label: 'Название', value: it.name, required: true, ph: 'Например: Бумага А4, 500 листов'}].concat(isNew ? [{id: 'price', label: 'Цена сейчас, ₸', type: 'number', min: 1, required: true}] : []).concat([
      {id: 'target', label: 'Цена-цель, ₸ (необязательно)', type: 'number', min: 0, value: it.target || ''}, {id: 'unit', label: 'Единица', value: it.unit}, {id: 'link', label: 'Ссылка на товар (необязательно)', type: 'url', value: it.link, ph: 'https://'}]),
    onSubmit: v => {
      if (!v.name) return 'Укажите название';
      if (v.link && !/^https:\/\//.test(v.link)) return 'Ссылка должна начинаться с https://';
      if (isNew) { if (!(v.price > 0)) return 'Укажите цену'; db.items.unshift({id: nid(), name: v.name, unit: v.unit || 'шт.', target: v.target || 0, link: v.link, h: [[TODAY, v.price]]}); }
      else Object.assign(db.items.find(x => x.id === it.id), {name: v.name, unit: v.unit || 'шт.', target: v.target || 0, link: v.link});
      return isNew ? 'Товар добавлен' : 'Сохранено';
    }});
}
function itemPriceForm(id) {
  const it = db.items.find(x => x.id === id);
  formModal({title: 'Обновить цену', sub: esc(it.name), intro: 'Сейчас в списке: ' + money(curP(it)) + '. Введите цену, которую видите сегодня.',
    fields: [{id: 'price', label: 'Новая цена, ₸', type: 'number', min: 1, value: curP(it), required: true}],
    onSubmit: v => {
      if (!(v.price > 0)) return 'Укажите цену';
      const prev = curP(it);
      if (it.h[it.h.length - 1][0] === TODAY) it.h[it.h.length - 1][1] = v.price; else it.h.push([TODAY, v.price]);
      return v.price === prev ? 'Цена не изменилась' : (v.price > prev ? 'Подорожало на ' : 'Подешевело на ') + Math.abs((v.price - prev) / prev * 100).toFixed(1).replace('.', ',') + '%';
    }});
}

/* ---------- удаление ---------- */
function doDelete(t, id) {
  if (t === 'all') { try { localStorage.removeItem(KEY); } catch (e) {} db = null; closeM(); render(); toast('Все данные удалены'); return; }
  if (t === 'kid') { db.kids = db.kids.filter(k => k.id !== id); Object.values(db.att).forEach(d => Object.values(d).forEach(g => delete g[id])); db.invoices.forEach(i => i.kids = (i.kids || []).filter(x => x !== id)); }
  if (t === 'group') { db.groups = db.groups.filter(g => g.id !== id); db.kids.forEach(k => { if (k.gid === id) k.gid = 0; }); }
  if (t === 'lead') db.leads = db.leads.filter(l => l.id !== id);
  if (t === 'exp') db.expenses = db.expenses.filter(e => e.id !== id);
  if (t === 'item') db.items = db.items.filter(e => e.id !== id);
  if (t === 'inv') { const i = db.invoices.find(x => x.id === id); db.invoices = db.invoices.filter(x => x.id !== id); if (i) allocate(i.fid); }
  if (t === 'pay') { const p = db.payments.find(x => x.id === id); db.payments = db.payments.filter(x => x.id !== id); if (p && p.fid) allocate(p.fid); }
  closeM(); save(); render(); toast('Удалено');
}

/* ---------- файлы ---------- */
function download(name, text, type) {
  const blob = new Blob([text], {type}), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
const csvCell = v => /[;"\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
const csv = rows => '﻿' + rows.map(r => r.map(csvCell).join(';')).join('\r\n');
function importFile(file) {
  const r = new FileReader();
  r.onload = () => {
    try { const s = JSON.parse(r.result); if (!s || s.v !== 2 || !Array.isArray(s.kids)) throw 0; db = s; save(); view = 'today'; closeM(); render(); toast('Данные восстановлены из копии'); }
    catch (e) { toast('Это не файл резервной копии Умного Зайки'); }
  };
  r.readAsText(file);
}

/* ---------- демо-данные ---------- */
function demoDb() {
  const d = blankDb('Умный Зайка', 'Астана'); d.demo = true;
  const ms = CUR_YM + '-01';
  const G = [['Совята', 'Английский', [5, 6], 'Айгуль Нурлановна', 'Кабинет 1', [1, 3, 5], '16:00'], ['Механики', 'Робототехника', [8, 10], 'Данияр Серикович', 'Лаборатория', [2, 4], '17:00'], ['Акварельки', 'Рисование', [4, 5], 'Мадина Ерболатовна', 'Кабинет 2', [1, 3], '15:00'], ['Ладья', 'Шахматы', [7, 9], 'Руслан Асхатович', 'Кабинет 3', [2, 4, 6], '16:30'], ['Эксперты', 'Английский', [8, 10], 'Айгуль Нурлановна', 'Кабинет 1', [3, 5], '18:00'], ['Ритм', 'Танцы', [6, 8], 'Алия Маратовна', 'Зал', [6, 0], '11:00']];
  G.forEach(([name, dir, ages, teacher, room, days, time], i) => d.groups.push({id: i + 1, name, dir, ages, teacher, room, days, time, cap: i === 5 ? 10 : 8, price: null}));
  const F = ['Динара Ким', 'Азамат Беков', 'Салтанат Серикова', 'Ирина Волкова', 'Ерлан Омаров', 'Гульнара Тлеуова'];
  F.forEach((p, i) => d.families.push({id: 11 + i, parent: p, phone: '+7 70' + (i + 1) + ' 555 0' + (i + 1) + ' 1' + i}));
  const K = [['Мария Ким', 5, 1, 11, 6], ['Артём Ким', 9, 2, 11, 5], ['Тимур Беков', 6, 1, 12, 1], ['Амина Серикова', 5, 1, 13, 7], ['Алихан Омаров', 9, 4, 15, 4], ['Дана Омарова', 4, 3, 15, 3], ['Егор Волков', 8, 2, 14, 2], ['Елизавета Волкова', 5, 3, 14, 0], ['Аружан Тлеуова', 7, 6, 16, 5], ['Мирас Тлеуов', 9, 5, 16, 6], ['Софья Нурланова', 6, 1, 13, 8], ['Кирилл Захаров', 8, 4, 12, 3]];
  K.forEach(([name, age, gid, fid, left], i) => d.kids.push({id: 21 + i, name, age, gid, fid, left, status: i === 10 ? 'trial' : 'active', note: ''}));
  d.seq = 100; db = d;
  d.families.forEach(f => { const ids = famKids(f.id).map(k => k.id); d.invoices.push({id: nid(), fid: f.id, kids: ids, lessons: 8, amount: quote(ids, 8, 0).total, note: 'Абонемент на ' + MONTHS_FULL[+CUR_YM.slice(5) - 1], date: ms, paid: 0, applied: true}); });
  const pay = (fid, amount, method, date, note) => d.payments.push({id: nid(), fid, amount, method, date, note: note || ''});
  pay(11, 45600, 'kaspi', addDays(ms, 2) > TODAY ? TODAY : addDays(ms, 2)); pay(15, 45600, 'transfer', addDays(ms, 4) > TODAY ? TODAY : addDays(ms, 4)); pay(13, 45600, 'cash', TODAY); pay(16, 45600, 'kaspi', TODAY); pay(14, 20000, 'cash', TODAY);
  pay(0, 1450000, 'kaspi', ms, 'Оплаты ранее в этом месяце (пример)');
  [1.42, 1.31, 1.55, 1.72].forEach((v, i) => { const m = shiftYm(CUR_YM, i - 4) + '-15'; pay(0, v * 1e6, 'kaspi', m, 'Итог за месяц (пример)'); d.expenses.push({id: nid(), cat: 'Прочее', amount: Math.round(v * 1e6 * 0.78), date: m, note: 'Итог за месяц (пример)'}); });
  [['Зарплаты', 780000], ['Аренда', 420000], ['Реклама', 150000], ['Материалы', 90000]].forEach(([cat, amount]) => d.expenses.push({id: nid(), cat, amount, date: ms, note: ''}));
  [[23, 1, [-2, -5]], [27, 2, [-3, -8, -12]], [25, 4, [-6]], [28, 3, [-9]]].forEach(([kid, gid, ds]) => ds.forEach(o => { const dt = addDays(TODAY, o); (d.att[dt] = d.att[dt] || {})[gid] = Object.assign((d.att[dt] || {})[gid] || {}, {[kid]: 'absent'}); }));
  [['Жанна К.', 'Ясмин', 5, 'Английский', 'Instagram', 0, ''], ['Бауыржан Т.', 'Нурсултан', 9, 'Робототехника', 'WhatsApp', 0, ''], ['Ольга М.', 'Полина', 6, 'Танцы', 'Сайт', 1, ''], ['Руслана А.', 'Тамерлан', 8, 'Шахматы', 'Рекомендация', 2, ''], ['Айнур С.', 'Лейла', 4, 'Рисование', 'Instagram', 2, ''], ['Марат Д.', 'Алан', 7, 'Робототехника', 'Instagram', 3, ''], ['Светлана П.', 'Ника', 6, 'Английский', 'Instagram', 4, 'Дорого'], ['Ержан К.', 'Айлин', 5, 'Танцы', '2ГИС', 4, 'Далеко от дома'], ['Алия Б.', 'Тимур', 8, 'Английский', 'Рекомендация', 4, 'Нет времени']]
    .forEach(([parent, child, age, dir, src, stage, reason], i) => d.leads.push({id: nid(), parent, phone: '', child, age, dir, src, stage, reason, note: '', date: addDays(TODAY, -i * 3), maxStage: stage === 4 ? 2 : stage}));
  [['Бумага А4, 500 листов', 'пачка', 2300, [2190, 2290, 2450, 2590]], ['Акварель, 12 цветов', 'набор', 1300, [1490, 1450, 1390, 1320]], ['Конструктор для робототехники', 'набор', 14500, [14900, 15400, 15900, 15900]], ['Маркеры для доски, 4 шт.', 'набор', 1100, [1290, 1190, 1190, 1090]]]
    .forEach(([name, unit, target, ps]) => d.items.push({id: nid(), name, unit, target, link: '', h: ps.map((p, i) => [shiftYm(CUR_YM, i - 3) + '-05', p])}));
  d.families.forEach(f => allocate(f.id));
  return d;
}

/* ===================== СБОРКА ===================== */
const TABS = [['today', 'Сегодня'], ['schedule', 'Расписание'], ['students', 'Ученики'], ['leads', 'Заявки'], ['pay', 'Финансы'], ['mk', 'Аналитика']];
const VIEWS = {today: todayView, schedule: scheduleView, students: studentsView, leads: leadsView, pay: payView, mk: analyticsView, settings: settingsView};
function render() {
  const dark = effTheme() === 'dark', app = $('.app');
  const logo = `<div class="logo"><span class="mark">${bunny()}</span><span>Умный<br>Зайка</span></div>`;
  const tbtn = txt => `<button class="themebtn" data-act="theme" aria-label="${dark ? 'Светлая тема' : 'Тёмная тема'}">${svg(dark ? IC.sun : IC.moon, 18)}${txt ? '<span>' + (dark ? 'Светлая тема' : 'Тёмная тема') + '</span>' : ''}</button>`;
  if (!db) {
    $('#nav').hidden = true; app.classList.add('solo');
    $('#mtop').innerHTML = logo + `<div style="display:flex;gap:8px">${tbtn(false)}</div>`;
    $view().innerHTML = onboardView(); return;
  }
  $('#nav').hidden = false; app.classList.remove('solo');
  const sbtn = txt => `<button class="themebtn ${view === 'settings' ? 'on' : ''}" data-act="nav" data-id="settings" aria-label="Настройки">${svg(IC.gear, 18)}${txt ? '<span>Настройки</span>' : ''}</button>`;
  const debtN = db.families.filter(f => debtOf(f.id) > 0).length;
  $('#nav').innerHTML = logo + TABS.map(([id, t]) => `<button class="nav" data-act="nav" data-id="${id}" ${view === id ? 'aria-current="page"' : ''}>${svg(IC[id], 20)}<span>${t}</span>${id === 'pay' && debtN ? '<b>' + debtN + '</b>' : ''}</button>`).join('') + sbtn(true) + tbtn(true) + `<div class="note">${esc(db.center.name)}. Данные хранятся на этом устройстве.</div>`;
  $('#mtop').innerHTML = logo + `<div style="display:flex;gap:8px">${sbtn(false)}${tbtn(false)}</div>`;
  $view().innerHTML = (VIEWS[view] || todayView)();
  if (view === 'pay' && fin === 'calc') updateCalc();
  if (view === 'pay' && fin === 'rates') updateConv();
}
function go(v) { view = v; render(); window.scrollTo(0, 0); }

/* ---------- события ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  if (b.classList.contains('ov') && e.target !== b) return;
  const a = b.dataset.act, id = +b.dataset.id;
  if (a === 'del') {
    if (!b.dataset.armed) { b.dataset.armed = '1'; const t = b.textContent; b.textContent = 'Точно удалить?'; setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = t; } }, 3500); return; }
    doDelete(b.dataset.t, id); return;
  }
  if (a === 'startreal') {
    if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = 'Демо удалится. Нажмите ещё раз'; setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = 'Начать со своими данными'; } }, 4000); return; }
    try { localStorage.removeItem(KEY); } catch (er) {} db = null; render(); return;
  }
  if (a === 'theme') return toggleTheme();
  if (a === 'demo') { db = demoDb(); save(); go('today'); toast('Открыты демо-данные'); return; }
  if (!db) return;
  switch (a) {
    case 'nav': return go(b.dataset.id);
    case 'close': return closeM();
    case 'journal': return journalModal(id, b.dataset.d);
    case 'kid': return kidModal(id);
    case 'editkid': return kidForm(kidById(id));
    case 'addkid': return db.groups.length || db.kids.length ? kidForm() : (toast('Сначала создайте группу'), groupForm());
    case 'addgroup': return groupForm();
    case 'editgroup': return groupForm(grp(id));
    case 'addlead': return leadForm();
    case 'editlead': return leadForm(db.leads.find(l => l.id === id));
    case 'refuse': return refuseForm(db.leads.find(l => l.id === id));
    case 'buy': { const l = db.leads.find(x => x.id === id); const g = db.groups.find(g => g.dir === l.dir && (!l.age || ((!g.ages[0] || l.age >= g.ages[0]) && (!g.ages[1] || l.age <= g.ages[1])))); const ex = db.families.find(f => l.phone && phoneDigits(f.phone) === phoneDigits(l.phone)); return kidForm(null, {name: l.child, age: l.age, gid: g ? g.id : 0, fid: ex ? ex.id : 0, status: 'trial', parent: l.parent, phone: l.phone, leadId: l.id}); }
    case 'mv': { const l = db.leads.find(x => x.id === id); l.stage = +b.dataset.to; if (l.stage < 4) { l.reason = ''; l.maxStage = Math.max(l.maxStage || 0, l.stage); } save(); return render(); }
    case 'filter': filter = b.dataset.v; return render();
    case 'fin': fin = b.dataset.v; return render();
    case 'pfilter': payFilter = b.dataset.v; return render();
    case 'gorates': fin = 'rates'; return go('pay');
    case 'gokaspi': view = 'settings'; render(); { const k = $('#kaspi-card'); if (k) k.scrollIntoView({block: 'start'}); } return;
    case 'addinv': return invForm(id || 0);
    case 'editinv': return invForm(0, db.invoices.find(i => i.id === id));
    case 'addpay': return payModal(0);
    case 'pay': return payModal(id);
    case 'editpay': return payModal(0, db.payments.find(p => p.id === id));
    case 'pm': { const amt = $('#pm-amount').value, recv = $('#pm-recv') ? $('#pm-recv').value : amt; pd.method = b.dataset.m; renderPay(pd.edit ? db.payments.find(p => p.id === pd.edit) : null); $('#pm-amount').value = amt; if ($('#pm-recv')) $('#pm-recv').value = recv; return updatePay(); }
    case 'addexp': return expForm();
    case 'editexp': return expForm(db.expenses.find(x => x.id === id));
    case 'additem': return itemForm();
    case 'edititem': return itemForm(db.items.find(x => x.id === id));
    case 'itemprice': return itemPriceForm(id);
    case 'set': { setAtt(b.dataset.d, +b.dataset.g, +b.dataset.k, b.dataset.s); save(); const sc = $('.panel').scrollTop; journalModal(+b.dataset.g, b.dataset.d); $('.panel').scrollTop = sc; return render(); }
    case 'allwas': { kidsOf(id).forEach(k => { if (getAtt(b.dataset.d, id)[k.id] !== 'was') setAtt(b.dataset.d, id, k.id, 'was'); }); save(); journalModal(id, b.dataset.d); render(); return toast('Все отмечены'); }
    case 'parse': {
      pending = parseVoice($('#vt').value, id); const ks = Object.keys(pending);
      $('#pv').innerHTML = ks.length ? `<div class="preview">${ks.map(k => esc(kidById(+k).name.split(' ')[0]) + ': ' + STN[pending[k]]).join('<br>')}<div style="margin-top:8px"><button class="btn pri sm" data-act="apply" data-id="${id}" data-d="${b.dataset.d}">Подтвердить</button></div></div>` : '<div class="preview">Не нашлось имён из этой группы. Проверьте написание.</div>';
      return;
    }
    case 'apply': { Object.keys(pending).forEach(k => { if (getAtt(b.dataset.d, id)[k] !== pending[k]) setAtt(b.dataset.d, id, +k, pending[k]); }); pending = {}; save(); journalModal(id, b.dataset.d); render(); return toast('Отметки сохранены'); }
    case 'copy': { const t = invText(db.invoices.find(x => x.id === id)); if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => toast('Текст скопирован'), () => toast('Выделите текст и скопируйте вручную')); else toast('Выделите текст и скопируйте вручную'); return; }
    case 'curadd': { const c = $('#cur-add').value; if (c && !selCur().includes(c)) { db.selCur = selCur().concat(c); save(); render(); toast(c + ' добавлен'); } return; }
    case 'curdel': db.selCur = selCur().filter(c => c !== b.dataset.c); save(); return render();
    case 'curreset': db.selCur = ['USD', 'RUB']; save(); render(); return toast('Показаны рубль и доллар');
    case 'kaspioff': db.center.kaspiLink = ''; db.center.kaspiPoint = ''; save(); render(); return toast('Kaspi отвязан');
    case 'backup': download('umny-zayka-kopiya-' + TODAY + '.json', JSON.stringify(db), 'application/json'); return toast('Копия сохранена в загрузки');
    case 'csv': { const rows = [['Дата', 'Семья', 'Сумма', 'Способ', 'Комментарий']].concat(db.payments.filter(p => ymOf(p.date) === CUR_YM).sort((x, y) => x.date.localeCompare(y.date)).map(p => [dmy(p.date), famName(p.fid), p.amount, METHODS[p.method], p.note || ''])); download('oplaty-' + CUR_YM + '.csv', csv(rows), 'text/csv;charset=utf-8'); return toast('Файл с оплатами сохранён'); }
    case 'csvexp': { const rows = [['Дата', 'Категория', 'Сумма', 'Комментарий']].concat(db.expenses.filter(x => ymOf(x.date) === CUR_YM).sort((x, y) => x.date.localeCompare(y.date)).map(x => [dmy(x.date), x.cat, x.amount, x.note || ''])); download('rashody-' + CUR_YM + '.csv', csv(rows), 'text/csv;charset=utf-8'); return toast('Файл с расходами сохранён'); }
  }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'q') { query = t.value; const p = t.selectionStart; render(); const q = $('#q'); q.focus(); q.setSelectionRange(p, p); }
  else if (t.closest('#calc')) updateCalc();
  else if (t.closest('#conv')) updateConv();
  else if (t.id === 'rq') { const q = t.value.trim().toLowerCase(); $$('#rtbl tbody tr').forEach(tr => tr.hidden = !!q && !tr.dataset.s.includes(q)); }
  else if (t.closest('#pf')) updatePay();
});
document.addEventListener('change', e => {
  if (e.target.id === 'imp' && e.target.files[0]) importFile(e.target.files[0]);
  if (e.target.id === 'j-date' && e.target.value) journalModal(+e.target.dataset.g, e.target.value);
});
document.addEventListener('submit', e => {
  e.preventDefault(); const id = e.target.id;
  if (id === 'onb') { const n = $('#o-name').value.trim(); if (!n) return toast('Введите название центра'); db = blankDb(n, $('#o-city').value.trim()); save(); go('today'); return toast('Центр создан. Начните с группы'); }
  if (!db) return;
  if (id === 'gform' && curForm) {
    const msg = curForm.onSubmit(formVals(curForm));
    if (typeof msg === 'string' && /^(Укажите|Выберите|Ссылка)/.test(msg)) return toast(msg);
    closeM(); save(); render(); if (msg) toast(msg);
    return;
  }
  if (id === 'pf') {
    const a = +$('#pm-amount').value;
    if (!(a > 0)) return toast('Укажите сумму оплаты');
    const recv = pd.method === 'cash' && $('#pm-recv') ? +$('#pm-recv').value : a;
    if (pd.method === 'cash' && recv < a) return toast('Получено меньше суммы оплаты');
    const data = {fid: pd.fid, amount: a, method: pd.method, date: $('#pm-date').value || TODAY, note: $('#pm-note').value.trim()};
    if (pd.edit) { const p = db.payments.find(x => x.id === pd.edit), old = p.fid; Object.assign(p, data); allocate(old); } else db.payments.push({id: nid(), ...data});
    allocate(pd.fid);
    let msg = (pd.edit ? 'Сохранено' : 'Принято ' + money(a)) + (pd.method === 'cash' && recv > a ? ', сдача ' + money(recv - a) : '');
    const left = debtOf(pd.fid); msg += left ? '. Остался долг ' + money(left) : '. Долгов нет';
    closeM(); save(); render(); return toast(msg);
  }
  if (id === 'cf') {
    const c = db.center, n = $('#s-name').value.trim(); if (!n) return toast('Введите название центра');
    Object.assign(c, {name: n, city: $('#s-city').value.trim(), price: +$('#s-price').value || 0, pack: +$('#s-pack').value || 1, sib2: +$('#s-sib2').value || 0, sib3: +$('#s-sib3').value || 0, tax: +$('#s-tax').value || 0, instagram: $('#s-ig').value.trim()});
    save(); render(); return toast('Настройки сохранены');
  }
  if (id === 'kf') {
    const link = $('#k-link').value.trim();
    if (link && !/^https:\/\//.test(link)) return toast('Ссылка должна начинаться с https://');
    db.center.kaspiLink = link; db.center.kaspiPoint = $('#k-point').value.trim(); save(); render(); return toast(link ? 'Kaspi привязан' : 'Сохранено');
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeM(); });
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => render()); } catch (e) {}

/* ---------- запуск ---------- */
load();
render();
fetch('rates.json', {cache: 'no-cache'}).then(r => r.ok ? r.json() : null).then(j => { if (j) { applyRates(j); if (db && (view === 'today' || (view === 'pay' && fin === 'rates'))) render(); } }).catch(() => {});
if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
