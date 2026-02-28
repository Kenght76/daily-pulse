/* ============================================================
   coach.js — Personal Coach System
   Avatar, dynamic challenges, encouragement, stretch goals
   ============================================================ */

const Coach = (() => {

  const KEY_AVATAR = 'dp_avatar';
  const KEY_CHALLENGES = 'dp_challenges';
  const KEY_COACH = 'dp_coach_state';

  const _get = (key, fb) => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; } };
  const _set = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

  // ============================================================
  // AVATAR
  // ============================================================
  const DEFAULT_AVATARS = [
    { id: 'av_runner',  emoji: '🏃', label: 'Runner' },
    { id: 'av_lifter',  emoji: '🏋️', label: 'Lifter' },
    { id: 'av_yogi',    emoji: '🧘', label: 'Yogi' },
    { id: 'av_chef',    emoji: '🧑‍🍳', label: 'Chef' },
    { id: 'av_student', emoji: '🎓', label: 'Student' },
    { id: 'av_artist',  emoji: '🎨', label: 'Artist' },
    { id: 'av_pro',     emoji: '💼', label: 'Pro' },
    { id: 'av_hero',    emoji: '🦸', label: 'Hero' },
    { id: 'av_zen',     emoji: '🧠', label: 'Zen' },
    { id: 'av_rocket',  emoji: '🚀', label: 'Rocket' },
    { id: 'av_star',    emoji: '⭐', label: 'Star' },
    { id: 'av_fire',    emoji: '🔥', label: 'Fire' },
    { id: 'av_bear',    emoji: '🐻', label: 'Bear' },
    { id: 'av_cat',     emoji: '🐱', label: 'Cat' },
    { id: 'av_dog',     emoji: '🐶', label: 'Dog' },
    { id: 'av_owl',     emoji: '🦉', label: 'Owl' }
  ];

  // { type: 'preset'|'emoji'|'upload', id, emoji, customUrl }
  const getAvatar = () => _get(KEY_AVATAR, { type: 'preset', id: 'av_star', emoji: '⭐', customUrl: null });

  const setAvatar = (avatar) => _set(KEY_AVATAR, avatar);

  const renderAvatar = (size = 48) => {
    const av = getAvatar();
    if (av.customUrl) {
      return `<img src="${av.customUrl}" class="coach-avatar" width="${size}" height="${size}" style="border-radius:50%;object-fit:cover">`;
    }
    return `<div class="coach-avatar-emoji" style="width:${size}px;height:${size}px;font-size:${size * 0.6}px">${av.emoji}</div>`;
  };

  // ============================================================
  // ENCOURAGEMENT ENGINE
  // ============================================================
  const getEncouragement = (context) => {
    // context: { type, goalName, streak, rate, todayDone, totalGoals, justCompleted, justMissed }
    const { type, goalName, streak, rate, todayDone, totalGoals } = context;

    // COMPLETION messages (when checking off a goal)
    if (type === 'complete') {
      if (todayDone === totalGoals) return pick([
        '🎉 Perfect day! Every single goal crushed!',
        '💯 ALL goals done — you\'re unstoppable!',
        '🌟 Clean sweep! That\'s how it\'s done!',
        '👑 100% today. You\'re on fire!'
      ]);
      if (streak >= 30) return pick([
        `🔥 ${streak} days strong on ${goalName}! Legend status.`,
        `💎 ${streak}-day streak! You've built something real.`,
        `⚡ ${goalName} × ${streak} days. That's dedication!`
      ]);
      if (streak >= 7) return pick([
        `🔥 ${streak} days on ${goalName}! Keep building!`,
        `💪 Week+ streak on ${goalName}! Momentum is real.`,
        `✨ ${goalName} ${streak} days running — nice rhythm!`
      ]);
      if (streak >= 3) return pick([
        `🌱 ${streak} days on ${goalName} — habit forming!`,
        `👏 ${goalName} day ${streak}! Three's a pattern!`,
        `💫 ${streak}-day streak started on ${goalName}!`
      ]);
      return pick([
        `✅ ${goalName} done! One step closer.`,
        `👍 ${goalName} checked off. Progress!`,
        `💪 Got ${goalName} done today. That counts!`,
        `✨ ${goalName} ✓ — showing up matters most.`
      ]);
    }

    // MISS messages (end of day, goal not done)
    if (type === 'miss') {
      return pick([
        `Tomorrow's a new chance for ${goalName}. You've got this! 💙`,
        `Missing one day doesn't erase your progress. Rest up! 🌙`,
        `${goalName} can wait — your wellbeing can't. Be kind to yourself. ☀️`,
        `Even the best take rest days. Back at it tomorrow! 💪`,
        `One day off from ${goalName} is part of the journey, not the end. 🛤️`,
        `Your ${rate}% rate on ${goalName} is still impressive. Keep going! 📈`
      ]);
    }

    // MORNING messages (daily greeting)
    if (type === 'morning') {
      if (rate >= 90) return pick([
        `You've been crushing it at ${rate}% — let's keep the fire going! 🔥`,
        `${rate}% completion rate. You're in the elite zone! ⚡`,
        `Almost perfect consistency at ${rate}%. Today's another chance to shine! 🌟`
      ]);
      if (rate >= 60) return pick([
        `Solid ${rate}% rate! Every day you show up, you get stronger. 💪`,
        `${rate}% and climbing. The consistency is building! 📈`,
        `Good rhythm at ${rate}%! Small steps, big results. 🎯`
      ]);
      if (rate >= 30) return pick([
        `${rate}% is a foundation to build on. Today can push it higher! 🌱`,
        `Every check-in counts. You're at ${rate}% — let's grow it! 🚀`,
        `${rate}% means you're showing up. That's what matters most! 💫`
      ]);
      return pick([
        `Fresh start today! No pressure — just do what you can. 🌅`,
        `Today is day one, or one more day. Your choice! ☀️`,
        `Just opening the app shows you care. Let's make today count! 💪`
      ]);
    }

    // STREAK messages
    if (type === 'streak_milestone') {
      return pick([
        `🎉 ${streak}-day streak achieved! That took real commitment.`,
        `🏆 ${streak} days! You should be proud of this consistency.`,
        `💎 ${streak}-day milestone! You're building an unbreakable habit.`
      ]);
    }

    return pick([
      'You\'re doing great! Keep it up! 💪',
      'Every small step counts. Let\'s go! 🚀',
      'Showing up is half the battle. You\'re here! 🌟'
    ]);
  };

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // ============================================================
  // DYNAMIC CHALLENGES — based on user's REAL goals & performance
  // ============================================================
  const getChallenges = () => _get(KEY_CHALLENGES, []);

  const generateChallenges = () => {
    const goals = Store.getActiveGoals();
    const challenges = [];
    const today = Store.today();

    goals.forEach(g => {
      const streak = Store.calcStreak(g.log, g.frequency);
      const rate = Store.completionRate(g.log, 14); // 2-week rate
      const longestStreak = Store.calcLongestStreak(g.log);

      // 1. Beat your streak challenge
      if (longestStreak >= 3 && streak < longestStreak) {
        challenges.push({
          id: `ch_streak_${g.id}`,
          type: 'streak_beat',
          goalId: g.id,
          goalName: g.name,
          goalEmoji: g.emoji,
          title: `Beat Your Record: ${g.name}`,
          desc: `Your best streak is ${longestStreak} days. Current: ${streak}. Can you beat it?`,
          target: longestStreak + 1,
          current: streak,
          difficulty: 'medium',
          emoji: '🏆'
        });
      }

      // 2. Perfect week challenge (if rate < 100)
      if (rate < 100 && rate >= 40) {
        challenges.push({
          id: `ch_perfect_${g.id}`,
          type: 'perfect_week',
          goalId: g.id,
          goalName: g.name,
          goalEmoji: g.emoji,
          title: `Perfect Week: ${g.name}`,
          desc: `Complete ${g.name} every day this week. You're at ${rate}% — push for 100%!`,
          target: 7,
          current: countThisWeek(g),
          difficulty: rate >= 70 ? 'easy' : 'hard',
          emoji: '⭐'
        });
      }

      // 3. Stretch goal — improvement challenge
      if (rate >= 30 && rate < 80) {
        const stretchRate = Math.min(100, rate + 20);
        challenges.push({
          id: `ch_improve_${g.id}`,
          type: 'improve',
          goalId: g.id,
          goalName: g.name,
          goalEmoji: g.emoji,
          title: `Level Up: ${g.name}`,
          desc: `Go from ${rate}% to ${stretchRate}% over the next 2 weeks. Just ${Math.ceil((stretchRate - rate) / 100 * 14)} more days!`,
          target: stretchRate,
          current: rate,
          difficulty: 'medium',
          emoji: '📈'
        });
      }

      // 4. First streak challenge (for new/struggling goals)
      if (longestStreak < 3) {
        challenges.push({
          id: `ch_first3_${g.id}`,
          type: 'first_streak',
          goalId: g.id,
          goalName: g.name,
          goalEmoji: g.emoji,
          title: `First 3-Day Streak: ${g.name}`,
          desc: `Complete ${g.name} for 3 days in a row to build momentum!`,
          target: 3,
          current: streak,
          difficulty: 'easy',
          emoji: '🌱'
        });
      }

      // 5. Counter/number stretch goals
      if (g.tools?.includes('counter')) {
        const cfg = g.toolConfig || {};
        const dailyGoal = cfg.counterGoal || 0;
        if (dailyGoal > 0) {
          challenges.push({
            id: `ch_counter_${g.id}`,
            type: 'counter_stretch',
            goalId: g.id,
            goalName: g.name,
            goalEmoji: g.emoji,
            title: `Stretch: ${g.name}`,
            desc: `Your daily goal is ${dailyGoal}. Try hitting ${Math.ceil(dailyGoal * 1.25)} today!`,
            target: Math.ceil(dailyGoal * 1.25),
            current: Store.getToolData(g.id)?.counter || 0,
            difficulty: 'hard',
            emoji: '💥'
          });
        }
      }
    });

    // 6. Overall completion challenge
    if (goals.length >= 3) {
      const overall = goals.map(g => Store.completionRate(g.log, 7));
      const avg = Math.round(overall.reduce((a, b) => a + b, 0) / overall.length);
      if (avg < 90) {
        challenges.push({
          id: 'ch_overall',
          type: 'overall',
          goalId: null,
          goalName: 'All Goals',
          goalEmoji: '🎯',
          title: 'All-Star Day',
          desc: `Complete every single goal today. You hit ${avg}% last week — go for 100%!`,
          target: goals.length,
          current: goals.filter(g => g.log[today]).length,
          difficulty: avg >= 70 ? 'medium' : 'hard',
          emoji: '💯'
        });
      }
    }

    // Sort: easy first, then by relevance
    const diffOrder = { easy: 0, medium: 1, hard: 2 };
    challenges.sort((a, b) => (diffOrder[a.difficulty] || 1) - (diffOrder[b.difficulty] || 1));

    return challenges;
  };

  const countThisWeek = (goal) => {
    let count = 0;
    const now = new Date();
    const dayOfWeek = now.getDay();
    for (let i = 0; i <= dayOfWeek; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (goal.log[d.toISOString().split('T')[0]]) count++;
    }
    return count;
  };

  // ============================================================
  // SMART GOAL SUGGESTIONS — based on existing tags/goals
  // ============================================================
  const SUGGESTIONS = {
    tag_health: [
      { name: 'Drink 8 Glasses of Water', emoji: '💧', tools: ['check', 'counter'], toolConfig: { counterLabel: 'Glasses', counterGoal: 8 }, freq: { type: 'daily' } },
      { name: 'Take a 30-Min Walk', emoji: '🚶', tools: ['check', 'timer'], toolConfig: { timerLabel: 'Walk time' }, freq: { type: 'daily' } },
      { name: 'Eat Vegetables with Every Meal', emoji: '🥗', tools: ['check', 'counter'], toolConfig: { counterLabel: 'Meals', counterGoal: 3 }, freq: { type: 'daily' } },
      { name: 'No Sugar Today', emoji: '🚫', tools: ['check'], freq: { type: 'daily' } },
      { name: 'Stand Up Every Hour', emoji: '🧍', tools: ['check', 'counter'], toolConfig: { counterLabel: 'Stand-ups', counterGoal: 8 }, freq: { type: 'daily' } }
    ],
    tag_fitness: [
      { name: '10,000 Steps', emoji: '👟', tools: ['check', 'number'], toolConfig: { numberLabel: 'Steps', numberUnit: 'steps' }, freq: { type: 'daily' } },
      { name: '50 Push-Ups', emoji: '💪', tools: ['check', 'counter'], toolConfig: { counterLabel: 'Push-ups', counterGoal: 50 }, freq: { type: 'daily' } },
      { name: 'Stretch for 10 Minutes', emoji: '🤸', tools: ['check', 'timer'], toolConfig: { timerLabel: 'Stretch' }, freq: { type: 'daily' } },
      { name: 'Run 3 Miles', emoji: '🏃', tools: ['check', 'number'], toolConfig: { numberLabel: 'Miles', numberUnit: 'mi' }, freq: { type: 'x_per_week', x: 3 } },
      { name: 'Gym Session', emoji: '🏋️', tools: ['check', 'timer', 'rating'], toolConfig: { timerLabel: 'Workout' }, freq: { type: 'x_per_week', x: 4 } }
    ],
    tag_mind: [
      { name: 'Meditate 10 Minutes', emoji: '🧘', tools: ['check', 'timer'], toolConfig: { timerLabel: 'Meditation' }, freq: { type: 'daily' } },
      { name: 'Write 3 Gratitudes', emoji: '🙏', tools: ['check', 'notes'], freq: { type: 'daily' } },
      { name: 'No Phone First Hour', emoji: '📵', tools: ['check'], freq: { type: 'daily' } },
      { name: 'Journal for 5 Minutes', emoji: '📓', tools: ['check', 'timer', 'notes'], toolConfig: { timerLabel: 'Journal time' }, freq: { type: 'daily' } },
      { name: 'Practice Deep Breathing', emoji: '🌬️', tools: ['check', 'counter'], toolConfig: { counterLabel: 'Sessions', counterGoal: 3 }, freq: { type: 'daily' } }
    ],
    tag_work: [
      { name: 'Complete Top 3 Tasks', emoji: '📋', tools: ['check', 'checklist'], checklist: [{ id: 't1', name: 'Task 1' }, { id: 't2', name: 'Task 2' }, { id: 't3', name: 'Task 3' }], freq: { type: 'daily' } },
      { name: '2-Hour Deep Work Block', emoji: '🎯', tools: ['check', 'timer'], toolConfig: { timerLabel: 'Deep work' }, freq: { type: 'daily' } },
      { name: 'Inbox Zero', emoji: '📧', tools: ['check'], freq: { type: 'daily' } },
      { name: 'Learn 30 Minutes', emoji: '📚', tools: ['check', 'timer'], toolConfig: { timerLabel: 'Learning' }, freq: { type: 'daily' } },
      { name: 'Review Weekly Goals', emoji: '📊', tools: ['check', 'notes', 'rating'], freq: { type: 'specific_days', days: [5] } }
    ],
    tag_personal: [
      { name: 'Read 20 Pages', emoji: '📖', tools: ['check', 'number'], toolConfig: { numberLabel: 'Pages', numberUnit: 'pages' }, freq: { type: 'daily' } },
      { name: 'Call a Friend or Family', emoji: '📞', tools: ['check', 'notes'], freq: { type: 'x_per_week', x: 2 } },
      { name: 'Practice a Hobby', emoji: '🎨', tools: ['check', 'timer', 'photo'], toolConfig: { timerLabel: 'Hobby time' }, freq: { type: 'daily' } },
      { name: 'Tidy Up 15 Minutes', emoji: '🧹', tools: ['check', 'timer'], toolConfig: { timerLabel: 'Clean time' }, freq: { type: 'daily' } },
      { name: 'Digital Detox Hour', emoji: '🔌', tools: ['check'], freq: { type: 'daily' } }
    ],
    tag_finance: [
      { name: 'Log All Spending', emoji: '📝', tools: ['check'], freq: { type: 'daily' } },
      { name: 'No Eating Out Today', emoji: '🍳', tools: ['check'], freq: { type: 'x_per_week', x: 5 } },
      { name: 'Save $5 Today', emoji: '🐷', tools: ['check', 'number'], toolConfig: { numberLabel: 'Saved', numberUnit: '$' }, freq: { type: 'daily' } },
      { name: 'Review Budget', emoji: '📊', tools: ['check', 'rating'], freq: { type: 'specific_days', days: [0] } },
      { name: 'Find One Thing to Cancel/Reduce', emoji: '✂️', tools: ['check', 'notes'], freq: { type: 'x_per_month', x: 1 } }
    ]
  };

  const getSuggestions = () => {
    const goals = Store.getActiveGoals();
    const existingNames = goals.map(g => g.name.toLowerCase());
    const tags = goals.flatMap(g => g.tags || []);
    const tagCounts = {};
    tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });

    // Get suggestions from user's most-used tags
    const results = [];
    const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(([t]) => t);

    // Include at least all tags that have goals
    const allTags = [...new Set([...sortedTags, ...Object.keys(SUGGESTIONS)])];

    allTags.forEach(tagId => {
      const suggestions = SUGGESTIONS[tagId];
      if (!suggestions) return;
      suggestions.forEach(s => {
        if (!existingNames.includes(s.name.toLowerCase())) {
          results.push({ ...s, tagId, tags: [tagId] });
        }
      });
    });

    return results;
  };

  // ============================================================
  // DASHBOARD GREETING
  // ============================================================
  const getDashboardGreeting = () => {
    const hour = new Date().getHours();
    const goals = Store.getActiveGoals();
    const rates = goals.map(g => Store.completionRate(g.log, 7));
    const avgRate = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;

    let timeGreeting;
    if (hour < 5) timeGreeting = 'Night owl! 🌙';
    else if (hour < 12) timeGreeting = 'Good morning! ☀️';
    else if (hour < 17) timeGreeting = 'Good afternoon! 🌤️';
    else if (hour < 21) timeGreeting = 'Good evening! 🌅';
    else timeGreeting = 'Winding down? 🌙';

    const encouragement = getEncouragement({ type: 'morning', rate: avgRate });

    return { timeGreeting, encouragement, avgRate };
  };

  // ============================================================
  // RESET
  // ============================================================
  const reset = () => {
    localStorage.removeItem(KEY_AVATAR);
    localStorage.removeItem(KEY_CHALLENGES);
    localStorage.removeItem(KEY_COACH);
  };

  return {
    DEFAULT_AVATARS, getAvatar, setAvatar, renderAvatar,
    getEncouragement,
    generateChallenges, getChallenges,
    getSuggestions, SUGGESTIONS,
    getDashboardGreeting,
    reset
  };
})();
