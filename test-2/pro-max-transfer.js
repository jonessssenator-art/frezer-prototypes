(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 reduced.addEventListener('change',()=>{if(reduced.matches)document.querySelectorAll('.control-ripple').forEach(r=>{r.getAnimations().forEach(a=>a.cancel());r.remove();});});
 const controls=document.querySelectorAll('.header-book,.action,.album-open,.visit-request');
 controls.forEach(button=>{
  const label=document.createElement('span');label.className='control-label';while(button.firstChild)label.append(button.firstChild);button.append(label);
  button.addEventListener('pointerdown',event=>{
   if(reduced.matches||button.disabled||event.button!==0)return;
   button.querySelectorAll('.control-ripple').forEach(r=>r.remove());
   const box=button.getBoundingClientRect(),diameter=Math.max(box.width,box.height)*2,ripple=document.createElement('span');
   ripple.className='control-ripple';ripple.setAttribute('aria-hidden','true');
   Object.assign(ripple.style,{width:`${diameter}px`,height:`${diameter}px`,left:`${event.clientX-box.left-diameter/2}px`,top:`${event.clientY-box.top-diameter/2}px`});button.append(ripple);
   const animation=ripple.animate([{transform:'scale(.05)',opacity:.24},{transform:'scale(1)',opacity:0}],{duration:500,easing:'cubic-bezier(.23,1,.32,1)'});
   animation.finished.then(()=>ripple.remove(),()=>ripple.remove());
  });
 });
 const logo=document.querySelector('.hero-title');let entrance;
 if(logo&&!reduced.matches)entrance=logo.animate([{clipPath:'inset(0 100% 0 0)',opacity:.25},{clipPath:'inset(0 0 0 0)',opacity:1}],{duration:1600,easing:'cubic-bezier(.23,1,.32,1)'});
 reduced.addEventListener('change',()=>{if(reduced.matches)entrance?.finish();});
})();
