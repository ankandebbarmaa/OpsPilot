import React, { useState } from 'react';
import { OpsPilotLogo } from './OpsPilotLogo';
import { Building2, X, Wallet, ArrowRight, ShieldCheck, Target, TrendingUp } from 'lucide-react';
import { CompanyProfile } from '../types';

interface CompanySetupModalProps {
  isOpen?: boolean;
  onClose: () => void;
  currentCompany?: CompanyProfile;
  onSaveCompany: (
    profile: CompanyProfile,
    presetType: 'blank' | 'tech_startup' | 'agency' | 'retail' | 'current'
  ) => void;
}

export const CompanySetupModal: React.FC<CompanySetupModalProps> = ({
  isOpen = true,
  onClose,
  currentCompany = {
    name: 'Acme Digital Solutions',
    category: 'SaaS & Services',
    currency: '₹',
    startingBalance: 1500000,
    monthlyBudget: 350000,
  },
  onSaveCompany,
}) => {
  const [name, setName] = useState(currentCompany.name);
  const [category, setCategory] = useState(currentCompany.category);
  const [startingBalance, setStartingBalance] = useState(currentCompany.startingBalance.toString());
  const [monthlyBudget, setMonthlyBudget] = useState(currentCompany.monthlyBudget.toString());
  const [monthlyRevenueTarget, setMonthlyRevenueTarget] = useState('500000');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balanceNum = parseFloat(startingBalance) || 0;
    const budgetNum = parseFloat(monthlyBudget) || 0;

    onSaveCompany(
      {
        name: name.trim() || 'My Business',
        category: category.trim() || 'General Operations',
        currency: '₹',
        startingBalance: balanceNum,
        monthlyBudget: budgetNum,
      },
      'current'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl my-8">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1 shadow-xs border border-slate-200 shrink-0">
              <OpsPilotLogo size={26} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white tracking-tight">
                Monthly Budget & Finance Setup
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Configure your company's monthly financial targets and baseline numbers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 transition rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Company Identity */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Business / Company Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Digital Solutions"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Industry / Category
              </label>
              <input
                type="text"
                placeholder="e.g. SaaS / E-commerce / Agency"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
              />
            </div>
          </div>

          {/* Financial Targets Grid */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-extrabold text-slate-900 text-xs mb-3 flex items-center space-x-1.5">
              <Target className="w-4 h-4 text-indigo-600" />
              <span>Monthly Budget & Financial Targets</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Starting Balance (₹) *</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    placeholder="1500000"
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 text-slate-900 font-extrabold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Monthly Budget (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    placeholder="350000"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 text-slate-900 font-extrabold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Monthly Revenue Target (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="500000"
                    value={monthlyRevenueTarget}
                    onChange={(e) => setMonthlyRevenueTarget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Safety Reserve Target (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="200000"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-3 text-indigo-900 text-[11px] leading-relaxed flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              Your setup updates automatically across all dashboards, cash runway charts, and OpsPilot AI assistant insights.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xs transition cursor-pointer flex items-center space-x-2"
            >
              <span>Save Budget Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
