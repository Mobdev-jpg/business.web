document.addEventListener('DOMContentLoaded',()=>{const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('.nav-links');if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close menu':'Open menu');toggle.textContent=open?'×':'☰'});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.textContent='☰'}))}document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());const themeButton=document.querySelector('.theme-toggle');const applyTheme=theme=>{document.body.dataset.theme=theme;if(themeButton){themeButton.textContent=theme==='dark'?'☼':'◐';themeButton.setAttribute('aria-label',theme==='dark'?'Switch to light theme':'Switch to dark theme');themeButton.title=theme==='dark'?'Switch to light theme':'Switch to dark theme'}document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#111111':'#ffffff')};let saved='dark';try{saved=localStorage.getItem('orvexa-theme')||'dark'}catch(e){}applyTheme(saved);if(themeButton)themeButton.addEventListener('click',()=>{const next=document.body.dataset.theme==='dark'?'light':'dark';applyTheme(next);try{localStorage.setItem('orvexa-theme',next)}catch(e){}});const form=document.querySelector('.contact-form');if(form){form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const data=new FormData(form);const subject=encodeURIComponent('Website enquiry — '+data.get('name'));const body=encodeURIComponent('Name: '+data.get('name')+'\\nEmail: '+data.get('email')+'\\nBusiness: '+(data.get('business')||'Not provided')+'\\nService: '+data.get('service')+'\\n\\nProject details:\\n'+data.get('message'));window.location.href='mailto:arpansubba775@gmail.com?subject='+subject+'&body='+body})}});
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
   empty.innerHTML='<div class="review-stars" aria-hidden="true">★★★★★</div><h3>Be the first to leave a review.</h3><p>Worked with ORVEXA DIGITAL? Share your experience here.</p><button class="button button-ghost" type="button" data-review-open>Write the first review ↗</button>';
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
