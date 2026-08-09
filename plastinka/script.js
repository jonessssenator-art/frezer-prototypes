/* Фрезер — вариант «Пластинка» */

// TODO: подставить реальный чат площадки, когда заказчик пришлёт ник
const TELEGRAM_URL = '';

const тихо = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─── Появление при скролле ─────────────────────────────────────── */
(() => {
  const цели = document.querySelectorAll('.reveal, .written');
  if (тихо) { цели.forEach(э => э.classList.add('on')); return; }

  const наблюдатель = new IntersectionObserver((записи) => {
    записи.forEach((запись) => {
      if (!запись.isIntersecting) return;
      запись.target.classList.add('on');
      наблюдатель.unobserve(запись.target);
    });
  }, { threshold: .16, rootMargin: '0px 0px -8% 0px' });

  цели.forEach((э, i) => {
    // соседи в одной сетке появляются друг за другом
    const шаг = э.closest('.tracks, .records, .place-facts') ? (i % 6) * 70 : 0;
    э.style.transitionDelay = `${шаг}ms`;
    наблюдатель.observe(э);
  });
})();

/* ─── Красная нить: дорисовывается по мере скролла ──────────────── */
(() => {
  const путь = document.getElementById('thread-path');
  const svg = document.querySelector('.thread');
  if (!путь || !svg) return;

  // высота нити = высота документа, поэтому viewBox тянется по вертикали
  const подогнать = () => {
    const h = document.documentElement.scrollHeight;
    svg.style.height = h + 'px';
    svg.setAttribute('viewBox', `0 0 100 1000`);
    svg.setAttribute('preserveAspectRatio', 'none');
  };

  const длина = путь.getTotalLength();
  путь.style.strokeDasharray = длина;
  путь.style.strokeDashoffset = тихо ? 0 : длина;

  const обновить = () => {
    подогнать();
    if (тихо) return;
    const прокручено = window.scrollY;
    const всего = document.documentElement.scrollHeight - window.innerHeight;
    const доля = всего > 0 ? Math.min(1, Math.max(0, прокручено / всего)) : 0;
    // нить опережает скролл, чтобы всегда быть чуть впереди взгляда
    путь.style.strokeDashoffset = длина * (1 - Math.min(1, доля * 1.16 + .06));
  };

  обновить();
  addEventListener('scroll', обновить, { passive: true });
  addEventListener('resize', обновить);
  addEventListener('load', обновить);
})();

/* ─── Пластинка: крутится сама, скролл её подкручивает ──────────── */
(() => {
  const диск = document.getElementById('hero-disc');
  if (!диск || тихо) return;

  let угол = 0, последний = window.scrollY, кадр = 0, время = performance.now();

  const крутить = (сейчас) => {
    const дельта = Math.min(64, сейчас - время);
    время = сейчас;

    const прокрутка = window.scrollY;
    const сдвиг = прокрутка - последний;
    последний = прокрутка;

    // 33⅓ оборота в минуту — настоящая скорость пластинки, плюс докрутка от скролла
    угол = (угол + дельта * 0.2 + сдвиг * 0.14) % 360;
    диск.style.transform = `rotate(${угол}deg)`;

    кадр = requestAnimationFrame(крутить);
  };

  // крутим только пока диск виден — не жжём батарею впустую
  new IntersectionObserver(([запись]) => {
    if (запись.isIntersecting && !кадр) { время = performance.now(); кадр = requestAnimationFrame(крутить); }
    else if (!запись.isIntersecting && кадр) { cancelAnimationFrame(кадр); кадр = 0; }
  }, { threshold: .05 }).observe(диск);
})();

/* ─── Счётчики площадей ─────────────────────────────────────────── */
(() => {
  const числа = document.querySelectorAll('[data-count]');
  if (!числа.length) return;

  const пробелы = (n) => n.toLocaleString('ru-RU');

  if (тихо) {
    числа.forEach(э => { э.textContent = пробелы(+э.dataset.count); });
    return;
  }

  const наблюдатель = new IntersectionObserver((записи) => {
    записи.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      наблюдатель.unobserve(target);

      const цель = +target.dataset.count;
      const длительность = 1100;
      const старт = performance.now();

      const шаг = (сейчас) => {
        const t = Math.min(1, (сейчас - старт) / длительность);
        const плавно = 1 - Math.pow(1 - t, 4);
        target.textContent = пробелы(Math.round(цель * плавно));
        if (t < 1) requestAnimationFrame(шаг);
      };
      requestAnimationFrame(шаг);
    });
  }, { threshold: .6 });

  числа.forEach(э => наблюдатель.observe(э));
})();

/* ─── Мобильное меню ────────────────────────────────────────────── */
(() => {
  const кнопка = document.querySelector('.burger');
  const меню = document.getElementById('menu');
  if (!кнопка || !меню) return;

  const переключить = (открыть) => {
    кнопка.setAttribute('aria-expanded', String(открыть));
    меню.hidden = !открыть;
    document.body.style.overflow = открыть ? 'hidden' : '';
  };

  кнопка.addEventListener('click', () => переключить(меню.hidden));
  меню.addEventListener('click', (e) => { if (e.target.tagName === 'A') переключить(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !меню.hidden) переключить(false); });
})();

/* ─── Форма ─────────────────────────────────────────────────────── */
(() => {
  const форма = document.querySelector('.form');
  const готово = document.querySelector('.form-done');
  if (!форма || !готово) return;

  форма.addEventListener('submit', (e) => {
    e.preventDefault();

    const обязательные = [...форма.querySelectorAll('input[required]')];
    let ошибка = false;
    обязательные.forEach((поле) => {
      const пусто = !поле.value.trim();
      поле.classList.toggle('err', пусто);
      поле.setAttribute('aria-invalid', String(пусто));
      if (пусто && !ошибка) { поле.focus(); ошибка = true; }
    });
    if (ошибка) return;

    // TODO: BACKEND — отправить на свой эндпоинт, который дёрнет Telegram Bot API
    // sendMessage. Токен бота держать только на сервере, в браузере его быть не должно.
    форма.hidden = true;
    готово.hidden = false;
    готово.querySelector('button').focus();
  });

  готово.querySelector('[data-reset]').addEventListener('click', () => {
    форма.reset();
    форма.querySelectorAll('.err').forEach(п => п.classList.remove('err'));
    готово.hidden = true;
    форма.hidden = false;
    форма.querySelector('input').focus();
  });
})();

/* ─── Ссылка на Telegram ────────────────────────────────────────── */
(() => {
  const ссылки = document.querySelectorAll('[data-tg]');
  ссылки.forEach((a) => {
    if (TELEGRAM_URL) { a.href = TELEGRAM_URL; a.target = '_blank'; a.rel = 'noopener'; }
    else { a.href = '#zayavka'; a.title = 'Ник площадки в Telegram появится после запуска'; }
  });
})();

/* ─── Шторка перехода (для будущих внутренних страниц) ──────────── */
(() => {
  if (тихо) return;
  const шторка = document.querySelector('.curtain');
  if (!шторка) return;

  // страница пришла назад из bfcache — шторку поднять
  addEventListener('pageshow', () => шторка.classList.remove('shut'));

  document.addEventListener('click', (e) => {
    const ссылка = e.target.closest('a[href]');
    if (!ссылка) return;

    const href = ссылка.getAttribute('href');
    if (!href || href.startsWith('#') || ссылка.target === '_blank') return;
    if (ссылка.origin !== location.origin) return;

    e.preventDefault();
    шторка.classList.add('shut');
    setTimeout(() => { location.href = ссылка.href; }, 420);
  });
})();
