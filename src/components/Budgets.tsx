/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Budget, SavingGoal } from '../types';
import { EXPENSE_CATEGORIES, GOAL_COLORS, getCategorySpending, parsePositiveAmount, todayISO } from '../utils/finance';
import { useToast } from '../context/ToastContext';
import { 
  PiggyBank, 
  Plus, 
  Trash2, 
  Edit3,
  Search,
  ArrowUpDown,
  AlertTriangle, 
  Award, 
  TrendingUp, 
  Calendar, 
  X, 
  Settings,
  Sparkles,
  HeartCrack,
  CheckCircle2
} from 'lucide-react';

export const Budgets: React.FC = () => {
  const { 
    currentUser, 
    transactions, 
    budgets, 
    addBudget, 
    updateBudget,
    deleteBudget, 
    savingGoals, 
    addSavingGoal, 
    updateSavingGoal, 
    deleteSavingGoal,
    addNotification 
  } = useAuth();
  const { showToast } = useToast();

  // Budget states
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<boolean>(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [bCategory, setBCategory] = useState<string>('Groceries');
  const [bLimit, setBLimit] = useState<string>('');
  const [budgetError, setBudgetError] = useState<string>('');

  // Goal states
  const [isGoalModalOpen, setIsGoalModalOpen] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null);
  const [gName, setGName] = useState<string>('');
  const [gTarget, setGTarget] = useState<string>('');
  const [gCurrent, setGCurrent] = useState<string>('0');
  const [gDeadline, setGDeadline] = useState<string>('');
  const [gColor, setGColor] = useState<string>('#2563eb'); // default blue-600
  const [goalError, setGoalError] = useState<string>('');

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'warning' | 'overrun'>('all');
  const [sortMode, setSortMode] = useState<'category' | 'spent' | 'remaining' | 'deadline' | 'progress'>('category');

  const currency = currentUser?.currency || '$';

  // Available options
  const categoriesList = EXPENSE_CATEGORIES;
  const colorsList = GOAL_COLORS;

  // Calculations for current month's spending by category
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const budgetCards = useMemo(() => budgets
    .map(b => {
      const spent = getCategorySpending(transactions, b.category, currentMonthStr);
      const percent = b.limitAmount > 0 ? Math.round((spent / b.limitAmount) * 100) : 0;
      const status = percent >= 100 ? 'overrun' : percent >= 80 ? 'warning' : 'healthy';
      return { budget: b, spent, percent, status, remaining: b.limitAmount - spent };
    })
    .filter(item => {
      const matchesSearch = item.budget.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortMode === 'spent') return b.spent - a.spent;
      if (sortMode === 'remaining') return a.remaining - b.remaining;
      return a.budget.category.localeCompare(b.budget.category);
    }), [budgets, transactions, currentMonthStr, searchTerm, statusFilter, sortMode]);

  const visibleGoals = useMemo(() => savingGoals
    .filter(goal => goal.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortMode === 'deadline') return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (sortMode === 'progress') return (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount);
      return a.name.localeCompare(b.name);
    }), [savingGoals, searchTerm, sortMode]);

  const openBudgetModal = (budget?: Budget) => {
    setEditingBudget(budget || null);
    setBCategory(budget?.category || 'Groceries');
    setBLimit(budget ? String(budget.limitAmount) : '');
    setBudgetError('');
    setIsBudgetModalOpen(true);
  };

  const openGoalModal = (goal?: SavingGoal) => {
    setEditingGoal(goal || null);
    setGName(goal?.name || '');
    setGTarget(goal ? String(goal.targetAmount) : '');
    setGCurrent(goal ? String(goal.currentAmount) : '0');
    setGDeadline(goal?.deadline || '');
    setGColor(goal?.color || '#2563eb');
    setGoalError('');
    setIsGoalModalOpen(true);
  };

  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parsePositiveAmount(bLimit);
    if (!limitNum) {
      setBudgetError('Enter a monthly limit greater than 0.');
      showToast('error', 'Invalid budget', 'Enter a monthly limit greater than 0.');
      return;
    }

    if (editingBudget) {
      updateBudget(editingBudget.id, { category: bCategory, limitAmount: limitNum });
    } else {
      addBudget({
        category: bCategory,
        limitAmount: limitNum
      });
    }

    setBLimit('');
    setEditingBudget(null);
    setIsBudgetModalOpen(false);
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGoalError('');
    const targetNum = parsePositiveAmount(gTarget);
    const currentNum = Number.parseFloat(gCurrent) || 0;
    if (!targetNum) {
      setGoalError('Enter a target amount greater than 0.');
      showToast('error', 'Invalid goal', 'Enter a target amount greater than 0.');
      return;
    }

    if (!gName.trim()) {
      setGoalError('Add a short goal name.');
      return;
    }
    if (currentNum < 0 || currentNum > targetNum) {
      setGoalError('Initial deposit must be between 0 and the target amount.');
      return;
    }

    const payload = {
      name: gName.trim(),
      targetAmount: targetNum,
      currentAmount: currentNum,
      deadline: gDeadline || new Date(now.getFullYear(), now.getMonth() + 6, now.getDate()).toISOString().split('T')[0],
      color: gColor
    };

    if (editingGoal) {
      updateSavingGoal(editingGoal.id, payload);
      addNotification('success', 'Goal Updated', `Updated savings target: ${payload.name}.`);
    } else {
      addSavingGoal(payload);
    }

    // Reset
    setGName('');
    setGTarget('');
    setGCurrent('0');
    setGDeadline('');
    setEditingGoal(null);
    setIsGoalModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Header Section */}
      <div>
        <h2 className="font-display font-bold text-2xl tracking-tight text-slate-900">Budgets & Milestones</h2>
        <p className="text-xs text-slate-500 font-medium">Create monthly cash outflow barriers and track progressive savings objectives</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="budget-search-input"
            type="text"
            placeholder="Search budget categories or savings goals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            id="budget-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="warning">Warning</option>
            <option value="overrun">Overrun</option>
          </select>
          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              id="budget-sort-mode"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="category">Category / Name</option>
              <option value="spent">Highest Spent</option>
              <option value="remaining">Lowest Remaining</option>
              <option value="deadline">Goal Deadline</option>
              <option value="progress">Goal Progress</option>
            </select>
          </div>
          {(searchTerm || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* MONTHLY CATEGORY LIMITS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-slate-900 text-blue-500 rounded-lg">
                <PiggyBank className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">Spending Barriers</h3>
            </div>
            <button
              id="btn-add-budget-trigger"
              onClick={() => openBudgetModal()}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Set Limit</span>
            </button>
          </div>

          <div className="space-y-4" id="budgets-limits-list">
            {budgetCards.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                No spending limits match the current view.
              </div>
            ) : (
              budgetCards.map(({ budget: b, spent, percent }) => {
                const visiblePercent = Math.min(100, percent);
                
                // Color mapping depending on budget threshold
                let colorBar = 'bg-emerald-500';
                let colorText = 'text-emerald-600';
                let cardBorder = 'hover:border-emerald-500/20';

                if (percent >= 100) {
                  colorBar = 'bg-rose-500';
                  colorText = 'text-rose-600';
                  cardBorder = 'hover:border-rose-500/20';
                } else if (percent >= 80) {
                  colorBar = 'bg-orange-500';
                  colorText = 'text-orange-600';
                  cardBorder = 'hover:border-orange-500/20';
                } else if (percent >= 50) {
                  colorBar = 'bg-amber-500';
                  colorText = 'text-amber-500';
                  cardBorder = 'hover:border-amber-500/20';
                }

                return (
                  <div key={b.id} className={`bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between transition-all duration-200 ${cardBorder}`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="text-sm font-bold text-slate-800">{b.category}</span>
                        <p className="text-3xs text-slate-400 font-medium">{now.toLocaleString('default', { month: 'long' })} Outflow Allocation</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-800">
                          {currency}{spent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-xs text-slate-400 font-medium"> / {currency}{b.limitAmount}</span>
                        </div>
                        <button
                          id={`btn-edit-budget-${b.id}`}
                          onClick={() => openBudgetModal(b)}
                          className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors"
                          title="Edit budget barrier"
                          aria-label={`Edit budget for ${b.category}`}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          id={`btn-delete-budget-${b.id}`}
                          onClick={() => {
                            if (confirm(`Remove monthly budget limit for ${b.category}?`)) {
                              deleteBudget(b.id);
                              addNotification('info', 'Budget Removed', `Removed spending limit for category: ${b.category}.`);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                          title="Remove budget barrier"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress tracking line */}
                    <div className="mt-3.5 space-y-1.5">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${colorBar}`} 
                          style={{ width: `${visiblePercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-3xs font-extrabold uppercase ${colorText}`}>
                          {percent >= 100 ? 'Limit Overrun!' : `${percent}% Consumed`}
                        </span>
                        {percent >= 100 ? (
                          <span className="flex items-center text-3xs font-bold text-rose-500 animate-pulse">
                            <HeartCrack className="h-3 w-3 mr-0.5" /> Overrun of {currency}{(spent - b.limitAmount).toFixed(2)}
                          </span>
                        ) : percent >= 80 ? (
                          <span className="flex items-center text-3xs font-semibold text-orange-500">
                            <AlertTriangle className="h-3 w-3 mr-0.5" /> High exhaustion
                          </span>
                        ) : (
                          <span className="text-3xs font-medium text-slate-400">
                            Remaining: {currency}{(b.limitAmount - spent).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SAVINGS GOALS VAULT */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-slate-900 text-blue-500 rounded-lg">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">Milestones Vault</h3>
            </div>
            <button
              id="btn-add-goal-trigger"
              onClick={() => openGoalModal()}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Start Goal</span>
            </button>
          </div>

          <div className="space-y-4" id="goals-milestones-list">
            {visibleGoals.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                No savings goals match the current view.
              </div>
            ) : (
              visibleGoals.map((goal) => {
                const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                return (
                  <div key={goal.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs space-y-3.5 hover:border-blue-500/20 transition-all duration-200">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-sm font-bold text-slate-800">{goal.name}</span>
                        <div className="flex items-center text-3xs text-slate-400 font-semibold space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Deadline: {goal.deadline}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-800">
                            {currency}{goal.currentAmount.toLocaleString()} / {currency}{goal.targetAmount.toLocaleString()}
                          </span>
                          <span className="block text-3xs text-emerald-600 font-bold">{percent}% Accumulated</span>
                        </div>
                        <button
                          id={`btn-edit-goal-${goal.id}`}
                          onClick={() => openGoalModal(goal)}
                          className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors"
                          title="Edit goal"
                          aria-label={`Edit ${goal.name}`}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          id={`btn-delete-goal-${goal.id}`}
                          onClick={() => {
                            if (confirm(`Delete the "${goal.name}" savings target?`)) {
                              deleteSavingGoal(goal.id);
                              addNotification('info', 'Goal Cancelled', `Removed savings target: ${goal.name}.`);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                          title="Remove goal"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress track */}
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%`, backgroundColor: goal.color }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-3xs">
                        {percent >= 100 ? (
                          <span className="flex items-center font-bold text-emerald-600">
                            <CheckCircle2 className="h-3 w-3 mr-0.5 text-emerald-500" /> Milestone Completed!
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">
                            Needs: {currency}{(goal.targetAmount - goal.currentAmount).toLocaleString()}
                          </span>
                        )}
                        <span className="text-slate-400 font-mono">Target: {goal.targetAmount}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Set Category Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="budget-set-modal">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="font-display font-bold text-sm text-slate-800">{editingBudget ? 'Edit Monthly Spending Barrier' : 'Set Monthly Spending Barrier'}</span>
              <button onClick={() => setIsBudgetModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500" aria-label="Close budget modal">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleBudgetSubmit} className="p-4 space-y-4">
              {budgetError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium">
                  {budgetError}
                </div>
              )}
              <div className="space-y-1">
                <label htmlFor="budget-category" className="text-3xs font-bold uppercase tracking-wider text-slate-400">Expense Category</label>
                <select
                  id="budget-category"
                  value={bCategory}
                  onChange={(e) => setBCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="budget-limit" className="text-3xs font-bold uppercase tracking-wider text-slate-400">Monthly Ceiling Limit ({currency})</label>
                <input
                  id="budget-limit"
                  type="number"
                  required
                  placeholder="e.g., 400.00"
                  value={bLimit}
                  onChange={(e) => setBLimit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  id="budget-modal-cancel"
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  id="budget-modal-save"
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
                >
                  {editingBudget ? 'Update Limit' : 'Confirm Limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Savings Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="goal-create-modal">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="font-display font-bold text-sm text-slate-800">{editingGoal ? 'Edit Savings Goal' : 'Launch New Savings Goal'}</span>
              <button onClick={() => setIsGoalModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500" aria-label="Close goal modal">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleGoalSubmit} className="p-4 space-y-4">
              {goalError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium">
                  {goalError}
                </div>
              )}
              <div className="space-y-1">
                <label htmlFor="goal-name" className="text-3xs font-bold uppercase tracking-wider text-slate-400">Goal Target Name</label>
                <input
                  id="goal-name"
                  type="text"
                  required
                  placeholder="e.g., New MacBook Pro, Car Down Payment"
                  value={gName}
                  onChange={(e) => setGName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="goal-target" className="text-3xs font-bold uppercase tracking-wider text-slate-400">Target Amount ({currency})</label>
                  <input
                    id="goal-target"
                    type="number"
                    required
                    placeholder="2500"
                    value={gTarget}
                    onChange={(e) => setGTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="goal-current" className="text-3xs font-bold uppercase tracking-wider text-slate-400">Initial Deposit ({currency})</label>
                  <input
                    id="goal-current"
                    type="number"
                    placeholder="0"
                    value={gCurrent}
                    onChange={(e) => setGCurrent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="goal-deadline" className="text-3xs font-bold uppercase tracking-wider text-slate-400">Target Deadline Date</label>
                <input
                  id="goal-deadline"
                  type="date"
                  value={gDeadline}
                  onChange={(e) => setGDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* Goal Color selector */}
              <div className="space-y-1.5">
                <span className="text-3xs font-bold uppercase tracking-wider text-slate-400 block">Milestone Vault Color Accent</span>
                <div className="flex items-center space-x-2">
                  {colorsList.map(col => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setGColor(col.hex)}
                      className={`h-6 w-6 rounded-full border-2 transition-all cursor-pointer ${gColor === col.hex ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  id="goal-modal-cancel"
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  id="goal-modal-save"
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
                >
                  {editingGoal ? 'Update Milestone' : 'Initiate Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
