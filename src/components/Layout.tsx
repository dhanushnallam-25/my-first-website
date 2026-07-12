/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Receipt, 
  PiggyBank, 
  LineChart, 
  Calendar as CalendarIcon, 
  Settings as SettingsIcon, 
  LogOut, 
  Bell, 
  Menu, 
  X, 
  User,
  Wallet,
  Clock,
  Sparkles
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { currentUser, logout, notifications, markNotificationRead, clearNotifications } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'budgets', label: 'Budgets & Limits', icon: PiggyBank },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'calendar', label: 'Financial Calendar', icon: CalendarIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT';
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
        setIsNotifOpen(false);
        setIsProfileOpen(false);
        return;
      }
      if (isTyping) return;
      if (event.altKey) {
        const index = Number(event.key) - 1;
        if (index >= 0 && index < menuItems.length) {
          event.preventDefault();
          setActiveTab(menuItems[index].id);
          setIsSidebarOpen(false);
        }
      }
      if (event.key.toLowerCase() === 'n') {
        setIsNotifOpen(prev => !prev);
        setIsProfileOpen(false);
      }
      if (event.key.toLowerCase() === 's') {
        setActiveTab('settings');
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [setActiveTab]);

  // Sync color accents
  const accentClasses = {
    blue: 'bg-blue-600 text-blue-600 hover:bg-blue-50 border-blue-600 text-blue-600',
    teal: 'bg-teal-500 text-teal-600 hover:bg-teal-50 border-teal-500 text-teal-500',
    indigo: 'bg-indigo-500 text-indigo-600 hover:bg-indigo-50 border-indigo-500 text-indigo-500',
    emerald: 'bg-emerald-500 text-emerald-600 hover:bg-emerald-50 border-emerald-500 text-emerald-500',
    amber: 'bg-amber-500 text-amber-600 hover:bg-amber-50 border-amber-500 text-amber-500',
    rose: 'bg-rose-500 text-rose-600 hover:bg-rose-50 border-rose-500 text-rose-500',
  };

  const themeAccent = currentUser?.themeAccent || 'blue';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Mobile Header Banner */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 z-30 sticky top-0">
        <div className="flex items-center space-x-2.5">
          <button 
            id="btn-toggle-sidebar"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 focus:outline-none"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="p-1.5 bg-blue-600 rounded-lg shadow-xs">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">WealthFlow</span>
        </div>
        
        {/* Right tools on mobile */}
        <div className="flex items-center space-x-2">
          {/* Mobile Notifications button */}
          <button
            id="btn-mobile-notif"
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsProfileOpen(false);
            }}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 relative focus:outline-none"
            aria-label="Open notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </button>
          
          <img
            id="avatar-mobile-profile"
            src={currentUser?.avatarUrl}
            alt="User avatar"
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotifOpen(false);
            }}
            className="h-7 w-7 rounded-full border border-slate-200 cursor-pointer"
          />
        </div>
      </header>

      <div className="flex-grow flex relative">
        {/* Sidebar Overlay for Mobile */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-35"
          />
        )}

        {/* Sidebar Panel */}
        <aside className={`
          fixed top-0 bottom-0 left-0 bg-slate-950 text-slate-400 w-64 border-r border-slate-900 flex flex-col justify-between z-40 transform transition-transform duration-300 ease-in-out
          md:translate-x-0 md:static md:z-10
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex-1 flex flex-col min-h-0">
            {/* Logo Section */}
            <div className="flex items-center justify-between p-6 border-b border-slate-900">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <span className="font-display font-bold text-lg text-white tracking-tight">WealthFlow</span>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 focus:outline-none"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-600 px-3 mb-2">Core Financials</div>
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    id={`sidebar-tab-${item.id}`}
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 group
                      ${isActive 
                        ? 'bg-slate-900 text-white shadow-xs font-semibold' 
                        : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'}
                    `}
                    aria-current={isActive ? 'page' : undefined}
                    title={`${item.label} (Alt+${menuItems.findIndex(menuItem => menuItem.id === item.id) + 1})`}
                  >
                    <IconComponent className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-300 transition-colors'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick User summary in Sidebar */}
          <div className="p-4 border-t border-slate-900 bg-slate-950">
            <div className="bg-slate-900 rounded-xl p-3 flex flex-col gap-3 border border-slate-850">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={currentUser?.avatarUrl}
                  alt={currentUser?.name}
                  className="h-8 w-8 rounded-lg border border-slate-800 bg-slate-950 p-0.5 shrink-0"
                />
                <div className="truncate min-w-0">
                  <p className="text-xs font-bold truncate text-white leading-tight">{currentUser?.name}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{currentUser?.email}</p>
                </div>
              </div>

              <button
                id="btn-sidebar-logout"
                onClick={logout}
                className="w-full flex items-center justify-center space-x-1.5 py-1.5 bg-slate-950 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-800 hover:border-rose-500/20 text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Desktop Top Header Bar */}
          <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 z-20 sticky top-0">
            {/* Welcome context */}
            <div className="flex items-center space-x-3">
              <h1 className="font-display text-xl font-bold tracking-tight text-slate-900">
                Welcome, <span className="text-blue-600">{currentUser?.name}</span>
              </h1>
              <div className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase rounded-full border border-green-200 flex items-center shadow-3xs">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping mr-1.5 shrink-0" />
                Secure Session
              </div>
            </div>

            {/* Top Bar utilities */}
            <div className="flex items-center space-x-5">
              {/* Desktop Clock */}
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg select-none">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>{currentTime}</span>
              </div>

              {/* Notification Center */}
              <div className="relative">
                <button
                  id="btn-desktop-notif"
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    setIsProfileOpen(false);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 relative focus:outline-none transition-colors border border-slate-200"
                  aria-label="Open notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                  )}
                </button>

                {/* Notifications Dropdown Card */}
                {isNotifOpen && (
                  <>
                    <div onClick={() => setIsNotifOpen(false)} className="fixed inset-0 z-30" />
                    <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 overflow-hidden" id="notification-dropdown-card">
                      <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notifications ({unreadCount})</span>
                        {notifications.length > 0 && (
                          <button 
                            id="btn-clear-notif"
                            onClick={clearNotifications}
                            className="text-2xs font-semibold text-rose-500 hover:text-rose-600 transition-colors"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-xs">
                            No notifications at this time.
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            const notifColors = {
                              info: 'bg-indigo-50 border-indigo-200 text-indigo-700',
                              warning: 'bg-rose-50 border-rose-200 text-rose-700',
                              success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                            };
                            return (
                              <div 
                                key={notif.id} 
                                onClick={() => markNotificationRead(notif.id)}
                                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-start space-x-2.5 ${notif.isRead ? 'opacity-65' : ''}`}
                              >
                                <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${notif.isRead ? 'bg-slate-300' : 'bg-blue-600'}`} />
                                <div className="space-y-0.5">
                                  <p className="text-xs font-bold text-slate-800 leading-tight">{notif.title}</p>
                                  <p className="text-2xs text-slate-500 leading-normal">{notif.message}</p>
                                  <p className="text-3xs text-slate-400 font-mono">{notif.date}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Profile details */}
              <div className="relative">
                <button
                  id="btn-desktop-profile"
                  onClick={() => {
                    setIsProfileOpen(!isProfileOpen);
                    setIsNotifOpen(false);
                  }}
                  className="flex items-center space-x-2.5 p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 focus:outline-none transition-colors border border-slate-200 cursor-pointer"
                  aria-label="Open profile menu"
                >
                  <img
                    src={currentUser?.avatarUrl}
                    alt={currentUser?.name}
                    className="h-7 w-7 rounded-lg"
                  />
                  <span className="text-xs font-bold text-slate-700">{currentUser?.name}</span>
                </button>

                {/* Profile drop card */}
                {isProfileOpen && (
                  <>
                    <div onClick={() => setIsProfileOpen(false)} className="fixed inset-0 z-30" />
                    <div className="absolute right-0 mt-2.5 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 overflow-hidden" id="profile-dropdown-card">
                      <div className="p-4 bg-slate-50 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-800">{currentUser?.name}</p>
                        <p className="text-2xs text-slate-500 truncate mt-0.5">{currentUser?.email}</p>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <button
                          id="profile-drop-settings"
                          onClick={() => {
                            setActiveTab('settings');
                            setIsProfileOpen(false);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-950 rounded-xl"
                        >
                          <SettingsIcon className="h-4 w-4" />
                          <span>Account Settings</span>
                        </button>
                        <button
                          id="profile-drop-logout"
                          onClick={() => {
                            logout();
                            setIsProfileOpen(false);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Core Page Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
            <div className="page-transition max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Shared Dropdowns for Mobile display to overlay cleanly */}
      {isNotifOpen && (
        <div className="md:hidden fixed inset-0 z-45 flex justify-end" id="mobile-notif-drawer">
          <div onClick={() => setIsNotifOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
          <div className="relative w-80 max-w-full bg-white h-full shadow-2xl flex flex-col p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-display font-bold text-base text-slate-900">Notifications ({unreadCount})</span>
              <button onClick={() => setIsNotifOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  No notifications at this time.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => {
                      markNotificationRead(notif.id);
                      setIsNotifOpen(false);
                    }}
                    className={`py-3.5 flex items-start space-x-2.5 cursor-pointer hover:bg-slate-50 px-2 rounded-lg ${notif.isRead ? 'opacity-65' : ''}`}
                  >
                    <div className={`h-2.5 w-2.5 rounded-full mt-1 shrink-0 ${notif.isRead ? 'bg-slate-300' : 'bg-blue-600'}`} />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800 leading-tight">{notif.title}</p>
                      <p className="text-2xs text-slate-500 mt-0.5">{notif.message}</p>
                      <p className="text-3xs text-slate-400 font-mono mt-1">{notif.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <button 
                id="btn-mobile-clear-notif"
                onClick={() => {
                  clearNotifications();
                  setIsNotifOpen(false);
                }}
                className="w-full py-2.5 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-semibold text-xs rounded-xl text-center"
              >
                Clear All Notifications
              </button>
            )}
          </div>
        </div>
      )}

      {isProfileOpen && (
        <div className="md:hidden fixed inset-0 z-45 flex justify-end" id="mobile-profile-drawer">
          <div onClick={() => setIsProfileOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
          <div className="relative w-80 max-w-full bg-white h-full shadow-2xl flex flex-col p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-display font-bold text-base text-slate-900">My Profile</span>
              <button onClick={() => setIsProfileOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col items-center text-center space-y-3 py-4 bg-slate-50 rounded-2xl border border-slate-100">
              <img
                src={currentUser?.avatarUrl}
                alt={currentUser?.name}
                className="h-16 w-16 rounded-xl border-2 border-white shadow-md bg-white p-1"
              />
              <div>
                <p className="text-base font-bold text-slate-900">{currentUser?.name}</p>
                <p className="text-xs text-slate-500 truncate max-w-xs">{currentUser?.email}</p>
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <button
                id="mobile-drawer-settings"
                onClick={() => {
                  setActiveTab('settings');
                  setIsProfileOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-950 rounded-xl"
              >
                <SettingsIcon className="h-5 w-5 text-slate-400" />
                <span>Account Settings</span>
              </button>
              <button
                id="mobile-drawer-logout"
                onClick={() => {
                  logout();
                  setIsProfileOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
              >
                <LogOut className="h-5 w-5" />
                <span>Log Out of Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
