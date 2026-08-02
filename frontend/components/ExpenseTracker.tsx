import React, { useState } from 'react';
import { Expense, formatRupee } from '../types';
import {
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  XCircle,
} from 'lucide-react';

interface ExpenseTrackerProps {
  expenses: Expense[];
  onVerifyExpense: (expenseId: string) => void;
  onDisputeExpense: (expenseId: string) => void;
  onAddExpense: (expense: Expense) => void;
  isAutopilotEnabled?: boolean;
}

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({
  expenses,
  onVerifyExpense,
  onDisputeExpense,
  onAddExpense,
  isAutopilotEnabled = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [anomalyFilter, setAnomalyFilter] = useState<'all' | 'anomalies_only' | 'verified'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Office & Supplies');
  const [normalAverage, setNormalAverage] = useState('12000');

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      exp.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (anomalyFilter === 'anomalies_only') {
      return matchesSearch && exp.isAnomaly && exp.status !== 'verified';
    }
    if (anomalyFilter === 'verified') {
      return matchesSearch && exp.status === 'verified';
    }
    return matchesSearch;
  });

  const totalAnomaliesCount = expenses.filter((e) => e.isAnomaly && e.status !== 'verified').length;
  const totalExpenseVolume = expenses.reduce((acc, e) => acc + e.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant || !amount) return;

    const amtNum = parseFloat(amount);
    const avgNum = parseFloat(normalAverage) || 12000;
    const isAnomaly = amtNum > avgNum * 2.5;

    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      merchant,
      amount: amtNum,
      category,
      date: new Date().toISOString().split('T')[0],
      status: isAnomaly ? 'flagged' : 'verified',
      isAnomaly,
      normalAverage: avgNum,
      anomalyMultiplier: isAnomaly ? parseFloat((amtNum / avgNum).toFixed(1)) : undefined,
      anomalyReason: isAnomaly ? `Spike detected: ${parseFloat((amtNum / avgNum).toFixed(1))}x above 30-day baseline.` : undefined,
      reviewedByOwner: !isAnomaly,
    };

    onAddExpense(newExp);
    setShowAddModal(false);
    setMerchant('');
    setAmount('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 bg-amber-600 text-white rounded-md font-extrabold text-xs">
              EXP
            </span>
            <span className="text-xs font-semibold text-slate-600">Audit Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center">
            Expense Anomalies & Vendor Audit
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Automatic spike detection in Rupees (₹) comparing live vendor bills against 30-day baseline averages
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Expense</span>
        </button>
      </div>

      {/* Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Unreviewed Anomalies</p>
          <p className="text-2xl font-extrabold text-rose-600">{totalAnomaliesCount} Items Flagged</p>
          <p className="text-[11px] text-rose-700 font-semibold">Requires owner verification</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Monthly Outflow</p>
          <p className="text-2xl font-extrabold text-slate-900">{formatRupee(totalExpenseVolume)}</p>
          <p className="text-[11px] text-slate-400 font-medium">Across active ledger categories</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Detection Threshold</p>
          <p className="text-2xl font-extrabold text-indigo-700">&gt;2.5× Baseline</p>
          <p className="text-[11px] text-slate-400 font-medium">Automatic overcharge alert trigger</p>
        </div>
      </div>
      {isAutopilotEnabled && (
        <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 shadow-3xs flex items-center space-x-3.5">
          <div className="p-2 bg-rose-100/80 text-rose-800 rounded-xl shrink-0 animate-pulse">
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              Autopilot Expense Dispute Active
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-normal">
              OpsPilot AI is automatically contesting card swipes that spike above 3.5x baseline averages. Disputes are submitted instantly to vendor billing contacts.
            </p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search merchant or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['all', 'anomalies_only', 'verified'] as const).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setAnomalyFilter(filterKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  anomalyFilter === filterKey
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filterKey === 'all' && 'All Expenses'}
                {filterKey === 'anomalies_only' && 'Anomalies Only'}
                {filterKey === 'verified' && 'Verified'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expenses Grid / Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Merchant & Category</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Amount (₹)</th>
                <th className="py-3.5 px-4">Baseline Avg</th>
                <th className="py-3.5 px-4">Anomaly Status</th>
                <th className="py-3.5 px-4 text-right">Owner Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredExpenses.map((exp) => (
                <tr
                  key={exp.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    exp.isAnomaly && exp.status !== 'verified' ? 'bg-amber-50/30' : ''
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div>
                      <p className="font-bold text-slate-900">{exp.merchant}</p>
                      <p className="text-[11px] text-slate-500">{exp.category}</p>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600">{exp.date}</td>

                  <td className="py-3.5 px-4 font-black text-slate-900">
                    {formatRupee(exp.amount)}
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 font-mono">
                    {formatRupee(exp.normalAverage)}
                  </td>

                  <td className="py-3.5 px-4">
                    {exp.isAnomaly && exp.status !== 'verified' && exp.status !== 'disputed' ? (
                      <div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          {exp.anomalyMultiplier ? `${exp.anomalyMultiplier}× Spike` : 'Anomaly Flagged'}
                        </span>
                        <p className="text-[10px] text-amber-900 mt-1 italic max-w-xs">{exp.anomalyReason}</p>
                      </div>
                    ) : exp.status === 'disputed' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        {exp.autopilotHandled ? 'Auto-Disputed' : 'Disputed'}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center w-fit">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-1.5">
                    {exp.status === 'disputed' && (
                      <span className="px-2.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold uppercase inline-flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>{exp.autopilotHandled ? 'Auto-Disputed' : 'Disputed'}</span>
                      </span>
                    )}
                    {exp.status !== 'verified' && exp.status !== 'disputed' && (
                      <button
                        onClick={() => onVerifyExpense(exp.id)}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold border border-emerald-200 transition-all cursor-pointer inline-flex items-center space-x-1"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verify Charge</span>
                      </button>
                    )}
                    {exp.status !== 'disputed' && exp.status !== 'verified' && (
                      <button
                        onClick={() => onDisputeExpense(exp.id)}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold border border-rose-200 transition-all cursor-pointer inline-flex items-center space-x-1"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Dispute</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Log Vendor Expense</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Merchant / Vendor *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office Supplies Inc."
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium"
                >
                  <option value="Office & Supplies">Office & Supplies</option>
                  <option value="Hosting & Software">Hosting & Software</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Rent & Workspace">Rent & Workspace</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Charge Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="48000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">30-Day Baseline Avg (₹)</label>
                  <input
                    type="number"
                    value={normalAverage}
                    onChange={(e) => setNormalAverage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-2xs transition cursor-pointer text-xs"
                >
                  Test & Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
