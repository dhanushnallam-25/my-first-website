/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  currency: string; // e.g. '$', '€', '£', '¥'
  targetSavingsRate: number; // e.g. 20 for 20%
  notificationsEnabled: boolean;
  themeAccent: 'blue' | 'teal' | 'indigo' | 'emerald' | 'amber' | 'rose';
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  description: string;
  notes?: string;
  isRecurring?: boolean;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limitAmount: number;
}

export interface SavingGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  color: string; // CSS hex or tailwind name
}

export interface FinancialBill {
  id: string;
  userId: string;
  title: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  category: string;
  isPaid: boolean;
  isRecurring: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
  date: string; // YYYY-MM-DD HH:MM
  isRead: boolean;
}

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}
