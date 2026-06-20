/* ============================================
   SCROLL REVEAL — Intersection Observer
   ============================================ */
const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll(
    '.reveal-up, .reveal-fade, .reveal-left, .reveal-right'
).forEach(el => revealObserver.observe(el));

/* ============================================
   HEADER — scroll state
   ============================================ */
const header = document.getElementById('header');

const headerObserver = new IntersectionObserver(
    ([entry]) => {
        header.classList.toggle('scrolled', !entry.isIntersecting);
    },
    { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
);
const heroSection = document.getElementById('hero');
if (heroSection) headerObserver.observe(heroSection);

/* ============================================
   MOBILE MENU
   ============================================ */
const burger   = document.getElementById('navBurger');
const navLinks = document.getElementById('navLinks');

burger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.style.overflow = open ? 'hidden' : '';
});

navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-label', 'Открыть меню');
        document.body.style.overflow = '';
    });
});

/* ============================================
   HERO VIDEO — autoplay fallback for reduced motion
   ============================================ */
const heroVideo = document.getElementById('heroVideo');
if (heroVideo && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroVideo.removeAttribute('autoplay');
    heroVideo.removeAttribute('loop');
}

/* ============================================
   COUNTER ANIMATION
   ============================================ */
const counterObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.dataset.target, 10);
            const duration = 1600;
            const startTime = performance.now();

            const tick = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.floor(eased * target);
                if (progress < 1) requestAnimationFrame(tick);
                else el.textContent = target;
            };

            requestAnimationFrame(tick);
            counterObserver.unobserve(el);
            setTimeout(() => el.classList.add('done'), 1700);
        });
    },
    { threshold: 0.5 }
);

document.querySelectorAll('.stat-number').forEach(el => counterObserver.observe(el));

/* ============================================
   CALORIE CALCULATOR
   ============================================ */
