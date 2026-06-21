# CLAUDE.md — Контекст проекта «Твой Выбор»

Этот файл даёт Claude Code полный контекст для продолжения работы над сайтом.

---

## Что это за проект

Лендинг **«Твой Выбор»** — доставка правильного питания в Сургуте и Нефтеюганске (vibiraiedu.ru).
Статический сайт: чистый HTML + CSS + JS, без фреймворков, без сборщиков, без npm.
Открывается двойным кликом на `index.html`.

---

## Стек и архитектура

- **HTML:** `index.html` — вся разметка, один файл
- **CSS:** `style.css` — дизайн-токены в `:root`, потом компонентные блоки, потом `@media`, потом блок `/* PREMIUM LAYER */`
- **JS:** `script.js` — без библиотек. IntersectionObserver для reveal-анимаций, FAQ-аккордеон, калькулятор калорий, 3D-tilt карточек, магнитные кнопки, телефонный форматтер
- **Шрифты:** Google Fonts CDN — Cormorant Garamond (заголовки) + Jost (текст)
- **Видео:** оптимизированные файлы `video-hero.webm` (VP9) и `video-hero.mp4` (H.264, faststart). Постер: `video-hero-poster.jpg`. Оригинал сохранён как `Tuna_salad_ingredients_pack_cont…_202606191820.mp4` (резервная копия).

---

## Дизайн-система (CSS custom properties)

```css
--bg-dark:       #0A1209   /* основной фон страницы */
--bg-section:    #111F15   /* фон чётных секций */
--bg-card:       #162418   /* фон карточек */
--bg-card-hover: #1C2E1F
--gold:          #C8A050   /* золотой акцент — заголовки, иконки, hover */
--gold-light:    #D4B570
--gold-dim:      rgba(200,160,80,0.14)
--green:         #5A9E6F   /* зелёный — кнопки btn-primary */
--green-light:   #68B07A
--text-primary:  #F0EBE0   /* основной текст */
--text-secondary:#8FA896   /* вторичный текст */
--text-muted:    #4A5E4F   /* использовать осторожно — низкий контраст */
--border:        rgba(255,255,255,0.07)
--border-gold:   rgba(200,160,80,0.26)
--font-display:  'Cormorant Garamond', Georgia, serif
--font-body:     'Jost', system-ui, sans-serif
--size-hero:     clamp(3rem, 7vw, 6.5rem)
--size-h2:       clamp(2rem, 5vw, 3.8rem)
--radius:        12px
--radius-lg:     20px
--ease:          cubic-bezier(0.16, 1, 0.3, 1)
--transition:    0.5s var(--ease)
--container:     1200px
```

---

## Структура файлов

```
Еда/
├── index.html
├── style.css
├── script.js
├── CLAUDE.md                   ← этот файл
├── README.md                   ← инструкция для пользователя
├── video-hero.webm             ← фоновое видео (VP9, 822 КБ)
├── video-hero.mp4              ← фоновое видео (H.264, 1011 КБ, faststart)
├── video-hero-poster.jpg       ← постер кадр (116 КБ)
├── Tuna_salad_ingredients_pack_cont…_202606191820.mp4  ← оригинал (резерв)
├── images/
│   ├── logo.png                ← логотип (хедер 60px, футер 96px)
│   └── menu/
│       ├── tuna-salad.jpeg
│       ├── chicken-breast.jpeg
│       ├── oatmeal-berries.jpeg
│       ├── beef-steak.jpeg
│       ├── chicken-soup.jpeg
│       └── protein-box.jpeg
└── massagers/
    ├── max.png                 ← иконка мессенджера Max
    └── telegram.png
```

---

## Секции сайта (порядок в index.html)

1. `<header id="header">` — фиксированный хедер, становится `scrolled` при прокрутке
2. `<section class="hero" id="hero">` — видео-фон (autoplay loop), заголовок
3. `<div class="ticker">` — бегущая строка (не section, нет id)
4. `<section class="stats" id="stats">` — 4 счётчика с анимацией
5. `<section class="about" id="about">` — 2 колонки: текст + фичи
6. `<section class="programs" id="programs">` — 5 карточек программ
7. `<section class="how" id="how">` — 3 шага
8. `<section class="calculator" id="calculator">` — калькулятор КБЖУ
9. `<section class="sched-section" id="menu">` — еженедельное расписание: выбор программы (5 шт) + выбор дня (Пн–Сб) + 4 блюда в день, рендерится через JS
10. `<section class="faq" id="faq">` — 6 вопросов, аккордеон
11. `<section class="contacts" id="contacts">` — адрес, телефон, почта, мессенджеры
12. `<section class="cta-section" id="order">` — форма заявки на фоне видео
13. `<footer class="footer">` — навигация, контакты, копирайт

---

## Как работают ключевые механики

