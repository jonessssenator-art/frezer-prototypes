/* Galleries use only supplied event photos and existing venue assets. */
(() => {
  const dialog = document.querySelector('.photo-dialog');
  if (!dialog) return;
  const img = dialog.querySelector('figure img');
  const caption = dialog.querySelector('figcaption');
  const title = dialog.querySelector('h2');
  const description = dialog.querySelector('.photo-description');
  const controls = dialog.querySelector('.photo-controls');
  const prev = dialog.querySelector('[data-photo-prev]');
  const next = dialog.querySelector('[data-photo-next]');
  const photo = (src, alt) => ({ src: `shared/img/${src}`, alt });
  const galleries = {
venue: { title:"Галерея площадки", description:"", photos:[photo("photos/hall-wide-1920.webp","Основной зал"),photo("photos/welcome-1920.webp","Велком-зона"),photo("photos/hall-reverse-1920.webp","Основной зал, вид от сцены"),photo("photos/stage-1920.webp","Сцена и экран"),photo("photos/welcome-window-1920.webp","Входная группа"),photo("photos/welcome-lounge-1920.webp","Зона отдыха в холле"),photo("photos/upper-1920.webp","Второй этаж"),photo("photos/upper-lounge-1920.webp","Зона отдыха на втором этаже"),photo("photos/exterior-1920.webp","Фасад Дома культуры"),photo("photos/entrance-1920.webp","Вход на площадку"),photo("photos/terrace-1920.webp","Крытая терраса"),photo("photos/terrace-view-1920.webp","Терраса и двор")] },
event: { title:"Презентация «Брусники»", description:"28 октября 2026. Первое мероприятие во «Фрезере».", photos:[photo("photos/brusnika-hall-1920.webp","Оформление основного зала"),photo("photos/brusnika-stage-1920.webp","Презентация жилого комплекса «Рублёвские дворы»"),photo("photos/brusnika-talk-1920.webp","Выступление на сцене"),photo("photos/brusnika-welcome-1920.webp","Велком-зона в оформлении мероприятия"),photo("photos/brusnika-guests-1920.webp","Гости презентации"),photo("photos/brusnika-catering-1920.webp","Фуршет на мероприятии")] },
hall: { title:"Основной зал · 633 м²", description:"Потолок 10 метров, пять экранов и сцена в торце зала.", photos:[photo("photos/hall-wide-1920.webp","Основной зал"),photo("photos/hall-reverse-1920.webp","Основной зал, вид от сцены"),photo("photos/stage-1920.webp","Сцена и экран")] },
welcome: { title:"Велком-зона · 535 м²", description:"Пространство для встречи гостей и фуршета. Три экрана и гардероб на 1000 мест.", photos:[photo("photos/welcome-1920.webp","Велком-зона"),photo("photos/welcome-window-1920.webp","Входная группа"),photo("photos/welcome-lounge-1920.webp","Зона отдыха в холле")] },
floor: { title:"Второй этаж · 407 м²", description:"VIP-ложа площадью 300 м² с видом на зал.", photos:[photo("photos/upper-1920.webp","Второй этаж"),photo("photos/upper-lounge-1920.webp","Зона отдыха на втором этаже")] },
stage: { title:"Сцена · 55 м²", description:"Четыре гримёрные рядом, за кулисами.", photos:[photo("photos/stage-1920.webp","Сцена без оформления"),photo("photos/hall-wide-1920.webp","Зал и сцена"),photo("photos/brusnika-stage-1920.webp","Сцена во время презентации")] },
outside: { title:"Своя территория · 1500 м²", description:"Отдельно стоящее здание, крытые террасы и бесплатная парковка на 20 мест.", photos:[photo("photos/exterior-1920.webp","Фасад Дома культуры"),photo("photos/entrance-1920.webp","Вход на площадку"),photo("photos/terrace-1920.webp","Крытая терраса"),photo("photos/terrace-view-1920.webp","Терраса и двор")] }
  };
  const galleryItems = [...document.querySelectorAll('.gallery-grid [data-category]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let filterAnimation;
  const finishFilter = () => { filterAnimation?.progress(1); filterAnimation = null; };
  reducedMotion.addEventListener('change', finishFilter);
  window.addEventListener('resize', finishFilter);
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', event => {
    if (button.getAttribute('aria-pressed') === 'true') return;
    finishFilter();
    const animate = event.detail > 0 && !reducedMotion.matches && window.Flip && window.gsap;
    const state = animate ? Flip.getState(galleryItems) : null;
    document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    galleryItems.forEach(item => { item.hidden = button.dataset.filter !== 'all' && item.dataset.category !== button.dataset.filter; });
    if (state) filterAnimation = Flip.from(state, {
      duration: 0.24, ease: 'power3.out', scale: true, prune: true,
      onEnter: items => gsap.fromTo(items, {opacity: 0}, {opacity: 1, duration: 0.2, clearProps: 'opacity'})
    });
    window.frezerLenis?.resize();
  }));
  let active, index = 0;
  const render = () => {
    const item = active.photos[index];
    img.src = item.src; img.alt = item.alt; caption.textContent = item.alt;
    dialog.querySelector('[data-photo-count]').textContent = `${index + 1} / ${active.photos.length}`;
    controls.hidden = active.photos.length < 2;
    prev.hidden = next.hidden = active.photos.length < 2;
  };
  const open = (key, initial = 0) => {
    active = galleries[key]; if (!active) return;
    index = initial; title.textContent = active.title;
    description.textContent = active.description || ''; description.hidden = !active.description;
    render(); dialog.showModal(); document.body.style.overflow = 'hidden';
  };
  document.querySelectorAll('[data-gallery]').forEach(button => button.addEventListener('click', () => open(button.dataset.gallery, Number(button.dataset.photo))));
  document.querySelectorAll('[data-space]').forEach(button => button.addEventListener('click', () => open(button.dataset.space)));
  const move = step => { index = (index + step + active.photos.length) % active.photos.length; render(); };
  prev.addEventListener('click', () => move(-1)); next.addEventListener('click', () => move(1));
  dialog.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); move(e.key === 'ArrowRight' ? 1 : -1); } });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; });
  dialog.addEventListener('click', e => { const r = dialog.getBoundingClientRect(); if (e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dialog.close(); });
  document.querySelectorAll('.about-nav').forEach(details => {
    details.addEventListener('click', e => { if (e.target.closest('a')) details.open = false; });
    details.addEventListener('keydown', e => { if (e.key === 'Escape') { details.open = false; details.querySelector('summary').focus(); } });
  });
  document.addEventListener('click', e => { document.querySelectorAll('.about-nav[open]').forEach(details => { if (!details.contains(e.target)) details.open = false; }); });
})();
