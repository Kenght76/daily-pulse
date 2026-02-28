/* ============================================================
   reminders.js — Reminder System
   Push notifications when permitted, in-app alerts as fallback.
   
   Triggers:
   1. Specific time per goal (user-set)
   2. Daily check-in nudge (if nothing logged today)
   3. Streak at risk warning (evening if streak would break)
   4. Weekly report ready (Sunday evening)
   ============================================================ */

const Reminders = (() => {

  const STORAGE_KEY = 'dp_reminders';
  const CHECK_INTERVAL = 60000; // Check every 60 seconds
  let _intervalId = null;
  let _notificationPermission = 'default';
  let _pendingAlerts = []; // In-app alerts queue

  // ── Data ────────────────────────────────────────────────────

  const getReminders = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : getDefaults();
    } catch { return getDefaults(); }
  };

  const saveReminders = (data) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  };

  const getDefaults = () => ({
    enabled: true,
    goalReminders: {},       // { goalId: { enabled: true, time: "21:00" } }
    dailyCheckin: {
      enabled: true,
      time: "20:00"          // 8pm default nudge
    },
    streakWarning: {
      enabled: true,
      time: "21:30"          // 9:30pm streak warning
    },
    weeklyReport: {
      enabled: true,
      day: 0,                // 0 = Sunday
      time: "18:00"          // 6pm Sunday
    },
    lastFired: {},           // { "type:key:date": timestamp } — prevents duplicate firing
    dismissed: []            // In-app alerts the user dismissed today
  });

  // ── Permission ─────────────────────────────────────────────

  const requestPermission = async () => {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'granted') {
      _notificationPermission = 'granted';
      return 'granted';
    }
    if (Notification.permission === 'denied') {
      _notificationPermission = 'denied';
      return 'denied';
    }
    const result = await Notification.requestPermission();
    _notificationPermission = result;
    return result;
  };

  const canPush = () => {
    return 'Notification' in window && Notification.permission === 'granted';
  };

  // ── Send Notification ──────────────────────────────────────

  const sendPush = (title, body, tag) => {
    if (!canPush()) return false;
    try {
      const reg = navigator.serviceWorker?.ready;
      if (reg) {
        reg.then(sw => {
          sw.showNotification(title, {
            body,
            tag,
            icon: 'public/icons/logo.png',
            badge: 'public/icons/logo.png',
            vibrate: [100, 50, 100],
            requireInteraction: false,
            silent: false
          });
        });
      } else {
        new Notification(title, { body, tag, icon: 'public/icons/logo.png' });
      }
      return true;
    } catch {
      return false;
    }
  };

  const sendInApp = (title, body, type, icon) => {
    _pendingAlerts.push({ title, body, type, icon: icon || '🔔', id: Date.now() });
  };

  const send = (title, body, tag, icon) => {
    if (!sendPush(title, body, tag)) {
      sendInApp(title, body, tag, icon);
    }
  };

  // ── Fire Key (prevents duplicates) ─────────────────────────

  const today = () => new Date().toISOString().split('T')[0];

  const fireKey = (type, extra) => `${type}:${extra || ''}:${today()}`;

  const hasFired = (key) => {
    const data = getReminders();
    return !!data.lastFired[key];
  };

  const markFired = (key) => {
    const data = getReminders();
    data.lastFired[key] = Date.now();
    // Clean old entries (older than 2 days)
    const cutoff = Date.now() - 172800000;
    Object.keys(data.lastFired).forEach(k => {
      if (data.lastFired[k] < cutoff) delete data.lastFired[k];
    });
    saveReminders(data);
  };

  // ── Time Check Helper ──────────────────────────────────────

  const isTimeNow = (timeStr) => {
    if (!timeStr) return false;
    const now = new Date();
    const [h, m] = timeStr.split(':').map(Number);
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const targetMins = h * 60 + m;
    // Within a 2-minute window
    return nowMins >= targetMins && nowMins < targetMins + 2;
  };

  // ── Check All Triggers ─────────────────────────────────────

  const checkAll = () => {
    const data = getReminders();
    if (!data.enabled) return;

    const todayStr = today();
    const now = new Date();
    const goals = Store.getActiveGoals();

    // 1. Goal-specific time reminders
    goals.forEach(g => {
      const gr = data.goalReminders[g.id];
      if (gr && gr.enabled && gr.time) {
        const key = fireKey('goal', g.id);
        if (!hasFired(key) && isTimeNow(gr.time) && !g.log[todayStr]) {
          send(
            `Time for: ${g.name}`,
            `Don't forget to ${g.name.toLowerCase()} today!`,
            `goal-${g.id}`,
            g.emoji
          );
          markFired(key);
        }
      }
    });

    // 2. Daily check-in nudge
    if (data.dailyCheckin.enabled) {
      const key = fireKey('checkin', '');
      if (!hasFired(key) && isTimeNow(data.dailyCheckin.time)) {
        const todayDone = goals.filter(g => g.log[todayStr]).length;
        if (todayDone === 0) {
          send(
            "Daily Check-in Reminder",
            "You haven't checked in any goals today. Open Daily Pulse to stay on track!",
            'daily-checkin',
            '📋'
          );
          markFired(key);
        } else if (todayDone < goals.length) {
          send(
            "Almost Done!",
            `You've completed ${todayDone} of ${goals.length} goals today. Finish strong!`,
            'daily-checkin',
            '💪'
          );
          markFired(key);
        }
      }
    }

    // 3. Streak at risk warning
    if (data.streakWarning.enabled) {
      const key = fireKey('streak', '');
      if (!hasFired(key) && isTimeNow(data.streakWarning.time)) {
        const atRisk = goals.filter(g => {
          const streak = Store.calcStreak(g.log);
          return streak >= 3 && !g.log[todayStr]; // 3+ day streak at risk
        });
        if (atRisk.length > 0) {
          const names = atRisk.map(g => g.name).slice(0, 3).join(', ');
          send(
            "🔥 Streak at Risk!",
            `Your streak for ${names} will break if you don't check in today!`,
            'streak-warning',
            '🔥'
          );
          markFired(key);
        }
      }
    }

    // 4. Weekly report (Sunday)
    if (data.weeklyReport.enabled && now.getDay() === data.weeklyReport.day) {
      const key = fireKey('weekly', '');
      if (!hasFired(key) && isTimeNow(data.weeklyReport.time)) {
        send(
          "📊 Weekly Report Ready",
          "Your weekly progress report is ready! Open Daily Pulse to see your summary.",
          'weekly-report',
          '📊'
        );
        markFired(key);
      }
    }
  };

  // ── On App Open Checks ─────────────────────────────────────
  // These fire when user opens the app (in-app alerts)

  const checkOnOpen = () => {
    const data = getReminders();
    if (!data.enabled) return;

    const todayStr = today();
    const goals = Store.getActiveGoals();
    _pendingAlerts = [];

    // Reset dismissed list if it's a new day
    const lastDismissDate = localStorage.getItem('dp_dismiss_date');
    if (lastDismissDate !== todayStr) {
      data.dismissed = [];
      saveReminders(data);
      localStorage.setItem('dp_dismiss_date', todayStr);
    }

    // Check-in reminder (if it's afternoon and nothing logged)
    const hour = new Date().getHours();
    if (hour >= 12) {
      const todayDone = goals.filter(g => g.log[todayStr]).length;
      if (todayDone === 0 && !data.dismissed.includes('checkin-' + todayStr)) {
        _pendingAlerts.push({
          id: 'checkin-' + todayStr,
          icon: '📋',
          title: "You haven't checked in today",
          body: `You have ${goals.length} goals waiting. Let's get some done!`,
          type: 'checkin'
        });
      }
    }

    // Streak warnings
    goals.forEach(g => {
      const streak = Store.calcStreak(g.log);
      const dismissKey = 'streak-' + g.id + '-' + todayStr;
      if (streak >= 3 && !g.log[todayStr] && hour >= 14 && !data.dismissed.includes(dismissKey)) {
        _pendingAlerts.push({
          id: dismissKey,
          icon: '🔥',
          title: `${streak}-day streak at risk!`,
          body: `Complete "${g.name}" today to keep your streak alive.`,
          type: 'streak'
        });
      }
    });

    // Weekly report ready (if it's Sunday)
    if (new Date().getDay() === 0 && hour >= 10 && !data.dismissed.includes('weekly-' + todayStr)) {
      _pendingAlerts.push({
        id: 'weekly-' + todayStr,
        icon: '📊',
        title: 'Weekly Report Ready',
        body: 'Check out your progress this week in the Stats tab.',
        type: 'weekly'
      });
    }
  };

  const getPendingAlerts = () => [..._pendingAlerts];

  const dismissAlert = (id) => {
    _pendingAlerts = _pendingAlerts.filter(a => a.id !== id);
    const data = getReminders();
    if (!data.dismissed.includes(id)) {
      data.dismissed.push(id);
      saveReminders(data);
    }
  };

  // ── Goal Reminder CRUD ─────────────────────────────────────

  const setGoalReminder = (goalId, enabled, time) => {
    const data = getReminders();
    data.goalReminders[goalId] = { enabled, time: time || '21:00' };
    saveReminders(data);
  };

  const getGoalReminder = (goalId) => {
    const data = getReminders();
    return data.goalReminders[goalId] || { enabled: false, time: '21:00' };
  };

  const updateSetting = (key, value) => {
    const data = getReminders();
    if (typeof value === 'object' && data[key]) {
      data[key] = { ...data[key], ...value };
    } else {
      data[key] = value;
    }
    saveReminders(data);
  };

  // ── Start / Stop ───────────────────────────────────────────

  const start = () => {
    _notificationPermission = 'Notification' in window ? Notification.permission : 'denied';

    // Check on open
    checkOnOpen();

    // Start periodic checking
    if (_intervalId) clearInterval(_intervalId);
    _intervalId = setInterval(checkAll, CHECK_INTERVAL);

    // Also check immediately
    checkAll();
  };

  const stop = () => {
    if (_intervalId) {
      clearInterval(_intervalId);
      _intervalId = null;
    }
  };

  // ── Exports ────────────────────────────────────────────────

  return {
    start, stop, requestPermission, canPush,
    getReminders, saveReminders, getDefaults,
    setGoalReminder, getGoalReminder, updateSetting,
    getPendingAlerts, dismissAlert, checkOnOpen
  };
})();
