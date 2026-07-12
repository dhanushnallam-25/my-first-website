/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  ShieldCheck, 
  TrendingUp, 
  Lightbulb, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity, 
  BrainCircuit,
  Award,
  AlertCircle
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const { currentUser, transactions, budgets, financialBills } = useAuth();
  const [timeframe, setTimeframe] = useState<'month' | 'lifetime'>('month');
  const [categorySearch, setCategorySearch] = useState<string>('');
  const [categorySort, setCategorySort] = useState<'amount' | 'name'>('amount');

  const currency = currentUser?.currency || '$';

  // Categories Color Palettes
  const CATEGORY_COLORS: { [key: string]: string } = {
    'Groceries': '#3b82f6', // blue
    'Dining Out': '#f59e0b', // amber
    'Transport': '#10b981', // emerald
    'Entertainment': '#8b5cf6', // purple
    'Shopping': '#ec4899', // pink
    'Utilities': '#06b6d4', // cyan
    'Housing': '#f43f5e', // rose
    'Health & Fitness': '#10b981', // green
    'Savings Transfer': '#14b8a6', // teal
    'Other': '#64748b' // slate
  };

  const DEFAULT_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#14b8a6', '#64748b'];

  // 1. Compile spending by category data
  const getCategoryBreakdown = () => {
    const categorySums: { [cat: string]: number } = {};
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const filtered = transactions.filter(t => {
      if (t.type !== 'expense') return false;
      if (timeframe === 'month') {
        return t.date.startsWith(currentMonthStr);
      }
      return true;
    });

    filtered.forEach(t => {
      categorySums[t.category] = (categorySums[t.category] || 0) + t.amount;
    });

    return Object.keys(categorySums).map((cat, idx) => ({
      name: cat,
      value: Math.round(categorySums[cat] * 100) / 100,
      color: CATEGORY_COLORS[cat] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]
    })).sort((a, b) => b.value - a.value);
  };

  const categoryBreakdown = getCategoryBreakdown();
  const visibleCategoryBreakdown = useMemo(() => categoryBreakdown
    .filter(item => item.name.toLowerCase().includes(categorySearch.toLowerCase()))
    .sort((a, b) => categorySort === 'amount' ? b.value - a.value : a.name.localeCompare(b.name)),
    [categoryBreakdown, categorySearch, categorySort],
  );
  const totalSpent = visibleCategoryBreakdown.reduce((sum, item) => sum + item.value, 0);

  // 2. Compile Income vs Expenses Comparison Chart (past 5 months)
  const getMonthlyComparisonData = () => {
    const monthMap: { [month: string]: { income: number; expense: number } } = {};
    
    // Seed past 5 months
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[mStr] = { income: 0, expense: 0 };
    }

    // Populate
    transactions.forEach(t => {
      const mStr = t.date.substring(0, 7);
      if (monthMap[mStr]) {
        if (t.type === 'income') {
          monthMap[mStr].income += t.amount;
        } else {
          monthMap[mStr].expense += t.amount;
        }
      }
    });

    return Object.keys(monthMap).sort().map(month => {
      const dateObj = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]) - 1, 1);
      const label = dateObj.toLocaleString('default', { month: 'short', year: '2-digit' });
      return {
        month: label,
        Income: Math.round(monthMap[month].income),
        Expense: Math.round(monthMap[month].expense),
        Savings: Math.max(0, Math.round(monthMap[month].income - monthMap[month].expense))
      };
    });
  };

  const monthlyComparison = getMonthlyComparisonData();

  // 3. Dynamic Financial Health Assessment Engine
  const calculateFinancialScore = () => {
    let score = 0;
    
    // Core parameters:
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthTxs = transactions.filter(t => t.date.startsWith(currentMonthStr));
    
    const monthlyInc = thisMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const monthlyExp = thisMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    // Metric A: Savings Rate (Max 40 points)
    // Target is 20%. If savings rate >= 20%, give full 40 points. Otherwise, scale proportionally.
    const savings = Math.max(0, monthlyInc - monthlyExp);
    const savingsRate = monthlyInc > 0 ? (savings / monthlyInc) * 100 : 0;
    const savingsPoints = savingsRate >= 20 ? 40 : Math.round((savingsRate / 20) * 40);
    score += savingsPoints;

    // Metric B: Budget Barriers Overrun (Max 30 points)
    // Subtract points if budget limit is exceeded.
    let budgetOverruns = 0;
    budgets.forEach(b => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category.toLowerCase() === b.category.toLowerCase() && t.date.startsWith(currentMonthStr))
        .reduce((sum, t) => sum + t.amount, 0);
      if (spent > b.limitAmount) {
        budgetOverruns++;
      }
    });
    const budgetPoints = Math.max(0, 30 - (budgetOverruns * 10)); // lose 10 points per overrun
    score += budgetPoints;

    // Metric C: Bills Settlement Standings (Max 30 points)
    // Scale on how many of the historical bills due are marked as paid.
    const totalBills = financialBills.length;
    const paidBills = financialBills.filter(b => b.isPaid).length;
    const billsPoints = totalBills > 0 ? Math.round((paidBills / totalBills) * 30) : 30; // 30 points if no bills
    score += billsPoints;

    return {
      score,
      savingsRate: Math.round(savingsRate),
      budgetOverruns,
      paidBills,
      totalBills,
      savingsPoints,
      budgetPoints,
      billsPoints
    };
  };

  const health = calculateFinancialScore();

  // Score rating descriptions
  const getScoreRating = (s: number) => {
    if (s >= 85) return { label: 'Excellent', color: 'text-emerald-500 bg-emerald-50 border-emerald-100', desc: 'Outstanding job! Your capital allocation is optimized. You possess a strong savings cushion and strict barrier adherence.' };
    if (s >= 70) return { label: 'Healthy', color: 'text-blue-600 bg-blue-50 border-blue-100', desc: 'Good standing. Your finances are well-managed. Modest budget tweaks could bolster your savings capacity further.' };
    if (s >= 50) return { label: 'Average', color: 'text-amber-500 bg-amber-50 border-amber-100', desc: 'Fair. Spending trends are occasionally outpacing limits. We recommend streamlining dining out and shopping targets.' };
    return { label: 'Action Required', color: 'text-rose-600 bg-rose-50 border-rose-100', desc: 'Vulnerable. Capital outflows are outpacing earnings. Establish immediate budget barriers and clear pending invoices to avoid overdraft.' };
  };

  const rating = getScoreRating(health.score);

  // Customized bullet point recommendations
  const getRecommendations = () => {
    const recs = [];
    if (health.savingsRate < 20) {
      recs.push(`Your current savings rate is ${health.savingsRate}%, which is short of the target 20% savings rule. Try establishing strict spending limits on shopping and leisure activities.`);
    } else {
      recs.push(`Spectacular job! Saving ${health.savingsRate}% of income is superior. Consider compounding this capital inside your Savings Goals.`);
    }

    if (health.budgetOverruns > 0) {
      recs.push(`You have exceeded ${health.budgetOverruns} monthly budget limit(s). Make sure to review transaction categories under the Ledger tab to trace redundant leakages.`);
    } else if (budgets.length > 0) {
      recs.push(`Excellent budget discipline! You stayed completely below your category barrier limits this month.`);
    }

    const unpaidCount = health.totalBills - health.paidBills;
    if (unpaidCount > 0) {
      recs.push(`You have ${unpaidCount} unpaid bill invoices due soon. Clearing invoices ahead of time keeps your payment credit score immaculate.`);
    }

    return recs;
  };

  const recommendations = getRecommendations();

  return (
    <div className="space-y-6">
      {/* Timeframe Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl tracking-tight text-slate-900">Wealth Analytics</h2>
          <p className="text-xs text-slate-500 font-medium font-sans">Compiles spending profiles and provides dynamic feedback reports</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            id="toggle-analytics-month"
            onClick={() => setTimeframe('month')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            This Month
          </button>
          <button
            id="toggle-analytics-lifetime"
            onClick={() => setTimeframe('lifetime')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === 'lifetime' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            All-Time History
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          id="analytics-category-search"
          type="text"
          placeholder="Search spending categories..."
          value={categorySearch}
          onChange={(e) => setCategorySearch(e.target.value)}
          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
        />
        <select
          id="analytics-category-sort"
          value={categorySort}
          onChange={(e) => setCategorySort(e.target.value as typeof categorySort)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none"
        >
          <option value="amount">Sort by Spend</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown (Doughnut Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h4 className="font-display font-bold text-base text-slate-900">Outflow Allocations</h4>
            <p className="text-3xs text-slate-400">Distribution of expenditures by transactional category</p>
          </div>

          {visibleCategoryBreakdown.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              No expenses recorded to analyze for this timeframe.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Pie/Donut Visual */}
              <div className="h-48 w-48 shrink-0 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={visibleCategoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {visibleCategoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val) => [`${currency}${parseFloat(val as string).toFixed(2)}`, 'Spent']}
                      contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text sum */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-3xs text-slate-400 uppercase tracking-wider font-semibold">Total Spent</span>
                  <span className="text-sm font-extrabold text-slate-900">{currency}{Math.round(totalSpent).toLocaleString()}</span>
                </div>
              </div>

              {/* Category Legend list */}
              <div className="flex-1 space-y-1.5 w-full">
                {visibleCategoryBreakdown.slice(0, 5).map((item) => {
                  const percent = totalSpent > 0 ? Math.round((item.value / totalSpent) * 100) : 0;
                  return (
                    <div key={item.name} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-bold text-slate-700 truncate">{item.name}</span>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <span className="text-xs font-bold text-slate-900">{currency}{item.value.toFixed(0)}</span>
                        <span className="text-3xs text-slate-400 font-semibold ml-1.5">({percent}%)</span>
                      </div>
                    </div>
                  );
                })}
                {visibleCategoryBreakdown.length > 5 && (
                  <div className="text-3xs text-slate-400 font-semibold pl-4 pt-1">
                    + {visibleCategoryBreakdown.length - 5} more other categories
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Monthly comparisons */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h4 className="font-display font-bold text-base text-slate-900">Historical Comparison</h4>
            <p className="text-3xs text-slate-400">Inflows vs Outflows tracking past months</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={monthlyComparison} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px' }} 
                />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Dynamic Health Assessment Report */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-6" id="health-score-container">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-4 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <h4 className="font-display font-bold text-base text-slate-900">WealthFlow Financial Score</h4>
            </div>
            <p className="text-3xs text-slate-400 max-w-xl">
              An automated audit compiling your budget limit breaches, savings efficiency rate, and invoice payment statuses to evaluate structural liquidity.
            </p>
          </div>

          {/* Large Circle Badge */}
          <div className="flex items-center space-x-4 shrink-0 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="relative flex items-center justify-center">
              {/* Mock Circle Score */}
              <div className="h-16 w-16 rounded-full border-4 border-slate-100 flex items-center justify-center bg-white shadow-sm font-display font-extrabold text-xl text-slate-900">
                {health.score}
              </div>
            </div>
            <div className="space-y-0.5">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-3xs font-extrabold border ${rating.color}`}>
                {rating.label}
              </span>
              <p className="text-3xs text-slate-400 font-semibold mt-0.5">Scale: 0 - 100 points</p>
            </div>
          </div>
        </div>

        {/* Diagnosis & Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          {/* Diagnostic Details */}
          <div className="space-y-4">
            <h5 className="text-2xs font-bold uppercase tracking-wider text-slate-400">Flow Breakdown</h5>
            
            <div className="space-y-3.5">
              {/* Savings Factor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600">Savings Buffer Factor</span>
                  <span className="text-slate-900">{health.savingsPoints} / 40 pts</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${(health.savingsPoints/40)*100}%` }} />
                </div>
              </div>

              {/* Budget Factor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600">Budget Limit Factor</span>
                  <span className="text-slate-900">{health.budgetPoints} / 30 pts</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(health.budgetPoints/30)*100}%` }} />
                </div>
              </div>

              {/* Settlement stand */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600">Settlements stand Factor</span>
                  <span className="text-slate-900">{health.billsPoints} / 30 pts</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(health.billsPoints/30)*100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* AI Strategic Advice */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-slate-700">
                <Lightbulb className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Wealth Advisor Insights</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {rating.desc}
              </p>
              
              <ul className="space-y-2 pt-2">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-xs text-slate-500 leading-normal">
                    <span className="text-blue-500 font-extrabold select-none">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center space-x-1.5 text-3xs text-slate-400 pt-4 font-semibold select-none border-t border-slate-200/50 mt-4">
              <BrainCircuit className="h-3 w-3 text-slate-400" />
              <span>Personalized financial health score compiles dynamically</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
