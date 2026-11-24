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
// Концепция отдыха — первый шаг анкеты (визуальные карточки)
const CONCEPTS = [
  { id: 'sea', icon: '🌊', label: 'Море и пляжи', sub: 'тёплая вода, песок, закаты', g: 'linear-gradient(135deg,#1fb5c9,#0c6e8a)' },
  { id: 'islands', icon: '🏝️', label: 'Острова', sub: 'лодки, снорклинг, лагуны', g: 'linear-gradient(135deg,#2bd1b5,#118a8f)' },
  { id: 'chill', icon: '🌴', label: 'Чилл и релакс', sub: 'никуда не спешить', g: 'linear-gradient(135deg,#ffb36b,#ff7a59)' },
  { id: 'seclusion', icon: '🌿', label: 'Уединение', sub: 'тихо, мало людей, природа', g: 'linear-gradient(135deg,#6fbf73,#2f7d5b)' },
  { id: 'party', icon: '🎉', label: 'Тусовки', sub: 'бары, beach-клубы, вечеринки', g: 'linear-gradient(135deg,#ff5fa2,#8a3ffc)' },
  { id: 'mountains', icon: '⛰️', label: 'Горы и прохлада', sub: 'перевалы, водопады, туман', g: 'linear-gradient(135deg,#7d9bb8,#3b5873)' },
  { id: 'sights', icon: '🛕', label: 'Достопри\u00ADмечательности', sub: 'храмы, старые города, история', g: 'linear-gradient(135deg,#e0a458,#a2582a)' },
  { id: 'food', icon: '🍜', label: 'Гастро', sub: 'стритфуд, рынки, кофе', g: 'linear-gradient(135deg,#ff8a3d,#d9480f)' },
  { id: 'active', icon: '🏄', label: 'Активно', sub: 'сёрф, дайвинг, байк, треккинг', g: 'linear-gradient(135deg,#4c8dff,#1f4fd1)' },
  { id: 'spa', icon: '💆', label: 'СПА и wellness', sub: 'массаж, йога, грязи', g: 'linear-gradient(135deg,#c79bf2,#7a4fc9)' },
  { id: 'kids', icon: '🧸', label: 'С детьми', sub: 'спокойное море, парки', g: 'linear-gradient(135deg,#ffd166,#f29e0c)' },
  { id: 'city', icon: '🏙️', label: 'Города и шопинг', sub: 'мегаполисы, рынки, крыши', g: 'linear-gradient(135deg,#8e9aaf,#4a5568)' }
];
const CNAME = Object.fromEntries(CONCEPTS.map(c => [c.id, c]));
const SLIDERS = [
  { id: 'act', l: '🐢 Отдыхать', r: '⚡ Активничать' },
  { id: 'party', l: '🌿 Уединение', r: '🎉 Тусовки' },
  { id: 'city', l: '🏝️ Природа', r: '🛕 Города и места' }
];
const FORMATS = [
  { id: 'vacation', icon: '🏖️', label: 'Отпуск', sub: '1–3 недели отдыха' },
  { id: 'winter', icon: '☀️', label: 'Зимовка', sub: 'месяц и дольше' },
  { id: 'scout', icon: '🔎', label: 'Разведка / переезд', sub: 'посмотреть жизнь, районы, жильё' },
  { id: 'work', icon: '💻', label: 'Удалёнка + отдых', sub: 'нужен интернет и рабочее место' }
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
const DREAMS = ['Хотим море без волн и тихий район для детей', 'Ищем квартиру на 2 месяца недалеко от моря', 'Мечтаем встретить рассвет у Ангкор-Вата', 'Хочу прокатиться на байке по горам', 'Первый раз в Азии, немного страшно'];
const COUNTRIES = { vn: '🇻🇳 Вьетнам', th: '🇹🇭 Таиланд', id: '🇮🇩 Бали', kh: '🇰🇭 Камбоджа' };
const FLAG = { vn: '🇻🇳', th: '🇹🇭', id: '🇮🇩', kh: '🇰🇭' };

/* Места: теги концепции 0–3, cost 1–3 (дешево/средне/дорого), хорошие месяцы, идеи с тегами.
   Чтобы добавить место — скопируйте блок. Порядок внутри страны = географический (для маршрута). */
const I = (t, ...tags) => ({ t, tags });
const PLACES = [
  // ---- Вьетнам (с севера на юг) ----
  { id: 'hg', c: 'vn', name: 'Ха Жанг', to: 'в Ха Жанг', cost: 1, good: [3, 4, 5, 9, 10, 11], wet: 'летом ливни и оползни на перевалах', tags: { mountains: 3, active: 3, seclusion: 2, sights: 1 },
    why: 'самая красивая байк-петля страны', eve: 'ужин в гестхаусе с местными',
    ideas: [I('петля Ха Жанг с водителем-изирайдером', 'active', 'mountains'), I('перевал Ма Пи Ленг и река Нхо Куэ', 'mountains', 'seclusion'), I('рынки народностей хмонг', 'sights', 'food'), I('ночёвка в деревне', 'seclusion', 'chill')] },
  { id: 'sapa', c: 'vn', name: 'Сапа', to: 'в Сапу', cost: 1, good: [3, 4, 5, 9, 10, 11], wet: 'зимой холодно и туман, летом дожди', tags: { mountains: 3, active: 2, seclusion: 1, sights: 1, chill: 1 },
    why: 'рисовые террасы и треккинг по деревням', eve: 'горячий котелок и камин',
    ideas: [I('треккинг по рисовым террасам Мыонг Хоа', 'active', 'mountains'), I('канатка на Фансипан — крыша Индокитая', 'mountains', 'sights'), I('травяные ванны красных дао', 'spa', 'chill'), I('ночной рынок Сапы', 'food')] },
  { id: 'hn', c: 'vn', name: 'Ханой и Халонг', to: 'в Ханой', cost: 2, good: [3, 4, 5, 10, 11], wet: 'зимой до +15°, летом жара и ливни', tags: { sights: 3, city: 3, food: 3, islands: 2, party: 1 },
    why: 'старый квартал, стритфуд и ночь на корабле в Халонге', eve: 'старый квартал и уличный фо',
    ideas: [I('старый квартал и Храм литературы', 'sights', 'city'), I('ночь на корабле в бухте Халонг', 'islands', 'sea', 'chill'), I('фо, бун ча и кофе с яйцом', 'food'), I('каяки и пещеры Халонга', 'active', 'islands'), I('пивная улица Та Хиен', 'party', 'city'), I('Нинь Бинь: лодки среди карстов', 'sights', 'seclusion')] },
  { id: 'ha', c: 'vn', name: 'Хойан и Хюэ', to: 'в Хойан', cost: 1, good: [2, 3, 4, 5, 6, 7, 8], wet: 'октябрь–ноябрь: ливни и паводки', tags: { sights: 3, food: 3, sea: 2, chill: 1, city: 1, kids: 1 },
    why: 'фонари старого Хойана и императорский Хюэ', eve: 'фонари старого Хойана',
    ideas: [I('старый город Хойан на рассвете', 'sights'), I('императорская цитадель Хюэ', 'sights'), I('као лау, бань ми и кулинарный класс', 'food'), I('пляж Ан Банг', 'sea', 'chill'), I('перевал Хайван на байке', 'active', 'mountains'), I('пошив одежды на заказ', 'city'), I('Мраморные горы и Ба На', 'sights', 'kids')] },
  { id: 'nt', c: 'vn', name: 'Нячанг', to: 'в Нячанг', cost: 1, good: [1, 2, 3, 4, 5, 6, 7, 8, 9], wet: 'октябрь–декабрь: дожди и волны', tags: { sea: 3, islands: 2, chill: 2, party: 1, food: 2, kids: 3, spa: 3, active: 2, city: 2, sights: 1 },
    why: 'наш дом: море, острова, грязи и всё под рукой', eve: 'прогулка по набережной и ужин с морепродуктами',
    ideas: [I('острова на лодке: снорклинг у Хон Мун', 'islands', 'active', 'sea'), I('пляж Бай Зай — длинный и пустой', 'sea', 'seclusion', 'chill'), I('грязевые ванны и горячие источники', 'spa', 'chill', 'kids'), I('морепродукты на причале и ночной рынок', 'food'), I('VinWonders: аквапарк и океанариум', 'kids'), I('башни Понагар и пагода Лонг Шон', 'sights'), I('бары на крыше с видом на бухту', 'party', 'city'), I('дайвинг у Хон Мун', 'active', 'islands'), I('водопады Ба Хо', 'mountains', 'active'), I('кофейни и рынок Чо Дам', 'food', 'city')] },
  { id: 'nvb', c: 'vn', name: 'Нинь Ван Бэй и Зоклет', to: 'в Нинь Ван Бэй', cost: 2, good: [1, 2, 3, 4, 5, 6, 7, 8, 9], wet: 'октябрь–декабрь: дожди', tags: { seclusion: 3, sea: 3, chill: 3, spa: 2, islands: 2, kids: 1 },
    why: 'тихие бухты в часе от Нячанга, виллы на воде', eve: 'ужин на закате у воды',
    ideas: [I('день на белом пляже Зоклет', 'sea', 'seclusion', 'kids'), I('вилла над водой в бухте Нинь Ван', 'seclusion', 'spa', 'chill'), I('каяк и снорклинг в бухте', 'islands', 'active'), I('спа-день в резорте', 'spa', 'chill')] },
  { id: 'dl', c: 'vn', name: 'Далат', to: 'в Далат', cost: 1, good: [11, 12, 1, 2, 3, 4], wet: 'летом днём ливни, ночью прохладно', tags: { mountains: 3, chill: 2, food: 2, active: 2, sights: 1, kids: 1, seclusion: 1 },
    why: 'прохладные горы в 3,5 часа от Нячанга', eve: 'ночной рынок и горячее соевое молоко',
    ideas: [I('водопады Датанла и Понгур', 'mountains', 'active'), I('кофейные фермы на холмах', 'food', 'chill'), I('сосновые холмы и цветочные фермы', 'seclusion', 'mountains'), I('каньонинг и рафтинг', 'active'), I('клубничные фермы и канатка', 'kids'), I('Безумный дом и старый вокзал', 'sights')] },
  { id: 'mn', c: 'vn', name: 'Муйне', to: 'в Муйне', cost: 1, good: [11, 12, 1, 2, 3, 4], wet: 'летом дожди', tags: { active: 3, sea: 2, chill: 1, seclusion: 1 },
    why: 'кайт-столица Вьетнама и дюны', eve: 'ужин у моря',
    ideas: [I('кайт-урок в сезон ветров', 'active', 'sea'), I('белые дюны на рассвете', 'seclusion', 'sights'), I('Ручей фей и рыбацкая деревня', 'sights'), I('морепродукты у моря', 'food')] },
  { id: 'sg', c: 'vn', name: 'Сайгон и Меконг', to: 'в Сайгон', cost: 2, good: [12, 1, 2, 3, 4], wet: 'май–октябрь: тропические ливни', tags: { city: 3, food: 3, party: 2, sights: 2 },
    why: 'энергия мегаполиса, крыши и дельта Меконга', eve: 'крыши первого района',
    ideas: [I('стритфуд-тур по 4-му району', 'food'), I('дворец Независимости и тоннели Кучи', 'sights'), I('дельта Меконга на день', 'sights', 'seclusion'), I('бары и клубы Буй Вьен', 'party'), I('рынок Бен Тхань', 'city')] },
  { id: 'cd', c: 'vn', name: 'Кондао', to: 'на Кондао', cost: 2, good: [3, 4, 5, 6, 7, 8, 9], wet: 'октябрь–февраль: ветер и волны', tags: { seclusion: 3, sea: 3, islands: 2, chill: 2, active: 1 },
    why: 'дикие пляжи и черепахи, почти без туристов', eve: 'тихий ужин в рыбацком порту',
    ideas: [I('пустые пляжи Дам Чау и Ньят', 'sea', 'seclusion'), I('снорклинг и дайвинг на рифах', 'active', 'islands'), I('черепахи на острове Бай Кань (сезон)', 'seclusion', 'kids'), I('байк вдоль побережья', 'active')] },
  { id: 'pq', c: 'vn', name: 'Фукуок', to: 'на Фукуок', cost: 2, good: [11, 12, 1, 2, 3, 4], wet: 'май–октябрь: сезон дождей', tags: { sea: 3, islands: 3, chill: 3, kids: 2, party: 1, active: 1, spa: 1 },
    why: 'белый песок, закаты и южные острова', eve: 'закат и ночной рынок',
    ideas: [I('пляж Сао с белым песком', 'sea', 'chill'), I('южные острова и канатка на Хон Тхом', 'islands', 'kids'), I('снорклинг у Ан Тхой', 'islands', 'active'), I('сафари и аквапарк', 'kids'), I('закат на Санни-Бич', 'party', 'chill'), I('ночной рынок Зыонг Донг', 'food')] },
  // ---- Таиланд ----
  { id: 'cm', c: 'th', name: 'Чиангмай', to: 'в Чиангмай', cost: 1, good: [11, 12, 1, 2], wet: 'март–апрель: дымка от пожаров, летом дожди', tags: { mountains: 2, sights: 2, food: 2, chill: 1, active: 2, spa: 1 },
    why: 'храмы, горы и самая вкусная еда севера', eve: 'ночной базар',
    ideas: [I('храм Дой Сутхеп', 'sights', 'mountains'), I('кулинарный класс и ночной базар', 'food'), I('этичный слоновий заповедник', 'kids', 'seclusion'), I('водопады и треккинг', 'active', 'mountains')] },
  { id: 'bkk', c: 'th', name: 'Бангкок', to: 'в Бангкок', cost: 2, good: [11, 12, 1, 2], wet: 'летом ливни, апрель — жара', tags: { city: 3, sights: 2, food: 3, party: 2 },
    why: 'мегаполис, храмы и стритфуд', eve: 'крыши и ночные рынки',
    ideas: [I('Большой дворец и Ват Арун', 'sights'), I('стритфуд в Чайнатауне', 'food'), I('бары на крышах', 'party', 'city'), I('плавучий рынок', 'sights')] },
  { id: 'phuket', c: 'th', name: 'Пхукет и Краби', to: 'на Пхукет', cost: 2, good: [11, 12, 1, 2, 3, 4], wet: 'май–октябрь: волны на Андаманском море', tags: { sea: 3, islands: 3, party: 2, kids: 2, spa: 2, active: 1, city: 1 },
    why: 'классика: пляжи, Пхи-Пхи и всё для отдыха', eve: 'ужин на ночном рынке',
    ideas: [I('Пхи-Пхи и Пханг Нга на лодке', 'islands', 'sea'), I('пляжи Ката и Карон', 'sea', 'kids'), I('тайский массаж', 'spa', 'chill'), I('Патонг вечером', 'party'), I('скалы Райли в Краби', 'active', 'seclusion'), I('Симиланы в сезон', 'active', 'islands')] },
  { id: 'lanta', c: 'th', name: 'Ко Ланта', to: 'на Ко Ланту', cost: 1, good: [11, 12, 1, 2, 3, 4], wet: 'май–октябрь: многое закрыто', tags: { chill: 3, seclusion: 2, sea: 3, islands: 2, kids: 2 },
    why: 'спокойный остров для чилла и семей', eve: 'закат в баре на пляже',
    ideas: [I('длинные пустые пляжи юга', 'sea', 'seclusion'), I('4 острова на лодке', 'islands'), I('гамак, кокос, ничего не делать', 'chill'), I('национальный парк на юге острова', 'seclusion', 'active')] },
  { id: 'phangan', c: 'th', name: 'Ко Панган', to: 'на Ко Панган', cost: 1, good: [1, 2, 3, 4, 5, 6, 7, 8, 9], wet: 'октябрь–декабрь: дожди в Сиамском заливе', tags: { party: 3, chill: 2, sea: 2, spa: 2, islands: 1, seclusion: 1 },
    why: 'Full Moon, йога-ретриты и тихие бухты на севере', eve: 'вечеринка на пляже',
    ideas: [I('Full Moon / Jungle party', 'party'), I('йога и детокс в Шритану', 'spa', 'chill'), I('тихий пляж Ботл-Бич', 'seclusion', 'sea'), I('лодка на Ко Тао: снорклинг', 'islands', 'active')] },
  // ---- Бали ----
  { id: 'ubud', c: 'id', name: 'Убуд', to: 'в Убуд', cost: 2, good: [4, 5, 6, 7, 8, 9, 10], wet: 'декабрь–февраль: сезон дождей', tags: { spa: 3, chill: 2, sights: 2, mountains: 1, food: 2, seclusion: 1, active: 1 },
    why: 'джунгли, рисовые террасы, йога и храмы', eve: 'ужин в варунге',
    ideas: [I('рисовые террасы Тегаллаланг', 'sights', 'mountains'), I('йога и балийский массаж', 'spa', 'chill'), I('рассвет на вулкане Батур', 'active', 'mountains'), I('храмы Тирта Эмпул и Улун Дану', 'sights'), I('водопады джунглей', 'seclusion', 'active')] },
  { id: 'canggu', c: 'id', name: 'Чангу', to: 'в Чангу', cost: 2, good: [4, 5, 6, 7, 8, 9, 10], wet: 'декабрь–февраль: дожди', tags: { party: 3, active: 2, food: 2, sea: 1, city: 1 },
    why: 'сёрф, кафе и beach-клубы', eve: 'закат в beach-клубе',
    ideas: [I('сёрф-урок на Бату Болонг', 'active', 'sea'), I('beach-клубы на закате', 'party'), I('бранчи и кофейни', 'food'), I('храм Танах Лот на закате', 'sights')] },
  { id: 'nusa', c: 'id', name: 'Нуса Пенида и Лембонган', to: 'на Нусу', cost: 2, good: [4, 5, 6, 7, 8, 9, 10], wet: 'декабрь–февраль: волны на переправе', tags: { islands: 3, sea: 2, seclusion: 2, active: 2 },
    why: 'скалы Келингкинг и манты', eve: 'тихий ужин на Лембонгане',
    ideas: [I('снорклинг с мантами', 'active', 'islands'), I('Келингкинг и Бриллиантовый пляж', 'sea', 'sights'), I('мангровые каналы на каяке', 'seclusion', 'active')] },
  { id: 'bukit', c: 'id', name: 'Букит и Улувату', to: 'на Букит', cost: 2, good: [4, 5, 6, 7, 8, 9, 10], wet: 'декабрь–февраль: дожди', tags: { sea: 3, active: 2, chill: 2, party: 1, spa: 1 },
    why: 'скалы, лучшие пляжи и сёрф Бали', eve: 'кечак-шоу у храма Улувату',
    ideas: [I('пляжи Паданг-Паданг и Мельсати', 'sea', 'chill'), I('сёрф на Улувату', 'active'), I('храм Улувату и кечак на закате', 'sights')] },
  // ---- Камбоджа ----
  { id: 'angkor', c: 'kh', name: 'Ангкор (Сиемреап)', to: 'в Сиемреап', cost: 1, good: [11, 12, 1, 2, 3], wet: 'летом дожди и жара', tags: { sights: 3, food: 1, active: 1 },
    why: 'Ангкор-Ват — главное чудо Индокитая', eve: 'Pub Street и ночной рынок',
    ideas: [I('Ангкор-Ват на рассвете (с местным лицензированным гидом)', 'sights'), I('Та Пром и Байон', 'sights'), I('плавучие деревни Тонлесап', 'seclusion'), I('кхмерская кухня', 'food')] },
  { id: 'krong', c: 'kh', name: 'Кох Ронг', to: 'на Кох Ронг', cost: 1, good: [11, 12, 1, 2, 3, 4], wet: 'летом дожди и волны', tags: { seclusion: 3, islands: 3, sea: 2, chill: 2, party: 1 },
    why: 'дикие пляжи и светящийся планктон', eve: 'светящийся планктон ночью',
    ideas: [I('пляж Long Set — почти пустой', 'seclusion', 'sea'), I('светящийся планктон', 'islands'), I('гамак и ничего не делать', 'chill')] }
];
const P = Object.fromEntries(PLACES.map(p => [p.id, p]));
const MONTHS_IN = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'];

/* ---------------- состояние ---------------- */
const KEY = 'tours-draft-v2';
const DEF = { concepts: [], bal: { act: 40, party: 30, city: 35 }, budget: 2000, budgetPer: 'total', nights: 10, startDate: '', flexible: false, format: 'vacation',
  adults: 2, kids: 0, kidsAges: '', citizenship: 'ru', places: [], help: [], pack: '', daysWithUs: 3, addons: [], dream: '',
  name: '', messenger: 'telegram', contact: '', email: '', payMethod: '', consent: false };
const clone = o => JSON.parse(JSON.stringify(o));
let S = clone(DEF);
try { const sv = JSON.parse(localStorage.getItem(KEY) || '{}'); Object.assign(S, sv); S.bal = Object.assign(clone(DEF.bal), sv.bal || {}); } catch (e) {}
S.consent = false;
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
let step = 0;

/* ---------------- концепция → профиль → места ---------------- */
const people = () => S.adults + S.kids;
const days = () => S.nights + 1;
function perPersonDay() { const tot = S.budgetPer === 'person' ? S.budget * people() : S.budget; return tot / people() / days(); }
function tier() { const d = perPersonDay(); return d < 45 ? 'eco' : d < 120 ? 'comfort' : 'premium'; }
const TIER = { eco: '🎒 Эконом', comfort: '🏨 Комфорт', premium: '🌺 Премиум' };
function profile() {
  const w = {}; CONCEPTS.forEach(c => w[c.id] = S.concepts.includes(c.id) ? 1 : 0);
  const b = S.bal, a = b.act / 100, pa = b.party / 100, ci = b.city / 100;
  w.chill += (1 - a) * 0.6; w.active += a * 0.6;
  w.seclusion += (1 - pa) * 0.6; w.party += pa * 0.6;
  w.sea += (1 - ci) * 0.35; w.islands += (1 - ci) * 0.25; w.mountains += (1 - ci) * 0.15; w.sights += ci * 0.6; w.city += ci * 0.4;
  if (S.kids) w.kids += 0.8;
  return w;
}
function scorePlace(p, w, t) {
  let s = 0, max = 0;
  for (const k in w) { s += w[k] * (p.tags[k] || 0); max += w[k] * 3; }
  let sc = max ? s / max : 0;
  if (p.c === 'vn') sc += 0.06;                 // основное направление
  if (p.id === 'nt') sc += 0.04;                // база в Нячанге
  if (t === 'eco' && p.cost === 3) sc -= 0.15;
  if (S.startDate) { const m = new Date(S.startDate).getMonth() + 1; if (m && !p.good.includes(m)) sc -= 0.14; }
  if (S.kids && (p.tags.party || 0) >= 3) sc -= 0.1;
  return sc;
}
function ranked() {
  const w = profile(), t = tier();
  const r = PLACES.map(p => ({ p, s: scorePlace(p, w, t) })).sort((a, b) => b.s - a.s);
  const top = r[0] ? r[0].s : 1;
  r.forEach(x => x.pct = Math.max(35, Math.min(98, Math.round(60 + (x.s / (top || 1)) * 38 - (r.indexOf(x) * 1.5)))));
  return r;
}
function stopsList() {
  const order = PLACES.map(p => p.id), cOrder = ['vn', 'kh', 'th', 'id'];
  let ids;
  if (S.places.length) ids = S.places.slice();
  else {
    const n = days() <= 6 ? 1 : days() <= 12 ? 2 : days() <= 20 ? 3 : days() <= 35 ? 3 : 4;
    const r = ranked(); ids = [];
    const countries = new Set();
    for (const x of r) {
      if (ids.length >= n) break;
      // не больше двух стран на поездку до 3 недель
      if (!countries.has(x.p.c) && countries.size >= (days() <= 21 ? 2 : 3)) continue;
      ids.push(x.p.id); countries.add(x.p.c);
    }
  }
  return ids.sort((a, b) => cOrder.indexOf(P[a].c) - cOrder.indexOf(P[b].c) || order.indexOf(a) - order.indexOf(b));
}
function conceptName() {
  const w = profile(), top = Object.entries(w).sort((a, b) => b[1] - a[1]).filter(x => x[1] > 0.3).slice(0, 3).map(x => x[0]);
  return top;
}

/* ---------------- разметка шагов ---------------- */
const chip = (group, it, on, extra = '') => `<button type="button" class="chip" data-g="${group}" data-v="${it.id}" aria-pressed="${on}">${esc(it.label)}${extra}</button>`;
const opt = (group, it, on, right = '') => `<button type="button" class="opt" data-g="${group}" data-v="${it.id}" aria-pressed="${on}"><span class="oi">${it.icon || ''}</span><span><b>${esc(it.label)}</b><small>${esc(it.sub || '')}</small></span>${right ? `<span class="op">${right}</span>` : ''}</button>`;
const stepper = (key, min, max) => `<div class="stepper" data-step="${key}" data-min="${min}" data-max="${max}"><button type="button" data-d="-1" aria-label="меньше">−</button><output>${S[key]}</output><button type="button" data-d="1" aria-label="больше">+</button></div>`;
const nightsLabel = n => n >= 90 ? '90+ ночей' : n + ' ' + plural(n, 'ночь', 'ночи', 'ночей');
const BUDGET_STEPS = [300, 500, 700, 1000, 1300, 1600, 2000, 2500, 3000, 3500, 4000, 5000, 6000, 7000, 8000, 10000, 12000, 15000, 20000];
const budgetIdx = v => { let i = BUDGET_STEPS.findIndex(x => x >= v); return i < 0 ? BUDGET_STEPS.length - 1 : i; };
function budgetHint() {
  const d = perPersonDay();
  return `≈ ${money(d)} на человека в день · ${TIER[tier()]}`;
}

const STEPS = [
  { title: 'Какой отдых вам нужен?', hint: 'Выберите всё, что откликается — хоть 1, хоть 5. Из этого ИИ соберёт концепцию поездки.', render: () => `
    <div class="ccards">${CONCEPTS.map(c => `<button type="button" class="ccard" data-g="concepts" data-v="${c.id}" aria-pressed="${S.concepts.includes(c.id)}" style="--cg:${c.g}"><span class="cc-ico">${c.icon}</span><b>${esc(c.label)}</b><small>${esc(c.sub)}</small><i class="cc-check" aria-hidden="true">✓</i></button>`).join('')}</div>
    <p class="err" data-err></p>`,
    valid: () => S.concepts.length ? '' : 'Выберите хотя бы одну карточку' },
  { title: 'Найдём ваш баланс', hint: 'Подвиньте ползунки — где вы между крайностями?', render: () => `
    ${SLIDERS.map(s => `<div class="bal"><div class="bal-l"><span>${s.l}</span><span>${s.r}</span></div><input type="range" min="0" max="100" step="5" data-bal="${s.id}" value="${S.bal[s.id]}" aria-label="${esc(s.l + ' — ' + s.r)}" style="--v:${S.bal[s.id]}%"></div>`).join('')}
    <fieldset class="q" style="margin-top:18px"><legend>Формат</legend><div class="opts two">${FORMATS.map(f => opt('format', f, S.format === f.id)).join('')}</div></fieldset>` },
  { title: 'Бюджет и сколько дней', hint: 'Бюджет на всё, кроме авиабилетов: жильё, еда, транспорт, развлечения.', render: () => `
    <div class="q"><span class="ql">Дней в поездке</span><div class="range-wrap"><input type="range" min="3" max="90" step="1" data-k="nights" value="${S.nights}" aria-label="Ночей"><span class="range-val" id="nightsVal">${nightsLabel(S.nights)}</span></div></div>
    <div class="q"><span class="ql">Бюджет без перелёта</span>
      <div class="chips" style="margin-bottom:8px">${[{ id: 'total', label: 'на всех' }, { id: 'person', label: 'на человека' }].map(x => chip('budgetPer', x, S.budgetPer === x.id)).join('')}</div>
      <div class="range-wrap"><input type="range" min="0" max="${BUDGET_STEPS.length - 1}" step="1" data-budget value="${budgetIdx(S.budget)}" aria-label="Бюджет"><span class="range-val" id="budgetVal">${money(S.budget)}${S.budget >= 20000 ? '+' : ''}</span></div>
      <p class="muted small" id="budgetHint" style="margin:6px 0 0">${budgetHint()}</p></div>
    <div class="row2"><label class="f"><span>Примерная дата начала</span><input type="date" data-k="startDate" value="${esc(S.startDate)}"></label>
    <label class="check" style="align-self:end"><input type="checkbox" data-k="flexible" ${S.flexible ? 'checked' : ''}> Даты гибкие</label></div>` },
  { title: 'Кто едет?', hint: 'От этого зависят жильё, транспорт и темп.', render: () => `
    <div class="row2"><div class="q"><span class="ql">Взрослые</span>${stepper('adults', 1, 12)}</div><div class="q"><span class="ql">Дети</span>${stepper('kids', 0, 8)}</div></div>
    <label class="f" ${S.kids ? '' : 'hidden'} id="kidsAgesF"><span>Возраст детей</span><input type="text" data-k="kidsAges" value="${esc(S.kidsAges)}" placeholder="например: 4 и 9 лет"></label>
    <label class="f"><span>Гражданство (для визы)</span><select data-k="citizenship">${CITIZEN.map(c => `<option value="${c.id}" ${S.citizenship === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}</select></label>` },
  { title: 'Куда? ИИ уже подобрал', hint: 'Отмечены места с лучшим совпадением с вашей концепцией. Можно оставить как есть, выбрать свои или ничего — тогда возьмём рекомендации.', render: renderPlaces },
  { title: 'С чем помочь?', hint: 'Всё, что отметите, возьмём на себя или распишем в гайде.', render: () => `
    <div class="chips">${HELP.map(h => chip('help', h, S.help.includes(h.id))).join('')}</div>` },
  { title: 'Как поедем?', hint: 'Сами по нашему гайду или вместе с нами.', render: () => {
    const PR = CFG.prices || {};
    return `<div class="opts">${PACKS.map(p => opt('pack', p, S.pack === p.id, PR[p.id] ? 'от ' + money(PR[p.id].from) + (p.id === 'guide' ? '' : '/день') : '')).join('')}</div><p class="err" data-err></p>
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

function renderPlaces() {
  const r = ranked(), sugg = new Set(stopsListAuto());
  const by = {}; r.forEach(x => (by[x.p.c] = by[x.p.c] || []).push(x));
  return `<div class="places">${['vn', 'th', 'id', 'kh'].map(c => `<div class="pl-group"><span class="ql">${COUNTRIES[c]}</span><div class="chips">${PLACES.filter(p => p.c === c).map(p => {
      const x = r.find(y => y.p.id === p.id), on = S.places.includes(p.id), ai = sugg.has(p.id);
      return `<button type="button" class="chip pl${ai ? ' ai-pick' : ''}" data-g="places" data-v="${p.id}" aria-pressed="${on}" title="${esc(p.why)}">${esc(p.name)} <span class="match">${ai ? '✨ ' : ''}${x.pct}%</span></button>`;
    }).join('')}</div></div>`).join('')}</div>
    <p class="muted small">✨ — рекомендация ИИ для вашей концепции и ${nightsLabel(S.nights)}. ${S.places.length ? `Выбрано: ${S.places.length}. <button type="button" class="linkbtn" data-clear-places>Сбросить и взять рекомендации</button>` : 'Ничего не выбрано — в черновике рекомендации ИИ.'}</p>`;
}
function stopsListAuto() { const keep = S.places; S.places = []; const r = stopsList(); S.places = keep; return r; }

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

/* ---------------- маршрут ---------------- */
function allocate(stops) {
  const total = Math.max(days(), stops.length);
  const w = stops.map(s => s === 'nt' ? 1.4 : s === 'angkor' ? 0.6 : 1);
  const sum = w.reduce((a, b) => a + b, 0);
  const alloc = w.map(x => Math.max(1, Math.floor(total * x / sum)));
  const ai = stops.indexOf('angkor'); if (ai >= 0) alloc[ai] = Math.min(alloc[ai], 3);
  let rest = total - alloc.reduce((a, b) => a + b, 0);
  while (rest > 0) { const k = alloc.indexOf(Math.min(...alloc.map((v, i) => stops[i] === 'angkor' ? 999 : v))); alloc[k]++; rest--; }
  while (rest < 0) { const k = alloc.indexOf(Math.max(...alloc)); alloc[k]--; rest++; }
  return alloc;
}
function pickIdeas(id, n, used) {
  const w = profile();
  const list = P[id].ideas.map((x, i) => ({ x, i, s: x.tags.reduce((a, t) => a + (w[t] || 0), 0) })).filter(o => !used.has(id + o.i)).sort((a, b) => b.s - a.s);
  return list.slice(0, n).map(o => { used.add(id + o.i); return o.x.t; });
}
const FILLERS = ['свободный день: пляж и массаж', 'день в своём ритме: бассейн, кафе, прогулка', 'повторяем то, что понравилось больше всего', 'резервный день на погоду', 'шопинг и сувениры, ужин на закате'];
function arrivalText() {
  const a = [];
  if (S.help.includes('transfer') || S.addons.includes('transfer')) a.push('встречаем в аэропорту');
  a.push('заселение');
  if (S.help.includes('cash') || S.addons.includes('cash')) a.push('SIM и наличные по честному курсу');
  if (S.help.includes('bike') || S.addons.includes('bike')) a.push('подбираем байк');
  if (S.help.includes('car') || S.addons.includes('car')) a.push('машина в аренду');
  return a;
}
function buildPlan() {
  const stops = stopsList(), alloc = allocate(stops), used = new Set(), lines = [];
  const perDay = S.bal.act < 35 ? 1 : S.bal.act < 70 ? 2 : 3;
  const arrival = arrivalText();
  if (S.nights >= 21) {
    const weeks = Math.ceil(days() / 7);
    lines.push({ d: 'Неделя 1', t: `${P[stops[0]].name}: прилёт, ${arrival.join(', ')}${S.help.includes('districts') || S.help.includes('housing') ? '; смотрим районы и квартиры, заселяемся надолго' : ''}` });
    let wk = 2;
    for (const s of stops) { if (wk > weeks) break; lines.push({ d: 'Неделя ' + wk, t: `${P[s].name}: ${pickIdeas(s, 3, used).join(', ')}` }); wk++; }
    if (wk <= weeks) lines.push({ d: 'Дальше', t: 'живём в своём ритме, на выходные — ' + (stops.length > 1 ? stops.slice(1).map(s => P[s].name).join(', ') : 'острова и горы рядом') });
  } else {
    let day = 1, fill = 0;
    stops.forEach((s, si) => {
      for (let k = 0; k < alloc[si]; k++) {
        let t;
        if (day === 1) t = 'прилёт, ' + arrival.join(', ') + (perDay > 1 ? ', вечером ' + P[s].eve : '');
        else if (k === 0) t = `переезд ${P[s].to}, ` + (pickIdeas(s, 1, used)[0] || P[s].eve);
        else t = pickIdeas(s, perDay, used).join(', ') || FILLERS[(fill++) % FILLERS.length];
        lines.push({ d: 'День ' + day, s: FLAG[P[s].c] + ' ' + P[s].name, t });
        day++;
      }
    });
    if (lines.length) lines[lines.length - 1].t += '; сборы и вылет';
  }
  return { stops, alloc, lines };
}
function guidePrice() {
  const g = (CFG.guideByNights || []).find(r => S.nights <= r.upTo) || { price: get(CFG, 'prices.guide.from') || 0 };
  return g.price + Math.max(0, stopsList().length - 1) * (CFG.extraCityGuide || 0);
}
function estimate() {
  const PR = CFG.prices || {}, items = [];
  let total = 0, max = 0;
  if (!S.pack) return { total: 0, items };
  if (S.pack === 'guide') { const g = guidePrice(); total += g; max += g; items.push(['Персональный гайд', g]); }
  else {
    const p = PR[S.pack] || { from: 0, to: 0 }, d = S.daysWithUs;
    const extra = Math.max(0, people() - (CFG.groupIncluded || 4)) * (CFG.extraPersonPerDay || 0);
    total += (p.from + extra) * d; max += (p.to + extra) * d;
    items.push([`${S.pack === 'full' ? 'Полное' : 'Частичное'} сопровождение, ${d} ${plural(d, 'день', 'дня', 'дней')}`, (p.from + extra) * d]);
    items.push(['Гайд по всей поездке', 0]);
  }
  (CFG.addons || []).filter(a => S.addons.includes(a.id)).forEach(a => { const v = a.id === 'visa' ? a.price * people() : a.price; total += v; max += v; items.push([a.title, v]); });
  return { total, max: Math.max(max, total), items };
}
function seasonNotes(stops) {
  if (!S.startDate) return [];
  const m = new Date(S.startDate).getMonth() + 1; if (!m) return [];
  return stops.map(s => P[s].good.includes(m) ? `✅ ${P[s].name}: в ${MONTHS_IN[m - 1]} хороший сезон` : `🌧️ ${P[s].name}: ${P[s].wet}, предложим запасной план`);
}
function visaNotes(stops) {
  const V = CFG.visas || {}, out = [], ru = S.citizenship === 'ru', cs = new Set(stops.map(s => P[s].c));
  if (cs.has('vn')) out.push(ru ? (days() > 45 ? `🇻🇳 Больше 45 дней: нужна e-visa (${V.vietnam?.fee || ''}). Заполним вместе.` : '🇻🇳 Гражданам РФ — до 45 дней без визы.') : `🇻🇳 Проверим правила для вашего гражданства; e-visa: ${V.vietnam?.fee || ''}.`);
  if (cs.has('kh')) out.push(`🇰🇭 E-visa Камбоджи: ${V.cambodia?.fee || ''}.`);
  if (cs.has('id')) out.push(`🇮🇩 Бали: ${V.bali?.fee || ''}.`);
  if (cs.has('th')) out.push(`🇹🇭 Таиланд: ${V.thailand?.ruNote || ''}.`);
  return out;
}
function budgetNotes(stops) {
  const t = tier(), d = perPersonDay(), out = [];
  const dear = stops.filter(s => P[s].cost >= 2);
  if (t === 'eco' && dear.length) out.push(`При ${money(d)} в день на человека ${dear.map(s => P[s].name).join(', ')} — впритык; подскажем, где сэкономить.`);
  if (t === 'premium') out.push('Бюджет позволяет виллы, частного водителя и рестораны — добавим «вау»-моменты.');
  if (t === 'comfort') out.push('Хватит на хорошие отели 3–4*, кафе и такси/Grab.');
  if (t === 'eco' && !dear.length) out.push('Реально: гестхаусы, стритфуд, байк — и ещё останется на острова.');
  return out;
}
function title(stops) {
  const names = stops.map(s => P[s].name);
  const who = S.kids ? `семьи с ${S.kids === 1 ? 'ребёнком' : S.kids + ' детьми'}` : S.adults === 1 ? 'одного путешественника' : S.adults === 2 ? 'пары' : `компании из ${S.adults}`;
  const len = S.nights >= 28 ? (Math.round(days() / 30) >= 2 ? Math.round(days() / 30) + ' мес.' : '1 месяц') : `${days()} ${plural(days(), 'день', 'дня', 'дней')}`;
  return `${len}: ${names.join(' → ')} для ${who}`;
}
function planText() {
  const p = buildPlan(), L = ['Концепция: ' + conceptName().map(k => CNAME[k].label.replace(/\u00AD/g, '')).join(' · '), title(p.stops), ''];
  p.lines.forEach(l => L.push(`${l.d}${l.s ? ' (' + l.s.replace(/^\S+ /, '') + ')' : ''}: ${l.t}`));
  return L.join('\n');
}

/* ---------------- ИИ-панель ---------------- */
let aiTimer = null, lastTitle = '';
function renderAI(immediate) {
  const panel = $('#aiPanel'), body = $('#aiBody'), status = $('#aiStatus');
  clearTimeout(aiTimer);
  panel.classList.add('thinking'); status.textContent = 'думает…';
  aiTimer = setTimeout(() => {
    panel.classList.remove('thinking');
    if (!S.concepts.length && step === 0) { body.innerHTML = '<p class="ai-empty">Выберите, какой отдых вам нужен — море, острова, горы, тусовки или уединение. Я сразу соберу концепцию, подберу места во Вьетнаме, Таиланде, на Бали и в Камбодже и набросаю маршрут.</p>'; status.textContent = 'ждёт ваших ответов'; return; }
    const w = profile(), dims = Object.entries(w).filter(x => x[1] > 0.15).sort((a, b) => b[1] - a[1]).slice(0, 5), mx = dims[0] ? dims[0][1] : 1;
    const r = ranked(), p = buildPlan(), est = estimate(), T = title(p.stops);
    const cn = conceptName();
    const show = p.lines.length > 16 ? p.lines.slice(0, 12) : p.lines, more = p.lines.length - show.length;
    const tasks = [];
    HELP.filter(h => S.help.includes(h.id)).forEach(h => tasks.push(h.label));
    (CFG.addons || []).filter(a => S.addons.includes(a.id) && !HELP.some(h => h.addon === a.id && S.help.includes(h.id))).forEach(a => tasks.push((ADDON_ICON[a.id] || '') + ' ' + a.title));
    const pack = PACKS.find(x => x.id === S.pack);
    const seas = seasonNotes(p.stops), vis = visaNotes(p.stops), bud = budgetNotes(p.stops);
    const top3 = r.slice(0, 4);
    const tags = [nightsLabel(S.nights), `${S.adults} взр.${S.kids ? ' + ' + S.kids + ' дет.' : ''}`, money(S.budget) + (S.budgetPer === 'person' ? '/чел.' : ''), TIER[tier()], S.startDate ? new Date(S.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) + (S.flexible ? ' ±' : '') : ''].filter(Boolean);
    const withUs = S.pack && S.pack !== 'guide' ? `<p class="small" style="margin:8px 0 0;color:#bfe5e7">👥 ${S.pack === 'full' ? 'Целые дни вместе' : 'Встречаемся в ключевых точках'}: ${S.daysWithUs} ${plural(S.daysWithUs, 'день', 'дня', 'дней')}.</p>` : '';
    body.innerHTML = `
      <div class="ai-concept">${cn.map(k => `<span>${CNAME[k].icon} ${esc(CNAME[k].label)}</span>`).join('<i>+</i>')}</div>
      <div class="ai-title" id="aiTitle"></div>
      <div class="ai-tags">${tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>
      <div class="ai-sec"><h5>Профиль отдыха</h5><div class="ai-bars">${dims.map(([k, v]) => `<div><span>${CNAME[k].icon} ${esc(CNAME[k].label)}</span><i style="--w:${Math.round(v / mx * 100)}%"></i></div>`).join('')}</div></div>
      <div class="ai-sec"><h5>Лучшие совпадения</h5><ul class="ai-match">${top3.map(x => `<li><b>${FLAG[x.p.c]} ${esc(x.p.name)}</b><span class="pct">${x.pct}%</span><small>${esc(x.p.why)}</small></li>`).join('')}</ul></div>
      <div class="ai-sec"><h5>Маршрут-набросок${S.places.length ? '' : ' · рекомендация'}</h5><ul class="ai-days">${show.map(l => `<li><b>${esc(l.d)}</b>${l.s ? `<span class="muted-l small">${esc(l.s)} · </span>` : ''}${esc(l.t)}</li>`).join('')}${more > 0 ? `<li class="muted-l">…и ещё ${more} ${plural(more, 'день', 'дня', 'дней')} в полной версии</li>` : ''}</ul>${withUs}</div>
      ${bud.length ? `<div class="ai-sec"><h5>Бюджет</h5><ul class="ai-list">${bud.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
      ${tasks.length ? `<div class="ai-sec"><h5>Берём на себя</h5><ul class="ai-list">${tasks.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
      ${vis.length ? `<div class="ai-sec"><h5>Визы</h5><ul class="ai-list">${vis.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
      ${seas.length ? `<div class="ai-sec"><h5>Сезон</h5><ul class="ai-list">${seas.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
      ${S.dream.trim() ? `<div class="ai-sec"><h5>Ваша мечта</h5><p style="margin:0;font-style:italic">«${esc(S.dream.trim().slice(0, 220))}${S.dream.length > 220 ? '…' : ''}»</p></div>` : ''}
      ${pack ? `<div class="ai-est"><span>${pack.icon} ${esc(pack.label)}<small>ориентир за наши услуги, без жилья и билетов</small></span><b>от ${money(est.total)}</b></div>` : '<p class="ai-foot">Выберите формат поездки, и я посчитаю ориентир по цене.</p>'}
      <p class="ai-foot">Черновик собран автоматически по вашим ответам. Точную программу мы составим вручную после созвона.</p>`;
    const tEl = $('#aiTitle');
    if (T !== lastTitle && !immediate) typeText(tEl, T); else tEl.textContent = T;
    lastTitle = T;
    status.textContent = matchMedia('(min-width:1000px)').matches ? 'обновлён только что' : cn.map(k => CNAME[k].label).join(' · ') + ' — ' + T;
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
  const PR = (CFG.prices || {})[S.pack]; if (!PR) return;
  h.textContent = `${PR.note}. Обычно хватает ${S.pack === 'full' ? '3–5' : '2–4'} дней из ${days()}: прилёт, районы, аренда, острова.`;
}
function setErr(msg) { const e = $('[data-err]', $('#wzSteps')); if (e) e.textContent = msg; }
function go(d) {
  if (d > 0) { const v = STEPS[step].valid ? STEPS[step].valid() : ''; if (v) { setErr(v); return; } if (step === STEPS.length - 1) return submit(); }
  step = Math.max(0, Math.min(STEPS.length - 1, step + d));
  renderStep(); renderAI();
  const top = $('#plan').getBoundingClientRect().top + scrollY - 70;
  if (Math.abs(scrollY - top) > 200) scrollTo({ top, behavior: 'smooth' });
}
function onClick(e) {
  if (e.target.closest('[data-clear-places]')) { S.places = []; save(); renderStep(); renderAI(); return; }
  const b = e.target.closest('[data-g]');
  if (b) {
    const g = b.dataset.g, v = b.dataset.v;
    if (Array.isArray(S[g])) {
      const i = S[g].indexOf(v); i >= 0 ? S[g].splice(i, 1) : S[g].push(v);
      if (g === 'help') { const h = HELP.find(x => x.id === v); if (h && h.addon) { const on = S.help.includes(v), ai = S.addons.indexOf(h.addon); if (on && ai < 0) S.addons.push(h.addon); if (!on && ai >= 0) S.addons.splice(ai, 1); } }
    } else S[g] = v;
    save();
    if (['messenger', 'pack', 'places', 'budgetPer'].includes(g)) renderStep();
    else $$(`[data-g="${g}"]`).forEach(x => x.setAttribute('aria-pressed', Array.isArray(S[g]) ? S[g].includes(x.dataset.v) : S[g] === x.dataset.v));
    setErr(''); renderAI(); return;
  }
  const sb = e.target.closest('[data-step] button');
  if (sb) {
    const wr = sb.parentElement, k = wr.dataset.step;
    S[k] = Math.max(+wr.dataset.min, Math.min(+wr.dataset.max, S[k] + +sb.dataset.d));
    $('output', wr).textContent = S[k];
    if (k === 'kids') $('#kidsAgesF').hidden = !S.kids;
    save(); updateDaysHint(); renderAI(); return;
  }
  const idea = e.target.closest('[data-idea]');
  if (idea) { S.dream = (S.dream.trim() ? S.dream.trim() + '. ' : '') + idea.dataset.idea; $('[data-k="dream"]').value = S.dream; save(); renderAI(); }
}
function onInput(e) {
  const t = e.target;
  if (t.dataset.bal) { S.bal[t.dataset.bal] = +t.value; t.style.setProperty('--v', t.value + '%'); save(); renderAI(); return; }
  if (t.hasAttribute('data-budget')) { S.budget = BUDGET_STEPS[+t.value]; $('#budgetVal').textContent = money(S.budget) + (S.budget >= 20000 ? '+' : ''); $('#budgetHint').textContent = budgetHint(); save(); renderAI(); return; }
  const k = t.dataset.k; if (!k) return;
  S[k] = t.type === 'checkbox' ? t.checked : t.type === 'range' || t.type === 'number' ? +t.value : t.value;
  if (k === 'nights') { $('#nightsVal').textContent = nightsLabel(S.nights); const bh = $('#budgetHint'); if (bh) bh.textContent = budgetHint(); }
  if (k !== 'consent') save();
  setErr('');
  if (!['name', 'contact', 'email', 'consent', 'payMethod'].includes(k)) renderAI();
}

/* ---------------- отправка ---------------- */
function orderText(o) {
  const L = [`Заявка ${o.id} — ${CFG.companyName || ''}`, ''];
  L.push(`Имя: ${S.name}`, `Связь: ${({ telegram: 'Telegram', whatsapp: 'WhatsApp', call: 'Звонок' })[S.messenger]} ${S.contact}${S.email ? ', ' + S.email : ''}`);
  L.push(`Концепция: ${S.concepts.map(c => CNAME[c].label.replace(/\u00AD/g, '')).join(', ')}`);
  L.push(`Баланс: активность ${S.bal.act}%, тусовки ${S.bal.party}%, города/места ${S.bal.city}%`);
  L.push(`Бюджет без перелёта: ${money(S.budget)} ${S.budgetPer === 'person' ? 'на человека' : 'на всех'} (≈ ${money(perPersonDay())}/чел./день, ${TIER[tier()]})`);
  L.push(`Даты: ${S.startDate || 'не указаны'}${S.flexible ? ' (гибко)' : ''}, ${nightsLabel(S.nights)}, формат: ${(FORMATS.find(f => f.id === S.format) || {}).label}`);
  L.push(`Кто: ${S.adults} взр.${S.kids ? ', ' + S.kids + ' дет. ' + S.kidsAges : ''}; гражданство: ${(CITIZEN.find(c => c.id === S.citizenship) || {}).label}`);
  L.push(`Места: ${S.places.length ? S.places.map(p => P[p].name).join(', ') : 'рекомендация ИИ — ' + stopsList().map(p => P[p].name).join(', ')}`);
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
  const o = { id, createdAt: d.toISOString(), answers: Object.assign(clone(S), { stops: stopsList(), tier: tier(), perPersonDay: Math.round(perPersonDay()) }), estimate: est, planText: planText(), page: location.href };
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
  $('#restart').onclick = () => { S = clone(DEF); save(); step = 0; done.hidden = true; $('#wizard').hidden = false; renderStep(); renderAI(true); };
  window.__lastOrder = o;
}


/* ---------------- hero: параллакс + световые частицы (боке) ---------------- */
function heroFx() {
  const hero = $('#hero'), media = $('#heroMedia'), cv = $('#heroBokeh');
  if (!hero || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ticking = false;
  addEventListener('scroll', () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { const y = Math.min(scrollY, innerHeight); media.style.transform = `translate3d(0,${y * 0.25}px,0)`; ticking = false; }); }, { passive: true });
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext('2d'); let W, H, dpr, parts = [], visible = true, raf;
  const N = innerWidth < 700 ? 18 : 34;
  function size() { dpr = Math.min(devicePixelRatio || 1, 2); W = hero.clientWidth; H = hero.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function mk(init) { return { x: Math.random() * W, y: init ? Math.random() * H : H + 20, r: 2 + Math.random() * (Math.random() < .15 ? 22 : 7), vy: .15 + Math.random() * .45, vx: (Math.random() - .5) * .2, a: .08 + Math.random() * .28, ph: Math.random() * 6.28, hue: Math.random() < .5 ? '255,236,190' : '190,255,248' }; }
  size(); for (let i = 0; i < N; i++) parts.push(mk(true));
  addEventListener('resize', size);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf) loop(); }).observe(hero);
  function loop() {
    if (!visible || document.hidden) { raf = null; return; }
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.y -= p.vy; p.x += p.vx + Math.sin(p.ph += .01) * .15;
      if (p.y < -30) Object.assign(p, mk(false));
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      const a = p.a * (0.6 + 0.4 * Math.sin(p.ph * 2));
      g.addColorStop(0, `rgba(${p.hue},${a})`); g.addColorStop(1, `rgba(${p.hue},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }
    raf = requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !raf) loop(); });
  loop();
}

/* ---------------- init ---------------- */
function init() {
  fillStatic();
  try { heroFx(); } catch (e) { console.warn(e); }
  const form = $('#wzForm'); if (!form) return;
  form.addEventListener('click', onClick);
  form.addEventListener('input', onInput);
  form.addEventListener('change', onInput);
  form.addEventListener('submit', e => { e.preventDefault(); go(1); });
  $('#wzNext').onclick = () => go(1);
  $('#wzBack').onclick = () => go(-1);
  $('#aiToggle').onclick = () => { if (matchMedia('(min-width:1000px)').matches) return; const p = $('#aiPanel'); p.classList.toggle('collapsed'); $('#aiToggle').setAttribute('aria-expanded', !p.classList.contains('collapsed')); };
  $$('[data-pick]').forEach(a => a.addEventListener('click', () => { S.pack = a.dataset.pick; if (S.pack !== 'guide' && !S.daysWithUs) S.daysWithUs = 3; save(); step = STEPS.findIndex(x => x.title === 'Как поедем?'); renderStep(); renderAI(); }));
  if (!matchMedia('(min-width:1000px)').matches) { $('#aiPanel').classList.add('collapsed'); $('#aiToggle').setAttribute('aria-expanded', 'false'); }
  renderStep(); renderAI(true);
  // мобильная панель прячется, когда видна анкета (чтобы не закрывать кнопки)
  const mbar = $('#mbar');
  if (mbar && 'IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(x => mbar.classList.toggle('hide', x.isIntersecting)), { threshold: 0.05 }).observe($('#plan'));
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
window.__tours = { S: () => S, buildPlan, estimate, planText, ranked, stopsList };
})();
