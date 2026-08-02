import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { OpsPilotLogo } from './OpsPilotLogo';
import { Invoice, Expense, CashForecast, ReminderTemplate, formatRupee } from '../types';
import {
  Send,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Clock,
  Calendar,
  Mail,
  RefreshCw,
  TrendingUp,
  FileText,
} from 'lucide-react';

interface MorningBriefingProps {
  invoices: Invoice[];
  expenses: Expense[];
  cashForecast: CashForecast;
  reminderTemplates: ReminderTemplate[];
  briefingMarkdown: string;
  isRefreshing: boolean;
  onRefreshBriefing: () => void;
  onSendReminder: (invoice: Invoice, template: ReminderTemplate) => void;
  onVerifyExpense: (expenseId: string) => void;
  onDisputeExpense: (expenseId: string) => void;
  onNavigateTab: (tab: 'invoices' | 'expenses' | 'forecast' | 'playground') => void;
}

export const MorningBriefing: React.FC<MorningBriefingProps> = ({
  invoices,
  expenses,
  cashForecast,
  reminderTemplates,
  briefingMarkdown,
  isRefreshing,
  onRefreshBriefing,
  onSendReminder,
  onVerifyExpense,
  onDisputeExpense,
  onNavigateTab,
}) => {
  const [selectedInvoiceForReminder, setSelectedInvoiceForReminder] = useState<Invoice | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ReminderTemplate>(reminderTemplates[2] || reminderTemplates[0]);
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sentSuccessToast, setSentSuccessToast] = useState<string | null>(null);

  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
  const flaggedExpenses = expenses.filter((e) => e.isAnomaly && e.status !== 'verified');

  const handleOpenReminderModal = (inv: Invoice) => {
    setSelectedInvoiceForReminder(inv);
    const matchingTemplate = reminderTemplates.find((t) => t.stage === inv.reminderStage) || reminderTemplates[2];
    setSelectedTemplate(matchingTemplate);
    setShowEmailPreviewModal(true);
  };

  const handleExecuteSend = () => {
    if (!selectedInvoiceForReminder) return;
    setSendingEmail(true);
    setTimeout(() => {
      onSendReminder(selectedInvoiceForReminder, selectedTemplate);
      setSendingEmail(false);
      setShowEmailPreviewModal(false);
      setSentSuccessToast(
        `Successfully sent ${selectedTemplate.stageName} to ${selectedInvoiceForReminder.clientCompany} (${selectedInvoiceForReminder.clientEmail})`
      );
      setTimeout(() => setSentSuccessToast(null), 4000);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {sentSuccessToast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white border border-slate-700 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-3 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{sentSuccessToast}</span>
        </div>
      )}

      {/* Hero Light Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 flex items-center space-x-1">
                <OpsPilotLogo size={16} />
                <span>Daily Summary</span>
              </span>
              <span className="text-xs text-slate-500 flex items-center font-normal">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              OpsPilot Daily Briefing: <span className="text-indigo-600">{overdueInvoices.length + flaggedExpenses.length} Action Items</span>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm max-w-2xl font-normal">
              Easy financial summary synthesizing overdue client payments, expense alerts, and bank balance trajectory.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onRefreshBriefing}
              disabled={isRefreshing}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Analyzing...' : 'Refresh Briefing'}</span>
            </button>
          </div>
        </div>

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-200">
          <div className="bg-slate-50/50 rounded-xl p-3.5 flex items-center space-x-3 border border-slate-200/80">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0 font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-semibold">Overdue Uncollected Payments</p>
              <p className="text-base font-bold text-slate-900">
                {overdueInvoices.length} Invoices ({formatRupee(overdueInvoices.reduce((acc, i) => acc + i.amount, 0))})
              </p>
            </div>
          </div>

          <div className="bg-slate-50/50 rounded-xl p-3.5 flex items-center space-x-3 border border-slate-200/80">
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-semibold">Unusual Expense Spikes</p>
              <p className="text-base font-bold text-slate-900">
                {flaggedExpenses.length} Flagged Item
              </p>
            </div>
          </div>

          <div className="bg-slate-50/50 rounded-xl p-3.5 flex items-center space-x-3 border border-slate-200/80">
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 border border-sky-200/60 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-semibold">Cash Buffer Alert</p>
              <p className="text-base font-bold text-slate-900">
                Shortfall in {cashForecast.daysUntilShortfall} Days
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Synthesized Executive Summary Card - Light */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Simple Operations Summary
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">Live Analysis</span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
          {briefingMarkdown ? (
            <div className="whitespace-pre-wrap font-sans space-y-1">
              <Markdown
                components={{
                  h3: ({ children }) => (
                    <h3 className="text-xs font-bold text-slate-900 mt-4 mb-2 first:mt-0 uppercase tracking-wider flex items-center">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-xs mr-2" />
                      {children}
                    </h3>
                  ),
                  ul: ({ children }) => (
                    <ul className="space-y-1.5 my-2 pl-1 list-none">{children}</ul>
                  ),
                  li: ({ children }) => (
                    <li className="text-xs text-slate-700 flex items-start space-x-2 leading-relaxed">
                      <span className="text-indigo-400 mt-1 shrink-0 text-[10px]">•</span>
                      <span>{children}</span>
                    </li>
                  ),
                  p: ({ children }) => (
                    <p className="text-xs text-slate-650 leading-relaxed my-1.5">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-900">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-slate-600 font-medium">{children}</em>
                  ),
                }}
              >
                {briefingMarkdown}
              </Markdown>
            </div>
          ) : (
            <p className="text-slate-500 italic">Preparing simple operations briefing...</p>
          )}
        </div>
      </div>

      {/* Actionable Urgent Items Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <ShieldAlert className="w-4 h-4 text-indigo-600 mr-2" />
            Urgent Action Queue
          </h2>
          <span className="text-xs text-slate-500 font-normal">Click actions to execute immediately</span>
        </div>

        {/* 1. Overdue Invoices Section */}
        {overdueInvoices.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 uppercase">
                  Uncollected Bills
                </span>
                <h3 className="text-sm font-bold text-slate-900">Overdue Client Invoices</h3>
              </div>
              <button
                onClick={() => onNavigateTab('invoices')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center cursor-pointer"
              >
                All Invoices <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            <div className="space-y-2.5">
              {overdueInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{inv.clientCompany}</span>
                      <span className="text-xs text-slate-500 font-mono">({inv.invoiceNumber})</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                        {inv.daysOverdue} Days Late
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-normal">
                      Contact: <span className="font-medium text-slate-800">{inv.clientName}</span> · Due: <span className="font-medium text-slate-800">{inv.dueDate}</span>
                    </p>
                    <p className="text-xs font-bold text-slate-900">
                      Amount: {formatRupee(inv.amount)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleOpenReminderModal(inv)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Payment Nudge</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Unusual Expense Anomaly Section */}
        {flaggedExpenses.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 uppercase">
                  Expense Audit
                </span>
                <h3 className="text-sm font-bold text-slate-900">Unusual Spend Flagged</h3>
              </div>
              <button
                onClick={() => onNavigateTab('expenses')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center cursor-pointer"
              >
                View Expenses <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            <div className="space-y-2.5">
              {flaggedExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{exp.merchant}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                        {exp.anomalyMultiplier ? `${exp.anomalyMultiplier}× Higher Spend` : 'Spike'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-normal">
                      Amount: <span className="font-bold text-slate-900">{formatRupee(exp.amount)}</span> ({exp.category}) · Monthly Avg: {formatRupee(exp.normalAverage)}
                    </p>
                    <p className="text-xs text-amber-900 italic font-normal">
                      "{exp.anomalyReason || 'Transaction deviates from past baseline.'}"
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => onVerifyExpense(exp.id)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs rounded-xl font-semibold border border-slate-300 shadow-2xs transition-all cursor-pointer"
                    >
                      Confirm / Approve
                    </button>
                    <button
                      onClick={() => onDisputeExpense(exp.id)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs rounded-xl font-semibold transition-all cursor-pointer"
                    >
                      Flag Dispute
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Cashflow Runway Forecast Warning */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200/80 uppercase">
                Bank Buffer Alert
              </span>
              <h3 className="text-sm font-bold text-slate-900">Projected Shortfall Warning</h3>
            </div>
            <button
              onClick={() => onNavigateTab('forecast')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center cursor-pointer"
            >
              Check Scenarios <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-semibold text-slate-900">
                Bank balance drops below safety target ({formatRupee(cashForecast.cashBufferTarget)}) on <span className="text-indigo-700">{cashForecast.predictedShortfallDate}</span> (~{cashForecast.daysUntilShortfall} days away).
              </p>
              <p className="text-xs text-slate-500 font-normal">
                Main cause: Rent & vendor bills due before pending client payments arrive.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('forecast')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs shrink-0 cursor-pointer"
            >
              Simulate Scenarios
            </button>
          </div>
        </div>
      </div>

      {/* Email / Reminder Modal */}
      {showEmailPreviewModal && selectedInvoiceForReminder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-lg text-slate-900">Send Payment Reminder Email</h3>
              </div>
              <button
                onClick={() => setShowEmailPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Recipient summary */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 font-normal">
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient:</span>
                <span className="font-semibold text-slate-900">{selectedInvoiceForReminder.clientName} ({selectedInvoiceForReminder.clientEmail})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Company:</span>
                <span className="font-medium text-slate-800">{selectedInvoiceForReminder.clientCompany}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-semibold text-slate-900">#{selectedInvoiceForReminder.invoiceNumber} — {formatRupee(selectedInvoiceForReminder.amount)}</span>
              </div>
            </div>

            {/* Cadence stage buttons */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Select Reminder Tone:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {reminderTemplates.map((tmpl) => (
                  <button
                    key={tmpl.stage}
                    onClick={() => setSelectedTemplate(tmpl)}
                    className={`p-2.5 rounded-xl text-left text-[11px] border transition-all cursor-pointer ${
                      selectedTemplate.stage === tmpl.stage
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="truncate font-semibold">{tmpl.stageName}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{tmpl.tone}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Rendered Email Preview */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">Subject Line Pattern:</p>
              <input
                type="text"
                readOnly
                value={selectedTemplate.subject.replace(/\[InvoiceNumber\]/g, selectedInvoiceForReminder.invoiceNumber)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
              />

              <p className="text-xs font-semibold text-slate-700">Email Message:</p>
              <textarea
                rows={7}
                readOnly
                value={selectedTemplate.body
                  .replace(/\[ClientName\]/g, selectedInvoiceForReminder.clientName)
                  .replace(/\[InvoiceNumber\]/g, selectedInvoiceForReminder.invoiceNumber)
                  .replace(/\[Amount\]/g, formatRupee(selectedInvoiceForReminder.amount))
                  .replace(/\[DueDate\]/g, selectedInvoiceForReminder.dueDate)
                  .replace(/\[CompanyName\]/g, 'Acme Company')
                  .replace(/\[PaymentLink\]/g, `https://opspilot.app/pay/${selectedInvoiceForReminder.invoiceNumber}`)
                  .replace(/\[EscalationDate\]/g, '3 business days')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowEmailPreviewModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSend}
                disabled={sendingEmail}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingEmail ? 'Sending Email...' : 'Send Reminder Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
