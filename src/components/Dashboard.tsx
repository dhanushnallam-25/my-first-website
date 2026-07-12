/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getTransactionTotals, parsePositiveAmount, todayISO } from '../utils/finance';
import { useToast } from '../context/ToastContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity, 
  AlertTriangle,
  Calendar,
  Sparkles,
  ChevronRight,
  PiggyBank
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export const Dashboard: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const { 
    currentUser, 
    transactions, 
    addTransaction, 
    savingGoals, 
    updateSavingGoal, 
    financialBills, 
    updateFinancialBill,
    budgets 
  } = useAuth();
  const { showToast } = useToast();

  // Quick Action form toggles
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [quickType, setQuickType] = useState<'income' | 'expense'>('expense');
  const [quickAmount, setQuickAmount] = useState<string>('');
  const [quickCategory, setQuickCategory] = useState<string>('Groceries');
  const [quickDesc, setQuickDesc] = useState<string>('');
  const [quickDate, setQuickDate] = useState<string>(todayISO());
  const [quickError, setQuickError] = useState<string>('');
  const [quickSaving, setQuickSaving] = useState<boolean>(false);

  // Contribution popover for goals
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goalFundAmount, setGoalFundAmount] = useState<string>('');
  const [goalError, setGoalError] = useState<string>('');

  const currency = currentUser?.currency || '$';

  // Core metrics calculations
  const now = new Date();
  const { netBalance, monthlyIncome, monthlyExpense, savingsRate } = getTransactionTotals(transactions);
  const targetSavingsRate = currentUser?.targetSavingsRate || 20;

  // Quick action options
  const expenseCategories = EXPENSE_CATEGORIES;
  const incomeCategories = INCOME_CATEGORIES;

  const categoriesToUse = quickType === 'expense' ? expenseCategories : incomeCategories;

  // Handle Quick Add transaction
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuickError('');
    const amountNum = parsePositiveAmount(quickAmount);
    if (!amountNum) {
      setQuickError('Enter an amount greater than 0.');
      showToast('error', 'Invalid quick entry', 'Enter an amount greater than 0.');
      return;
    }
    if (!quickDate) {
      setQuickError('Choose a date.');
      return;
    }
    setQuickSaving(true);

    addTransaction({
      type: quickType,
      amount: amountNum,
      category: quickCategory,
      date: quickDate,
      description: quickDesc.trim() || `${quickType === 'income' ? 'Received' : 'Spent on'} ${quickCategory}`,
    });

    // Reset fields
    setQuickAmount('');
    setQuickDesc('');
    window.setTimeout(() => setQuickSaving(false), 250);
  };

  // Handle funding a goal
  const handleFundGoal = (goalId: string) => {
    setGoalError('');
    const amount = parsePositiveAmount(goalFundAmount);
    if (!amount) {
      setGoalError('Enter a deposit greater than 0.');
      showToast('error', 'Invalid deposit', 'Enter a deposit greater than 0.');
      return;
    }

    const goal = savingGoals.find(g => g.id === goalId);
    if (!goal) return;

    const updatedAmount = Math.min(goal.targetAmount, goal.currentAmount + amount);
    updateSavingGoal(goalId, { currentAmount: updatedAmount });
    
    // Also log as a transfer transaction
    addTransaction({
      type: 'expense',
      amount: amount,
      category: 'Savings Transfer',
      date: new Date().toISOString().split('T')[0],
      description: `Funded goal: ${goal.name}`,
    });

    // Reset
    setGoalFundAmount('');
    setSelectedGoalId(null);
  };

  // Chart Data compilation (last 10 days for cleaner spacing)
  const getChartData = () => {
    const dailyMap: { [date: string]: { income: number; expense: number } } = {};
    
    // Seed past 10 days with 0s
    for (let i = 9; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      dailyMap[dStr] = { income: 0, expense: 0 };
    }

    // Populate from transactions
    transactions.forEach(t => {
      if (dailyMap[t.date]) {
        if (t.type === 'income') {
          dailyMap[t.date].income += t.amount;
        } else {
          dailyMap[t.date].expense += t.amount;
        }
      }
    });

    // Convert to Array and sort
    return Object.keys(dailyMap)
      .sort()
      .map(date => {
        const parts = date.split('-');
        const label = `${parts[1]}/${parts[2]}`; // MM/DD
        return {
          date: label,
          Income: dailyMap[date].income,
          Expense: dailyMap[date].expense,
          Net: dailyMap[date].income - dailyMap[date].expense
        };
      });
  };

  const chartData = getChartData();

  // Upcoming bills: display top 3 unpaid bills due next
  const upcomingBills = financialBills
    .filter(b => !b.isPaid)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  // Recent Transactions: display last 5
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Upper Welcomer/Highlights Grid (Bento Box) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="bento-summary-grid">
        {/* Net Balance Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between group hover:border-blue-500/30 hover:shadow-md transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Net Wealth</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight" id="dashboard-balance-amount">
              {currency}{netBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-2xs text-slate-400 font-medium mt-1">Cumulated lifetime net flow</p>
          </div>
        </div>

        {/* Monthly Income Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">This Month's In</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight" id="dashboard-income-amount">
              {currency}{monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center text-3xs text-emerald-600 font-semibold mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Inflow for {now.toLocaleString('default', { month: 'long' })}</span>
            </div>
          </div>
        </div>

        {/* Monthly Expenses Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-rose-500/30 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">This Month's Out</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight" id="dashboard-expenses-amount">
              {currency}{monthlyExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center text-3xs text-rose-600 font-semibold mt-1">
              <TrendingDown className="h-3 w-3 mr-1" />
              <span>Outflow for {now.toLocaleString('default', { month: 'long' })}</span>
            </div>
          </div>
        </div>

        {/* Savings Efficiency Rate Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Savings Efficiency</span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight" id="dashboard-savings-rate">
                {savingsRate}%
              </h3>
              <span className="text-3xs font-semibold text-slate-400">Target: {targetSavingsRate}%</span>
            </div>
            
            {/* Savings Rate Progress Indicator */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${savingsRate >= targetSavingsRate ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.min(100, savingsRate)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Chart and Quick Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Financial Flow Area Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h4 className="font-display font-bold text-base text-slate-900">Cash Flow Analytics</h4>
              <p className="text-3xs text-slate-400">10-Day rolling dynamic comparison of Income vs Expenses</p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">
              Live Feed
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px', fontFamily: 'var(--font-sans)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                  labelClassName="font-bold text-slate-700"
                />
                <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Transaction Injector Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-display font-bold text-base text-slate-900">Quick Injector</h4>
              <span className="text-3xs text-slate-400 font-mono">Immediate Local Commit</span>
            </div>

            {/* Quick Type Toggles */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl">
              <button
                id="toggle-quick-expense"
                type="button"
                onClick={() => {
                  setQuickType('expense');
                  setQuickCategory('Groceries');
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${quickType === 'expense' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Expense
              </button>
              <button
                id="toggle-quick-income"
                type="button"
                onClick={() => {
                  setQuickType('income');
                  setQuickCategory('Salary');
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${quickType === 'income' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Income
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-3.5">
              {quickError && (
                <div className="p-2 bg-rose-50 border border-rose-100 text-rose-700 text-3xs rounded-lg font-semibold">
                  {quickError}
                </div>
              )}
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-semibold">{currency}</span>
                <input
                  id="quick-tx-amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  id="quick-tx-category"
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                >
                  {categoriesToUse.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <input
                  id="quick-tx-date"
                  type="date"
                  required
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <input
                id="quick-tx-description"
                type="text"
                placeholder="Brief description (e.g., Starbucks Coffee)"
                value={quickDesc}
                onChange={(e) => setQuickDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10"
              />

              <button
                id="btn-quick-tx-submit"
                type="submit"
                disabled={quickSaving}
                className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs disabled:opacity-60 ${quickType === 'expense' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
              >
                {quickSaving ? 'Logging...' : `Log ${quickType === 'expense' ? 'Outflow' : 'Inflow'}`}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Savings Goals contributions & Upcoming bills list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Savings Goals Incrementor card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-display font-bold text-base text-slate-900">Savings Vault Goals</h4>
              <p className="text-3xs text-slate-400">Add contributions to fast-track milestones</p>
            </div>
            <button 
              onClick={() => setActiveTab('budgets')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center"
            >
              Configure Goals <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {savingGoals.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No active savings goals. Create one in the Budgets tab!
              </div>
            ) : (
              savingGoals.map((goal) => {
                const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                const isSelected = selectedGoalId === goal.id;
                
                return (
                  <div key={goal.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800">{goal.name}</span>
                        <p className="text-3xs text-slate-400 font-medium">Deadline: {goal.deadline}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-800">
                          {currency}{goal.currentAmount.toLocaleString()} / {currency}{goal.targetAmount.toLocaleString()}
                        </span>
                        <p className="text-3xs text-emerald-600 font-bold">{percent}% Completed</p>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%`, backgroundColor: goal.color }}
                      />
                    </div>

                    {/* Quick Deposit toggle */}
                    <div className="flex justify-end pt-1">
                      {isSelected ? (
                        <div className="flex items-center space-x-2 animate-fadeIn">
                          <span className="text-2xs font-bold text-slate-500">{currency}</span>
                          <input
                            type="number"
                            placeholder="Amount"
                            value={goalFundAmount}
                            onChange={(e) => setGoalFundAmount(e.target.value)}
                            className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                          />
                          <button
                            onClick={() => handleFundGoal(goal.id)}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold"
                          >
                            Deposit
                          </button>
                          <button
                            onClick={() => setSelectedGoalId(null)}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-xs font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedGoalId(goal.id);
                            setGoalFundAmount('');
                          }}
                          disabled={percent >= 100}
                          className="flex items-center space-x-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Quick Deposit</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {goalError && <p className="text-3xs text-rose-600 font-semibold">{goalError}</p>}
          </div>
        </div>

        {/* Upcoming Bills panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-display font-bold text-base text-slate-900">Upcoming Invoices & Bills</h4>
              <p className="text-3xs text-slate-400">Keep account standing in green status</p>
            </div>
            <button 
              onClick={() => setActiveTab('calendar')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center"
            >
              Full Calendar <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3.5">
            {upcomingBills.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No unpaid upcoming bills. Splendid!
              </div>
            ) : (
              upcomingBills.map((bill) => {
                const isOverdue = new Date(bill.dueDate).getTime() < new Date().getTime();
                return (
                  <div key={bill.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${isOverdue ? 'bg-rose-50 text-rose-600' : 'bg-slate-200/60 text-slate-600'}`}>
                        {isOverdue ? <AlertTriangle className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate leading-snug">{bill.title}</p>
                        <p className="text-3xs text-slate-400 font-semibold mt-0.5">
                          Due: <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}>{bill.dueDate}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="text-xs font-mono font-extrabold text-slate-800">{currency}{bill.amount}</span>
                      <button
                        id={`btn-pay-bill-${bill.id}`}
                        onClick={() => updateFinancialBill(bill.id, { isPaid: true })}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-2xs font-extrabold rounded-lg transition-colors"
                      >
                        Mark Paid
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-display font-bold text-base text-slate-900">Recent Transactions History</h4>
            <p className="text-3xs text-slate-400">Instant chronological log of account activities</p>
          </div>
          <button 
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center"
          >
            All Ledger Records <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="recent-tx-table">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-3 text-2xs font-bold uppercase text-slate-400 tracking-wider">Date</th>
                <th className="pb-3 text-2xs font-bold uppercase text-slate-400 tracking-wider">Description</th>
                <th className="pb-3 text-2xs font-bold uppercase text-slate-400 tracking-wider">Category</th>
                <th className="pb-3 text-2xs font-bold uppercase text-slate-400 tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                    No transactions recorded. Use the Quick Injector to add some!
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 text-xs text-slate-500 font-semibold font-mono">{tx.date}</td>
                    <td className="py-3.5 text-xs font-bold text-slate-800">{tx.description}</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
                        {tx.category}
                      </span>
                    </td>
                    <td className={`py-3.5 text-xs font-mono font-bold text-right ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {tx.type === 'income' ? '+' : '-'}{currency}{tx.amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
