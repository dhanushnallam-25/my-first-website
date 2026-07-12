/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Transaction } from '../types';
import { ALL_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, parsePositiveAmount, todayISO } from '../utils/finance';
import { downloadTextFile, parseTransactionsCsv, transactionsToCsv } from '../utils/csv';
import { useToast } from '../context/ToastContext';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Trash2, 
  Edit3, 
  Plus, 
  Download, 
  Upload, 
  X, 
  Info,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Check
} from 'lucide-react';

export const Transactions: React.FC = () => {
  const { currentUser, transactions, addTransaction, updateTransaction, deleteTransaction, addNotification } = useAuth();
  const { showToast } = useToast();
  
  // Search, filter, sorting state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'description'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  // Add/Edit Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Groceries');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formDesc, setFormDesc] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formRecurring, setFormRecurring] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // CSV Import State
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [csvRaw, setCsvRaw] = useState<string>('');
  const [importError, setImportError] = useState<string>('');

  const currency = currentUser?.currency || '$';

  // Constant lists
  const expenseCategories = EXPENSE_CATEGORIES;
  const incomeCategories = INCOME_CATEGORIES;
  const categoriesList = ALL_CATEGORIES;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, categoryFilter, sortField, sortDirection]);

  // Handle Sort Toggle
  const handleSort = (field: 'date' | 'amount' | 'description') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter & Sort core logic
  const filteredTransactions = useMemo(() => transactions
    .filter(t => {
      const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchType = typeFilter === 'all' || t.type === typeFilter;
      const matchCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchSearch && matchType && matchCategory;
    })
    .sort((a, b) => {
      let multiplier = sortDirection === 'asc' ? 1 : -1;
      if (sortField === 'date') {
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * multiplier;
      } else if (sortField === 'amount') {
        return (a.amount - b.amount) * multiplier;
      } else {
        return a.description.localeCompare(b.description) * multiplier;
      }
    }), [transactions, searchTerm, typeFilter, categoryFilter, sortField, sortDirection]);

  // Paginated Slices
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / rowsPerPage));
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Open modal for editing
  const handleEditClick = (tx: Transaction) => {
    setEditingTx(tx);
    setFormType(tx.type);
    setFormAmount(tx.amount.toString());
    setFormCategory(tx.category);
    setFormDate(tx.date);
    setFormDesc(tx.description);
    setFormNotes(tx.notes || '');
    setFormRecurring(tx.isRecurring || false);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for new creation
  const handleAddClick = (type: 'income' | 'expense') => {
    setEditingTx(null);
    setFormType(type);
    setFormAmount('');
    setFormCategory(type === 'expense' ? 'Groceries' : 'Salary');
    setFormDate(todayISO());
    setFormDesc('');
    setFormNotes('');
    setFormRecurring(false);
    setFormError('');
    setIsModalOpen(true);
  };

  // Form Submit (Add/Edit)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const amountNum = parsePositiveAmount(formAmount);
    if (!amountNum) {
      setFormError('Enter an amount greater than 0.');
      showToast('error', 'Invalid transaction', 'Enter an amount greater than 0.');
      return;
    }
    if (!formDate) {
      setFormError('Choose a transaction date.');
      return;
    }
    if (!formDesc.trim()) {
      setFormError('Add a short transaction description.');
      return;
    }
    setIsSaving(true);

    const payload = {
      type: formType,
      amount: amountNum,
      category: formCategory,
      date: formDate,
      description: formDesc.trim(),
      notes: formNotes.trim() || undefined,
      isRecurring: formRecurring
    };

    if (editingTx) {
      updateTransaction(editingTx.id, payload);
      addNotification('success', 'Record Updated', `Successfully updated transaction "${payload.description}"!`);
    } else {
      addTransaction(payload);
    }

    window.setTimeout(() => {
      setIsSaving(false);
      setIsModalOpen(false);
    }, 250);
  };

  // CSV Export
  const handleExportCSV = () => {
    downloadTextFile(transactionsToCsv(transactions), `wealthflow_ledger_${todayISO()}.csv`, 'text/csv;charset=utf-8;');
    addNotification('success', 'CSV Export Ready', `Exported ${transactions.length} ledger records.`);
  };

  // CSV Import parse
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');
    if (!csvRaw.trim()) {
      setImportError('Please paste some CSV content.');
      return;
    }

    try {
      const { imported, skipped } = parseTransactionsCsv(csvRaw);
      imported.forEach(tx => addTransaction(tx));
      addNotification('success', 'Import Complete', `Imported ${imported.length} ledger records${skipped.length ? ` and skipped ${skipped.length} invalid row(s)` : ''}.`);
      setCsvRaw('');
      setIsImportOpen(false);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to parse CSV lines. Ensure standard comma-separated format.');
    }
  };

  const categoriesToRender = formType === 'expense' ? expenseCategories : incomeCategories;

  return (
    <div className="space-y-6">
      {/* Header action panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl tracking-tight text-slate-900">Ledger Manager</h2>
          <p className="text-xs text-slate-500 font-medium">Verify, sort, filter, and modify cash flow transaction archives</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-trigger-import"
            onClick={() => setIsImportOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Import CSV</span>
          </button>

          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-add-expense-modal"
            onClick={() => handleAddClick('expense')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Log Expense</span>
          </button>

          <button
            id="btn-add-income-modal"
            onClick={() => handleAddClick('income')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Log Income</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters section */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="tx-search-input"
            type="text"
            placeholder="Search descriptions, categories, or comments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Filters Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Select */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select 
              id="tx-type-filter"
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">All Flows</option>
              <option value="income">Incomes</option>
              <option value="expense">Expenses</option>
            </select>
          </div>

          {/* Category Select */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
            <select 
              id="tx-category-filter"
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {(searchTerm || typeFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              id="btn-reset-filters"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setCategoryFilter('all');
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Primary Ledger Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="main-ledger-table">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 select-none">
                <th 
                  onClick={() => handleSort('date')}
                  className="p-4 text-2xs font-bold uppercase text-slate-400 tracking-wider cursor-pointer hover:text-slate-700"
                >
                  <div className="flex items-center space-x-1">
                    <span>Date</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('description')}
                  className="p-4 text-2xs font-bold uppercase text-slate-400 tracking-wider cursor-pointer hover:text-slate-700"
                >
                  <div className="flex items-center space-x-1">
                    <span>Description</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="p-4 text-2xs font-bold uppercase text-slate-400 tracking-wider">Category</th>
                <th className="p-4 text-2xs font-bold uppercase text-slate-400 tracking-wider">Recurring</th>
                <th 
                  onClick={() => handleSort('amount')}
                  className="p-4 text-2xs font-bold uppercase text-slate-400 tracking-wider cursor-pointer hover:text-slate-700 text-right"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Amount</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="p-4 text-2xs font-bold uppercase text-slate-400 tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 text-sm">
                    No transactions correspond to the set filter targets. Try broadening your query!
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/45 transition-colors group">
                    <td className="p-4 text-xs font-mono font-semibold text-slate-500 whitespace-nowrap">{tx.date}</td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800 leading-tight">{tx.description}</p>
                        {tx.notes && <p className="text-3xs text-slate-400 italic max-w-sm truncate">{tx.notes}</p>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-bold bg-slate-50 text-slate-600 border border-slate-200">
                        {tx.category}
                      </span>
                    </td>
                    <td className="p-4">
                      {tx.isRecurring ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                          Yes
                        </span>
                      ) : (
                        <span className="text-3xs text-slate-400 font-medium">—</span>
                      )}
                    </td>
                    <td className={`p-4 text-xs font-mono font-bold text-right whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      <span className="flex items-center justify-end">
                        {tx.type === 'income' ? (
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500 mr-1 shrink-0" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-slate-400 mr-1 shrink-0" />
                        )}
                        {tx.type === 'income' ? '+' : '-'}{currency}{tx.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          id={`btn-edit-tx-${tx.id}`}
                          onClick={() => handleEditClick(tx)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit transaction details"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          id={`btn-delete-tx-${tx.id}`}
                          onClick={() => {
                            if (confirm('Are you absolutely sure you want to delete this transaction record?')) {
                              deleteTransaction(tx.id);
                              addNotification('info', 'Record Deleted', `Deleted transaction "${tx.description}".`);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
          <span className="text-2xs font-semibold text-slate-500">
            Showing {filteredTransactions.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredTransactions.length)} of {filteredTransactions.length} items
          </span>

          <div className="flex items-center space-x-1">
            <button
              id="btn-prev-page"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                id={`btn-page-${page}`}
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg ${currentPage === page ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {page}
              </button>
            ))}

            <button
              id="btn-next-page"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create/Edit Transaction Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50" id="tx-form-modal">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 animate-fadeIn overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="font-display font-bold text-base text-slate-800">
                {editingTx ? 'Modify Transaction Details' : `Create New Ledger ${formType === 'income' ? 'Inflow' : 'Outflow'}`}
              </span>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium">
                  {formError}
                </div>
              )}
              {/* Type Switch Selector */}
              {!editingTx && (
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl">
                  <button
                    id="modal-toggle-expense"
                    type="button"
                    onClick={() => {
                      setFormType('expense');
                      setFormCategory('Groceries');
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${formType === 'expense' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Expense
                  </button>
                  <button
                    id="modal-toggle-income"
                    type="button"
                    onClick={() => {
                      setFormType('income');
                      setFormCategory('Salary');
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${formType === 'income' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Income
                  </button>
                </div>
              )}

              {/* Form Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="modal-tx-amount" className="text-3xs font-bold uppercase tracking-wider text-slate-400">Amount ({currency})</label>
                  <input
                    id="modal-tx-amount"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="modal-tx-date" className="text-3xs font-bold uppercase tracking-wider text-slate-400">Date</label>
                  <input
                    id="modal-tx-date"
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="modal-tx-category" className="text-3xs font-bold uppercase tracking-wider text-slate-400">Category</label>
                  <select
                    id="modal-tx-category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                  >
                    {categoriesToRender.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 flex items-center pt-5 pl-2">
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      id="modal-tx-recurring"
                      type="checkbox"
                      checked={formRecurring}
                      onChange={(e) => setFormRecurring(e.target.checked)}
                      className="h-4.5 w-4.5 accent-blue-600 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-600">Recurring Monthly</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="modal-tx-desc" className="text-3xs font-bold uppercase tracking-wider text-slate-400">Description</label>
                <input
                  id="modal-tx-desc"
                  type="text"
                  required
                  placeholder="e.g., Whole Foods Supermarket"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="modal-tx-notes" className="text-3xs font-bold uppercase tracking-wider text-slate-400">Comments & Notes</label>
                <textarea
                  id="modal-tx-notes"
                  rows={2}
                  placeholder="Optional notes or tag descriptors..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  id="modal-tx-cancel"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  id="modal-tx-save"
                  type="submit"
                  disabled={isSaving}
                  className={`px-4 py-2 text-white rounded-xl text-xs font-bold disabled:opacity-60 ${formType === 'expense' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                >
                  {isSaving ? 'Saving...' : editingTx ? 'Apply Updates' : 'Commit Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Drawer */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50" id="csv-import-modal">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 animate-fadeIn overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="font-display font-bold text-base text-slate-800">Paste CSV Ledger Data</span>
              <button 
                onClick={() => setIsImportOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start space-x-2.5 text-indigo-800">
                <Info className="h-4.5 w-4.5 shrink-0 mt-0.5 text-indigo-500" />
                <div className="text-3xs leading-relaxed space-y-0.5">
                  <p className="font-bold">Formatting Requirements:</p>
                  <p>Line 1 must contain headers exactly: <code className="font-bold font-mono">Date,Type,Category,Description,Amount,Notes</code></p>
                  <p>Following lines must be comma separated. Date: <code className="font-mono">YYYY-MM-DD</code>. Type: <code className="font-mono">income</code> or <code className="font-mono">expense</code>.</p>
                </div>
              </div>

              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium animate-pulse">
                  {importError}
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="csv-raw-input" className="text-3xs font-bold uppercase tracking-wider text-slate-400 font-sans">Raw CSV Text</label>
                <textarea
                  id="csv-raw-input"
                  rows={6}
                  required
                  placeholder={`Date,Type,Category,Description,Amount,Notes
2026-07-11,expense,Groceries,Whole Foods,85.50,Weekly shopping
2026-07-11,income,Freelance,Consulting Gig,450.00,Contract payout`}
                  value={csvRaw}
                  onChange={(e) => setCsvRaw(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  id="csv-import-cancel"
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  id="csv-import-submit"
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                >
                  Parse & Insert Records
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
