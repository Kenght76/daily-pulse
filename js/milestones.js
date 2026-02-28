/* ============================================================
   milestones.js — Badge & Milestone Definitions + Unlock Logic
   ============================================================ */

const Milestones = (() => {

  const WEIGHT = [
    { id: 'w5',   lbs: 5,   label: '5 lbs Lost',   tier: 'Bronze',   badge: 'public/badges/weight-5.png',   emoji: '🥉' },
    { id: 'w10',  lbs: 10,  label: '10 lbs Lost',  tier: 'Silver',   badge: 'public/badges/weight-10.png',  emoji: '🥈' },
    { id: 'w15',  lbs: 15,  label: '15 lbs Lost',  tier: 'Gold',     badge: 'public/badges/weight-15.png',  emoji: '🏅' },
    { id: 'w20',  lbs: 20,  label: '20 lbs Lost',  tier: 'Gold',     badge: 'public/badges/weight-20.png',  emoji: '🏆' },
    { id: 'w25',  lbs: 25,  label: '25 lbs Lost',  tier: 'Platinum', badge: 'public/badges/weight-25.png',  emoji: '💎' },
    { id: 'w30',  lbs: 30,  label: '30 lbs Lost',  tier: 'Platinum', badge: 'public/badges/weight-30.png',  emoji: '💎' },
    { id: 'w40',  lbs: 40,  label: '40 lbs Lost',  tier: 'Diamond',  badge: 'public/badges/weight-40.png',  emoji: '👑' },
    { id: 'w50',  lbs: 50,  label: '50 lbs Lost',  tier: 'Diamond',  badge: 'public/badges/weight-50.png',  emoji: '👑' },
    { id: 'w75',  lbs: 75,  label: '75 lbs Lost',  tier: 'Legend',   badge: 'public/badges/weight-75.png',  emoji: '🌟' },
    { id: 'w100', lbs: 100, label: '100 lbs Lost', tier: 'Legend',   badge: 'public/badges/weight-100.png', emoji: '🌟' }
  ];

  const STREAK = [
    { id: 's3',   days: 3,   label: '3-Day Streak',     badge: 'public/badges/streak-3.png',   emoji: '🔥' },
    { id: 's7',   days: 7,   label: '1-Week Streak',    badge: 'public/badges/streak-7.png',   emoji: '🔥' },
    { id: 's14',  days: 14,  label: '2-Week Streak',    badge: 'public/badges/streak-14.png',  emoji: '⚡' },
    { id: 's21',  days: 21,  label: '21-Day Habit',     badge: 'public/badges/streak-21.png',  emoji: '⚡' },
    { id: 's30',  days: 30,  label: '30-Day Warrior',   badge: 'public/badges/streak-30.png',  emoji: '💪' },
    { id: 's60',  days: 60,  label: '60-Day Champion',  badge: 'public/badges/streak-60.png',  emoji: '🏆' },
    { id: 's90',  days: 90,  label: '90-Day Legend',     badge: 'public/badges/streak-90.png',  emoji: '👑' },
    { id: 's180', days: 180, label: 'Half-Year Hero',   badge: 'public/badges/streak-180.png', emoji: '🌟' },
    { id: 's365', days: 365, label: 'Year-Long Titan',  badge: 'public/badges/streak-365.png', emoji: '💎' }
  ];

  // Check all milestones and return newly unlocked ones
  const checkAll = () => {
    const newlyUnlocked = [];
    const weights = Store.getWeights();
    const goals = Store.getActiveGoals();

    // Weight milestones
    if (weights.length >= 2) {
      const start = weights[0].weight;
      const current = weights[weights.length - 1].weight;
      const lost = Math.max(0, start - current);
      WEIGHT.forEach(m => {
        if (lost >= m.lbs && Store.unlockMilestone(m.id)) {
          newlyUnlocked.push(m);
        }
      });
    }

    // Streak milestones
    const streaks = goals.map(g => Store.calcLongestStreak(g.log));
    const maxStreak = streaks.length ? Math.max(...streaks) : 0;
    STREAK.forEach(m => {
      if (maxStreak >= m.days && Store.unlockMilestone(m.id)) {
        newlyUnlocked.push(m);
      }
    });

    return newlyUnlocked;
  };

  const isUnlocked = (id) => Store.getUnlockedMilestones().includes(id);

  return { WEIGHT, STREAK, checkAll, isUnlocked };
})();
