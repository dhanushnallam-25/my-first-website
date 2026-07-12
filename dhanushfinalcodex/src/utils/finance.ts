import { Budget, FinancialBill, SavingGoal, Transaction } from '../types';

export const EXPENSE_CATEGORIES = [
  'Groceries',
  'Dining Out',
  'Transport',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Housing',
  'Health & Fitness',
  'Other',
];

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other'];

export const ALL_CATEGORIES = Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, 'Savings Transfer']));

export const GOAL_COLORS = [
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Indigo', hex: '#4f46e5' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Purple', hex: '#a855f7' },
];

export const todayISO = () => new Date().toISOString().split('T')[0];

export const currencyAmount = (currency: string, amount: number, digits = 2) =>
  `${currency}${amount.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;

export const parsePositiveAmount = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const monthlyKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const getTransactionTotals = (transactions: Transaction[], month = monthlyKey()) => {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const thisMonth = transactions.filter(t => t.date.startsWith(month));
  const monthlyIncome = thisMonth.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpense = thisMonth.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const monthlySavings = Math.max(0, monthlyIncome - monthlyExpense);

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    monthlyIncome,
    monthlyExpense,
    monthlySavings,
    savingsRate: monthlyIncome > 0 ? Math.round((monthlySavings / monthlyIncome) * 100) : 0,
  };
};

export const getCategorySpending = (transactions: Transaction[], category: string, month = monthlyKey()) =>
  transactions
    .filter(t => t.type === 'expense' && t.category.toLowerCase() === category.toLowerCase() && t.date.startsWith(month))
    .reduce((sum, t) => sum + t.amount, 0);

export const sortByDateAsc = <T extends { date?: string; dueDate?: string }>(items: T[]) =>
  [...items].sort((a, b) => new Date(a.date || a.dueDate || '').getTime() - new Date(b.date || b.dueDate || '').getTime());

export const buildBackup = (
  user: unknown,
  transactions: Transaction[],
  budgets: Budget[],
  savingGoals: SavingGoal[],
  financialBills: FinancialBill[],
  notifications: unknown[],
) =>
  JSON.stringify(
    {
      user,
      transactions,
      budgets,
      savingGoals,
      financialBills,
      notifications,
      backupVersion: '2.0',
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  );
