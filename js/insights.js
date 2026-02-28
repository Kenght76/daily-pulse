/* ============================================================
   insights.js — Correlations & Insights Engine
   Analyzes data across goals, sleep, weight, ratings, and 
   time patterns to surface actionable insights.
   ============================================================ */

const Insights = (() => {

  // Minimum data points needed for a meaningful correlation
  const MIN_DAYS = 7;

  // ============================================================
  // HELPERS
  // ============================================================
  const dayName = i => ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][i];
  const dayShort = i => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i];
  const pct = (n, d) => d > 0 ? Math.round((n / d) * 100) : 0;

  // Get last N days as date strings
  const lastNDays = (n) => {
    const days = [];
    const d = new Date();
    for (let i = 0; i < n; i++) {
      days.push(d.toISOString().split('T')[0]);
      d.setDate(d.getDate() - 1);
    }
    return days;
  };

  // Average of array
  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  // ============================================================
  // CORE ANALYSIS: Generate all insights
  // ============================================================
  const analyze = (days = 30) => {
    const results = [];
    const goals = Store.getActiveGoals();
    const weights = Store.getWeights();
    const sleepLogs = Store.getSleepLogs();
    const dates = lastNDays(days);

    if (goals.length === 0 || dates.length < MIN_DAYS) {
      results.push({ type: 'info', icon: '📊', title: 'Not enough data yet', body: `Keep tracking for at least ${MIN_DAYS} days to see insights.`, priority: 0 });
      return results;
    }

    // Build daily data map: { date: { goals: {id: bool}, sleep: {}, weight: num, ratings: {id: num}, timestamps: {id: time} } }
    const daily = {};
    dates.forEach(date => {
      daily[date] = {
        goals: {},
        sleep: sleepLogs.find(s => s.date === date) || null,
        weight: weights.find(w => w.date === date)?.weight || null,
        ratings: {},
        timestamps: {}
      };
      goals.forEach(g => {
        daily[date].goals[g.id] = !!g.log[date];
        const td = Store.getToolData(g.id, date);
        if (td.rating) daily[date].ratings[g.id] = td.rating;
        if (td.timestamp) daily[date].timestamps[g.id] = td.timestamp;
      });
    });

    // --- 1. Day-of-Week Patterns ---
    results.push(...analyzeDayOfWeek(goals, daily, dates));

    // --- 2. Goal ↔ Sleep Correlations ---
    results.push(...analyzeGoalSleep(goals, daily, dates));

    // --- 3. Goal ↔ Weight Correlations ---
    results.push(...analyzeGoalWeight(goals, daily, dates, weights));

    // --- 4. Goal ↔ Goal Correlations ---
    results.push(...analyzeGoalGoal(goals, daily, dates));

    // --- 5. Goal ↔ Rating ---
    results.push(...analyzeGoalRating(goals, daily, dates));

    // --- 6. Streak Patterns ---
    results.push(...analyzeStreakPatterns(goals));

    // --- 7. Completion Trends ---
    results.push(...analyzeCompletionTrends(goals, daily, dates));

    // --- 8. Timestamp Patterns ---
    results.push(...analyzeTimestamps(goals, dates));

    // Sort by priority (higher = more interesting)
    results.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return results;
  };

  // ============================================================
  // 1. DAY-OF-WEEK PATTERNS
  // ============================================================
  const analyzeDayOfWeek = (goals, daily, dates) => {
    const results = [];
    const dayCompletions = [0, 0, 0, 0, 0, 0, 0]; // sum of completion rates per day
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];

    dates.forEach(date => {
      const dow = new Date(date + 'T12:00:00').getDay();
      const done = goals.filter(g => daily[date].goals[g.id]).length;
      const total = goals.length;
      dayCompletions[dow] += done / total;
      dayCounts[dow]++;
    });

    const dayRates = dayCompletions.map((sum, i) => dayCounts[i] > 0 ? Math.round((sum / dayCounts[i]) * 100) : 0);
    const bestDay = dayRates.indexOf(Math.max(...dayRates));
    const worstDay = dayRates.indexOf(Math.min(...dayRates));

    if (dayRates[bestDay] - dayRates[worstDay] >= 15) {
      results.push({
        type: 'pattern', icon: '📅', priority: 7,
        title: `${dayName(bestDay)}s are your best day`,
        body: `${dayRates[bestDay]}% completion on ${dayName(bestDay)}s vs ${dayRates[worstDay]}% on ${dayName(worstDay)}s. A ${dayRates[bestDay] - dayRates[worstDay]} point difference.`,
        data: { dayRates, bestDay, worstDay }
      });
    }

    // Find consistently skipped day
    if (dayRates[worstDay] < 40 && dayCounts[worstDay] >= 3) {
      results.push({
        type: 'warning', icon: '⚠️', priority: 6,
        title: `${dayName(worstDay)}s are a weak spot`,
        body: `Only ${dayRates[worstDay]}% completion on ${dayName(worstDay)}s. Consider lighter goals or a reminder for that day.`
      });
    }

    return results;
  };

  // ============================================================
  // 2. GOAL ↔ SLEEP
  // ============================================================
  const analyzeGoalSleep = (goals, daily, dates) => {
    const results = [];
    const sleepDates = dates.filter(d => daily[d].sleep && daily[d].sleep.hours > 0);
    if (sleepDates.length < MIN_DAYS) return results;

    goals.forEach(g => {
      const doneNights = sleepDates.filter(d => daily[d].goals[g.id]).map(d => daily[d].sleep.hours);
      const skippedNights = sleepDates.filter(d => !daily[d].goals[g.id]).map(d => daily[d].sleep.hours);

      if (doneNights.length >= 3 && skippedNights.length >= 3) {
        const avgDone = avg(doneNights);
        const avgSkipped = avg(skippedNights);
        const diff = avgDone - avgSkipped;

        if (Math.abs(diff) >= 0.3) {
          results.push({
            type: 'correlation', icon: '😴', priority: 8,
            title: diff > 0
              ? `You sleep ${diff.toFixed(1)} hrs more on "${g.name}" days`
              : `You sleep ${Math.abs(diff).toFixed(1)} hrs less on "${g.name}" days`,
            body: `Avg ${avgDone.toFixed(1)}h when you do it vs ${avgSkipped.toFixed(1)}h when you don't.`,
            goalId: g.id
          });
        }
      }

      // Sleep quality correlation
      const doneQuality = sleepDates.filter(d => daily[d].goals[g.id] && daily[d].sleep.quality > 0).map(d => daily[d].sleep.quality);
      const skipQuality = sleepDates.filter(d => !daily[d].goals[g.id] && daily[d].sleep.quality > 0).map(d => daily[d].sleep.quality);

      if (doneQuality.length >= 3 && skipQuality.length >= 3) {
        const qDiff = avg(doneQuality) - avg(skipQuality);
        if (Math.abs(qDiff) >= 0.5) {
          results.push({
            type: 'correlation', icon: '⭐', priority: 7,
            title: qDiff > 0
              ? `Sleep quality is ${qDiff.toFixed(1)} stars higher on "${g.name}" days`
              : `Sleep quality drops ${Math.abs(qDiff).toFixed(1)} stars on "${g.name}" days`,
            body: `${avg(doneQuality).toFixed(1)}⭐ vs ${avg(skipQuality).toFixed(1)}⭐ average quality.`,
            goalId: g.id
          });
        }
      }
    });

    return results;
  };

  // ============================================================
  // 3. GOAL ↔ WEIGHT
  // ============================================================
  const analyzeGoalWeight = (goals, daily, dates, weights) => {
    const results = [];
    if (weights.length < MIN_DAYS) return results;

    // Weekly analysis: compare weight change in high-completion vs low-completion weeks
    const weeks = [];
    for (let i = 0; i < dates.length; i += 7) {
      const weekDates = dates.slice(i, i + 7);
      if (weekDates.length < 5) continue;
      const weekWeights = weekDates.map(d => daily[d].weight).filter(Boolean);
      if (weekWeights.length < 2) continue;

      const completionRate = weekDates.reduce((sum, d) => {
        const done = goals.filter(g => daily[d].goals[g.id]).length;
        return sum + (done / goals.length);
      }, 0) / weekDates.length;

      const weightChange = weekWeights[weekWeights.length - 1] - weekWeights[0];
      weeks.push({ completionRate, weightChange });
    }

    if (weeks.length >= 3) {
      const sorted = [...weeks].sort((a, b) => b.completionRate - a.completionRate);
      const topHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
      const bottomHalf = sorted.slice(Math.ceil(sorted.length / 2));

      const topAvgChange = avg(topHalf.map(w => w.weightChange));
      const bottomAvgChange = avg(bottomHalf.map(w => w.weightChange));

      if (Math.abs(topAvgChange - bottomAvgChange) >= 0.3) {
        results.push({
          type: 'correlation', icon: '⚖️', priority: 9,
          title: topAvgChange < bottomAvgChange
            ? 'High-completion weeks = more weight loss'
            : 'Completion rate doesn\'t strongly predict weight change',
          body: `High-effort weeks: ${topAvgChange > 0 ? '+' : ''}${topAvgChange.toFixed(1)} lbs avg. Low-effort weeks: ${bottomAvgChange > 0 ? '+' : ''}${bottomAvgChange.toFixed(1)} lbs avg.`
        });
      }
    }

    return results;
  };

  // ============================================================
  // 4. GOAL ↔ GOAL
  // ============================================================
  const analyzeGoalGoal = (goals, daily, dates) => {
    const results = [];
    if (goals.length < 2) return results;

    for (let i = 0; i < goals.length; i++) {
      for (let j = i + 1; j < goals.length; j++) {
        const g1 = goals[i], g2 = goals[j];
        let both = 0, g1Only = 0, g2Only = 0, neither = 0;

        dates.forEach(d => {
          const d1 = daily[d].goals[g1.id], d2 = daily[d].goals[g2.id];
          if (d1 && d2) both++;
          else if (d1) g1Only++;
          else if (d2) g2Only++;
          else neither++;
        });

        const total = both + g1Only + g2Only + neither;
        if (total < MIN_DAYS) continue;

        // Co-occurrence rate
        const coRate = pct(both, both + g1Only + g2Only + neither);
        const g1Rate = pct(both + g1Only, total);
        const g2Rate = pct(both + g2Only, total);

        // If one predicts the other significantly
        const g2WhenG1 = (both + g1Only) > 0 ? pct(both, both + g1Only) : 0;
        const g2WhenNoG1 = (g2Only + neither) > 0 ? pct(g2Only, g2Only + neither) : 0;

        if (g2WhenG1 - g2WhenNoG1 >= 25) {
          results.push({
            type: 'correlation', icon: '🔗', priority: 6,
            title: `"${g1.name}" predicts "${g2.name}"`,
            body: `When you do ${g1.name}, you complete ${g2.name} ${g2WhenG1}% of the time vs ${g2WhenNoG1}% when you skip it.`
          });
        }
      }
    }

    return results;
  };

  // ============================================================
  // 5. GOAL ↔ RATING
  // ============================================================
  const analyzeGoalRating = (goals, daily, dates) => {
    const results = [];

    // Find goals with rating tool
    const ratingGoals = goals.filter(g => (g.tools || []).includes('rating'));

    // For each rated goal, compare other goals' completion on high vs low rating days
    ratingGoals.forEach(rg => {
      const ratedDates = dates.filter(d => daily[d].ratings[rg.id]);
      if (ratedDates.length < MIN_DAYS) return;

      const avgRating = avg(ratedDates.map(d => daily[d].ratings[rg.id]));

      goals.forEach(g => {
        if (g.id === rg.id) return;
        const highDays = ratedDates.filter(d => daily[d].ratings[rg.id] >= 4);
        const lowDays = ratedDates.filter(d => daily[d].ratings[rg.id] <= 2);

        if (highDays.length >= 3 && lowDays.length >= 3) {
          const highComplete = pct(highDays.filter(d => daily[d].goals[g.id]).length, highDays.length);
          const lowComplete = pct(lowDays.filter(d => daily[d].goals[g.id]).length, lowDays.length);

          if (highComplete - lowComplete >= 20) {
            results.push({
              type: 'correlation', icon: '⭐', priority: 7,
              title: `High "${rg.name}" ratings → more "${g.name}"`,
              body: `You complete ${g.name} ${highComplete}% on high-rating days vs ${lowComplete}% on low-rating days.`
            });
          }
        }
      });
    });

    // Overall: does completing more goals predict higher ratings?
    ratingGoals.forEach(rg => {
      const ratedDates = dates.filter(d => daily[d].ratings[rg.id]);
      if (ratedDates.length < MIN_DAYS) return;

      const highCompDays = ratedDates.filter(d => {
        const done = goals.filter(g => daily[d].goals[g.id]).length;
        return done >= goals.length * 0.7;
      });
      const lowCompDays = ratedDates.filter(d => {
        const done = goals.filter(g => daily[d].goals[g.id]).length;
        return done <= goals.length * 0.3;
      });

      if (highCompDays.length >= 3 && lowCompDays.length >= 3) {
        const highAvg = avg(highCompDays.map(d => daily[d].ratings[rg.id]));
        const lowAvg = avg(lowCompDays.map(d => daily[d].ratings[rg.id]));
        const diff = highAvg - lowAvg;

        if (diff >= 0.5) {
          results.push({
            type: 'correlation', icon: '📈', priority: 8,
            title: `Productive days = higher "${rg.name}" rating`,
            body: `${highAvg.toFixed(1)}⭐ on productive days vs ${lowAvg.toFixed(1)}⭐ on low-effort days. A ${diff.toFixed(1)} star difference.`
          });
        }
      }
    });

    return results;
  };

  // ============================================================
  // 6. STREAK PATTERNS
  // ============================================================
  const analyzeStreakPatterns = (goals) => {
    const results = [];

    goals.forEach(g => {
      const logDates = Object.keys(g.log).filter(k => g.log[k]).sort();
      if (logDates.length < MIN_DAYS) return;

      // Find streak break days (day after a streak ends)
      const breakDays = [0, 0, 0, 0, 0, 0, 0];
      const startDays = [0, 0, 0, 0, 0, 0, 0];

      for (let i = 1; i < logDates.length; i++) {
        const prev = new Date(logDates[i - 1] + 'T12:00:00');
        const curr = new Date(logDates[i] + 'T12:00:00');
        const gap = (curr - prev) / 86400000;

        if (gap > 1) {
          // Streak broke on the day after prev
          const breakDate = new Date(prev);
          breakDate.setDate(breakDate.getDate() + 1);
          breakDays[breakDate.getDay()]++;

          // New streak started on curr
          startDays[curr.getDay()]++;
        }
      }

      const totalBreaks = breakDays.reduce((a, b) => a + b, 0);
      if (totalBreaks >= 3) {
        const worstBreakDay = breakDays.indexOf(Math.max(...breakDays));
        const breakPct = pct(breakDays[worstBreakDay], totalBreaks);

        if (breakPct >= 30) {
          results.push({
            type: 'pattern', icon: '💔', priority: 5,
            title: `"${g.name}" streaks break most on ${dayName(worstBreakDay)}s`,
            body: `${breakPct}% of streak breaks happen on ${dayName(worstBreakDay)}s. Set an extra reminder?`
          });
        }
      }

      const totalStarts = startDays.reduce((a, b) => a + b, 0);
      if (totalStarts >= 3) {
        const bestStartDay = startDays.indexOf(Math.max(...startDays));
        const startPct = pct(startDays[bestStartDay], totalStarts);

        if (startPct >= 30) {
          results.push({
            type: 'pattern', icon: '🚀', priority: 4,
            title: `"${g.name}" streaks tend to start on ${dayName(bestStartDay)}s`,
            body: `${startPct}% of your new streaks begin on ${dayName(bestStartDay)}s. Great day for a fresh start!`
          });
        }
      }
    });

    return results;
  };

  // ============================================================
  // 7. COMPLETION TRENDS (improving or declining?)
  // ============================================================
  const analyzeCompletionTrends = (goals, daily, dates) => {
    const results = [];
    if (dates.length < 14) return results;

    // Compare first half vs second half
    const mid = Math.floor(dates.length / 2);
    const firstHalf = dates.slice(mid); // older (dates are newest-first)
    const secondHalf = dates.slice(0, mid); // newer

    const rateForPeriod = (period) => {
      let total = 0, done = 0;
      period.forEach(d => {
        goals.forEach(g => { total++; if (daily[d].goals[g.id]) done++; });
      });
      return total > 0 ? (done / total) * 100 : 0;
    };

    const firstRate = rateForPeriod(firstHalf);
    const secondRate = rateForPeriod(secondHalf);
    const change = secondRate - firstRate;

    if (Math.abs(change) >= 8) {
      results.push({
        type: change > 0 ? 'positive' : 'warning',
        icon: change > 0 ? '📈' : '📉',
        priority: 8,
        title: change > 0 ? 'You\'re improving!' : 'Completion is declining',
        body: change > 0
          ? `Up ${change.toFixed(0)}% over the last ${dates.length} days (${firstRate.toFixed(0)}% → ${secondRate.toFixed(0)}%). Keep it up!`
          : `Down ${Math.abs(change).toFixed(0)}% recently (${firstRate.toFixed(0)}% → ${secondRate.toFixed(0)}%). Consider simplifying your goals?`
      });
    }

    // Per-goal trends
    goals.forEach(g => {
      const first = firstHalf.filter(d => daily[d].goals[g.id]).length / firstHalf.length * 100;
      const second = secondHalf.filter(d => daily[d].goals[g.id]).length / secondHalf.length * 100;
      const diff = second - first;

      if (diff >= 20) {
        results.push({
          type: 'positive', icon: '🌟', priority: 5,
          title: `"${g.name}" is on the rise`,
          body: `Up from ${first.toFixed(0)}% to ${second.toFixed(0)}% recently. Building momentum!`
        });
      } else if (diff <= -20) {
        results.push({
          type: 'warning', icon: '⬇️', priority: 5,
          title: `"${g.name}" is slipping`,
          body: `Down from ${first.toFixed(0)}% to ${second.toFixed(0)}%. Need a different approach?`
        });
      }
    });

    return results;
  };

  // ============================================================
  // 8. TIMESTAMP PATTERNS
  // ============================================================
  const analyzeTimestamps = (goals, dates) => {
    const results = [];

    goals.forEach(g => {
      const timestamps = [];
      dates.forEach(d => {
        const td = Store.getToolData(g.id, d);
        if (td.completedAt) {
          const hour = parseInt(td.completedAt.split(':')[0]);
          timestamps.push({ date: d, hour });
        }
      });

      if (timestamps.length < MIN_DAYS) return;

      // Bucket into time blocks
      const blocks = { morning: 0, afternoon: 0, evening: 0, night: 0 };
      timestamps.forEach(t => {
        if (t.hour >= 5 && t.hour < 12) blocks.morning++;
        else if (t.hour >= 12 && t.hour < 17) blocks.afternoon++;
        else if (t.hour >= 17 && t.hour < 21) blocks.evening++;
        else blocks.night++;
      });

      const total = timestamps.length;
      const dominant = Object.entries(blocks).sort((a, b) => b[1] - a[1])[0];
      const dominantPct = pct(dominant[1], total);

      if (dominantPct >= 50) {
        const avgHour = Math.round(avg(timestamps.map(t => t.hour)));
        results.push({
          type: 'pattern', icon: '⏰', priority: 4,
          title: `You usually do "${g.name}" in the ${dominant[0]}`,
          body: `${dominantPct}% of completions happen in the ${dominant[0]} (around ${avgHour > 12 ? avgHour - 12 + 'pm' : avgHour + 'am'}).`
        });
      }
    });

    return results;
  };

  // ============================================================
  // EXPORT
  // ============================================================
  return { analyze };
})();
