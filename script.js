/* Фрезер — «Пластинка», тёмная редакция */

// TODO: подставить реальный чат площадки, когда заказчик пришлёт ник
const TELEGRAM_URL = '';

const тихо = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─── Рамка фокуса — только для клавиатуры ──────────────────────── */
(() => {
  const корень = document.documentElement;
  корень.classList.add('js');

  addEventListener('keydown', (e) => {
    if (e.key === 'Tab' || e.key.startsWith('Arrow')) корень.classList.add('клавиатура');
  });
  addEventListener('pointerdown', () => корень.classList.remove('клавиатура'));

  // после перезагрузки браузер возвращает фокус туда, где он был, —
  // снимаем его, пока пользователь ничего не нажимал
  const снять = () => {
    const э = document.activeElement;
    if (!корень.classList.contains('клавиатура') && э && э !== document.body) э.blur();
  };
  addEventListener('pageshow', снять);
  снять();
})();

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
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });

  цели.forEach((э, i) => {
    // соседи в одной сетке проявляются друг за другом
    const шаг = э.closest('.records, .zones, .facts-list') ? (i % 6) * 80 : 0;
    э.style.transitionDelay = `${шаг}ms`;
    наблюдатель.observe(э);
  });
})();

/* ─── Шапка: подложка появляется, когда ушли с первого экрана ───── */
(() => {
  const шапка = document.querySelector('.bar');
  if (!шапка) return;
  const проверить = () => шапка.classList.toggle('stuck', window.scrollY > 40);
  проверить();
  addEventListener('scroll', проверить, { passive: true });
})();

/* ─── Игла: точка едет по шкале вместе с прокруткой ─────────────── */
(() => {
  const шкала = document.querySelector('.needle');
  const точка = шкала && шкала.querySelector('b');
  if (!точка || тихо) return;

  let ждём = false;
  const обновить = () => {
    ждём = false;
    const всего = document.documentElement.scrollHeight - innerHeight;
    const доля = всего > 0 ? Math.min(1, Math.max(0, scrollY / всего)) : 0;
    точка.style.top = `${доля * 100}%`;
  };

  обновить();
  addEventListener('scroll', () => {
    if (ждём) return;
    ждём = true;
    requestAnimationFrame(обновить);
  }, { passive: true });
  addEventListener('resize', обновить);
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
      const длительность = 1200;
      const старт = performance.now();

      const шаг = (сейчас) => {
        const t = Math.min(1, (сейчас - старт) / длительность);
        target.textContent = пробелы(Math.round(цель * (1 - Math.pow(1 - t, 4))));
        if (t < 1) requestAnimationFrame(шаг);
      };
      requestAnimationFrame(шаг);
    });
  }, { threshold: .6 });

  числа.forEach(э => наблюдатель.observe(э));
})();

/* ─── Пластинка в герое: если автозапуск запрещён, остаётся кадр ── */
(() => {
  const ролик = document.querySelector('.hero-video');
  if (!ролик) return;
  if (тихо) { ролик.remove(); return; }

  const запустить = () => ролик.play().catch(() => {
    // браузер не разрешил автозапуск — под видео лежит кадр из ролика,
    // страница не разваливается; запустим после первого касания
    addEventListener('pointerdown', () => ролик.play().catch(() => {}), { once: true });
  });

  if (ролик.readyState >= 2) запустить();
  else ролик.addEventListener('loadeddata', запустить, { once: true });
})();

/* ─── Тяжёлое видео включается, только когда попало на экран ────── */
(() => {
  const ролики = document.querySelectorAll('video[data-inview]');
  if (!ролики.length) return;

  if (тихо) { ролики.forEach(в => { в.preload = 'metadata'; в.controls = true; }); return; }

  const наблюдатель = new IntersectionObserver((записи) => {
    записи.forEach(({ isIntersecting, target }) => {
      if (isIntersecting) { target.play().catch(() => {}); }
      else { target.pause(); }
    });
  }, { threshold: .25 });

  ролики.forEach(в => наблюдатель.observe(в));
})();

/* ─── Щелчок иглы при наведении на формат ───────────────────────── */
/* Звук не файлом, а синтезом: стук иглы о пластинку, сам щелчок и
   короткий шорох дорожки следом. Так он ничего не весит и настраивается
   тремя числами. Браузеры не дают звучать до первого клика по странице —
   поэтому контекст будим на первом же нажатии. */
