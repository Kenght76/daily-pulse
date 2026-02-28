/* ============================================================
   templates.js — Habit Template Library
   Pre-built goal sets for quick setup
   ============================================================ */

const Templates = (() => {

  const LIBRARY = [
    {
      id: 'tpl_morning',
      name: 'Morning Routine',
      emoji: '🌅',
      desc: '5 goals to start your day right',
      goals: [
        { name: 'Wake Up Early',     emoji: '⏰', tools: ['check','timer'],   toolConfig: { timerLabel: 'Time awake' }, frequency: { type: 'daily' }, tags: ['tag_health'] },
        { name: 'Morning Stretch',   emoji: '🧘', tools: ['check','timer'],   toolConfig: { timerLabel: 'Stretch time' }, frequency: { type: 'daily' }, tags: ['tag_fitness'] },
        { name: 'Drink Water',       emoji: '💧', tools: ['check','counter'], toolConfig: { counterLabel: 'Glasses', counterGoal: 2 }, frequency: { type: 'daily' }, tags: ['tag_health'] },
        { name: 'Healthy Breakfast',  emoji: '🥣', tools: ['check','photo'],  frequency: { type: 'daily' }, tags: ['tag_health'] },
        { name: 'Set Daily Intention',emoji: '📝', tools: ['check','notes'],  frequency: { type: 'daily' }, tags: ['tag_mind'] }
      ]
    },
    {
      id: 'tpl_fitness',
      name: 'Fitness Journey',
      emoji: '💪',
      desc: '5 goals for physical wellness',
      goals: [
        { name: 'Workout',           emoji: '🏋️', tools: ['check','timer','rating'], toolConfig: { timerLabel: 'Workout time' }, frequency: { type: 'x_per_week', x: 4 }, tags: ['tag_fitness'] },
        { name: 'Steps (10k)',       emoji: '🚶', tools: ['check','number'],  toolConfig: { numberLabel: 'Steps', numberUnit: 'steps' }, frequency: { type: 'daily' }, tags: ['tag_fitness'] },
        { name: 'Drink Water',       emoji: '💧', tools: ['check','counter'], toolConfig: { counterLabel: 'Glasses', counterGoal: 8 }, frequency: { type: 'daily' }, tags: ['tag_health'] },
        { name: 'Protein Goal',      emoji: '🥩', tools: ['check','number'],  toolConfig: { numberLabel: 'Grams', numberUnit: 'g' }, frequency: { type: 'daily' }, tags: ['tag_health'] },
        { name: 'Rest Day Stretch',  emoji: '🧘', tools: ['check','timer'],   toolConfig: { timerLabel: 'Minutes' }, frequency: { type: 'x_per_week', x: 2 }, tags: ['tag_fitness'] }
      ]
    },
    {
      id: 'tpl_mindful',
      name: 'Mindfulness & Calm',
      emoji: '🧠',
      desc: '5 goals for mental wellness',
      goals: [
        { name: 'Meditate',          emoji: '🧘', tools: ['check','timer','rating'], toolConfig: { timerLabel: 'Session time' }, frequency: { type: 'daily' }, tags: ['tag_mind'] },
        { name: 'Gratitude Journal', emoji: '🙏', tools: ['check','notes'],  frequency: { type: 'daily' }, tags: ['tag_mind'] },
        { name: 'No Phone Before Bed',emoji: '📵', tools: ['check'],         frequency: { type: 'daily' }, tags: ['tag_mind'] },
        { name: 'Deep Breathing',    emoji: '🌬️', tools: ['check','counter'], toolConfig: { counterLabel: 'Sessions', counterGoal: 3 }, frequency: { type: 'daily' }, tags: ['tag_mind'] },
        { name: 'Read 20 Minutes',   emoji: '📚', tools: ['check','timer'],   toolConfig: { timerLabel: 'Reading time' }, frequency: { type: 'daily' }, tags: ['tag_personal'] }
      ]
    },
    {
      id: 'tpl_productivity',
      name: 'Productivity Power',
      emoji: '🚀',
      desc: '5 goals to get things done',
      goals: [
        { name: 'Top 3 Tasks',       emoji: '✅', tools: ['check','checklist'], checklist: [{id:'t1',name:'Task 1'},{id:'t2',name:'Task 2'},{id:'t3',name:'Task 3'}], frequency: { type: 'daily' }, tags: ['tag_work'] },
        { name: 'Deep Work Block',   emoji: '🎯', tools: ['check','timer'],   toolConfig: { timerLabel: 'Focus time' }, frequency: { type: 'daily' }, tags: ['tag_work'] },
        { name: 'Inbox Zero',        emoji: '📧', tools: ['check'],           frequency: { type: 'daily' }, tags: ['tag_work'] },
        { name: 'Learn Something New',emoji: '🧠', tools: ['check','notes'],  frequency: { type: 'x_per_week', x: 3 }, tags: ['tag_work'] },
        { name: 'Weekly Review',     emoji: '📋', tools: ['check','notes','rating'], frequency: { type: 'specific_days', days: [0] }, tags: ['tag_work'] }
      ]
    },
    {
      id: 'tpl_health',
      name: 'Health & Hygiene',
      emoji: '🏥',
      desc: '6 daily health habits',
      goals: [
        { name: 'Brush Teeth (AM)',  emoji: '🪥', tools: ['check'],           frequency: { type: 'daily' }, tags: ['tag_health'] },
        { name: 'Brush Teeth (PM)',  emoji: '🦷', tools: ['check'],           frequency: { type: 'daily' }, tags: ['tag_health'] },
        { name: 'Floss',             emoji: '🧵', tools: ['check'],           frequency: { type: 'daily' }, tags: ['tag_health'] },
        { name: 'Skincare Routine',  emoji: '🧴', tools: ['check','checklist'], checklist: [{id:'s1',name:'Cleanser'},{id:'s2',name:'Moisturizer'},{id:'s3',name:'Sunscreen'}], frequency: { type: 'daily' }, tags: ['tag_health'] },
        { name: 'Take Vitamins',     emoji: '💊', tools: ['check'],           frequency: { type: 'daily' }, tags: ['tag_health'] },
        { name: 'Cook at Home',      emoji: '🍳', tools: ['check','photo'],   frequency: { type: 'x_per_week', x: 5 }, tags: ['tag_health'] }
      ]
    },
    {
      id: 'tpl_creative',
      name: 'Creative Practice',
      emoji: '🎨',
      desc: '4 goals for creative growth',
      goals: [
        { name: 'Creative Time',     emoji: '🎨', tools: ['check','timer','photo'], toolConfig: { timerLabel: 'Create time' }, frequency: { type: 'daily' }, tags: ['tag_personal'] },
        { name: 'Write 500 Words',   emoji: '✍️', tools: ['check','number'],  toolConfig: { numberLabel: 'Words', numberUnit: 'words' }, frequency: { type: 'daily' }, tags: ['tag_personal'] },
        { name: 'Practice Instrument',emoji: '🎸', tools: ['check','timer'],  toolConfig: { timerLabel: 'Practice' }, frequency: { type: 'x_per_week', x: 5 }, tags: ['tag_personal'] },
        { name: 'Share My Work',     emoji: '📤', tools: ['check','notes'],   frequency: { type: 'x_per_week', x: 1 }, tags: ['tag_personal'] }
      ]
    },
    {
      id: 'tpl_finance',
      name: 'Financial Wellness',
      emoji: '💰',
      desc: '4 money management habits',
      goals: [
        { name: 'Track Spending',    emoji: '📊', tools: ['check','number'],  toolConfig: { numberLabel: 'Spent', numberUnit: '$' }, frequency: { type: 'daily' }, tags: ['tag_finance'] },
        { name: 'No Impulse Buys',   emoji: '🛑', tools: ['check','notes'],   frequency: { type: 'daily' }, tags: ['tag_finance'] },
        { name: 'Save Something',    emoji: '🐷', tools: ['check','number'],  toolConfig: { numberLabel: 'Saved', numberUnit: '$' }, frequency: { type: 'x_per_week', x: 1 }, tags: ['tag_finance'] },
        { name: 'Budget Review',     emoji: '📋', tools: ['check','rating'],  frequency: { type: 'specific_days', days: [0] }, tags: ['tag_finance'] }
      ]
    },
    {
      id: 'tpl_sleep',
      name: 'Better Sleep',
      emoji: '😴',
      desc: '4 goals for quality sleep',
      goals: [
        { name: 'In Bed by 10:30',   emoji: '🛏️', tools: ['check'],           frequency: { type: 'daily' }, tags: ['tag_health'] },
        { name: 'No Caffeine After 2',emoji: '☕', tools: ['check'],           frequency: { type: 'daily' }, tags: ['tag_health'] },
        { name: 'No Screens 1hr Before',emoji: '📵', tools: ['check'],        frequency: { type: 'daily' }, tags: ['tag_mind'] },
        { name: 'Wind-Down Routine', emoji: '🌙', tools: ['check','checklist'], checklist: [{id:'w1',name:'Dim lights'},{id:'w2',name:'Read or journal'},{id:'w3',name:'Herbal tea'}], frequency: { type: 'daily' }, tags: ['tag_health'] }
      ]
    }
  ];

  // Apply a template: add all its goals to the store
  const apply = (templateId) => {
    const tpl = LIBRARY.find(t => t.id === templateId);
    if (!tpl) return { added: 0, skipped: 0 };

    let added = 0, skipped = 0;
    const existingNames = Store.getActiveGoals().map(g => g.name.toLowerCase());

    tpl.goals.forEach(g => {
      // Skip if a goal with same name already exists
      if (existingNames.includes(g.name.toLowerCase())) { skipped++; return; }

      const success = Store.addGoal({
        name: g.name,
        emoji: g.emoji,
        icon: 'goal-star',
        customIcon: null,
        tools: g.tools || ['check'],
        toolConfig: g.toolConfig || {},
        checklist: g.checklist || [],
        frequency: g.frequency || { type: 'daily' },
        tags: g.tags || []
      });

      if (success) added++;
      else skipped++;
    });

    return { added, skipped };
  };

  return { LIBRARY, apply };
})();
