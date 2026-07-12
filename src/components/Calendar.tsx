/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FinancialBill } from '../types';
import { EXPENSE_CATEGORIES, parsePositiveAmount } from '../utils/finance';
import { useToast } from '../context/ToastContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalIcon, 
  Plus, 
  Check, 
  X, 
  Trash2,
  Edit3,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  FileText
} from 'lucide-react';

export const Calendar: React.FC = () => {
  const { 
    currentUser, 
    transactions, 
    financialBills, 
    addFinancialBill, 
    updateFinancialBill, 
    deleteFinancialBill, 
    addNotification 
  } = useAuth();
  const { showToast } = useToast();

  // Calendar display state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Day click inspector state
  const [selectedDayStr, setSelectedDayStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAddBillOpen, setIsAddBillOpen] = useState<boolean>(false);
  const [editingBill, setEditingBill] = useState<FinancialBill | null>(null);
  const [eventSearch, setEventSearch] = useState<string>('');
  const [eventFilter, setEventFilter] = useState<'all' | 'transactions' | 'bills' | 'unpaid'>('all');
  const [eventSort, setEventSort] = useState<'amount' | 'title'>('title');

  // New bill state
  const [billTitle, setBillTitle] = useState<string>('');
  const [billAmount, setBillAmount] = useState<string>('');
  const [billCategory, setBillCategory] = useState<string>('Utilities');
  const [billDueDate, setBillDueDate] = useState<string>(selectedDayStr);
  const [billError, setBillError] = useState<string>('');

  const currency = currentUser?.currency || '$';
  const categoriesList = EXPENSE_CATEGORIES;

  // Grid dates construction helper
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of current month
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    // Days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    // Days in previous month
    const prevTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // Pad previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevTotalDays - i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true });
    }

    // Pad next month days to make clean 6-row grid (42 blocks)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }

    return days;
  };

  const gridDays = getDaysInMonth(currentDate);

  // Date converters
  const formatDateStr = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Switch Month
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Fetch events for a day
  const getDayEvents = (dayStr: string) => {
    const dayTxs = transactions.filter(t => t.date === dayStr);
    const dayBills = financialBills.filter(b => b.dueDate === dayStr);
    return {
      txs: dayTxs,
      bills: dayBills
    };
  };

  const selectedDayEvents = getDayEvents(selectedDayStr);
  const filteredBills = useMemo(() => selectedDayEvents.bills
    .filter(bill => {
      const matchesSearch = `${bill.title} ${bill.category}`.toLowerCase().includes(eventSearch.toLowerCase());
      const matchesFilter = eventFilter === 'all' || eventFilter === 'bills' || (eventFilter === 'unpaid' && !bill.isPaid);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => eventSort === 'amount' ? b.amount - a.amount : a.title.localeCompare(b.title)),
    [selectedDayEvents.bills, eventSearch, eventFilter, eventSort],
  );
  const filteredTransactions = useMemo(() => selectedDayEvents.txs
    .filter(tx => {
      const matchesSearch = `${tx.description} ${tx.category}`.toLowerCase().includes(eventSearch.toLowerCase());
      const matchesFilter = eventFilter === 'all' || eventFilter === 'transactions';
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => eventSort === 'amount' ? b.amount - a.amount : a.description.localeCompare(b.description)),
    [selectedDayEvents.txs, eventSearch, eventFilter, eventSort],
  );

  const openBillForm = (bill?: FinancialBill) => {
    setEditingBill(bill || null);
    setBillTitle(bill?.title || '');
    setBillAmount(bill ? String(bill.amount) : '');
    setBillCategory(bill?.category || 'Utilities');
    setBillDueDate(bill?.dueDate || selectedDayStr);
    setBillError('');
    setIsAddBillOpen(true);
  };

  const handleAddBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBillError('');
    const amountNum = parsePositiveAmount(billAmount);
    if (!amountNum) {
      setBillError('Enter a bill amount greater than 0.');
      showToast('error', 'Invalid bill', 'Enter a bill amount greater than 0.');
      return;
    }
    if (!billTitle.trim()) {
      setBillError('Add a bill title.');
      return;
    }

    const payload = {
      title: billTitle.trim(),
      amount: amountNum,
      dueDate: billDueDate,
      category: billCategory,
      isPaid: editingBill?.isPaid || false,
      isRecurring: editingBill?.isRecurring || false
    };

    if (editingBill) {
      updateFinancialBill(editingBill.id, payload);
      addNotification('success', 'Invoice Updated', `Updated bill "${payload.title}" due on ${payload.dueDate}.`);
      if (payload.dueDate !== selectedDayStr) setSelectedDayStr(payload.dueDate);
    } else {
      addFinancialBill(payload);
      addNotification('info', 'Invoice Scheduled', `Scheduled upcoming bill "${billTitle}" for ${currency}${amountNum} due on ${billDueDate}.`);
    }

    // Reset
    setBillTitle('');
    setBillAmount('');
    setEditingBill(null);
    setIsAddBillOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h2 className="font-display font-bold text-2xl tracking-tight text-slate-900">Financial Calendar</h2>
        <p className="text-xs text-slate-500 font-medium">Verify bill invoice schedules and plan future capital reserves</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Grid card */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex flex-col justify-between">
          {/* Calendar Header selector */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 select-none">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-slate-900 text-blue-500 rounded-xl">
                <CalIcon className="h-4.5 w-4.5" />
              </div>
              <span className="font-display font-extrabold text-lg text-slate-800">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <button
                id="btn-calendar-prev"
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                id="btn-calendar-today"
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDayStr(new Date().toISOString().split('T')[0]);
                }}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
              >
                Today
              </button>
              <button
                id="btn-calendar-next"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Days Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-slate-400 uppercase tracking-wider text-3xs pb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Core Grid blocks */}
          <div className="grid grid-cols-7 gap-1">
            {gridDays.map((dayBlock, idx) => {
              const dayStr = formatDateStr(dayBlock.date);
              const events = getDayEvents(dayStr);
              const isSelected = selectedDayStr === dayStr;
              const isToday = formatDateStr(new Date()) === dayStr;

              // Indicators counts
              const incCount = events.txs.filter(t => t.type === 'income').length;
              const expCount = events.txs.filter(t => t.type === 'expense').length;
              const billCount = events.bills.filter(b => !b.isPaid).length;

              return (
                <div
                  id={`calendar-day-block-${dayStr}`}
                  key={idx}
                onClick={() => {
                  setSelectedDayStr(dayStr);
                  setIsAddBillOpen(false);
                  setEditingBill(null);
                }}
                  className={`
                    min-h-16 p-1.5 border border-slate-100 rounded-xl flex flex-col justify-between transition-all duration-150 cursor-pointer select-none
                    ${dayBlock.isCurrentMonth ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/40 text-slate-300 opacity-55'}
                    ${isSelected ? 'ring-2 ring-slate-900 border-transparent bg-slate-900/5' : ''}
                    ${isToday ? 'bg-blue-500/10 border-blue-500/20' : ''}
                  `}
                >
                  <span className={`text-2xs font-extrabold font-mono ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                    {dayBlock.date.getDate()}
                  </span>

                  {/* Flow dot list */}
                  <div className="flex flex-wrap items-center gap-0.5 mt-1">
                    {incCount > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title={`${incCount} Incomes`} />
                    )}
                    {expCount > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" title={`${expCount} Expenses`} />
                    )}
                    {billCount > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" title={`${billCount} Unpaid Invoices`} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day details panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex flex-col justify-between" id="day-inspector-card">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 block font-mono">Day Inspector</span>
                <span className="font-display font-bold text-sm text-slate-800">{selectedDayStr}</span>
              </div>
              <button
                id="btn-calendar-add-bill"
                onClick={() => openBillForm()}
                className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-3xs font-extrabold rounded-lg transition-all"
              >
                <Plus className="h-3 w-3" />
                <span>Schedule Bill</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  id="calendar-event-search"
                  type="text"
                  placeholder="Search this day's events..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-2xs focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <Filter className="h-3 w-3 text-slate-400" />
                  <select
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value as typeof eventFilter)}
                    className="w-full bg-transparent text-3xs font-bold text-slate-600 focus:outline-none"
                  >
                    <option value="all">All Events</option>
                    <option value="transactions">Transactions</option>
                    <option value="bills">Bills</option>
                    <option value="unpaid">Unpaid Bills</option>
                  </select>
                </div>
                <select
                  value={eventSort}
                  onChange={(e) => setEventSort(e.target.value as typeof eventSort)}
                  className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-3xs font-bold text-slate-600 focus:outline-none"
                >
                  <option value="title">Sort by Title</option>
                  <option value="amount">Sort by Amount</option>
                </select>
              </div>
            </div>

            {/* Quick Bill addition inside day pane */}
            {isAddBillOpen && (
              <form onSubmit={handleAddBillSubmit} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-3xs font-bold text-slate-600">{editingBill ? 'Edit invoice details' : `Schedule Invoice due ${selectedDayStr}`}</span>
                  <button type="button" onClick={() => { setIsAddBillOpen(false); setEditingBill(null); }} className="text-slate-400 hover:text-slate-600" aria-label="Close bill form">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {billError && (
                  <div className="p-2 bg-rose-50 border border-rose-100 text-rose-700 text-3xs rounded-lg font-semibold">
                    {billError}
                  </div>
                )}

                <div className="space-y-2">
                  <input
                    id="calendar-bill-title"
                    type="text"
                    required
                    placeholder="e.g., Water utility bill"
                    value={billTitle}
                    onChange={(e) => setBillTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      id="calendar-bill-amount"
                      type="number"
                      required
                      placeholder="Amount"
                      value={billAmount}
                      onChange={(e) => setBillAmount(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />

                    <select
                      id="calendar-bill-category"
                      value={billCategory}
                      onChange={(e) => setBillCategory(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-2xs font-semibold"
                    >
                      {categoriesList.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <input
                    id="calendar-bill-due-date"
                    type="date"
                    required
                    value={billDueDate}
                    onChange={(e) => setBillDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                </div>

                <button
                  id="btn-calendar-bill-submit"
                  type="submit"
                  className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-3xs font-bold hover:bg-slate-800"
                >
                  {editingBill ? 'Update Due Event' : 'Confirm Due Event'}
                </button>
              </form>
            )}

            {/* Event ledger results */}
            <div className="space-y-4 max-h-72 overflow-y-auto">
              {/* Bills due on this day */}
              {filteredBills.length > 0 && (
                <div className="space-y-2">
                  <span className="text-3xs font-bold uppercase tracking-wider text-rose-500 block">Due Invoices</span>
                  <div className="space-y-2">
                    {filteredBills.map(bill => (
                      <div key={bill.id} className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate leading-snug">{bill.title}</p>
                          <span className={`inline-block text-4xs font-semibold px-1.5 py-0.5 rounded-full border ${bill.isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                            {bill.isPaid ? 'Settled' : 'Unpaid'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0 pl-2">
                          <span className="text-xs font-mono font-bold text-slate-800">{currency}{bill.amount}</span>
                          {!bill.isPaid && (
                            <button
                              id={`calendar-pay-bill-${bill.id}`}
                              onClick={() => updateFinancialBill(bill.id, { isPaid: true })}
                              className="p-1 bg-white border border-slate-200 hover:bg-emerald-50 text-emerald-600 hover:border-emerald-200 rounded transition-colors"
                              title="Settle bill payment"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            id={`calendar-edit-bill-${bill.id}`}
                            onClick={() => openBillForm(bill)}
                            className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors"
                            title="Edit bill schedule"
                            aria-label={`Edit ${bill.title}`}
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            id={`calendar-delete-bill-${bill.id}`}
                            onClick={() => {
                              if (confirm('Cancel bill schedule?')) {
                                deleteFinancialBill(bill.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transactions on this day */}
              <div>
                <span className="text-3xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Ledger Activities</span>
                {filteredTransactions.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs font-medium">
                    No transactions recorded on this date.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTransactions.map(tx => (
                      <div key={tx.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate leading-tight">{tx.description}</p>
                          <span className="text-4xs text-slate-400 font-semibold uppercase">{tx.category}</span>
                        </div>
                        <span className={`text-xs font-mono font-bold shrink-0 pl-2 ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {tx.type === 'income' ? '+' : '-'}{currency}{tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-center font-sans">
            <span className="text-4xs text-slate-400 font-semibold block pt-4 border-t border-slate-100 select-none">
              Double-click calendar slots to change dates immediately
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
