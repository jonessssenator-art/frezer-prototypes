/* ==========================================================================
   ФРЕЗЕР — вариант А «Афиша». Ванильный JS, без зависимостей.
   Всё, что двигается, проверяет prefers-reduced-motion и умеет не двигаться.
   ========================================================================== */

(function () {
  'use strict';

  /* --------------------------------------------------------------- Константы
     Единственные точки подключения внешних сервисов.
     ------------------------------------------------------------------------ */

  // Чат/бот, куда уходят заявки. Заполнить, когда заказчик пришлёт ник.
  var TELEGRAM_URL = 'https://t.me/';

  // Карточка площадки в Яндекс.Картах. Пока пусто — кнопка отзывов не рендерится.
  // Площадка не открылась, отзывов физически нет; выдумывать их нельзя.
  var YANDEX_REVIEWS_URL = '';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var noMotion = function () { return reduce.matches; };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ------------------------------------------------------------------ Шапка */

  function header() {
    var hdr = $('.hdr');
    if (!hdr) return;
    var last = window.pageYOffset;
    var ticking = false;

    function apply() {
      var y = window.pageYOffset;
      hdr.classList.toggle('is-stuck', y > 12);
      var menuOpen = document.documentElement.classList.contains('is-locked');
      if (!menuOpen && y > 320 && y > last + 4) hdr.classList.add('is-hidden');
      else if (y < last - 4 || y < 320) hdr.classList.remove('is-hidden');
      last = y;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(apply); }
    }, { passive: true });
    apply();
  }

  /* ------------------------------------------------------- Мобильное меню */

  function menu() {
    var btn = $('.burger');
    var box = $('.mmenu');
    var hdr = $('.hdr');
    if (!btn || !box) return;

    function set(open) {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      box.classList.toggle('is-open', open);
      box.setAttribute('aria-hidden', String(!open));
      // Закрытое меню не должно ловить Tab
      if ('inert' in box) box.inert = !open;
      else box.setAttribute('tabindex', open ? '' : '-1');
      document.documentElement.classList.toggle('is-locked', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (hdr) { hdr.classList.toggle('is-menu', open); hdr.classList.remove('is-hidden'); }
    }

    set(false);
    btn.addEventListener('click', function () {
      set(btn.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { set(false); btn.focus(); }
    });
    $$('a', box).forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
  }

  /* -------------------------------------------- Появление секций при скролле */

  function reveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;

    if (noMotion() || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    // Задержка внутри группы: элементы одной секции проявляются лесенкой
    $$('[data-stagger]').forEach(function (group) {
      var step = parseInt(group.getAttribute('data-stagger'), 10) || 90;
      $$('[data-reveal]', group).forEach(function (el, i) {
        if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', (i * step) + 'ms');
      });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------- Печать заголовка (оттиск) */

  function printTitle() {
    var title = $('[data-print]');
    if (!title) return;

    var lines = $$('[data-line]', title);
    var n = 0;

    lines.forEach(function (line) {
      var text = line.textContent;

      var ink = document.createElement('span');
      ink.className = 'hero__ink';
      ink.setAttribute('aria-hidden', 'true');

      line.textContent = '';
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        var s = document.createElement('span');
        s.className = 'ltr' + (ch === ' ' ? ' ltr--sp' : '');
        s.textContent = ch === ' ' ? ' ' : ch;
        // Оттиск ложится буква за буквой, но неровно — как на живом станке
        s.style.setProperty('--d', Math.round(n * 24 + Math.random() * 40) + 'ms');
        line.appendChild(s);
        // Красный прогон — точная копия набора, чтобы метрики совпали до пикселя
        ink.appendChild(s.cloneNode(true));
        n++;
      }
      line.appendChild(ink);
    });

    if (noMotion()) { title.classList.add('is-printed'); return; }
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { title.classList.add('is-printed'); });
    });
  }

  /* -------------------------------------- Росчерк: самопрорисовка по скроллу */

  function flourish() {
    var boxes = $$('[data-flourish]');
    if (!boxes.length) return;

    boxes.forEach(function (box) {
      var pen = $('.flourish__pen', box);
      if (!pen) return;
      var len = 0;
      try { len = pen.getTotalLength(); } catch (err) { len = 6000; }
      box.style.setProperty('--len', len.toFixed(1));

      if (noMotion()) { box.style.setProperty('--p', '1'); return; }
      box.style.setProperty('--p', '0');
    });

    if (noMotion()) return;

    var ticking = false;
    function draw() {
      var vh = window.innerHeight;
      boxes.forEach(function (box) {
        var r = box.getBoundingClientRect();
        // 0 — низ элемента только вошёл в экран, 1 — элемент прошёл 3/4 экрана
        var span = vh * 0.72 + r.height * 0.5;
        var p = (vh - r.top - r.height * 0.18) / span;
        p = p < 0 ? 0 : p > 1 ? 1 : p;
        box.style.setProperty('--p', p.toFixed(4));
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(draw); }
    }, { passive: true });
    window.addEventListener('resize', draw, { passive: true });
    draw();
  }

  /* --------------------------------------------------------- Счётчики цифр */

  function counters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;

    function fill(el) {
      var to = parseFloat(el.getAttribute('data-count'));
      var dur = 1100;
      if (noMotion() || !to) { el.textContent = to.toLocaleString('ru-RU'); return; }
      var t0 = null;
      function step(t) {
        if (t0 === null) t0 = t;
        var k = Math.min((t - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(to * eased).toLocaleString('ru-RU');
        if (k < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    if (noMotion() || !('IntersectionObserver' in window)) { nums.forEach(fill); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        fill(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { el.textContent = '0'; io.observe(el); });
  }

  /* -------------------------------------------------------- Бегущая строка */

  function marquee() {
    $$('.marquee').forEach(function (box) {
      var track = $('.marquee__track', box);
      if (!track) return;
      var guard = 0;
      while (track.scrollWidth * (box.querySelectorAll('.marquee__track').length) < box.offsetWidth * 2 && guard < 6) {
        var clone = track.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        box.appendChild(clone);
        guard++;
      }
      if (box.querySelectorAll('.marquee__track').length === 1) {
        var c = track.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        box.appendChild(c);
      }
    });
  }

  /* ------------------------------------------------ Переход между страницами */

  var KEY = 'frz-curtain';

  function transitions() {
    var curtain = $('.curtain');
    if (!curtain) return;

    // Приход на страницу: шторка уже опущена — поднимаем
    try {
      if (sessionStorage.getItem(KEY) === '1' && !noMotion()) {
        sessionStorage.removeItem(KEY);
        curtain.classList.add('is-cover');
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            curtain.classList.remove('is-cover');
            curtain.classList.add('is-lift');
            window.setTimeout(function () { curtain.classList.remove('is-lift'); }, 700);
          });
        });
      } else {
        sessionStorage.removeItem(KEY);
      }
    } catch (err) { /* приватный режим — просто без шторки */ }

    document.addEventListener('click', function (e) {
      if (noMotion()) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;

      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(https?:)?\/\//.test(href) || /^(mailto|tel):/.test(href)) return;
      if (!/\.html(\?|#|$)/.test(href)) return;

      var here = location.pathname.split('/').pop() || 'index.html';
      var target = href.split('#')[0].split('/').pop();
      if (target === here && href.indexOf('#') > -1) return; // якорь на этой же странице

      e.preventDefault();
      try { sessionStorage.setItem(KEY, '1'); } catch (err2) { /* нестрашно */ }
      curtain.classList.add('is-out');
      window.setTimeout(function () { location.href = href; }, 430);
    });

    // Возврат «назад» из кэша браузера — шторку убрать
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) curtain.className = 'curtain';
    });
  }

  /* -------------------------------------------------------- Внешние ссылки */

  function externals() {
    $$('[data-telegram]').forEach(function (a) { a.setAttribute('href', TELEGRAM_URL); });

    var slot = $('[data-reviews-slot]');
    if (!slot) return;
    if (!YANDEX_REVIEWS_URL) { slot.remove(); return; }
    var a = document.createElement('a');
    a.className = 'btn btn--red';
    a.href = YANDEX_REVIEWS_URL;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML = 'Читать отзывы на Яндекс.Картах <span class="btn__ar" aria-hidden="true">→</span>';
    slot.replaceWith(a);
  }

  /* --------------------------------------------------------------- Форма */

  function form() {
    var f = $('#zayavka-form');
    var done = $('#zayavka-done');
    if (!f || !done) return;

    function markBad(field, bad) {
      var wrap = field.closest('.field') || field.closest('.check');
      if (wrap) wrap.classList.toggle('field--bad', bad);
    }

    $$('input, select, textarea', f).forEach(function (el) {
      el.addEventListener('input', function () { markBad(el, false); });
      el.addEventListener('change', function () { markBad(el, false); });
    });

    f.addEventListener('submit', function (e) {
      e.preventDefault();

      var bad = null;
      $$('[required]', f).forEach(function (el) {
        var ok = el.type === 'checkbox' ? el.checked : String(el.value).trim().length > 0;
        markBad(el, !ok);
        if (!ok && !bad) bad = el;
      });
      if (bad) { bad.focus(); return; }

      /* ------------------------------------------------------------------
         ТОЧКА ПОДКЛЮЧЕНИЯ БЭКЕНДА.
         Здесь заявка уходит в Telegram. Бэкенда в прототипе нет намеренно:
         токен бота нельзя держать в браузере. На боевом сайте — POST на
         свой эндпоинт, а тот уже дёргает Bot API sendMessage.

           var data = Object.fromEntries(new FormData(f).entries());
           fetch('/api/zayavka', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(data)
           });

         Чат назначения и ник — в константе TELEGRAM_URL выше.
         ------------------------------------------------------------------ */

      f.classList.add('is-sent');
      done.classList.add('is-on');
      done.setAttribute('tabindex', '-1');
      done.focus({ preventScroll: true });
      done.scrollIntoView({ block: 'center', behavior: noMotion() ? 'auto' : 'smooth' });
    });

    var again = $('[data-form-reset]');
    if (again) {
      again.addEventListener('click', function () {
        f.reset();
        f.classList.remove('is-sent');
        done.classList.remove('is-on');
        $$('.field--bad', f).forEach(function (el) { el.classList.remove('field--bad'); });
        var first = $('input, select, textarea', f);
        if (first) first.focus();
      });
    }
  }

  /* --------------------------------------------------------------- Видео */

  function video() {
    var v = $('.film video');
    if (!v) return;
    if (noMotion()) { v.pause(); v.removeAttribute('autoplay'); return; }
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.2 });
    io.observe(v);
  }

  /* ---------------------------------------------------------------- Старт */

  function boot() {
    header();
    menu();
    printTitle();
    reveal();
    flourish();
    counters();
    marquee();
    transitions();
    externals();
    form();
    video();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
