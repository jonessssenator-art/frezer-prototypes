(() => {
 if(new URLSearchParams(location.search).get('effects')==='off')return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:700px)'),running=new Set();
 document.documentElement.classList.add('motion-active');
 const play=(el,frames,options)=>{if(reduce.matches)return;const a=el.animate(frames,options);running.add(a);a.finished.then(()=>running.delete(a)).catch(()=>running.delete(a));};
 // Preserve native line breaks and the heading's accessible text.
 const cinema=(heading)=>{const nodes=[],walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT);while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(n=>{const frag=document.createDocumentFragment();n.textContent.split(/(\s+)/).forEach(w=>{if(!w.trim())frag.append(w);else{const s=document.createElement('span');s.className='motion-word';s.textContent=w;frag.append(s);}});n.replaceWith(frag);});heading.querySelectorAll('.motion-word').forEach((s,i)=>play(s,[{opacity:0,filter:'blur(18px)',transform:'translateY(32px) scale(1.04)'},{opacity:1,filter:'blur(0)',transform:'none'}],{duration:1400,delay:110*i,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}));};
 const hero=document.querySelector('.hero'),logo=document.querySelector('.hero-title'),vinyl=document.querySelector('.vinyl-scene');
 if(hero?.querySelector('h1'))cinema(hero.querySelector('h1'));
 const titles=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){titles.unobserve(e.target);cinema(e.target);}}),{threshold:.45});
 document.querySelectorAll('.overview .heading h2,.story-heading h2,.page-title h1,.story-page-title h1,.footer-invite h2').forEach(e=>titles.observe(e));
 const reveals=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;reveals.unobserve(e.target);play(e.target,[{clipPath:'inset(12% 18% 12% 18%)',opacity:.4},{clipPath:'inset(0)',opacity:1}],{duration:1100,easing:'cubic-bezier(.23,1,.32,1)'});}),{threshold:.2});
 document.querySelectorAll('.space-photo,.room-detail .shot,.format-detail img,.service-photo,.catalog-album img').forEach(e=>reveals.observe(e));
 const visual=document.querySelector('.story-visual');let wrap,photo,img;
 if(visual){wrap=document.createElement('div');wrap.className='motion-zoom';visual.before(wrap);wrap.append(visual);photo=visual.querySelector('.story-main-image');img=photo.querySelector('img');}
 let raf=0;const clamp=v=>Math.max(0,Math.min(1,v));
 function paint(){raf=0;const disabled=reduce.matches;
  if(hero&&vinyl){const r=hero.getBoundingClientRect(),p=clamp(-r.top/r.height);vinyl.style.transform=disabled?'':`translateY(${p*100}px) scale(${1+p*.15})`;if(logo)logo.style.translate=disabled?'':`0 ${-p*70}px`;}
  if(wrap){const r=wrap.getBoundingClientRect(),stage=visual.offsetHeight,p=clamp(-r.top/Math.max(1,r.height-stage)/.85);const x=(mobile.matches?12:30)*(1-p),y=(mobile.matches?20:23)*(1-p);photo.style.clipPath=disabled?'none':`inset(${y}% ${x}% round ${10*(1-p)}px)`;img.style.transform=disabled?'':`scale(${1.14-p*.14})`;}
 }
 const schedule=()=>{if(!raf)raf=requestAnimationFrame(paint);};addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);reduce.addEventListener('change',()=>{if(reduce.matches)running.forEach(a=>a.finish());schedule();});paint();
})();
