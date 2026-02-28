/* ============================================================
   store.js — Data Layer
   Goals with modular tools, weight, sleep, meds, tags
   ============================================================ */

const Store = (() => {
  const KEYS = {
    weights: 'dp_weights',
    goals: 'dp_goals',
    settings: 'dp_settings',
    milestones: 'dp_milestones_unlocked',
    checklistState: 'dp_checklist_state',
    toolData: 'dp_tool_data',
    sleep: 'dp_sleep',
    tags: 'dp_tags'
  };

  const _get = (key, fb) => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; } };
  const _set = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.warn('Store write fail', e); } };
  const today = () => new Date().toISOString().split('T')[0];

  let _config = null;
  const loadConfig = async () => { if (_config) return _config; try { const r = await fetch('./config/defaults.json'); _config = await r.json(); } catch { _config = {}; } return _config; };
  const getConfig = () => _config || {};

  const DEFAULT_SETTINGS = {
    theme: 'default-dark', buttonStyle: 'clean',
    startWeight: null, goalWeight: null, weightUnit: 'lbs',
    soundEnabled: false, customColors: {}, customLabels: {}, iconOverrides: {}
  };

  // ============================================================
  // TOOL DEFINITIONS
  // ============================================================
  const TOOL_DEFS = {
    check:     { id: 'check',     label: 'Daily Check',    emoji: '✅', desc: 'Simple yes/no toggle' },
    checklist: { id: 'checklist', label: 'Checklist',      emoji: '📋', desc: 'Multi-item to-do list' },
    number:    { id: 'number',    label: 'Number Tracker',  emoji: '🔢', desc: 'Track a numeric value (graphed)' },
    counter:   { id: 'counter',   label: 'Counter',         emoji: '🔄', desc: 'Tap to count up through the day' },
    timer:     { id: 'timer',     label: 'Timer',           emoji: '⏱️', desc: 'Stopwatch for activity duration' },
    rating:    { id: 'rating',    label: 'Rating',          emoji: '⭐', desc: 'Rate 1–5 stars each day' },
    photo:     { id: 'photo',     label: 'Photo Journal',   emoji: '📸', desc: 'Snap a photo each day' },
    notes:     { id: 'notes',     label: 'Notes',           emoji: '📝', desc: 'Daily text journal entry' },
    target:    { id: 'target',    label: 'Target',          emoji: '🎯', desc: 'Progress bar toward a goal number' },
    medication:{ id: 'medication',label: 'Medication',      emoji: '💊', desc: 'Track doses with timed reminders' }
  };

  // ============================================================
  // TAGS / CATEGORIES
  // ============================================================
  const DEFAULT_TAGS = [
    { id: 'tag_health',   name: 'Health',      color: '#10b981', emoji: '💚' },
    { id: 'tag_fitness',  name: 'Fitness',     color: '#f59e0b', emoji: '🏋️' },
    { id: 'tag_mind',     name: 'Mindfulness', color: '#8b5cf6', emoji: '🧠' },
    { id: 'tag_work',     name: 'Productivity',color: '#3b82f6', emoji: '💼' },
    { id: 'tag_personal', name: 'Personal',    color: '#ec4899', emoji: '🌸' },
    { id: 'tag_finance',  name: 'Finance',     color: '#14b8a6', emoji: '💰' }
  ];

  const getTags = () => {
    const tags = _get(KEYS.tags, null);
    if (tags === null) { _set(KEYS.tags, DEFAULT_TAGS); return [...DEFAULT_TAGS]; }
    return tags;
  };

  const addTag = (name, color, emoji) => {
    const tags = getTags();
    if (tags.length >= 20) return false;
    tags.push({ id: 'tag_' + Date.now(), name: name.trim(), color: color || '#6b7280', emoji: emoji || '🏷️' });
    _set(KEYS.tags, tags);
    return true;
  };

  const removeTag = (id) => _set(KEYS.tags, getTags().filter(t => t.id !== id));

  const updateTag = (id, updates) => _set(KEYS.tags, getTags().map(t => t.id === id ? { ...t, ...updates } : t));

  // ============================================================
  // FREQUENCY
  // ============================================================
  const FREQUENCY_PRESETS = [
    { id: 'daily', label: 'Every day' },
    { id: 'x_per_week', label: 'X times per week' },
    { id: 'specific_days', label: 'Specific days' },
    { id: 'x_per_month', label: 'X times per month' },
    { id: 'x_per_year', label: 'X times per year' }
  ];

  const frequencyLabel = (f) => {
    if (!f) return 'Every day';
    const D = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    switch (f.type) {
      case 'daily': return 'Every day';
      case 'specific_days': return (f.days||[]).map(d => D[d]).join(', ');
      case 'x_per_week': return f.x === 1 ? 'Once/week' : `${f.x}×/week`;
      case 'x_per_month': return f.x === 1 ? 'Once/month' : `${f.x}×/month`;
      case 'x_per_year': return f.x === 1 ? 'Once/year' : `${f.x}×/year`;
      default: return 'Every day';
    }
  };

  const isDue = (freq, dateStr) => {
    const f = freq || { type: 'daily' };
    if (f.type === 'specific_days') return (f.days||[]).includes(new Date(dateStr+'T12:00:00').getDay());
    return true;
  };

  const periodProgress = (goal) => {
    const f = goal.frequency || { type: 'daily' };
    const now = new Date();
    const cir = (start) => { let c = 0; const d = new Date(start); while (d <= now) { if (goal.log[d.toISOString().split('T')[0]]) c++; d.setDate(d.getDate()+1); } return c; };
    switch (f.type) {
      case 'daily': return { done: goal.log[today()]?1:0, target: 1 };
      case 'specific_days': { const ws = new Date(now); ws.setDate(ws.getDate()-ws.getDay()); return { done: cir(ws), target: (f.days||[]).length }; }
      case 'x_per_week': { const ws = new Date(now); ws.setDate(ws.getDate()-ws.getDay()); return { done: cir(ws), target: f.x||1 }; }
      case 'x_per_month': return { done: cir(new Date(now.getFullYear(),now.getMonth(),1)), target: f.x||1 };
      case 'x_per_year': return { done: cir(new Date(now.getFullYear(),0,1)), target: f.x||1 };
      default: return { done: goal.log[today()]?1:0, target: 1 };
    }
  };

  // ============================================================
  // GOALS
  // ============================================================
  const MAX_GOALS = 15;

  const DEFAULT_GOALS = [
    { id:'g_1', name:'Goal #1', icon:'goal-star',  emoji:'⭐', active:true, created:today(), log:{}, frequency:{type:'daily'}, tools:['check'], checklist:[], customIcon:null, toolConfig:{}, tags:[] },
    { id:'g_2', name:'Goal #2', icon:'goal-target',emoji:'🎯', active:true, created:today(), log:{}, frequency:{type:'daily'}, tools:['check'], checklist:[], customIcon:null, toolConfig:{}, tags:[] },
    { id:'g_3', name:'Goal #3', icon:'goal-water', emoji:'💧', active:true, created:today(), log:{}, frequency:{type:'daily'}, tools:['check'], checklist:[], customIcon:null, toolConfig:{}, tags:[] }
  ];

  const getGoals = () => {
    const goals = _get(KEYS.goals, null);
    if (goals === null) { _set(KEYS.goals, DEFAULT_GOALS); return [...DEFAULT_GOALS]; }
    return goals.map(g => ({ frequency:{type:'daily'}, checklist:[], customIcon:null, tools:['check'], toolConfig:{}, tags:[], ...g }));
  };

  const getActiveGoals = () => getGoals().filter(g => g.active);

  const addGoal = (goalObj) => {
    const goals = getGoals();
    if (goals.filter(g => g.active).length >= MAX_GOALS) return false;
    goals.push({ id:'g_'+Date.now(), active:true, created:today(), log:{}, tools:['check'], toolConfig:{}, checklist:[], customIcon:null, frequency:{type:'daily'}, tags:[], ...goalObj });
    _set(KEYS.goals, goals); return true;
  };

  const removeGoal = (id) => _set(KEYS.goals, getGoals().map(g => g.id===id ? {...g,active:false} : g));

  const updateGoal = (id, u) => _set(KEYS.goals, getGoals().map(g => g.id===id ? {...g,...u} : g));

  const toggleGoal = (id, date) => {
    const d = date||today();
    const goals = getGoals();
    const goal = goals.find(g => g.id === id);
    const wasOn = goal && goal.log[d];

    _set(KEYS.goals, goals.map(g => {
      if (g.id===id) { const log={...g.log}; log[d]=!log[d]; if(!log[d]) delete log[d]; return {...g,log}; }
      return g;
    }));

    // Record timestamp when completing (not uncompleting)
    if (!wasOn) {
      const now = new Date();
      const timeStr = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
      const all = _get(KEYS.toolData, {});
      const k = `${id}:${d}`;
      if (!all[k]) all[k] = {};
      all[k].completedAt = timeStr;
      _set(KEYS.toolData, all);
    }
  };

  // ============================================================
  // TOOL DATA
  // ============================================================
  const _tk = (gid, d) => `${gid}:${d||today()}`;

  const getToolData = (gid, d) => { const all = _get(KEYS.toolData,{}); return all[_tk(gid,d)]||{}; };

  const setToolValue = (gid, tool, val, d) => {
    const all = _get(KEYS.toolData,{}); const k = _tk(gid,d);
    if (!all[k]) all[k]={}; all[k][tool]=val; _set(KEYS.toolData, all);
  };

  const getToolHistory = (gid, tool, days=30) => {
    const all = _get(KEYS.toolData,{}); const result = []; const d = new Date();
    for (let i=days-1; i>=0; i--) {
      const dd=new Date(d); dd.setDate(dd.getDate()-i);
      const ds=dd.toISOString().split('T')[0]; const data=all[`${gid}:${ds}`];
      const v=data?data[tool]:null;
      if (v!==null&&v!==undefined) result.push({date:ds, value:typeof v==='object'?v:Number(v)});
    }
    return result;
  };

  const getToolTotal = (gid, tool) => {
    const all = _get(KEYS.toolData,{}); let t=0;
    Object.keys(all).forEach(k => { if (k.startsWith(gid+':')&&all[k][tool]!=null) { const v=Number(all[k][tool]); if(!isNaN(v)) t+=v; } });
    return t;
  };

  // ============================================================
  // CHECKLIST STATE
  // ============================================================
  const getChecklistState = (gid, d) => { const all=_get(KEYS.checklistState,{}); return all[`${gid}:${d||today()}`]||{}; };

  const toggleChecklistItem = (gid, itemId, d) => {
    const dd=d||today(); const all=_get(KEYS.checklistState,{}); const k=`${gid}:${dd}`;
    if(!all[k]) all[k]={}; all[k][itemId]=!all[k][itemId]; _set(KEYS.checklistState, all);
    const goal=getGoals().find(g=>g.id===gid);
    if(goal&&goal.checklist&&goal.checklist.length>0) {
      const allDone=goal.checklist.every(item=>all[k][item.id]);
      if(allDone&&!goal.log[dd]) toggleGoal(gid,dd);
      else if(!allDone&&goal.log[dd]) toggleGoal(gid,dd);
    }
    return all[k];
  };

  // ============================================================
  // SLEEP TRACKER
  // ============================================================
  const getSleepLogs = () => _get(KEYS.sleep, []);

  const logSleep = (entry) => {
    // entry: { date, bedtime, wakeTime, hours, quality }
    const all = getSleepLogs().filter(e => e.date !== (entry.date||today()));
    all.push({ date: entry.date||today(), bedtime: entry.bedtime, wakeTime: entry.wakeTime, hours: entry.hours, quality: entry.quality||0, notes: entry.notes||'' });
    all.sort((a,b) => a.date.localeCompare(b.date));
    _set(KEYS.sleep, all);
    return true;
  };

  const getSleepByDate = (date) => getSleepLogs().find(e => e.date === (date||today())) || null;

  const getSleepStats = (days=30) => {
    const logs = getSleepLogs();
    const recent = logs.slice(-days);
    if (!recent.length) return { avg: 0, best: 0, worst: 0, avgQuality: 0, count: 0 };
    const hours = recent.map(l => l.hours).filter(h => h > 0);
    const quals = recent.map(l => l.quality).filter(q => q > 0);
    return {
      avg: hours.length ? (hours.reduce((a,b)=>a+b,0)/hours.length).toFixed(1) : 0,
      best: hours.length ? Math.max(...hours).toFixed(1) : 0,
      worst: hours.length ? Math.min(...hours).toFixed(1) : 0,
      avgQuality: quals.length ? (quals.reduce((a,b)=>a+b,0)/quals.length).toFixed(1) : 0,
      count: recent.length
    };
  };

  const calcSleepHours = (bedtime, wakeTime) => {
    if (!bedtime || !wakeTime) return 0;
    const [bh,bm] = bedtime.split(':').map(Number);
    const [wh,wm] = wakeTime.split(':').map(Number);
    let bedMins = bh*60+bm;
    let wakeMins = wh*60+wm;
    if (wakeMins <= bedMins) wakeMins += 1440; // next day
    return ((wakeMins - bedMins) / 60);
  };

  // ============================================================
  // MEDICATION TOOL DATA
  // Stored in toolData as: { medication: { doses: { "08:00": true, "20:00": false } } }
  // Config stored in goal.toolConfig: { medName, medDosage, medTimes: ["08:00","20:00"] }
  // ============================================================
  const getMedStatus = (goalId, date) => {
    const data = getToolData(goalId, date);
    return data.medication || { doses: {} };
  };

  const toggleMedDose = (goalId, timeStr, date) => {
    const d = date||today();
    const all = _get(KEYS.toolData,{});
    const k = _tk(goalId, d);
    if (!all[k]) all[k] = {};
    if (!all[k].medication) all[k].medication = { doses: {} };
    all[k].medication.doses[timeStr] = !all[k].medication.doses[timeStr];
    _set(KEYS.toolData, all);

    // Auto-complete goal if all doses taken
    const goal = getGoals().find(g => g.id===goalId);
    if (goal) {
      const times = (goal.toolConfig||{}).medTimes || [];
      const allTaken = times.every(t => all[k].medication.doses[t]);
      if (allTaken && !goal.log[d]) toggleGoal(goalId, d);
      else if (!allTaken && goal.log[d]) toggleGoal(goalId, d);
    }
    return all[k].medication;
  };

  // ============================================================
  // WEIGHTS
  // ============================================================
  const getWeights = () => _get(KEYS.weights, []);
  const addWeight = (w) => {
    const d=today(); const v=parseFloat(w);
    if(isNaN(v)||v<30||v>999) return false;
    const all=getWeights().filter(e=>e.date!==d); all.push({date:d,weight:v});
    all.sort((a,b)=>a.date.localeCompare(b.date)); _set(KEYS.weights,all); return true;
  };
  const deleteWeight = (d) => _set(KEYS.weights, getWeights().filter(e=>e.date!==d));

  // ============================================================
  // STREAKS
  // ============================================================
  const calcStreak = (log, freq) => {
    const f=freq||{type:'daily'}; let s=0; const d=new Date();
    if(f.type==='specific_days') { for(let i=0;i<400;i++){const k=d.toISOString().split('T')[0];if((f.days||[]).includes(d.getDay())){if(log[k])s++;else break;}d.setDate(d.getDate()-1);} }
    else { while(s<1000){const k=d.toISOString().split('T')[0];if(log[k]){s++;d.setDate(d.getDate()-1);}else break;} }
    return s;
  };

  const calcLongestStreak = (log) => {
    const dates=Object.keys(log).filter(k=>log[k]).sort(); if(!dates.length) return 0;
    let max=1,cur=1;
    for(let i=1;i<dates.length;i++){const p=new Date(dates[i-1]+'T12:00:00'),c=new Date(dates[i]+'T12:00:00');if((c-p)/86400000===1){cur++;max=Math.max(max,cur);}else cur=1;}
    return Math.max(max,cur);
  };

  const completionRate = (log, days=30) => {
    let c=0; const d=new Date();
    for(let i=0;i<days;i++){if(log[d.toISOString().split('T')[0]])c++;d.setDate(d.getDate()-1);}
    return Math.round((c/days)*100);
  };

  // ============================================================
  // SETTINGS & MILESTONES
  // ============================================================
  const getSettings = () => ({...DEFAULT_SETTINGS,..._get(KEYS.settings,{})});
  const updateSettings = (p) => _set(KEYS.settings, {...getSettings(),...p});
  const getLabel = (key, fb) => {
    const s=getSettings(); if(s.customLabels&&s.customLabels[key]) return s.customLabels[key];
    const c=getConfig(); if(c.labels&&c.labels[key]) return c.labels[key]; return fb;
  };

  const getUnlockedMilestones = () => _get(KEYS.milestones, []);
  const unlockMilestone = (id) => { const u=getUnlockedMilestones(); if(!u.includes(id)){u.push(id);_set(KEYS.milestones,u);return true;} return false; };

  // ============================================================
  // RESET
  // ============================================================
  const resetGoals = (goalIds) => {
    // Reset specific goals back to defaults (clear logs, tool data, checklist state)
    if (goalIds && goalIds.length) {
      // Selective reset
      const goals = getGoals().map(g => {
        if (goalIds.includes(g.id)) {
          return { ...g, log: {}, active: true };
        }
        return g;
      });
      _set(KEYS.goals, goals);
      // Clear tool data for these goals
      const td = _get(KEYS.toolData, {});
      const cls = _get(KEYS.checklistState, {});
      Object.keys(td).forEach(k => { if (goalIds.some(id => k.startsWith(id + ':'))) delete td[k]; });
      Object.keys(cls).forEach(k => { if (goalIds.some(id => k.startsWith(id + ':'))) delete cls[k]; });
      _set(KEYS.toolData, td);
      _set(KEYS.checklistState, cls);
    }
  };

  const resetAllGoals = (newCount) => {
    // Wipe all goals and create N fresh generic ones
    const count = Math.max(1, Math.min(newCount || 3, 15));
    const emojis = ['⭐','🎯','💧','💪','🧠','🔥','📚','🏃','🧘','💊','🥗','✍️','🛏️','🪥','🦷'];
    const icons = ['goal-star','goal-target','goal-water','goal-muscle','goal-brain','goal-star','goal-read','goal-exercise','goal-meditate','goal-vitamins','goal-salad','goal-journal','goal-sleep','goal-brush','goal-floss'];
    const goals = [];
    for (let i = 0; i < count; i++) {
      goals.push({
        id: 'g_' + (Date.now() + i), name: `Goal #${i + 1}`,
        icon: icons[i % icons.length], emoji: emojis[i % emojis.length],
        active: true, created: today(), log: {},
        frequency: { type: 'daily' }, tools: ['check'],
        checklist: [], customIcon: null, toolConfig: {}, tags: []
      });
    }
    _set(KEYS.goals, goals);
    _set(KEYS.toolData, {});
    _set(KEYS.checklistState, {});
  };

  const resetEverything = () => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    // Also clear reminders and budget
    localStorage.removeItem('dp_reminders');
    localStorage.removeItem('dp_dismiss_date');
    localStorage.removeItem('dp_budget');
    localStorage.removeItem('dp_budget_cats');
    localStorage.removeItem('dp_budget_limits');
    localStorage.removeItem('dp_monthly_budget');
  };

  return {
    today, loadConfig, getConfig, TOOL_DEFS,
    getWeights, addWeight, deleteWeight,
    getGoals, getActiveGoals, addGoal, removeGoal, updateGoal, toggleGoal,
    getToolData, setToolValue, getToolHistory, getToolTotal,
    getChecklistState, toggleChecklistItem,
    getSleepLogs, logSleep, getSleepByDate, getSleepStats, calcSleepHours,
    getMedStatus, toggleMedDose,
    getTags, addTag, removeTag, updateTag,
    calcStreak, calcLongestStreak, completionRate,
    isDue, periodProgress, frequencyLabel, FREQUENCY_PRESETS, MAX_GOALS,
    getSettings, updateSettings, getLabel,
    getUnlockedMilestones, unlockMilestone,
    resetGoals, resetAllGoals, resetEverything
  };
})();
