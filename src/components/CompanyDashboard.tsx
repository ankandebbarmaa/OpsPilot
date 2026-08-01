import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  CheckCircle2,
  Clock,
  Building2,
  FileText,
  DollarSign,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Copy,
  Check,
  Bot,
  User,
  Sparkles,
  Cpu,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { OpsPilotLogo } from './OpsPilotLogo';
import { Invoice, Expense, CashForecast, LedgerTransaction, ChatMessage, formatRupee } from '../types';

interface CompanyDashboardProps {
  invoices: Invoice[];
  expenses: Expense[];
  cashForecast: CashForecast;
  transactions: LedgerTransaction[];
  onNavigateTab: (tab: 'dashboard' | 'transactions' | 'invoices' | 'expenses' | 'forecast' | 'templates' | 'playground' | 'logs') => void;
  onSendReminder: (invoice: Invoice) => void;
  onVerifyExpense: (expenseId: string) => void;
  onDisputeExpense: (expenseId: string) => void;
}

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({
  invoices,
  expenses,
  cashForecast,
  transactions,
  onNavigateTab,
  onSendReminder,
  onVerifyExpense,
  onDisputeExpense,
}) => {
  // Financial Calculations
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
  const openInvoices = invoices.filter((i) => i.status !== 'paid');
  const totalAr = openInvoices.reduce((sum, i) => sum + i.amount, 0);
  const totalOverdueAmount = overdueInvoices.reduce((sum, i) => sum + i.amount, 0);

  const flaggedExpenses = expenses.filter((e) => e.isAnomaly && e.status !== 'verified');
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflow = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalOutflow;
  const profitMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;

  // Assistant Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `Hello! I am your company's **OpsPilot Assistant**.\n\nHere is a quick snapshot of your business money:\n* **Bank Balance:** ${formatRupee(cashForecast.currentBalance)}\n* **Uncollected Client Payments:** ${formatRupee(totalAr)} (${overdueInvoices.length} overdue invoices)\n* **Monthly Revenue:** ${formatRupee(totalIncome)}\n* **Monthly Expenses:** ${formatRupee(totalOutflow)}\n\nAsk me any simple question about your cash balance, who owes you money, or upcoming bills!`,
      timestamp: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const quickPrompts = [
    'How much money did we make after expenses this month?',
    'Who owes us money and how many days overdue are they?',
    'Can we afford a new expense of ₹50,000 right now?',
    'Show me a simple summary of our bank balance',
  ];

  const handleSendChat = async (queryText?: string) => {
    const messageToSend = queryText || inputQuery;
    if (!messageToSend.trim() || isAskingAi) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsAskingAi(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          invoices,
          expenses,
          cashForecast,
          transactions,
        }),
      });

      const data = await response.json();

      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || "I've analyzed your financial state.",
        timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat Error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I ran into an error generating a response. Please try again.',
        timestamp: 'Now',
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAskingAi(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 bg-slate-900 text-white rounded-lg font-bold text-xs tracking-wide">
              OPSPILOT
            </span>
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
              Company Dashboard
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Financial Overview & Operations
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Real-time bank balance, cash runway, and easy financial assistant
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigateTab('transactions')}
            className="px-3.5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-semibold text-xs shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Enter Income/Expense</span>
          </button>
          <button
            onClick={() => onNavigateTab('invoices')}
            className="px-3.5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-semibold text-xs shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>+ Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Bank Balance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Bank Balance
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatRupee(cashForecast.currentBalance)}
            </div>
            <div className="flex items-center space-x-1 mt-1 text-[11px] font-medium text-emerald-700">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Minimum Buffer: {formatRupee(cashForecast.cashBufferTarget)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Monthly Revenue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Monthly Revenue
            </span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatRupee(totalIncome)}
            </div>
            <div className="flex items-center space-x-1 mt-1 text-[11px] font-normal text-slate-500">
              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
              <span>Total Income Received</span>
            </div>
          </div>
        </div>

        {/* Card 3: Monthly Expenses */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Monthly Expenses
            </span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatRupee(totalOutflow)}
            </div>
            <div className="flex items-center space-x-1 mt-1 text-[11px] font-normal text-slate-500">
              <ArrowDownRight className="w-3 h-3 text-rose-500" />
              <span>Vendor Payments & Operations</span>
            </div>
          </div>
        </div>

        {/* Card 4: Client Money Owed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Uncollected Client Bills
            </span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatRupee(totalAr)}
            </div>
            <div className="flex items-center space-x-1 mt-1 text-[11px] font-medium text-rose-600">
              <ShieldAlert className="w-3 h-3 text-rose-600" />
              <span>{overdueInvoices.length} Late ({formatRupee(totalOverdueAmount)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Section: Financial Assistant */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Header with Model Selector Pill */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <OpsPilotLogo size={28} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-extrabold text-sm tracking-tight text-white">
                  OpsPilot AI
                </h2>
                <div className="flex items-center space-x-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
                  <Cpu className="w-3 h-3 text-indigo-300" />
                  <span>OpsPilot Engine v2.5</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 font-normal mt-0.5">
                Real-time ledger reasoning & business cashflow assistant
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <span className="hidden sm:inline-block px-2.5 py-1 bg-slate-800/80 rounded-lg text-slate-300 font-medium border border-slate-700/60">
              Context-Aware Ledger Intelligence
            </span>
          </div>
        </div>

        {/* Quick Suggestion Pills / Starter Prompts */}
        <div className="p-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap gap-2 text-xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-1 shrink-0">
            Suggested Prompts:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendChat(prompt)}
              disabled={isAskingAi}
              className="bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 text-slate-700 font-semibold px-3 py-1 rounded-xl text-[11px] transition shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Messages Log */}
        <div className="p-5 max-h-[420px] min-h-[280px] overflow-y-auto space-y-4 bg-slate-50/50">
          {chatMessages.map((msg, index) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed relative group ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-xs shadow-xs font-normal'
                    : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 opacity-70 text-[10px]">
                  <span className="font-extrabold tracking-wider uppercase">
                    {msg.sender === 'user' ? 'You' : 'OpsPilot Assistant'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                {msg.sender === 'assistant' ? (
                  <div className="markdown-body space-y-2 text-slate-800 leading-relaxed">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                )}

                {msg.sender === 'assistant' && (
                  <button
                    onClick={() => copyToClipboard(msg.text, index)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                    title="Copy response"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isAskingAi && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-indigo-100 text-indigo-900 rounded-2xl rounded-tl-xs p-3.5 text-xs font-semibold flex items-center space-x-2 shadow-2xs">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>OpsPilot AI is querying bank ledger and active bills...</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input Field Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
            placeholder="Ask anything in simple English (e.g. 'Can I afford to pay ₹30,000 rent today?')"
            disabled={isAskingAi}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent font-medium"
          />
          <button
            onClick={() => handleSendChat()}
            disabled={!inputQuery.trim() || isAskingAi}
            className="px-4 py-3 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 rounded-xl font-bold text-xs shadow-2xs transition flex items-center space-x-1.5 cursor-pointer shrink-0"
          >
            <span>Ask AI</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid: Action Items & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Urgent Action Items */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Action Needed ({overdueInvoices.length + flaggedExpenses.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('invoices')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Overdue Invoices Items */}
            {overdueInvoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{inv.clientCompany}</span>
                    <span className="text-[10px] font-semibold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-md">
                      #{inv.invoiceNumber}
                    </span>
                    <span className="text-[10px] font-semibold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-md">
                      {inv.daysOverdue} Days Late
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1 font-normal">
                    Contact: {inv.clientName} ({inv.clientPhone})
                  </p>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <span className="font-bold text-slate-900 text-sm">
                    {formatRupee(inv.amount)}
                  </span>
                  <button
                    onClick={() => onSendReminder(inv)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-[11px] transition shadow-2xs cursor-pointer"
                  >
                    Send Nudge
                  </button>
                </div>
              </div>
            ))}

            {/* Flagged Expenses Items */}
            {flaggedExpenses.map((exp) => (
              <div
                key={exp.id}
                className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{exp.merchant}</span>
                    <span className="text-[10px] font-semibold bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded-md">
                      {exp.category}
                    </span>
                    <span className="text-[10px] font-semibold bg-rose-600 text-white px-1.5 py-0.5 rounded-md">
                      {exp.anomalyMultiplier}× Higher Spend
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1 font-normal">
                    {exp.anomalyReason}
                  </p>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <span className="font-bold text-rose-700 text-sm">
                    {formatRupee(exp.amount)}
                  </span>
                  <button
                    onClick={() => onVerifyExpense(exp.id)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold text-[11px] transition cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onDisputeExpense(exp.id)}
                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-[11px] transition cursor-pointer"
                  >
                    Flag
                  </button>
                </div>
              </div>
            ))}

            {overdueInvoices.length === 0 && flaggedExpenses.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-medium text-slate-700">All clear! No urgent financial alerts.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Money Entries */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Recent Income & Expenses
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="p-3 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs transition"
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`p-2 rounded-xl text-xs font-bold ${
                      tx.type === 'income'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{tx.description}</p>
                    <p className="text-[11px] text-slate-500 font-normal">
                      {tx.partyName || tx.category} • {tx.date}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`font-bold text-sm ${
                      tx.type === 'income' ? 'text-emerald-700' : 'text-slate-900'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}{formatRupee(tx.amount)}
                  </p>
                  <span className="text-[10px] font-medium text-slate-400 capitalize">
                    {tx.paymentMethod || 'Cleared'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
