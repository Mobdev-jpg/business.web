document.addEventListener('DOMContentLoaded',()=>{const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('.nav-links');if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close menu':'Open menu');toggle.textContent=open?'×':'☰'});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.textContent='☰'}))}document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());const themeButton=document.querySelector('.theme-toggle');const applyTheme=theme=>{document.body.dataset.theme=theme;if(themeButton){themeButton.textContent=theme==='dark'?'☼':'◐';themeButton.setAttribute('aria-label',theme==='dark'?'Switch to light theme':'Switch to dark theme');themeButton.title=theme==='dark'?'Switch to light theme':'Switch to dark theme'}document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#111111':'#ffffff')};const saved='dark';applyTheme(saved);if(themeButton)themeButton.addEventListener('click',()=>{const next=document.body.dataset.theme==='dark'?'light':'dark';applyTheme(next);try{localStorage.setItem('orvexa-theme',next)}catch(e){}});const form=document.querySelector('.contact-form');if(form){const serviceSelect=form.querySelector('[name="service"]');const requestedService=new URLSearchParams(window.location.search).get('service');if(serviceSelect&&requestedService){const requested=requestedService.toLowerCase();const target=requested.includes('paid')||requested.includes('meta ads')?'Paid advertising / Meta Ads':requested.includes('setup')?'Social media profile setup':requested.includes('social')||requested.includes('growth')?'Social media marketing':requestedService;const option=[...serviceSelect.options].find(item=>item.value.toLowerCase()===target.toLowerCase());if(option)serviceSelect.value=option.value}const modal=form.querySelector('[data-contact-modal]');
const dialog=modal?.querySelector('.contact-modal');
const closeButtons=form.querySelectorAll('[data-close-contact-modal]');
const closeModal=()=>{
 if(!modal||modal.hidden)return;
 modal.hidden=true;
 document.body.classList.remove('contact-modal-open');
 form.querySelector('button[type="submit"]')?.focus();
};
closeButtons.forEach(button=>button.addEventListener('click',closeModal));
if(modal){
 modal.addEventListener('click',event=>{if(event.target===modal)closeModal()});
 document.addEventListener('keydown',event=>{
  if(modal.hidden)return;
  if(event.key==='Escape'){event.preventDefault();closeModal();return}
  if(event.key==='Tab'&&dialog){
   const focusable=[...dialog.querySelectorAll('a[href],button:not([disabled])')].filter(el=>el.offsetParent!==null);
   if(!focusable.length)return;
   const first=focusable[0],last=focusable[focusable.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  }
 });
}
form.addEventListener('submit',e=>{
 e.preventDefault();
 if(!form.reportValidity())return;
 const data=new FormData(form);
 const message=[
  'ORVEXA DIGITAL — Project Enquiry',
  '',
  'Name: '+data.get('name'),
  'Email: '+data.get('email'),
  'Business: '+(data.get('business')||'Not provided'),
  'Service: '+data.get('service'),
  '',
  'Project details:',
  data.get('message')
 ].join('\n');
 const encoded=encodeURIComponent(message);
 const phone='919332095869';
 const whatsapp=form.querySelector('[data-send-whatsapp]');
 const whatsappBusiness=form.querySelector('[data-send-business]');
 const emailLink=form.querySelector('[data-send-email]');
 if(whatsapp)whatsapp.href='https://wa.me/'+phone+'?text='+encoded;
 if(whatsappBusiness)whatsappBusiness.href='https://api.whatsapp.com/send?phone='+phone+'&text='+encoded;
 if(emailLink)emailLink.href='https://mail.google.com/mail/?view=cm&fs=1&to=arpansubba775@gmail.com&su='+encodeURIComponent('ORVEXA DIGITAL enquiry — '+data.get('name'))+'&body='+encoded;
 if(modal){modal.hidden=false;document.body.classList.add('contact-modal-open');modal.querySelector('[data-close-contact-modal]')?.focus()}
})}});
/* Smooth hero video playback: preload early, retry after buffering, respect visibility. */
(()=>{
 const video=document.querySelector('.hero-work-video');
 if(!video)return;
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 video.muted=true;
 video.defaultMuted=true;
 video.playsInline=true;
 let retryTimer=null;
 const clearRetry=()=>{if(retryTimer){clearTimeout(retryTimer);retryTimer=null}};
 const tryPlay=()=>{
  if(motion.matches||document.hidden)return;
  if(video.readyState<2)return;
  const attempt=video.play();
  if(attempt&&typeof attempt.catch==='function'){
   attempt.catch(()=>{
    clearRetry();
    retryTimer=setTimeout(()=>{
     if(!document.hidden&&!motion.matches&&video.readyState>=2)tryPlay();
    },900);
   });
  }
 };
 video.addEventListener('loadeddata',tryPlay);
 video.addEventListener('canplay',tryPlay);
 video.addEventListener('playing',()=>{
  clearRetry();
  video.classList.remove('video-buffering','video-failed');
 });
 video.addEventListener('waiting',()=>video.classList.add('video-buffering'));
 video.addEventListener('stalled',()=>{
  clearRetry();
  retryTimer=setTimeout(tryPlay,1300);
 });
 video.addEventListener('error',()=>video.classList.add('video-failed'));
 video.addEventListener('ended',()=>{
  video.currentTime=0;
  tryPlay();
 });
 const syncPlayback=()=>{
  if(motion.matches||document.hidden){
   clearRetry();
   video.pause();
   return;
  }
  tryPlay();
 };
 document.addEventListener('visibilitychange',syncPlayback);
 if(typeof motion.addEventListener==='function')motion.addEventListener('change',syncPlayback);
 syncPlayback();
})();

