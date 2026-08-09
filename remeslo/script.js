/* ==========================================================================
   «Фрезер» — прототип «Ремесло». Ванильный JS, без зависимостей.
   ========================================================================== */
(function () {
  'use strict';

  /* --------------------------------------------------------------------
     Единственная константа со ссылкой на карточку площадки.
     Отзывы появятся здесь после первых событий — сами их не пишем.
     -------------------------------------------------------------------- */
  var YANDEX_MAPS_URL = 'https://yandex.ru/maps/?text=' +
    encodeURIComponent('Москва, 2-я Фрезерная улица, 3');

  var TELEGRAM_URL = 'https://t.me/frezer_space';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var lessMotion = function () { return reduced.matches; };

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ====================================================================
     1. Ссылки-константы
     ==================================================================== */
  function wireConstants() {
    $$('[data-yandex]').forEach(function (a) { a.href = YANDEX_MAPS_URL; });
    $$('[data-telegram]').forEach(function (a) { a.href = TELEGRAM_URL; });
  }

  /* ====================================================================
     2. Шторка перехода между страницами
     ==================================================================== */
  function pageCurtain() {
    var reveal = function () { root.classList.add('ready'); };

    if (document.readyState === 'complete') { requestAnimationFrame(reveal); }
    else { window.addEventListener('load', function () { requestAnimationFrame(reveal); }); }
    // страховка: если load почему-то не сработает — не оставляем страницу под шторкой
    setTimeout(reveal, 1200);

    window.addEventListener('pageshow', function (e) { if (e.persisted) reveal(); });

    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      if (a.target && a.target !== '_self') return;
      if (a.hasAttribute('download')) return;

      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;
      if (/^(mailto|tel|javascript):/i.test(href)) return;

      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;

      e.preventDefault();
      if (lessMotion()) { location.href = a.href; return; }

      root.classList.remove('ready');
      setTimeout(function () { location.href = a.href; }, 380);
    });
  }

  /* ====================================================================
     3. Появление при скролле
     ==================================================================== */
  function revealOnScroll() {
    var items = $$('[data-reveal], .scale__row, .map');
    if (!items.length) return;

    if (!('IntersectionObserver' in window) || lessMotion()) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    // задержка между соседями внутри одной группы — до наблюдения
    $$('[data-stagger]').forEach(function (group) {
      var step = parseInt(group.getAttribute('data-stagger'), 10) || 90;
      $$(':scope > *', group).forEach(function (kid, i) {
        var target = (kid.hasAttribute('data-reveal') || kid.classList.contains('scale__row'))
          ? kid : $('[data-reveal]', kid);
        if (target && !target.style.getPropertyValue('--d')) {
          target.style.setProperty('--d', (i * step) + 'ms');
        }
      });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    items.forEach(function (el) { io.observe(el); });

    // первый экран показываем сразу, порядком, а не по факту скролла:
    // ничего важного не должно ждать движения мыши
    var openingSweep = function () {
      items.forEach(function (el) {
        if (el.classList.contains('is-in')) return;
        if (el.getBoundingClientRect().top < window.innerHeight - 24) {
          el.classList.add('is-in');
          io.unobserve(el);
        }
      });
    };
    requestAnimationFrame(openingSweep);
    window.addEventListener('load', openingSweep);
  }

  /* ====================================================================
     4. Счётчики
     ==================================================================== */
  function counters() {
    var nodes = $$('[data-count]');
    if (!nodes.length) return;

    var fmt = function (n) {
      return n >= 1000 ? n.toLocaleString('ru-RU').replace(/ /g, ' ') : String(n);
    };

    if (!('IntersectionObserver' in window) || lessMotion()) {
      nodes.forEach(function (el) { el.textContent = fmt(+el.getAttribute('data-count')); });
      return;
    }

    nodes.forEach(function (el) { el.textContent = '0'; });

    var run = function (el) {
      var to = +el.getAttribute('data-count');
      var dur = 1500 + Math.min(600, to / 3);
      var t0 = 0;
      var tick = function (t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - p, 4);           // easeOutQuart
        el.textContent = fmt(Math.round(to * e));
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = fmt(to);
      };
      requestAnimationFrame(tick);
    };

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        run(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.4 });

    nodes.forEach(function (el) { io.observe(el); });
  }

  /* ====================================================================
     5. Шапка: волосок при прокрутке + мобильное меню
     ==================================================================== */
  function header() {
    var hdr = $('.hdr');
    if (!hdr) return;

    var onScroll = function () { hdr.classList.toggle('is-stuck', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var burger = $('.burger');
    var mnav = $('.mnav');
    if (!burger || !mnav) return;

    var setOpen = function (open) {
      document.body.classList.toggle('nav-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      mnav.setAttribute('aria-hidden', open ? 'false' : 'true');
    };

    burger.addEventListener('click', function () {
      setOpen(!document.body.classList.contains('nav-open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        setOpen(false); burger.focus();
      }
    });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    setOpen(false);
  }

  /* ====================================================================
     6. Горизонтальная лента: перетаскивание мышью + инерция
     ==================================================================== */
  function dragStrip() {
    $$('[data-strip]').forEach(function (strip) {
      var meter = strip.parentElement && $('[data-strip-progress]', strip.parentElement);
      var raf = null;
      var samples = [];
      var dragging = false, moved = 0, startX = 0, startScroll = 0;

      var maxScroll = function () { return Math.max(1, strip.scrollWidth - strip.clientWidth); };

      var paint = function () {
        if (!meter) return;
        var p = strip.scrollLeft / maxScroll();
        meter.style.width = (8 + Math.max(0, Math.min(1, p)) * 92) + '%';
      };
      paint();
      strip.addEventListener('scroll', paint, { passive: true });
      window.addEventListener('resize', paint);

      // раскладка стрелками с клавиатуры
      strip.addEventListener('keydown', function (e) {
        var step = strip.clientWidth * 0.7;
        if (e.key === 'ArrowRight') { strip.scrollLeft += step; e.preventDefault(); }
        if (e.key === 'ArrowLeft') { strip.scrollLeft -= step; e.preventDefault(); }
      });

      $$('img', strip).forEach(function (img) {
        img.addEventListener('dragstart', function (e) { e.preventDefault(); });
      });

      strip.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'touch') return;   // нативный скролл на тач — лучше
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        dragging = true; moved = 0;
        startX = e.clientX;
        startScroll = strip.scrollLeft;
        samples = [{ x: e.clientX, t: performance.now() }];
        strip.classList.add('is-drag');
        try { strip.setPointerCapture(e.pointerId); } catch (err) {}
      });

      strip.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var dx = e.clientX - startX;
        moved = Math.max(moved, Math.abs(dx));
        strip.scrollLeft = startScroll - dx;      // 1:1, от точки захвата
        samples.push({ x: e.clientX, t: performance.now() });
        if (samples.length > 6) samples.shift();
      });

      var release = function (e) {
        if (!dragging) return;
        dragging = false;
        strip.classList.remove('is-drag');
        try { strip.releasePointerCapture(e.pointerId); } catch (err) {}

        if (lessMotion() || samples.length < 2) return;

        var a = samples[0], b = samples[samples.length - 1];
        var dt = Math.max(1, b.t - a.t);
        var v = -(b.x - a.x) / dt * 1000;          // px/с в системе scrollLeft
        if (Math.abs(v) < 90) return;

        var last = performance.now();
        var step = function (now) {
          var frame = Math.min(48, now - last); last = now;
          strip.scrollLeft += v * frame / 1000;
          v *= Math.pow(0.9955, frame);            // мягкое затухание, как у скролла
          var at = strip.scrollLeft;
          if (Math.abs(v) > 25 && at > 0 && at < maxScroll()) raf = requestAnimationFrame(step);
          else raf = null;
        };
        raf = requestAnimationFrame(step);
      };

      strip.addEventListener('pointerup', release);
      strip.addEventListener('pointercancel', release);

      // после перетаскивания не открываем ссылку
      strip.addEventListener('click', function (e) {
        if (moved > 8) { e.preventDefault(); e.stopPropagation(); }
      }, true);
    });
  }

  /* ====================================================================
     7. Видео: автозапуск только если движение разрешено
     ==================================================================== */
  function heroVideo() {
    var v = $('[data-video]');
    var btn = $('[data-video-toggle]');
    if (!v) return;

    var label = function () {
      if (!btn) return;
      var playing = !v.paused;
      btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
      $('span', btn).textContent = playing ? 'Пауза' : 'Смотреть';
    };

    if (lessMotion()) { v.removeAttribute('autoplay'); v.pause(); }
    else { var p = v.play(); if (p && p.catch) p.catch(function () {}); }

    v.addEventListener('play', label);
    v.addEventListener('pause', label);
    label();

    if (btn) {
      btn.addEventListener('click', function () {
        if (v.paused) { var q = v.play(); if (q && q.catch) q.catch(function () {}); }
        else v.pause();
      });
    }

    // не крутим ролик вхолостую за пределами экрана
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          if (x.isIntersecting) { if (!lessMotion() && v.dataset.userPaused !== '1') {
            var r = v.play(); if (r && r.catch) r.catch(function () {});
          } }
          else v.pause();
        });
      }, { threshold: 0.15 });
      io.observe(v);
    }
    if (btn) btn.addEventListener('click', function () { v.dataset.userPaused = v.paused ? '1' : '0'; });
  }

  /* ====================================================================
     8. Форма заявки
     ПОДКЛЮЧЕНИЕ: реального бэкенда нет. Заявка должна уходить в Telegram.
     Здесь ждём POST на свой эндпоинт, который дальше дёргает Bot API:
         POST https://api.telegram.org/bot<TOKEN>/sendMessage
         { chat_id: <ID чата отдела продаж>, text: <собранная заявка> }
     Токен и chat_id держим на сервере, во фронт не выносим.
     Место подключения помечено ниже: // TODO: BACKEND
     ==================================================================== */
  function form() {
    var f = $('[data-form]');
    if (!f) return;
    var sent = $('[data-sent]');

    var showErr = function (field, on) { field.classList.toggle('is-err', on); };

    var validate = function () {
      var ok = true;
      $$('[required]', f).forEach(function (input) {
        var field = input.closest('.field');
        var bad = !input.value.trim() ||
          (input.type === 'tel' && input.value.replace(/\D/g, '').length < 10);
        showErr(field, bad);
        if (bad) { ok = false; input.setAttribute('aria-invalid', 'true'); }
        else input.removeAttribute('aria-invalid');
      });
      return ok;
    };

    $$('input, textarea, select', f).forEach(function (input) {
      input.addEventListener('input', function () {
        var field = input.closest('.field');
        if (field && field.classList.contains('is-err') && input.value.trim()) showErr(field, false);
      });
    });

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) {
        var first = $('.field.is-err input, .field.is-err textarea', f);
        if (first) first.focus();
        return;
      }

      var payload = {};
      new FormData(f).forEach(function (v, k) { payload[k] = v; });

      // TODO: BACKEND — заменить на fetch('/api/lead', {method:'POST', body: JSON.stringify(payload)})
      // сервер собирает текст и шлёт его в Telegram через sendMessage.
      console.info('Заявка (прототип, никуда не уходит):', payload);

      f.classList.add('is-sent');
      if (sent) {
        sent.classList.add('is-on');
        sent.setAttribute('tabindex', '-1');
        sent.focus({ preventScroll: false });
      }
    });

    var again = $('[data-form-reset]');
    if (again) {
      again.addEventListener('click', function () {
        f.reset();
        f.classList.remove('is-sent');
        if (sent) sent.classList.remove('is-on');
        var firstInput = $('input', f);
        if (firstInput) firstInput.focus();
      });
    }
  }

  /* ====================================================================
     Старт
     ==================================================================== */
  function init() {
    wireConstants();
    pageCurtain();
    revealOnScroll();
    counters();
    header();
    dragStrip();
    heroVideo();
    form();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
