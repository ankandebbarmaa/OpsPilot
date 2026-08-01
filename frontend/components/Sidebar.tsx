import React from 'react';
import { OpsPilotLogo } from './OpsPilotLogo';
import {
  LayoutDashboard,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  FileText,
  Terminal,
  Clock,
  Menu,
  X,
  RefreshCw,
  Wallet,
  Receipt,
  Building2,
  Calendar,
} from 'lucide-react';
import { formatRupee } from '../types';

interface SidebarProps {
  activeTab: 'dashboard' | 'briefing' | 'transactions' | 'invoices' | 'expenses' | 'forecast' | 'templates' | 'playground' | 'logs';
  setActiveTab: (tab: 'dashboard' | 'briefing' | 'transactions' | 'invoices' | 'expenses' | 'forecast' | 'templates' | 'playground' | 'logs') => void;
  overdueCount: number;
  anomalyCount: number;
  daysUntilShortfall: number;
  currentBalance: number;
  companyName?: string;
  onRefreshBriefing: () => void;
  onOpenCompanySetup?: () => void;
  isRefreshing: boolean;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  overdueCount,
  anomalyCount,
  daysUntilShortfall,
  currentBalance,
  companyName = 'OpsPilot Company',
  onRefreshBriefing,
  onOpenCompanySetup,
  isRefreshing,
  mobileOpen,
  setMobileOpen,
}) => {
  interface NavItem {
    id: 'dashboard' | 'briefing' | 'transactions' | 'invoices' | 'expenses' | 'forecast' | 'templates' | 'playground' | 'logs';
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Overview & Assistant', icon: LayoutDashboard },
    { id: 'briefing', label: 'Daily Briefing', icon: Calendar },
    { id: 'transactions', label: 'Income & Expenses', icon: Receipt },
    { id: 'invoices', label: 'Client Invoices', icon: FileText, badge: overdueCount, badgeColor: 'bg-rose-100 text-rose-800' },
    { id: 'expenses', label: 'Expense Audit', icon: AlertCircle, badge: anomalyCount, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'forecast', label: 'Cash Runway', icon: TrendingUp },
    { id: 'templates', label: 'Payment Nudges', icon: ShieldCheck },
    { id: 'playground', label: 'OpsPilot AI', icon: Terminal },
    { id: 'logs', label: 'Activity Log', icon: Clock },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-2.5">
          <OpsPilotLogo size={32} />
          <div>
            <span className="font-bold text-slate-900 text-sm">OpsPilot</span>
            <span className="text-[10px] block text-slate-500 font-medium">Business Operations</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setActiveTab('briefing');
              onRefreshBriefing();
            }}
            disabled={isRefreshing}
            className="p-2 bg-slate-100 text-slate-850 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Backdrop overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Left Vertical Navigation Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header Brand */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <OpsPilotLogo size={36} />
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-base tracking-tight text-slate-900">
                    OpsPilot
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal">
                  AI Business Money Management
                </p>
              </div>
            </div>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Bank & Runway Card */}
          <div className="p-3 mx-3 my-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center">
                <Wallet className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                Bank Balance
              </span>
              <span className="font-semibold text-slate-900">
                {formatRupee(currentBalance)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium flex items-center">
                <TrendingUp className="w-3.5 h-3.5 text-sky-600 mr-1.5" />
                Runway Alert
              </span>
              <span
                className={`font-semibold ${
                  daysUntilShortfall <= 14 ? 'text-amber-600' : 'text-slate-900'
                }`}
              >
                {daysUntilShortfall} Days Left
              </span>
            </div>

            {onOpenCompanySetup && (
              <button
                onClick={onOpenCompanySetup}
                className="w-full mt-1.5 py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-[11px] font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition shadow-2xs"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Budget & Finance Setup</span>
              </button>
            )}
          </div>

          {/* Vertical Navigation Items */}
          <div className="px-3 py-1 flex-1 overflow-y-auto space-y-1">
            <p className="px-3 py-1 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Navigation
            </p>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="tracking-tight">{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.badgeColor || 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-100 space-y-2">
            <button
              onClick={() => {
                setActiveTab('briefing');
                onRefreshBriefing();
              }}
              disabled={isRefreshing}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Analyzing...' : 'Run Daily Briefing'}</span>
            </button>

            <p className="text-[10px] text-center text-slate-400 font-normal">
              Financial Assistant Active
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
