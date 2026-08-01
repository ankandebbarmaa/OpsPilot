import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Calendar,
  Building,
  CreditCard,
  Hash,
  X,
  Wallet,
} from 'lucide-react';
import { LedgerTransaction, TransactionType, formatRupee } from '../types';

interface MoneyLedgerProps {
  transactions: LedgerTransaction[];
  onAddTransaction: (newTx: Omit<LedgerTransaction, 'id'>) => void;
}

export const MoneyLedger: React.FC<MoneyLedgerProps> = ({
  transactions,
  onAddTransaction,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Transaction Form State
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>('income');
  const [category, setCategory] = useState('Client Services');
  const [amount, setAmount] = useState('');
  const [partyName, setPartyName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer (NEFT/IMPS)');
  const [referenceNo, setReferenceNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Derived Totals
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashflow = totalIncome - totalExpense;

  // Filtered List
  const categoriesList = Array.from(new Set(transactions.map((t) => t.category)));

  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesCategory = selectedCategory === 'all' || tx.category === selectedCategory;
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.partyName && tx.partyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesCategory && matchesSearch;
  });

  const handleSubmitNewTx = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddTransaction({
      date,
      description,
      type,
      category,
      amount: parsedAmount,
      partyName: partyName || undefined,
      paymentMethod,
      referenceNo: referenceNo || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'cleared',
    });

    // Reset Form
    setDescription('');
    setAmount('');
    setPartyName('');
    setReferenceNo('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 bg-emerald-600 text-white rounded-md font-extrabold text-xs">
              ₹
            </span>
            <span className="text-xs font-semibold text-slate-600">Company Money Ledger</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Money In & Out (Transactions)
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track, enter, and balance all incoming payments and outgoing company expenses in Rupees (₹)
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-2xs transition flex items-center space-x-1.5 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Add Money Transaction</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Money In */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Total Money In (Income)
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatRupee(totalIncome)}
          </div>
          <p className="text-[11px] font-semibold text-emerald-700 flex items-center space-x-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
            <span>Clearing client payments & receipts</span>
          </p>
        </div>

        {/* Total Money Out */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Total Money Out (Outflow)
            </span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatRupee(totalExpense)}
          </div>
          <p className="text-[11px] font-semibold text-rose-600 flex items-center space-x-1">
            <ArrowDownRight className="w-3 h-3 text-rose-600" />
            <span>Vendor bills, payroll & operational spend</span>
          </p>
        </div>

        {/* Net Cash Flow */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Net Cashflow Balance
            </span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div
            className={`text-2xl font-extrabold tracking-tight ${
              netCashflow >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {formatRupee(netCashflow)}
          </div>
          <p className="text-[11px] font-medium text-slate-500">
            {netCashflow >= 0 ? 'Surplus Cash Accumulation' : 'Net Cash Deficit'}
          </p>
        </div>
      </div>

      {/* Controls Bar: Filters & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Type Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Transactions ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                filterType === 'income'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Money In</span>
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                filterType === 'expense'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Money Out</span>
            </button>
          </div>

          {/* Search & Category dropdown */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search description, party..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description & Party</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-semibold text-slate-600">{tx.date}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                        tx.type === 'income'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <>
                          <ArrowUpRight className="w-3 h-3" />
                          <span>Money In</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-3 h-3" />
                          <span>Money Out</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-extrabold text-slate-900">{tx.description}</div>
                    {tx.partyName && (
                      <div className="text-[11px] text-slate-500">{tx.partyName}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                      {tx.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[11px] text-slate-500">
                    <div>{tx.paymentMethod || 'NEFT/UPI'}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{tx.referenceNo}</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-black text-sm ${
                        tx.type === 'income' ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}{formatRupee(tx.amount)}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No transactions found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="p-1 bg-emerald-500 rounded text-slate-900 font-black text-xs">
                  ₹
                </span>
                <h3 className="font-extrabold text-sm text-white">Enter Money Transaction</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewTx} className="p-5 space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                      type === 'income'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Money In (Income)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                      type === 'expense'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Money Out (Expense)</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Software Consulting Retainer"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                />
              </div>

              {/* Amount & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Amount in Rupees (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                  >
                    <option value="Client Services">Client Services</option>
                    <option value="Software Solutions">Software Solutions</option>
                    <option value="Office & Supplies">Office & Supplies</option>
                    <option value="Hosting & Software">Hosting & Software</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Payroll & Salaries">Payroll & Salaries</option>
                    <option value="Rent & Space">Rent & Space</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Misc">Misc</option>
                  </select>
                </div>
              </div>

              {/* Party Name & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Party / Client / Vendor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gamma Tech"
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                >
                  <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer (NEFT/IMPS)</option>
                  <option value="UPI Payment">UPI Payment</option>
                  <option value="Corporate Credit Card">Corporate Credit Card</option>
                  <option value="Wire Transfer">Wire Transfer</option>
                  <option value="Cheque Clearance">Cheque Clearance</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