const щелчокИглы = (() => {
  const тумблер = document.querySelector('[data-sound]');
  if (!тумблер) return () => {};

  // мыши нет — наводить нечем, тумблер прячем совсем
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};
  тумблер.hidden = false;

  let включён = localStorage.getItem('frezer-zvuk') !== 'off' && !тихо;
  let контекст = null, шумБуфер = null, последний = 0;

  const показать = () => {
    тумблер.setAttribute('aria-pressed', String(включён));
    тумблер.querySelector('i').textContent = включён ? 'вкл' : 'выкл';
  };
  показать();

  const разбудить = () => {
    if (!контекст) {
      const Аудио = window.AudioContext || window.webkitAudioContext;
      if (!Аудио) return null;
      контекст = new Аудио();
    }
    if (контекст.state === 'suspended') контекст.resume();
    return контекст;
  };

  const шум = (к) => {
    if (!шумБуфер) {
      const длина = Math.floor(к.sampleRate * .4);
      шумБуфер = к.createBuffer(1, длина, к.sampleRate);
      const данные = шумБуфер.getChannelData(0);
      for (let i = 0; i < длина; i++) данные[i] = Math.random() * 2 - 1;
    }
    const и = к.createBufferSource();
    и.buffer = шумБуфер;
    return и;
  };

  const щелчок = (форс) => {
    if (!включён && !форс) return;
    const к = разбудить();
    if (!к || к.state !== 'running') return;

    const сейчас = performance.now();
    if (сейчас - последний < 110) return;   // не трещать при беге курсором по списку
    последний = сейчас;

    const t = к.currentTime;
    const общий = к.createGain();
    общий.gain.value = .5;
    общий.connect(к.destination);

    // 1. стук: игла ударилась о винил
    const стук = к.createOscillator();
    const стукГр = к.createGain();
    стук.type = 'sine';
    стук.frequency.setValueAtTime(200, t);
    стук.frequency.exponentialRampToValueAtTime(72, t + .08);
    стукГр.gain.setValueAtTime(.0001, t);
    стукГр.gain.exponentialRampToValueAtTime(.3, t + .004);
    стукГр.gain.exponentialRampToValueAtTime(.0001, t + .13);
    стук.connect(стукГр).connect(общий);
    стук.start(t); стук.stop(t + .15);

    // 2. сам щелчок: узкая полоса шума, гаснет мгновенно
    const клик = шум(к);
    const полоса = к.createBiquadFilter();
    const кликГр = к.createGain();
    полоса.type = 'bandpass'; полоса.frequency.value = 2300; полоса.Q.value = 1.1;
    кликГр.gain.setValueAtTime(.0001, t);
    кликГр.gain.exponentialRampToValueAtTime(.5, t + .002);
    кликГр.gain.exponentialRampToValueAtTime(.0001, t + .055);
    клик.connect(полоса).connect(кликГр).connect(общий);
    клик.start(t); клик.stop(t + .08);

    // 3. дорожка зашуршала под иглой
    const шорох = шум(к);
    const верх = к.createBiquadFilter();
    const шорохГр = к.createGain();
    верх.type = 'highpass'; верх.frequency.value = 3400;
    шорохГр.gain.setValueAtTime(.055, t + .01);
    шорохГр.gain.exponentialRampToValueAtTime(.0001, t + .3);
    шорох.connect(верх).connect(шорохГр).connect(общий);
    шорох.start(t + .01); шорох.stop(t + .32);
  };

  тумблер.addEventListener('click', () => {
    включён = !включён;
    localStorage.setItem('frezer-zvuk', включён ? 'on' : 'off');
    показать();
    if (включён) щелчок(true);   // сразу даём послушать
  });

  // браузер разрешает звук только после действия пользователя
  addEventListener('pointerdown', разбудить, { once: true });
  addEventListener('keydown', разбудить, { once: true });

  return щелчок;
})();

/* ─── 01. Треки: выбранный конверт поднимается из ящика ─────────── */
(() => {
  const строки = [...document.querySelectorAll('.track')];
  const конверты = [...document.querySelectorAll('.sleeve')];
  if (!строки.length || !конверты.length) return;

  let активный = 0;

  const выбрать = (i, сЗвуком) => {
    if (i === активный) return;
    активный = i;
    строки.forEach((с, k) => с.setAttribute('aria-selected', String(k === i)));
    конверты.forEach((к, k) => {
      к.classList.toggle('on', k === i);
      к.classList.toggle('after', k > i);   // соседи справа расступаются
    });
    if (сЗвуком) щелчокИглы();
  };

  строки.forEach((строка, i) => {
    строка.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') выбрать(i, true); });
    строка.addEventListener('focus', () => выбрать(i, false));
    строка.addEventListener('click', () => выбрать(i, true));
  });
})();

/* ─── Логотип: наверх без «#top» в адресе ───────────────────────── */
/* Иначе после перезагрузки браузер возвращает фокус на якорь и рисует
   вокруг логотипа рамку, которая держится до клика в пустое место */
(() => {
  const бренд = document.querySelector('.brand');
  if (!бренд) return;

  бренд.addEventListener('click', (e) => {
    e.preventDefault();
    scrollTo({ top: 0, behavior: тихо ? 'auto' : 'smooth' });
    history.replaceState(null, '', location.pathname + location.search);
    бренд.blur();
  });

  if (location.hash === '#top') history.replaceState(null, '', location.pathname + location.search);
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
  меню.addEventListener('click', (e) => { if (e.target.closest('a')) переключить(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !меню.hidden) переключить(false); });
})();

/* ─── Конструктор заявки ────────────────────────────────────────── */
(() => {
  const форма = document.querySelector('.build');
  const итог = document.querySelector('[data-summary]');
  if (!форма || !итог) return;

  const выбранное = (группа) => {
    const чип = форма.querySelector(`.chips[data-group="${группа}"] .chip[aria-pressed="true"]`);
    return чип ? чип.textContent.trim() : '';
  };

  const собрать = () => {
    итог.textContent = `${выбранное('формат').toLowerCase()} · ${выбранное('гости')} гостей`;
  };

  форма.querySelectorAll('.chips').forEach((группа) => {
    группа.addEventListener('click', (e) => {
      const чип = e.target.closest('.chip');
      if (!чип) return;
      [...группа.children].forEach(к => к.setAttribute('aria-pressed', String(к === чип)));
      собрать();
      щелчокИглы();
    });
  });

  собрать();
})();

/* ─── Отправка ──────────────────────────────────────────────────── */
(() => {
  const форма = document.querySelector('.build');
  const готово = document.querySelector('.form-done');
  if (!форма || !готово) return;

  форма.addEventListener('submit', (e) => {
    e.preventDefault();

    let ошибка = false;
    форма.querySelectorAll('input[required]').forEach((поле) => {
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
  document.querySelectorAll('[data-tg]').forEach((a) => {
    if (TELEGRAM_URL) { a.href = TELEGRAM_URL; a.target = '_blank'; a.rel = 'noopener'; }
    else { a.href = '#zayavka'; a.title = 'Ник площадки в Telegram появится после запуска'; }
  });
})();
