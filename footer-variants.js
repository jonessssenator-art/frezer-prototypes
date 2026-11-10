/* Three reviewable footer compositions; default site footer is unchanged by this module. */
(() => {
  const root = new URL('.', document.currentScript.src);
  const asset = path => new URL(path, root).href;
  const map = 'https://yandex.ru/maps/?text=Москва%2C%202-я%20Фрезерная%2C%203';
  const request = new URL('index.html#zayavka', root).href;
  const nav = `<nav aria-label="Навигация в подвале"><a href="${new URL('index.html#formaty',root)}">Форматы</a><a href="${new URL('index.html#prostranstvo',root)}">Пространство</a><a href="${new URL('index.html#istoriya',root)}">История</a></nav>`;
  const logo = `<img src="${asset('shared/brand/logo-sand.svg')}" width="180" height="62" alt="Фрезер">`;
  const variants = {
    address: `<footer class="footer-design footer-address"><div class="address-visual"><img src="${asset('shared/img/facade.jpg')}" width="992" height="432" alt="Кирпичный фасад здания «Фрезер»"></div><div class="address-info"><h2>Увидимся<br>на Фрезерной</h2><address>Москва, 2-я Фрезерная, 3</address><p>Посмотреть площадку можно по записи.<br>На территории есть парковка на 20 мест.</p><div class="footer-actions"><a class="btn btn-red" href="${request}">Запланировать просмотр</a><a class="text-link" href="${map}" target="_blank" rel="noopener">Открыть карту</a></div></div><div class="footer-base">${logo}${nav}<span>© Фрезер, 2026</span></div></footer>`,
    contacts: `<footer class="footer-design footer-contacts"><div class="contacts-brand">${logo}<p>Дом культуры завода.<br>Пространство для ваших событий.</p></div><div class="contacts-address"><h2>Приходите знакомиться</h2><address>Москва,<br>2-я Фрезерная, 3</address><a class="text-link" href="${map}" target="_blank" rel="noopener">Посмотреть на карте</a></div><div class="contacts-action"><p>Покажем зал, сцену<br>и остальные пространства.</p><a class="btn" href="${request}">Запланировать просмотр</a></div><div class="footer-base">${nav}<span>Просмотр по записи</span><span>© Фрезер, 2026</span></div></footer>`,
    invitation: `<footer class="footer-design footer-invitation"><div class="invitation-top"><img src="${asset('shared/brand/logo-red.svg')}" width="170" height="58" alt="Фрезер"><p>Москва, 2-я Фрезерная, 3</p></div><div class="invitation-main"><h2>Лучше один раз<br>увидеть зал.</h2><div><p>Приезжайте на просмотр.<br>Пройдём по площадке и обсудим,<br>как разместить ваше событие.</p><a class="btn btn-red" href="${request}">Запланировать просмотр</a></div></div><div class="footer-base"><a class="text-link" href="${map}" target="_blank" rel="noopener">Открыть карту</a><span>Парковка на территории</span><span>© Фрезер, 2026</span></div></footer>`
  };
  document.querySelectorAll('[data-footer-preview]').forEach(el => { el.innerHTML = variants[el.dataset.footerPreview] || ''; });
  const requested = new URLSearchParams(location.search).get('footer');
  if (variants[requested] && !document.querySelector('[data-footer-preview]')) {
    document.querySelector('footer.foot').outerHTML = variants[requested];
    const footer = document.querySelector('footer');
    footer.id = 'footer-preview';
    if (location.hash === '#footer-preview') requestAnimationFrame(() => footer.scrollIntoView());
  }
})();
