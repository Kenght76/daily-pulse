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
    const greeting=(()=>{const h=new Date().getHours();if(todayPct===100)return Motivation.getEncouragement({type:'all_done',todayDone,todayTotal:goals.length});if(todayDone>0)return Motivation.getEncouragement({type:'partial_day',todayDone,todayTotal:goals.length});if(h>=20)return Motivation.getEncouragement({type:'missed_day'});return Motivation.getEncouragement({type:'morning_greeting'});})();
    const challenges=Motivation.generateChallenges().slice(0,2);

    const alerts=Reminders.getPendingAlerts();
    const aHtml=alerts.length?alerts.map(a=>`<div class="alert-banner fade-in" data-alert-id="${a.id}"><span class="alert-icon">${a.icon}</span><div class="alert-content"><div class="alert-title">${a.title}</div><div class="alert-body">${a.body}</div></div><button class="alert-dismiss" data-dismiss="${a.id}">✕</button></div>`).join(''):'';

    container().innerHTML=`${aHtml}
      <div class="card fade-in dash-greeting-card">
        <div class="dash-greeting-row">${Motivation.renderAvatarHTML(44)}<div class="dash-greeting"><div class="dash-greeting-msg">${greeting}</div></div><button class="dash-avatar-btn" id="avatar-edit-btn" title="Change avatar">✏️</button></div>
      </div>
      <div class="card fade-in" style="animation-delay:0.03s"><div class="card-title">Today's Progress</div>
        <div class="progress-row">${circleProgress(todayPct,80,'Goals')}<div class="stat-block"><div class="stat-value">${cw}</div><div class="stat-label">${Store.getLabel('weightUnit','lbs')}</div></div><div class="stat-block"><div class="stat-value">${os}</div><div class="stat-label">Streak</div></div>
        ${sleepToday?`<div class="stat-block"><div class="stat-value">${sleepToday.hours.toFixed(1)}</div><div class="stat-label">hrs sleep</div></div>`:''}</div></div>
      <div class="card fade-in" style="animation-delay:0.06s"><div class="card-title">Daily Check-in</div><div id="dash-goals"></div></div>
      ${challenges.length?`<div class="card fade-in" style="animation-delay:0.09s"><div class="card-header-row"><div class="card-title">🏆 Challenges</div><button class="app-btn ghost small" id="btn-all-challenges">See All</button></div>
        ${challenges.map(ch=>{const pct=ch.target>0?Math.min(100,Math.round((ch.current/ch.target)*100)):0;return `<div class="challenge-mini"><div class="challenge-mini-header"><span>${ch.emoji} ${ch.goalEmoji}</span><span class="challenge-diff challenge-${ch.difficulty}">${ch.difficulty}</span></div><div class="challenge-mini-title">${ch.title}</div><div class="challenge-mini-desc">${ch.desc}</div><div class="budget-bar-wrap"><div class="budget-bar-fill" style="width:${pct}%"></div></div></div>`;}).join('')}</div>`:''}
      <div class="card fade-in" style="animation-delay:0.12s"><div class="card-title">Log Weight</div><div class="input-row"><input type="number" id="dash-w-in" class="app-input" placeholder="e.g. 185.5" step="0.1"><button class="app-btn primary" id="dash-w-btn">Log</button></div></div>
      <div class="quote-boost fade-in" style="animation-delay:0.15s"><button class="quote-boost-btn" id="q-btn">✨ Need a boost?</button><div class="quote-boost-reveal hidden" id="q-reveal"><div class="quote-text" id="q-text">"${Quotes.getRandom()}"</div><div class="quote-boost-hint">Tap for another</div></div></div>`;

    const gc=$('#dash-goals');
    goals.forEach(g=>{const done=!!g.log[ts], streak=Store.calcStreak(g.log,g.frequency), tools=g.tools||['check'];
      const counterVal=tools.includes('counter')?(Store.getToolData(g.id)?.counter||0):null;
      const ratingVal=tools.includes('rating')?(Store.getToolData(g.id)?.rating||0):null;
      const isMed=tools.includes('medication');
      let extra=''; if(counterVal!==null)extra+=`<span class="goal-mini-info">🔄${counterVal}</span>`;if(ratingVal)extra+=`<span class="goal-mini-info">${'★'.repeat(ratingVal)}</span>`;if(isMed)extra+=`<span class="goal-mini-info">💊</span>`;
      const row=document.createElement('div');row.className=`goal-row ${done?'done':''}`;
      row.innerHTML=`<div class="goal-check ${done?'checked':''}" id="chk-${g.id}">${done?'✓':''}</div><span class="goal-icon-wrap">${icon(g.icon,g.emoji,22,g.customIcon)}</span><span class="goal-name">${g.name}</span>${extra}<span class="goal-streak">🔥 ${streak}</span>`;
      row.querySelector(`#chk-${g.id}`).addEventListener('click',e=>{
        e.stopPropagation();
        const wasDone=!!g.log[ts];
        Store.toggleGoal(g.id);
        Milestones.checkAll().forEach(b=>toast(`🏆 ${b.label}!`));
        if(!wasDone){
          const newStreak=Store.calcStreak(Store.getGoals().find(x=>x.id===g.id).log,g.frequency);
          const newDone=Store.getActiveGoals().filter(x=>x.log[ts]).length;
          const msg=newDone===goals.length?Motivation.getEncouragement({type:'all_done',todayDone:newDone,todayTotal:goals.length}):Motivation.getEncouragement({type:'complete_goal',goalName:g.name,streak:newStreak});
          toast(msg,3000);
        }
        renderDashboard();
      });
      row.addEventListener('click',()=>renderGoalDetail(g.id));
      gc.appendChild(row);
    });

    $('#dash-w-btn').addEventListener('click',()=>{if(Store.addWeight($('#dash-w-in').value)){toast('Weight logged! 💪');Milestones.checkAll().forEach(b=>toast(`🏆 ${b.label}!`));renderDashboard();}else toast('Enter valid weight');});
    const qb=$('#q-btn'),qr=$('#q-reveal');qb.addEventListener('click',()=>{qb.classList.add('hidden');qr.classList.remove('hidden');});qr.addEventListener('click',()=>{$('#q-text').textContent=`"${Quotes.getRandom()}"`;});
    $$('.alert-dismiss').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();Reminders.dismissAlert(b.dataset.dismiss);b.closest('.alert-banner').remove();}));

    // Avatar editor
    $('#avatar-edit-btn').addEventListener('click',()=>{
      const cur=Motivation.getAvatar();
      openModal(`<div class="modal-title">Choose Your Avatar</div>
        <div class="modal-section-label">Pick a character:</div>
        <div class="avatar-grid">${Motivation.AVATARS.map(a=>`<button class="avatar-pick-btn ${cur.id===a.id?'selected':''}" data-id="${a.id}" data-emoji="${a.emoji}">${a.emoji}<span class="avatar-pick-label">${a.name}</span></button>`).join('')}</div>
        <div class="modal-section-label" style="margin-top:12px">Or type your own emoji:</div>
        <div class="input-row"><input type="text" class="app-input" id="av-emoji-input" placeholder="😎" maxlength="4" style="width:70px;text-align:center;font-size:22px"><button class="app-btn ghost small" id="av-emoji-use">Use</button></div>
        <div class="modal-section-label" style="margin-top:12px">Or upload a photo:</div>
        <div class="input-row"><button class="app-btn ghost small" id="av-upload-btn">📷 Upload Image</button><input type="file" id="av-file-input" accept="image/*" style="display:none"></div>
        ${cur.customImage?`<div class="avatar-current-preview"><img src="${cur.customImage}" width="48" height="48" style="border-radius:50%;margin-top:8px"></div>`:''}
        <div class="modal-actions"><button class="app-btn ghost" id="av-cancel">Cancel</button></div>`);
      $$('.avatar-pick-btn').forEach(b=>b.addEventListener('click',()=>{Motivation.setAvatar({type:'preset',id:b.dataset.id,emoji:b.dataset.emoji,customImage:null});closeModal();renderDashboard();}));
      $('#av-emoji-use').addEventListener('click',()=>{const e=$('#av-emoji-input').value.trim();if(e){Motivation.setAvatar({type:'emoji',id:'custom',emoji:e,customImage:null});closeModal();renderDashboard();}});
      $('#av-upload-btn').addEventListener('click',()=>$('#av-file-input').click());
      $('#av-file-input').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=96;c.height=96;const ctx=c.getContext('2d');const s=Math.min(img.width,img.height);const sx=(img.width-s)/2,sy=(img.height-s)/2;ctx.beginPath();ctx.arc(48,48,48,0,Math.PI*2);ctx.clip();ctx.drawImage(img,sx,sy,s,s,0,0,96,96);const url=c.toDataURL('image/jpeg',0.8);Motivation.setAvatar({type:'upload',id:'custom',emoji:'📷',customImage:url});closeModal();renderDashboard();};img.src=ev.target.result;};r.readAsDataURL(f);});
      $('#av-cancel').addEventListener('click',closeModal);
    });

    // Challenges see-all
    const cab=$('#btn-all-challenges');
    if(cab) cab.addEventListener('click',()=>navigate('challenges'));
  };

  // ============================================================
  // HOME HUB — Central hub with tiles + daily check-in
  // ============================================================
  const renderHome = () => {
    const weights=Store.getWeights(), goals=Store.getActiveGoals(), ts=Store.today();
    const todayDone=goals.filter(g=>g.log[ts]).length, todayPct=goals.length?Math.round((todayDone/goals.length)*100):0;
    const cw=weights.length?weights[weights.length-1].weight:'---';
    const os=goals.length?Math.min(...goals.map(g=>Store.calcStreak(g.log,g.frequency))):0;
    const sleepToday=Store.getSleepByDate(ts);
    const greeting=(()=>{const h=new Date().getHours();if(todayPct===100)return Motivation.getEncouragement({type:'all_done',todayDone,todayTotal:goals.length});if(todayDone>0)return Motivation.getEncouragement({type:'partial_day',todayDone,todayTotal:goals.length});if(h>=20)return Motivation.getEncouragement({type:'missed_day'});return Motivation.getEncouragement({type:'morning_greeting'});})();

    const todoCount = _tGet().filter(i=>!i.done).length;
    const groceryCount = _gGet().filter(i=>!i.checked).length;
    const dateItems = _dGet();
    const urgentDates = dateItems.filter(item => {
      const d=new Date(item.date+'T12:00:00'); const today2=new Date(); today2.setHours(0,0,0,0);
      if(item.recurring){d.setFullYear(today2.getFullYear());if(d<today2)d.setFullYear(today2.getFullYear()+1);}
      return Math.ceil((d-today2)/86400000)<=30 && Math.ceil((d-today2)/86400000)>=0;
    }).length;
    const challenges=Motivation.generateChallenges().slice(0,2);

    const alerts=Reminders.getPendingAlerts();
    const aHtml=alerts.length?alerts.map(a=>`<div class="alert-banner fade-in" data-alert-id="${a.id}"><span class="alert-icon">${a.icon}</span><div class="alert-content"><div class="alert-title">${a.title}</div><div class="alert-body">${a.body}</div></div><button class="alert-dismiss" data-dismiss="${a.id}">&#x2715;</button></div>`).join(''):'';

    container().innerHTML=`${aHtml}
      <div class="card fade-in dash-greeting-card">
        <div class="dash-greeting-row">${Motivation.renderAvatarHTML(44)}<div class="dash-greeting"><div class="dash-greeting-msg">${greeting}</div></div><button class="dash-avatar-btn" id="avatar-edit-btn" title="Change avatar">&#x270F;&#xFE0F;</button></div>
      </div>
      <div class="card fade-in" style="animation-delay:0.03s"><div class="card-title">Today's Progress</div>
        <div class="progress-row">${circleProgress(todayPct,80,'Goals')}<div class="stat-block"><div class="stat-value">${cw}</div><div class="stat-label">${Store.getLabel('weightUnit','lbs')}</div></div><div class="stat-block"><div class="stat-value">${os}</div><div class="stat-label">Streak</div></div>
        ${sleepToday?`<div class="stat-block"><div class="stat-value">${sleepToday.hours.toFixed(1)}</div><div class="stat-label">hrs sleep</div></div>`:''}</div></div>
      <div class="card fade-in" style="animation-delay:0.06s"><div class="card-title">Quick Access</div>
        <div class="hub-grid">
          <button class="hub-tile" data-page="weight"><span class="hub-tile-emoji">&#x2696;&#xFE0F;</span><span class="hub-tile-name">Weight</span></button>
          <button class="hub-tile" data-page="sleep"><span class="hub-tile-emoji">&#x1F634;</span><span class="hub-tile-name">Sleep</span></button>
          <button class="hub-tile" data-page="grocery"><span class="hub-tile-emoji">&#x1F6D2;</span><span class="hub-tile-name">Grocery</span>${groceryCount?`<span class="hub-tile-badge">${groceryCount}</span>`:''}</button>
          <button class="hub-tile" data-page="todos"><span class="hub-tile-emoji">&#x2705;</span><span class="hub-tile-name">To-Do</span>${todoCount?`<span class="hub-tile-badge">${todoCount}</span>`:''}</button>
          <button class="hub-tile" data-page="dates"><span class="hub-tile-emoji">&#x1F4C5;</span><span class="hub-tile-name">Dates</span>${urgentDates?`<span class="hub-tile-badge urgent">${urgentDates}</span>`:''}</button>
          <button class="hub-tile" data-page="challenges"><span class="hub-tile-emoji">&#x1F3C6;</span><span class="hub-tile-name">Challenges</span></button>
        </div>
      </div>
      <div class="card fade-in" style="animation-delay:0.09s"><div class="card-title">Daily Check-in</div><div id="dash-goals"></div></div>
      ${challenges.length?`<div class="card fade-in" style="animation-delay:0.12s"><div class="card-header-row"><div class="card-title">Active Challenges</div><button class="app-btn ghost small" id="btn-all-challenges">See All</button></div>
        ${challenges.map(ch=>{const pct=ch.target>0?Math.min(100,Math.round((ch.current/ch.target)*100)):0;return `<div class="challenge-mini"><div class="challenge-mini-header"><span>${ch.emoji} ${ch.goalEmoji}</span><span class="challenge-diff challenge-${ch.difficulty}">${ch.difficulty}</span></div><div class="challenge-mini-title">${ch.title}</div><div class="challenge-mini-desc">${ch.desc}</div><div class="budget-bar-wrap"><div class="budget-bar-fill" style="width:${pct}%"></div></div></div>`;}).join('')}</div>`:''}
      <div class="quote-boost fade-in" style="animation-delay:0.15s"><button class="quote-boost-btn" id="q-btn">&#x2728; Need a boost?</button><div class="quote-boost-reveal hidden" id="q-reveal"><div class="quote-text" id="q-text">"${Quotes.getRandom()}"</div><div class="quote-boost-hint">Tap for another</div></div></div>`;

    // Wire hub tiles
    $$('.hub-tile').forEach(t=>t.addEventListener('click',()=>navigate(t.dataset.page)));

    // Wire goal check-ins (same as dashboard)
    const gc=$('#dash-goals');
    goals.forEach(g=>{const done=!!g.log[ts], streak=Store.calcStreak(g.log,g.frequency), tools=g.tools||['check'];
      const counterVal=tools.includes('counter')?(Store.getToolData(g.id)?.counter||0):null;
      const ratingVal=tools.includes('rating')?(Store.getToolData(g.id)?.rating||0):null;
      const isMed=tools.includes('medication');
      let extra=''; if(counterVal!==null)extra+=`<span class="goal-mini-info">&#x1F504;${counterVal}</span>`;if(ratingVal)extra+=`<span class="goal-mini-info">${'&#x2605;'.repeat(ratingVal)}</span>`;if(isMed)extra+=`<span class="goal-mini-info">&#x1F48A;</span>`;
      const row=document.createElement('div');row.className=`goal-row ${done?'done':''}`;
      row.innerHTML=`<div class="goal-check ${done?'checked':''}" id="chk-${g.id}">${done?'&#x2713;':''}</div><span class="goal-icon-wrap">${icon(g.icon,g.emoji,22,g.customIcon)}</span><span class="goal-name">${g.name}</span>${extra}<span class="goal-streak">&#x1F525; ${streak}</span>`;
      row.querySelector(`#chk-${g.id}`).addEventListener('click',e=>{
        e.stopPropagation(); const wasDone=!!g.log[ts]; Store.toggleGoal(g.id);
        Milestones.checkAll().forEach(b=>toast(`&#x1F3C6; ${b.label}!`));
        if(!wasDone){const ns=Store.calcStreak(Store.getGoals().find(x=>x.id===g.id).log,g.frequency);const nd=Store.getActiveGoals().filter(x=>x.log[ts]).length;toast(nd===goals.length?Motivation.getEncouragement({type:'all_done',todayDone:nd,todayTotal:goals.length}):Motivation.getEncouragement({type:'complete_goal',goalName:g.name,streak:ns}),3000);}
        renderHome();
      });
      row.addEventListener('click',()=>renderGoalDetail(g.id));
      gc.appendChild(row);
    });

    const qb=$('#q-btn'),qr=$('#q-reveal');qb.addEventListener('click',()=>{qb.classList.add('hidden');qr.classList.remove('hidden');});qr.addEventListener('click',()=>{$('#q-text').textContent=`"${Quotes.getRandom()}"`;});
    $$('.alert-dismiss').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();Reminders.dismissAlert(b.dataset.dismiss);b.closest('.alert-banner').remove();}));

    // Avatar editor
    $('#avatar-edit-btn').addEventListener('click',()=>{
      openModal(`<div class="modal-title">Choose Your Avatar</div>${Motivation.buildAvatarPickerHTML()}
        <div class="modal-actions"><button class="app-btn ghost" id="av-cancel">Close</button></div>`);
      // Tab switching
      $$('.avatar-tab').forEach(t=>t.addEventListener('click',()=>{$$('.avatar-tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');$$('.avatar-tab-content').forEach(c=>c.classList.add('hidden'));$(`#avtab-${t.dataset.tab}`).classList.remove('hidden');}));
      // Image avatar picks
      $$('.avatar-img-btn').forEach(b=>b.addEventListener('click',()=>{Motivation.setAvatar({type:'image',id:'img_'+b.dataset.num,emoji:'',customImage:null,imageNum:parseInt(b.dataset.num)});closeModal();renderHome();}));
      // Emoji picks
      $$('.avatar-pick-btn').forEach(b=>b.addEventListener('click',()=>{Motivation.setAvatar({type:'preset',id:b.dataset.id,emoji:b.dataset.emoji,customImage:null,imageNum:null});closeModal();renderHome();}));
      const eBtn=$('#av-emoji-use');if(eBtn)eBtn.addEventListener('click',()=>{const e=$('#av-emoji-input').value.trim();if(e){Motivation.setAvatar({type:'emoji',id:'custom',emoji:e,customImage:null,imageNum:null});closeModal();renderHome();}});
      // Upload
      const uBtn=$('#av-upload-btn');if(uBtn)uBtn.addEventListener('click',()=>$('#av-file-input').click());
      const fi=$('#av-file-input');if(fi)fi.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=96;c.height=96;const ctx=c.getContext('2d');const s=Math.min(img.width,img.height);const sx=(img.width-s)/2,sy=(img.height-s)/2;ctx.beginPath();ctx.arc(48,48,48,0,Math.PI*2);ctx.clip();ctx.drawImage(img,sx,sy,s,s,0,0,96,96);Motivation.setAvatar({type:'upload',id:'custom',emoji:'custom',customImage:c.toDataURL('image/jpeg',0.8),imageNum:null});closeModal();renderHome();};img.src=ev.target.result;};r.readAsDataURL(f);});
      $('#av-cancel').addEventListener('click',closeModal);
    });
    const cab=$('#btn-all-challenges'); if(cab) cab.addEventListener('click',()=>navigate('challenges'));
  };

  // ============================================================
  // WEIGHT PAGE
  // ============================================================
  const renderWeight = () => {
    const w=Store.getWeights(), st=w.length?w[0].weight:0, cu=w.length?w[w.length-1].weight:0, lo=Math.max(0,st-cu).toFixed(1);
    container().innerHTML=`<div class="sub-page-header"><button class="back-btn" id="back-home">&#x2190; Home</button><span class="sub-page-title">Weight</span></div>
      <div class="card fade-in"><div class="card-title">Weight Trend</div><div id="wc" class="chart-container"></div></div>
      <div class="card fade-in" style="animation-delay:0.05s"><div class="stats-grid cols-3"><div class="stat-block"><div class="stat-value">${st||'—'}</div><div class="stat-label">Start</div></div><div class="stat-block"><div class="stat-value">${cu||'—'}</div><div class="stat-label">Current</div></div><div class="stat-block"><div class="stat-value">${lo}</div><div class="stat-label">Lost</div></div></div></div>
      <div class="card fade-in" style="animation-delay:0.1s"><div class="card-title">Log Weight</div><div class="input-row"><input type="number" id="w-in" class="app-input" placeholder="e.g. 185.5" step="0.1"><button class="app-btn primary" id="w-btn">Log</button></div></div>
      <div class="card fade-in" style="animation-delay:0.15s"><div class="card-title">History</div><div id="w-hist" class="history-list"></div></div>`;
    Chart.render('wc',w);
    const h=$('#w-hist');[...w].reverse().slice(0,30).forEach(e=>{h.innerHTML+=`<div class="history-row"><span class="history-date">${fmtDate(e.date)}</span><span class="history-value">${e.weight} ${Store.getLabel('weightUnit','lbs')}</span></div>`;});
    $('#w-btn').addEventListener('click',()=>{if(Store.addWeight($('#w-in').value)){toast('Logged! 💪');Milestones.checkAll();renderWeight();}else toast('Enter valid weight');});
    $('#back-home').addEventListener('click',()=>navigate('home'));
  };

  // ============================================================
  // SLEEP PAGE
  // ============================================================
  const renderSleep = () => {
    const ts=Store.today(), entry=Store.getSleepByDate(ts), stats=Store.getSleepStats(30);
    const logs=Store.getSleepLogs().slice(-14).reverse();

    container().innerHTML=`
      <div class="sub-page-header"><button class="back-btn" id="back-home">&#x2190; Home</button><span class="sub-page-title">Sleep</span></div>
      <div class="card fade-in"><div class="card-title">Log Sleep</div>
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
    $('#back-home').addEventListener('click',()=>navigate('home'));
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
  // BUDGET PAGE (multi-view: Overview, Savings, Bills, Goals)
  // ============================================================
  let _budgetMonth = null;
  let _budgetView = 'overview';

  const renderBudget = () => {
    const month = _budgetMonth || Budget.getMonth();
    _budgetMonth = month;
    const months = Budget.getAvailableMonths();

    // Sub-nav
    const subNav = `<div class="card fade-in"><div class="card-header-row"><div class="card-title">💰 Finance</div>
      <select class="app-input small" id="budget-month-select" style="width:auto;font-size:12px">${months.map(mo => `<option value="${mo}" ${mo === month ? 'selected' : ''}>${new Date(mo + '-15').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</option>`).join('')}</select></div>
      <div class="budget-sub-nav">
        <button class="budget-sub-btn ${_budgetView==='overview'?'active':''}" data-bv="overview">💳 Overview</button>
        <button class="budget-sub-btn ${_budgetView==='savings'?'active':''}" data-bv="savings">🏦 Savings</button>
        <button class="budget-sub-btn ${_budgetView==='bills'?'active':''}" data-bv="bills">📋 Bills</button>
        <button class="budget-sub-btn ${_budgetView==='goals'?'active':''}" data-bv="goals">🎯 Goals</button>
      </div></div>`;

    if (_budgetView === 'savings') { renderBudgetSavings(subNav, month); }
    else if (_budgetView === 'bills') { renderBudgetBills(subNav, month); }
    else if (_budgetView === 'goals') { renderBudgetGoals(subNav, month); }
    else { renderBudgetOverview(subNav, month); }

    // Wire sub-nav and month selector
    $('#budget-month-select').addEventListener('change', e => { _budgetMonth = e.target.value; renderBudget(); });
    $$('.budget-sub-btn').forEach(b => b.addEventListener('click', () => { _budgetView = b.dataset.bv; renderBudget(); }));
  };

  // ---- OVERVIEW SUB-VIEW ----
  const renderBudgetOverview = (subNav, month) => {
    const summary = Budget.getMonthSummary(month);
    const cats = Budget.getCategories();
    const breakdown = Budget.getCategoryBreakdown(month);
    const txns = Budget.getTransactionsForMonth(month);
    const monthlyBudget = Budget.getMonthlyBudget();

    const budgetPct = monthlyBudget > 0 ? Math.min(100, Math.round((summary.totalExpense / monthlyBudget) * 100)) : 0;
    const budgetBar = monthlyBudget > 0 ? `<div class="budget-bar-wrap"><div class="budget-bar-fill ${budgetPct > 90 ? 'danger' : budgetPct > 70 ? 'warning' : ''}" style="width:${budgetPct}%"></div></div><div class="budget-bar-label">$${summary.totalExpense.toFixed(2)} of $${monthlyBudget.toFixed(2)} (${budgetPct}%)</div>` : '';

    container().innerHTML = `${subNav}
      <div class="card fade-in" style="animation-delay:0.03s">
        <div class="stats-grid cols-3">
          <div class="stat-block"><div class="stat-value" style="color:#10b981">$${summary.totalIncome.toFixed(0)}</div><div class="stat-label">Income</div></div>
          <div class="stat-block"><div class="stat-value" style="color:#ef4444">$${summary.totalExpense.toFixed(0)}</div><div class="stat-label">Expenses</div></div>
          <div class="stat-block"><div class="stat-value" style="color:${summary.net >= 0 ? '#10b981' : '#ef4444'}">$${summary.net.toFixed(0)}</div><div class="stat-label">Net</div></div>
        </div>${budgetBar}
      </div>
      <div class="card fade-in" style="animation-delay:0.06s"><div class="card-header-row"><div class="card-title">Add Transaction</div><button class="app-btn ghost small" id="budget-settings-btn">⚙️</button></div>
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
      ${breakdown.length ? `<div class="card fade-in" style="animation-delay:0.09s"><div class="card-title">Spending Breakdown</div>
        <div class="budget-breakdown">${breakdown.map(c => `<div class="budget-cat-row"><span class="budget-cat-emoji">${c.emoji}</span><span class="budget-cat-name">${c.name}</span><div class="budget-cat-bar-wrap"><div class="budget-cat-bar" style="width:${c.percent}%;background:${c.color}"></div></div><span class="budget-cat-amount">$${c.amount.toFixed(0)}</span><span class="budget-cat-pct">${c.percent}%</span></div>`).join('')}</div></div>` : ''}
      <div class="card fade-in" style="animation-delay:0.12s"><div class="card-title">Transactions (${txns.length})</div>
        <div id="txn-list" class="history-list">${txns.length ? txns.map(t => {
          const cat = cats.find(c => c.id === t.categoryId);
          return `<div class="txn-row ${t.type}"><div class="txn-row-left"><span class="txn-emoji">${cat ? cat.emoji : '📦'}</span><div><div class="txn-note">${t.note || (cat ? cat.name : 'Transaction')}</div><div class="txn-date">${fmtDate(t.date)}</div></div></div><div class="txn-row-right"><span class="txn-amount ${t.type}">${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}</span><button class="txn-delete-btn" data-id="${t.id}">×</button></div></div>`;
        }).join('') : '<div style="text-align:center;color:var(--text-secondary);padding:16px">No transactions this month</div>'}</div>
      </div>`;

    const typeSelect = $('#txn-type'), catSelect = $('#txn-cat');
    typeSelect.addEventListener('change', () => {
      catSelect.innerHTML = Budget.getCategories().filter(c => c.type === typeSelect.value).map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('');
    });
    $('#txn-add-btn').addEventListener('click', () => {
      const amount = parseFloat($('#txn-amount').value);
      if (!amount || amount <= 0) { toast('Enter an amount'); return; }
      Budget.addTransaction({ type: typeSelect.value, amount, categoryId: catSelect.value, note: $('#txn-note').value.trim(), date: $('#txn-date').value });
      toast(`${typeSelect.value === 'income' ? '+' : '-'}$${amount.toFixed(2)} added!`); renderBudget();
    });
    $$('.txn-delete-btn').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); Budget.removeTransaction(b.dataset.id); toast('Deleted'); renderBudget(); }));

    const bsBtn = $('#budget-settings-btn');
    if (bsBtn) bsBtn.addEventListener('click', () => {
      const mb = Budget.getMonthlyBudget();
      openModal(`<div class="modal-title">💰 Budget Settings</div>
        <div class="modal-section-label">Monthly Budget Limit:</div>
        <div class="input-row"><span style="color:var(--text-secondary)">$</span><input type="number" class="app-input" id="budget-limit-input" value="${mb || ''}" placeholder="0.00" step="0.01"></div>
        <div class="modal-actions"><button class="app-btn ghost" id="bs-cancel">Cancel</button><button class="app-btn primary" id="bs-save">Save</button></div>`);
      $('#bs-cancel').addEventListener('click', closeModal);
      $('#bs-save').addEventListener('click', () => { Budget.setMonthlyBudget(parseFloat($('#budget-limit-input').value) || 0); closeModal(); toast('Budget updated! 💰'); renderBudget(); });
    });
  };

  // ---- SAVINGS SUB-VIEW ----
  const renderBudgetSavings = (subNav, month) => {
    const accounts = Budget.getSavingsAccounts();
    const summary = Budget.getSavingsSummary();
    const year = Store.today().slice(0, 4);

    container().innerHTML = `${subNav}
      <div class="card fade-in" style="animation-delay:0.03s">
        <div class="stats-grid cols-3">
          <div class="stat-block"><div class="stat-value" style="color:#10b981">$${summary.totalBalance.toLocaleString()}</div><div class="stat-label">Total Saved</div></div>
          <div class="stat-block"><div class="stat-value">$${summary.monthContributions.toLocaleString()}</div><div class="stat-label">This Month</div></div>
          <div class="stat-block"><div class="stat-value">$${summary.yearContributions.toLocaleString()}</div><div class="stat-label">${year} Total</div></div>
        </div>
      </div>
      ${accounts.map((a, i) => {
        const pct = a.targetAmount > 0 ? Math.min(100, Math.round((a.balance / a.targetAmount) * 100)) : 0;
        const moCtr = Budget.getMonthlyContribution(a.id, month);
        const yrCtr = Budget.getYearlyContribution(a.id, year);
        const moGoalPct = a.monthlyGoal > 0 ? Math.min(100, Math.round((moCtr / a.monthlyGoal) * 100)) : 0;
        const yrGoalPct = a.yearlyGoal > 0 ? Math.min(100, Math.round((yrCtr / a.yearlyGoal) * 100)) : 0;
        return `<div class="card fade-in savings-card" style="animation-delay:${0.06 + i * 0.03}s;border-left:4px solid ${a.color}">
          <div class="card-header-row"><div class="card-title">${a.emoji} ${a.name}</div>
            <div class="stat-btn-row"><button class="app-btn ghost small sav-contribute-btn" data-id="${a.id}">+ Add</button><button class="app-btn ghost small sav-edit-btn" data-id="${a.id}">✏️</button></div></div>
          <div class="stat-value" style="font-size:22px;margin:8px 0">$${a.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          ${a.targetAmount > 0 ? `<div class="budget-bar-wrap"><div class="budget-bar-fill" style="width:${pct}%;background:${a.color}"></div></div><div class="budget-bar-label">$${a.balance.toLocaleString()} of $${a.targetAmount.toLocaleString()} goal (${pct}%)${a.targetDate ? ' • by ' + fmtDate(a.targetDate) : ''}</div>` : ''}
          <div class="savings-goals-row">
            ${a.monthlyGoal > 0 ? `<div class="savings-mini-goal"><div class="savings-mini-label">Monthly: $${moCtr.toFixed(0)} / $${a.monthlyGoal.toFixed(0)}</div><div class="savings-mini-bar"><div class="savings-mini-fill ${moGoalPct >= 100 ? 'complete' : ''}" style="width:${moGoalPct}%;background:${a.color}"></div></div></div>` : ''}
            ${a.yearlyGoal > 0 ? `<div class="savings-mini-goal"><div class="savings-mini-label">Yearly: $${yrCtr.toFixed(0)} / $${a.yearlyGoal.toFixed(0)}</div><div class="savings-mini-bar"><div class="savings-mini-fill ${yrGoalPct >= 100 ? 'complete' : ''}" style="width:${yrGoalPct}%;background:${a.color}"></div></div></div>` : ''}
          </div>
          ${(a.contributions || []).length ? `<div class="savings-recent"><div class="savings-recent-title">Recent</div>${a.contributions.slice(0, 5).map(c => `<div class="history-row"><span class="history-date">${fmtDate(c.date)}</span><span class="history-value" style="color:#10b981">+$${c.amount.toFixed(2)}${c.note ? ' • ' + c.note : ''}</span></div>`).join('')}</div>` : ''}
        </div>`;
      }).join('')}
      <div class="card fade-in" style="animation-delay:0.2s"><button class="app-btn primary full-width" id="sav-add-acct-btn">+ New Savings Account</button></div>`;

    // Add account
    $('#sav-add-acct-btn').addEventListener('click', () => {
      openModal(`<div class="modal-title">🏦 New Savings Account</div>
        <div class="modal-section-label">Account Type:</div>
        <select class="app-input" id="sav-type">${Budget.SAVINGS_TYPES.map(t => `<option value="${t.id}">${t.emoji} ${t.name}</option>`).join('')}</select>
        <div class="modal-section-label">Custom Name (optional):</div>
        <input type="text" class="app-input" id="sav-name" placeholder="e.g. Vanguard 401k" maxlength="40">
        <div class="modal-section-label">Current Balance:</div>
        <div class="input-row"><span style="color:var(--text-secondary)">$</span><input type="number" class="app-input" id="sav-balance" placeholder="0.00" step="0.01"></div>
        <div class="modal-section-label">Target Amount (optional):</div>
        <div class="input-row"><span style="color:var(--text-secondary)">$</span><input type="number" class="app-input" id="sav-target" placeholder="e.g. 50000" step="1"></div>
        <div class="modal-section-label">Target Date (optional):</div>
        <input type="date" class="app-input" id="sav-target-date">
        <div class="modal-section-label">Monthly Contribution Goal:</div>
        <div class="input-row"><span style="color:var(--text-secondary)">$</span><input type="number" class="app-input" id="sav-monthly" placeholder="e.g. 500" step="1"></div>
        <div class="modal-section-label">Yearly Contribution Goal:</div>
        <div class="input-row"><span style="color:var(--text-secondary)">$</span><input type="number" class="app-input" id="sav-yearly" placeholder="e.g. 6000" step="1"></div>
        <div class="modal-actions"><button class="app-btn ghost" id="sav-cancel">Cancel</button><button class="app-btn primary" id="sav-create">Create</button></div>`);
      $('#sav-cancel').addEventListener('click', closeModal);
      $('#sav-create').addEventListener('click', () => {
        const type = $('#sav-type').value;
        const typeInfo = Budget.SAVINGS_TYPES.find(t => t.id === type);
        Budget.addSavingsAccount({
          type, name: $('#sav-name').value.trim() || typeInfo.name,
          balance: parseFloat($('#sav-balance').value) || 0,
          targetAmount: parseFloat($('#sav-target').value) || 0,
          targetDate: $('#sav-target-date').value || '',
          monthlyGoal: parseFloat($('#sav-monthly').value) || 0,
          yearlyGoal: parseFloat($('#sav-yearly').value) || 0
        });
        closeModal(); toast('Account created! 🏦'); renderBudget();
      });
    });

    // Contribute
    $$('.sav-contribute-btn').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const id = b.dataset.id;
      openModal(`<div class="modal-title">💰 Add Contribution</div>
        <div class="modal-section-label">Amount:</div>
        <div class="input-row"><span style="color:var(--text-secondary)">$</span><input type="number" class="app-input" id="ctr-amount" placeholder="0.00" step="0.01"></div>
        <div class="modal-section-label">Note (optional):</div>
        <input type="text" class="app-input" id="ctr-note" placeholder="e.g. Paycheck deposit" maxlength="50">
        <div class="modal-section-label">Date:</div>
        <input type="date" class="app-input" id="ctr-date" value="${Store.today()}">
        <div class="modal-actions"><button class="app-btn ghost" id="ctr-cancel">Cancel</button><button class="app-btn primary" id="ctr-save">Add</button></div>`);
      $('#ctr-cancel').addEventListener('click', closeModal);
      $('#ctr-save').addEventListener('click', () => {
        const amt = parseFloat($('#ctr-amount').value);
        if (!amt) { toast('Enter an amount'); return; }
        Budget.addContribution(id, amt, $('#ctr-note').value, $('#ctr-date').value);
        closeModal(); toast(`+$${amt.toFixed(2)} contributed! 🏦`); renderBudget();
      });
    }));

    // Edit / delete account
    $$('.sav-edit-btn').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const acct = Budget.getSavingsAccounts().find(a => a.id === b.dataset.id);
      if (!acct) return;
      openModal(`<div class="modal-title">✏️ Edit ${acct.name}</div>
        <div class="modal-section-label">Name:</div><input type="text" class="app-input" id="se-name" value="${acct.name}" maxlength="40">
        <div class="modal-section-label">Current Balance:</div><div class="input-row"><span>$</span><input type="number" class="app-input" id="se-balance" value="${acct.balance}" step="0.01"></div>
        <div class="modal-section-label">Target Amount:</div><div class="input-row"><span>$</span><input type="number" class="app-input" id="se-target" value="${acct.targetAmount || ''}" step="1"></div>
        <div class="modal-section-label">Target Date:</div><input type="date" class="app-input" id="se-date" value="${acct.targetDate || ''}">
        <div class="modal-section-label">Monthly Goal:</div><div class="input-row"><span>$</span><input type="number" class="app-input" id="se-monthly" value="${acct.monthlyGoal || ''}" step="1"></div>
        <div class="modal-section-label">Yearly Goal:</div><div class="input-row"><span>$</span><input type="number" class="app-input" id="se-yearly" value="${acct.yearlyGoal || ''}" step="1"></div>
        <div class="modal-actions"><button class="app-btn ghost danger-btn" id="se-delete">Delete</button><button class="app-btn ghost" id="se-cancel">Cancel</button><button class="app-btn primary" id="se-save">Save</button></div>`);
      $('#se-cancel').addEventListener('click', closeModal);
      $('#se-delete').addEventListener('click', () => { Budget.removeSavingsAccount(acct.id); closeModal(); toast('Deleted'); renderBudget(); });
      $('#se-save').addEventListener('click', () => {
        Budget.updateSavingsAccount(acct.id, {
          name: $('#se-name').value.trim(), balance: parseFloat($('#se-balance').value) || 0,
          targetAmount: parseFloat($('#se-target').value) || 0, targetDate: $('#se-date').value || '',
          monthlyGoal: parseFloat($('#se-monthly').value) || 0, yearlyGoal: parseFloat($('#se-yearly').value) || 0
        });
        closeModal(); toast('Updated! ✅'); renderBudget();
      });
    }));
  };

  // ---- BILLS SUB-VIEW ----
  const renderBudgetBills = (subNav, month) => {
    const billsSummary = Budget.getBillsSummary(month);
    const allBills = Budget.getBills();

    container().innerHTML = `${subNav}
      <div class="card fade-in" style="animation-delay:0.03s">
        <div class="stats-grid cols-3">
          <div class="stat-block"><div class="stat-value">${billsSummary.paidCount}/${billsSummary.totalCount}</div><div class="stat-label">Bills Paid</div></div>
          <div class="stat-block"><div class="stat-value" style="color:#10b981">$${billsSummary.paidTotal.toFixed(0)}</div><div class="stat-label">Paid</div></div>
          <div class="stat-block"><div class="stat-value" style="color:#ef4444">$${(billsSummary.total - billsSummary.paidTotal).toFixed(0)}</div><div class="stat-label">Remaining</div></div>
        </div>
        <div class="budget-bar-wrap" style="margin-top:12px"><div class="budget-bar-fill" style="width:${billsSummary.totalCount > 0 ? Math.round((billsSummary.paidCount / billsSummary.totalCount) * 100) : 0}%"></div></div>
      </div>
      ${billsSummary.upcoming.length ? `<div class="card fade-in" style="animation-delay:0.06s"><div class="card-title">⏰ Upcoming</div>
        ${billsSummary.upcoming.map(b => `<div class="bill-row unpaid" data-id="${b.id}">
          <div class="bill-check" data-id="${b.id}"></div>
          <div class="bill-info"><div class="bill-name">${b.emoji} ${b.name}</div><div class="bill-meta">Due ${b.dueDay}${['st','nd','rd'][b.dueDay-1]||'th'} • ${b.daysUntil === 0 ? 'Today!' : b.daysUntil === 1 ? 'Tomorrow' : b.daysUntil + ' days'}</div></div>
          <div class="bill-amount">$${b.amount.toFixed(2)}</div>
        </div>`).join('')}</div>` : ''}
      <div class="card fade-in" style="animation-delay:0.09s"><div class="card-title">All Bills</div>
        ${allBills.length ? allBills.map(b => {
          const paid = Budget.isBillPaid(b.id, month);
          return `<div class="bill-row ${paid ? 'paid' : ''}" data-id="${b.id}">
            <div class="bill-check ${paid ? 'checked' : ''}" data-id="${b.id}">${paid ? '✓' : ''}</div>
            <div class="bill-info"><div class="bill-name">${b.emoji} ${b.name}${b.autoPay ? ' <span class="bill-auto">Auto</span>' : ''}</div>
              <div class="bill-meta">${b.frequency} • Due ${b.dueDay}${['st','nd','rd'][b.dueDay-1]||'th'}</div></div>
            <div class="bill-amount">$${b.amount.toFixed(2)}</div>
            <button class="bill-edit-btn" data-id="${b.id}">✏️</button>
          </div>`;
        }).join('') : '<div style="text-align:center;color:var(--text-secondary);padding:16px">No bills yet</div>'}
      </div>
      <div class="card fade-in" style="animation-delay:0.12s"><button class="app-btn primary full-width" id="bill-add-btn">+ Add Bill</button></div>`;

    // Toggle paid
    $$('.bill-check').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      Budget.toggleBillPaid(b.dataset.id, month);
      renderBudget();
    }));

    // Add bill
    $('#bill-add-btn').addEventListener('click', () => {
      openModal(`<div class="modal-title">📋 Add Bill</div>
        <div class="modal-section-label">Name:</div><input type="text" class="app-input" id="bl-name" placeholder="e.g. Netflix" maxlength="40">
        <div class="modal-section-label">Amount:</div><div class="input-row"><span>$</span><input type="number" class="app-input" id="bl-amount" placeholder="0.00" step="0.01"></div>
        <div class="modal-section-label">Due Day of Month:</div><input type="number" class="app-input" id="bl-day" value="1" min="1" max="31" style="width:80px">
        <div class="modal-section-label">Frequency:</div>
        <select class="app-input" id="bl-freq"><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select>
        <div class="modal-section-label">Emoji:</div><input type="text" class="app-input small" id="bl-emoji" value="💡" maxlength="4" style="width:60px;text-align:center;font-size:18px">
        <label class="tool-pick-item" style="margin-top:8px"><input type="checkbox" id="bl-auto"><span class="tool-pick-label">Auto-pay enabled</span></label>
        <div class="modal-actions"><button class="app-btn ghost" id="bl-cancel">Cancel</button><button class="app-btn primary" id="bl-save">Add Bill</button></div>`);
      $('#bl-cancel').addEventListener('click', closeModal);
      $('#bl-save').addEventListener('click', () => {
        const name = $('#bl-name').value.trim();
        if (!name) { toast('Enter a name'); return; }
        Budget.addBill({ name, amount: parseFloat($('#bl-amount').value) || 0, dueDay: parseInt($('#bl-day').value) || 1, frequency: $('#bl-freq').value, emoji: $('#bl-emoji').value || '💡', autoPay: $('#bl-auto').checked });
        closeModal(); toast('Bill added! 📋'); renderBudget();
      });
    });

    // Edit bill
    $$('.bill-edit-btn').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const bill = Budget.getBills().find(bl => bl.id === b.dataset.id);
      if (!bill) return;
      openModal(`<div class="modal-title">✏️ Edit Bill</div>
        <div class="modal-section-label">Name:</div><input type="text" class="app-input" id="be-name" value="${bill.name}" maxlength="40">
        <div class="modal-section-label">Amount:</div><div class="input-row"><span>$</span><input type="number" class="app-input" id="be-amount" value="${bill.amount}" step="0.01"></div>
        <div class="modal-section-label">Due Day:</div><input type="number" class="app-input" id="be-day" value="${bill.dueDay}" min="1" max="31" style="width:80px">
        <div class="modal-section-label">Frequency:</div>
        <select class="app-input" id="be-freq"><option value="monthly" ${bill.frequency==='monthly'?'selected':''}>Monthly</option><option value="quarterly" ${bill.frequency==='quarterly'?'selected':''}>Quarterly</option><option value="yearly" ${bill.frequency==='yearly'?'selected':''}>Yearly</option></select>
        <div class="modal-section-label">Emoji:</div><input type="text" class="app-input small" id="be-emoji" value="${bill.emoji}" maxlength="4" style="width:60px;text-align:center;font-size:18px">
        <label class="tool-pick-item" style="margin-top:8px"><input type="checkbox" id="be-auto" ${bill.autoPay?'checked':''}><span class="tool-pick-label">Auto-pay enabled</span></label>
        <div class="modal-actions"><button class="app-btn ghost danger-btn" id="be-delete">Delete</button><button class="app-btn ghost" id="be-cancel">Cancel</button><button class="app-btn primary" id="be-save">Save</button></div>`);
      $('#be-cancel').addEventListener('click', closeModal);
      $('#be-delete').addEventListener('click', () => { Budget.removeBill(bill.id); closeModal(); toast('Deleted'); renderBudget(); });
      $('#be-save').addEventListener('click', () => {
        Budget.updateBill(bill.id, { name: $('#be-name').value.trim(), amount: parseFloat($('#be-amount').value) || 0, dueDay: parseInt($('#be-day').value) || 1, frequency: $('#be-freq').value, emoji: $('#be-emoji').value || '💡', autoPay: $('#be-auto').checked });
        closeModal(); toast('Updated! ✅'); renderBudget();
      });
    }));
  };

  // ---- SPENDING GOALS SUB-VIEW ----
  const renderBudgetGoals = (subNav, month) => {
    const goalStatus = Budget.getSpendingGoalStatus(month);
    const cats = Budget.getCategories().filter(c => c.type === 'expense');

    container().innerHTML = `${subNav}
      <div class="card fade-in" style="animation-delay:0.03s"><div class="card-header-row"><div class="card-title">🎯 Spending Goals</div><button class="app-btn primary small" id="sg-add-btn">+ Add</button></div>
        <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px">Set monthly and yearly limits per category</p>
        ${goalStatus.length ? goalStatus.map(g => `<div class="spend-goal-card">
          <div class="spend-goal-header"><span>${g.emoji} ${g.name}</span><button class="spend-goal-edit" data-cat="${g.categoryId}">✏️</button></div>
          ${g.monthlyLimit > 0 ? `<div class="spend-goal-row"><span class="spend-goal-label">Monthly</span><span class="spend-goal-vals ${g.monthPct > 100 ? 'over' : g.monthPct > 80 ? 'warn' : ''}">$${g.monthSpent.toFixed(0)} / $${g.monthlyLimit.toFixed(0)}</span></div>
            <div class="budget-bar-wrap"><div class="budget-bar-fill ${g.monthPct > 100 ? 'danger' : g.monthPct > 80 ? 'warning' : ''}" style="width:${Math.min(100, g.monthPct)}%;background:${g.color}"></div></div>` : ''}
          ${g.yearlyLimit > 0 ? `<div class="spend-goal-row" style="margin-top:8px"><span class="spend-goal-label">Yearly</span><span class="spend-goal-vals ${g.yearPct > 100 ? 'over' : g.yearPct > 80 ? 'warn' : ''}">$${g.yearSpent.toFixed(0)} / $${g.yearlyLimit.toFixed(0)}</span></div>
            <div class="budget-bar-wrap"><div class="budget-bar-fill ${g.yearPct > 100 ? 'danger' : g.yearPct > 80 ? 'warning' : ''}" style="width:${Math.min(100, g.yearPct)}%;background:${g.color}80"></div></div>` : ''}
        </div>`).join('') : '<div style="text-align:center;color:var(--text-secondary);padding:20px">No spending goals set yet. Tap + Add to create one!</div>'}
      </div>`;

    // Add spending goal
    $('#sg-add-btn').addEventListener('click', () => {
      const existing = Budget.getSpendingGoals();
      const available = cats.filter(c => !existing[c.id]);
      if (!available.length) { toast('All categories have goals!'); return; }
      openModal(`<div class="modal-title">🎯 New Spending Goal</div>
        <div class="modal-section-label">Category:</div>
        <select class="app-input" id="sg-cat">${available.map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('')}</select>
        <div class="modal-section-label">Monthly Limit:</div><div class="input-row"><span>$</span><input type="number" class="app-input" id="sg-monthly" placeholder="e.g. 200" step="1"></div>
        <div class="modal-section-label">Yearly Limit:</div><div class="input-row"><span>$</span><input type="number" class="app-input" id="sg-yearly" placeholder="e.g. 2400" step="1"></div>
        <div class="modal-actions"><button class="app-btn ghost" id="sg-cancel">Cancel</button><button class="app-btn primary" id="sg-save">Create</button></div>`);
      $('#sg-cancel').addEventListener('click', closeModal);
      $('#sg-save').addEventListener('click', () => {
        Budget.setSpendingGoal($('#sg-cat').value, parseFloat($('#sg-monthly').value) || 0, parseFloat($('#sg-yearly').value) || 0);
        closeModal(); toast('Goal set! 🎯'); renderBudget();
      });
    });

    // Edit spending goal
    $$('.spend-goal-edit').forEach(b => b.addEventListener('click', () => {
      const catId = b.dataset.cat;
      const goal = Budget.getSpendingGoals()[catId] || {};
      const cat = cats.find(c => c.id === catId) || { name: 'Unknown', emoji: '❓' };
      openModal(`<div class="modal-title">✏️ ${cat.emoji} ${cat.name}</div>
        <div class="modal-section-label">Monthly Limit:</div><div class="input-row"><span>$</span><input type="number" class="app-input" id="sge-monthly" value="${goal.monthly || ''}" step="1"></div>
        <div class="modal-section-label">Yearly Limit:</div><div class="input-row"><span>$</span><input type="number" class="app-input" id="sge-yearly" value="${goal.yearly || ''}" step="1"></div>
        <div class="modal-actions"><button class="app-btn ghost danger-btn" id="sge-delete">Remove</button><button class="app-btn ghost" id="sge-cancel">Cancel</button><button class="app-btn primary" id="sge-save">Save</button></div>`);
      $('#sge-cancel').addEventListener('click', closeModal);
      $('#sge-delete').addEventListener('click', () => { Budget.setSpendingGoal(catId, 0, 0); closeModal(); toast('Removed'); renderBudget(); });
      $('#sge-save').addEventListener('click', () => {
        Budget.setSpendingGoal(catId, parseFloat($('#sge-monthly').value) || 0, parseFloat($('#sge-yearly').value) || 0);
        closeModal(); toast('Updated! ✅'); renderBudget();
      });
    }));
  };

  // ============================================================
  // GROCERY LIST
  // ============================================================
  const KEY_GROCERY = 'dp_grocery';
  const GROCERY_AISLES = [
    { id: 'produce',  name: 'Produce',        emoji: '🥬' },
    { id: 'dairy',    name: 'Dairy & Eggs',    emoji: '🥛' },
    { id: 'meat',     name: 'Meat & Seafood',  emoji: '🥩' },
    { id: 'bakery',   name: 'Bakery & Bread',  emoji: '🍞' },
    { id: 'frozen',   name: 'Frozen',          emoji: '🧊' },
    { id: 'pantry',   name: 'Pantry & Dry',    emoji: '🥫' },
    { id: 'snacks',   name: 'Snacks & Drinks', emoji: '🥤' },
    { id: 'household',name: 'Household',       emoji: '🧹' },
    { id: 'other',    name: 'Other',           emoji: '📦' }
  ];
  const _gGet = () => { try { const r = localStorage.getItem(KEY_GROCERY); return r ? JSON.parse(r) : []; } catch { return []; } };
  const _gSet = v => { try { localStorage.setItem(KEY_GROCERY, JSON.stringify(v)); } catch {} };

  const renderGrocery = () => {
    const items = _gGet();
    const unchecked = items.filter(i => !i.checked);
    const checked = items.filter(i => i.checked);
    const grouped = {};
    unchecked.forEach(i => { if (!grouped[i.aisle]) grouped[i.aisle] = []; grouped[i.aisle].push(i); });

    container().innerHTML = `
      <div class="card fade-in"><div class="card-header-row"><div class="card-title">🛒 Grocery List</div>
        <div class="stat-btn-row"><button class="app-btn ghost small" id="groc-clear-done">Clear Done</button><button class="app-btn ghost small" id="groc-back">← More</button></div></div>
        <div class="budget-add-row" style="margin-bottom:12px">
          <input type="text" class="app-input" id="groc-input" placeholder="Add item..." maxlength="60" style="flex:1">
          <select class="app-input small" id="groc-aisle" style="width:auto">${GROCERY_AISLES.map(a => `<option value="${a.id}">${a.emoji} ${a.name}</option>`).join('')}</select>
          <button class="app-btn primary small" id="groc-add-btn">+</button>
        </div>
        <div class="grocery-count">${unchecked.length} item${unchecked.length !== 1 ? 's' : ''} remaining${checked.length ? ` • ${checked.length} done` : ''}</div>
      </div>
      ${GROCERY_AISLES.filter(a => grouped[a.id]?.length).map(a => `
        <div class="card fade-in grocery-aisle-card"><div class="grocery-aisle-title">${a.emoji} ${a.name}</div>
          ${grouped[a.id].map(item => `<div class="grocery-item" data-id="${item.id}">
            <div class="bill-check" data-id="${item.id}"></div>
            <span class="grocery-item-name">${item.name}</span>
            ${item.qty > 1 ? `<span class="grocery-qty">×${item.qty}</span>` : ''}
            <button class="txn-delete-btn grocery-del" data-id="${item.id}">×</button>
          </div>`).join('')}
        </div>`).join('')}
      ${checked.length ? `<div class="card fade-in" style="opacity:0.5"><div class="grocery-aisle-title">✅ Done</div>
        ${checked.map(item => `<div class="grocery-item done" data-id="${item.id}">
          <div class="bill-check checked" data-id="${item.id}">✓</div>
          <span class="grocery-item-name" style="text-decoration:line-through">${item.name}</span>
          <button class="txn-delete-btn grocery-del" data-id="${item.id}">×</button>
        </div>`).join('')}</div>` : ''}`;

    // Add item
    const addItem = () => {
      const name = $('#groc-input').value.trim();
      if (!name) return;
      const all = _gGet();
      all.push({ id: 'gr_' + Date.now(), name, aisle: $('#groc-aisle').value, checked: false, qty: 1 });
      _gSet(all); $('#groc-input').value = ''; renderGrocery();
    };
    $('#groc-add-btn').addEventListener('click', addItem);
    $('#groc-input').addEventListener('keypress', e => { if (e.key === 'Enter') addItem(); });

    // Toggle check
    $$('.grocery-item .bill-check').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const all = _gGet();
      const item = all.find(i => i.id === b.dataset.id);
      if (item) item.checked = !item.checked;
      _gSet(all); renderGrocery();
    }));

    // Delete
    $$('.grocery-del').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation(); _gSet(_gGet().filter(i => i.id !== b.dataset.id)); renderGrocery();
    }));

    // Clear done
    $('#groc-clear-done').addEventListener('click', () => { _gSet(_gGet().filter(i => !i.checked)); toast('Cleared!'); renderGrocery(); });
    $('#groc-back').addEventListener('click', () => navigate('more'));
  };

  // ============================================================
  // TO-DO LIST
  // ============================================================
  const KEY_TODOS = 'dp_todos';
  const _tGet = () => { try { const r = localStorage.getItem(KEY_TODOS); return r ? JSON.parse(r) : []; } catch { return []; } };
  const _tSet = v => { try { localStorage.setItem(KEY_TODOS, JSON.stringify(v)); } catch {} };

  const renderTodos = () => {
    const items = _tGet();
    const active = items.filter(i => !i.done).sort((a, b) => (a.priority || 3) - (b.priority || 3) || (a.due || 'z').localeCompare(b.due || 'z'));
    const done = items.filter(i => i.done).sort((a, b) => b.doneDate?.localeCompare(a.doneDate || '') || 0);
    const priColors = { 1: '#ef4444', 2: '#f59e0b', 3: '#6b7280' };
    const priLabels = { 1: '🔴 High', 2: '🟡 Med', 3: '⚪ Low' };

    container().innerHTML = `
      <div class="card fade-in"><div class="card-header-row"><div class="card-title">✅ To-Do List</div>
        <div class="stat-btn-row"><button class="app-btn ghost small" id="todo-clear-done">Clear Done</button><button class="app-btn ghost small" id="todo-back">← More</button></div></div>
        <div class="budget-add-row" style="margin-bottom:4px">
          <input type="text" class="app-input" id="todo-input" placeholder="Add task..." maxlength="80" style="flex:1">
          <button class="app-btn primary small" id="todo-add-btn">+</button>
        </div>
        <div class="budget-add-row" style="margin-bottom:12px">
          <select class="app-input small" id="todo-priority" style="width:auto"><option value="1">🔴 High</option><option value="2">🟡 Med</option><option value="3" selected>⚪ Low</option></select>
          <input type="date" class="app-input small" id="todo-due" style="width:auto">
        </div>
        <div class="grocery-count">${active.length} active${done.length ? ` • ${done.length} done` : ''}</div>
      </div>
      <div class="card fade-in" style="animation-delay:0.03s">${active.length ? active.map(t => {
        const overdue = t.due && t.due < Store.today();
        return `<div class="todo-item ${overdue ? 'overdue' : ''}" data-id="${t.id}">
          <div class="bill-check" data-id="${t.id}"></div>
          <div class="todo-info"><div class="todo-name">${t.name}</div>
            <div class="todo-meta"><span class="todo-pri" style="color:${priColors[t.priority]||'#6b7280'}">${priLabels[t.priority]||'⚪ Low'}</span>${t.due ? `<span class="todo-due ${overdue ? 'overdue' : ''}">${overdue ? '⚠️ ' : ''}${fmtDate(t.due)}</span>` : ''}</div></div>
          <button class="txn-delete-btn todo-del" data-id="${t.id}">×</button>
        </div>`;
      }).join('') : '<div style="text-align:center;color:var(--text-secondary);padding:20px">All clear! 🎉</div>'}</div>
      ${done.length ? `<div class="card fade-in" style="animation-delay:0.06s;opacity:0.5"><div class="grocery-aisle-title">✅ Completed (${done.length})</div>
        ${done.slice(0, 20).map(t => `<div class="todo-item done" data-id="${t.id}">
          <div class="bill-check checked" data-id="${t.id}">✓</div>
          <span class="todo-name" style="text-decoration:line-through;opacity:0.6">${t.name}</span>
          <button class="txn-delete-btn todo-del" data-id="${t.id}">×</button>
        </div>`).join('')}</div>` : ''}`;

    const addTodo = () => {
      const name = $('#todo-input').value.trim();
      if (!name) return;
      const all = _tGet();
      all.push({ id: 'td_' + Date.now(), name, priority: parseInt($('#todo-priority').value) || 3, due: $('#todo-due').value || '', done: false, created: Store.today(), doneDate: '' });
      _tSet(all); $('#todo-input').value = ''; renderTodos();
    };
    $('#todo-add-btn').addEventListener('click', addTodo);
    $('#todo-input').addEventListener('keypress', e => { if (e.key === 'Enter') addTodo(); });

    $$('.todo-item .bill-check').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const all = _tGet();
      const item = all.find(i => i.id === b.dataset.id);
      if (item) { item.done = !item.done; item.doneDate = item.done ? Store.today() : ''; }
      _tSet(all); renderTodos();
    }));

    $$('.todo-del').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); _tSet(_tGet().filter(i => i.id !== b.dataset.id)); renderTodos(); }));
    $('#todo-clear-done').addEventListener('click', () => { _tSet(_tGet().filter(i => !i.done)); toast('Cleared!'); renderTodos(); });
    $('#todo-back').addEventListener('click', () => navigate('more'));
  };

  // ============================================================
  // IMPORTANT DATES
  // ============================================================
  const KEY_DATES = 'dp_dates';
  const DATE_TYPES = [
    { id: 'birthday',   name: 'Birthday',            emoji: '🎂' },
    { id: 'anniversary',name: 'Anniversary',         emoji: '💍' },
    { id: 'dl_expiry',  name: "Driver's License",    emoji: '🪪' },
    { id: 'passport',   name: 'Passport Expiry',     emoji: '🛂' },
    { id: 'insurance',  name: 'Insurance Renewal',   emoji: '🛡️' },
    { id: 'membership', name: 'Membership Renewal',  emoji: '🏷️' },
    { id: 'vehicle',    name: 'Vehicle Registration', emoji: '🚗' },
    { id: 'medical',    name: 'Medical Appointment', emoji: '🏥' },
    { id: 'tax',        name: 'Tax Deadline',        emoji: '📋' },
    { id: 'custom',     name: 'Custom',              emoji: '📅' }
  ];
  const _dGet = () => { try { const r = localStorage.getItem(KEY_DATES); return r ? JSON.parse(r) : []; } catch { return []; } };
  const _dSet = v => { try { localStorage.setItem(KEY_DATES, JSON.stringify(v)); } catch {} };

  const renderDates = () => {
    const items = _dGet();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate days until for each item
    const withCountdown = items.map(item => {
      const d = new Date(item.date + 'T12:00:00');
      let next = new Date(d);

      if (item.recurring) {
        // For recurring (birthdays etc), find next occurrence
        next.setFullYear(today.getFullYear());
        if (next < today) next.setFullYear(today.getFullYear() + 1);
      }

      const diff = Math.ceil((next - today) / 86400000);
      return { ...item, daysUntil: diff, nextDate: next.toISOString().split('T')[0] };
    }).sort((a, b) => a.daysUntil - b.daysUntil);

    const upcoming = withCountdown.filter(i => i.daysUntil >= 0 && i.daysUntil <= 90);
    const expiring = withCountdown.filter(i => !i.recurring && i.daysUntil >= 0 && i.daysUntil <= 30);
    const past = withCountdown.filter(i => !i.recurring && i.daysUntil < 0);

    container().innerHTML = `
      <div class="card fade-in"><div class="card-header-row"><div class="card-title">📅 Important Dates</div>
        <div class="stat-btn-row"><button class="app-btn primary small" id="dates-add-btn">+ Add</button><button class="app-btn ghost small" id="dates-back">← More</button></div></div>
        <div class="grocery-count">${items.length} date${items.length !== 1 ? 's' : ''} tracked${expiring.length ? ` • ⚠️ ${expiring.length} expiring soon` : ''}</div>
      </div>
      ${upcoming.length ? `<div class="card fade-in" style="animation-delay:0.03s"><div class="card-title">⏰ Coming Up</div>
        ${upcoming.map(item => {
          const typeInfo = DATE_TYPES.find(t => t.id === item.type) || DATE_TYPES[9];
          const urgency = item.daysUntil <= 7 ? 'urgent' : item.daysUntil <= 30 ? 'soon' : '';
          return `<div class="date-item ${urgency}">
            <span class="date-item-emoji">${typeInfo.emoji}</span>
            <div class="date-item-info"><div class="date-item-name">${item.name}</div>
              <div class="date-item-meta">${fmtDate(item.nextDate)}${item.recurring ? ' • Recurring yearly' : ''}</div></div>
            <div class="date-countdown ${urgency}">${item.daysUntil === 0 ? 'Today!' : item.daysUntil === 1 ? 'Tomorrow' : item.daysUntil + 'd'}</div>
            <button class="txn-delete-btn date-del" data-id="${item.id}">×</button>
          </div>`;
        }).join('')}</div>` : ''}
      ${withCountdown.filter(i => i.daysUntil > 90 || (i.recurring && i.daysUntil > 90)).length ? `<div class="card fade-in" style="animation-delay:0.06s"><div class="card-title">📋 All Dates</div>
        ${withCountdown.filter(i => i.daysUntil > 90).map(item => {
          const typeInfo = DATE_TYPES.find(t => t.id === item.type) || DATE_TYPES[9];
          return `<div class="date-item"><span class="date-item-emoji">${typeInfo.emoji}</span><div class="date-item-info"><div class="date-item-name">${item.name}</div><div class="date-item-meta">${fmtDate(item.nextDate)}</div></div><div class="date-countdown">${item.daysUntil}d</div><button class="txn-delete-btn date-del" data-id="${item.id}">×</button></div>`;
        }).join('')}</div>` : ''}
      ${past.length ? `<div class="card fade-in" style="animation-delay:0.09s;opacity:0.5"><div class="card-title">⚠️ Expired</div>
        ${past.map(item => {
          const typeInfo = DATE_TYPES.find(t => t.id === item.type) || DATE_TYPES[9];
          return `<div class="date-item overdue"><span class="date-item-emoji">${typeInfo.emoji}</span><div class="date-item-info"><div class="date-item-name">${item.name}</div><div class="date-item-meta">${fmtDate(item.date)} • ${Math.abs(item.daysUntil)} days ago</div></div><button class="txn-delete-btn date-del" data-id="${item.id}">×</button></div>`;
        }).join('')}</div>` : ''}
      ${!items.length ? '<div class="card fade-in"><div style="text-align:center;color:var(--text-secondary);padding:20px">No dates tracked yet. Tap + Add to get started!</div></div>' : ''}`;

    // Add date
    $('#dates-add-btn').addEventListener('click', () => {
      openModal(`<div class="modal-title">📅 Add Important Date</div>
        <div class="modal-section-label">Type:</div>
        <select class="app-input" id="id-type">${DATE_TYPES.map(t => `<option value="${t.id}">${t.emoji} ${t.name}</option>`).join('')}</select>
        <div class="modal-section-label">Name / Description:</div>
        <input type="text" class="app-input" id="id-name" placeholder="e.g. Mom's Birthday, Passport" maxlength="60">
        <div class="modal-section-label">Date:</div>
        <input type="date" class="app-input" id="id-date">
        <label class="tool-pick-item" style="margin-top:10px"><input type="checkbox" id="id-recurring" checked><span class="tool-pick-label">Repeats every year (birthdays, anniversaries)</span></label>
        <div class="modal-actions"><button class="app-btn ghost" id="id-cancel">Cancel</button><button class="app-btn primary" id="id-save">Add</button></div>`);
      // Auto-toggle recurring based on type
      $('#id-type').addEventListener('change', () => {
        const t = $('#id-type').value;
        $('#id-recurring').checked = ['birthday', 'anniversary'].includes(t);
      });
      $('#id-cancel').addEventListener('click', closeModal);
      $('#id-save').addEventListener('click', () => {
        const name = $('#id-name').value.trim();
        const date = $('#id-date').value;
        if (!name || !date) { toast('Enter name and date'); return; }
        const all = _dGet();
        all.push({ id: 'dt_' + Date.now(), type: $('#id-type').value, name, date, recurring: $('#id-recurring').checked });
        _dSet(all); closeModal(); toast('Date added! 📅'); renderDates();
      });
    });

    // Delete
    $$('.date-del').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation(); _dSet(_dGet().filter(i => i.id !== b.dataset.id)); renderDates();
    }));

    $('#dates-back').addEventListener('click', () => navigate('more'));
  };

  // ============================================================
  // MORE HUB PAGE (Grocery, To-Do, Dates, Awards)
  // ============================================================
  const renderMore = () => {
    const todoCount = _tGet().filter(i => !i.done).length;
    const groceryCount = _gGet().filter(i => !i.checked).length;
    const dateItems = _dGet();
    const today = new Date(); today.setHours(0,0,0,0);
    const urgentDates = dateItems.filter(item => {
      const d = new Date(item.date + 'T12:00:00');
      if (item.recurring) { d.setFullYear(today.getFullYear()); if (d < today) d.setFullYear(today.getFullYear() + 1); }
      return Math.ceil((d - today) / 86400000) <= 30 && Math.ceil((d - today) / 86400000) >= 0;
    }).length;
    const challengeCount = Motivation.generateChallenges().length;

    container().innerHTML = `
      <div class="card fade-in"><div class="card-title">📦 More Tools</div>
        <div class="more-grid">
          <button class="more-tile" data-page="grocery"><span class="more-tile-emoji">🛒</span><span class="more-tile-name">Grocery List</span>${groceryCount ? `<span class="more-tile-badge">${groceryCount}</span>` : ''}</button>
          <button class="more-tile" data-page="todos"><span class="more-tile-emoji">✅</span><span class="more-tile-name">To-Do List</span>${todoCount ? `<span class="more-tile-badge">${todoCount}</span>` : ''}</button>
          <button class="more-tile" data-page="dates"><span class="more-tile-emoji">📅</span><span class="more-tile-name">Important Dates</span>${urgentDates ? `<span class="more-tile-badge urgent">${urgentDates}</span>` : ''}</button>
          <button class="more-tile" data-page="challenges"><span class="more-tile-emoji">🏆</span><span class="more-tile-name">Challenges</span>${challengeCount ? `<span class="more-tile-badge">${challengeCount}</span>` : ''}</button>
          <button class="more-tile" data-page="suggestions"><span class="more-tile-emoji">💡</span><span class="more-tile-name">Goal Ideas</span></button>
          <button class="more-tile" data-page="awards"><span class="more-tile-emoji">🎖️</span><span class="more-tile-name">Awards</span></button>
        </div>
      </div>`;

    $$('.more-tile').forEach(t => t.addEventListener('click', () => navigate(t.dataset.page)));
  };

  // ============================================================
  // CHALLENGES PAGE
  // ============================================================
  const renderChallenges = () => {
    const challenges = Motivation.generateChallenges();
    const diffColors = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };

    container().innerHTML = `
      <div class="card fade-in"><div class="card-header-row"><div class="card-title">🏆 Your Challenges</div><button class="app-btn ghost small" id="ch-back">← More</button></div>
        <p style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">Personalized challenges based on your real goals and performance. No pressure — these are here to inspire, not stress!</p>
      </div>
      ${challenges.length ? challenges.map((ch, i) => {
        const pct = ch.target > 0 ? Math.min(100, Math.round((ch.current / ch.target) * 100)) : 0;
        return `<div class="card fade-in challenge-card" style="animation-delay:${i * 0.03}s;border-left:4px solid ${diffColors[ch.difficulty] || '#6b7280'}">
          <div class="challenge-header"><span class="challenge-emojis">${ch.emoji} ${ch.goalEmoji}</span><span class="challenge-diff challenge-${ch.difficulty}">${ch.difficulty}</span></div>
          <div class="challenge-title">${ch.title}</div>
          <div class="challenge-desc">${ch.desc}</div>
          <div class="budget-bar-wrap" style="margin-top:8px"><div class="budget-bar-fill" style="width:${pct}%;background:${diffColors[ch.difficulty]}"></div></div>
          <div class="challenge-progress">${ch.current} / ${ch.target} (${pct}%)</div>
          ${pct >= 100 ? '<div class="challenge-complete">🎉 Challenge Complete!</div>' : ''}
        </div>`;
      }).join('') : '<div class="card fade-in"><div style="text-align:center;color:var(--text-secondary);padding:20px">Add some goals first, and challenges will appear based on your activity! 🌱</div></div>'}`;

    $('#ch-back').addEventListener('click', () => navigate('more'));
  };

  // ============================================================
  // SMART GOAL SUGGESTIONS PAGE
  // ============================================================
  const renderSuggestions = () => {
    const suggestions = Motivation.getSuggestedGoals();
    const tags = Store.getTags();
    const grouped = {};
    suggestions.forEach(s => {
      const tag = tags.find(t => t.id === s.tagId);
      const key = tag ? tag.name : 'Other';
      if (!grouped[key]) grouped[key] = { tag, items: [] };
      grouped[key].items.push(s);
    });

    container().innerHTML = `
      <div class="card fade-in"><div class="card-header-row"><div class="card-title">💡 Goal Ideas</div><button class="app-btn ghost small" id="sg-back">← More</button></div>
        <p style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">Smart suggestions based on your goal categories. Tap any to add it instantly!</p>
      </div>
      ${Object.entries(grouped).map(([catName, { tag, items }], i) => `
        <div class="card fade-in" style="animation-delay:${i * 0.03}s">
          <div class="card-title">${tag ? tag.emoji + ' ' : ''}${catName}</div>
          ${items.map(s => `<div class="suggestion-item" data-name="${s.name}" data-emoji="${s.emoji}" data-tools='${JSON.stringify(s.tools)}' data-cfg='${JSON.stringify(s.toolConfig || {})}' data-frequency='${JSON.stringify(s.frequency)}' data-tags='${JSON.stringify(s.tags || [])}' data-cl='${JSON.stringify(s.checklist || [])}'>
            <span class="suggestion-emoji">${s.emoji}</span>
            <div class="suggestion-info"><div class="suggestion-name">${s.name}</div><div class="suggestion-meta">${Store.frequencyLabel(s.frequency)} • ${s.tools.filter(t => t !== 'check').map(t => Store.TOOL_DEFS[t]?.emoji || '').join(' ') || 'Daily check'}</div></div>
            <button class="app-btn primary small suggestion-add-btn">+ Add</button>
          </div>`).join('')}
        </div>`).join('')}
      ${!suggestions.length ? '<div class="card fade-in"><div style="text-align:center;color:var(--text-secondary);padding:20px">You\'ve already added all available suggestions! Try creating custom goals. 🎯</div></div>' : ''}`;

    $('#sg-back').addEventListener('click', () => navigate('more'));

    $$('.suggestion-add-btn').forEach(btn => btn.addEventListener('click', e => {
      e.stopPropagation();
      const item = btn.closest('.suggestion-item');
      const success = Store.addGoal({
        name: item.dataset.name,
        emoji: item.dataset.emoji,
        icon: 'goal-star',
        customIcon: null,
        tools: JSON.parse(item.dataset.tools),
        toolConfig: JSON.parse(item.dataset.cfg),
        checklist: JSON.parse(item.dataset.cl),
        frequency: JSON.parse(item.dataset.frequency),
        tags: JSON.parse(item.dataset.tags)
      });
      if (success) { toast(`${item.dataset.emoji} ${item.dataset.name} added! 🎯`); renderSuggestions(); }
      else toast(`Max ${Store.MAX_GOALS} goals!`);
    }));
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
  const pages = { home:renderHome, track:renderGoals, money:renderBudget, stats:renderStats, settings:renderSettings, weight:renderWeight, sleep:renderSleep, grocery:renderGrocery, todos:renderTodos, dates:renderDates, challenges:renderChallenges, suggestions:renderSuggestions, awards:renderAwards, goaldetail:null };
  const navigate = page => { if(pages[page]!==undefined && pages[page]){container().innerHTML='';pages[page]();} };
  return { navigate, toast, openModal, closeModal, renderDashboard };
})();
