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
   MENU CARD — 3D TILT ON HOVER
   ============================================ */
document.querySelectorAll('.menu-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width  - 0.5;
        const y = (e.clientY - rect.top)  / rect.height - 0.5;
        card.style.transform =
            `translateY(-6px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});

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
