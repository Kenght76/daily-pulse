/* ============================================================
   motivation.js — Avatar, Encouragement, Challenges, Smart Awards
   ============================================================ */
const Motivation = (() => {
  const _get = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; } };
  const _set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  // ---- AVATARS ----
  // 135 custom image avatars in public/icons/avatars/1.png - 135.png
  const AVATAR_COUNT = 135;
  const AVATARS = [
    { id: 'av_warrior', emoji: '⚔️', name: 'Warrior' }, { id: 'av_wizard', emoji: '🧙', name: 'Wizard' },
    { id: 'av_astronaut', emoji: '🧑‍🚀', name: 'Astronaut' }, { id: 'av_ninja', emoji: '🥷', name: 'Ninja' },
    { id: 'av_explorer', emoji: '🧗', name: 'Explorer' }, { id: 'av_scientist', emoji: '🔬', name: 'Scientist' },
    { id: 'av_artist', emoji: '🎨', name: 'Artist' }, { id: 'av_chef', emoji: '👨‍🍳', name: 'Chef' },
    { id: 'av_athlete', emoji: '🏃', name: 'Athlete' }, { id: 'av_monk', emoji: '🧘', name: 'Monk' },
    { id: 'av_captain', emoji: '🚀', name: 'Captain' }, { id: 'av_guardian', emoji: '🛡️', name: 'Guardian' },
    { id: 'av_phoenix', emoji: '🔥', name: 'Phoenix' }, { id: 'av_sage', emoji: '🦉', name: 'Sage' },
    { id: 'av_sprout', emoji: '🌱', name: 'Sprout' }, { id: 'av_star', emoji: '⭐', name: 'Star' }
  ];

  const getAvatar = () => _get('dp_avatar', { type: 'builtin', id: 'av_star', emoji: '⭐', customImage: null, imageNum: null });
  const setAvatar = (av) => _set('dp_avatar', av);
  const getUserName = () => _get('dp_user_name', '');
  const setUserName = (n) => _set('dp_user_name', n);

  const renderAvatarHTML = (size = 48) => {
    const av = getAvatar();
    if (av.customImage) return `<img src="${av.customImage}" class="avatar-img" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover">`;
    if (av.imageNum) return `<img src="public/icons/avatars/${av.imageNum}.png" class="avatar-img" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover" onerror="this.textContent='⭐'">`;
    return `<span class="avatar-emoji" style="font-size:${size * 0.7}px;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary);border-radius:50%">${av.emoji}</span>`;
  };

  // Build avatar picker HTML (called from ui.js)
  const buildAvatarPickerHTML = () => {
    const cur = getAvatar();
    // Image avatars grid (show first 24, with "show all" expand)
    let imgGrid = '';
    for (let i = 1; i <= AVATAR_COUNT; i++) {
      imgGrid += `<button class="avatar-img-btn ${cur.imageNum==i?'selected':''}" data-num="${i}"><img src="public/icons/avatars/${i}.png" width="48" height="48" style="border-radius:50%;object-fit:cover" loading="lazy"></button>`;
    }
    return `<div class="avatar-picker-tabs">
        <button class="avatar-tab active" data-tab="images">Characters</button>
        <button class="avatar-tab" data-tab="emoji">Emoji</button>
        <button class="avatar-tab" data-tab="upload">Upload</button>
      </div>
      <div class="avatar-tab-content" id="avtab-images">
        <div class="avatar-img-grid" id="avatar-img-grid">${imgGrid}</div>
      </div>
      <div class="avatar-tab-content hidden" id="avtab-emoji">
        <div class="avatar-grid">${AVATARS.map(a=>`<button class="avatar-pick-btn ${cur.id===a.id&&!cur.imageNum?'selected':''}" data-id="${a.id}" data-emoji="${a.emoji}">${a.emoji}<span class="avatar-pick-label">${a.name}</span></button>`).join('')}</div>
        <div style="margin-top:10px"><div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px">Or type any emoji:</div>
        <div class="input-row"><input type="text" class="app-input" id="av-emoji-input" maxlength="4" style="width:70px;text-align:center;font-size:22px"><button class="app-btn ghost small" id="av-emoji-use">Use</button></div></div>
      </div>
      <div class="avatar-tab-content hidden" id="avtab-upload">
        <div style="text-align:center;padding:20px"><button class="app-btn primary" id="av-upload-btn">Choose Photo</button><input type="file" id="av-file-input" accept="image/*" style="display:none">
        <div style="font-size:12px;color:var(--text-secondary);margin-top:8px">Upload your own photo as avatar</div></div>
      </div>`;
  };

  // ---- ENCOURAGEMENT ----
  const getEncouragement = (ctx) => {
    const name = getUserName();
    if (ctx.type === 'complete_goal') {
      const m = [`Nice! "${ctx.goalName}" done ✓`, `${ctx.goalName} — crushed it! 💪`, `Another one down! Keep rolling 🔥`,
        `That's the way! ${ctx.streak > 1 ? ctx.streak + ' days strong!' : ''}`, `${ctx.goalName} ✓ — you're building something great`,
        `Every check mark counts. Well done! ✨`, `${ctx.goalName} — future you says thanks 🙏`];
      if (ctx.streak >= 30) m.push(`30+ day streak on ${ctx.goalName}! Unstoppable! 🏆`);
      if (ctx.streak >= 7) m.push(`A whole week of ${ctx.goalName}! Incredible! ⚡`);
      return m[Math.floor(Math.random() * m.length)];
    }
    if (ctx.type === 'all_done') {
      const m = ['Perfect day! Every single goal — done! 🌟', '100% today! You should be proud! 👑',
        'ALL goals complete! This is dedication! 💎', `${ctx.todayTotal}/${ctx.todayTotal} — you made today count! 🎯`, 'Clean sweep! 🧹✨'];
      return m[Math.floor(Math.random() * m.length)];
    }
    if (ctx.type === 'partial_day') {
      const m = [`${ctx.todayDone} of ${ctx.todayTotal} done — solid progress!`, `You showed up today. That matters more than perfection. 💛`,
        `${ctx.todayDone} goals down! Tomorrow is another chance.`, `Progress isn't always linear. ${ctx.todayDone} completions is still growth! 🌱`];
      return m[Math.floor(Math.random() * m.length)];
    }
    if (ctx.type === 'missed_day') {
      const m = ['Everyone has off days — what matters is showing up tomorrow. 💛', 'Rest days are part of the journey. 🌙',
        "A skip doesn't erase your progress. You've built real habits! 🌱", 'Be kind to yourself. One day doesn\'t define you. ✨',
        'Progress over perfection. You\'re still ahead of where you started! 🏔️', 'Even the best athletes have rest days. Take care of yourself. 🤗'];
      return m[Math.floor(Math.random() * m.length)];
    }
    if (ctx.type === 'morning_greeting') {
      const p = name ? `Good morning, ${name}!` : 'Good morning!';
      const h = new Date().getHours();
      const timeGreet = h < 12 ? p : h < 17 ? (name ? `Good afternoon, ${name}!` : 'Good afternoon!') : (name ? `Good evening, ${name}!` : 'Good evening!');
      const m = [`${timeGreet} Today is a fresh start. ☀️`, `${timeGreet} Your goals are waiting. Let's go! 💪`,
        `${timeGreet} Small daily actions create big results. 🌟`, `${timeGreet} You've shown up before — let's do it again! 🚀`];
      return m[Math.floor(Math.random() * m.length)];
    }
    return 'Keep going — you\'re doing great! 💪';
  };

  // ---- CHALLENGES ----
  const generateChallenges = () => {
    const goals = Store.getActiveGoals();
    const ch = [];
    goals.forEach(g => {
      const streak = Store.calcStreak(g.log, g.frequency);
      const rate = Store.completionRate(g.log, 14);
      const longest = Store.calcLongestStreak(g.log);

      if (longest >= 3) ch.push({ id: `ch_beat_${g.id}`, type: 'beat_streak', goalId: g.id, goalName: g.name, goalEmoji: g.emoji,
        title: `Beat your record: ${longest + 1} days`, desc: `Your best ${g.name} streak is ${longest}. Can you hit ${longest + 1}?`,
        target: longest + 1, current: streak, emoji: '🏆', difficulty: longest >= 30 ? 'hard' : longest >= 14 ? 'medium' : 'easy' });

      if (rate < 80 && rate > 20) ch.push({ id: `ch_cons_${g.id}`, type: 'consistency', goalId: g.id, goalName: g.name, goalEmoji: g.emoji,
        title: `${g.name}: 6 of 7 days`, desc: `At ${rate}% — can you hit 6 out of the next 7 days?`,
        target: 6, current: 0, emoji: '🎯', difficulty: 'medium' });

      if (streak >= 7 && rate >= 70) {
        const next = [14, 21, 30, 60, 90].find(m => m > streak) || streak + 7;
        ch.push({ id: `ch_stretch_${g.id}`, type: 'stretch', goalId: g.id, goalName: g.name, goalEmoji: g.emoji,
          title: `Push to ${next} days!`, desc: `You're on a ${streak}-day streak. Next milestone: ${next}!`,
          target: next, current: streak, emoji: '🚀', difficulty: next >= 60 ? 'hard' : next >= 21 ? 'medium' : 'easy' });
      }
    });

    if (goals.length >= 3) {
      const td = goals.filter(g => g.log[Store.today()]).length;
      if (td < goals.length) ch.push({ id: 'ch_perfect_day', type: 'perfect_day', goalId: null, goalName: 'All Goals', goalEmoji: '⭐',
        title: 'Perfect Day', desc: `Complete all ${goals.length} goals today!`, target: goals.length, current: td, emoji: '🌟', difficulty: goals.length > 8 ? 'hard' : 'medium' });
    }

    if (goals.length >= 2) {
      let pd = 0;
      for (let i = 0; i < 7; i++) { const d = new Date(); d.setDate(d.getDate() - i); if (goals.every(g => g.log[d.toISOString().split('T')[0]])) pd++; }
      ch.push({ id: 'ch_perfect_week', type: 'perfect_week', goalId: null, goalName: 'All Goals', goalEmoji: '👑',
        title: 'Perfect Week', desc: `Every goal every day for 7 days. ${pd}/7 so far!`, target: 7, current: pd, emoji: '👑', difficulty: 'hard' });
    }
    return ch;
  };

  const getChallenges = () => _get('dp_challenges', []);
  const acceptChallenge = (id) => { const a = getChallenges(); if (a.find(c => c.id === id)) return; const ch = generateChallenges().find(c => c.id === id); if (ch) { a.push({ ...ch, acceptedDate: Store.today() }); _set('dp_challenges', a); } };
  const dismissChallenge = (id) => _set('dp_challenges', getChallenges().filter(c => c.id !== id));

  // ---- PERSONALIZED ACHIEVEMENTS ----
  const getAchievements = () => _get('dp_achievements', []);
  const unlockAchievement = (id) => { const a = getAchievements(); if (a.find(x => x.id === id)) return false; a.push({ id, date: Store.today() }); _set('dp_achievements', a); return true; };
  const isAchieved = (id) => getAchievements().some(a => a.id === id);

  const getAllAchievements = () => {
    const goals = Store.getActiveGoals(), ach = [];
    goals.forEach(g => {
      const longest = Store.calcLongestStreak(g.log), total = Object.values(g.log).filter(Boolean).length;
      ach.push({ id: `ach_first_${g.id}`, emoji: '🌱', title: `First ${g.name}`, desc: `Completed ${g.name} for the first time`, earned: total >= 1, tier: 'starter' });
      ach.push({ id: `ach_7d_${g.id}`, emoji: '🔥', title: `${g.name} Week`, desc: `7-day streak on ${g.name}`, earned: longest >= 7, tier: 'bronze' });
      ach.push({ id: `ach_30d_${g.id}`, emoji: '💪', title: `${g.name} Month`, desc: `30-day streak on ${g.name}`, earned: longest >= 30, tier: 'silver' });
      ach.push({ id: `ach_100_${g.id}`, emoji: '💯', title: `${g.name} × 100`, desc: `Completed ${g.name} 100 times`, earned: total >= 100, tier: 'gold' });
      ach.push({ id: `ach_365_${g.id}`, emoji: '👑', title: `${g.name} Year`, desc: `365-day streak on ${g.name}!`, earned: longest >= 365, tier: 'legend' });
    });
    const rates = goals.map(g => Store.completionRate(g.log, 30)), avg = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;
    const tc = goals.reduce((s, g) => s + Object.values(g.log).filter(Boolean).length, 0);
    ach.push({ id: 'ach_div3', emoji: '🎯', title: 'Triple Threat', desc: '3+ active goals', earned: goals.length >= 3, tier: 'starter' });
    ach.push({ id: 'ach_div10', emoji: '🌈', title: 'Renaissance Person', desc: '10+ active goals', earned: goals.length >= 10, tier: 'gold' });
    ach.push({ id: 'ach_avg80', emoji: '📊', title: 'Consistency King', desc: '80%+ avg completion', earned: avg >= 80 && goals.length >= 2, tier: 'silver' });
    ach.push({ id: 'ach_avg95', emoji: '💎', title: 'Near Perfect', desc: '95%+ avg completion', earned: avg >= 95 && goals.length >= 3, tier: 'legend' });
    [{ n: 50, e: '🎖️', t: 'starter' }, { n: 250, e: '⭐', t: 'bronze' }, { n: 1000, e: '🏆', t: 'silver' }, { n: 5000, e: '💎', t: 'gold' }].forEach(m => {
      ach.push({ id: `ach_total_${m.n}`, emoji: m.e, title: `${m.n} Check-ins`, desc: `${m.n} total completions`, earned: tc >= m.n, tier: m.t });
    });
    ach.filter(a => a.earned).forEach(a => unlockAchievement(a.id));
    return ach;
  };

  // ---- SUGGESTED GOALS ----
  const SUGGESTED_GOALS = {
    tag_health: [
      { name: 'Drink 8 Glasses of Water', emoji: '💧', tools: ['check', 'counter'], toolConfig: { counterLabel: 'Glasses', counterGoal: 8 }, frequency: { type: 'daily' } },
      { name: 'Take Vitamins', emoji: '💊', tools: ['check'], frequency: { type: 'daily' } },
      { name: 'Eat 5 Servings Fruits/Vegs', emoji: '🥗', tools: ['check', 'counter'], toolConfig: { counterLabel: 'Servings', counterGoal: 5 }, frequency: { type: 'daily' } },
      { name: 'No Processed Food', emoji: '🚫', tools: ['check'], frequency: { type: 'daily' } },
      { name: 'Stand Up Every Hour', emoji: '🧍', tools: ['check', 'counter'], toolConfig: { counterLabel: 'Times', counterGoal: 8 }, frequency: { type: 'daily' } },
    ],
    tag_fitness: [
      { name: 'Walk 10,000 Steps', emoji: '🚶', tools: ['check', 'number'], toolConfig: { numberLabel: 'Steps', numberUnit: 'steps' }, frequency: { type: 'daily' } },
      { name: '30-Min Workout', emoji: '🏋️', tools: ['check', 'timer'], toolConfig: { timerLabel: 'Workout' }, frequency: { type: 'daily' } },
      { name: 'Morning Run', emoji: '🏃', tools: ['check', 'timer'], toolConfig: { timerLabel: 'Run' }, frequency: { type: 'x_per_week', x: 3 } },
      { name: 'Stretch 10 Min', emoji: '🧘', tools: ['check', 'timer'], toolConfig: { timerLabel: 'Stretch' }, frequency: { type: 'daily' } },
      { name: 'Pushups Challenge', emoji: '💪', tools: ['check', 'counter'], toolConfig: { counterLabel: 'Pushups', counterGoal: 50 }, frequency: { type: 'daily' } },
    ],
    tag_mind: [
      { name: 'Meditate 10 Minutes', emoji: '🧘', tools: ['check', 'timer'], toolConfig: { timerLabel: 'Meditation' }, frequency: { type: 'daily' } },
      { name: 'Gratitude Journal', emoji: '🙏', tools: ['check', 'notes'], frequency: { type: 'daily' } },
      { name: 'No Social Media Before Noon', emoji: '📵', tools: ['check'], frequency: { type: 'daily' } },
      { name: 'Read 20 Minutes', emoji: '📚', tools: ['check', 'timer'], toolConfig: { timerLabel: 'Reading' }, frequency: { type: 'daily' } },
      { name: 'Screen-Free Evening', emoji: '🌙', tools: ['check'], frequency: { type: 'daily' } },
    ],
    tag_work: [
      { name: 'Complete Top 3 Priorities', emoji: '✅', tools: ['check', 'checklist'], checklist: [{ id: 'p1', name: 'Priority 1' }, { id: 'p2', name: 'Priority 2' }, { id: 'p3', name: 'Priority 3' }], frequency: { type: 'daily' } },
      { name: '2-Hour Deep Work Block', emoji: '🎯', tools: ['check', 'timer'], toolConfig: { timerLabel: 'Focus' }, frequency: { type: 'daily' } },
      { name: 'Inbox Zero', emoji: '📧', tools: ['check'], frequency: { type: 'daily' } },
      { name: 'Learn Something New', emoji: '🧠', tools: ['check', 'notes'], frequency: { type: 'x_per_week', x: 3 } },
    ],
    tag_personal: [
      { name: 'Call a Friend/Family', emoji: '📞', tools: ['check', 'notes'], frequency: { type: 'x_per_week', x: 2 } },
      { name: 'Practice a Hobby', emoji: '🎨', tools: ['check', 'timer'], toolConfig: { timerLabel: 'Hobby' }, frequency: { type: 'daily' } },
      { name: 'Go Outside 15 Min', emoji: '☀️', tools: ['check'], frequency: { type: 'daily' } },
      { name: 'Random Act of Kindness', emoji: '💛', tools: ['check', 'notes'], frequency: { type: 'daily' } },
    ],
    tag_finance: [
      { name: 'Log All Expenses', emoji: '📊', tools: ['check'], frequency: { type: 'daily' } },
      { name: 'No Impulse Purchases', emoji: '🛑', tools: ['check'], frequency: { type: 'daily' } },
      { name: 'Pack Lunch', emoji: '🥪', tools: ['check'], frequency: { type: 'daily' } },
      { name: 'Save $5 Today', emoji: '💰', tools: ['check', 'number'], toolConfig: { numberLabel: 'Saved', numberUnit: '$' }, frequency: { type: 'daily' } },
    ]
  };

  const getSuggestedGoals = () => {
    const existing = Store.getActiveGoals().map(g => g.name.toLowerCase());
    const results = [];
    Object.entries(SUGGESTED_GOALS).forEach(([tagId, goals]) => {
      goals.forEach(g => {
        if (!existing.includes(g.name.toLowerCase())) {
          results.push({ ...g, tagId, tags: [tagId], checklist: g.checklist || [], toolConfig: g.toolConfig || {} });
        }
      });
    });
    return results;
  };

  const reset = () => { ['dp_avatar', 'dp_challenges', 'dp_achievements', 'dp_user_name'].forEach(k => localStorage.removeItem(k)); };

  return {
    AVATARS, AVATAR_COUNT, getAvatar, setAvatar, getUserName, setUserName, renderAvatarHTML, buildAvatarPickerHTML,
    getEncouragement, generateChallenges, getChallenges, acceptChallenge, dismissChallenge,
    getAllAchievements, getAchievements, isAchieved, SUGGESTED_GOALS, getSuggestedGoals, reset
  };
})();
