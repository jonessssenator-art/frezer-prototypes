(() => {
 const frames=[document.getElementById('left'),document.getElementById('right')],toggle=document.getElementById('sync'),page=document.getElementById('page'),status=document.getElementById('status');let loaded=[false,false],driver=0,raf=0;
 const max=w=>Math.max(0,w.document.documentElement.scrollHeight-w.innerHeight);
 const top=(w,e)=>Math.max(0,Math.min(max(w),e.getBoundingClientRect().top+w.scrollY));
 function jump(w,y){try{w.eval('typeof lenis !== "undefined" && lenis')?.scrollTo(y,{immediate:true,force:true});}catch{}w.scrollTo(0,y);}
 function points(){const docs=frames.map(f=>f.contentDocument),wins=frames.map(f=>f.contentWindow),pairs=[[0,0]];const els=docs.map(d=>[...d.querySelectorAll('main > section,footer.visit-footer')]);
  // Match sections by their stable id/class, not by whole-page scroll percentage.
  els[0].forEach(a=>{let b;if(a.id)b=docs[1].getElementById(a.id);if(!b)b=els[1].find(e=>e.tagName===a.tagName&&e.classList[0]&&e.classList[0]===a.classList[0]);if(b)pairs.push([top(wins[0],a),top(wins[1],b)]);});
  for(const selectors of [['.story-visual','.motion-zoom, .story-visual'],['.story-line','.story-line']]){const a=docs[0].querySelector(selectors[0]),b=docs[1].querySelector(selectors[1]);if(a&&b)pairs.push([top(wins[0],a),top(wins[1],b)]);}
  pairs.push(wins.map(max));pairs.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);return pairs.filter((p,i,all)=>!i||(p[0]>all[i-1][0]+1&&p[1]>all[i-1][1]+1));
 }
 function synchronize(){raf=0;if(!toggle.checked||!loaded.every(Boolean))return;const source=frames[driver].contentWindow,dest=frames[1-driver].contentWindow,rows=points().map(p=>[p[driver],p[1-driver]]).sort((a,b)=>a[0]-b[0]),y=source.scrollY;let a=rows[0],b=rows.at(-1);for(let i=1;i<rows.length;i++){if(y<=rows[i][0]){a=rows[i-1];b=rows[i];break;}}const p=Math.max(0,Math.min(1,(y-a[0])/Math.max(1,b[0]-a[0])));jump(dest,a[1]+p*(b[1]-a[1]));}
 function schedule(){if(!raf)raf=requestAnimationFrame(synchronize);}
 function navigate(file){loaded=[false,false];status.textContent='Загрузка двух версий…';page.value=file;frames[0].src='../test-2/'+file;frames[1].src='../test-pro-max/'+file;document.getElementById('sections').hidden=file!=='index.html';}
 frames.forEach((frame,i)=>frame.addEventListener('load',()=>{const w=frame.contentWindow,d=frame.contentDocument;loaded[i]=true;
  const claim=()=>{driver=i;};for(const name of ['wheel','touchstart','pointerdown','keydown'])d.addEventListener(name,claim,{capture:true,passive:true});
  w.addEventListener('scroll',()=>{if(driver===i)schedule();},{passive:true});
  d.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;const u=new URL(a.href);if(u.origin!==location.origin)return;const file=u.pathname.split('/').pop()||'index.html';if([...page.options].some(o=>o.value===file)&&!u.hash){e.preventDefault();navigate(file);}});
  if(loaded.every(Boolean)){status.textContent='Одинаковые блоки связаны. Прокручивайте и переключайте версии.';schedule();}
 }));
 document.querySelectorAll('[data-block]').forEach(b=>b.onclick=()=>{if(!loaded.every(Boolean))return;frames.forEach(f=>{const e=f.contentDocument.querySelector(b.dataset.block);if(e)jump(f.contentWindow,top(f.contentWindow,e));});});
 const views=document.querySelector('.panes'),mobile=matchMedia('(max-width:700px)');
 document.querySelectorAll('[data-view]').forEach(b=>{if(b.tagName!=='BUTTON')return;b.onclick=()=>{synchronize();views.dataset.view=b.dataset.view;document.querySelectorAll('button[data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(b.dataset.view!=='both')driver=b.dataset.view==='left'?0:1;requestAnimationFrame(schedule);};});
 function visibility(){frames.forEach((f,i)=>{const hidden=mobile.matches&&views.dataset.view!=='both'&&views.dataset.view!==(i===0?'left':'right');f.inert=hidden;f.setAttribute('aria-hidden',String(hidden));});}
 document.querySelectorAll('button[data-view]').forEach(b=>b.addEventListener('click',visibility));mobile.addEventListener('change',visibility);visibility();
 page.onchange=()=>navigate(page.value);toggle.onchange=schedule;window.addEventListener('resize',schedule);navigate('index.html');
})();