document.getElementById('calcBtn').addEventListener('click', () => {
    const gender   = document.querySelector('input[name="gender"]:checked').value;
    const age      = parseFloat(document.getElementById('age').value);
    const height   = parseFloat(document.getElementById('height').value);
    const weight   = parseFloat(document.getElementById('weight').value);
    const activity = parseFloat(document.getElementById('activity').value);
    const goalPct  = parseFloat(document.getElementById('goal').value);

    if (!age || !height || !weight) {
        shakeElement(document.getElementById('calcBtn'));
        return;
    }

    const bmr = gender === 'male'
        ? (10 * weight) + (6.25 * height) - (5 * age) + 5
        : (10 * weight) + (6.25 * height) - (5 * age) - 161;

    const kcal = Math.round(bmr * activity * (1 + goalPct / 100));

    const programs = [
        { max: 1050,     name: 'Похудение',       hint: '900 ккал/день' },
        { max: 1400,     name: 'Поддержание',      hint: '1200 ккал/день' },
        { max: 2100,     name: 'Сбалансированное', hint: '1800 ккал/день' },
        { max: 2750,     name: 'Набор массы',      hint: '2500 ккал/день' },
        { max: Infinity, name: 'Как дома',         hint: 'до 3000 ккал/день' },
    ];

    const match     = programs.find(p => kcal <= p.max);
    const resultEl  = document.getElementById('calcResult');
    const numEl     = document.getElementById('resultNum');
    const programEl = document.getElementById('resultProgram');
    const ctaEl     = document.getElementById('resultCta');

    resultEl.classList.add('visible');

    const end = kcal;
    const dur = 900;
    const t0  = performance.now();

    const animNum = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        numEl.textContent = Math.round(end * e).toLocaleString('ru-RU');
        if (p < 1) requestAnimationFrame(animNum);
    };
    requestAnimationFrame(animNum);

    programEl.textContent =
        `Рекомендуем программу "${match.name}" (${match.hint})`;
    ctaEl.style.display = 'inline-flex';

    setTimeout(() => {
        resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
});

function shakeElement(el) {
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'shake 0.4s ease';
    setTimeout(() => { el.style.animation = ''; }, 400);
}

const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
@keyframes shake {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-8px); }
    40%      { transform: translateX(8px); }
    60%      { transform: translateX(-5px); }
    80%      { transform: translateX(5px); }
}`;
document.head.appendChild(shakeStyle);

/* ============================================
   ORDER FORM
   ============================================ */
window.handleOrder = function(e) {
    e.preventDefault();
    const name  = document.getElementById('orderName').value.trim();
    const phone = document.getElementById('orderPhone').value.trim();
    if (!name || !phone) return false;

    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = 'Отправлено! Мы свяжемся с вами';
    btn.disabled = true;
    btn.style.opacity = '0.7';
    return false;
};

/* ============================================
   PHONE INPUT — auto-format
   ============================================ */
const phoneInput = document.getElementById('orderPhone');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.startsWith('8')) v = '7' + v.slice(1);
        if (v.startsWith('7')) {
            const d = v.slice(1);
            let out = '+7';
            if (d.length > 0) out += ` (${d.slice(0, 3)}`;
            if (d.length > 3) out += `) ${d.slice(3, 6)}`;
            if (d.length > 6) out += `-${d.slice(6, 8)}`;
            if (d.length > 8) out += `-${d.slice(8, 10)}`;
            e.target.value = out;
        }
    });
}

/* ============================================
   FAQ ACCORDION
   Safari < 16 fallback: grid-template-rows 0fr→1fr
   doesn't animate, so we detect and use height instead.
   ============================================ */
const needsHeightFallback = (() => {
    const el = document.createElement('div');
    el.style.cssText = 'grid-template-rows:0fr;display:grid;';
    document.body.appendChild(el);
    const val = getComputedStyle(el).gridTemplateRows;
    document.body.removeChild(el);
    return val === '' || val === 'none';
})();

document.querySelectorAll('.faq-item').forEach(item => {
    const btn    = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    const inner  = item.querySelector('.faq-answer-inner');

    if (needsHeightFallback) {
        answer.style.overflow   = 'hidden';
        answer.style.transition = 'height 0.45s cubic-bezier(0.16,1,0.3,1)';
        answer.style.height     = '0px';
    }

    const closeItem = (el) => {
        el.classList.remove('open');
        el.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        if (needsHeightFallback) {
            const a = el.querySelector('.faq-answer');
            a.style.height = a.scrollHeight + 'px';
            requestAnimationFrame(() => { a.style.height = '0px'; });
        }
    };

    btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        document.querySelectorAll('.faq-item.open').forEach(closeItem);

        if (!isOpen) {
            item.classList.add('open');
            btn.setAttribute('aria-expanded', 'true');
            if (needsHeightFallback) {
                answer.style.height = inner.scrollHeight + 'px';
                answer.addEventListener('transitionend', () => {
                    if (item.classList.contains('open')) answer.style.height = 'auto';
                }, { once: true });
            }
        }
    });
});

/* ============================================
   MESSENGER ICONS — POP ANIMATION ON SCROLL
   ============================================ */
const messengerObserver = new IntersectionObserver(
    ([entry]) => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll('.messenger-btn').forEach((btn, i) => {
            setTimeout(() => btn.classList.add('popped'), i * 130);
        });
        messengerObserver.unobserve(entry.target);
    },
    { threshold: 0.5 }
);
const messengerBtns = document.querySelector('.messenger-btns');
if (messengerBtns) messengerObserver.observe(messengerBtns);

/* ============================================
   WEEKLY SCHEDULE — Google Sheets
   ============================================ */
(function () {
    const SHEET_ID = '1Dm-yrY05e0xsUVC7V7GkkzGISfdthOfoOFtQJCWqr8o';
    const csvUrl = (sheet) =>
        `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;

    const grid    = document.getElementById('schedGrid');
    const summary = document.getElementById('schedSummary');
    if (!grid) return;

    let dishLib     = {};  // { "Название" → { img, w, p, f, c, e } }
    let weekRows    = [];  // строки текущей недели из вкладки программы
    let weekDates   = [];  // уникальные даты текущей недели по порядку
    let selDay      = 0;
    let loadedSheet = '';

    /* --- CSV-парсер (поддерживает кавычки) --- */
    function parseCSV(text) {
        const rows = [];
        const lines = text.trim().split('\n');
        for (let i = 1; i < lines.length; i++) {
            const cols = [];
            let cur = '', inQ = false;
            for (const ch of lines[i]) {
                if (ch === '"') { inQ = !inQ; }
                else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
                else cur += ch;
            }
            cols.push(cur.trim());
            if (cols[0]) rows.push(cols);
        }
        return rows;
    }

    /* --- Дата "ДД.ММ.ГГГГ" → Date --- */
    function toDate(s) {
        const [d, m, y] = s.split('.').map(Number);
        return new Date(y, m - 1, d);
    }

    /* --- Ссылка Google Drive → прямой URL картинки --- */
    function photoUrl(val) {
        if (!val) return '';
        if (val.startsWith('http')) {
            const m = val.match(/\/file\/d\/([^/?]+)/);
            if (m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
            return val;
        }
        return 'images/menu/' + val;
    }

    /* --- Понедельник целевой недели ---
         Пн–Пт: текущая неделя. Сб–Вс: следующая.
         Если данных нет — берём ближайшую будущую неделю с данными. --- */
    function targetMonday(allDates) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const d = today.getDay();
        const base = new Date(today);
        // Сб(6) или Вс(0) → смотрим следующую неделю
        base.setDate(today.getDate() + (d === 6 ? 2 : d === 0 ? 1 : 1 - d));

        // Собираем все понедельники из данных
        const monSet = new Set();
        allDates.forEach(s => {
            const dt = toDate(s); const wd = dt.getDay();
            const mon = new Date(dt);
            mon.setDate(dt.getDate() + (wd === 0 ? -6 : 1 - wd));
            mon.setHours(0, 0, 0, 0);
            monSet.add(mon.getTime());
        });
        const sorted = [...monSet].sort((a, b) => a - b);
        // Предпочитаем base-неделю, иначе — ближайшую будущую
        const found = sorted.find(t => t >= base.getTime());
        return found ? new Date(found) : (sorted.length ? new Date(sorted[sorted.length - 1]) : null);
    }

    function inWeek(s, mon) {
        if (!mon) return false;
        const dt = toDate(s);
        const sat = new Date(mon); sat.setDate(mon.getDate() + 5); sat.setHours(23, 59, 59, 999);
        return dt >= mon && dt <= sat;
    }

    function dayLabel(s) {
        return ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][toDate(s).getDay()];
    }

    /* --- Загрузка Справочника --- */
    async function loadDishes() {
        const res  = await fetch(csvUrl('Справочник'));
        const rows = parseCSV(await res.text());
        dishLib = {};
        // Колонки: Название | Фото | Вес | Белки | Жиры | Углеводы | Ккал
        rows.forEach(([name, photo, w, p, f, c, e]) => {
            if (name) dishLib[name] = { img: photoUrl(photo), w: +w, p: +p, f: +f, c: +c, e: +e };
        });
    }

    /* --- Загрузка вкладки программы --- */
    async function loadSheet(name) {
        if (name === loadedSheet) { render(); return; }
        const res  = await fetch(csvUrl(name));
        const rows = parseCSV(await res.text());
        // Колонки: Дата | Приём | Блюдо
        const allDates = rows.filter(r => r[0]).map(r => r[0]);
        const mon = targetMonday(allDates);
        weekRows = rows.filter(r => r[0] && inWeek(r[0], mon));
        const seen = new Set();
        weekDates = [];
        weekRows.forEach(r => { if (!seen.has(r[0])) { seen.add(r[0]); weekDates.push(r[0]); } });
        loadedSheet = name;
        selDay = 0;
        rebuildDayTabs();
        render();
    }

    /* --- Перестраиваем вкладки дней --- */
    function rebuildDayTabs() {
        const wrap = document.querySelector('.sched-days');
        if (!wrap) return;
        wrap.innerHTML = weekDates.length
            ? weekDates.map((d, i) =>
                `<button class="sched-day${i === 0 ? ' active' : ''}" data-day="${i}">${dayLabel(d)}</button>`
              ).join('')
            : '<span style="color:var(--text-muted);font-size:.82rem">Меню на эту неделю не добавлено</span>';
        wrap.querySelectorAll('.sched-day').forEach((btn, i) => {
            btn.addEventListener('click', () => {
                wrap.querySelectorAll('.sched-day').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selDay = i;
                render();
            });
        });
    }

    /* --- Рендер текущего дня --- */
    function render() {
        if (!weekDates.length) {
            summary.innerHTML = '';
            grid.innerHTML = '<p class="sched-empty">Меню на эту неделю ещё не добавлено</p>';
            return;
        }
        const date  = weekDates[selDay];
        const meals = weekRows.filter(r => r[0] === date);
        const tot   = meals.reduce((t, r) => {
            const d = dishLib[r[2]];
            return d ? { p: t.p + d.p, f: t.f + d.f, c: t.c + d.c, e: t.e + d.e } : t;
        }, { p: 0, f: 0, c: 0, e: 0 });

        summary.innerHTML = `
            <div class="sched-sum-item sched-sum-kcal"><b>${tot.e}</b><span>ккал</span></div>
            <div class="sched-sum-item"><b>${tot.p}<small> г</small></b><span>Белки</span></div>
            <div class="sched-sum-item"><b>${tot.f}<small> г</small></b><span>Жиры</span></div>
            <div class="sched-sum-item"><b>${tot.c}<small> г</small></b><span>Углеводы</span></div>`;

        grid.innerHTML = meals.map(([, type, name]) => {
            const d = dishLib[name];
            if (!d) return `
                <div class="sched-card">
                    <div class="sched-card-body">
                        <h4 class="sched-card-name">${name}</h4>
                        <div class="sched-card-weight" style="color:var(--gold)">Добавьте блюдо в Справочник</div>
                    </div>
                </div>`;
            return `
                <div class="sched-card">
                    <div class="sched-card-type">${type}</div>
                    <div class="sched-card-img"><img src="${d.img}" alt="${name}" loading="lazy"></div>
                    <div class="sched-card-body">
                        <h4 class="sched-card-name">${name}</h4>
                        <div class="sched-card-weight">${d.w} г</div>
                        <div class="sched-macros">
                            <div class="sched-macro"><b>${d.p}</b><span>Белки</span></div>
                            <div class="sched-macro"><b>${d.f}</b><span>Жиры</span></div>
                            <div class="sched-macro"><b>${d.c}</b><span>Углев</span></div>
                            <div class="sched-macro sched-macro--kcal"><b>${d.e}</b><span>ккал</span></div>
                        </div>
                    </div>
                </div>`;
        }).join('');
    }

    /* --- Состояние загрузки --- */
    function showLoading() {
        summary.innerHTML = '';
        grid.innerHTML = '<p class="sched-empty">Загрузка меню…</p>';
    }

    /* --- Кнопки программ --- */
    document.querySelectorAll('.sched-prog').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.sched-prog').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadedSheet = '';
            showLoading();
            try {
                await loadSheet(btn.querySelector('.sched-prog-name').textContent.trim());
            } catch {
                grid.innerHTML = '<p class="sched-empty">Не удалось загрузить меню</p>';
            }
        });
    });

    /* --- Инициализация --- */
    (async () => {
        showLoading();
        try {
            await loadDishes();
            const first = document.querySelector('.sched-prog.active .sched-prog-name');
            await loadSheet(first ? first.textContent.trim() : 'Похудение');
        } catch {
            grid.innerHTML = '<p class="sched-empty">Не удалось загрузить меню. Проверьте доступ к таблице.</p>';
        }
    })();
})();

/* ============================================
   PRIMARY BUTTONS — MAGNETIC HOVER
   ============================================ */
document.querySelectorAll('.btn-primary, .btn-nav').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width  / 2) * 0.25;
        const y = (e.clientY - rect.top  - rect.height / 2) * 0.25;
        btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
    });
});

/* ============================================
   NAV ACTIVE STATE
   ============================================ */
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-link');

const navObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navItems.forEach(link => {
                    link.style.color =
                        link.getAttribute('href') === `#${entry.target.id}`
                            ? 'var(--gold)' : '';
                });
            }
        });
    },
    { threshold: 0.45 }
);

sections.forEach(s => navObserver.observe(s));
