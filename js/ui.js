/* ============================================================
   ui.js — DOM Rendering Engine
   Goals (modular tools), Weight, Sleep, Tags
   ============================================================ */

const UI = (() => {
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  const container = () => $('#page-container');
  const fmtDate = d => new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});

  // --- Toast ---
  let _tt = null;
  const toast = (msg, dur=2500) => {
    const el=$('#toast'); if(_tt) clearTimeout(_tt);
    el.textContent=msg; el.style.display='block'; el.classList.remove('hidden'); el.offsetHeight; el.classList.add('show');
    _tt=setTimeout(()=>{el.classList.remove('show');setTimeout(()=>{el.style.display='none';el.classList.add('hidden');},300);},dur);
  };

  // --- Modal ---
  const openModal = h => { $('#modal-content').innerHTML=h; $('#modal-overlay').classList.remove('hidden'); setTimeout(()=>$('#modal-overlay').classList.add('show'),10); };
  const closeModal = () => { $('#modal-overlay').classList.remove('show'); setTimeout(()=>$('#modal-overlay').classList.add('hidden'),300); };
  document.addEventListener('click', e => { if(e.target.id==='modal-overlay') closeModal(); });

  // --- Icon ---
  const icon = (name, emoji, size=24, ci=null) => {
    if(ci) return `<img src="${ci}" class="app-icon" width="${size}" height="${size}" style="border-radius:4px;object-fit:cover">`;
    const s=Store.getSettings(); const ov=s.iconOverrides&&s.iconOverrides[name]; const src=ov||`public/icons/${name}.png`;
    return `<img src="${src}" class="app-icon" width="${size}" height="${size}" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span class="app-icon-emoji" style="display:none;font-size:${size*.8}px">${emoji||'⭐'}</span>`;
  };

  const circleProgress = (pct, size=80, label='') => {
    const r=(size-8)/2, c=2*Math.PI*r, off=c-(pct/100)*c;
    return `<div class="circle-progress"><svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--border-color)" stroke-width="6"/><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--accent-primary)" stroke-width="6" stroke-dasharray="${c}" stroke-dashoffset="${off}" stroke-linecap="round" transform="rotate(-90 ${size/2} ${size/2})" class="circle-progress-ring"/><text x="${size/2}" y="${size/2}" text-anchor="middle" dominant-baseline="central" fill="var(--text-primary)" font-size="16" font-weight="700" font-family="var(--font-mono)">${pct}%</text></svg>${label?`<div class="circle-label">${label}</div>`:''}</div>`;
  };

  // ============================================================
  // ICON PICKER
  // ============================================================
  const GOAL_ICONS = [
    {icon:'goal-star',emoji:'⭐'},{icon:'goal-brush',emoji:'🪥'},{icon:'goal-floss',emoji:'🦷'},{icon:'goal-clean',emoji:'🧹'},
    {icon:'goal-water',emoji:'💧'},{icon:'goal-exercise',emoji:'🏃'},{icon:'goal-meditate',emoji:'🧘'},{icon:'goal-vitamins',emoji:'💊'},
    {icon:'goal-read',emoji:'📚'},{icon:'goal-sleep',emoji:'🛏️'},{icon:'goal-journal',emoji:'✍️'},{icon:'goal-target',emoji:'🎯'},
    {icon:'goal-salad',emoji:'🥗'},{icon:'goal-muscle',emoji:'💪'},{icon:'goal-brain',emoji:'🧠'}
  ];
  const EXTRA_EMOJI = ['🏠','🛒','📝','🎮','🎵','🚴','🏊','🧗','🍎','💤','🚶','🐕','📱','💼','🎨','🌿','🧺','💡','🔥','❤️','🙏','🌅','🌙','✈️','🎓','💰','🍳','🏋️','☕','💊'];
  let _si = {type:'builtin',icon:'goal-star',emoji:'⭐',customIcon:null};

  const buildIconPicker = cur => {
    _si=cur||{type:'builtin',icon:'goal-star',emoji:'⭐',customIcon:null};
    return `<div class="icon-picker-tabs"><button class="icon-tab active" data-tab="builtin">Built-in</button><button class="icon-tab" data-tab="emoji">Emoji</button><button class="icon-tab" data-tab="upload">Upload</button></div>
      <div class="icon-tab-content" id="tab-builtin"><div class="icon-picker" id="ip-builtin">${GOAL_ICONS.map((ic,i)=>`<button class="icon-pick-btn ${_si.icon===ic.icon?'selected':''}" data-type="builtin" data-idx="${i}">${ic.emoji}</button>`).join('')}</div></div>
      <div class="icon-tab-content hidden" id="tab-emoji"><div class="icon-picker" id="ip-emoji">${EXTRA_EMOJI.map(em=>`<button class="icon-pick-btn ${_si.emoji===em&&_si.type==='emoji'?'selected':''}" data-type="emoji" data-emoji="${em}">${em}</button>`).join('')}</div>
        <div class="emoji-custom-row"><input type="text" id="custom-emoji-input" class="app-input small" placeholder="Type emoji..." maxlength="4" style="width:80px;text-align:center;font-size:18px"><button class="app-btn ghost small" id="custom-emoji-use">Use</button></div></div>
      <div class="icon-tab-content hidden" id="tab-upload"><div class="upload-zone" id="upload-zone"><div class="upload-preview" id="upload-preview">${_si.customIcon?`<img src="${_si.customIcon}" width="48" height="48">`:'📁'}</div><div class="upload-label">Tap to upload</div><input type="file" id="icon-file-input" accept="image/*" style="display:none"></div></div>
      <div class="selected-icon-preview">Selected: <span id="icon-preview-display">${_si.customIcon?'📷 Custom':_si.emoji}</span></div>`;
  };

  const wireIconPicker = () => {
    $$('.icon-tab').forEach(t=>t.addEventListener('click',()=>{$$('.icon-tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');$$('.icon-tab-content').forEach(c=>c.classList.add('hidden'));$(`#tab-${t.dataset.tab}`).classList.remove('hidden');}));
    $$('#ip-builtin .icon-pick-btn').forEach(b=>b.addEventListener('click',()=>{$$('.icon-pick-btn').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');const ic=GOAL_ICONS[+b.dataset.idx];_si={type:'builtin',icon:ic.icon,emoji:ic.emoji,customIcon:null};$('#icon-preview-display').textContent=ic.emoji;}));
    $$('#ip-emoji .icon-pick-btn').forEach(b=>b.addEventListener('click',()=>{$$('.icon-pick-btn').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');_si={type:'emoji',icon:'goal-star',emoji:b.dataset.emoji,customIcon:null};$('#icon-preview-display').textContent=b.dataset.emoji;}));
    const ce=$('#custom-emoji-use');if(ce)ce.addEventListener('click',()=>{const v=$('#custom-emoji-input').value.trim();if(v){$$('.icon-pick-btn').forEach(x=>x.classList.remove('selected'));_si={type:'emoji',icon:'goal-star',emoji:v,customIcon:null};$('#icon-preview-display').textContent=v;}});
    const uz=$('#upload-zone'),fi=$('#icon-file-input');
    if(uz&&fi){uz.addEventListener('click',()=>fi.click());fi.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=64;c.height=64;c.getContext('2d').drawImage(img,0,0,64,64);const url=c.toDataURL('image/png');_si={type:'upload',icon:'goal-star',emoji:'📷',customIcon:url};$('#upload-preview').innerHTML=`<img src="${url}" width="48" height="48" style="border-radius:8px">`;$('#icon-preview-display').textContent='📷 Custom';$$('.icon-pick-btn').forEach(x=>x.classList.remove('selected'));};img.src=ev.target.result;};r.readAsDataURL(f);});}
  };

  // ============================================================
  // FREQUENCY PICKER
  // ============================================================
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const buildFreqPicker = f => {
    const fr=f||{type:'daily'};
    return `<div class="modal-section-label">Frequency:</div><select class="app-input" id="freq-type-select">
      <option value="daily" ${fr.type==='daily'?'selected':''}>Every day</option><option value="x_per_week" ${fr.type==='x_per_week'?'selected':''}>X times/week</option>
      <option value="specific_days" ${fr.type==='specific_days'?'selected':''}>Specific days</option><option value="x_per_month" ${fr.type==='x_per_month'?'selected':''}>X times/month</option>
      <option value="x_per_year" ${fr.type==='x_per_year'?'selected':''}>X times/year</option></select>
      <div id="freq-x-row" class="freq-option-row ${['x_per_week','x_per_month','x_per_year'].includes(fr.type)?'':'hidden'}"><label class="settings-label">How many?</label><input type="number" id="freq-x-input" class="app-input small" min="1" max="365" value="${fr.x||3}" style="width:70px"></div>
      <div id="freq-days-row" class="freq-option-row ${fr.type==='specific_days'?'':'hidden'}"><div class="day-picker">${DAYS.map((d,i)=>`<button class="day-pick-btn ${(fr.days||[]).includes(i)?'selected':''}" data-day="${i}">${d}</button>`).join('')}</div></div>`;
  };
  const wireFreqPicker = () => {
    const ts=$('#freq-type-select');if(!ts)return;
    ts.addEventListener('change',()=>{const t=ts.value;$('#freq-x-row').classList.toggle('hidden',!['x_per_week','x_per_month','x_per_year'].includes(t));$('#freq-days-row').classList.toggle('hidden',t!=='specific_days');});
    $$('.day-pick-btn').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();b.classList.toggle('selected');}));
  };
  const getFreqFromPicker = () => {
    const ts=$('#freq-type-select');if(!ts)return{type:'daily'};const t=ts.value;
    if(t==='daily')return{type:'daily'};if(t==='specific_days')return{type:'specific_days',days:[...$$('.day-pick-btn.selected')].map(b=>+b.dataset.day)};
    return{type:t,x:parseInt($('#freq-x-input').value)||3};
  };

  // ============================================================
  // TOOL PICKER + CONFIG
  // ============================================================
  const buildToolPicker = tools => {
    const tl=tools||['check'];
    return `<div class="modal-section-label">Tracking Tools:</div><div class="tool-picker" id="tool-picker">
      ${Object.values(Store.TOOL_DEFS).map(t=>`<label class="tool-pick-item ${tl.includes(t.id)?'selected':''}"><input type="checkbox" value="${t.id}" ${tl.includes(t.id)?'checked':''} class="tool-pick-cb"><span class="tool-pick-emoji">${t.emoji}</span><span class="tool-pick-label">${t.label}</span></label>`).join('')}</div>`;
  };

  const buildToolConfig = (tools, cfg) => {
    const c=cfg||{}; let h='';
    if(tools.includes('number')) h+=`<div class="tool-config-section"><div class="modal-section-label">🔢 Number:</div><input type="text" id="tc-number-label" class="app-input small" placeholder="What to track" value="${c.numberLabel||''}" maxlength="20"><input type="text" id="tc-number-unit" class="app-input small" placeholder="Unit" value="${c.numberUnit||''}" maxlength="10" style="margin-top:6px"></div>`;
    if(tools.includes('target')) h+=`<div class="tool-config-section"><div class="modal-section-label">🎯 Target:</div><input type="number" id="tc-target-value" class="app-input small" placeholder="Target #" value="${c.targetValue||''}" step="any"><input type="text" id="tc-target-unit" class="app-input small" placeholder="Unit" value="${c.targetUnit||''}" maxlength="15" style="margin-top:6px"></div>`;
    if(tools.includes('counter')) h+=`<div class="tool-config-section"><div class="modal-section-label">🔄 Counter:</div><input type="text" id="tc-counter-label" class="app-input small" placeholder="What to count" value="${c.counterLabel||''}" maxlength="20"><input type="number" id="tc-counter-goal" class="app-input small" placeholder="Daily goal" value="${c.counterGoal||''}" style="margin-top:6px"></div>`;
    if(tools.includes('timer')) h+=`<div class="tool-config-section"><div class="modal-section-label">⏱️ Timer:</div><input type="text" id="tc-timer-label" class="app-input small" placeholder="Activity name" value="${c.timerLabel||''}" maxlength="20"></div>`;
    if(tools.includes('medication')) h+=`<div class="tool-config-section"><div class="modal-section-label">💊 Medication:</div><input type="text" id="tc-med-name" class="app-input small" placeholder="Med name" value="${c.medName||''}" maxlength="30"><input type="text" id="tc-med-dosage" class="app-input small" placeholder="Dosage (e.g. 10mg)" value="${c.medDosage||''}" maxlength="20" style="margin-top:6px"><div class="modal-section-label" style="margin-top:8px">Times per day:</div><div id="med-times-list">${(c.medTimes||['08:00']).map((t,i)=>`<div class="med-time-row"><input type="time" class="app-input small med-time-input" value="${t}"><button class="checklist-remove-btn med-time-remove">✕</button></div>`).join('')}</div><button class="app-btn ghost small" id="btn-add-med-time" style="margin-top:6px">+ Add time</button></div>`;
    return h?`<div id="tool-config-area">${h}</div>`:'<div id="tool-config-area"></div>';
  };

  const wireToolPicker = (cfg) => {
    $$('.tool-pick-cb').forEach(cb=>cb.addEventListener('change',()=>{
      cb.closest('.tool-pick-item').classList.toggle('selected',cb.checked);
      const tools=[...$$('.tool-pick-cb:checked')].map(c=>c.value);
      const area=$('#tool-config-area'); if(area) area.outerHTML=buildToolConfig(tools,cfg||{});
      const cla=$('#checklist-area'); if(cla) cla.classList.toggle('hidden',!tools.includes('checklist'));
      wireMedTimes();
    }));
    wireMedTimes();
  };

  const wireMedTimes = () => {
    const addBtn=$('#btn-add-med-time'); if(!addBtn)return;
    addBtn.onclick = e => { e.preventDefault(); const list=$('#med-times-list'); const row=document.createElement('div'); row.className='med-time-row'; row.innerHTML=`<input type="time" class="app-input small med-time-input" value="12:00"><button class="checklist-remove-btn med-time-remove">✕</button>`; list.appendChild(row); row.querySelector('.med-time-remove').onclick=()=>row.remove(); };
    $$('.med-time-remove').forEach(b=>b.addEventListener('click',()=>b.closest('.med-time-row').remove()));
  };

  const getToolCfgFromForm = () => {
    const c={};
    const nl=$('#tc-number-label');if(nl)c.numberLabel=nl.value.trim();
    const nu=$('#tc-number-unit');if(nu)c.numberUnit=nu.value.trim();
    const tv=$('#tc-target-value');if(tv)c.targetValue=parseFloat(tv.value)||0;
    const tu=$('#tc-target-unit');if(tu)c.targetUnit=tu.value.trim();
    const cl=$('#tc-counter-label');if(cl)c.counterLabel=cl.value.trim();
    const cg=$('#tc-counter-goal');if(cg)c.counterGoal=parseInt(cg.value)||0;
    const tl=$('#tc-timer-label');if(tl)c.timerLabel=tl.value.trim();
    const mn=$('#tc-med-name');if(mn)c.medName=mn.value.trim();
    const md=$('#tc-med-dosage');if(md)c.medDosage=md.value.trim();
    const mt=[...$$('.med-time-input')].map(i=>i.value).filter(Boolean);
    if(mt.length) c.medTimes=mt;
    return c;
  };

  // ============================================================
  // TAG PICKER (for goal modal)
  // ============================================================
  const buildTagPicker = (selectedIds) => {
    const tags = Store.getTags();
    const sel = selectedIds || [];
    return `<div class="modal-section-label">Tags:</div><div class="tag-picker" id="tag-picker">
      ${tags.map(t => `<label class="tag-pick-item" style="--tag-color:${t.color}"><input type="checkbox" class="tag-pick-cb" value="${t.id}" ${sel.includes(t.id)?'checked':''}><span class="tag-pick-dot" style="background:${t.color}"></span><span>${t.emoji} ${t.name}</span></label>`).join('')}
    </div>`;
  };

  const getTagsFromPicker = () => [...$$('.tag-pick-cb:checked')].map(c => c.value);

  // ============================================================
  // CHECKLIST BUILDER
  // ============================================================
  const buildCLEditor = items => {
    const l=items||[];
    return `<div class="modal-section-label">Checklist Items:</div><div id="checklist-editor">
      ${l.map((item,i)=>`<div class="checklist-edit-row"><input type="text" class="app-input small checklist-item-input" value="${item.name}" maxlength="50" placeholder="Item..."><button class="checklist-remove-btn">✕</button></div>`).join('')}
    </div><button class="app-btn ghost small" id="btn-add-cl-item" style="margin-top:8px">+ Add item</button>`;
  };
  const wireCLEditor = () => {
    const ab=$('#btn-add-cl-item');if(!ab)return;
    ab.addEventListener('click',e=>{e.preventDefault();const ed=$('#checklist-editor');const row=document.createElement('div');row.className='checklist-edit-row';row.innerHTML=`<input type="text" class="app-input small checklist-item-input" maxlength="50" placeholder="Item..."><button class="checklist-remove-btn">✕</button>`;ed.appendChild(row);row.querySelector('.checklist-remove-btn').addEventListener('click',()=>row.remove());row.querySelector('.checklist-item-input').focus();});
    $$('.checklist-remove-btn').forEach(b=>b.addEventListener('click',()=>b.closest('.checklist-edit-row').remove()));
  };
  const getCLFromEditor = () => { const items=[];$$('.checklist-item-input').forEach((inp,i)=>{const n=inp.value.trim();if(n)items.push({id:'cl_'+i+'_'+Date.now(),name:n});}); return items; };

  // ============================================================
  // TOOL RENDERERS (goal detail page)
  // ============================================================
  const renderToolNumber = (g, p) => {
    const cfg=g.toolConfig||{}, tv=Store.getToolData(g.id)?.number, hist=Store.getToolHistory(g.id,'number',30), lbl=cfg.numberLabel||'Value', unit=cfg.numberUnit||'';
    const s=document.createElement('div');s.className='tool-section';
    s.innerHTML=`<div class="tool-section-title">🔢 ${lbl}</div><div class="input-row"><input type="number" class="app-input" id="tool-num-in" placeholder="${lbl}" step="any" value="${tv??''}"><span class="tool-unit">${unit}</span><button class="app-btn primary small" id="tool-num-save">Save</button></div><div class="tool-chart" id="tool-num-chart"></div>`;
    p.appendChild(s);
    s.querySelector('#tool-num-save').addEventListener('click',()=>{const v=parseFloat(s.querySelector('#tool-num-in').value);if(!isNaN(v)){Store.setToolValue(g.id,'number',v);toast(`${lbl}: ${v} ${unit}`);renderGoalDetail(g.id);}});
    if(hist.length>=2) Chart.render('tool-num-chart',hist.map(h=>({date:h.date,weight:h.value})));
  };

  const renderToolCounter = (g, p) => {
    const cfg=g.toolConfig||{}, tv=Store.getToolData(g.id)?.counter||0, lbl=cfg.counterLabel||'Count', dg=cfg.counterGoal||0, hist=Store.getToolHistory(g.id,'counter',14);
    const s=document.createElement('div');s.className='tool-section';
    s.innerHTML=`<div class="tool-section-title">🔄 ${lbl}</div><div class="counter-display"><button class="counter-btn minus" id="c-minus">−</button><div class="counter-value" id="c-val">${tv}</div><button class="counter-btn plus" id="c-plus">+</button></div>
      ${dg?`<div class="counter-goal-bar"><div class="counter-goal-fill" style="width:${Math.min(100,(tv/dg)*100)}%"></div></div><div class="counter-goal-label">${tv} / ${dg}</div>`:''}
      ${hist.length?`<div class="tool-mini-history">${hist.map(h=>`<div class="mini-bar"><div class="mini-bar-fill" style="height:${dg?Math.min(100,(h.value/dg)*100):(h.value?100:0)}%"></div><div class="mini-bar-label">${fmtDate(h.date).split(' ')[1]}</div></div>`).join('')}</div>`:''}`;
    p.appendChild(s);
    const upd=d=>{Store.setToolValue(g.id,'counter',Math.max(0,tv+d));renderGoalDetail(g.id);};
    s.querySelector('#c-minus').addEventListener('click',()=>upd(-1));
    s.querySelector('#c-plus').addEventListener('click',()=>upd(1));
  };

  let _timerInt=null, _timerGid=null, _timerSec=0, _timerOn=false;
  const renderToolTimer = (g, p) => {
    const cfg=g.toolConfig||{}, saved=Store.getToolData(g.id)?.timer||0, lbl=cfg.timerLabel||'Timer';
    const isThis=_timerGid===g.id, disp=isThis?_timerSec:saved;
    const fmt=s=>{const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return h>0?`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${m}:${String(sec).padStart(2,'0')}`;};
    const s=document.createElement('div');s.className='tool-section';
    s.innerHTML=`<div class="tool-section-title">⏱️ ${lbl}</div><div class="timer-display"><div class="timer-time" id="t-disp">${fmt(disp)}</div><div class="timer-controls"><button class="app-btn ${_timerOn&&isThis?'ghost':'primary'} small" id="t-toggle">${_timerOn&&isThis?'⏸ Pause':'▶ Start'}</button><button class="app-btn ghost small" id="t-save">💾</button><button class="app-btn ghost small" id="t-reset">🔄</button></div></div><div class="timer-saved">Saved: ${fmt(saved)}</div>`;
    p.appendChild(s);
    s.querySelector('#t-toggle').addEventListener('click',()=>{if(_timerOn&&isThis){clearInterval(_timerInt);_timerOn=false;}else{if(!isThis){_timerGid=g.id;_timerSec=saved;}_timerOn=true;_timerInt=setInterval(()=>{_timerSec++;const d=s.querySelector('#t-disp');if(d)d.textContent=fmt(_timerSec);},1000);}renderGoalDetail(g.id);});
    s.querySelector('#t-save').addEventListener('click',()=>{Store.setToolValue(g.id,'timer',isThis?_timerSec:saved);toast(`Saved: ${fmt(isThis?_timerSec:saved)}`);});
    s.querySelector('#t-reset').addEventListener('click',()=>{if(_timerOn&&isThis){clearInterval(_timerInt);_timerOn=false;}_timerSec=0;_timerGid=null;renderGoalDetail(g.id);});
  };

  const renderToolRating = (g, p) => {
    const tv=Store.getToolData(g.id)?.rating||0, hist=Store.getToolHistory(g.id,'rating',14);
    const s=document.createElement('div');s.className='tool-section';
    s.innerHTML=`<div class="tool-section-title">⭐ Rating</div><div class="rating-stars">${[1,2,3,4,5].map(n=>`<button class="star-btn ${n<=tv?'active':''}" data-val="${n}">${n<=tv?'★':'☆'}</button>`).join('')}</div>
      ${hist.length?`<div class="tool-mini-history">${hist.map(h=>`<div class="mini-bar"><div class="mini-bar-fill rating-fill" style="height:${(h.value/5)*100}%"></div><div class="mini-bar-label">${fmtDate(h.date).split(' ')[1]}</div></div>`).join('')}</div>`:''}`;
    p.appendChild(s);
    s.querySelectorAll('.star-btn').forEach(b=>b.addEventListener('click',()=>{Store.setToolValue(g.id,'rating',+b.dataset.val);toast(`${b.dataset.val}/5 ⭐`);renderGoalDetail(g.id);}));
  };

  const renderToolPhoto = (g, p) => {
    const tp=Store.getToolData(g.id)?.photo, hist=Store.getToolHistory(g.id,'photo',7);
    const s=document.createElement('div');s.className='tool-section';
    s.innerHTML=`<div class="tool-section-title">📸 Photo</div><div class="photo-today">${tp?`<img src="${tp}" class="photo-preview">`:'<div class="photo-placeholder">No photo today</div>'}<button class="app-btn primary small" id="photo-btn">📷 ${tp?'Retake':'Take Photo'}</button><input type="file" id="photo-fi" accept="image/*" capture="environment" style="display:none"></div>
      ${hist.filter(h=>h.value).length?`<div class="photo-timeline">${hist.filter(h=>h.value).map(h=>`<div class="photo-thumb"><img src="${h.value}"><div class="photo-thumb-date">${fmtDate(h.date)}</div></div>`).join('')}</div>`:''}`;
    p.appendChild(s);
    const fi=s.querySelector('#photo-fi');s.querySelector('#photo-btn').addEventListener('click',()=>fi.click());
    fi.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');const sc=Math.min(320/img.width,1);c.width=img.width*sc;c.height=img.height*sc;c.getContext('2d').drawImage(img,0,0,c.width,c.height);Store.setToolValue(g.id,'photo',c.toDataURL('image/jpeg',0.7));toast('Photo saved! 📸');renderGoalDetail(g.id);};img.src=ev.target.result;};r.readAsDataURL(f);});
  };

  const renderToolNotes = (g, p) => {
    const tn=Store.getToolData(g.id)?.notes||'', hist=Store.getToolHistory(g.id,'notes',7).filter(h=>h.value);
    const s=document.createElement('div');s.className='tool-section';
    s.innerHTML=`<div class="tool-section-title">📝 Notes</div><textarea class="app-input notes-textarea" id="tool-notes" rows="3" placeholder="Today's notes...">${tn}</textarea><button class="app-btn primary small" id="notes-save" style="margin-top:8px">Save</button>
      ${hist.length?`<div class="notes-history">${hist.reverse().map(h=>`<div class="notes-entry"><div class="notes-entry-date">${fmtDate(h.date)}</div><div class="notes-entry-text">${h.value}</div></div>`).join('')}</div>`:''}`;
    p.appendChild(s);
    s.querySelector('#notes-save').addEventListener('click',()=>{Store.setToolValue(g.id,'notes',s.querySelector('#tool-notes').value);toast('Notes saved! 📝');});
  };

  const renderToolTarget = (g, p) => {
    const cfg=g.toolConfig||{}, tv=cfg.targetValue||100, unit=cfg.targetUnit||'';
    let prog=0;if(g.tools.includes('number'))prog=Store.getToolTotal(g.id,'number');else if(g.tools.includes('counter'))prog=Store.getToolTotal(g.id,'counter');else prog=Object.values(g.log).filter(Boolean).length;
    const pct=Math.min(100,Math.round((prog/tv)*100));
    const s=document.createElement('div');s.className='tool-section';
    s.innerHTML=`<div class="tool-section-title">🎯 Target</div><div class="target-display"><div class="target-bar"><div class="target-fill" style="width:${pct}%"></div></div><div class="target-label">${prog.toFixed?prog.toFixed(1):prog} / ${tv} ${unit} (${pct}%)</div></div>`;
    p.appendChild(s);
  };

  const renderToolChecklist = (g, p) => {
    const ts=Store.today(), st=Store.getChecklistState(g.id,ts);
    const s=document.createElement('div');s.className='tool-section';
    s.innerHTML=`<div class="tool-section-title">📋 Checklist</div><div class="checklist-live">
      ${(g.checklist||[]).map(item=>`<div class="checklist-modal-item ${st[item.id]?'done':''}" data-item-id="${item.id}"><div class="checklist-check ${st[item.id]?'checked':''}">${st[item.id]?'✓':''}</div><span>${item.name}</span></div>`).join('')}</div>`;
    p.appendChild(s);
    s.querySelectorAll('.checklist-modal-item').forEach(el=>el.addEventListener('click',()=>{const ns=Store.toggleChecklistItem(g.id,el.dataset.itemId,ts);const d=ns[el.dataset.itemId];el.classList.toggle('done',d);el.querySelector('.checklist-check').classList.toggle('checked',d);el.querySelector('.checklist-check').textContent=d?'✓':'';}));
  };

  const renderToolMedication = (g, p) => {
    const cfg=g.toolConfig||{}, ts=Store.today();
    const medStatus=Store.getMedStatus(g.id,ts);
    const times=cfg.medTimes||['08:00'];
    const name=cfg.medName||'Medication';
    const dosage=cfg.medDosage||'';

    const s=document.createElement('div');s.className='tool-section';
    s.innerHTML=`<div class="tool-section-title">💊 ${name} ${dosage?`(${dosage})`:''}</div>
      <div class="med-doses">${times.map(t=>{
        const taken=medStatus.doses&&medStatus.doses[t];
        return `<div class="med-dose-row ${taken?'taken':''}" data-time="${t}">
          <div class="checklist-check ${taken?'checked':''}">${taken?'✓':''}</div>
          <span class="med-dose-time">${t}</span>
          <span class="med-dose-status">${taken?'Taken ✅':'Not taken'}</span>
        </div>`;
      }).join('')}</div>
      <div class="med-summary">${Object.values(medStatus.doses||{}).filter(Boolean).length} of ${times.length} doses taken today</div>`;
    p.appendChild(s);

    s.querySelectorAll('.med-dose-row').forEach(row=>row.addEventListener('click',()=>{
      Store.toggleMedDose(g.id,row.dataset.time,ts);
      renderGoalDetail(g.id);
    }));
  };

  // ============================================================
  // GOAL DETAIL PAGE
  // ============================================================
  const renderGoalDetail = gid => {
    const g=Store.getGoals().find(x=>x.id===gid);if(!g)return;
    const ts=Store.today(), streak=Store.calcStreak(g.log,g.frequency), longest=Store.calcLongestStreak(g.log), rate=Store.completionRate(g.log), done=!!g.log[ts];
    const tags=Store.getTags(), goalTags=(g.tags||[]).map(tid=>tags.find(t=>t.id===tid)).filter(Boolean);

    container().innerHTML=`
      <div class="detail-header fade-in"><button class="back-btn" id="back-btn">← Goals</button><button class="app-btn ghost small" id="edit-btn">✏️ Edit</button></div>
      <div class="card fade-in">
        ${goalTags.length?`<div class="tag-row">${goalTags.map(t=>`<span class="tag-chip" style="background:${t.color}20;color:${t.color};border-color:${t.color}40">${t.emoji} ${t.name}</span>`).join('')}</div>`:''}
        <div class="detail-title-row"><span class="goal-icon-wrap">${icon(g.icon,g.emoji,36,g.customIcon)}</span><div><div class="detail-name">${g.name}</div><div class="freq-tag">${Store.frequencyLabel(g.frequency)}</div></div><div class="detail-check-wrap"><div class="goal-check large ${done?'checked':''}" id="detail-check">${done?'✓':''}</div></div></div>
        <div class="stats-grid cols-3" style="margin-top:16px"><div class="stat-block"><div class="stat-value small">🔥 ${streak}</div><div class="stat-label">Streak</div></div><div class="stat-block"><div class="stat-value small">⚡ ${longest}</div><div class="stat-label">Best</div></div>${circleProgress(rate,56,'30d')}</div>
        <div class="week-dots" id="detail-wd"></div>
      </div><div id="tool-sections"></div>`;

    const we=$('#detail-wd');for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=d.toISOString().split('T')[0];we.innerHTML+=`<div class="week-dot ${g.log[k]?'done':''} ${!Store.isDue(g.frequency,k)?'not-due':''}">${g.log[k]?'✓':d.toLocaleDateString('en-US',{weekday:'narrow'})}</div>`;}
    $('#detail-check').addEventListener('click',()=>{Store.toggleGoal(g.id);Milestones.checkAll();renderGoalDetail(gid);});
    $('#back-btn').addEventListener('click',()=>navigate('goals'));
    $('#edit-btn').addEventListener('click',()=>showEditGoalModal(g));

    const tp=$('#tool-sections'), tools=g.tools||['check'];
    if(tools.includes('medication')) renderToolMedication(g,tp);
    if(tools.includes('checklist')&&g.checklist?.length) renderToolChecklist(g,tp);
    if(tools.includes('counter')) renderToolCounter(g,tp);
    if(tools.includes('number')) renderToolNumber(g,tp);
    if(tools.includes('timer')) renderToolTimer(g,tp);
    if(tools.includes('rating')) renderToolRating(g,tp);
    if(tools.includes('target')) renderToolTarget(g,tp);
    if(tools.includes('photo')) renderToolPhoto(g,tp);
    if(tools.includes('notes')) renderToolNotes(g,tp);
  };

  // ============================================================
  // DASHBOARD
  // ============================================================
  const renderDashboard = () => {
    const weights=Store.getWeights(), goals=Store.getActiveGoals(), ts=Store.today();
    const todayDone=goals.filter(g=>g.log[ts]).length, todayPct=goals.length?Math.round((todayDone/goals.length)*100):0;
    const cw=weights.length?weights[weights.length-1].weight:'—';
    const os=goals.length?Math.min(...goals.map(g=>Store.calcStreak(g.log,g.frequency))):0;
    const sleepToday=Store.getSleepByDate(ts);

    const alerts=Reminders.getPendingAlerts();
    const aHtml=alerts.length?alerts.map(a=>`<div class="alert-banner fade-in" data-alert-id="${a.id}"><span class="alert-icon">${a.icon}</span><div class="alert-content"><div class="alert-title">${a.title}</div><div class="alert-body">${a.body}</div></div><button class="alert-dismiss" data-dismiss="${a.id}">✕</button></div>`).join(''):'';

    container().innerHTML=`${aHtml}
      <div class="card fade-in"><div class="card-title">Today's Progress</div>
        <div class="progress-row">${circleProgress(todayPct,80,'Goals')}<div class="stat-block"><div class="stat-value">${cw}</div><div class="stat-label">${Store.getLabel('weightUnit','lbs')}</div></div><div class="stat-block"><div class="stat-value">${os}</div><div class="stat-label">Streak</div></div>
        ${sleepToday?`<div class="stat-block"><div class="stat-value">${sleepToday.hours.toFixed(1)}</div><div class="stat-label">hrs sleep</div></div>`:''}</div></div>
      <div class="card fade-in" style="animation-delay:0.05s"><div class="card-title">Daily Check-in</div><div id="dash-goals"></div></div>
      <div class="card fade-in" style="animation-delay:0.1s"><div class="card-title">Log Weight</div><div class="input-row"><input type="number" id="dash-w-in" class="app-input" placeholder="e.g. 185.5" step="0.1"><button class="app-btn primary" id="dash-w-btn">Log</button></div></div>
      <div class="quote-boost fade-in" style="animation-delay:0.15s"><button class="quote-boost-btn" id="q-btn">✨ Need a boost?</button><div class="quote-boost-reveal hidden" id="q-reveal"><div class="quote-text" id="q-text">"${Quotes.getRandom()}"</div><div class="quote-boost-hint">Tap for another</div></div></div>`;

    const gc=$('#dash-goals');
    goals.forEach(g=>{const done=!!g.log[ts], streak=Store.calcStreak(g.log,g.frequency), tools=g.tools||['check'];
      const counterVal=tools.includes('counter')?(Store.getToolData(g.id)?.counter||0):null;
      const ratingVal=tools.includes('rating')?(Store.getToolData(g.id)?.rating||0):null;
      const isMed=tools.includes('medication');
      let extra=''; if(counterVal!==null)extra+=`<span class="goal-mini-info">🔄${counterVal}</span>`;if(ratingVal)extra+=`<span class="goal-mini-info">${'★'.repeat(ratingVal)}</span>`;if(isMed)extra+=`<span class="goal-mini-info">💊</span>`;
      const row=document.createElement('div');row.className=`goal-row ${done?'done':''}`;
      row.innerHTML=`<div class="goal-check ${done?'checked':''}" id="chk-${g.id}">${done?'✓':''}</div><span class="goal-icon-wrap">${icon(g.icon,g.emoji,22,g.customIcon)}</span><span class="goal-name">${g.name}</span>${extra}<span class="goal-streak">🔥 ${streak}</span>`;
      row.querySelector(`#chk-${g.id}`).addEventListener('click',e=>{e.stopPropagation();Store.toggleGoal(g.id);Milestones.checkAll().forEach(b=>toast(`🏆 ${b.label}!`));renderDashboard();});
      row.addEventListener('click',()=>renderGoalDetail(g.id));
      gc.appendChild(row);
    });

    $('#dash-w-btn').addEventListener('click',()=>{if(Store.addWeight($('#dash-w-in').value)){toast('Weight logged! 💪');Milestones.checkAll().forEach(b=>toast(`🏆 ${b.label}!`));renderDashboard();}else toast('Enter valid weight');});
    const qb=$('#q-btn'),qr=$('#q-reveal');qb.addEventListener('click',()=>{qb.classList.add('hidden');qr.classList.remove('hidden');});qr.addEventListener('click',()=>{$('#q-text').textContent=`"${Quotes.getRandom()}"`;});
    $$('.alert-dismiss').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();Reminders.dismissAlert(b.dataset.dismiss);b.closest('.alert-banner').remove();}));
  };

  // ============================================================
  // WEIGHT PAGE
  // ============================================================
  const renderWeight = () => {
    const w=Store.getWeights(), st=w.length?w[0].weight:0, cu=w.length?w[w.length-1].weight:0, lo=Math.max(0,st-cu).toFixed(1);
    container().innerHTML=`<div class="card fade-in"><div class="card-title">Weight Trend</div><div id="wc" class="chart-container"></div></div>
      <div class="card fade-in" style="animation-delay:0.05s"><div class="stats-grid cols-3"><div class="stat-block"><div class="stat-value">${st||'—'}</div><div class="stat-label">Start</div></div><div class="stat-block"><div class="stat-value">${cu||'—'}</div><div class="stat-label">Current</div></div><div class="stat-block"><div class="stat-value">${lo}</div><div class="stat-label">Lost</div></div></div></div>
      <div class="card fade-in" style="animation-delay:0.1s"><div class="card-title">Log Weight</div><div class="input-row"><input type="number" id="w-in" class="app-input" placeholder="e.g. 185.5" step="0.1"><button class="app-btn primary" id="w-btn">Log</button></div></div>
      <div class="card fade-in" style="animation-delay:0.15s"><div class="card-title">History</div><div id="w-hist" class="history-list"></div></div>`;
    Chart.render('wc',w);
    const h=$('#w-hist');[...w].reverse().slice(0,30).forEach(e=>{h.innerHTML+=`<div class="history-row"><span class="history-date">${fmtDate(e.date)}</span><span class="history-value">${e.weight} ${Store.getLabel('weightUnit','lbs')}</span></div>`;});
    $('#w-btn').addEventListener('click',()=>{if(Store.addWeight($('#w-in').value)){toast('Logged! 💪');Milestones.checkAll();renderWeight();}else toast('Enter valid weight');});
  };

  // ============================================================
  // SLEEP PAGE
  // ============================================================
  const renderSleep = () => {
    const ts=Store.today(), entry=Store.getSleepByDate(ts), stats=Store.getSleepStats(30);
    const logs=Store.getSleepLogs().slice(-14).reverse();

    container().innerHTML=`
      <div class="card fade-in"><div class="card-title">😴 Log Sleep</div>
        <div class="sleep-input-grid">
          <div class="sleep-field"><label class="settings-label">Bedtime</label><input type="time" id="sl-bed" class="app-input" value="${entry?.bedtime||'22:30'}"></div>
          <div class="sleep-field"><label class="settings-label">Wake Time</label><input type="time" id="sl-wake" class="app-input" value="${entry?.wakeTime||'06:30'}"></div>
        </div>
        <div class="sleep-calc" id="sl-hours">${entry?`${entry.hours.toFixed(1)} hours`:'—'}</div>
        <div class="sleep-quality-row"><span class="settings-label">Quality:</span><div class="rating-stars" id="sl-stars">${[1,2,3,4,5].map(n=>`<button class="star-btn ${n<=(entry?.quality||0)?'active':''}" data-val="${n}">${n<=(entry?.quality||0)?'★':'☆'}</button>`).join('')}</div></div>
        <textarea class="app-input notes-textarea" id="sl-notes" rows="2" placeholder="Sleep notes (optional)...">${entry?.notes||''}</textarea>
        <button class="app-btn primary full-width" id="sl-save" style="margin-top:12px">💤 Save Sleep Log</button>
      </div>
      <div class="card fade-in" style="animation-delay:0.05s"><div class="card-title">30-Day Stats</div>
        <div class="stats-grid cols-4"><div class="stat-block"><div class="stat-value">${stats.avg||'—'}</div><div class="stat-label">Avg hrs</div></div><div class="stat-block"><div class="stat-value">${stats.best||'—'}</div><div class="stat-label">Best</div></div><div class="stat-block"><div class="stat-value">${stats.worst||'—'}</div><div class="stat-label">Worst</div></div><div class="stat-block"><div class="stat-value">${stats.avgQuality||'—'}</div><div class="stat-label">Avg ⭐</div></div></div></div>
      <div class="card fade-in" style="animation-delay:0.1s"><div class="card-title">Recent Logs</div><div id="sl-hist" class="history-list"></div></div>`;

    // Auto-calc hours
    const calcHrs = () => {
      const h=Store.calcSleepHours($('#sl-bed').value,$('#sl-wake').value);
      $('#sl-hours').textContent=h>0?`${h.toFixed(1)} hours`:'—';
    };
    $('#sl-bed').addEventListener('change',calcHrs);$('#sl-wake').addEventListener('change',calcHrs);

    // Quality stars
    let quality=entry?.quality||0;
    $('#sl-stars').querySelectorAll('.star-btn').forEach(b=>b.addEventListener('click',()=>{
      quality=+b.dataset.val;$('#sl-stars').querySelectorAll('.star-btn').forEach((x,i)=>{x.classList.toggle('active',i<quality);x.textContent=i<quality?'★':'☆';});
    }));

    // Save
    $('#sl-save').addEventListener('click',()=>{
      const bed=$('#sl-bed').value, wake=$('#sl-wake').value;
      const hrs=Store.calcSleepHours(bed,wake);
      Store.logSleep({bedtime:bed,wakeTime:wake,hours:hrs,quality,notes:$('#sl-notes').value});
      toast('Sleep logged! 😴');renderSleep();
    });

    // History
    const hEl=$('#sl-hist');
    logs.forEach(l=>{hEl.innerHTML+=`<div class="history-row"><span class="history-date">${fmtDate(l.date)}</span><span class="history-value">${l.hours.toFixed(1)}h ${'★'.repeat(l.quality||0)}</span></div>`;});
  };

  // ============================================================
  // GOALS PAGE (with tag filter)
  // ============================================================
  let _tagFilter = null;

  const renderGoals = () => {
    const allGoals=Store.getActiveGoals(), tags=Store.getTags();
    const goals=_tagFilter?allGoals.filter(g=>(g.tags||[]).includes(_tagFilter)):allGoals;

    container().innerHTML=`<div class="card fade-in">
      <div class="card-header-row"><div class="card-title">My Goals (${allGoals.length}/${Store.MAX_GOALS})</div><div class="stat-btn-row"><button class="app-btn ghost small" id="btn-templates">📦 Templates</button><button class="app-btn primary small" id="btn-add-goal">+ Add</button></div></div>
      <div class="tag-filter-row" id="tag-filter-row"><button class="tag-filter-btn ${!_tagFilter?'active':''}" data-tag="">All</button>
        ${tags.map(t=>`<button class="tag-filter-btn ${_tagFilter===t.id?'active':''}" data-tag="${t.id}" style="--tag-color:${t.color}">${t.emoji} ${t.name}</button>`).join('')}
      </div>
      <div id="goals-list"></div></div>`;

    // Tag filter
    $$('.tag-filter-btn').forEach(b=>b.addEventListener('click',()=>{_tagFilter=b.dataset.tag||null;renderGoals();}));

    const list=$('#goals-list');
    goals.forEach(g=>{
      const streak=Store.calcStreak(g.log,g.frequency), longest=Store.calcLongestStreak(g.log), rate=Store.completionRate(g.log);
      const rem=Reminders.getGoalReminder(g.id), prog=Store.periodProgress(g);
      const toolTags=(g.tools||['check']).filter(t=>t!=='check').map(t=>Store.TOOL_DEFS[t]?.emoji||'').join(' ');
      const goalTags=(g.tags||[]).map(tid=>tags.find(t=>t.id===tid)).filter(Boolean);

      const card=document.createElement('div');card.className='goal-card fade-in';
      card.innerHTML=`
        ${goalTags.length?`<div class="tag-row">${goalTags.map(t=>`<span class="tag-chip" style="background:${t.color}20;color:${t.color};border-color:${t.color}40">${t.emoji} ${t.name}</span>`).join('')}</div>`:''}
        <div class="goal-card-header"><div class="goal-card-left" style="cursor:pointer" data-gid="${g.id}"><span class="goal-icon-wrap">${icon(g.icon,g.emoji,28,g.customIcon)}</span><div><span class="goal-card-name">${g.name} ${toolTags}</span><span class="freq-tag">${Store.frequencyLabel(g.frequency)}${prog.target>1?` — ${prog.done}/${prog.target}`:''}</span></div></div>
          <div class="goal-card-actions"><button class="goal-edit-btn" data-id="${g.id}">✏️</button><button class="goal-remove-btn" data-id="${g.id}">×</button></div></div>
        <div class="stats-grid cols-3"><div class="stat-block"><div class="stat-value small">🔥 ${streak}</div><div class="stat-label">Streak</div></div><div class="stat-block"><div class="stat-value small">⚡ ${longest}</div><div class="stat-label">Best</div></div>${circleProgress(rate,56,'30d')}</div>
        <div class="week-dots" id="week-${g.id}"></div>
        <div class="reminder-row"><span class="reminder-icon">🔔</span><span class="reminder-label">Reminder</span><input type="time" class="reminder-time-input" data-gid="${g.id}" value="${rem.time||'21:00'}" ${!rem.enabled?'disabled':''}><label class="toggle-switch"><input type="checkbox" class="reminder-toggle" data-gid="${g.id}" ${rem.enabled?'checked':''}><span class="toggle-slider"></span></label></div>`;
      list.appendChild(card);

      const we=card.querySelector(`#week-${g.id}`);for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=d.toISOString().split('T')[0];we.innerHTML+=`<div class="week-dot ${g.log[k]?'done':''} ${!Store.isDue(g.frequency,k)?'not-due':''}">${g.log[k]?'✓':d.toLocaleDateString('en-US',{weekday:'narrow'})}</div>`;}
      card.querySelector('.goal-card-left').addEventListener('click',()=>renderGoalDetail(g.id));
      card.querySelector('.goal-remove-btn').addEventListener('click',e=>{e.stopPropagation();Store.removeGoal(g.id);toast('Removed');renderGoals();});
      card.querySelector('.goal-edit-btn').addEventListener('click',e=>{e.stopPropagation();showEditGoalModal(g);});
      const tog=card.querySelector('.reminder-toggle'), tin=card.querySelector('.reminder-time-input');
      tog.addEventListener('change',()=>{tin.disabled=!tog.checked;Reminders.setGoalReminder(g.id,tog.checked,tin.value);toast(tog.checked?`Reminder at ${tin.value}`:'Off');if(tog.checked)Reminders.requestPermission();});
      tin.addEventListener('change',()=>{if(tog.checked){Reminders.setGoalReminder(g.id,true,tin.value);toast(`Updated to ${tin.value}`);}});
    });
    $('#btn-add-goal').addEventListener('click',()=>showAddGoalModal());

    // Templates modal
    $('#btn-templates').addEventListener('click',()=>{
      openModal(`<div class="modal-title">📦 Habit Templates</div>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">Quick-add a set of pre-built goals. Duplicates are skipped.</p>
        <div class="template-list">${Templates.LIBRARY.map(t=>`
          <div class="template-card" data-tpl="${t.id}">
            <div class="template-header"><span class="template-emoji">${t.emoji}</span><div><div class="template-name">${t.name}</div><div class="template-desc">${t.desc}</div></div></div>
            <div class="template-goals">${t.goals.map(g=>`<span class="template-goal-chip">${g.emoji} ${g.name}</span>`).join('')}</div>
          </div>
        `).join('')}</div>
        <div class="modal-actions"><button class="app-btn ghost" id="tpl-close">Close</button></div>`);
      $('#tpl-close').addEventListener('click',closeModal);
      $$('.template-card').forEach(card=>card.addEventListener('click',()=>{
        const r=Templates.apply(card.dataset.tpl);
        closeModal();
        if(r.added>0){toast(`Added ${r.added} goal(s)!${r.skipped?' ('+r.skipped+' skipped)':''} 🎯`);renderGoals();}
        else toast('All goals already exist!');
      }));
    });
  };

  // ============================================================
  // ADD / EDIT GOAL MODALS
  // ============================================================
  const showAddGoalModal = () => {
    _si={type:'builtin',icon:'goal-star',emoji:'⭐',customIcon:null};
    openModal(`<div class="modal-title">Add New Goal</div>
      <input type="text" id="m-name" class="app-input" placeholder="Goal name..." maxlength="40">
      <div class="modal-section-label">Icon:</div>${buildIconPicker()}
      ${buildTagPicker([])}
      ${buildFreqPicker()}
      ${buildToolPicker(['check'])}
      ${buildToolConfig(['check'],{})}
      <div id="checklist-area" class="hidden">${buildCLEditor([])}</div>
      <div class="modal-actions"><button class="app-btn ghost" id="m-cancel">Cancel</button><button class="app-btn primary" id="m-add">Add Goal</button></div>`);
    wireIconPicker();wireFreqPicker();wireToolPicker({});wireCLEditor();
    $$('.tool-pick-cb').forEach(cb=>cb.addEventListener('change',()=>{const t=[...$$('.tool-pick-cb:checked')].map(c=>c.value);$('#checklist-area').classList.toggle('hidden',!t.includes('checklist'));}));
    $('#m-cancel').addEventListener('click',closeModal);
    $('#m-add').addEventListener('click',()=>{
      const name=$('#m-name').value;if(!name.trim()){toast('Enter a name');return;}
      const tools=[...$$('.tool-pick-cb:checked')].map(c=>c.value);
      if(Store.addGoal({name:name.trim(),icon:_si.icon,emoji:_si.emoji,customIcon:_si.customIcon,frequency:getFreqFromPicker(),tools,checklist:tools.includes('checklist')?getCLFromEditor():[],toolConfig:getToolCfgFromForm(),tags:getTagsFromPicker()})){closeModal();toast('Goal added! 🎯');renderGoals();}else toast(`Max ${Store.MAX_GOALS}!`);
    });
  };

  const showEditGoalModal = g => {
    const ci={type:g.customIcon?'upload':'builtin',icon:g.icon,emoji:g.emoji,customIcon:g.customIcon};
    openModal(`<div class="modal-title">Edit Goal</div>
      <input type="text" id="m-name" class="app-input" value="${g.name}" maxlength="40">
      <div class="modal-section-label">Icon:</div>${buildIconPicker(ci)}
      ${buildTagPicker(g.tags||[])}
      ${buildFreqPicker(g.frequency)}
      ${buildToolPicker(g.tools||['check'])}
      ${buildToolConfig(g.tools||['check'],g.toolConfig||{})}
      <div id="checklist-area" class="${(g.tools||[]).includes('checklist')?'':'hidden'}">${buildCLEditor(g.checklist)}</div>
      <div class="modal-actions"><button class="app-btn ghost" id="m-cancel">Cancel</button><button class="app-btn primary" id="m-save">Save</button></div>`);
    wireIconPicker();wireFreqPicker();wireToolPicker(g.toolConfig||{});wireCLEditor();
    $$('.tool-pick-cb').forEach(cb=>cb.addEventListener('change',()=>{$('#checklist-area').classList.toggle('hidden',![...$$('.tool-pick-cb:checked')].map(c=>c.value).includes('checklist'));}));
    $('#m-cancel').addEventListener('click',closeModal);
    $('#m-save').addEventListener('click',()=>{
      const name=$('#m-name').value;if(!name.trim()){toast('Enter a name');return;}
      const tools=[...$$('.tool-pick-cb:checked')].map(c=>c.value);
      Store.updateGoal(g.id,{name:name.trim(),icon:_si.icon,emoji:_si.emoji,customIcon:_si.customIcon,frequency:getFreqFromPicker(),tools,checklist:tools.includes('checklist')?getCLFromEditor():(g.checklist||[]),toolConfig:{...(g.toolConfig||{}),...getToolCfgFromForm()},tags:getTagsFromPicker()});
      closeModal();toast('Updated! ✅');renderGoals();
    });
  };

  // ============================================================
  // STATS, AWARDS, SETTINGS (unchanged structure)
  // ============================================================
  const renderStats = () => {
    let sv='overview';
    const build = () => {
      const goals=Store.getActiveGoals(),w=Store.getWeights();
      const st=w.length?w[0].weight:0,cu=w.length?w[w.length-1].weight:0,lo=Math.max(0,st-cu).toFixed(1);
      const tc=goals.reduce((s,g)=>s+Object.values(g.log).filter(Boolean).length,0);
      const rates=goals.map(g=>Store.completionRate(g.log));
      const avg=rates.length?Math.round(rates.reduce((a,b)=>a+b,0)/rates.length):0;

      if(sv==='reports'){Reports.render(container(),goals,w,()=>{sv='overview';build();});return;}

      if(sv==='heatmap'){
        // Build 90-day calendar heatmap
        const end=new Date(), start=new Date(); start.setDate(start.getDate()-89);
        const heatData = {};
        for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
          const k=d.toISOString().split('T')[0];
          const done=goals.filter(g=>g.log[k]).length;
          const total=goals.length;
          heatData[k] = total?Math.round((done/total)*100):0;
        }

        // Build month headers + grid
        const weeks=[];let week=[];
        const cur=new Date(start);
        // Pad first week with empty cells
        const firstDay=cur.getDay();
        for(let i=0;i<firstDay;i++) week.push(null);
        while(cur<=end){
          const k=cur.toISOString().split('T')[0];
          week.push({date:k, pct:heatData[k]||0});
          if(cur.getDay()===6){weeks.push(week);week=[];}
          cur.setDate(cur.getDate()+1);
        }
        if(week.length) weeks.push(week);

        const heatColor=(p)=>{
          if(p===0) return 'var(--bg-tertiary)';
          if(p<=25) return 'rgba(239,68,68,0.4)';
          if(p<=50) return 'rgba(251,191,36,0.5)';
          if(p<=75) return 'rgba(16,185,129,0.5)';
          return 'rgba(16,185,129,0.85)';
        };

        const dayLabels = ['S','M','T','W','T','F','S'];
        container().innerHTML=`
          <div class="card fade-in"><div class="card-header-row"><div class="card-title">📅 Calendar Heatmap</div><button class="app-btn ghost small" id="btn-back-overview">← Overview</button></div>
            <div class="heatmap-subtitle">Last 90 days • Goal completion</div>
            <div class="heatmap-container">
              <div class="heatmap-day-labels">${dayLabels.map(d=>`<div class="heatmap-day-label">${d}</div>`).join('')}</div>
              <div class="heatmap-grid" id="heatmap-grid">
                ${weeks.map(wk=>`<div class="heatmap-week">${wk.map(cell=>cell===null?'<div class="heatmap-cell empty"></div>':`<div class="heatmap-cell" style="background:${heatColor(cell.pct)}" title="${cell.date}: ${cell.pct}%" data-date="${cell.date}" data-pct="${cell.pct}"></div>`).join('')}</div>`).join('')}
              </div>
            </div>
            <div class="heatmap-legend"><span class="heatmap-legend-label">Less</span><div class="heatmap-legend-cell" style="background:var(--bg-tertiary)"></div><div class="heatmap-legend-cell" style="background:rgba(239,68,68,0.4)"></div><div class="heatmap-legend-cell" style="background:rgba(251,191,36,0.5)"></div><div class="heatmap-legend-cell" style="background:rgba(16,185,129,0.5)"></div><div class="heatmap-legend-cell" style="background:rgba(16,185,129,0.85)"></div><span class="heatmap-legend-label">More</span></div>
            <div class="heatmap-detail" id="heatmap-detail" style="display:none;margin-top:12px"></div>
          </div>`;

        $$('.heatmap-cell:not(.empty)').forEach(c=>c.addEventListener('click',()=>{
          const dt=c.dataset.date, pct=c.dataset.pct;
          const dayGoals=goals.map(g=>({name:g.name,emoji:g.emoji,done:!!g.log[dt]}));
          const detail=$('#heatmap-detail');
          detail.style.display='block';
          detail.innerHTML=`<div class="heatmap-detail-date">${fmtDate(dt)} — ${pct}%</div>${dayGoals.map(g=>`<div class="heatmap-detail-row"><span>${g.emoji} ${g.name}</span><span>${g.done?'✅':'—'}</span></div>`).join('')}`;
        }));

        $('#btn-back-overview').addEventListener('click',()=>{sv='overview';build();});
        return;
      }

      if(sv==='insights'){
        const insights=Insights.analyze(30);
        container().innerHTML=`
          <div class="card fade-in"><div class="card-header-row"><div class="card-title">🧠 Insights</div><button class="app-btn ghost small" id="btn-back-overview">← Overview</button></div>
            <div class="insights-period">Based on last 30 days</div>
          </div>
          ${insights.length?insights.map((ins,i)=>`
            <div class="insight-card fade-in ${ins.type}" style="animation-delay:${i*0.03}s">
              <div class="insight-icon">${ins.icon}</div>
              <div class="insight-body">
                <div class="insight-title">${ins.title}</div>
                <div class="insight-detail">${ins.body}</div>
              </div>
            </div>
          `).join(''):'<div class="card fade-in"><p style="color:var(--text-secondary);padding:16px;text-align:center">Keep tracking for at least 7 days to see insights!</p></div>'}`;
        $('#btn-back-overview').addEventListener('click',()=>{sv='overview';build();});
        return;
      }

      container().innerHTML=`<div class="card fade-in"><div class="card-header-row"><div class="card-title">Overview</div>
          <div class="stat-btn-row"><button class="app-btn ghost small" id="btn-insights">🧠 Insights</button><button class="app-btn ghost small" id="btn-heatmap">📅 Heatmap</button><button class="app-btn ghost small" id="btn-rpt">📊 Reports</button></div></div>
          <div class="stats-grid cols-3"><div class="stat-block"><div class="stat-value">${lo}</div><div class="stat-label">Lbs Lost</div></div><div class="stat-block">${circleProgress(avg,64,'Avg Rate')}</div><div class="stat-block"><div class="stat-value">${tc}</div><div class="stat-label">Check-ins</div></div></div></div>
        <div class="card fade-in" style="animation-delay:0.05s"><div class="card-title">Goal Leaderboard</div><div id="lb"></div></div>`;
      const lb=$('#lb');[...goals].sort((a,b)=>Store.completionRate(b.log)-Store.completionRate(a.log)).forEach((g,i)=>{const r=Store.completionRate(g.log);lb.innerHTML+=`<div class="leaderboard-row"><span class="lb-rank">#${i+1}</span><span class="goal-icon-wrap">${icon(g.icon,g.emoji,20,g.customIcon)}</span><span class="lb-name">${g.name}</span><div class="lb-bar-wrap"><div class="lb-bar" style="width:${r}%"></div></div><span class="lb-pct">${r}%</span></div>`;});
      $('#btn-rpt').addEventListener('click',()=>{sv='reports';build();});
      $('#btn-insights').addEventListener('click',()=>{sv='insights';build();});
      $('#btn-heatmap').addEventListener('click',()=>{sv='heatmap';build();});
    };build();
  };

  const renderAwards = () => {
    const w=Store.getWeights(),goals=Store.getActiveGoals();
    const ll=Math.max(0,(w.length?w[0].weight:0)-(w.length?w[w.length-1].weight:0));
    const ms=goals.length?Math.max(...goals.map(g=>Store.calcLongestStreak(g.log))):0;
    container().innerHTML=`<div class="card fade-in"><div class="card-title">🏆 Weight Milestones</div><div class="badge-grid" id="wb"></div></div>
      <div class="card fade-in" style="animation-delay:0.05s"><div class="card-title">🔥 Streak Milestones</div><div class="badge-grid" id="sb"></div></div>`;
    Milestones.WEIGHT.forEach(m=>{const e=ll>=m.lbs;$('#wb').innerHTML+=`<div class="badge ${e?'earned':'locked'}"><img src="${m.badge}" class="badge-img" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="badge-emoji" style="display:none">${m.emoji}</span><div class="badge-label">${m.label}</div><div class="badge-tier">${m.tier}</div></div>`;});
    Milestones.STREAK.forEach(m=>{const e=ms>=m.days;$('#sb').innerHTML+=`<div class="badge ${e?'earned':'locked'}"><img src="${m.badge}" class="badge-img" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="badge-emoji" style="display:none">${m.emoji}</span><div class="badge-label">${m.label}</div><div class="badge-tier">${m.days}d</div></div>`;});
  };

  const renderSettings = () => {
    const s=Store.getSettings(), rd=Reminders.getReminders(), ps=Reminders.canPush()?'Enabled ✅':('Notification' in window?'Not granted':'Not supported');
    container().innerHTML=`
      <div class="card fade-in"><div class="card-title">Theme</div><div class="theme-grid" id="tg">${Themes.AVAILABLE.map(t=>`<button class="theme-pick-btn ${s.theme===t.id?'selected':''}" data-theme="${t.id}"><span class="theme-pick-emoji">${t.emoji}</span><span class="theme-pick-name">${t.name}</span></button>`).join('')}</div></div>
      <div class="card fade-in" style="animation-delay:0.05s"><div class="card-title">Button Style</div><div class="theme-grid" id="bg">${Themes.BUTTON_STYLES.map(b=>`<button class="theme-pick-btn ${s.buttonStyle===b.id?'selected':''}" data-style="${b.id}"><span class="theme-pick-emoji">${b.emoji}</span><span class="theme-pick-name">${b.name}</span></button>`).join('')}</div></div>
      <div class="card fade-in" style="animation-delay:0.1s"><div class="card-title">🔔 Reminders</div>
        <div class="settings-row"><label class="settings-label">Push</label><span class="settings-status">${ps}</span>${!Reminders.canPush()&&'Notification' in window?'<button class="app-btn primary small" id="btn-push">Enable</button>':''}</div>
        <div class="settings-row"><label class="settings-label">Check-in</label><input type="time" class="reminder-time-input" id="r-ci-t" value="${rd.dailyCheckin.time}" ${!rd.dailyCheckin.enabled?'disabled':''}><label class="toggle-switch"><input type="checkbox" id="r-ci" ${rd.dailyCheckin.enabled?'checked':''}><span class="toggle-slider"></span></label></div>
        <div class="settings-row"><label class="settings-label">Streak</label><input type="time" class="reminder-time-input" id="r-st-t" value="${rd.streakWarning.time}" ${!rd.streakWarning.enabled?'disabled':''}><label class="toggle-switch"><input type="checkbox" id="r-st" ${rd.streakWarning.enabled?'checked':''}><span class="toggle-slider"></span></label></div>
        <div class="settings-row"><label class="settings-label">Weekly</label><input type="time" class="reminder-time-input" id="r-wk-t" value="${rd.weeklyReport.time}" ${!rd.weeklyReport.enabled?'disabled':''}><label class="toggle-switch"><input type="checkbox" id="r-wk" ${rd.weeklyReport.enabled?'checked':''}><span class="toggle-slider"></span></label></div></div>
      <div class="card fade-in" style="animation-delay:0.15s"><div class="card-title">Weight</div>
        <div class="settings-row"><label class="settings-label">Start</label><input type="number" class="app-input small" id="s-sw" value="${s.startWeight||''}" placeholder="lbs" step="0.1"></div>
        <div class="settings-row"><label class="settings-label">Goal</label><input type="number" class="app-input small" id="s-gw" value="${s.goalWeight||''}" placeholder="lbs" step="0.1"></div></div>
      <div class="card fade-in" style="animation-delay:0.2s"><button class="app-btn primary full-width" id="s-save">Save Settings</button></div>
      <div class="card fade-in" style="animation-delay:0.25s"><div class="card-title">📤 Export Data</div>
        <button class="app-btn ghost full-width" id="btn-export-json" style="margin-bottom:8px">Export as JSON</button>
        <button class="app-btn ghost full-width" id="btn-export-csv">Export as CSV (4 files)</button>
      </div>
      <div class="card fade-in" style="animation-delay:0.3s"><div class="card-title">🔄 Reset Data</div>
        <button class="app-btn ghost full-width" id="btn-reset-goals" style="margin-bottom:8px">Reset Selected Goals...</button>
        <button class="app-btn ghost full-width" id="btn-reset-all-goals" style="margin-bottom:8px">Reset All Goals (fresh start)</button>
        <button class="app-btn ghost full-width danger-btn" id="btn-reset-everything">⚠️ Reset Everything</button>
      </div>`;
    $$('#tg .theme-pick-btn').forEach(b=>b.addEventListener('click',()=>{$$('#tg .theme-pick-btn').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');Themes.apply(b.dataset.theme);}));
    $$('#bg .theme-pick-btn').forEach(b=>b.addEventListener('click',()=>{$$('#bg .theme-pick-btn').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');Themes.applyButtonStyle(b.dataset.style);}));
    $('#s-save').addEventListener('click',()=>{Store.updateSettings({startWeight:parseFloat($('#s-sw').value)||null,goalWeight:parseFloat($('#s-gw').value)||null});Reminders.updateSetting('dailyCheckin',{enabled:$('#r-ci').checked,time:$('#r-ci-t').value});Reminders.updateSetting('streakWarning',{enabled:$('#r-st').checked,time:$('#r-st-t').value});Reminders.updateSetting('weeklyReport',{enabled:$('#r-wk').checked,time:$('#r-wk-t').value});toast('Saved! ✅');});
    const pb=$('#btn-push');if(pb)pb.addEventListener('click',async()=>{const r=await Reminders.requestPermission();if(r==='granted'){toast('Enabled! 🔔');renderSettings();}else toast('Blocked');});
    $('#btn-export-json').addEventListener('click',()=>exportAllData('json'));
    $('#btn-export-csv').addEventListener('click',()=>exportAllData('csv'));
    $('#r-ci').addEventListener('change',e=>{$('#r-ci-t').disabled=!e.target.checked;});$('#r-st').addEventListener('change',e=>{$('#r-st-t').disabled=!e.target.checked;});$('#r-wk').addEventListener('change',e=>{$('#r-wk-t').disabled=!e.target.checked;});

    // Reset Selected Goals
    $('#btn-reset-goals').addEventListener('click', () => {
      const goals = Store.getActiveGoals();
      openModal(`<div class="modal-title">Reset Selected Goals</div>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">Check the goals you want to reset. This clears their logs, streaks, and tool data but keeps the goal configuration.</p>
        <div id="reset-goal-list">
          ${goals.map(g => `<label class="tool-pick-item"><input type="checkbox" class="reset-goal-cb" value="${g.id}"><span class="tool-pick-emoji">${g.emoji}</span><span class="tool-pick-label">${g.name}</span></label>`).join('')}
        </div>
        <div class="modal-actions"><button class="app-btn ghost" id="rc-cancel">Cancel</button><button class="app-btn primary" id="rc-confirm">Reset Selected</button></div>`);
      $('#rc-cancel').addEventListener('click', closeModal);
      $('#rc-confirm').addEventListener('click', () => {
        const ids = [...$$('.reset-goal-cb:checked')].map(c => c.value);
        if (!ids.length) { toast('Select at least one goal'); return; }
        Store.resetGoals(ids);
        closeModal(); toast(`${ids.length} goal(s) reset! 🔄`); renderSettings();
      });
    });

    // Reset All Goals (fresh start)
    $('#btn-reset-all-goals').addEventListener('click', () => {
      openModal(`<div class="modal-title">Fresh Start</div>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">This removes ALL goals and creates new blank ones. Your weight, sleep, and settings are kept.</p>
        <div class="settings-row"><label class="settings-label">How many new goals?</label>
          <input type="number" id="fresh-count" class="app-input small" value="3" min="1" max="15" style="width:70px"></div>
        <div class="modal-actions"><button class="app-btn ghost" id="fa-cancel">Cancel</button><button class="app-btn primary" id="fa-confirm">Reset Goals</button></div>`);
      $('#fa-cancel').addEventListener('click', closeModal);
      $('#fa-confirm').addEventListener('click', () => {
        const count = parseInt($('#fresh-count').value) || 3;
        Store.resetAllGoals(count);
        closeModal(); toast(`Fresh start with ${count} goals! 🎯`); renderSettings();
      });
    });

    // Reset Everything
    $('#btn-reset-everything').addEventListener('click', () => {
      openModal(`<div class="modal-title">⚠️ Reset Everything</div>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">This permanently deletes ALL data: goals, weight history, sleep logs, settings, milestones — everything. This cannot be undone.</p>
        <p style="font-size:13px;color:#ef4444;font-weight:600">Type "RESET" to confirm:</p>
        <input type="text" id="reset-confirm-input" class="app-input" placeholder="Type RESET..." maxlength="5">
        <div class="modal-actions"><button class="app-btn ghost" id="re-cancel">Cancel</button><button class="app-btn primary danger-btn" id="re-confirm">Delete Everything</button></div>`);
      $('#re-cancel').addEventListener('click', closeModal);
      $('#re-confirm').addEventListener('click', () => {
        if ($('#reset-confirm-input').value.trim().toUpperCase() !== 'RESET') { toast('Type RESET to confirm'); return; }
        Store.resetEverything();
        closeModal(); toast('All data cleared! Reloading...'); setTimeout(() => location.reload(), 1000);
      });
    });
  };

  // ============================================================
  // BUDGET PAGE
  // ============================================================
  let _budgetMonth = null;

  const renderBudget = () => {
    const month = _budgetMonth || Budget.getMonth();
    _budgetMonth = month;
    const summary = Budget.getMonthSummary(month);
    const cats = Budget.getCategories();
    const breakdown = Budget.getCategoryBreakdown(month);
    const txns = Budget.getTransactionsForMonth(month);
    const monthlyBudget = Budget.getMonthlyBudget();
    const months = Budget.getAvailableMonths();

    const [y, m] = month.split('-');
    const monthLabel = new Date(+y, +m - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const budgetPct = monthlyBudget > 0 ? Math.min(100, Math.round((summary.totalExpense / monthlyBudget) * 100)) : 0;
    const budgetBar = monthlyBudget > 0 ? `<div class="budget-bar-wrap"><div class="budget-bar-fill ${budgetPct > 90 ? 'danger' : budgetPct > 70 ? 'warning' : ''}" style="width:${budgetPct}%"></div></div><div class="budget-bar-label">$${summary.totalExpense.toFixed(2)} of $${monthlyBudget.toFixed(2)} (${budgetPct}%)</div>` : '';

    container().innerHTML = `
      <div class="card fade-in"><div class="card-header-row"><div class="card-title">💰 Budget</div>
        <select class="app-input small" id="budget-month-select" style="width:auto;font-size:12px">${months.map(mo => `<option value="${mo}" ${mo === month ? 'selected' : ''}>${new Date(mo + '-15').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</option>`).join('')}</select></div>
        <div class="budget-month-label">${monthLabel}</div>
        <div class="stats-grid cols-3">
          <div class="stat-block"><div class="stat-value" style="color:#10b981">$${summary.totalIncome.toFixed(0)}</div><div class="stat-label">Income</div></div>
          <div class="stat-block"><div class="stat-value" style="color:#ef4444">$${summary.totalExpense.toFixed(0)}</div><div class="stat-label">Expenses</div></div>
          <div class="stat-block"><div class="stat-value" style="color:${summary.net >= 0 ? '#10b981' : '#ef4444'}">$${summary.net.toFixed(0)}</div><div class="stat-label">Net</div></div>
        </div>
        ${budgetBar}
      </div>
      <div class="card fade-in" style="animation-delay:0.05s"><div class="card-header-row"><div class="card-title">Add Transaction</div></div>
        <div class="budget-add-row">
          <select class="app-input small" id="txn-type" style="width:auto"><option value="expense">Expense</option><option value="income">Income</option></select>
          <input type="number" class="app-input small" id="txn-amount" placeholder="$0.00" step="0.01" style="width:90px">
          <select class="app-input small" id="txn-cat">${cats.filter(c => c.type === 'expense').map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('')}</select>
        </div>
        <div class="budget-add-row" style="margin-top:8px">
          <input type="text" class="app-input small" id="txn-note" placeholder="Note (optional)" maxlength="50" style="flex:1">
          <input type="date" class="app-input small" id="txn-date" value="${Store.today()}" style="width:auto">
          <button class="app-btn primary small" id="txn-add-btn">+ Add</button>
        </div>
      </div>
      ${breakdown.length ? `<div class="card fade-in" style="animation-delay:0.1s"><div class="card-title">Spending Breakdown</div>
        <div class="budget-breakdown">${breakdown.map(c => `
          <div class="budget-cat-row">
            <span class="budget-cat-emoji">${c.emoji}</span>
            <span class="budget-cat-name">${c.name}</span>
            <div class="budget-cat-bar-wrap"><div class="budget-cat-bar" style="width:${c.percent}%;background:${c.color}"></div></div>
            <span class="budget-cat-amount">$${c.amount.toFixed(0)}</span>
            <span class="budget-cat-pct">${c.percent}%</span>
          </div>`).join('')}
        </div></div>` : ''}
      <div class="card fade-in" style="animation-delay:0.15s"><div class="card-header-row"><div class="card-title">Transactions (${txns.length})</div>
        <button class="app-btn ghost small" id="budget-settings-btn">⚙️</button></div>
        <div id="txn-list" class="history-list">${txns.length ? txns.map(t => {
          const cat = cats.find(c => c.id === t.categoryId);
          return `<div class="txn-row ${t.type}"><div class="txn-row-left"><span class="txn-emoji">${cat ? cat.emoji : '📦'}</span><div><div class="txn-note">${t.note || (cat ? cat.name : 'Transaction')}</div><div class="txn-date">${fmtDate(t.date)}</div></div></div><div class="txn-row-right"><span class="txn-amount ${t.type}">${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}</span><button class="txn-delete-btn" data-id="${t.id}">×</button></div></div>`;
        }).join('') : '<div style="text-align:center;color:var(--text-secondary);padding:16px">No transactions this month</div>'}</div>
      </div>`;

    // Month selector
    $('#budget-month-select').addEventListener('change', e => { _budgetMonth = e.target.value; renderBudget(); });

    // Type toggle updates category dropdown
    const typeSelect = $('#txn-type'), catSelect = $('#txn-cat');
    typeSelect.addEventListener('change', () => {
      const type = typeSelect.value;
      catSelect.innerHTML = cats.filter(c => c.type === type).map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('');
    });

    // Add transaction
    $('#txn-add-btn').addEventListener('click', () => {
      const amount = parseFloat($('#txn-amount').value);
      if (!amount || amount <= 0) { toast('Enter an amount'); return; }
      Budget.addTransaction({
        type: typeSelect.value,
        amount,
        categoryId: catSelect.value,
        note: $('#txn-note').value.trim(),
        date: $('#txn-date').value
      });
      toast(`${typeSelect.value === 'income' ? '+' : '-'}$${amount.toFixed(2)} added!`);
      renderBudget();
    });

    // Delete transactions
    $$('.txn-delete-btn').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      Budget.removeTransaction(b.dataset.id);
      toast('Deleted');
      renderBudget();
    }));

    // Budget settings modal
    const bsBtn = $('#budget-settings-btn');
    if (bsBtn) bsBtn.addEventListener('click', () => {
      openModal(`<div class="modal-title">💰 Budget Settings</div>
        <div class="modal-section-label">Monthly Budget Limit:</div>
        <div class="input-row"><span style="color:var(--text-secondary)">$</span><input type="number" class="app-input" id="budget-limit-input" value="${monthlyBudget || ''}" placeholder="0.00" step="0.01"></div>
        <div class="modal-actions"><button class="app-btn ghost" id="bs-cancel">Cancel</button><button class="app-btn primary" id="bs-save">Save</button></div>`);
      $('#bs-cancel').addEventListener('click', closeModal);
      $('#bs-save').addEventListener('click', () => {
        Budget.setMonthlyBudget(parseFloat($('#budget-limit-input').value) || 0);
        closeModal(); toast('Budget updated! 💰'); renderBudget();
      });
    });
  };

  // ============================================================
  // DATA EXPORT
  // ============================================================
  const exportAllData = (format) => {
    const data = {
      goals: Store.getGoals(),
      weights: Store.getWeights(),
      sleep: Store.getSleepLogs(),
      tags: Store.getTags(),
      settings: Store.getSettings(),
      milestones: Store.getUnlockedMilestones(),
      budget_transactions: Budget.getTransactions(),
      budget_categories: Budget.getCategories(),
      exported_at: new Date().toISOString()
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `daily-pulse-export-${Store.today()}.json`; a.click();
      URL.revokeObjectURL(url);
      toast('JSON exported! 📁');
    } else {
      // CSV: one file per data type
      const csvGoals = 'Name,Emoji,Created,Streak,Best Streak,30d Rate,Frequency,Tags\n' +
        data.goals.filter(g => g.active).map(g => {
          const tags = (g.tags || []).map(tid => { const t = data.tags.find(t => t.id === tid); return t ? t.name : ''; }).join(';');
          return `"${g.name}",${g.emoji},${g.created},${Store.calcStreak(g.log, g.frequency)},${Store.calcLongestStreak(g.log)},${Store.completionRate(g.log)}%,"${Store.frequencyLabel(g.frequency)}","${tags}"`;
        }).join('\n');

      const csvWeights = 'Date,Weight\n' + data.weights.map(w => `${w.date},${w.weight}`).join('\n');

      const csvSleep = 'Date,Bedtime,Wake Time,Hours,Quality,Notes\n' +
        data.sleep.map(s => `${s.date},${s.bedtime},${s.wakeTime},${s.hours.toFixed(1)},${s.quality},"${(s.notes || '').replace(/"/g, '""')}"`).join('\n');

      const csvBudget = 'Date,Type,Amount,Category,Note\n' +
        data.budget_transactions.map(t => {
          const cat = data.budget_categories.find(c => c.id === t.categoryId);
          return `${t.date},${t.type},${t.amount.toFixed(2)},"${cat ? cat.name : ''}","${(t.note || '').replace(/"/g, '""')}"`;
        }).join('\n');

      // Create ZIP-like download: each as separate file
      [
        { name: 'goals.csv', content: csvGoals },
        { name: 'weights.csv', content: csvWeights },
        { name: 'sleep.csv', content: csvSleep },
        { name: 'budget.csv', content: csvBudget }
      ].forEach(f => {
        const blob = new Blob([f.content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `daily-pulse-${f.name}`; a.click();
        URL.revokeObjectURL(url);
      });
      toast('CSV files exported! 📁');
    }
  };

  // ============================================================
  // ROUTER
  // ============================================================
  const pages = { dashboard:renderDashboard, weight:renderWeight, sleep:renderSleep, budget:renderBudget, goals:renderGoals, stats:renderStats, awards:renderAwards, settings:renderSettings };
  const navigate = page => { if(pages[page]){container().innerHTML='';pages[page]();} };
  return { navigate, toast, openModal, closeModal, renderDashboard };
})();
