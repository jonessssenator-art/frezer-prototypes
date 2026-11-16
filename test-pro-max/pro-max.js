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
 const form=document.getElementById('brief');if(!form)return;
 const summary=document.getElementById('form-errors'),fields=[...form.querySelectorAll('input')],title=document.getElementById('booking-title'),intro=document.getElementById('booking-intro');
 const original={title:title.textContent,intro:intro.textContent};
 const messages={name:'Укажите ваше имя.',contact:'Укажите телефон или имя в Telegram.',guests:'Укажите целое число гостей от 1 до 1000.'};
 fields.forEach(field=>{const error=document.createElement('span');error.className='field-error';error.id=`${field.id}-error`;error.hidden=true;field.after(error);field.setAttribute('aria-describedby',error.id);});
 form.noValidate=true;
 function validate(field){const blank=field.required&&!field.value.trim();const valid=!blank&&field.validity.valid;const error=document.getElementById(`${field.id}-error`);field.setAttribute('aria-invalid',String(!valid));error.hidden=valid;error.textContent=valid?'':messages[field.name]||'Проверьте значение поля.';return valid;}
 function showErrors(focus=false){const invalid=fields.filter(field=>field.getAttribute('aria-invalid')==='true');summary.replaceChildren();summary.hidden=invalid.length===0;if(!invalid.length)return;const p=document.createElement('p');p.textContent='Проверьте данные заявки';summary.append(p);invalid.forEach(field=>{const link=document.createElement('a');link.href=`#${field.id}`;link.textContent=messages[field.name]||'Проверьте значение поля.';link.onclick=e=>{e.preventDefault();field.focus();};summary.append(link);});if(focus)summary.focus();}
 fields.forEach(field=>{field.addEventListener('blur',()=>{validate(field);if(!summary.hidden)showErrors();});field.addEventListener('input',()=>{if(field.getAttribute('aria-invalid')==='true'){validate(field);if(!summary.hidden)showErrors();}});});
 form.addEventListener('submit',event=>{const valid=fields.map(validate).every(Boolean);if(!valid){event.preventDefault();event.stopImmediatePropagation();showErrors(true);return;}summary.hidden=true;},true);
 form.addEventListener('submit',()=>{title.textContent='Проверьте заявку.';intro.textContent='Текст готов. Проверьте детали и отправьте его команде площадки в WhatsApp.';});
 document.getElementById('edit-request').addEventListener('click',()=>{title.textContent=original.title;intro.textContent=original.intro;});
})();
