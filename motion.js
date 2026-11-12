/* Progressive enhancement: native scrolling and filters work without these libraries. */
(() => {
  if (!window.gsap || !window.Flip) return;
  gsap.registerPlugin(Flip);
  if (!window.Lenis) return;
  const media = gsap.matchMedia();
  media.add('(min-width: 861px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
    const lenis = new Lenis({
      autoRaf: false,
      smoothWheel: true,
      syncTouch: false,
      anchors: true,
      prevent: node => !!node.closest('dialog, #menu, textarea, [data-lenis-prevent]')
    });
    window.frezerLenis = lenis;
    const tick = time => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    const menu = document.getElementById('menu');
    const syncLock = () => {
      const locked = document.hidden || document.querySelector('dialog[open]') || (menu && !menu.hidden);
      if (locked && !lenis.isStopped) lenis.stop();
      else if (!locked && lenis.isStopped) lenis.start();
    };
    const observer = new MutationObserver(syncLock);
    document.querySelectorAll('dialog, #menu').forEach(el => observer.observe(el, {attributes:true, attributeFilter:['open','hidden']}));
    document.addEventListener('visibilitychange', syncLock);
    syncLock();
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', syncLock);
      gsap.ticker.remove(tick);
      lenis.destroy();
      delete window.frezerLenis;
    };
  });
})();
