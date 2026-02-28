/* ============================================================
   budget.js — Budget Tracker Module
   Categories, transactions, monthly summaries, spending insights
   ============================================================ */

const Budget = (() => {

  const KEY = 'dp_budget';
  const KEY_CATS = 'dp_budget_cats';

  const DEFAULT_CATEGORIES = [
    { id: 'cat_food',     name: 'Food & Dining',   emoji: '🍕', color: '#f97316', type: 'expense' },
    { id: 'cat_transport', name: 'Transport',       emoji: '🚗', color: '#3b82f6', type: 'expense' },
    { id: 'cat_housing',  name: 'Housing',          emoji: '🏠', color: '#8b5cf6', type: 'expense' },
    { id: 'cat_health',   name: 'Health',           emoji: '💊', color: '#10b981', type: 'expense' },
    { id: 'cat_shopping', name: 'Shopping',         emoji: '🛒', color: '#ec4899', type: 'expense' },
    { id: 'cat_entertain',name: 'Entertainment',    emoji: '🎬', color: '#f59e0b', type: 'expense' },
    { id: 'cat_bills',    name: 'Bills & Utilities',emoji: '💡', color: '#ef4444', type: 'expense' },
    { id: 'cat_savings',  name: 'Savings',          emoji: '🏦', color: '#14b8a6', type: 'expense' },
    { id: 'cat_other_exp',name: 'Other',            emoji: '📦', color: '#6b7280', type: 'expense' },
    { id: 'cat_salary',   name: 'Salary',           emoji: '💰', color: '#10b981', type: 'income' },
    { id: 'cat_freelance', name: 'Freelance',       emoji: '💻', color: '#3b82f6', type: 'income' },
    { id: 'cat_other_inc',name: 'Other Income',     emoji: '💵', color: '#6b7280', type: 'income' }
  ];

  const _get = (key, fb) => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; } };
  const _set = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.warn('Budget write fail', e); } };

  // ---- Categories ----
  const getCategories = () => {
    const cats = _get(KEY_CATS, null);
    if (cats === null) { _set(KEY_CATS, DEFAULT_CATEGORIES); return [...DEFAULT_CATEGORIES]; }
    return cats;
  };

  const addCategory = (name, emoji, color, type) => {
    const cats = getCategories();
    if (cats.length >= 30) return false;
    cats.push({ id: 'cat_' + Date.now(), name: name.trim(), emoji: emoji || '📦', color: color || '#6b7280', type: type || 'expense' });
    _set(KEY_CATS, cats);
    return true;
  };

  const removeCategory = (id) => _set(KEY_CATS, getCategories().filter(c => c.id !== id));

  // ---- Transactions ----
  // { id, date, amount, categoryId, note, type: 'income'|'expense' }
  const getTransactions = () => _get(KEY, []);

  const addTransaction = (txn) => {
    const all = getTransactions();
    all.push({
      id: 'txn_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
      date: txn.date || Store.today(),
      amount: Math.abs(parseFloat(txn.amount)) || 0,
      categoryId: txn.categoryId || '',
      note: (txn.note || '').trim(),
      type: txn.type || 'expense'
    });
    all.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    _set(KEY, all);
    return true;
  };

  const removeTransaction = (id) => {
    _set(KEY, getTransactions().filter(t => t.id !== id));
  };

  const updateTransaction = (id, updates) => {
    _set(KEY, getTransactions().map(t => t.id === id ? { ...t, ...updates } : t));
  };

  // ---- Queries ----
  const getMonth = (dateStr) => dateStr ? dateStr.slice(0, 7) : Store.today().slice(0, 7);

  const getTransactionsForMonth = (month) => {
    const m = month || getMonth();
    return getTransactions().filter(t => t.date.startsWith(m));
  };

  const getMonthSummary = (month) => {
    const txns = getTransactionsForMonth(month);
    let totalIncome = 0, totalExpense = 0;
    const byCategory = {};

    txns.forEach(t => {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;

      if (!byCategory[t.categoryId]) byCategory[t.categoryId] = { income: 0, expense: 0, count: 0 };
      byCategory[t.categoryId][t.type] += t.amount;
      byCategory[t.categoryId].count++;
    });

    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      transactionCount: txns.length,
      byCategory
    };
  };

  // Get spending by category for a month, sorted descending
  const getCategoryBreakdown = (month) => {
    const summary = getMonthSummary(month);
    const cats = getCategories();
    const result = [];

    Object.entries(summary.byCategory).forEach(([catId, data]) => {
      const cat = cats.find(c => c.id === catId) || { name: 'Unknown', emoji: '❓', color: '#6b7280' };
      if (data.expense > 0) {
        result.push({
          ...cat,
          amount: data.expense,
          count: data.count,
          percent: summary.totalExpense > 0 ? Math.round((data.expense / summary.totalExpense) * 100) : 0
        });
      }
    });

    return result.sort((a, b) => b.amount - a.amount);
  };

  // Daily spending for the current month (for chart)
  const getDailySpending = (month) => {
    const m = month || getMonth();
    const txns = getTransactionsForMonth(m).filter(t => t.type === 'expense');
    const byDay = {};
    txns.forEach(t => { byDay[t.date] = (byDay[t.date] || 0) + t.amount; });

    // Fill all days in the month
    const [y, mo] = m.split('-').map(Number);
    const daysInMonth = new Date(y, mo, 0).getDate();
    const today = Store.today();
    const result = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${m}-${String(d).padStart(2, '0')}`;
      if (ds > today) break;
      result.push({ date: ds, amount: byDay[ds] || 0 });
    }
    return result;
  };

  // Month-over-month comparison
  const getMonthComparison = () => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;

    return {
      thisMonth: getMonthSummary(thisMonth),
      lastMonth: getMonthSummary(lastMonth),
      thisMonthLabel: thisMonth,
      lastMonthLabel: lastMonth
    };
  };

  // Available months that have transactions
  const getAvailableMonths = () => {
    const txns = getTransactions();
    const months = new Set(txns.map(t => t.date.slice(0, 7)));
    // Always include current month
    months.add(Store.today().slice(0, 7));
    return [...months].sort().reverse();
  };

  // ---- Budget Goals (monthly spending limits per category) ----
  const KEY_LIMITS = 'dp_budget_limits';

  const getLimits = () => _get(KEY_LIMITS, {});
  const setLimit = (categoryId, amount) => {
    const limits = getLimits();
    if (amount > 0) limits[categoryId] = amount;
    else delete limits[categoryId];
    _set(KEY_LIMITS, limits);
  };

  const getMonthlyBudget = () => _get('dp_monthly_budget', 0);
  const setMonthlyBudget = (amount) => { try { localStorage.setItem('dp_monthly_budget', JSON.stringify(amount)); } catch {} };

  // ---- Reset ----
  const resetBudget = () => {
    localStorage.removeItem(KEY);
    localStorage.removeItem(KEY_CATS);
    localStorage.removeItem(KEY_LIMITS);
    localStorage.removeItem('dp_monthly_budget');
  };

  return {
    getCategories, addCategory, removeCategory,
    getTransactions, addTransaction, removeTransaction, updateTransaction,
    getTransactionsForMonth, getMonthSummary, getCategoryBreakdown,
    getDailySpending, getMonthComparison, getAvailableMonths,
    getLimits, setLimit, getMonthlyBudget, setMonthlyBudget,
    getMonth, resetBudget, DEFAULT_CATEGORIES
  };

})();
