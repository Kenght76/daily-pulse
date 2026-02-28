/* ============================================================
   reports.js — Weekly & Monthly Summary Reports
   Generates rich summaries of weight, goals, streaks, and trends.
   ============================================================ */

const Reports = (() => {

  // --- Date Helpers ---
  const dayKey = (d) => d.toISOString().split('T')[0];
  const daysBetween = (a, b) => Math.round((b - a) / 86400000);
  const startOfWeek = (d) => {
    const dt = new Date(d);
    dt.setDate(dt.getDate() - dt.getDay());
    dt.setHours(0, 0, 0, 0);
    return dt;
  };
  const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
  const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const formatRange = (start, end) => {
    const opts = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', opts)} — ${end.toLocaleDateString('en-US', opts)}`;
  };
  const formatMonth = (d) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // --- Data Gathering ---
  const gatherData = (startDate, endDate) => {
    const weights = Store.getWeights();
    const goals = Store.getActiveGoals();
    const allGoals = Store.getGoals();
    const start = dayKey(startDate);
    const end = dayKey(endDate);
    const numDays = daysBetween(startDate, endDate) + 1;

    // Filter weights in range
    const periodWeights = weights.filter(w => w.date >= start && w.date <= end);
    const startWeight = periodWeights.length ? periodWeights[0].weight : null;
    const endWeight = periodWeights.length ? periodWeights[periodWeights.length - 1].weight : null;
    const weightChange = (startWeight && endWeight) ? (endWeight - startWeight).toFixed(1) : null;
    const minWeight = periodWeights.length ? Math.min(...periodWeights.map(w => w.weight)) : null;
    const maxWeight = periodWeights.length ? Math.max(...periodWeights.map(w => w.weight)) : null;

    // Goal stats for the period
    const goalStats = allGoals.filter(g => g.active || Object.keys(g.log).some(k => k >= start && k <= end)).map(g => {
      let completed = 0;
      const d = new Date(startDate);
      while (d <= endDate) {
        if (g.log[dayKey(d)]) completed++;
        d.setDate(d.getDate() + 1);
      }
      const rate = Math.round((completed / numDays) * 100);

      // Daily breakdown for mini heatmap
      const daily = [];
      const d2 = new Date(startDate);
      while (d2 <= endDate) {
        daily.push({ date: dayKey(d2), done: !!g.log[dayKey(d2)] });
        d2.setDate(d2.getDate() + 1);
      }

      return {
        id: g.id, name: g.name, emoji: g.emoji, icon: g.icon,
        completed, total: numDays, rate, daily,
        streak: Store.calcStreak(g.log),
        longestStreak: Store.calcLongestStreak(g.log)
      };
    });

    // Overall completion
    const totalPossible = goalStats.length * numDays;
    const totalCompleted = goalStats.reduce((s, g) => s + g.completed, 0);
    const overallRate = totalPossible ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    // Best & worst days
    const dayScores = [];
    const d3 = new Date(startDate);
    while (d3 <= endDate) {
      const key = dayKey(d3);
      const done = goalStats.filter(g => g.daily.find(dd => dd.date === key && dd.done)).length;
      dayScores.push({ date: key, done, total: goalStats.length, pct: goalStats.length ? Math.round((done / goalStats.length) * 100) : 0 });
      d3.setDate(d3.getDate() + 1);
    }
    const bestDay = dayScores.reduce((best, d) => d.pct > best.pct ? d : best, dayScores[0]);
    const worstDay = dayScores.reduce((worst, d) => d.pct < worst.pct ? d : worst, dayScores[0]);

    // Perfect days (100% completion)
    const perfectDays = dayScores.filter(d => d.pct === 100).length;

    // Insights
    const insights = generateInsights({
      weightChange, periodWeights, goalStats, overallRate, perfectDays, numDays, bestDay, worstDay
    });

    return {
      startDate: start, endDate: end, numDays, range: formatRange(startDate, endDate),
      weights: { period: periodWeights, start: startWeight, end: endWeight, change: weightChange, min: minWeight, max: maxWeight },
      goals: goalStats,
      overall: { rate: overallRate, totalCompleted, totalPossible, perfectDays },
      dayScores, bestDay, worstDay, insights
    };
  };

  // --- Insight Generator ---
  const generateInsights = (data) => {
    const insights = [];
    const { weightChange, periodWeights, goalStats, overallRate, perfectDays, numDays, bestDay } = data;

    if (weightChange !== null) {
      const wc = parseFloat(weightChange);
      if (wc < -2) insights.push({ icon: '🔥', text: `You lost ${Math.abs(wc)} lbs this period! Keep it up!` });
      else if (wc < 0) insights.push({ icon: '📉', text: `Down ${Math.abs(wc)} lbs. Steady progress!` });
      else if (wc > 2) insights.push({ icon: '📈', text: `Up ${wc} lbs. Let's refocus this week.` });
      else if (wc > 0) insights.push({ icon: '⚖️', text: `Weight stayed relatively stable (${wc > 0 ? '+' : ''}${wc} lbs).` });
      else insights.push({ icon: '⚖️', text: 'Weight held perfectly steady!' });
    }

    if (overallRate >= 90) insights.push({ icon: '🌟', text: `Outstanding ${overallRate}% completion rate! You're crushing it!` });
    else if (overallRate >= 70) insights.push({ icon: '💪', text: `Solid ${overallRate}% completion. Strong consistency!` });
    else if (overallRate >= 50) insights.push({ icon: '📊', text: `${overallRate}% completion. Room to grow — focus on one goal at a time.` });
    else if (overallRate > 0) insights.push({ icon: '🌱', text: `${overallRate}% completion. Every check-in counts. Build momentum!` });

    if (perfectDays > 0) {
      insights.push({ icon: '⭐', text: `${perfectDays} perfect day${perfectDays > 1 ? 's' : ''} where you completed every goal!` });
    }

    // Top performing goal
    const topGoal = goalStats.sort((a, b) => b.rate - a.rate)[0];
    if (topGoal && topGoal.rate > 0) {
      insights.push({ icon: topGoal.emoji, text: `"${topGoal.name}" was your strongest goal at ${topGoal.rate}%.` });
    }

    // Struggling goal
    const weakGoal = goalStats.sort((a, b) => a.rate - b.rate)[0];
    if (weakGoal && weakGoal.rate < 50 && goalStats.length > 1) {
      insights.push({ icon: '🎯', text: `"${weakGoal.name}" needs attention at ${weakGoal.rate}%. Try pairing it with a stronger habit.` });
    }

    if (periodWeights.length >= 5) {
      insights.push({ icon: '📊', text: `You logged weight ${periodWeights.length} times. Consistent tracking drives results!` });
    } else if (periodWeights.length > 0) {
      insights.push({ icon: '📝', text: `Only ${periodWeights.length} weigh-in${periodWeights.length > 1 ? 's' : ''} this period. Try logging daily for better trends.` });
    }

    return insights;
  };

  // --- Render ---
  const render = (containerId, period = 'week') => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const now = new Date();
    let startDate, endDate;

    if (period === 'week') {
      endDate = new Date(now);
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
    } else {
      startDate = startOfMonth(now);
      endDate = new Date(now); // up to today, not end of month
    }

    const data = gatherData(startDate, endDate);

    container.innerHTML = `
      <!-- Report Header -->
      <div class="report-header">
        <div class="report-period">${period === 'week' ? 'Weekly' : 'Monthly'} Report</div>
        <div class="report-range">${data.range}</div>
      </div>

      <!-- Overall Score -->
      <div class="report-score-card">
        <div class="report-score-ring">${_circleProgress(data.overall.rate, 100)}</div>
        <div class="report-score-details">
          <div class="report-score-label">Overall Completion</div>
          <div class="report-score-meta">${data.overall.totalCompleted} of ${data.overall.totalPossible} check-ins</div>
          <div class="report-score-meta">${data.overall.perfectDays} perfect day${data.overall.perfectDays !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <!-- Weight Summary -->
      ${data.weights.period.length > 0 ? `
        <div class="report-section">
          <div class="report-section-title">⚖️ Weight Summary</div>
          <div class="report-weight-grid">
            <div class="report-weight-stat">
              <div class="report-weight-val">${data.weights.start || '—'}</div>
              <div class="report-weight-label">Start</div>
            </div>
            <div class="report-weight-stat">
              <div class="report-weight-val">${data.weights.end || '—'}</div>
              <div class="report-weight-label">End</div>
            </div>
            <div class="report-weight-stat">
              <div class="report-weight-val ${parseFloat(data.weights.change) < 0 ? 'positive' : parseFloat(data.weights.change) > 0 ? 'negative' : ''}">${data.weights.change > 0 ? '+' : ''}${data.weights.change || '—'}</div>
              <div class="report-weight-label">Change</div>
            </div>
            <div class="report-weight-stat">
              <div class="report-weight-val">${data.weights.min || '—'}</div>
              <div class="report-weight-label">Low</div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Goal Breakdown -->
      <div class="report-section">
        <div class="report-section-title">🎯 Goal Breakdown</div>
        <div id="report-goals-list"></div>
      </div>

      <!-- Heatmap -->
      <div class="report-section">
        <div class="report-section-title">📅 Daily Heatmap</div>
        <div class="report-heatmap" id="report-heatmap"></div>
      </div>

      <!-- Insights -->
      ${data.insights.length > 0 ? `
        <div class="report-section">
          <div class="report-section-title">💡 Insights</div>
          <div id="report-insights"></div>
        </div>
      ` : ''}
    `;

    // Render goal rows
    const goalsList = document.getElementById('report-goals-list');
    data.goals.forEach(g => {
      goalsList.innerHTML += `
        <div class="report-goal-row">
          <div class="report-goal-info">
            <span class="report-goal-emoji">${g.emoji}</span>
            <span class="report-goal-name">${g.name}</span>
          </div>
          <div class="report-goal-bar-wrap">
            <div class="report-goal-bar">
              <div class="report-goal-bar-fill" style="width:${g.rate}%"></div>
            </div>
            <span class="report-goal-rate">${g.rate}%</span>
          </div>
          <div class="report-goal-detail">${g.completed}/${g.total} days</div>
        </div>`;
    });

    // Render heatmap
    const heatmap = document.getElementById('report-heatmap');
    data.dayScores.forEach(d => {
      const intensity = d.pct === 100 ? 'full' : d.pct >= 66 ? 'high' : d.pct >= 33 ? 'mid' : d.pct > 0 ? 'low' : 'none';
      const dateObj = new Date(d.date + 'T12:00:00');
      const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });
      const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      heatmap.innerHTML += `
        <div class="heatmap-cell ${intensity}" title="${dateLabel}: ${d.pct}%">
          <div class="heatmap-day">${dayLabel}</div>
          <div class="heatmap-pct">${d.pct}%</div>
        </div>`;
    });

    // Render insights
    const insightsEl = document.getElementById('report-insights');
    if (insightsEl) {
      data.insights.forEach(ins => {
        insightsEl.innerHTML += `
          <div class="report-insight">
            <span class="report-insight-icon">${ins.icon}</span>
            <span class="report-insight-text">${ins.text}</span>
          </div>`;
      });
    }
  };

  // Mini circle progress for reports
  const _circleProgress = (pct, size = 80) => {
    const r = (size - 10) / 2;
    const c = 2 * Math.PI * r;
    const offset = c - (pct / 100) * c;
    return `
      <svg width="${size}" height="${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--border-color)" stroke-width="7"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--accent-primary)" stroke-width="7"
          stroke-dasharray="${c}" stroke-dashoffset="${offset}" stroke-linecap="round"
          transform="rotate(-90 ${size / 2} ${size / 2})" class="circle-progress-ring"/>
        <text x="${size / 2}" y="${size / 2}" text-anchor="middle" dominant-baseline="central"
          fill="var(--text-primary)" font-size="22" font-weight="800" font-family="var(--font-mono)">${pct}%</text>
      </svg>`;
  };

  return { render, gatherData };
})();
