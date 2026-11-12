/* Фрезер — «Пластинка», тёмная редакция */


const тихо = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─── Шапка: подложка появляется, когда ушли с первого экрана ───── */
(() => {
  const шапка = document.querySelector('.bar');
  if (!шапка) return;
  const проверить = () => шапка.classList.toggle('stuck', window.scrollY > 40);
  проверить();
  addEventListener('scroll', проверить, { passive: true });
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

  let включён = localStorage.getItem('frezer-zvuk') === 'on' && !тихо;
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
    строки.forEach((с, k) => с.setAttribute('aria-pressed', String(k === i)));
    конверты.forEach((к, k) => {
      к.classList.toggle('on', k === i);
      к.classList.toggle('after', k > i);   // соседи справа расступаются
    });
    if (сЗвуком) щелчокИглы();
  };

  document.querySelector('.track-cta')?.addEventListener('click', () => {
    const chips = document.querySelectorAll('.chips[data-group="формат"] .chip');
    chips[активный]?.click();
  });

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
    if (window.frezerLenis) window.frezerLenis.scrollTo(0);
    else scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    history.replaceState(null, '', location.pathname + location.search);

  });

  if (location.hash === '#top') history.replaceState(null, '', location.pathname + location.search);
})();

/* Mobile navigation: keyboard stays inside the open menu. */
(() => {
  const trigger = document.querySelector('.burger');
  const menu = document.getElementById('menu');
  if (!trigger || !menu) return;
  const background = () => [document.querySelector('main'), document.querySelector('footer')];
  const headerOthers = [...document.querySelector('.bar').children].filter(el => el !== trigger);
  const close = (restore = false) => {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'Открыть меню');
    document.body.style.overflow = '';
    [...background(), ...headerOthers].forEach(el => { if (el) el.inert = false; });
    if (restore) trigger.focus();
  };
  trigger.addEventListener('click', () => {
    if (!menu.hidden) return close(true);
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-label', 'Закрыть меню');
    document.body.style.overflow = 'hidden';
    [...background(), ...headerOthers].forEach(el => { if (el) el.inert = true; });
    menu.querySelector('a').focus();
  });
  menu.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;
    close();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) { target.tabIndex = -1; target.focus({preventScroll:true}); }
  });
  addEventListener('keydown', e => {
    if (menu.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(true); }
    if (e.key === 'Tab') {
      const items = [trigger, ...menu.querySelectorAll('a, summary')].filter(el => el.getClientRects().length > 0);
      const index = items.indexOf(document.activeElement);
      e.preventDefault();
      items[(index + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus();
    }
  });
  matchMedia('(min-width:861px)').addEventListener('change', e => { if (e.matches) close(); });
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

/* Prepare a request locally. No delivery is claimed until a real channel exists. */
(() => {
  const form = document.querySelector('.build');
  const result = document.querySelector('.form-done');
  if (!form || !result) return;
  const required = [...form.querySelectorAll('input[required]')];
  required.forEach(input => {
    const error = document.createElement('small');
    error.id = `${input.name}-error`;
    error.className = 'field-error';
    error.hidden = true;
    input.setAttribute('aria-describedby', error.id);
    input.after(error);
    input.addEventListener('input', () => {
      if (input.value.trim()) { input.classList.remove('err'); input.removeAttribute('aria-invalid'); error.hidden = true; }
    });
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    let firstError;
    required.forEach(input => {
      const empty = !input.value.trim();
      const error = document.getElementById(`${input.name}-error`);
      input.classList.toggle('err', empty);
      input.setAttribute('aria-invalid', String(empty));
      error.hidden = !empty;
      error.textContent = input.name === 'name' ? 'Укажите ваше имя.' : 'Укажите телефон или ник в Telegram.';
      if (empty && !firstError) firstError = input;
    });
    if (firstError) return firstError.focus();
    const chosen = group => form.querySelector(`.chips[data-group="${group}"] [aria-pressed="true"]`).textContent.trim();
    result.querySelector('textarea').value = [
      'Заявка на мероприятие в «Фрезере»',
      `Формат: ${chosen('формат')}`,
      `Гостей: ${chosen('гости')}`,
      `Дата: ${form.elements.date.value.trim() || 'Обсудим'}`,
      `Имя: ${form.elements.name.value.trim()}`,
      `Контакт: ${form.elements.contact.value.trim()}`
    ].join('\n');
    result.querySelector('[data-send-whatsapp]').href = `https://wa.me/79163011011?text=${encodeURIComponent(result.querySelector('textarea').value)}`;
    form.hidden = true;
    result.hidden = false;
    result.querySelector('h3').focus();
  });
  result.querySelector('[data-edit-request]').addEventListener('click', () => {
    result.hidden = true;
    form.hidden = false;
    result.querySelector('[data-copy-status]').textContent = '';
    form.querySelector('input').focus();
  });
  result.querySelector('[data-copy-request]').addEventListener('click', async () => {
    const text = result.querySelector('textarea');
    const status = result.querySelector('[data-copy-status]');
    try {
      await navigator.clipboard.writeText(text.value);
      status.textContent = 'Текст скопирован. Заявка ещё не отправлена.';
    } catch {
      text.focus(); text.select();
      status.textContent = 'Выделили текст. Скопируйте его через меню браузера.';
    }
  });
})();

/* Native modal keeps focus and supports Escape without custom keyboard emulation. */
(() => {
 const dialog = document.querySelector('.plan-dialog');
 const trigger = document.querySelector('[data-open-plan]');
 if (!dialog || !trigger) return;
 trigger.addEventListener('click', () => dialog.showModal());
 dialog.addEventListener('click', e => {
  const bounds = dialog.getBoundingClientRect();
  if (e.target === dialog && (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom)) dialog.close();
 });
})();
