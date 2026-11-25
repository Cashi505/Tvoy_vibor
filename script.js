/* =========================================================
   «Твой Выбор» — логика лендинга
   Чистый JS, без библиотек
   ========================================================= */
(function () {
  'use strict';

  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const money = n => n.toLocaleString('ru-RU').replace(/ /g, ' ') + '₽';

  /* =======================================================
     ДАННЫЕ ПРОГРАММ
     Цены перенесены из прежней версии сайта.
     Правится только здесь — вёрстка строится автоматически.
     ======================================================= */
  const GOALS = [
    {
      name: 'Снижение веса',
      programs: [
        {
          kcal: 900,  kcalLabel: '900 ккал',   name: 'Экспресс-фигура', sale: true, meals: 5,
          prices: { 1: 1250, 5: 6000, 7: 8350, 14: 16300, 30: 34500 },
          gift:   { 14: '2 дня в подарок' }
        },
        {
          kcal: 1400, kcalLabel: '1 400 ккал', name: 'Коррекция фигуры', meals: 5,
          prices: { 1: 1300, 5: 6250, 7: 8650, 14: 16950, 30: 35900 },
          gift:   { 14: '2 дня в подарок' }
        }
      ]
    },
    {
      name: 'Не хочу готовить',
      programs: [
        {
          kcal: 1200, kcalLabel: '1 200 ккал', name: '3-х разовое питание', meals: 3,
          prices: { 1: 1150, 5: 5500, 7: 7650, 14: 15000, 30: 31200 },
          gift:   { 14: '2 дня в подарок' }
        }
      ]
    },
    {
      name: 'Баланс',
      programs: [
        {
          kcal: 1800, kcalLabel: '1 800 ккал', name: 'Будь в форме!', meals: 5,
          prices: { 1: 1350, 5: 6500, 7: 9000, 14: 17600, 30: 37300 },
          gift:   { 30: '6 дней в подарок' }
        },
        {
          kcal: 2200, kcalLabel: '2 200 ккал', name: 'Всегда в форме', meals: 5,
          prices: { 1: 1450, 5: 7000, 7: 9650, 14: 18900, 30: 40000 },
          gift:   { 30: '6 дней в подарок' }
        }
      ]
    },
    {
      name: 'Набор массы',
      programs: [
        {
          kcal: 3000, kcalLabel: '3 000 ккал', name: 'Масса', meals: 5,
          prices: { 1: 1750, 5: 8500, 7: 11650, 14: 22800, 30: 48300 }
        }
      ]
    }
  ];

  const TRIAL = { price: 790, note: 'Пробный рацион на 1 день' };
  const DAYS  = [1, 5, 7, 14, 30];

  /* по умолчанию — как в макете: Снижение веса → 900 ккал → 5 дней */
  const state = { goal: 0, prog: 0, days: 5, trial: false };

  const currentProgram = () => GOALS[state.goal].programs[state.prog];

  /* =======================================================
     ШАПКА
     ======================================================= */
  const hdr = $('#hdr');
  const onScrollHeader = () => hdr.classList.toggle('hdr--stuck', window.scrollY > 8);
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* бургер */
  const burger = $('#burger');
  const nav = $('#nav');
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('is-open', !open);
  });
  nav.addEventListener('click', e => {
    if (e.target.closest('a')) {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  /* выбор города */
  const city = $('#city');
  const cityBtn = $('.city__btn', city);
  const cityList = $('.city__list', city);
  const cityName = $('#cityName');
  const ADDRESS = {
    'Сургут':      'Сургут, ул. Энергетиков, 28',
    'Нефтеюганск': 'Нефтеюганск, мкр. 16, 2'
  };

  cityBtn.addEventListener('click', () => {
    const open = cityBtn.getAttribute('aria-expanded') === 'true';
    cityBtn.setAttribute('aria-expanded', String(!open));
    cityList.hidden = open;
  });
  cityList.addEventListener('click', e => {
    const btn = e.target.closest('[data-city]');
    if (!btn) return;
    const name = btn.dataset.city;
    cityName.textContent = name;
    $$('[role="option"]', cityList).forEach(o => o.setAttribute('aria-selected', String(o === btn)));
    const addr = $('#ftrAddr');
    if (addr) {
      addr.innerHTML = Object.keys(ADDRESS)
        .sort(a => (a === name ? -1 : 1))
        .map(k => (k === name ? '<b>' + ADDRESS[k] + '</b>' : ADDRESS[k]))
        .join('<br>');
    }
    cityBtn.setAttribute('aria-expanded', 'false');
    cityList.hidden = true;
  });
  document.addEventListener('click', e => {
    if (!city.contains(e.target)) {
      cityBtn.setAttribute('aria-expanded', 'false');
      cityList.hidden = true;
    }
  });

  /* подсветка активного пункта меню */
  const navLinks = $$('.hdr__nav a');
  const sections = navLinks
    .map(a => ({ link: a, el: $(a.getAttribute('href')) }))
    .filter(s => s.el);
  function spyNav() {
    const line = window.scrollY + window.innerHeight * 0.35;
    let active = null;
    sections.forEach(s => {
      const top = s.el.getBoundingClientRect().top + window.scrollY;
      if (top <= line) active = s;
    });
    navLinks.forEach(l => l.classList.toggle('is-active', !!active && l === active.link));
  }
  if (sections.length) {
    spyNav();
    window.addEventListener('scroll', spyNav, { passive: true });
    window.addEventListener('resize', spyNav);
  }

  /* =======================================================
     КОНФИГУРАТОР МЕНЮ
     ======================================================= */
  const elGoals  = $('#cfgGoals');
  const elMeals  = $('#cfgMeals');
  const elDays   = $('#cfgDays');
  const elTotal  = $('#cfgTotal');

  function renderGoals() {
    elGoals.innerHTML = GOALS.map((g, gi) => `
      <div class="cfgGoal">
        <p class="cfgGoal__name">${g.name}</p>
        <div class="cfgGoal__opts">
          ${g.programs.map((p, pi) => `
            <button class="chip chip--kcal${gi === state.goal && pi === state.prog ? ' is-on' : ''}"
                    type="button" data-goal="${gi}" data-prog="${pi}">
              ${p.sale ? '<span class="chip__sale">Акция!</span>' : ''}
              <b>${p.kcalLabel}</b>
              <span>${p.name}</span>
            </button>`).join('')}
        </div>
      </div>`).join('');
  }

  /* количество блюд — не выбор пользователя, а фиксированное свойство
     программы (данные сверены с настоящим сайтом vibiraiedu.ru: у каждой
     программы своё число приёмов пищи, не всегда 3) */
  function renderMeals() {
    const n = currentProgram().meals;
    elMeals.innerHTML = `
      <div class="chip is-on">
        <b>${n} ${plural(n, 'блюдо', 'блюда', 'блюд')}</b>
      </div>`;
  }

  function renderDays() {
    const prog = currentProgram();
    const base = prog.prices[1];
    let html = `
      <button class="day-chip${state.trial ? ' is-on' : ''}" type="button" data-trial="1">
        <span class="day-chip__price">${money(TRIAL.price)}</span>
        <span class="day-chip__note">${TRIAL.note}</span>
      </button>`;

    html += DAYS.map(d => {
      const price = prog.prices[d];
      const old   = base * d;
      const off   = Math.round((1 - price / old) * 100);
      const gift  = prog.gift && prog.gift[d];
      const on    = !state.trial && state.days === d;
      return `
        <button class="day-chip${on ? ' is-on' : ''}" type="button" data-days="${d}">
          <span class="day-chip__lab">${d} ${plural(d, 'день', 'дня', 'дней')}</span>
          ${off > 0 ? `<span class="day-chip__old"><s>${money(old)}</s><i class="day-chip__off">-${off}%</i></span>` : ''}
          <span class="day-chip__price">${money(price)}</span>
          ${d > 1 ? `<span class="day-chip__per">${money(Math.round(price / d))}/день</span>` : ''}
          ${gift ? `<span class="day-chip__gift">${gift}</span>` : ''}
        </button>`;
    }).join('');

    elDays.innerHTML = html;
  }

  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }

  function renderTotal() {
    const total = state.trial ? TRIAL.price : currentProgram().prices[state.days];
    elTotal.textContent = money(total);
  }

  function renderCfg() {
    renderGoals();
    renderMeals();
    renderDays();
    renderTotal();
  }

  elGoals.addEventListener('click', e => {
    const btn = e.target.closest('[data-goal]');
    if (!btn) return;
    state.goal = +btn.dataset.goal;
    state.prog = +btn.dataset.prog;
    if (!currentProgram().prices[state.days]) state.days = 5;
    renderCfg();
  });

  elDays.addEventListener('click', e => {
    const btn = e.target.closest('[data-days],[data-trial]');
    if (!btn) return;
    if (btn.dataset.trial) {
      state.trial = true;
    } else {
      state.trial = false;
      state.days = +btn.dataset.days;
    }
    renderDays();
    renderTotal();
  });

  renderCfg();

  /* кнопки «Подобрать программу» на карточках целей */
  $$('.goal__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.goal = +btn.dataset.goal;
      state.prog = 0;
      state.trial = false;
      if (!currentProgram().prices[state.days]) state.days = 5;
      renderCfg();
      $('#menu').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* перенос выбора в форму заявки */
  $('#cfgSubmit').addEventListener('click', () => {
    const p = currentProgram();
    const days = state.trial ? 'пробный день' : state.days + ' ' + plural(state.days, 'день', 'дня', 'дней');
    const goalField = $('#ordGoal');
    if (goalField) goalField.value = `${GOALS[state.goal].name} — ${p.kcalLabel}, ${days}`;
  });

  /* =======================================================
     КАРУСЕЛИ
     ======================================================= */
  function makeCarousel(root, sideClass) {
    if (!root) return;
    const track = $('.carousel__track', root);
    const slides = Array.from(track.children);
    if (slides.length < 2) return;
    let center = Math.floor(slides.length / 2);

    function paint() {
      slides.forEach((s, i) => s.classList.toggle(sideClass, i !== center));
      const order = slides.map((s, i) => {
        const d = i - center;
        s.style.order = String(d);
        return s;
      });
      void order;
    }

    function move(step) {
      center = (center + step + slides.length) % slides.length;
      paint();
    }

    $('.carousel__nav--prev', root).addEventListener('click', () => move(-1));
    $('.carousel__nav--next', root).addEventListener('click', () => move(1));

    /* свайп */
    let x0 = null;
    track.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) move(dx < 0 ? 1 : -1);
      x0 = null;
    }, { passive: true });

    /* клавиатура */
    root.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'ArrowRight') move(1);
    });

    paint();
  }

  makeCarousel($('#revCarousel'), 'rev__slide--side');

  /* =======================================================
     FAQ
     ======================================================= */
  $$('.faq__q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq__item');
      const open = q.getAttribute('aria-expanded') === 'true';
      $$('.faq__item').forEach(i => {
        i.classList.remove('is-open');
        $('.faq__q', i).setAttribute('aria-expanded', 'false');
      });
      if (!open) {
        item.classList.add('is-open');
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* =======================================================
     КАЛЬКУЛЯТОР КАЛОРИЙ (Миффлин — Сан Жеор)
     ======================================================= */
  const calcForm = $('#calcForm');
  const calcNum  = $('#calcNum');
  const calcCap  = $('#calcCap');
  const calcErr  = $('#calcErr');
  let calcKcal = null;

  const calcFields = ['#calcSex', '#calcHeight', '#calcAct', '#calcAge', '#calcWeight', '#calcGoal'].map(sel => $(sel));

  function recalc() {
    const [sex, height, act, age, weight, goal] = calcFields.map(f => f.value);
    const ok = sex && act && goal && +height > 0 && +age > 0 && +weight > 0;

    calcFields.forEach(f => f.parentElement.classList.remove('is-err'));
    if (!ok) { calcKcal = null; return false; }

    const bmr = 10 * (+weight) + 6.25 * (+height) - 5 * (+age) + (sex === 'm' ? 5 : -161);
    const kcal = Math.round(bmr * (+act) * (1 + (+goal)) / 10) * 10;
    calcKcal = kcal;
    calcNum.textContent = kcal.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ккал';
    calcCap.textContent = 'Ваша примерная норма';
    calcErr.hidden = true;
    return true;
  }

  calcFields.forEach(f => {
    f.addEventListener('input', recalc);
    f.addEventListener('change', recalc);
  });

  $('#calcCta').addEventListener('click', () => {
    if (!recalc()) {
      calcErr.hidden = false;
      calcFields.forEach(f => { if (!f.value) f.parentElement.classList.add('is-err'); });
      calcFields.find(f => !f.value).focus();
      return;
    }
    /* ближайшая по калорийности программа */
    let best = { gi: 0, pi: 0, diff: Infinity };
    GOALS.forEach((g, gi) => g.programs.forEach((p, pi) => {
      const diff = Math.abs(p.kcal - calcKcal);
      if (diff < best.diff) best = { gi, pi, diff };
    }));
    state.goal = best.gi;
    state.prog = best.pi;
    state.trial = false;
    if (!currentProgram().prices[state.days]) state.days = 5;
    renderCfg();
    $('#menu').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* =======================================================
     ФОРМА ЗАЯВКИ
     ======================================================= */
  const orderForm = $('#orderForm');
  const orderMsg  = $('#orderMsg');
  const phone     = $('#ordPhone');

  phone.addEventListener('input', () => {
    let d = phone.value.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (!d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);
    let out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 5) out += ') ' + d.slice(4, 7);
    if (d.length >= 8) out += '-' + d.slice(7, 9);
    if (d.length >= 10) out += '-' + d.slice(9, 11);
    phone.value = out;
  });

  orderForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#ordName');
    const goal = $('#ordGoal');
    let bad = null;

    [name, phone, goal].forEach(f => f.parentElement.classList.remove('is-err'));

    if (name.value.trim().length < 2) bad = name;
    else if (phone.value.replace(/\D/g, '').length < 11) bad = phone;
    else if (!goal.value.trim()) bad = goal;

    if (bad) {
      bad.parentElement.classList.add('is-err');
      bad.focus();
      orderMsg.textContent = 'Проверьте заполнение поля';
      orderMsg.className = 'order__msg is-err';
      return;
    }

    /* TODO: подключить реальную отправку заявки (почта / CRM / Telegram-бот) */
    orderMsg.textContent = 'Заявка принята — свяжемся с вами в ближайшее время';
    orderMsg.className = 'order__msg is-ok';
    orderForm.reset();
  });

  /* =======================================================
     ПОЯВЛЕНИЕ ПРИ ПРОКРУТКЕ
     ======================================================= */
  if ('IntersectionObserver' in window) {
    const targets = $$([
      '.sec__head', '.hero__col > *', '.goal', '.why__card',
      '.cfg', '.carousel', '.keep__col > *', '.keep__pic',
      '.steps', '.fresh', '.gift__card', '.calc__box',
      '.rev__col > *', '.faq__item', '.order__col > *', '.order__pic'
    ].join(','));

    targets.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = ((i % 4) * 60) + 'ms';
    });

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        obs.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    targets.forEach(el => io.observe(el));
  }

  /* плавная прокрутка по якорям */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#' || id.length < 2) return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