### Reveal-анимации
Классы `.reveal-up`, `.reveal-fade`, `.reveal-left`, `.reveal-right` — начальное состояние `opacity:0` + `transform`. IntersectionObserver в `script.js` добавляет `.visible` → CSS-переход. Blur: `.reveal-up` дополнительно имеет `filter: blur(5px)` → `blur(0)`.

### FAQ аккордеон
CSS: `grid-template-rows: 0fr → 1fr` на `.faq-answer` (Safari 16+).
JS: автоматически определяет, поддерживает ли браузер эту анимацию (`needsHeightFallback`), и если нет — использует height-based анимацию через `scrollHeight`.
Структура: `.faq-answer > .faq-answer-inner > p` — оба вложенных div обязательны.

### Калькулятор калорий
Формула Миффлина-Сан Жеора. Мужчины: `(10*вес) + (6.25*рост) - (5*возраст) + 5`. Женщины: `... - 161`. Умножается на коэффициент активности, затем на цель (±%). Результат сравнивается с пороговыми значениями программ: 1050 / 1400 / 2100 / 2750 / ∞.

### Еженедельное расписание (секция меню)
JS-IIFE в конце `script.js`. Данные: массив `BASE[6][4]` (6 дней × 4 блюда, базовый масштаб 1800 ккал). Массив `PROGRAMS[5]` с множителями `scale` (0.5 / 0.667 / 1.0 / 1.389 / 1.667). Функция `render()` применяет `Math.round(value * scale)` ко всем макросам и весу, затем перерисовывает `#schedSummary` (итоги дня) и `#schedGrid` (4 карточки блюд).

### Магнитные кнопки
`mousemove` на `.btn-primary`, `.btn-nav` → `translate` на 25% от смещения курсора относительно центра кнопки.

### Мессенджеры pop-анимация
IntersectionObserver наблюдает за `.messenger-btns`. При попадании в viewport добавляет класс `.popped` к каждой кнопке с задержкой 130ms между ними. CSS `@keyframes messenger-pop` анимирует scale.

### Тикер (бегущая строка)
`.ticker-inner` содержит 14 элементов (7 уникальных × 2 для бесшовного цикла). CSS animation `ticker-scroll` двигает на `-50%` за 32s. При hover — `animation-play-state: paused`.

---

## Известные placeholder-данные (нужно заменить на реальные)

| Место | Текущее значение | Что нужно |
|-------|-----------------|-----------|
| Телефон хедер | `+7 (900) 000-00-00` | Реальный номер |
| `tel:` href | `tel:+79000000000` | Реальный номер |
| Адрес Сургут | `Сургут, ул. Энергетиков, 28` | Реальный |
| Адрес Нефтеюганск | `Нефтеюганск, мкр. 16, 2` | Реальный |
| Ссылка Max | `href="#"` в `.messenger-btn` | Реальная ссылка |
| Ссылка Telegram | `https://t.me/vibiraiedu` | Реальный username |
| Почта | `info@vibiraiedu.ru` | Реальная |
| Сайт в футере | `vibiraiedu.ru` | Реальный домен |

---

## Браузерная совместимость

Все Safari-фиксы уже применены:
- `min-height: 100vh; min-height: 100svh` — fallback для Safari < 15.4
- `top:0; right:0; bottom:0; left:0` вместо `inset: 0` — fallback для Safari < 14.1
- `-webkit-backdrop-filter` — рядом с `backdrop-filter` везде
- `z-index: 0` рядом с `isolation: isolate` — fallback для Safari < 15
- FAQ accordion JS-fallback для Safari < 16

---

## Правила стиля (taste-skill + frontend-design)

Эти правила применялись при разработке — соблюдать при продолжении:

- **Нет em-дашей** (`—`) в UI-тексте, только дефис (`-`) или пробел
- **Максимум 1 eyebrow** (маленький текст над заголовком золотом) на 3 секции
- **Нет scroll cues** (стрелок "прокрутите вниз")
- **Нет emoji** в UI — только SVG-иконки или PNG
- **Изображения** — только реальные фото из `images/menu/`, не placeholder сервисы
- **Не повторять layout** — каждая секция визуально отличается от соседних
- **`--text-muted`** (#4A5E4F) — не использовать для читаемого текста, только для декора

---

## Что можно улучшить / продолжить

- Подключить реальную отправку формы (сейчас просто меняет текст кнопки)
- Добавить больше блюд в секцию меню (сейчас 6)
- Добавить страницу "Меню" с полным списком блюд и фильтрацией по программе
- Добавить галерею / отзывы клиентов
- Заменить placeholder-данные на реальные (телефон, адреса, мессенджеры)
- Добавить реальный Яндекс.Карты или Google Maps iframe в блок контактов
- SEO: добавить `<meta description>`, `og:image`, `og:title`
