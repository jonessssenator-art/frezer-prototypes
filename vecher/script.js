/* ============================================================
   «Фрезер» — вариант «Вечер». Ванильный JS, без зависимостей.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     ВНЕШНИЕ ССЫЛКИ — единственное место, где они заданы.
     Проставляются во все элементы с data-link="…".
     TODO: заменить на боевые адреса перед запуском.
     --------------------------------------------------------- */
  var LINKS = {
    // Карточка площадки на Яндекс.Картах — сюда же поедут отзывы
    // после первых событий.
    yandex: 'https://yandex.ru/maps/?text=Москва%2C%202-я%20Фрезерная%20улица%2C%203',
    // Аккаунт, в который приходят заявки.
    telegram: 'https://t.me/frezer_space'
  };

  var html = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');

  window.__frezerReady = true;
  html.classList.add('js');

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* --- Ссылки-константы ---------------------------------- */
  function applyLinks() {
    var nodes = document.querySelectorAll('[data-link]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-link');
      if (LINKS[key]) {
        nodes[i].setAttribute('href', LINKS[key]);
        nodes[i].setAttribute('rel', 'noopener');
        nodes[i].setAttribute('target', '_blank');
      }
    }
  }

  /* --- Появление при скролле ------------------------------ */
  function initReveal() {
    // Автоматическая лесенка задержек внутри контейнера
    var packs = document.querySelectorAll('[data-stagger]');
    for (var p = 0; p < packs.length; p++) {
      var step = parseInt(packs[p].getAttribute('data-stagger'), 10) || 70;
      var kids = packs[p].querySelectorAll('[data-reveal]');
      for (var k = 0; k < kids.length; k++) {
        if (!kids[k].style.getPropertyValue('--d')) {
          kids[k].style.setProperty('--d', Math.min(k, 8) * step + 'ms');
        }
      }
    }

    var targets = [].slice.call(document.querySelectorAll('[data-reveal], [data-inview]'));
    if (!('IntersectionObserver' in window)) {
      for (var n = 0; n < targets.length; n++) targets[n].classList.add('is-in');
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        show(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    function show(el) {
      el.classList.add('is-in');
      io.unobserve(el);
      var i = targets.indexOf(el);
      if (i > -1) targets.splice(i, 1);
    }

    for (var t = 0; t < targets.length; t++) io.observe(targets[t]);

    // Подстраховка: всё, что уже в кадре (в том числе после смены размера
    // окна или дозагрузки шрифтов), показываем без ожидания скролла.
    function sweep() {
      var h = window.innerHeight * 0.94;
      for (var i = targets.length - 1; i >= 0; i--) {
        var r = targets[i].getBoundingClientRect();
        if (r.top < h && r.bottom > 0) show(targets[i]);
      }
    }
    window.addEventListener('load', sweep);
    window.addEventListener('resize', function () {
      clearTimeout(sweep._t);
      sweep._t = setTimeout(sweep, 160);
    }, { passive: true });
    setTimeout(sweep, 120);
  }

  /* --- Параллакс + пятно света: один общий rAF ------------- */
  function initMotion() {
    var pars = [];
    var nodes = document.querySelectorAll('[data-par]');
    for (var i = 0; i < nodes.length; i++) {
      pars.push({
        el: nodes[i],
        k: parseFloat(nodes[i].getAttribute('data-par')) || 0.06,
        cur: 0,
        vis: false
      });
    }

    var torch = null;
    var tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    var cx = tx, cy = ty;
    var torchOn = false;

    if (fine.matches && !reduced.matches) {
      torch = document.createElement('div');
      torch.className = 'torch';
      torch.setAttribute('aria-hidden', 'true');
      document.body.appendChild(torch);

      window.addEventListener('pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        tx = e.clientX;
        ty = e.clientY;
        if (!torchOn) { torchOn = true; torch.classList.add('is-on'); }
      }, { passive: true });

      document.addEventListener('pointerleave', function () {
        torchOn = false;
        torch.classList.remove('is-on');
      });
    }

    if (pars.length && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          for (var j = 0; j < pars.length; j++) {
            if (pars[j].el === e.target) pars[j].vis = e.isIntersecting;
          }
        });
      }, { rootMargin: '20% 0px' });
      for (var q = 0; q < pars.length; q++) io.observe(pars[q].el);
    }

    if (reduced.matches) {
      // Ни параллакса, ни подсветки — только статика.
      if (torch) torch.remove();
      return;
    }

    var vh = window.innerHeight;
    window.addEventListener('resize', function () { vh = window.innerHeight; }, { passive: true });

    function frame() {
      for (var i = 0; i < pars.length; i++) {
        var it = pars[i];
        if (!it.vis) continue;
        var r = it.el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        var mid = r.top + r.height / 2 - vh / 2;
        var target = -mid * it.k;
        it.cur += (target - it.cur) * 0.12;
        if (Math.abs(target - it.cur) < 0.05) it.cur = target;
        it.el.style.transform = 'translate3d(0,' + it.cur.toFixed(2) + 'px,0) scale(1.14)';
      }
      if (torch) {
        cx += (tx - cx) * 0.09;
        cy += (ty - cy) * 0.09;
        torch.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* --- Видео первого экрана -------------------------------- */
  function initVideo() {
    var box = document.querySelector('[data-video]');
    if (!box) return;
    var v = box.querySelector('video');
    if (!v) return;

    v.addEventListener('playing', function () { box.classList.add('is-playing'); });

    // При «меньше движения» ролик не запускаем сами: показываем постер
    // и отдаём управление человеку.
    if (reduced.matches) {
      v.setAttribute('controls', '');
      v.setAttribute('preload', 'none');
      return;
    }

    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var pr = v.play();
          if (pr && pr.catch) pr.catch(function () { /* автозапуск запрещён — остаётся постер */ });
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { threshold: 0.25 });
    io.observe(box);
  }

  /* --- Шапка: состояние при скролле ------------------------ */
  function initHeader() {
    var head = document.querySelector('.head');
    if (!head) return;
    var last = null;
    function check() {
      var on = window.scrollY > 32;
      if (on !== last) { head.classList.toggle('is-stuck', on); last = on; }
    }
    check();
    window.addEventListener('scroll', check, { passive: true });
  }

  /* --- Мобильное меню --------------------------------------- */
  function initMenu() {
    var burger = document.querySelector('.burger');
    var menu = document.getElementById('menu');
    if (!burger || !menu) return;

    var links = menu.querySelectorAll('.menu__link');
    for (var i = 0; i < links.length; i++) {
      links[i].style.setProperty('--d', 60 + i * 55 + 'ms');
    }

    function set(open) {
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        var first = menu.querySelector('a');
        if (first) first.focus({ preventScroll: true });
      }
    }

    burger.addEventListener('click', function () {
      set(!menu.classList.contains('is-open'));
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        set(false);
        burger.focus();
      }
    });
  }

  /* --- Афиша: снимок следует за курсором --------------------- */
  function initPeek() {
    var list = document.querySelector('[data-afisha]');
    if (!list || !fine.matches) return;

    var peek = document.createElement('div');
    peek.className = 'peek';
    peek.setAttribute('aria-hidden', 'true');
    var img = document.createElement('img');
    img.alt = '';
    peek.appendChild(img);
    document.body.appendChild(peek);

    var tx = 0, ty = 0, cx = 0, cy = 0, on = false, raf = 0;

    function loop() {
      cx += (tx - cx) * (reduced.matches ? 1 : 0.14);
      cy += (ty - cy) * (reduced.matches ? 1 : 0.14);
      peek.style.left = cx.toFixed(1) + 'px';
      peek.style.top = cy.toFixed(1) + 'px';
      if (on) raf = requestAnimationFrame(loop);
    }

    list.addEventListener('pointermove', function (e) {
      tx = e.clientX + 130;
      ty = e.clientY;
    }, { passive: true });

    var rows = list.querySelectorAll('[data-peek]');
    for (var i = 0; i < rows.length; i++) {
      rows[i].addEventListener('pointerenter', function (e) {
        var src = this.getAttribute('data-peek');
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
        tx = e.clientX + 130;
        ty = e.clientY;
        if (!on) { cx = tx; cy = ty; on = true; loop(); }
        peek.classList.add('is-on');
      });
      rows[i].addEventListener('pointerleave', function () {
        peek.classList.remove('is-on');
      });
    }

    list.addEventListener('pointerleave', function () {
      on = false;
      cancelAnimationFrame(raf);
      peek.classList.remove('is-on');
    });
  }

  /* --- Переход между страницами: шторка ---------------------- */
  function initCurtain() {
    var curtain = document.querySelector('.curtain');
    if (!curtain || reduced.matches) return;

    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== '_self') return;
      if (a.hasAttribute('download')) return;

      var url;
      try { url = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return; // якорь на этой же странице

      e.preventDefault();
      curtain.classList.add('is-closing');
      window.setTimeout(function () { location.href = url.href; }, 380);
    });

    window.addEventListener('pageshow', function (e) {
      if (e.persisted) curtain.classList.remove('is-closing');
    });
  }

  /* --- Форма заявки ------------------------------------------ */
  function initForm() {
    var form = document.querySelector('[data-form]');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      /* ------------------------------------------------------
         СЮДА подключается отправка в Telegram.
         Бэкенда в прототипе нет: заявку нужно слать POST-запросом
         на свой обработчик, который дальше зовёт Bot API
         (sendMessage в чат площадки). Токен бота — только на
         сервере, в браузер его класть нельзя.

         var data = Object.fromEntries(new FormData(form));
         fetch('/api/zayavka', { method: 'POST', body: JSON.stringify(data) })
         ------------------------------------------------------ */

      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      form.classList.add('is-sent');

      var done = form.querySelector('.form__done');
      if (done) {
        done.setAttribute('tabindex', '-1');
        done.focus({ preventScroll: true });
      }
    });

    var again = form.querySelector('[data-form-reset]');
    if (again) {
      again.addEventListener('click', function () {
        form.classList.remove('is-sent');
        form.reset();
        var btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = false;
        var first = form.querySelector('input');
        if (first) first.focus();
      });
    }
  }

  /* --- Пуск --------------------------------------------------- */
  ready(function () {
    applyLinks();
    initReveal();
    initMotion();
    initVideo();
    initHeader();
    initMenu();
    initPeek();
    initCurtain();
    initForm();
  });
})();
