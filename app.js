/* Свои в Нячанге — анкета-конструктор поездки. Статический сайт, без сервера.
   «ИИ-черновик» собирается в браузере по правилам из ответов (внешний ИИ-API не используется). */
(function () {
'use strict';
const CFG = window.SITE_CONFIG || {};
const CUR = CFG.currency || '$';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => CUR + Math.round(n).toLocaleString('ru-RU');
const plural = (n, a, b, c) => { n = Math.abs(n) % 100; const n1 = n % 10; if (n > 10 && n < 20) return c; if (n1 > 1 && n1 < 5) return b; if (n1 === 1) return a; return c; };
const get = (o, path) => path.split('.').reduce((x, k) => (x || {})[k], o);

/* ---------------- контакты и подстановки из config.js ---------------- */
function fillStatic() {
  $$('[data-brand]').forEach(e => e.textContent = CFG.companyName || e.textContent);
  $$('[data-tagline]').forEach(e => e.textContent = CFG.tagline || '');
  $$('[data-hosts]').forEach(e => e.textContent = CFG.hosts || e.textContent);
  $$('[data-city]').forEach(e => e.textContent = (CFG.hostsCity || 'Нячанге').split(',')[0].replace(/^Нячанг$/, 'Нячанге'));
  $$('[data-hours]').forEach(e => e.textContent = CFG.responseHours || 24);
  $$('[data-phone]').forEach(e => e.textContent = CFG.phone || '');
  $$('[data-phone-link]').forEach(e => e.href = CFG.phoneHref || '#');
  $$('[data-email]').forEach(e => e.textContent = CFG.email || '');
  $$('[data-email-link]').forEach(e => e.href = 'mailto:' + (CFG.email || ''));
  $$('[data-tg]').forEach(e => e.href = CFG.telegram || '#');
  $$('[data-insta]').forEach(e => { const u = CFG[e.dataset.insta]; if (u) e.href = u; else e.hidden = true; });
  $$('[data-wa]').forEach(e => e.href = (CFG.whatsapp || '#') + (CFG.whatsapp ? '?text=' + encodeURIComponent(e.dataset.wa || '') : ''));
  $$('[data-operator]').forEach(e => e.textContent = [CFG.operator, CFG.operatorIds].filter(Boolean).join(', '));
  $$('[data-site]').forEach(e => e.textContent = CFG.siteUrl || '[адрес сайта — будет указан после выбора домена]');
  const P = CFG.prices || {};
  $$('[data-price]').forEach(e => { const v = get(P, e.dataset.price); if (v != null) e.textContent = money(v); });
  $$('[data-unit]').forEach(e => { const p = P[e.dataset.unit]; if (p) e.textContent = p.unit; });
  $$('[data-pricecell]').forEach(e => { const p = P[e.dataset.pricecell]; if (p) e.textContent = 'от ' + money(p.from) + (p.unit === 'за день' ? '/день' : ''); });
  $$('[data-guidepp]').forEach(e => e.textContent = get(CFG, 'payment.guidePrepayPercent') ?? 100);
  $$('[data-tourpp]').forEach(e => e.textContent = get(CFG, 'payment.tourPrepayPercent') ?? 30);
  $$('[data-group-note]').forEach(e => e.textContent = `Сопровождение — за группу до ${CFG.groupIncluded || 4} человек, каждый следующий +${money(CFG.extraPersonPerDay || 0)} в день.`);
  const al = $('#addonsList');
  if (al) al.innerHTML = (CFG.addons || []).map(a => `<div class="addon"><span class="ti">${ADDON_ICON[a.id] || '➕'}</span><div><b>${esc(a.title)}</b><small>${esc(a.note || '')}</small></div><div class="ap">${a.price ? 'от ' + money(a.price) : 'бесплатно'}<small>${a.price ? esc(a.unit) : ''}</small></div></div>`).join('');
}
const ADDON_ICON = { visa: '🛂', housing: '🏠', car: '🚗', bike: '🛵', transfer: '✈️', cash: '💵' };

/* ---------------- справочники ---------------- */
const DESTS = [
  { id: 'vn', label: 'Вьетнам', flag: '🇻🇳', star: true },
  { id: 'th', label: 'Таиланд', flag: '🇹🇭' },
  { id: 'bali', label: 'Бали', flag: '🇮🇩' },
  { id: 'kh', label: 'Камбоджа', flag: '🇰🇭' },
  { id: 'unsure', label: 'Пока не знаю, посоветуйте', flag: '🤔' }
];
const VN_CITIES = [
  { id: 'nt', label: 'Нячанг', star: true }, { id: 'dl', label: 'Далат' }, { id: 'pq', label: 'Фукуок' },
  { id: 'ha', label: 'Дананг и Хойан' }, { id: 'mn', label: 'Муйне' }, { id: 'hn', label: 'Ханой и Халонг' }, { id: 'sg', label: 'Сайгон' }
];
const FORMATS = [
  { id: 'vacation', icon: '🏖️', label: 'Отпуск', sub: '1–3 недели отдыха' },
  { id: 'winter', icon: '☀️', label: 'Зимовка', sub: 'месяц и дольше' },
  { id: 'scout', icon: '🔎', label: 'Разведка / переезд', sub: 'посмотреть жизнь, районы, жильё' },
  { id: 'work', icon: '💻', label: 'Удалёнка + отдых', sub: 'нужен интернет и рабочее место' }
];
const BUDGETS = [
  { id: 'eco', icon: '🎒', label: 'Эконом', sub: 'гестхаусы, стритфуд, байк' },
  { id: 'comfort', icon: '🏨', label: 'Комфорт', sub: 'хорошие отели 3–4*, кафе, такси' },
  { id: 'premium', icon: '🌺', label: 'Премиум', sub: 'виллы, 5*, водитель, рестораны' }
];
const PACES = [{ id: 'chill', label: '🐢 Спокойно' }, { id: 'balanced', label: '⚖️ Сбалансированно' }, { id: 'active', label: '⚡ Насыщенно' }];
const INTERESTS = [
  { id: 'beach', label: '🏖️ Пляжи' }, { id: 'islands', label: '🏝️ Острова и снорклинг' }, { id: 'food', label: '🍜 Еда и стритфуд' },
  { id: 'nature', label: '🌿 Природа и водопады' }, { id: 'culture', label: '🛕 Храмы и история' }, { id: 'spa', label: '💆 СПА и грязи' },
  { id: 'kids', label: '🧸 Развлечения для детей' }, { id: 'night', label: '🍸 Вечерняя жизнь' }, { id: 'photo', label: '📸 Красивые фото' },
  { id: 'shop', label: '🛍️ Рынки и шопинг' }, { id: 'moto', label: '🛵 Байк-трипы' }, { id: 'diving', label: '🤿 Дайвинг' },
  { id: 'coffee', label: '☕ Кофе и кафе' }, { id: 'surf', label: '🏄 Сёрф и кайт' }
];
const HELP = [
  { id: 'hotels', label: '🏨 Брони отелей' }, { id: 'housing', label: '🏠 Жильё на зимовку (все агрегаторы)', addon: 'housing' },
  { id: 'car', label: '🚗 Аренда машины', addon: 'car' }, { id: 'bike', label: '🛵 Аренда байка', addon: 'bike' },
  { id: 'transfer', label: '✈️ Встреча в аэропорту', addon: 'transfer' }, { id: 'cash', label: '💵 Наличные, обмен, SIM', addon: 'cash' },
  { id: 'visa', label: '🛂 E-visa', addon: 'visa' }, { id: 'districts', label: '🗺️ Показать районы Нячанга' },
  { id: 'eat', label: '🍽️ Где поесть и купаться' }, { id: 'company', label: '🤝 Просто компания' }
];
const PACKS = [
  { id: 'guide', icon: '📘', label: 'Соберём тур — гайд', sub: 'Личный план со всеми адресами и маршрутами, поедете сами' },
  { id: 'partial', icon: '📍', label: 'Тур с нами — частично', sub: 'Встречаемся в нужных точках и привозим вас туда' },
  { id: 'full', icon: '🧭', label: 'Тур с нами — полностью', sub: 'Целые дни вместе, вся логистика на нас' }
];
const CITIZEN = [{ id: 'ru', label: 'Россия' }, { id: 'by', label: 'Беларусь' }, { id: 'kz', label: 'Казахстан' }, { id: 'other', label: 'Другое' }];
const DREAMS = ['Хотим море без волн и тихий район для детей', 'Ищем квартиру на 2 месяца недалеко от моря', 'Мечтаем встретить рассвет у Ангкор-Вата', 'Хочу прокатиться на байке в горы Далата', 'Первый раз в Азии, немного страшно'];

/* стопы маршрута: id → описание, дни-идеи по интересам, сезон (хорошие месяцы 1–12) */
const STOPS = {
  nt: { name: 'Нячанг', to: 'в Нячанг', flag: '🇻🇳', eve: 'прогулка по набережной и ужин с морепродуктами', good: [1, 2, 3, 4, 5, 6, 7, 8, 9], wet: [10, 11, 12], wetNote: 'октябрь–декабрь: дожди и волны', ideas: {
    beach: 'утренний пляж на Хон Чонге и набережная Чан Фу', islands: 'острова на лодке: снорклинг у Хон Мун', food: 'морепродукты на причале и ночной рынок',
    spa: 'грязевые ванны и горячие источники', culture: 'башни Понагар и пагода Лонг Шон', nature: 'водопады Ба Хо и холмы у Хон Ба',
    kids: 'VinWonders на острове: аквапарк и океанариум', night: 'бары на крыше с видом на бухту', photo: 'рассвет на набережной и смотровые на Хон Чонге',
    shop: 'рынок Чо Дам и сувениры', moto: 'байк-трип вдоль моря на Бай Зай', diving: 'дайв-центр и погружение у Хон Мун', coffee: 'кофейни с вьетнамским кофе с яйцом', surf: 'кайт и серф на Бай Зай в сезон ветров' } },
  dl: { name: 'Далат', to: 'в Далат', flag: '🇻🇳', eve: 'ночной рынок и горячий соевый напиток', good: [11, 12, 1, 2, 3, 4], wet: [6, 7, 8, 9, 10], wetNote: 'летом днём ливни, ночью прохладно', ideas: {
    nature: 'водопады Датанла и Понгур', coffee: 'кофейные фермы и кофейни на холмах', photo: 'сосновые холмы и цветочные фермы', culture: 'старый вокзал и Безумный дом',
    food: 'ночной рынок и далатская пицца', kids: 'клубничные фермы и канатная дорога', moto: 'перевал Нячанг – Далат на байке', shop: 'ночной рынок у озера', beach: 'озеро Туйен Лам вместо моря' } },
  pq: { name: 'Фукуок', to: 'на Фукуок', flag: '🇻🇳', eve: 'закат и ночной рынок', good: [11, 12, 1, 2, 3, 4], wet: [6, 7, 8, 9, 10], wetNote: 'май–октябрь: сезон дождей', ideas: {
    beach: 'пляж Сао с белым песком', islands: 'южные острова и канатная дорога на Хон Тхом', food: 'ночной рынок Зыонг Донг', photo: 'закат на западном побережье',
    kids: 'сафари и аквапарк', nature: 'национальный парк на севере', diving: 'снорклинг у островов Ан Тхой', night: 'Санни-Бич и шоу на закате' } },
  ha: { name: 'Дананг и Хойан', to: 'в Дананг', flag: '🇻🇳', eve: 'фонари старого Хойана', good: [2, 3, 4, 5, 6, 7, 8], wet: [10, 11, 12], wetNote: 'октябрь–ноябрь: ливни и паводки', ideas: {
    culture: 'старый город Хойан с фонарями', food: 'као лау, бань ми и рыбный рынок', beach: 'пляжи Ан Банг и Ми Кхе', nature: 'Мраморные горы и перевал Хайван',
    photo: 'мост Дракона и Золотой мост на Ба На', shop: 'пошив одежды на заказ в Хойане', kids: 'Ба На Хиллс', moto: 'перевал Хайван на байке', surf: 'сёрф на Ми Кхе' } },
  mn: { name: 'Муйне', to: 'в Муйне', flag: '🇻🇳', eve: 'ужин у моря', good: [11, 12, 1, 2, 3, 4], wet: [6, 7, 8, 9], wetNote: 'летом дожди', ideas: {
    nature: 'красные и белые дюны на рассвете', surf: 'кайт в сезон ветров', photo: 'Ручей фей и рыбацкая деревня', food: 'морепродукты у моря', beach: 'широкие пляжи' } },
  hn: { name: 'Ханой и Халонг', to: 'в Ханой', flag: '🇻🇳', eve: 'старый квартал и уличный фо', good: [10, 11, 3, 4, 5], wet: [6, 7, 8], wetNote: 'зимой до +15°, летом жара и ливни', ideas: {
    culture: 'старый квартал Ханоя и Храм литературы', islands: 'ночь на корабле в бухте Халонг', food: 'фо и бун ча в старом квартале', nature: 'пещеры и каяки в Халонге',
    photo: 'Train Street и озеро Хоан Кьем', night: 'пивная улица Та Хиен' } },
  sg: { name: 'Сайгон', to: 'в Сайгон', flag: '🇻🇳', eve: 'крыши первого района', good: [12, 1, 2, 3, 4], wet: [6, 7, 8, 9, 10], wetNote: 'май–октябрь: короткие тропические ливни', ideas: {
    culture: 'дворец Независимости и тоннели Кучи', food: 'стритфуд-тур по 4-му району', shop: 'рынок Бен Тхань', night: 'крыши первого района', nature: 'дельта Меконга на день' } },
  kh: { name: 'Камбоджа: Сиемреап', to: 'в Сиемреап (Камбоджа)', flag: '🇰🇭', eve: 'Pub Street и ночной рынок', good: [11, 12, 1, 2, 3], wet: [6, 7, 8, 9, 10], wetNote: 'летом дожди и жара', ideas: {
    culture: 'Ангкор-Ват на рассвете (с местным лицензированным гидом)', photo: 'Та Пром и Байон', nature: 'плавучие деревни на Тонлесап', food: 'кхмерская кухня и Pub Street', shop: 'ночной рынок' } },
  th: { name: 'Таиланд: Пхукет', to: 'на Пхукет', flag: '🇹🇭', eve: 'ужин на ночном рынке', good: [11, 12, 1, 2, 3, 4], wet: [6, 7, 8, 9, 10], wetNote: 'май–октябрь: волны на Андаманском море', ideas: {
    beach: 'пляжи Ката и Карон', islands: 'Пхи-Пхи и Пханг Нга на лодке', food: 'ночные рынки и том ям', spa: 'тайский массаж', culture: 'Старый город и Большой Будда',
    night: 'Патонг вечером', kids: 'аквапарк и слоновий заповедник', diving: 'Симиланы в сезон', surf: 'сёрф на Ката в сезон дождей' } },
  bali: { name: 'Бали: Убуд и Чангу', to: 'на Бали', flag: '🇮🇩', eve: 'закат и ужин в варунге', good: [4, 5, 6, 7, 8, 9, 10], wet: [12, 1, 2], wetNote: 'декабрь–февраль: сезон дождей', ideas: {
    nature: 'рисовые террасы Тегаллаланг и водопады', culture: 'храмы Улун Дану и Танах Лот', surf: 'сёрф-уроки в Чангу', spa: 'балийский массаж и йога в Убуде',
    photo: 'качели над джунглями и закат на Танах Лот', food: 'варунги и кафе Чангу', beach: 'пляжи Букита', coffee: 'кофе лювак и кафе Убуда', diving: 'снорклинг на Нуса Пенида' } }
};
const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const MONTHS_IN = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'];

/* ---------------- состояние ---------------- */
const KEY = 'tours-draft-v1';
const DEF = { dest: ['vn'], cities: [], startDate: '', flexible: false, nights: 10, format: 'vacation', adults: 2, kids: 0, kidsAges: '',
  citizenship: 'ru', budget: 'comfort', pace: 'balanced', interests: [], help: [], pack: '', daysWithUs: 3, addons: [], dream: '',
  name: '', messenger: 'telegram', contact: '', email: '', payMethod: '', consent: false };
let S = Object.assign({}, DEF);
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
S.consent = false;
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
let step = 0;

/* ---------------- разметка шагов ---------------- */
const chip = (group, it, on) => `<button type="button" class="chip" data-g="${group}" data-v="${it.id}" aria-pressed="${on}">${it.flag ? it.flag + ' ' : ''}${esc(it.label)}${it.star ? ' <span class="star">★</span>' : ''}</button>`;
const opt = (group, it, on, right = '') => `<button type="button" class="opt" data-g="${group}" data-v="${it.id}" aria-pressed="${on}"><span class="oi">${it.icon || ''}</span><span><b>${esc(it.label)}</b><small>${esc(it.sub || '')}</small></span>${right ? `<span class="op">${right}</span>` : ''}</button>`;
const stepper = (key, min, max) => `<div class="stepper" data-step="${key}" data-min="${min}" data-max="${max}"><button type="button" data-d="-1" aria-label="меньше">−</button><output>${S[key]}</output><button type="button" data-d="1" aria-label="больше">+</button></div>`;
const nightsLabel = n => n >= 90 ? '90+ ночей' : n + ' ' + plural(n, 'ночь', 'ночи', 'ночей');

const STEPS = [
  { title: 'Куда хотите поехать?', hint: 'Можно выбрать несколько стран: соберём комбо-маршрут.', render: () => `
    <fieldset class="q"><legend>Страны</legend><div class="chips">${DESTS.map(d => chip('dest', d, S.dest.includes(d.id))).join('')}</div></fieldset>
    <fieldset class="q" id="qCities" ${S.dest.includes('vn') ? '' : 'hidden'}><legend>Города Вьетнама <span class="muted small">(не знаете — подскажем)</span></legend><div class="chips">${VN_CITIES.map(c => chip('cities', c, S.cities.includes(c.id))).join('')}</div></fieldset>
    <p class="err" data-err></p>`,
    valid: () => S.dest.length ? '' : 'Выберите хотя бы одно направление' },
  { title: 'Когда и надолго?', hint: 'Даты можно указать примерно.', render: () => `
    <div class="row2"><label class="f"><span>Начало поездки</span><input type="date" data-k="startDate" value="${esc(S.startDate)}"></label>
    <label class="check" style="align-self:end"><input type="checkbox" data-k="flexible" ${S.flexible ? 'checked' : ''}> Даты гибкие</label></div>
    <div class="q"><span class="ql">Длительность</span><div class="range-wrap"><input type="range" min="3" max="90" step="1" data-k="nights" value="${S.nights}" aria-label="Ночей"><span class="range-val" id="nightsVal">${nightsLabel(S.nights)}</span></div></div>
    <fieldset class="q"><legend>Формат</legend><div class="opts two">${FORMATS.map(f => opt('format', f, S.format === f.id)).join('')}</div></fieldset>` },
  { title: 'Кто едет?', hint: 'От этого зависят жильё, транспорт и темп.', render: () => `
    <div class="row2"><div class="q"><span class="ql">Взрослые</span>${stepper('adults', 1, 12)}</div><div class="q"><span class="ql">Дети</span>${stepper('kids', 0, 8)}</div></div>
    <label class="f" ${S.kids ? '' : 'hidden'} id="kidsAgesF"><span>Возраст детей</span><input type="text" data-k="kidsAges" value="${esc(S.kidsAges)}" placeholder="например: 4 и 9 лет"></label>
    <label class="f"><span>Гражданство (для визы)</span><select data-k="citizenship">${CITIZEN.map(c => `<option value="${c.id}" ${S.citizenship === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}</select></label>
    <fieldset class="q"><legend>Бюджет</legend><div class="opts">${BUDGETS.map(b => opt('budget', b, S.budget === b.id)).join('')}</div></fieldset>
    <fieldset class="q"><legend>Темп</legend><div class="chips">${PACES.map(p => chip('pace', p, S.pace === p.id)).join('')}</div></fieldset>` },
  { title: 'Что вы любите?', hint: 'Отметьте всё, что откликается. ИИ сразу соберёт под это дни.', render: () => `
    <div class="chips">${INTERESTS.map(i => chip('interests', i, S.interests.includes(i.id))).join('')}</div><p class="err" data-err></p>`,
    valid: () => S.interests.length ? '' : 'Отметьте хотя бы один интерес' },
  { title: 'С чем помочь?', hint: 'Всё, что отметите, возьмём на себя или распишем в гайде.', render: () => `
    <div class="chips">${HELP.map(h => chip('help', h, S.help.includes(h.id))).join('')}</div>` },
  { title: 'Как поедем?', hint: 'Сами по нашему гайду или вместе с нами.', render: () => {
    const P = CFG.prices || {};
    return `<div class="opts">${PACKS.map(p => opt('pack', p, S.pack === p.id, P[p.id] ? 'от ' + money(P[p.id].from) + (p.id === 'guide' ? '' : '/день') : '')).join('')}</div><p class="err" data-err></p>
    <div class="q" id="daysQ" ${S.pack && S.pack !== 'guide' ? '' : 'hidden'} style="margin-top:16px"><span class="ql">Сколько дней с нами?</span>${stepper('daysWithUs', 1, 30)}<p class="muted small" id="daysHint"></p></div>
    <fieldset class="q" style="margin-top:12px"><legend>Дополнительно</legend><div class="chips">${(CFG.addons || []).map(a => chip('addons', { id: a.id, label: (ADDON_ICON[a.id] || '') + ' ' + a.title + (a.price ? ' · ' + money(a.price) : ' · бесплатно') }, S.addons.includes(a.id))).join('')}</div></fieldset>`; },
    valid: () => S.pack ? '' : 'Выберите формат поездки' },
  { title: 'Расскажите о поездке мечты', hint: 'Своими словами: что важно, чего боитесь, что точно хотите увидеть.', render: () => `
    <div class="dream-ideas">${DREAMS.map(d => `<button type="button" data-idea="${esc(d)}">+ ${esc(d)}</button>`).join('')}</div>
    <label class="f"><textarea data-k="dream" placeholder="Например: летим вдвоём в феврале, хотим тихий пляж, вкусную еду и пару дней в горах…">${esc(S.dream)}</textarea></label>` },
  { title: 'Контакты и оплата', hint: 'Оставьте контакт: напишем, обсудим детали и пришлём точную программу.', render: renderContact,
    valid: () => {
      if (!S.name.trim()) return 'Как к вам обращаться?';
      if (S.contact.replace(/\D/g, '').length < 7 && !/^@?[a-z0-9_]{4,}$/i.test(S.contact.trim())) return 'Укажите телефон или @username для связи';
      if (S.email && !/^\S+@\S+\.\S+$/.test(S.email)) return 'Проверьте email';
      if (!S.consent) return 'Нужно согласие на обработку персональных данных';
      return '';
    } }
];

function renderContact() {
  const pay = CFG.payment || {}, est = estimate();
  const pp = S.pack === 'guide' ? (pay.guidePrepayPercent ?? 100) : (pay.tourPrepayPercent ?? 30);
  const methods = (pay.methods || []).filter(m => !(m.id === 'cash' && S.pack === 'guide'));
  return `
  <label class="f"><span>Ваше имя</span><input type="text" data-k="name" value="${esc(S.name)}" autocomplete="name" placeholder="Анна"></label>
  <fieldset class="q"><legend>Где удобнее связаться</legend><div class="chips">${[{ id: 'telegram', label: '✈️ Telegram' }, { id: 'whatsapp', label: '💬 WhatsApp' }, { id: 'call', label: '📞 Звонок' }].map(m => chip('messenger', m, S.messenger === m.id)).join('')}</div></fieldset>
  <div class="row2"><label class="f"><span>${S.messenger === 'telegram' ? 'Телефон или @username' : 'Телефон'}</span><input type="tel" data-k="contact" value="${esc(S.contact)}" autocomplete="tel" placeholder="${S.messenger === 'telegram' ? '@username или +7…' : '+7 …'}"></label>
  <label class="f"><span>Email <span class="muted small">(необязательно)</span></span><input type="email" data-k="email" value="${esc(S.email)}" autocomplete="email" placeholder="you@mail.ru"></label></div>
  <div class="pay">
    <h4>💳 Оплата: сейчас платить не нужно</h4>
    <p>Сначала мы свяжемся в течение ${CFG.responseHours || 24} ч, согласуем программу и точную цену. ${S.pack === 'guide' ? `Гайд оплачивается после согласования (${pp}%), готовый план пришлём в течение 2–4 дней.` : `Для брони дат — предоплата ${pp}%, остаток на месте.`} Отели, аренда и билеты оплачиваются отдельно, напрямую.</p>
    <span class="ql small" style="font-weight:800">Как вам удобнее оплатить?</span>
    <div class="pm">${methods.map(m => `<label><input type="radio" name="pm" data-k="payMethod" value="${m.id}" ${S.payMethod === m.id ? 'checked' : ''}><span>${esc(m.title)}<small>${m.details ? esc(m.details) : m.id === 'sbp' && pay.bankDetails ? 'реквизиты появятся после отправки заявки' : 'реквизиты пришлём после подтверждения'}</small></span></label>`).join('')}</div>
    ${pay.payLinkUrl ? `<p style="margin-top:10px"><a class="btn ghost" href="${esc(pay.payLinkUrl)}" target="_blank" rel="noopener">Оплатить по ссылке (после согласования)</a></p>` : ''}
    <div class="pay-total"><span>Ориентир за наши услуги</span><b>${est.total ? 'от ' + money(est.total) : '—'}</b></div>
    ${est.total ? `<p class="muted small" style="margin:6px 0 0">Предоплата после подтверждения: ≈ ${money(est.total * pp / 100)} (${pp}%). Точную сумму назовём на созвоне.</p>` : ''}
  </div>
  <label class="check"><input type="checkbox" data-k="consent" ${S.consent ? 'checked' : ''}> <span>Даю <a href="consent.html" target="_blank">согласие на обработку персональных данных</a> и принимаю <a href="privacy.html" target="_blank">политику</a> и <a href="terms.html" target="_blank">условия</a></span></label>
  <p class="err" data-err></p>`;
}

/* ---------------- маршрут и черновик ---------------- */
function stopsList() {
  let d = S.dest.filter(x => x !== 'unsure');
  if (!d.length) d = ['vn'];
  const out = [];
  if (d.includes('vn')) {
    let c = VN_CITIES.map(x => x.id).filter(id => S.cities.includes(id));
    if (!c.length) c = S.nights <= 6 ? ['nt'] : S.nights <= 12 ? ['nt', 'dl'] : ['nt', 'dl', 'pq'];
    // гео-порядок с севера на юг, Нячанг — база
    const order = ['hn', 'ha', 'nt', 'dl', 'mn', 'sg', 'pq'];
    c.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    out.push(...c);
  }
  ['kh', 'th', 'bali'].forEach(x => { if (d.includes(x)) out.push(x); });
  return out;
}
function allocate(stops, nights) {
  const days = Math.max(nights + 1, stops.length);
  const w = stops.map(s => s === 'nt' ? 1.5 : s === 'kh' ? 0.7 : 1);
  const sum = w.reduce((a, b) => a + b, 0);
  let alloc = w.map(x => Math.max(1, Math.floor(days * x / sum)));
  if (stops.includes('kh')) { const i = stops.indexOf('kh'); alloc[i] = Math.min(alloc[i], 4); }
  let rest = days - alloc.reduce((a, b) => a + b, 0), i = 0;
  while (rest > 0) { const k = stops.indexOf('nt') >= 0 ? stops.indexOf('nt') : (i++ % stops.length); alloc[k]++; rest--; }
  while (rest < 0) { const k = alloc.indexOf(Math.max(...alloc)); alloc[k]--; rest++; }
  return alloc;
}
function pickIdeas(stop, n, used) {
  const ideas = STOPS[stop].ideas, pref = S.interests.filter(i => ideas[i]);
  const rest = Object.keys(ideas).filter(k => !pref.includes(k));
  const NICHE = ['diving', 'surf', 'night', 'moto', 'kids'];
  const order = [...pref, ...rest.filter(k => !NICHE.includes(k))].filter(k => !used.has(stop + k));
  const res = [];
  for (const k of order) { if (res.length >= n) break; res.push(ideas[k]); used.add(stop + k); }
  return res;
}
function buildPlan() {
  const stops = stopsList(), nights = S.nights, long = nights >= 21;
  const alloc = allocate(stops, nights), used = new Set(), lines = [];
  const perDay = S.pace === 'chill' ? 1 : S.pace === 'active' ? 3 : 2;
  const arrival = [];
  if (S.help.includes('transfer') || S.addons.includes('transfer')) arrival.push('встречаем в аэропорту');
  arrival.push('заселение');
  if (S.help.includes('cash') || S.addons.includes('cash')) arrival.push('SIM и наличные по честному курсу');
  if (S.help.includes('bike') || S.addons.includes('bike')) arrival.push('подбираем байк');
  if (S.help.includes('car') || S.addons.includes('car')) arrival.push('машина в аренду');
  if (long) {
    const weeks = Math.ceil(nights / 7);
    lines.push({ d: 'Неделя 1', t: `${STOPS[stops[0]].name}: ${arrival.join(', ')}${S.help.includes('districts') || S.help.includes('housing') ? '; смотрим районы и квартиры, заселяемся надолго' : ''}` });
    let w = 2;
    for (const s of stops) {
      const ideas = pickIdeas(s, 3, used);
      if (w > weeks) break;
      lines.push({ d: 'Неделя ' + w + (s === stops[0] && stops.length === 1 && weeks > 2 ? '–' + weeks : ''), t: `${STOPS[s].name}: ${ideas.join(', ')}` });
      w++;
    }
    if (w <= weeks && stops.length > 1) lines.push({ d: 'Дальше', t: 'живём в своём ритме, выезды на выходные: ' + stops.slice(1).map(s => STOPS[s].name).join(', ') });
    else if (stops.length === 1 && weeks > 2 && w <= weeks) lines.push({ d: 'Дальше', t: 'свой ритм; на выходные — Далат или острова' });
  } else {
    let day = 1, fill = 0;
    const FILLERS = ['свободный день: пляж и массаж', 'день в своём ритме: бассейн, кафе, прогулка', 'повторяем то, что понравилось больше всего', 'резервный день на погоду или ещё один остров', 'шопинг и сувениры, ужин на закате'];
    stops.forEach((s, si) => {
      for (let k = 0; k < alloc[si]; k++) {
        let t;
        if (day === 1) t = 'прилёт, ' + arrival.join(', ') + (perDay > 1 ? ', вечером ' + (STOPS[s].eve || 'прогулка и ужин') : '');
        else if (k === 0) t = `переезд ${STOPS[s].to}, ` + pickIdeas(s, 1, used).join('');
        else t = pickIdeas(s, perDay, used).join(', ') || FILLERS[(fill++) % FILLERS.length];
        lines.push({ d: 'День ' + day, s: STOPS[s].flag + ' ' + STOPS[s].name, t });
        day++;
      }
    });
    if (lines.length) lines[lines.length - 1].t = (lines[lines.length - 1].t + '; сборы и вылет').replace(/^; /, '');
  }
  return { stops, alloc, lines };
}
function guidePrice() {
  const g = (CFG.guideByNights || []).find(r => S.nights <= r.upTo) || { price: get(CFG, 'prices.guide.from') || 0 };
  return g.price + Math.max(0, stopsList().length - 1) * (CFG.extraCityGuide || 0);
}
function estimate() {
  const P = CFG.prices || {}, people = S.adults + S.kids, items = [];
  let total = 0, max = 0;
  if (!S.pack) return { total: 0, items };
  if (S.pack === 'guide') { const g = guidePrice(); total += g; max += Math.min((P.guide || {}).to || g, Math.max(g, (P.guide || {}).to || g)); items.push(['Персональный гайд', g]); }
  else {
    const p = P[S.pack] || { from: 0, to: 0 }, days = S.daysWithUs;
    const extra = Math.max(0, people - (CFG.groupIncluded || 4)) * (CFG.extraPersonPerDay || 0);
    total += (p.from + extra) * days; max += (p.to + extra) * days;
    items.push([`${S.pack === 'full' ? 'Полное' : 'Частичное'} сопровождение, ${days} ${plural(days, 'день', 'дня', 'дней')}`, (p.from + extra) * days]);
    items.push(['Гайд по всей поездке', 0]);
  }
  (CFG.addons || []).filter(a => S.addons.includes(a.id)).forEach(a => {
    const v = a.id === 'visa' ? a.price * people : a.price; total += v; max += v; items.push([a.title, v]);
  });
  return { total, max: Math.max(max, total), items };
}
function seasonNotes(stops) {
  if (!S.startDate) return [];
  const m = new Date(S.startDate).getMonth() + 1; if (!m) return [];
  return stops.map(s => {
    const st = STOPS[s];
    if (st.good.includes(m)) return `✅ ${st.name}: в ${MONTHS_IN[m - 1]} хороший сезон`;
    if (st.wet.includes(m)) return `🌧️ ${st.name}: ${st.wetNote}, предложим запасной план`;
    return `🌤️ ${st.name}: межсезонье, погода переменчивая`;
  });
}
function visaNotes(stops) {
  const V = CFG.visas || {}, out = [], ru = S.citizenship === 'ru', days = S.nights + 1;
  const has = id => stops.some(s => (id === 'vn' ? STOPS[s].flag === '🇻🇳' : s === id));
  if (has('vn')) out.push(ru ? (days > 45 ? `🇻🇳 Больше 45 дней: нужна e-visa (${V.vietnam?.fee || ''}). Заполним вместе.` : '🇻🇳 Гражданам РФ — до 45 дней без визы.') : `🇻🇳 Проверим правила для вашего гражданства; e-visa: ${V.vietnam?.fee || ''}.`);
  if (has('kh')) out.push(`🇰🇭 E-visa Камбоджи: ${V.cambodia?.fee || ''}.`);
  if (has('bali')) out.push(`🇮🇩 Бали: ${V.bali?.fee || ''}.`);
  if (has('th')) out.push(`🇹🇭 Таиланд: ${V.thailand?.ruNote || ''}.`);
  return out;
}
function title(stops) {
  const names = stops.map(s => STOPS[s].name.replace(/^.*: /, ''));
  const who = S.kids ? `семьи с ${S.kids === 1 ? 'ребёнком' : S.kids + ' детьми'}` : S.adults === 1 ? 'одного путешественника' : S.adults === 2 ? 'пары' : `компании из ${S.adults}`;
  const fmt = S.format === 'winter' ? 'Зимовка' : S.format === 'scout' ? 'Разведка' : S.format === 'work' ? 'Удалёнка у моря' : 'Отпуск';
  const len = S.nights >= 28 ? `${Math.round(S.nights / 30 * 10) / 10 >= 1.5 ? Math.round(S.nights / 30) + ' мес.' : '1 месяц'}` : `${S.nights + 1} ${plural(S.nights + 1, 'день', 'дня', 'дней')}`;
  return `${fmt} · ${len}: ${names.join(' → ')} для ${who}`;
}
function planText() {
  const p = buildPlan(), est = estimate();
  const L = [title(p.stops), ''];
  p.lines.forEach(l => L.push(`${l.d}${l.s ? ' (' + l.s.replace(/^\S+ /, '') + ')' : ''}: ${l.t}`));
  return L.join('\n');
}

let aiTimer = null, lastTitle = '';
function renderAI(immediate) {
  const panel = $('#aiPanel'), body = $('#aiBody'), status = $('#aiStatus');
  clearTimeout(aiTimer);
  panel.classList.add('thinking'); status.textContent = 'думает…';
  aiTimer = setTimeout(() => {
    panel.classList.remove('thinking');
    const started = S.interests.length || S.help.length || S.pack || step > 0;
    if (!started) { body.innerHTML = '<p class="ai-empty">Отметьте направление, даты и интересы, и здесь появится черновик вашей поездки: маршрут по дням, что мы возьмём на себя, визы, сезон и ориентир по цене.</p>'; status.textContent = 'ждёт ваших ответов'; return; }
    const p = buildPlan(), est = estimate(), T = title(p.stops);
    const show = p.lines.length > 16 ? p.lines.slice(0, 12) : p.lines, more = p.lines.length - show.length;
    const tasks = [];
    HELP.filter(h => S.help.includes(h.id)).forEach(h => tasks.push(h.label));
    (CFG.addons || []).filter(a => S.addons.includes(a.id) && !HELP.some(h => h.addon === a.id && S.help.includes(h.id))).forEach(a => tasks.push((ADDON_ICON[a.id] || '') + ' ' + a.title));
    const pack = PACKS.find(x => x.id === S.pack);
    const seas = seasonNotes(p.stops), vis = visaNotes(p.stops);
    const tags = [nightsLabel(S.nights), `${S.adults} взр.${S.kids ? ' + ' + S.kids + ' дет.' : ''}`, (BUDGETS.find(b => b.id === S.budget) || {}).label, (PACES.find(x => x.id === S.pace) || {}).label, S.startDate ? new Date(S.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) + (S.flexible ? ' ±' : '') : ''].filter(Boolean);
    const withUs = S.pack && S.pack !== 'guide' ? `<p class="small" style="margin:8px 0 0;color:#bfe5e7">👥 ${S.pack === 'full' ? 'Целые дни вместе' : 'Встречаемся в ключевых точках'}: ${S.daysWithUs} ${plural(S.daysWithUs, 'день', 'дня', 'дней')}${S.pack === 'partial' ? ' (прилёт, заселение, аренда, острова)' : ''}.</p>` : '';
    body.innerHTML = `
      <div class="ai-title" id="aiTitle"></div>
      <div class="ai-tags">${tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>
      <div class="ai-sec"><h5>Маршрут-набросок</h5><ul class="ai-days">${show.map(l => `<li><b>${esc(l.d)}</b>${l.s ? `<span class="muted-l small">${esc(l.s)} · </span>` : ''}${esc(l.t)}</li>`).join('')}${more > 0 ? `<li class="muted-l">…и ещё ${more} ${plural(more, 'день', 'дня', 'дней')} в полной версии</li>` : ''}</ul>${withUs}</div>
      ${tasks.length ? `<div class="ai-sec"><h5>Берём на себя</h5><ul class="ai-list">${tasks.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
      ${vis.length ? `<div class="ai-sec"><h5>Визы</h5><ul class="ai-list">${vis.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
      ${seas.length ? `<div class="ai-sec"><h5>Сезон</h5><ul class="ai-list">${seas.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
      ${S.dream.trim() ? `<div class="ai-sec"><h5>Ваша мечта</h5><p style="margin:0;font-style:italic">«${esc(S.dream.trim().slice(0, 220))}${S.dream.length > 220 ? '…' : ''}»</p></div>` : ''}
      ${pack ? `<div class="ai-est"><span>${pack.icon} ${esc(pack.label)}<small>ориентир за наши услуги, без жилья и билетов</small></span><b>от ${money(est.total)}</b></div>` : '<p class="ai-foot">Выберите формат на шаге 6, и я посчитаю ориентир по цене.</p>'}
      <p class="ai-foot">Черновик собран автоматически по вашим ответам. Точную программу мы составим вручную после созвона.</p>`;
    const tEl = $('#aiTitle');
    if (T !== lastTitle && !immediate) typeText(tEl, T); else tEl.textContent = T;
    lastTitle = T;
    status.textContent = matchMedia('(min-width:1000px)').matches ? 'обновлён только что' : T;
  }, immediate ? 0 : 380);
}
function typeText(el, txt) {
  el.textContent = ''; el.classList.add('typing'); let i = 0;
  const tick = () => { if (!el.isConnected) return; el.textContent = txt.slice(0, i += 2); if (i < txt.length) setTimeout(tick, 14); else el.classList.remove('typing'); };
  tick();
}

/* ---------------- навигация мастера ---------------- */
function renderStep() {
  const st = STEPS[step];
  $('#wzSteps').innerHTML = `<div class="wz-step"><h3>${esc(st.title)}</h3><p class="hint">${esc(st.hint)}</p>${st.render()}</div>`;
  $('#wzBar').style.width = ((step + 1) / STEPS.length * 100) + '%';
  $('#wzStepLbl').textContent = `Шаг ${step + 1} из ${STEPS.length}`;
  $('#wzBack').style.visibility = step ? 'visible' : 'hidden';
  $('#wzNext').textContent = step === STEPS.length - 1 ? 'Отправить заявку ✨' : 'Далее →';
  updateDaysHint();
}
function updateDaysHint() {
  const h = $('#daysHint'); if (!h) return;
  const P = (CFG.prices || {})[S.pack]; if (!P) return;
  h.textContent = `${P.note}. Обычно хватает ${S.pack === 'full' ? '3–5' : '2–4'} дней из ${S.nights + 1}: прилёт, районы, аренда, острова.`;
}
function setErr(msg) { const e = $('[data-err]', $('#wzSteps')) || $$('[data-err]').pop(); if (e) e.textContent = msg; }
function go(d) {
  if (d > 0) { const v = STEPS[step].valid ? STEPS[step].valid() : ''; if (v) { setErr(v); return; } if (step === STEPS.length - 1) return submit(); }
  step = Math.max(0, Math.min(STEPS.length - 1, step + d));
  renderStep(); renderAI();
  const top = $('#plan').getBoundingClientRect().top + scrollY - 70;
  if (Math.abs(scrollY - top) > 200) scrollTo({ top, behavior: 'smooth' });
}

function onClick(e) {
  const b = e.target.closest('[data-g]');
  if (b) {
    const g = b.dataset.g, v = b.dataset.v;
    if (Array.isArray(S[g])) {
      const arr = S[g], i = arr.indexOf(v);
      if (g === 'dest' && v === 'unsure') S.dest = i >= 0 ? [] : ['unsure'];
      else { if (g === 'dest') S.dest = S.dest.filter(x => x !== 'unsure'); i >= 0 ? S[g].splice(S[g].indexOf(v), 1) : S[g].push(v); }
      // помощь → автоматически отмечаем соответствующие доп. услуги
      if (g === 'help') { const h = HELP.find(x => x.id === v); if (h && h.addon) { const on = S.help.includes(v); const ai = S.addons.indexOf(h.addon); if (on && ai < 0) S.addons.push(h.addon); if (!on && ai >= 0) S.addons.splice(ai, 1); } }
    } else S[g] = v;
    if (g === 'pack' && v !== 'guide' && S.daysWithUs < 1) S.daysWithUs = 3;
    save();
    if (['messenger', 'pack', 'dest'].includes(g)) { renderStep(); }
    else $$(`[data-g="${g}"]`).forEach(x => x.setAttribute('aria-pressed', Array.isArray(S[g]) ? S[g].includes(x.dataset.v) : S[g] === x.dataset.v));
    setErr(''); renderAI(); return;
  }
  const sb = e.target.closest('[data-step] button');
  if (sb) {
    const w = sb.parentElement, k = w.dataset.step;
    S[k] = Math.max(+w.dataset.min, Math.min(+w.dataset.max, S[k] + +sb.dataset.d));
    $('output', w).textContent = S[k];
    if (k === 'kids') $('#kidsAgesF').hidden = !S.kids;
    save(); updateDaysHint(); renderAI(); return;
  }
  const idea = e.target.closest('[data-idea]');
  if (idea) { S.dream = (S.dream.trim() ? S.dream.trim() + '. ' : '') + idea.dataset.idea; $('[data-k="dream"]').value = S.dream; save(); renderAI(); }
}
function onInput(e) {
  const k = e.target.dataset.k; if (!k) return;
  const t = e.target;
  S[k] = t.type === 'checkbox' ? t.checked : t.type === 'range' || t.type === 'number' ? +t.value : t.value;
  if (k === 'nights') $('#nightsVal').textContent = nightsLabel(S.nights);
  if (k !== 'consent') save();
  setErr('');
  if (!['name', 'contact', 'email', 'consent', 'payMethod'].includes(k)) renderAI();
}

/* ---------------- отправка ---------------- */
function orderText(o) {
  const L = [`Заявка ${o.id} — ${CFG.companyName || ''}`, ''];
  L.push(`Имя: ${S.name}`, `Связь: ${({ telegram: 'Telegram', whatsapp: 'WhatsApp', call: 'Звонок' })[S.messenger]} ${S.contact}${S.email ? ', ' + S.email : ''}`);
  L.push(`Направления: ${S.dest.map(d => (DESTS.find(x => x.id === d) || {}).label).join(', ')}${S.dest.includes('vn') && S.cities.length ? ' (' + S.cities.map(c => (VN_CITIES.find(x => x.id === c) || {}).label).join(', ') + ')' : ''}`);
  L.push(`Даты: ${S.startDate || 'не указаны'}${S.flexible ? ' (гибко)' : ''}, ${nightsLabel(S.nights)}, формат: ${(FORMATS.find(f => f.id === S.format) || {}).label}`);
  L.push(`Кто: ${S.adults} взр.${S.kids ? ', ' + S.kids + ' дет. ' + S.kidsAges : ''}; гражданство: ${(CITIZEN.find(c => c.id === S.citizenship) || {}).label}; бюджет: ${(BUDGETS.find(b => b.id === S.budget) || {}).label}; темп: ${(PACES.find(p => p.id === S.pace) || {}).label}`);
  L.push(`Интересы: ${S.interests.map(i => (INTERESTS.find(x => x.id === i) || {}).label).join(', ') || '—'}`);
  L.push(`Помощь: ${S.help.map(i => (HELP.find(x => x.id === i) || {}).label).join(', ') || '—'}`);
  L.push(`Пакет: ${(PACKS.find(p => p.id === S.pack) || {}).label}${S.pack !== 'guide' ? ', дней с нами: ' + S.daysWithUs : ''}`);
  L.push(`Доп.: ${(CFG.addons || []).filter(a => S.addons.includes(a.id)).map(a => a.title).join(', ') || '—'}`);
  L.push(`Оплата: ${((get(CFG, 'payment.methods') || []).find(m => m.id === S.payMethod) || {}).title || 'обсудим'}; ориентир: от ${money(o.estimate.total)}`);
  if (S.dream.trim()) L.push('', 'Мечта: ' + S.dream.trim());
  L.push('', '— ИИ-черновик —', o.planText);
  return L.join('\n');
}
function bankBlock(id, est) {
  const pay = CFG.payment || {}, b = pay.bankDetails;
  if (!b || !(b.account || b.cardNumber) || (S.payMethod && S.payMethod !== 'sbp')) return '';
  const pp = S.pack === 'guide' ? (pay.guidePrepayPercent ?? 100) : (pay.tourPrepayPercent ?? 30);
  const rows = [['Получатель', b.recipient], ['Номер карты', b.cardNumber], ['Счёт', b.account], ['Банк', b.bank], ['БИК', b.bik], ['Корр. счёт', b.corrAccount], ['ИНН банка', b.bankInn], ['КПП банка', b.bankKpp], ['Назначение', (b.purpose || '').replace('{id}', id)]].filter(r => r[1]);
  return `<div class="bank"><h4>💳 Реквизиты для оплаты</h4>
    <p class="small" style="margin:0"><b>Переводите только после того, как мы согласуем с вами программу и сумму.</b> Предоплата — ${pp}%${est.total ? ', ориентир ≈ ' + money(est.total * pp / 100) : ''}; точную сумму пришлём в сообщении.</p>
    <table>${rows.map(r => `<tr><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td></tr>`).join('')}</table></div>`;
}
function submit() {
  const d = new Date(), pad = n => String(n).padStart(2, '0');
  const id = 'T' + pad(d.getDate()) + pad(d.getMonth() + 1) + String(d.getFullYear()).slice(2) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  const est = estimate();
  const o = { id, createdAt: d.toISOString(), answers: Object.assign({}, S), estimate: est, planText: planText(), page: location.href };
  o.text = orderText(o);
  try { const h = JSON.parse(localStorage.getItem('tours-orders') || '[]'); h.push({ id, createdAt: o.createdAt, pack: S.pack }); localStorage.setItem('tours-orders', JSON.stringify(h.slice(-20))); } catch (e) {}
  let sent = false;
  if (CFG.appsScriptUrl) {
    const body = JSON.stringify({ order: o });
    try { fetch(CFG.appsScriptUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body }).catch(err => console.warn('Apps Script', err)); sent = true; }
    catch (e) { try { navigator.sendBeacon(CFG.appsScriptUrl, body); sent = true; } catch (e2) {} }
  }
  const wa = (CFG.whatsapp || '') + '?text=' + encodeURIComponent(o.text.slice(0, 3500));
  const done = $('#done');
  done.innerHTML = `<div class="big-ok">🌴</div><h3>${sent ? 'Заявка отправлена!' : 'Заявка готова!'}</h3>
    <p>Номер заявки <b>${id}</b>. ${sent ? `Мы напишем вам в течение ${CFG.responseHours || 24} часов.` : 'Отправьте её нам в Telegram или WhatsApp, так мы сразу увидим все ответы.'}</p>
    <p class="muted small">Сейчас платить не нужно: сначала согласуем программу и точную сумму.</p>
    <div class="cta-row"><a class="btn wa" href="${esc(wa)}" target="_blank" rel="noopener">💬 Отправить в WhatsApp</a><button class="btn tg" type="button" id="copyTg">✈️ Скопировать и открыть Telegram</button></div>
    ${bankBlock(id, est)}
    <details><summary class="small" style="cursor:pointer;font-weight:800">Текст заявки</summary><pre id="orderPre">${esc(o.text)}</pre></details>
    <p><button class="btn ghost" type="button" id="restart">Заполнить новую анкету</button></p>`;
  $('#wizard').hidden = true; done.hidden = false;
  scrollTo({ top: $('#plan').getBoundingClientRect().top + scrollY - 70, behavior: 'smooth' });
  $('#copyTg').onclick = async () => { try { await navigator.clipboard.writeText(o.text); } catch (e) {} $('#copyTg').textContent = '✓ Скопировано — вставьте в чат'; window.open(CFG.telegram, '_blank', 'noopener'); };
  $('#restart').onclick = () => { S = Object.assign({}, DEF); save(); step = 0; done.hidden = true; $('#wizard').hidden = false; renderStep(); renderAI(true); };
  window.__lastOrder = o;
}

/* ---------------- init ---------------- */
function init() {
  fillStatic();
  const form = $('#wzForm'); if (!form) return;
  form.addEventListener('click', onClick);
  form.addEventListener('input', onInput);
  form.addEventListener('change', onInput);
  form.addEventListener('submit', e => { e.preventDefault(); go(1); });
  $('#wzNext').onclick = () => go(1);
  $('#wzBack').onclick = () => go(-1);
  $('#aiToggle').onclick = () => { if (matchMedia('(min-width:1000px)').matches) return; const p = $('#aiPanel'); p.classList.toggle('collapsed'); $('#aiToggle').setAttribute('aria-expanded', !p.classList.contains('collapsed')); };
  $$('[data-pick]').forEach(a => a.addEventListener('click', () => { S.pack = a.dataset.pick; if (S.pack !== 'guide' && !S.daysWithUs) S.daysWithUs = 3; save(); step = 5; renderStep(); renderAI(); }));
  if (!matchMedia('(min-width:1000px)').matches) { $('#aiPanel').classList.add('collapsed'); $('#aiToggle').setAttribute('aria-expanded', 'false'); }
  renderStep(); renderAI(true);
  // мобильная панель прячется, когда видна анкета (чтобы не закрывать кнопки)
  const mbar = $('#mbar');
  if (mbar && 'IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(x => mbar.classList.toggle('hide', x.isIntersecting)), { threshold: 0.05 }).observe($('#plan'));
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
window.__tours = { S: () => S, buildPlan, estimate, planText };
})();