/* Continuous code typing animation for the ORVEXA workspace preview. */
(()=>{
 const code=document.querySelector('[data-code-stream]');
 const numbers=document.querySelector('[data-code-numbers]');
 if(!code||!numbers)return;
 const tabs=[...document.querySelectorAll('.code-tabbar span')];
 const state=document.querySelector('[data-code-state]');
 const build=document.querySelector('[data-code-build]');
 const examples=[
  {file:0,lines:[
   '<!doctype html>',
   '<html lang="en">',
   '<head>',
   '  <meta charset="UTF-8">',
   '  <meta name="viewport" content="width=device-width">',
   '  <title>ORVEXA Digital</title>',
   '</head>',
   '<body>',
   '  <main class="hero">',
   '    <h1>Build something better.</h1>',
   '    <p>Digital experiences that grow.</p>',
   '  </main>',
   '</body>',
   '</html>'
  ]},
  {file:1,lines:[
   ':root {',
   '  --surface: #111111;',
   '  --text: #f5f5f5;',
   '}',
   '.hero {',
   '  display: grid;',
   '  grid-template-columns: 1fr 1fr;',
   '  align-items: center;',
   '  min-height: 100vh;',
   '  background: var(--surface);',
   '  color: var(--text);',
   '  gap: 3rem;',
   '}',
   '.hero h1 { letter-spacing: -0.04em; }'
  ]},
  {file:2,lines:[
   'const buildWebsite = async () => {',
   '  const design = await createLayout();',
   '  const pages = ["home", "services",',
   '                 "portfolio", "contact"];',
   '  for (const page of pages) {',
   '    await renderPage(page, design);',
   '  }',
   '  return optimiseForEveryScreen();',
   '};',
   '',
   'buildWebsite().then(() => {',
   '  console.log("Ready to launch.");',
   '});'
  ]}
 ];
 let exampleIndex=0,lineIndex=0,charIndex=0,currentLine=null,timer=null,paused=document.hidden;
 const speed=24;
 const schedule=delay=>{
  if(timer)clearTimeout(timer);
  if(!paused)timer=setTimeout(typeNext,delay);
 };
 const setActiveTab=fileIndex=>{
  tabs.forEach((tab,index)=>tab.classList.toggle('active',index===fileIndex));
 };
 const resetExample=()=>{
  code.replaceChildren();
  numbers.replaceChildren();
  currentLine=null;
  lineIndex=0;
  charIndex=0;
  setActiveTab(examples[exampleIndex].file);
  if(state)state.textContent='WRITING CODE';
  if(build){build.textContent='BUILD IN PROGRESS';build.classList.remove('is-done')}
 };
 const typeNext=()=>{
  if(paused||document.hidden)return;
  const example=examples[exampleIndex];
  if(lineIndex>=example.lines.length){
   if(state)state.textContent='BUILD SUCCESS';
   if(build){build.textContent='READY TO PREVIEW';build.classList.add('is-done')}
   if(timer)clearTimeout(timer);
   timer=setTimeout(()=>{
    exampleIndex=(exampleIndex+1)%examples.length;
    resetExample();
    typeNext();
   },1650);
   return;
  }
  const line=example.lines[lineIndex];
  if(!currentLine){
   const number=document.createElement('span');
   number.textContent=String(lineIndex+1).padStart(2,'0');
   numbers.append(number);
   currentLine=document.createElement('span');
   currentLine.className='code-line '+(
    line.trim().startsWith('<!--')?'syntax-muted':
    line.trim().startsWith('<')||line.trim().startsWith('}')?'syntax-tag':
    line.includes(':')?'syntax-property':''
   );
   code.append(currentLine);
   currentLine.textContent='';
   currentLine.dataset.line=lineIndex;
  }
  charIndex=Math.min(line.length,charIndex+1);
  currentLine.textContent=line.slice(0,charIndex);
  const pane=document.querySelector('.code-editor-body');
  if(pane){
   pane.scrollTop=pane.scrollHeight;
   numbers.scrollTop=pane.scrollTop;
  }
  if(charIndex<line.length){
   schedule(speed);
  }else{
   lineIndex++;
   charIndex=0;
   currentLine=null;
   schedule(110);
  }
 };
 const handleVisibility=()=>{
  paused=document.hidden;
  if(paused){if(timer)clearTimeout(timer);timer=null}
  else if(!timer)typeNext();
 };
 document.addEventListener('visibilitychange',handleVisibility);
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 if(motion.matches){
  resetExample();
  examples[0].lines.forEach((line,index)=>{
   const num=document.createElement('span');
   num.textContent=String(index+1).padStart(2,'0');
   numbers.append(num);
   const row=document.createElement('span');
   row.className='code-line';
   row.textContent=line;
   code.append(row);
  });
  if(state)state.textContent='CODE PREVIEW';
  if(build)build.textContent='READY TO PREVIEW';
 }else{
  resetExample();
  typeNext();
 }
})();
/* Visitor feedback — browser-local until a shared review database is connected. */
(()=>{
 const KEY='orvexa-public-reviews-v1';
 const esc=(value)=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const getReviews=()=>{try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value:[]}catch(error){return []}};
 const renderReviews=()=>{
  const list=document.querySelector('[data-reviews-list]');
  const count=document.querySelector('[data-review-count]');
  const label=document.querySelector('[data-review-count-label]');
  if(!list||!count||!label)return;
  const reviews=getReviews();
  count.textContent=String(reviews.length);
  label.textContent=reviews.length===1?'Review':'Reviews';
  list.replaceChildren();
  if(!reviews.length){
   const empty=document.createElement('div');
   empty.className='reviews-empty';
   empty.innerHTML='<div class="review-stars" aria-hidden="true">★★★★★</div><h3>Be the first to leave a review.</h3><p>Worked with ORVEXA DIGITAL? Use the Write a review button above to share your experience.</p>';
   list.append(empty);
   return;
  }
  reviews.slice().reverse().forEach(item=>{
   const card=document.createElement('article');
   card.className='review-card';
   const date=new Date(item.date);
   const dateText=Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric'}).format(date);
   card.innerHTML='<div class="review-card-top"><strong class="review-card-name">'+esc(item.name)+'</strong><span class="review-card-rating" aria-label="'+esc(item.rating)+' out of 5 stars">'+'★'.repeat(item.rating)+'☆'.repeat(5-item.rating)+'</span></div><p>'+esc(item.text).replace(/\n/g,'<br>')+'</p><div class="review-card-date">'+esc(dateText)+'</div>';
   list.append(card);
  });
 };
 const form=document.querySelector('#review-form');
 if(!form)return;
 const openForm=()=>{form.hidden=false;form.scrollIntoView({behavior:'smooth',block:'center'});form.querySelector('[name="reviewer"]')?.focus({preventScroll:true})};
 const closeForm=()=>{form.hidden=true;form.reset()};
 document.addEventListener('click',event=>{
  const open=event.target.closest('[data-review-open]');
  const close=event.target.closest('[data-review-close]');
  if(open)openForm();
  if(close)closeForm();
 });
 form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!form.reportValidity())return;
  const data=new FormData(form);
  const name=String(data.get('reviewer')||'').trim();
  const text=String(data.get('review')||'').trim();
  const rating=Number(data.get('rating'));
  if(!name||!text||!Number.isInteger(rating)||rating<1||rating>5)return;
  const reviews=getReviews();
  reviews.push({name,text,rating,date:new Date().toISOString()});
  try{
   localStorage.setItem(KEY,JSON.stringify(reviews));
   renderReviews();
   closeForm();
   const list=document.querySelector('[data-reviews-list]');
   list?.scrollIntoView({behavior:'smooth',block:'center'});
  }catch(error){
   alert('This browser could not save the review. Please check your browser storage settings and try again.');
  }
 });
 renderReviews();
})();
