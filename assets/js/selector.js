(async()=>{'use strict';const cfg=window.S4U_ACCESS_CONFIG, root=document.querySelector('#cards'),summary=document.querySelector('#accountSummary'),count=document.querySelector('#count'),search=document.querySelector('#search'),message=document.querySelector('#selectorMessage');let rows=[];
const empty=(title,detail)=>{root.replaceChildren();const box=document.createElement('div');box.className='empty';const a=document.createElement('strong');a.textContent=title;box.append(a,document.createTextNode(detail));root.append(box)};
if(!cfg?.supabaseUrl||!cfg?.supabasePublishableKey){empty('Configuration required','Central authentication has not been configured.');document.documentElement.classList.remove('s4u-session-pending');return}
const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{storageKey:cfg.authStorageKey,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const {data:{session}}=await sb.auth.getSession();if(!session){root.replaceChildren();location.replace('/?reason=session');return}document.documentElement.classList.remove('s4u-session-pending');
// Display identity only from the signed-in user's own profile or account metadata.
// Authorization remains exclusively with the existing selector and handoff endpoints.
async function showAccountName(){
 const welcome=document.querySelector('#selectorWelcome');
 const label=document.querySelector('#selectorName');
 if(!welcome||!label)return;
 const clean=value=>typeof value==='string'?value.trim().replace(/\s+/g,' ').slice(0,100):'';
 let display='';
 try{
  const {data,error}=await sb.from('user_profiles').select('first_name,last_name,display_name').eq('id',session.user.id).maybeSingle();
  if(!error&&data)display=clean([clean(data.first_name),clean(data.last_name)].filter(Boolean).join(' '))||clean(data.display_name);
 }catch(_){}
 if(!display){
  const m=session.user.user_metadata||{};
  display=clean([clean(m.first_name),clean(m.last_name)].filter(Boolean).join(' '))||clean(m.full_name)||clean(m.name)||clean(m.display_name);
 }
 welcome.textContent=display?'Welcome back, '+display:'Welcome back';
 label.textContent='Your Workforce account';
}
showAccountName();
document.querySelector('#signout').addEventListener('click',async()=>{await sb.auth.signOut({scope:'local'});location.replace('/')});
function paintLegacy(){const q=search.value.trim().toLowerCase();const subset=rows.filter(r=>[r.title,r.organization,r.plan,r.portal_type].some(s=>String(s||'').toLowerCase().includes(q)));count.textContent=subset.length+' shown';if(!subset.length){empty(rows.length?'No matches found':'No authorized subscriptions','Your account has no matching workspaces.');return}root.replaceChildren();for(const p of subset){const card=document.createElement('article');card.className='portal-card';const head=document.createElement('div');head.className='card-head';const symbol=document.createElement('div');symbol.className='card-symbol';symbol.textContent=(p.title||p.portal_type||'P').slice(0,2).toUpperCase();const titlewrap=document.createElement('div');const title=document.createElement('h4');title.textContent=p.title||'Workspace';const business=document.createElement('p');business.textContent=p.organization||'Authorized organization';const hostline=document.createElement('small');hostline.className='portal-hostname';hostline.textContent=new URL(p.launch_url).hostname;titlewrap.append(title,business,hostline);head.append(symbol,titlewrap);const meta=document.createElement('div');meta.className='card-meta';for(const v of [p.portal_type,p.plan])if(v){const tag=document.createElement('span');tag.className='tag';tag.textContent=v;meta.append(tag)}const a=document.createElement('a');a.className='enter';a.textContent=p.setup_only?'Open portal (setup) →':'Open portal →';a.href=p.launch_url;a.rel='noopener noreferrer';if(p.setup_only){a.removeAttribute('href');a.setAttribute('aria-disabled','true');a.style.cursor='not-allowed';a.title='Awaiting authorized employer assignment';a.textContent='Awaiting access assignment';a.addEventListener('click',event=>{event.preventDefault();message.textContent='This portal is registered but this account does not yet have a verified subscription or employer membership for it.';message.className='notice error'});}// Use the central handoff for every supported portal instead of navigating without a session.
if(!p.setup_only){
 const destinations={
 'lab-account.screenings4u.com':'lab_account',
 'ctpa-dot.screenings4u.com':'ctpa_dot',
 'ctpa.screenings4u.com':'ctpa_dot',
 'ctpa-employer-dot.screenings4u.com':'ctpa_employer_dot',
 'ctpa-employee-dot.screenings4u.com':'ctpa_employee_dot',
 'ctpa-driver-dot.screenings4u.com':'ctpa_driver_dot',
 'fmcsa-employer-dot.screenings4u.com':'employer_dot',
 'fmcsa-driver-dot.screenings4u.com':'driver_dot',
 'fmcsa-employee-dot.screenings4u.com':'employee_dot',
 'owner-operator.screenings4u.com':'owner_operator',
 'fmcsa-dot.screenings4u.com':'fmcsa_dot',
 'faa-dot.screenings4u.com':'faa_dot',
 'fra-dot.screenings4u.com':'fra_dot',
 'fta-dot.screenings4u.com':'fta_dot',
 'phmsa-dot.screenings4u.com':'phmsa_dot',
 'uscg-dot.screenings4u.com':'uscg_dot',
 'faa-employer-dot.screenings4u.com':'faa_employer_dot',
 'fra-employer-dot.screenings4u.com':'fra_employer_dot',
 'fta-employer-dot.screenings4u.com':'fta_employer_dot',
 'phmsa-employer-dot.screenings4u.com':'phmsa_employer_dot',
 'uscg-employer-dot.screenings4u.com':'uscg_employer_dot',
 'faa-employee-dot.screenings4u.com':'faa_employee_dot',
 'fra-employee-dot.screenings4u.com':'fra_employee_dot',
 'fta-employee-dot.screenings4u.com':'fta_employee_dot',
 'phmsa-employee-dot.screenings4u.com':'phmsa_employee_dot',
 'uscg-employee-dot.screenings4u.com':'uscg_employee_dot',
 'ctpa-non-dot.screenings4u.com':'ctpa_workforce',

 'employee-non-dot.screenings4u.com':'employee_workforce',
 'employer-non-dot.screenings4u.com':'employer_workforce',

 'ctpa-employer-non-dot.screenings4u.com':'ctpa_employer_workforce',
 'ctpa-employee-non-dot.screenings4u.com':'ctpa_employee_workforce',
 'ctpa-driver-non-dot.screenings4u.com':'ctpa_driver_workforce'
 };
 const dest=new URL(p.launch_url);
 const portal=dest.hostname==='independent-contractor.screenings4u.com'?'independent_contractor':destinations[dest.hostname];
 if(portal){
 a.addEventListener('click',async event=>{
 event.preventDefault();event.stopImmediatePropagation();
 if(a.dataset.busy==='1')return;
 a.dataset.busy='1';a.textContent='Connecting securely…';message.textContent='';
 try{
 const {data:{session:current},error:sessionError}=await sb.auth.getSession();
 if(sessionError||!current)throw Error('Session expired. Sign in again.');
 const surface=portal==='lab_account'?'lab':portal.endsWith('_workforce')?'workforce':'dot';
 const payload={action:'create',surface,portal_code:portal,next:'/dashboard.html'};
 if(p.membership_id)payload.membership_id=p.membership_id;
 if(p.employee_id)payload.employee_id=p.employee_id;
 if(p.assignment_id)payload.assignment_id=p.assignment_id;
 // Handoff pages require the exact verified workspace identifiers selected here.
 // Never manufacture IDs or infer access from URL parameters.
 if(portal==='ctpa_workforce'&&p.ctpa_id&&p.subscription_id&&p.membership_id){
  const q=new URLSearchParams({ctpa_id:String(p.ctpa_id),subscription_id:String(p.subscription_id),membership_id:String(p.membership_id)});
  if(p.organization_id)q.set('organization_id',String(p.organization_id));
  payload.next='/dashboard.html?'+q.toString();
 }
 if(portal==='employer_dot'&&p.membership_id){
  payload.next='/dashboard.html?'+new URLSearchParams({membership_id:String(p.membership_id)}).toString();
 }
 if(portal==='ctpa_dot'&&p.ctpa_id&&p.subscription_id)payload.next='/workspace.html?ctpa_id='+encodeURIComponent(p.ctpa_id)+'&subscription_id='+encodeURIComponent(p.subscription_id);
 if(portal==='ctpa_employer_dot'&&p.membership_id&&p.subscription_id)payload.next='/dashboard.html?membership_id='+encodeURIComponent(p.membership_id)+'&subscription_id='+encodeURIComponent(p.subscription_id);
 const response=await fetch(cfg.supabaseUrl+'/functions/v1/portal-session-handoff',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+current.access_token,apikey:cfg.supabasePublishableKey},body:JSON.stringify(payload)});
 const result=await response.json().catch(()=>({}));
 if(!response.ok||!result.redirect_url)throw Error(result.error||'Unable to open this portal.');
 const target=new URL(result.redirect_url);
 // The legacy C/TPA subscription catalog may still reference ctpa-dot;
 // its verified handoff target is now the canonical ctpa.screenings4u.com.
 const canonicalHost=portal==='ctpa_dot'?'ctpa.screenings4u.com':dest.hostname;
 if(target.protocol!=='https:'||target.hostname!==canonicalHost||target.pathname!=='/auth-handoff.html')
   throw Error('Portal destination does not match the authorized workspace.');
 location.assign(target.href);
 }catch(error){message.textContent=error.message||'Unable to open portal.';message.className='notice error';a.dataset.busy='0';a.textContent='Open portal →'}
 },true);
 }
}
// The C/TPA context switch only navigates among cards the backend already authorized.
let contextPanel=null;
if(p.portal_code==='ctpa_dot'||p.portal_code==='ctpa_workforce'){
 const selectedCode=p.portal_code;
 contextPanel=document.createElement('div');contextPanel.className='wfa-context';contextPanel.setAttribute('aria-label','C/TPA operating context');
 const label=document.createElement('span');label.textContent='Operating context';contextPanel.append(label);
 const choices=document.createElement('div');choices.className='wfa-context-switch';
 for(const [code,labelText] of [['ctpa_dot','DOT'],['ctpa_workforce','NON-DOT']]){
  const choice=document.createElement('button');choice.type='button';choice.textContent=labelText;
  const allowed=code===selectedCode||(!!p.organization_id&&rows.some(x=>x.portal_code===code&&x.organization_id===p.organization_id&&!x.setup_only));
  choice.disabled=!allowed;choice.className=code===selectedCode?'active':'';
  choice.setAttribute('aria-pressed',String(code===selectedCode));
  if(allowed&&code!==selectedCode)choice.addEventListener('click',()=>{
    const target=[...root.querySelectorAll('.portal-card')].find(el=>el.dataset.portalCode===code&&el.dataset.orgId===p.organization_id);
    target?.scrollIntoView({behavior:'smooth',block:'center'});target?.classList.add('wfa-card-focused');target?.querySelector('.enter')?.focus({preventScroll:true});
  });
  choices.append(choice);
 }
 contextPanel.append(choices);
}
card.dataset.portalCode=p.portal_code||'';
card.dataset.orgId=p.organization_id||'';
card.append(head,meta);
if(contextPanel)card.append(contextPanel);
card.append(a);root.append(card)}}

/* Five-role visual selector. The existing paintLegacy builds the authorized launch
 * links and secure handoff handlers; cards are reorganized, never reauthorized in UI. */
const CATEGORIES=[
 {id:'ctpa',label:'C/TPA',icon:'▤',desc:'Manage your third-party compliance and consortium programs.',action:'Open C/TPA Portal'},
 {id:'employer',label:'Employer',icon:'♧',desc:'Manage employees, testing, and workforce compliance.',action:'Open Employer Portal'},
 {id:'owner',label:'Owner-Operator',icon:'▱',desc:'Manage owner-operator compliance and screening.',action:'Open Owner-Operator Portal'},
 {id:'independent',label:'Independent Contractor',icon:'♙',desc:'Access contractor assignments and credentials.',action:'Open Contractor Portal'},
 {id:'agency',label:'DOT Agency',icon:'▥',desc:'Access FAA, FMCSA, FRA, FTA, PHMSA and USCG workspaces.',action:'Open DOT Agency Portal'}
];
let selectedCategory='ctpa',selectedContext='dot';
function categoryFor(p){
 const host=new URL(p.launch_url).hostname.toLowerCase();
 const title=String(p.title||'').toLowerCase();
 const type=String(p.portal_type||'').toLowerCase();
 const all=[host,title,type,String(p.portal_code||'')].join(' ');
 if(/ctpa|c\/tpa|consortium|third.party/.test(all))return 'ctpa';
 if(/owner.operator|owner_operator/.test(all))return 'owner';
 if(/independent.contractor|independent_contractor/.test(all))return 'independent';
 if(/(?:^|[.-])(faa|fmcsa|fra|fta|phmsa|uscg)(?:[.-])/.test(host)||/\\b(faa|fmcsa|fra|fta|phmsa|uscg)\\b/.test(title))return 'agency';
 if(/employer|employee|driver|non.dot|workforce/.test(all))return 'employer';
 if(/dot/.test(all))return 'agency';
 return 'other';
}
function contextFor(p){
 const all=[p.title,p.portal_type,p.portal_code,new URL(p.launch_url).hostname].join(' ').toLowerCase();
 return /non.dot|nondot|_workforce|workforce_/.test(all)?'nondot':'dot';
}
function dom(tag,className,textContent){const e=document.createElement(tag);if(className)e.className=className;if(textContent!==undefined)e.textContent=String(textContent);return e}
function paint(){
 const q=search.value.trim().toLowerCase();
 const subset=rows.filter(r=>[r.title,r.organization,r.plan,r.portal_type,new URL(r.launch_url).hostname].some(v=>String(v||'').toLowerCase().includes(q)));
 paintLegacy(); // builds a secure clickable card for every server-authorized row
 const renderedCards=Array.from(root.querySelectorAll(':scope > .portal-card'));
 const items=subset.map((p,i)=>({data:p,node:renderedCards[i],category:categoryFor(p)})).filter(x=>x.node);
 const totals=Object.fromEntries(CATEGORIES.map(x=>[x.id,items.filter(v=>v.category===x.id)]));
 const usable=Object.fromEntries(CATEGORIES.map(x=>[x.id,totals[x.id].filter(v=>!v.data.setup_only)]));
 if(!usable[selectedCategory]?.length){
  selectedCategory=(CATEGORIES.find(x=>usable[x.id].length)||CATEGORIES[0]).id;
 }
 const outer=dom('div','wfa-workspace-experience');
 const grid=dom('section','wfa-workspace-grid');grid.setAttribute('aria-label','Choose your portal type');
 for(const def of CATEGORIES){
  const allowed=usable[def.id].length>0;
  const pending=totals[def.id].length>0&&!allowed;
  const card=dom('article','wfa-workspace-type'+(selectedCategory===def.id?' is-selected':'')+(!allowed?' is-locked':''));
  const head=dom('div','wfa-workspace-head');
  const icon=dom('span','wfa-workspace-icon');icon.setAttribute('aria-hidden','true');
 const svgs={
 ctpa:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/></svg>',
 employer:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 6a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 5"/></svg>',
 owner:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M2 6h12v12H2zM14 10h4l4 4v4h-8z"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></svg>',
 independent:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 14a8 8 0 0 1 16 0H4Zm-1 0h18M8 14v-3m8 3v-3M7 17h10"/></svg>',
 agency:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m2 9 10-6 10 6H2Zm2 12h16M3 18h18M6 10v8m4-8v8m4-8v8m4-8v8"/></svg>'
 };icon.innerHTML=svgs[def.id];
  const state=dom('span','wfa-workspace-state'+(allowed?' allowed':pending?' pending':' locked'),allowed?'✓ Active':pending?'◷ Requires assignment':'♙ Not assigned');
  head.append(icon,state);
  const h=dom('h2','',def.label);
  const desc=dom('p','wfa-workspace-desc',def.desc);
  card.append(head,h,desc);
  if(def.id==='ctpa'){
   const ctx=dom('div','wfa-workspace-ctx');
   ctx.append(dom('div','wfa-context-caption','Access context'));
   const tabs=dom('div','wfa-workspace-tabs');
   for(const [key,label] of [['dot','DOT'],['nondot','NON-DOT']]){
    const has=usable.ctpa.some(x=>contextFor(x.data)===key);
    const btn=dom('button',selectedContext===key?'active':'',label);
    btn.type='button';btn.disabled=!has;btn.setAttribute('aria-pressed',String(selectedContext===key));
    btn.addEventListener('click',()=>{selectedCategory='ctpa';selectedContext=key;paint()});
    tabs.append(btn);
   }
   if(!usable.ctpa.some(x=>contextFor(x.data)===selectedContext)){
    selectedContext=usable.ctpa.some(x=>contextFor(x.data)==='dot')?'dot':'nondot';
    for(const btn of tabs.children){const isSelected=btn.textContent.toLowerCase().replace('-','')===selectedContext;btn.classList.toggle('active',isSelected);btn.setAttribute('aria-pressed',String(isSelected));}
   }
   ctx.append(tabs);card.append(ctx);
  }else{card.append(dom('div','wfa-workspace-spacer',''));}
  const note=dom('div','wfa-workspace-note',allowed?usable[def.id].length+' assigned workspace'+(usable[def.id].length===1?'':'s'):pending?'Your administrator must finish your assignment.':'No assigned access for this account.');
  card.append(note);
  const btn=dom('button','wfa-workspace-open',allowed?def.action+' →':pending?'Awaiting assignment':'Locked');
  btn.type='button';btn.disabled=!allowed;btn.setAttribute('aria-expanded',String(selectedCategory===def.id&&allowed));
  btn.addEventListener('click',()=>{selectedCategory=def.id;paint();document.querySelector('#wfa-available-options')?.scrollIntoView({block:'nearest',behavior:'smooth'})});
  card.append(btn);grid.append(card);
 }
 outer.append(grid);
 const detail=dom('section','wfa-workspace-detail');detail.id='wfa-available-options';
 const def=CATEGORIES.find(x=>x.id===selectedCategory);
 const eligible=(usable[selectedCategory]||[]).filter(x=>selectedCategory!=='ctpa'||contextFor(x.data)===selectedContext);
 const pending=totals[selectedCategory].filter(x=>x.data.setup_only);
 const sectionHead=dom('div','wfa-detail-header');
 const info=dom('div','');
 info.append(dom('h3','',def.label+' workspaces'),dom('p','',eligible.length?'Choose the assigned subscription or organization you want to open.':'No currently accessible subscriptions in this category.'));
 sectionHead.append(info,dom('span','wfa-detail-count',eligible.length+' available'));
 detail.append(sectionHead);
 if(eligible.length){
  const options=dom('div','wfa-detail-options');
  const seen=new Set();
  for(const item of eligible){
   const p=item.data;
   // Keep distinct subscriptions and memberships; collapse only exact repeats.
   const key=[p.launch_url,p.subscription_id,p.membership_id,p.assignment_id,p.plan,p.organization].join('|');
   if(seen.has(key))continue;seen.add(key);
   const row=dom('div','wfa-option-row');
   const left=dom('div','wfa-option-info');
   left.append(dom('strong','',p.organization||p.title||def.label));
   left.append(dom('small','',(p.plan||p.title||'Assigned workspace')+' · '+new URL(p.launch_url).hostname));
   const action=item.node.querySelector('.enter');
   if(action){action.classList.add('wfa-detail-launch');row.append(left,action);options.append(row);}
  }
  detail.append(options);
 }else{
  const note=dom('div','wfa-detail-empty',pending.length?'This access is awaiting verified assignment.':'Select another available portal above, or contact support about your access.');
  detail.append(note);
 }
 outer.append(detail);
 const other=items.filter(x=>x.category==='other'&&!x.data.setup_only);
 if(other.length){
  const box=dom('section','wfa-workspace-detail wfa-other-workspaces');
  const disclosure=dom('details','wfa-other-disclosure');
  const trigger=dom('summary','',other.length+' additional authorized service'+(other.length===1?'':'s'));
  const list=dom('div','wfa-detail-options');
  for(const item of other){
   const p=item.data,action=item.node.querySelector('.enter');
   if(!action)continue;
   const row=dom('div','wfa-option-row'),left=dom('div','wfa-option-info');
   left.append(dom('strong','',p.title||'Assigned service'),dom('small','',(p.plan||p.organization||'Authorized account')+' · '+new URL(p.launch_url).hostname));
   action.classList.add('wfa-detail-launch');row.append(left,action);list.append(row);
  }
  disclosure.append(trigger,list);box.append(disclosure);outer.append(box);
 }
 root.replaceChildren(outer);
 count.textContent=CATEGORIES.filter(x=>usable[x.id].length).length+' available portal types';
 const summaryText=rows.length+' assigned subscription'+(rows.length===1?'':'s')+' · '+CATEGORIES.filter(x=>usable[x.id].length).length+' portal types available';
 summary.textContent=summaryText;
 // Customer name is resolved once by showAccountName(), never from their email address.
}
let loading=false;async function load(force=false){if(loading)return;loading=true;const refreshButton=document.querySelector('#refresh');refreshButton.disabled=true;refreshButton.textContent='↻ Refreshing…';if(!cfg.selectorEndpoint){summary.textContent='Awaiting central subscription service';empty('Access directory not connected','Connect the central subscription authorization endpoint before going live.');return}const cacheKey='s4u_selector_v19_'+session.user.id;if(force){try{sessionStorage.removeItem(cacheKey)}catch{}}let hadCache=false;try{const cached=JSON.parse(sessionStorage.getItem(cacheKey)||'null');if(false&&cached&&Date.now()-cached.time<300000&&Array.isArray(cached.portals)){rows=cached.portals;hadCache=true;summary.textContent=rows.length+' authorized subscriptions';paint();}}catch{}if(!hadCache){summary.textContent='Checking your assigned subscriptions…';empty('Loading workspaces','Verifying your account access.');}try{const {data:{session:latest}}=await sb.auth.getSession();if(!latest)throw Error('Session expired. Please sign in again.');const url=new URL(cfg.selectorEndpoint,location.origin);if(url.protocol!=='https:'&&url.hostname!=='localhost')throw Error('Secure endpoint required.');const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+latest.access_token,'apikey':cfg.supabasePublishableKey},body:JSON.stringify({action:'list_authorized_portals'})});const payload=await res.json();if(!res.ok)throw Error(payload.error||'Unable to verify portal access.');if(!Array.isArray(payload.portals))throw Error('Invalid authorization response.');rows=payload.portals.filter(p=>p&&typeof p==='object'&&typeof p.launch_url==='string'&&/^https:\/\//.test(p.launch_url)&&new URL(p.launch_url).hostname.endsWith('.screenings4u.com'));try{sessionStorage.setItem(cacheKey,JSON.stringify({time:Date.now(),portals:rows}))}catch{}summary.textContent=rows.length+' authorized subscription'+(rows.length===1?'':'s');message.textContent='';paint()}catch(err){rows=[];try{sessionStorage.removeItem(cacheKey)}catch{}summary.textContent='Unable to verify subscriptions';empty('Access temporarily unavailable','No portals will be displayed until authorization is verified.');message.textContent=err.message||'Please retry.';message.className='notice error'}finally{loading=false;refreshButton.disabled=false;refreshButton.textContent='↻ Refresh accounts'}}
search.addEventListener('input',paint);document.querySelector('#refresh').addEventListener('click',()=>load(true));window.addEventListener('focus',()=>load(true));document.addEventListener('visibilitychange',()=>{if(!document.hidden)load(true)});sb.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'){rows=[];root.replaceChildren();summary.textContent='Signed out';count.textContent='0 shown';try{sessionStorage.removeItem('s4u_selector_v18_'+session.user.id)}catch{}location.replace('/?reason=session')}});load();})();