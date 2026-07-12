/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { downloadTextFile } from '../utils/csv';
import { useToast } from '../context/ToastContext';
import { 
  User as UserIcon, 
  Sparkles, 
  Sliders, 
  Bell, 
  Download, 
  Upload, 
  RefreshCw, 
  ShieldAlert, 
  Check, 
  CheckCircle2,
  X
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { 
    currentUser, 
    updateProfile, 
    resetData, 
    exportBackup, 
    importBackup, 
    addNotification 
  } = useAuth();
  const { showToast } = useToast();

  // Profile Form state
  const [name, setName] = useState<string>(currentUser?.name || '');
  const [avatarSeed, setAvatarSeed] = useState<string>(currentUser?.name || 'Jane');
  const [currency, setCurrency] = useState<string>(currentUser?.currency || '$');
  const [savingsRate, setSavingsRate] = useState<number>(currentUser?.targetSavingsRate || 20);
  const [notifEnabled, setNotifEnabled] = useState<boolean>(currentUser?.notificationsEnabled ?? true);
  const [accent, setAccent] = useState<'blue' | 'teal' | 'indigo' | 'emerald' | 'amber' | 'rose'>(currentUser?.themeAccent || 'blue');

  // Backup states
  const [isBackupSuccess, setIsBackupSuccess] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [importJson, setImportJson] = useState<string>('');
  const [importError, setImportError] = useState<string>('');
  const [settingsError, setSettingsError] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const currenciesList = [
    { label: 'US Dollar ($)', value: '$' },
    { label: 'Euro (€)', value: '€' },
    { label: 'British Pound (£)', value: '£' },
    { label: 'Yen / Yuan (¥)', value: '¥' },
    { label: 'Indian Rupee (₹)', value: '₹' },
  ];

  const accentsList: { id: typeof accent; name: string; hex: string }[] = [
    { id: 'blue', name: 'Royal Blue (Active Theme)', hex: 'bg-blue-600' },
    { id: 'teal', name: 'Teal', hex: 'bg-teal-500' },
    { id: 'indigo', name: 'Indigo', hex: 'bg-indigo-500' },
    { id: 'emerald', name: 'Emerald', hex: 'bg-emerald-500' },
    { id: 'amber', name: 'Amber', hex: 'bg-amber-500' },
    { id: 'rose', name: 'Rose', hex: 'bg-rose-500' }
  ];

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    if (!name.trim()) {
      setSettingsError('Display name is required.');
      showToast('error', 'Invalid settings', 'Display name is required.');
      return;
    }
    setIsSaving(true);

    updateProfile({
      name: name.trim(),
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(avatarSeed)}`,
      currency,
      targetSavingsRate: savingsRate,
      notificationsEnabled: notifEnabled,
      themeAccent: accent
    });

    addNotification('success', 'Settings Synchronized', 'Your profile settings and preference configurations have been successfully saved!');
    window.setTimeout(() => setIsSaving(false), 250);
  };

  // Triggers file download of JSON Backup
  const handleExport = () => {
    setIsBackupSuccess(false);
    try {
      const dataStr = exportBackup();
      downloadTextFile(dataStr, `wealthflow_backup_${currentUser?.name.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
      
      setIsBackupSuccess(true);
      addNotification('success', 'Backup Exported', 'Your complete WealthFlow JSON backup is ready.');
      setTimeout(() => setIsBackupSuccess(false), 3000);
    } catch (err) {
      console.error('Backup download failure', err);
      showToast('error', 'Export failed', 'Unable to prepare the backup file.');
    }
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');
    if (!importJson.trim()) {
      setImportError('Please paste a valid JSON backup string.');
      return;
    }

    const success = importBackup(importJson);
    if (success) {
      setImportJson('');
      setIsImportOpen(false);
    } else {
      setImportError('Failed to parse backup. Ensure it is a valid WealthFlow exported JSON schema.');
    }
  };

  const handleResetData = () => {
    if (confirm('WARNING: This will permanently wipe your entire transactions list, category budgets, and financial bills, and reload the default demo sandbox data. Are you absolutely sure?')) {
      setIsResetting(true);
      resetData();
      addNotification('warning', 'Database Reset', 'Your localized transaction database has been reset to default sandbox demo data.');
      window.setTimeout(() => setIsResetting(false), 300);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h2 className="font-display font-bold text-2xl tracking-tight text-slate-900">Account Settings</h2>
        <p className="text-xs text-slate-500 font-medium font-sans">Update profile factors, currency rates, target margins, and manage local data backups</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card and general details form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs">
          <div className="border-b border-slate-100 pb-3.5 mb-5">
            <h4 className="font-display font-bold text-base text-slate-900">User Specifications</h4>
            <p className="text-3xs text-slate-400">Configure public display profiles and parameters</p>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-5">
            {settingsError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium">
                {settingsError}
              </div>
            )}
            {/* Quick Profile display header */}
            <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <img
                src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(avatarSeed)}`}
                alt="Avatar Preview"
                className="h-16 w-16 bg-white border border-slate-200 rounded-xl p-1"
              />
              <div className="space-y-1">
                <span className="text-3xs font-extrabold uppercase tracking-wider text-blue-600 block">Avatar Customization</span>
                <input
                  id="avatar-seed-input"
                  type="text"
                  placeholder="Change avatar keyword"
                  value={avatarSeed}
                  onChange={(e) => setAvatarSeed(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none w-48 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full name input */}
              <div className="space-y-1">
                <label htmlFor="settings-user-name" className="text-3xs font-bold uppercase tracking-wider text-slate-400">Display Name</label>
                <input
                  id="settings-user-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* Currency Selector */}
              <div className="space-y-1">
                <label htmlFor="settings-user-currency" className="text-3xs font-bold uppercase tracking-wider text-slate-400">Reporting Currency</label>
                <select
                  id="settings-user-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  {currenciesList.map(curr => (
                    <option key={curr.value} value={curr.value}>{curr.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Savings Rate (Slider!) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">Savings Target Goal Rate</span>
                <span className="text-blue-600">{savingsRate}% of earnings</span>
              </div>
              <input
                id="settings-savings-rate-slider"
                type="range"
                min="5"
                max="75"
                step="5"
                value={savingsRate}
                onChange={(e) => setSavingsRate(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-4xs text-slate-400 font-semibold block">
                Recommended minimum rate: 20%. Budget barriers adjust accordingly.
              </span>
            </div>

            {/* Notification settings toggle */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 select-none">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800">Threshold Alert Notifications</span>
                <p className="text-3xs text-slate-400 font-medium">Trigger warning dialogs once budget utilization breaches 80%</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="settings-notif-toggle"
                  type="checkbox"
                  checked={notifEnabled}
                  onChange={(e) => setNotifEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <button
              id="btn-settings-save"
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-60"
            >
              {isSaving ? 'Synchronizing...' : 'Synchronize Changes'}
            </button>
          </form>
        </div>

        {/* Database Management and Danger Area side panel */}
        <div className="space-y-6">
          {/* Data Portability Backups panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-display font-bold text-sm text-slate-800">Portability Backups</h4>
              <p className="text-4xs text-slate-400 leading-normal">Keep offsite records by exporting WealthFlow datasets</p>
            </div>

            <div className="space-y-2.5">
              {/* Export backup */}
              <button
                id="btn-settings-export"
                onClick={handleExport}
                className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-3xs cursor-pointer"
              >
                <span className="flex items-center space-x-2">
                  <Download className="h-4 w-4 text-slate-400" />
                  <span>Download JSON Backup</span>
                </span>
                {isBackupSuccess && (
                  <span className="text-emerald-500 flex items-center text-3xs font-semibold">
                    <Check className="h-3 w-3 mr-0.5" /> Ready
                  </span>
                )}
              </button>

              {/* Import backup */}
              <button
                id="btn-settings-import-trigger"
                onClick={() => setIsImportOpen(true)}
                className="w-full flex items-center space-x-2 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-3xs cursor-pointer"
              >
                <Upload className="h-4 w-4 text-slate-400" />
                <span>Restore JSON Backup</span>
              </button>
            </div>
          </div>

          {/* DANGER DESTRUCTIVE ZONE */}
          <div className="bg-white p-5 rounded-2xl border border-rose-200/50 shadow-3xs space-y-4">
            <div className="border-b border-rose-100 pb-3 flex items-center space-x-1.5 text-rose-600">
              <ShieldAlert className="h-4.5 w-4.5" />
              <h4 className="font-display font-bold text-sm">Danger Area</h4>
            </div>

            <div className="space-y-3">
              <p className="text-4xs text-slate-400 leading-relaxed font-medium">
                Resetting deletes all transactions, goals, and customized budgets created on this browser session, seeding default mock data. This is irreversible.
              </p>

              <button
                id="btn-settings-reset-db"
                onClick={handleResetData}
                disabled={isResetting}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className="h-4 w-4 shrink-0" />
                <span>{isResetting ? 'Resetting...' : 'Reset to Sandbox Demo'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* JSON Backup Import Modal Popup */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="backup-import-modal">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="font-display font-bold text-sm text-slate-800">Restore WealthFlow Backup</span>
              <button onClick={() => setIsImportOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-4 space-y-4">
              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium animate-pulse">
                  {importError}
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="settings-import-json" className="text-3xs font-bold uppercase tracking-wider text-slate-400 block font-sans">Paste Exported JSON Text</label>
                <textarea
                  id="settings-import-json"
                  rows={6}
                  required
                  placeholder='{"user": {...}, "transactions": [...]}'
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  id="import-modal-cancel"
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  id="import-modal-submit"
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                >
                  Restore Backup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
