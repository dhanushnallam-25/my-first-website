/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, Sparkles, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';

export const Auth: React.FC = () => {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [formLoading, setFormLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Email address is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (isSignUp && !name.trim()) {
      setError('Name is required for sign up');
      return;
    }

    setFormLoading(true);
    try {
      if (isSignUp) {
        await signup(email.trim(), name.trim());
      } else {
        await login(email.trim());
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setFormLoading(false);
    }
  };

  // Quick action to login with demo account
  const handleDemoLogin = async () => {
    setError('');
    setFormLoading(true);
    try {
      await login('demo@wealthflow.app', 'Demo User');
    } catch (err: any) {
      setError('Demo login failed');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-height-screen flex flex-col md:flex-row bg-slate-50 text-slate-900" style={{ minHeight: '100vh' }}>
      {/* Left side panel: Value proposition */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden select-none">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        
        {/* Header */}
        <div className="flex items-center space-x-3 z-10">
          <div className="p-2.5 bg-blue-600 rounded-xl shadow-md">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">WealthFlow</span>
        </div>

        {/* Dynamic features highlights */}
        <div className="my-auto space-y-8 z-10 max-w-lg">
          <div className="space-y-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-400/10 text-blue-400 border border-blue-400/20">
              <Sparkles className="h-3 w-3 mr-1" /> Intelligent Wealth Planner
            </span>
            <h1 className="font-display text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Master your money with smart, persistent insights.
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed font-sans">
              Take complete control of your financial destiny. WealthFlow tracks transactions, coordinates smart budgets, manages goals, and keeps everything securely synchronized locally.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-slate-800 rounded-lg text-blue-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Rich Analytics</h4>
                <p className="text-xs text-slate-400 mt-0.5">Visualize monthly cash flows and spending habits dynamically.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-slate-800 rounded-lg text-blue-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Isolated Sync</h4>
                <p className="text-xs text-slate-400 mt-0.5">Data remains private, encrypted, and isolated on your browser session.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="z-10 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} WealthFlow. Standard Local Storage Persistent Layer.
        </div>
      </div>

      {/* Right side panel: Auth Card */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12" id="auth-panel">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-left space-y-2">
            {/* Logo on mobile */}
            <div className="flex md:hidden items-center justify-center space-x-2.5 mb-6">
              <div className="p-2 bg-blue-600 rounded-xl shadow">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight">WealthFlow</span>
            </div>
            
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-sm text-slate-500 font-sans">
              {isSignUp 
                ? 'Sign up below to access custom budgets, target goals, and live insights.' 
                : 'Enter your email to sign in. No password required—we securely authenticate you via local state.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-medium animate-pulse" id="auth-error-msg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {isSignUp && (
                <div className="space-y-1.5">
                  <label htmlFor="user-name" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Full Name</label>
                  <input
                    id="user-name"
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="user-email" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</label>
                <input
                  id="user-email"
                  type="email"
                  required
                  placeholder="jane.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={formLoading}
              className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
            >
              {formLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="flex items-center">
                  {isSignUp ? 'Get Started' : 'Sign In'} <ArrowRight className="h-4 w-4 ml-2" />
                </span>
              )}
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Or Quick Access</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button
            id="btn-demo-login"
            onClick={handleDemoLogin}
            disabled={formLoading}
            className="w-full flex items-center justify-center py-3 px-4 border border-slate-200 rounded-xl text-sm font-semibold bg-white text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
          >
            Sign In with Preloaded Demo Data
          </button>

          <div className="text-center font-sans">
            <button
              id="btn-toggle-signup"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'New to WealthFlow? Create free account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
