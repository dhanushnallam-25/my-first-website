/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Wallet } from 'lucide-react';
import { ToastProvider } from './context/ToastContext';

const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const Transactions = lazy(() => import('./components/Transactions').then(module => ({ default: module.Transactions })));
const Budgets = lazy(() => import('./components/Budgets').then(module => ({ default: module.Budgets })));
const Analytics = lazy(() => import('./components/Analytics').then(module => ({ default: module.Analytics })));
const Calendar = lazy(() => import('./components/Calendar').then(module => ({ default: module.Calendar })));
const Settings = lazy(() => import('./components/Settings').then(module => ({ default: module.Settings })));

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Loading Splash Screen
  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white select-none">
        <div className="space-y-4 flex flex-col items-center">
          <div className="p-3 bg-teal-500 rounded-2xl shadow-xl animate-bounce">
            <Wallet className="h-8 w-8 text-slate-900" />
          </div>
          <div className="space-y-1 text-center">
            <h2 className="font-display font-bold text-xl tracking-tight">WealthFlow</h2>
            <p className="text-3xs text-slate-400 font-mono">Synchronizing secure local sandbox...</p>
          </div>
          <div className="h-1 w-24 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-teal-500 rounded-full animate-infinite-scroll" style={{ animation: 'shimmer 1.5s infinite linear' }} />
          </div>
        </div>
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  // Not authenticated? Redirect to Auth Screen
  if (!isAuthenticated) {
    return <Auth />;
  }

  // Active Tab router rendering
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'transactions':
        return <Transactions />;
      case 'budgets':
        return <Budgets />;
      case 'analytics':
        return <Analytics />;
      case 'calendar':
        return <Calendar />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs">Loading section...</div>}>
        {renderActiveTab()}
      </Suspense>
    </Layout>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
