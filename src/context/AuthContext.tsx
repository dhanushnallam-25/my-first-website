/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Transaction, Budget, SavingGoal, FinancialBill, Notification } from '../types';
import { useToast } from './ToastContext';
import { buildBackup } from '../utils/finance';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  
  // Auth Operations
  login: (email: string, name?: string) => Promise<boolean>;
  signup: (email: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  
  // Transactions
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'userId'>) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'userId'>>) => void;
  deleteTransaction: (id: string) => void;
  
  // Budgets
  budgets: Budget[];
  addBudget: (bg: Omit<Budget, 'id' | 'userId'>) => void;
  updateBudget: (id: string, updates: Partial<Omit<Budget, 'id' | 'userId'>>) => void;
  deleteBudget: (id: string) => void;
  
  // Savings Goals
  savingGoals: SavingGoal[];
  addSavingGoal: (goal: Omit<SavingGoal, 'id' | 'userId'>) => void;
  updateSavingGoal: (id: string, updates: Partial<Omit<SavingGoal, 'id' | 'userId'>>) => void;
  deleteSavingGoal: (id: string) => void;
  
  // Financial Bills
  financialBills: FinancialBill[];
  addFinancialBill: (bill: Omit<FinancialBill, 'id' | 'userId'>) => void;
  updateFinancialBill: (id: string, updates: Partial<Omit<FinancialBill, 'id' | 'userId'>>) => void;
  deleteFinancialBill: (id: string) => void;
  
  // Notifications
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  addNotification: (type: 'info' | 'warning' | 'success', title: string, message: string) => void;
  
  // Bulk DB
  resetData: () => void;
  importBackup: (data: string) => boolean;
  exportBackup: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Scoped Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);
  const [financialBills, setFinancialBills] = useState<FinancialBill[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 1. Check for existing session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('wf_session');
    if (savedSession) {
      try {
        const user = JSON.parse(savedSession) as User;
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Failed to parse saved session', e);
        localStorage.removeItem('wf_session');
      }
    }
    setLoading(false);
  }, []);

  // 2. Load user-scoped data once logged in
  useEffect(() => {
    if (!currentUser) {
      setTransactions([]);
      setBudgets([]);
      setSavingGoals([]);
      setFinancialBills([]);
      setNotifications([]);
      return;
    }

    const uid = currentUser.id;
    
    // Helper to load or initialize scoped data
    const loadData = <T,>(key: string, initial: T[]): T[] => {
      const data = localStorage.getItem(`wf_${uid}_${key}`);
      if (data) {
        try {
          return JSON.parse(data) as T[];
        } catch (e) {
          console.error(`Failed to load key ${key}`, e);
        }
      }
      localStorage.setItem(`wf_${uid}_${key}`, JSON.stringify(initial));
      return initial;
    };

    setTransactions(loadData<Transaction>('transactions', []));
    setBudgets(loadData<Budget>('budgets', []));
    setSavingGoals(loadData<SavingGoal>('saving_goals', []));
    setFinancialBills(loadData<FinancialBill>('bills', []));
    setNotifications(loadData<Notification>('notifications', []));
  }, [currentUser]);

  // 3. Keep data state in sync with localStorage
  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.id;
    localStorage.setItem(`wf_${uid}_transactions`, JSON.stringify(transactions));
  }, [transactions, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.id;
    localStorage.setItem(`wf_${uid}_budgets`, JSON.stringify(budgets));
  }, [budgets, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.id;
    localStorage.setItem(`wf_${uid}_saving_goals`, JSON.stringify(savingGoals));
  }, [savingGoals, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.id;
    localStorage.setItem(`wf_${uid}_bills`, JSON.stringify(financialBills));
  }, [financialBills, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.id;
    localStorage.setItem(`wf_${uid}_notifications`, JSON.stringify(notifications));
  }, [notifications, currentUser]);

  // Seeding realistic mock data
  const seedMockData = (uid: string) => {
    // Current date helpers to align mock dates dynamically around the current month
    const now = new Date();
    const getPastDate = (daysAgo: number) => {
      const d = new Date(now);
      d.setDate(now.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };

    const initialTransactions: Transaction[] = [
      { id: 't1', userId: uid, type: 'income', amount: 5000, category: 'Salary', date: getPastDate(12), description: 'Tech Corp Monthly Salary', isRecurring: true },
      { id: 't2', userId: uid, type: 'income', amount: 450, category: 'Freelance', date: getPastDate(4), description: 'Website design commission' },
      { id: 't3', userId: uid, type: 'expense', amount: 1450, category: 'Housing', date: getPastDate(11), description: 'Monthly Apartment Rent', isRecurring: true },
      { id: 't4', userId: uid, type: 'expense', amount: 124.50, category: 'Groceries', date: getPastDate(10), description: 'Whole Foods organic groceries' },
      { id: 't5', userId: uid, type: 'expense', amount: 45.00, category: 'Utilities', date: getPastDate(9), description: 'High-speed Fiber Internet', isRecurring: true },
      { id: 't6', userId: uid, type: 'expense', amount: 32.80, category: 'Dining Out', date: getPastDate(8), description: 'Ramen dinner with Sarah' },
      { id: 't7', userId: uid, type: 'expense', amount: 15.99, category: 'Entertainment', date: getPastDate(8), description: 'Netflix subscription', isRecurring: true },
      { id: 't8', userId: uid, type: 'expense', amount: 42.00, category: 'Transport', date: getPastDate(7), description: 'Uber rides and subway pass' },
      { id: 't9', userId: uid, type: 'expense', amount: 89.40, category: 'Groceries', date: getPastDate(6), description: 'Trader Joe\'s weekly run' },
      { id: 'ta', userId: uid, type: 'expense', amount: 18.50, category: 'Dining Out', date: getPastDate(5), description: 'Avocado toast & cold brew' },
      { id: 'tb', userId: uid, type: 'expense', amount: 112.00, category: 'Utilities', date: getPastDate(4), description: 'Electric power utility' },
      { id: 'tc', userId: uid, type: 'expense', amount: 55.00, category: 'Health & Fitness', date: getPastDate(3), description: 'Climbing gym day pass & gear rental' },
      { id: 'td', userId: uid, type: 'expense', amount: 210.00, category: 'Shopping', date: getPastDate(2), description: 'Ergonomic office chair' },
      { id: 'te', userId: uid, type: 'expense', amount: 14.50, category: 'Transport', date: getPastDate(1), description: 'Gas station fuel' },
      { id: 'tf', userId: uid, type: 'expense', amount: 64.20, category: 'Dining Out', date: getPastDate(0), description: 'Sushi bar dinner' },
    ];

    const initialBudgets: Budget[] = [
      { id: 'b1', userId: uid, category: 'Groceries', limitAmount: 400 },
      { id: 'b2', userId: uid, category: 'Dining Out', limitAmount: 250 },
      { id: 'b3', userId: uid, category: 'Transport', limitAmount: 180 },
      { id: 'b4', userId: uid, category: 'Entertainment', limitAmount: 100 },
      { id: 'b5', userId: uid, category: 'Shopping', limitAmount: 300 },
      { id: 'b6', userId: uid, category: 'Utilities', limitAmount: 200 },
    ];

    const initialGoals: SavingGoal[] = [
      { id: 'g1', userId: uid, name: 'European Summer Trip', targetAmount: 4500, currentAmount: 2200, deadline: '2026-09-15', color: '#0d9488' },
      { id: 'g2', userId: uid, name: 'Emergency Fund', targetAmount: 10000, currentAmount: 7500, deadline: '2026-12-31', color: '#4f46e5' },
    ];

    const initialBills: FinancialBill[] = [
      { id: 'bi1', userId: uid, title: 'Gym Membership Renewal', amount: 65, dueDate: getPastDate(-5), category: 'Health & Fitness', isPaid: false, isRecurring: true },
      { id: 'bi2', userId: uid, title: 'Rent Invoice', amount: 1450, dueDate: getPastDate(-20), category: 'Housing', isPaid: false, isRecurring: true },
      { id: 'bi3', userId: uid, title: 'Adobe Creative Cloud', amount: 54.99, dueDate: getPastDate(-10), category: 'Utilities', isPaid: true, isRecurring: true },
    ];

    const initialNotifications: Notification[] = [
      {
        id: 'n1',
        userId: uid,
        type: 'success',
        title: 'Welcome to WealthFlow!',
        message: 'Your personal finance account has been successfully initialized with sample data to demonstrate features.',
        date: new Date(now.getTime() - 1000 * 60 * 30).toISOString().replace('T', ' ').substring(0, 16),
        isRead: false
      },
      {
        id: 'n2',
        userId: uid,
        type: 'warning',
        title: 'Budget Alert',
        message: 'Your Groceries budget is at 53% capacity ($213.90 spent of $400.00 limit).',
        date: new Date(now.getTime() - 1000 * 60 * 180).toISOString().replace('T', ' ').substring(0, 16),
        isRead: false
      }
    ];

    localStorage.setItem(`wf_${uid}_transactions`, JSON.stringify(initialTransactions));
    localStorage.setItem(`wf_${uid}_budgets`, JSON.stringify(initialBudgets));
    localStorage.setItem(`wf_${uid}_saving_goals`, JSON.stringify(initialGoals));
    localStorage.setItem(`wf_${uid}_bills`, JSON.stringify(initialBills));
    localStorage.setItem(`wf_${uid}_notifications`, JSON.stringify(initialNotifications));
  };

  // Auth Operations
  const login = async (email: string, name?: string): Promise<boolean> => {
    setLoading(true);
    // Find in localStorage users
    const usersStr = localStorage.getItem('wf_users') || '[]';
    const users = JSON.parse(usersStr) as User[];
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Auto-register user to make UX extremely frictionless
      const newUserId = 'u_' + Math.random().toString(36).substr(2, 9);
      user = {
        id: newUserId,
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`,
        currency: '$',
        targetSavingsRate: 20,
        notificationsEnabled: true,
        themeAccent: 'blue',
        createdAt: new Date().toISOString()
      };
      users.push(user);
      localStorage.setItem('wf_users', JSON.stringify(users));
      
      // Seed first-time data for clean UI experience
      seedMockData(newUserId);
    }

    localStorage.setItem('wf_session', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
    setLoading(false);
    showToast('success', 'Signed in', `Welcome ${user.name}.`);
    return true;
  };

  const signup = async (email: string, name: string): Promise<boolean> => {
    setLoading(true);
    const usersStr = localStorage.getItem('wf_users') || '[]';
    const users = JSON.parse(usersStr) as User[];
    
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      setLoading(false);
      throw new Error('Email is already registered. Please sign in instead.');
    }

    const newUserId = 'u_' + Math.random().toString(36).substr(2, 9);
    const newUser: User = {
      id: newUserId,
      email: email.toLowerCase(),
      name,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`,
      currency: '$',
      targetSavingsRate: 20,
      notificationsEnabled: true,
      themeAccent: 'blue',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('wf_users', JSON.stringify(users));
    
    // Seed sample data for an excellent first impression
    seedMockData(newUserId);

    localStorage.setItem('wf_session', JSON.stringify(newUser));
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    setLoading(false);
    showToast('success', 'Account created', `Welcome ${newUser.name}.`);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('wf_session');
    setCurrentUser(null);
    setIsAuthenticated(false);
    showToast('info', 'Signed out', 'Your local session has ended.');
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem('wf_session', JSON.stringify(updated));

    // Update inside users collection
    const usersStr = localStorage.getItem('wf_users') || '[]';
    const users = JSON.parse(usersStr) as User[];
    const index = users.findIndex(u => u.id === currentUser.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      localStorage.setItem('wf_users', JSON.stringify(users));
    }
  };

  // Scoped Operations: Transactions
  const addTransaction = (tx: Omit<Transaction, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const newTx: Transaction = {
      ...tx,
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
    };
    
    setTransactions(prev => [newTx, ...prev]);

    // Check budget threshold alerts
    if (tx.type === 'expense') {
      const budget = budgets.find(b => b.category.toLowerCase() === tx.category.toLowerCase());
      if (budget) {
        const spentBefore = transactions
          .filter(t => t.type === 'expense' && t.category.toLowerCase() === tx.category.toLowerCase())
          .reduce((sum, t) => sum + t.amount, 0);
        
        const spentNow = spentBefore + tx.amount;
        if (spentNow >= budget.limitAmount) {
          addNotification(
            'warning',
            'Budget Limit Exceeded!',
            `You have spent ${currentUser.currency}${spentNow.toFixed(2)} in your "${budget.category}" category, which exceeds your set budget limit of ${currentUser.currency}${budget.limitAmount.toFixed(2)}.`
          );
        } else if (spentNow >= budget.limitAmount * 0.8) {
          addNotification(
            'warning',
            'Budget Warning (80%)',
            `You have spent ${currentUser.currency}${spentNow.toFixed(2)} in your "${budget.category}" category, approaching 80% of your limit of ${currentUser.currency}${budget.limitAmount.toFixed(2)}.`
          );
        }
      }
    }
  };

  const updateTransaction = (id: string, updates: Partial<Omit<Transaction, 'id' | 'userId'>>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Scoped Operations: Budgets
  const addBudget = (bg: Omit<Budget, 'id' | 'userId'>) => {
    if (!currentUser) return;
    
    // Check if category budget already exists
    const exists = budgets.find(b => b.category.toLowerCase() === bg.category.toLowerCase());
    if (exists) {
      updateBudget(exists.id, { limitAmount: bg.limitAmount });
      return;
    }

    const newBg: Budget = {
      ...bg,
      id: 'bg_' + Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
    };
    setBudgets(prev => [...prev, newBg]);
    addNotification('info', 'Budget Created', `A monthly budget limit of ${currentUser.currency}${bg.limitAmount} has been set for "${bg.category}".`);
  };

  const updateBudget = (id: string, updates: Partial<Omit<Budget, 'id' | 'userId'>>) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    addNotification('success', 'Budget Updated', 'Your spending barrier has been updated.');
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  // Scoped Operations: Saving Goals
  const addSavingGoal = (goal: Omit<SavingGoal, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const newGoal: SavingGoal = {
      ...goal,
      id: 'g_' + Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
    };
    setSavingGoals(prev => [...prev, newGoal]);
    addNotification('success', 'Goal Started!', `You've launched a new savings target: "${goal.name}" for ${currentUser.currency}${goal.targetAmount}!`);
  };

  const updateSavingGoal = (id: string, updates: Partial<Omit<SavingGoal, 'id' | 'userId'>>) => {
    setSavingGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const updated = { ...g, ...updates };
      // Check if newly completed
      if (updated.currentAmount >= updated.targetAmount && g.currentAmount < g.targetAmount) {
        addNotification('success', 'Goal Completed! 🎉', `Congratulations! You've successfully saved ${currentUser?.currency}${updated.targetAmount} for your goal: "${updated.name}"!`);
      }
      return updated;
    }));
  };

  const deleteSavingGoal = (id: string) => {
    setSavingGoals(prev => prev.filter(g => g.id !== id));
  };

  // Scoped Operations: Bills
  const addFinancialBill = (bill: Omit<FinancialBill, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const newBill: FinancialBill = {
      ...bill,
      id: 'bi_' + Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
    };
    setFinancialBills(prev => [...prev, newBill]);
  };

  const updateFinancialBill = (id: string, updates: Partial<Omit<FinancialBill, 'id' | 'userId'>>) => {
    setFinancialBills(prev => prev.map(b => {
      if (b.id !== id) return b;
      const updated = { ...b, ...updates };
      if (updated.isPaid && !b.isPaid) {
        addNotification('success', 'Bill Paid', `Bill payment of ${currentUser?.currency}${b.amount} for "${b.title}" recorded successfully!`);
        
        // Optionally auto-record as a transaction for seamless tracking!
        addTransaction({
          type: 'expense',
          amount: b.amount,
          category: b.category || 'Utilities',
          date: new Date().toISOString().split('T')[0],
          description: `Bill Payment: ${b.title}`,
          isRecurring: b.isRecurring
        });
      }
      return updated;
    }));
  };

  const deleteFinancialBill = (id: string) => {
    setFinancialBills(prev => prev.filter(b => b.id !== id));
  };

  // Scoped Operations: Notifications
  const addNotification = (type: 'info' | 'warning' | 'success', title: string, message: string) => {
    if (!currentUser) return;
    showToast(type, title, message);
    if (!currentUser.notificationsEnabled && type !== 'success') return;
    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);
    const newNotif: Notification = {
      id: 'n_' + Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      type,
      title,
      message,
      date: dateStr,
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Data Actions
  const resetData = () => {
    if (!currentUser) return;
    const uid = currentUser.id;
    localStorage.removeItem(`wf_${uid}_transactions`);
    localStorage.removeItem(`wf_${uid}_budgets`);
    localStorage.removeItem(`wf_${uid}_saving_goals`);
    localStorage.removeItem(`wf_${uid}_bills`);
    localStorage.removeItem(`wf_${uid}_notifications`);
    
    setTransactions([]);
    setBudgets([]);
    setSavingGoals([]);
    setFinancialBills([]);
    setNotifications([]);
    
    seedMockData(uid);
    // Reload from fresh seeded
    const load = <T,>(key: string): T[] => {
      const data = localStorage.getItem(`wf_${uid}_${key}`);
      return data ? JSON.parse(data) : [];
    };
    setTransactions(load<Transaction>('transactions'));
    setBudgets(load<Budget>('budgets'));
    setSavingGoals(load<SavingGoal>('saving_goals'));
    setFinancialBills(load<FinancialBill>('bills'));
    setNotifications(load<Notification>('notifications'));
  };

  const exportBackup = (): string => {
    return buildBackup(currentUser, transactions, budgets, savingGoals, financialBills, notifications);
  };

  const importBackup = (dataStr: string): boolean => {
    if (!currentUser) return false;
    try {
      const parsed = JSON.parse(dataStr);
      if (parsed.transactions && Array.isArray(parsed.transactions)) {
        // Map elements and force userId
        const uid = currentUser.id;
        const txs = parsed.transactions.map((t: any) => ({ ...t, userId: uid, id: t.id || 'tx_' + Math.random().toString(36).substr(2, 9) }));
        setTransactions(txs);
        
        if (parsed.budgets && Array.isArray(parsed.budgets)) {
          setBudgets(parsed.budgets.map((b: any) => ({ ...b, userId: uid, id: b.id || 'bg_' + Math.random().toString(36).substr(2, 9) })));
        }
        if (parsed.savingGoals && Array.isArray(parsed.savingGoals)) {
          setSavingGoals(parsed.savingGoals.map((g: any) => ({ ...g, userId: uid, id: g.id || 'g_' + Math.random().toString(36).substr(2, 9) })));
        }
        if (parsed.financialBills && Array.isArray(parsed.financialBills)) {
          setFinancialBills(parsed.financialBills.map((bi: any) => ({ ...bi, userId: uid, id: bi.id || 'bi_' + Math.random().toString(36).substr(2, 9) })));
        }
        if (parsed.notifications && Array.isArray(parsed.notifications)) {
          setNotifications(parsed.notifications.map((n: any) => ({ ...n, userId: uid, id: n.id || 'n_' + Math.random().toString(36).substr(2, 9) })));
        }
        addNotification('success', 'Import Successful', 'Your financial records backup was successfully restored!');
        return true;
      }
      return false;
    } catch (e) {
      console.error('Backup import error', e);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated,
      loading,
      login,
      signup,
      logout,
      updateProfile,
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      budgets,
      addBudget,
      updateBudget,
      deleteBudget,
      savingGoals,
      addSavingGoal,
      updateSavingGoal,
      deleteSavingGoal,
      financialBills,
      addFinancialBill,
      updateFinancialBill,
      deleteFinancialBill,
      notifications,
      markNotificationRead,
      clearNotifications,
      addNotification,
      resetData,
      importBackup,
      exportBackup
    }}>
      {children}
    </AuthContext.Provider>
  );
};
