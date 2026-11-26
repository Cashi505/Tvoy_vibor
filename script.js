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
     Тарифы на 26.11.2026, проверены в витрине WordPress.
     Длительности, скидки и цены за день соответствуют тому, что видит покупатель.
     ======================================================= */
  const GOALS = [
    {
      name: 'Снижение веса',
      programs: [
        {
          kcal: 900,  kcalLabel: '900 ккал',   name: 'Экспресс фигуры', meals: 5
        },
        {
          kcal: 1400, kcalLabel: '1 400 ккал', name: 'Коррекция фигуры', meals: 5
        }
      ]
    },
    {
      name: 'Не хочу готовить',
      programs: [
        {
          kcal: 1200, kcalLabel: '1 200 ккал', name: 'Не хочу готовить', meals: 3
        }
      ]
    },
    {
      name: 'Баланс',
      programs: [
        {
          kcal: 1800, kcalLabel: '1 800 ккал', name: 'Будь в форме', meals: 5
        },
        {
          kcal: 2200, kcalLabel: '2 200 ккал', name: 'Всегда в форме', meals: 5
        }
      ]
    },
    {
      name: 'Набор массы',
      programs: [
        {
          kcal: 3000, kcalLabel: '3 000 ккал', name: 'Набор массы', meals: 5
        }
      ]
    }
  ];

  const TARIFFS = {
    'Сургут': {
      900: [
        { days: 2, price: 2295, trial: true },
        { days: 5, price: 6500, old: 6750, daily: 1300, discount: 4 },
        { days: 7, price: 9000, old: 9450, daily: 1285, discount: 5 },
        { days: 14, price: 17550, old: 18900, daily: 1253, discount: 7, gift: 2 },
        { days: 30, price: 37300, old: 40500, daily: 1243, discount: 8 },
      ],
      1200: [
        { days: 2, price: 2125, trial: true },
        { days: 5, price: 6000, old: 6250, daily: 1200, discount: 4 },
        { days: 7, price: 8350, old: 8750, daily: 1193, discount: 5 },
        { days: 14, price: 16300, old: 17500, daily: 1164, discount: 7, gift: 2 },
        { days: 30, price: 34500, old: 37500, daily: 1150, discount: 8 },
      ],
      1400: [
        { days: 2, price: 2465, trial: true },
        { days: 5, price: 6750, old: 7000, daily: 1350, discount: 4 },
        { days: 7, price: 9300, old: 9800, daily: 1328, discount: 5 },
        { days: 14, price: 18300, old: 19600, daily: 1307, discount: 7, gift: 2 },
        { days: 30, price: 38650, old: 42000, daily: 1288, discount: 8 },
      ],
      1800: [
        { days: 2, price: 2720, trial: true },
        { days: 5, price: 7000, old: 7250, daily: 1400, discount: 4 },
        { days: 7, price: 9650, old: 10150, daily: 1379, discount: 5 },
        { days: 14, price: 18900, old: 20300, daily: 1350, discount: 7 },
        { days: 30, price: 40000, old: 43500, daily: 1333, discount: 8, gift: 6 },
      ],
      2200: [
        { days: 2, price: 3060, trial: true },
        { days: 5, price: 7450, old: 7750, daily: 1490, discount: 4 },
        { days: 7, price: 10300, old: 10850, daily: 1471, discount: 5 },
        { days: 14, price: 20200, old: 21700, daily: 1443, discount: 7 },
        { days: 30, price: 42800, old: 46500, daily: 1427, discount: 8, gift: 6 },
      ],
      3000: [
        { days: 2, price: 3400, trial: true },
        { days: 5, price: 8900, old: 9250, daily: 1780, discount: 4 },
        { days: 7, price: 12300, old: 12950, daily: 1757, discount: 5 },
        { days: 14, price: 24100, old: 25900, daily: 1721, discount: 7 },
        { days: 30, price: 51000, old: 55500, daily: 1700, discount: 8 },
      ],
    },
    'Нефтеюганск': {
      900: [
        { days: 2, price: 2465, trial: true },
        { days: 8, price: 10750, old: 11200, daily: 1344, discount: 5 },
        { days: 14, price: 18300, old: 19600, daily: 1307, discount: 7, gift: 2 },
        { days: 30, price: 38650, old: 42000, daily: 1288, discount: 8 },
      ],
      1200: [
        { days: 2, price: 2295, trial: true },
        { days: 8, price: 10000, old: 10400, daily: 1250, discount: 5 },
        { days: 14, price: 17000, old: 18200, daily: 1214, discount: 7, gift: 2 },
        { days: 30, price: 35900, old: 39000, daily: 1197, discount: 8 },
      ],
      1400: [
        { days: 2, price: 2635, trial: true },
        { days: 8, price: 11200, old: 11600, daily: 1400, discount: 5 },
        { days: 14, price: 18900, old: 20300, daily: 1350, discount: 7, gift: 2 },
        { days: 30, price: 40000, old: 43500, daily: 1333, discount: 8, gift: 6 },
      ],
      1800: [
        { days: 2, price: 2890, trial: true },
        { days: 8, price: 11900, old: 12400, daily: 1488, discount: 5 },
        { days: 14, price: 20200, old: 21700, daily: 1443, discount: 7 },
        { days: 30, price: 42800, old: 46500, daily: 1427, discount: 8 },
      ],
      2200: [
        { days: 2, price: 3230, trial: true },
        { days: 8, price: 12300, old: 12800, daily: 1538, discount: 5 },
        { days: 14, price: 20900, old: 22400, daily: 1493, discount: 7 },
        { days: 30, price: 44150, old: 48000, daily: 1472, discount: 8 },
      ],
      3000: [
        { days: 2, price: 3655, trial: true },
        { days: 8, price: 14600, old: 15200, daily: 1825, discount: 5 },
        { days: 14, price: 24700, old: 26600, daily: 1764, discount: 7 },
        { days: 30, price: 52400, old: 57000, daily: 1747, discount: 8 },
      ],
    },
  };

  const state = { city: 'Сургут', goal: 0, prog: 0, days: 2 };

  const currentProgram = () => GOALS[state.goal].programs[state.prog];
  const currentTariffs = () => TARIFFS[state.city][currentProgram().kcal];
  const selectedTariff = () => currentTariffs().find(tariff => tariff.days === state.days);

  function resetDuration() {
    state.days = currentTariffs()[currentProgram().kcal === 900 ? 0 : 1].days;
  }

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
  const INSTAGRAM = {
    'Сургут': 'https://instagram.com/tvoivibor_surgut?utm_medium=copy_link',
    'Нефтеюганск': 'https://instagram.com/tvoivibor_nefteugansk?utm_medium=copy_link'
  };

  cityBtn.addEventListener('click', () => {
    const open = cityBtn.getAttribute('aria-expanded') === 'true';
    cityBtn.setAttribute('aria-expanded', String(!open));
    cityList.hidden = open;
  });
  function selectCity(name) {
    state.city = name;
    cityName.textContent = name;
    $$('[role="option"]', cityList).forEach(option => {
      option.setAttribute('aria-selected', String(option.dataset.city === name));
    });
    $('#ftrInstagram').href = INSTAGRAM[name];
    showOrderSummary('');
    const trialPrices = Object.values(TARIFFS[name]).map(tariffs => tariffs[0].price);
    $('#heroTrialPrice').textContent = money(Math.min(...trialPrices));
    resetDuration();
    renderCfg();
  }

  cityList.addEventListener('click', e => {
    const btn = e.target.closest('[data-city]');
    if (!btn) return;
    if (btn.dataset.city !== state.city) {
      selectCity(btn.dataset.city);
      const url = new URL(location.href);
      url.searchParams.set('city', state.city);
      history.replaceState(null, '', url);
    }
    cityBtn.setAttribute('aria-expanded', 'false');
    cityList.hidden = true;
    cityBtn.focus({ preventScroll: true });
  });
  document.addEventListener('click', e => {
    if (!city.contains(e.target)) {
      cityBtn.setAttribute('aria-expanded', 'false');
      cityList.hidden = true;
    }
  });

  city.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !cityList.hidden) {
      cityBtn.click();
      cityBtn.focus();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const options = $$('[role="option"]', cityList);
    if (cityList.hidden) {
      cityBtn.click();
      options.find(option => option.getAttribute('aria-selected') === 'true').focus();
      return;
    }
    const current = options.indexOf(document.activeElement);
    const step = e.key === 'ArrowDown' ? 1 : -1;
    options[(current + step + options.length) % options.length].focus();
  });

  nav.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      burger.click();
      burger.focus();
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
                    type="button" data-goal="${gi}" data-prog="${pi}" data-kcal="${p.kcal}"
                    aria-pressed="${gi === state.goal && pi === state.prog}">
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

  function dayLabel(days) {
    return days + ' ' + plural(days, 'день', 'дня', 'дней');
  }

  function renderDays() {
    elDays.innerHTML = currentTariffs().map(tariff => {
      const { days, price, old, discount, daily, gift, trial } = tariff;
      const selected = state.days === days;
      return `
        <button class="day-chip${selected ? ' is-on' : ''}" type="button"
                data-days="${days}" aria-pressed="${selected}">
          <span class="day-chip__lab">${trial ? 'Пробные 2 дня' : dayLabel(days)}</span>
          ${trial ? '<span class="day-chip__off">−15%</span>' : ''}
          ${old ? `<span class="day-chip__old"><s>${money(old)}</s>${discount ? `<i class="day-chip__off">-${discount}%</i>` : ''}</span>` : ''}
          <span class="day-chip__price">${money(price)}</span>
          ${daily ? `<span class="day-chip__per">${money(daily)}/день</span>` : ''}
          ${gift ? `<span class="day-chip__gift">+${dayLabel(gift)} в подарок</span>` : ''}
        </button>`;
    }).join('');
  }

  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }

  function renderTotal() {
    elTotal.textContent = money(selectedTariff().price);
  }

  function renderCfg() {
    renderGoals();
    renderMeals();
    renderDays();
    renderTotal();
  }

  function selectProgram(goal, program) {
    state.goal = goal;
    state.prog = program;
    resetDuration();
    renderCfg();
  }

  elGoals.addEventListener('click', e => {
    const btn = e.target.closest('[data-goal]');
    if (!btn) return;
    selectProgram(+btn.dataset.goal, +btn.dataset.prog);
    $(`[data-kcal="${currentProgram().kcal}"]`, elGoals).focus({ preventScroll: true });
  });

  elDays.addEventListener('click', e => {
    const btn = e.target.closest('[data-days]');
    if (!btn) return;
    state.days = +btn.dataset.days;
    $$('[data-days]', elDays).forEach(option => {
      const selected = option === btn;
      option.classList.toggle('is-on', selected);
      option.setAttribute('aria-pressed', String(selected));
    });
    renderTotal();
  });

  const requestedCity = new URLSearchParams(location.search).get('city');
  selectCity(Object.hasOwn(TARIFFS, requestedCity) ? requestedCity : state.city);

  function goToMenu() {
    if (location.hash === '#menu') $('#menu').scrollIntoView();
    else location.hash = 'menu';
  }

  /* кнопки «Подобрать программу» на карточках целей */
  $$('.goal__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectProgram(+btn.dataset.goal, 0);
      goToMenu();
    });
  });

  function showOrderSummary(text) {
    const summary = $('#orderSummary');
    summary.textContent = text;
    summary.hidden = !text;
  }

  $$('[data-contact-intent]').forEach(link => {
    link.addEventListener('click', () => {
      const intent = link.dataset.contactIntent;
      showOrderSummary(intent ? `${state.city}, ${intent}` : '');
    });
  });

  $('#cfgSubmit').addEventListener('click', () => {
    const program = currentProgram();
    const tariff = selectedTariff();
    const duration = tariff.trial ? 'Пробные 2 дня' : dayLabel(tariff.days);
    const gift = tariff.gift ? ` (+${dayLabel(tariff.gift)} в подарок)` : '';
    showOrderSummary(`${state.city}, ${program.name}, ${program.kcalLabel}, ${duration}${gift}, ${money(tariff.price)}`);
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
      slides.forEach((slide, i) => {
        const distance = (i - center + slides.length + 1) % slides.length - 1;
        slide.classList.toggle(sideClass, distance !== 0);
        slide.style.order = String(distance);
      });
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
  const calcNum  = $('#calcNum');
  const calcCap  = $('#calcCap');
  const calcErr  = $('#calcErr');
  let calcKcal = null;

  const calcFields = ['#calcSex', '#calcHeight', '#calcAct', '#calcAge', '#calcWeight', '#calcGoal'].map(sel => $(sel));

  function recalc() {
    const [sex, height, act, age, weight, goal] = calcFields.map(f => f.value);
    calcFields.forEach(f => f.parentElement.classList.remove('is-err'));
    if (calcFields.some(f => !f.validity.valid)) {
      calcKcal = null;
      calcNum.textContent = '0 ккал';
      calcCap.textContent = 'Заполните поля для расчёта';
      return false;
    }

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

  $('#calcForm').addEventListener('submit', e => e.preventDefault());

  $('#calcCta').addEventListener('click', () => {
    if (!recalc()) {
      calcErr.hidden = false;
      const invalid = calcFields.filter(f => !f.validity.valid);
      invalid.forEach(f => f.parentElement.classList.add('is-err'));
      invalid[0].focus();
      return;
    }
    /* ближайшая по калорийности программа */
    let best = { gi: 0, pi: 0, diff: Infinity };
    GOALS.forEach((g, gi) => g.programs.forEach((p, pi) => {
      const diff = Math.abs(p.kcal - calcKcal);
      if (diff < best.diff) best = { gi, pi, diff };
    }));
    selectProgram(best.gi, best.pi);
    goToMenu();
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

  /* =======================================================
     COOKIE-УВЕДОМЛЕНИЕ
     ======================================================= */
  const cookieBanner = $('#cookieBanner');
  const cookieAccept = $('#cookieAccept');
  if (cookieBanner && cookieAccept) {
    let accepted = false;
    try { accepted = localStorage.getItem('tv_cookie_ok') === '1'; } catch (_) {}
    if (!accepted) cookieBanner.hidden = false;
    cookieAccept.addEventListener('click', () => {
      cookieBanner.hidden = true;
      try { localStorage.setItem('tv_cookie_ok', '1'); } catch (_) {}
    });
  }

  /* =======================================================
     АНАЛИТИКА БОЕВОГО ДОМЕНА (Метрика, click.ru, Calltouch)
     Запускается строго на vibiraiedu.ru после load, чтобы не
     засорять рабочую статистику проверками на превью и стендах.
     ======================================================= */
  function initProductionAnalytics() {
    const host = location.hostname.toLowerCase();
    if (host !== 'vibiraiedu.ru' && host !== 'www.vibiraiedu.ru') return;

    const loadScript = src => {
      const s = document.createElement('script');
      s.async = true;
      s.src = src;
      document.head.appendChild(s);
    };

    const startDeferred = () => {
      setTimeout(() => {
        window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
        window.ym.l = 1 * new Date();
        loadScript('https://mc.yandex.ru/metrika/tag.js');
        window.ym(92464363, 'init', {
          clickmap: true,
          trackLinks: true,
          accurateTrackBounce: true,
          webvisor: true
        });
        loadScript('https://af.click.ru/af.js?id=13206');
      }, 1000);

      setTimeout(() => {
        window.CalltouchDataObject = 'ct';
        window.ct = window.ct || function () { (window.ct.callbacks = window.ct.callbacks || []).push(arguments); };
        window.ct.loaded = false;
        window.ct.counters = ['uct7jyrx'];
        const modern = typeof Array.prototype.find === 'function';
        loadScript('https://mod.calltouch.ru/' + (modern ? 'init-min.js' : 'init.js') + '?id=uct7jyrx');
      }, 1500);
    };

    if (document.readyState === 'complete') startDeferred();
    else window.addEventListener('load', startDeferred, { once: true });
  }

  initProductionAnalytics();

})();
