import React, { useState } from 'react';
import { Invoice, ReminderTemplate, formatRupee } from '../types';
import { InvoicePdfModal } from './InvoicePdfModal';
import {
  FileText,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  AlertCircle,
  Mail,
  UserCheck,
  X,
  Share2,
  Check,
  Printer,
  Eye,
  CheckSquare,
  Square,
} from 'lucide-react';

interface InvoiceManagerProps {
  invoices: Invoice[];
  reminderTemplates: ReminderTemplate[];
  companyName?: string;
  onSendReminder: (invoice: Invoice, template: ReminderTemplate) => void;
  onMarkPaid: (invoiceId: string) => void;
  onAddInvoice: (invoice: Invoice) => void;
}

export const InvoiceManager: React.FC<InvoiceManagerProps> = ({
  invoices,
  reminderTemplates,
  companyName = 'OpsPilot Financials',
  onSendReminder,
  onMarkPaid,
  onAddInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'pending' | 'paid'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Multi-select Checkbox State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // PDF Preview Modal State
  const [pdfModalInvoice, setPdfModalInvoice] = useState<Invoice | null>(null);

  // Resend Modal State
  const [resendModalInvoice, setResendModalInvoice] = useState<Invoice | null>(null);
  const [customResendNote, setCustomResendNote] = useState('');
  const [isSendingResend, setIsSendingResend] = useState(false);
  const [resendStatusResult, setResendStatusResult] = useState<any | null>(null);

  // Form State for New Invoice
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [itemDesc, setItemDesc] = useState('Q3 Software & Consulting Services');
  const [paymentType, setPaymentType] = useState<'full' | 'advance' | 'final' | 'milestone' | 'retainer'>('full');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [showNudgeInfo, setShowNudgeInfo] = useState(true);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.clientCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOverdue = invoices
    .filter((i) => i.status === 'overdue')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalOutstanding = invoices
    .filter((i) => i.status !== 'paid')
    .reduce((sum, i) => sum + i.amount, 0);

  // Selection Logic
  const allFilteredSelected =
    filteredInvoices.length > 0 &&
    filteredInvoices.every((inv) => selectedIds.includes(inv.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvoices.map((inv) => inv.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Bulk Actions
  const handleBulkMarkPaid = () => {
    selectedIds.forEach((id) => {
      const target = invoices.find((inv) => inv.id === id);
      if (target && target.status !== 'paid') {
        onMarkPaid(id);
      }
    });
    setSelectedIds([]);
  };

  const handleBulkSendReminders = () => {
    selectedIds.forEach((id) => {
      const target = invoices.find((inv) => inv.id === id);
      if (target && target.status !== 'paid') {
        const tmpl =
          reminderTemplates.find((t) => t.stage === target.reminderStage) ||
          reminderTemplates[0];
        onSendReminder(target, tmpl);
      }
    });
    setSelectedIds([]);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!clientCompany || isNaN(parsedAmount) || !dueDate) return;

    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${Math.floor(100 + Math.random() * 900)}`,
      clientName: clientName || 'Accounts Payable',
      clientEmail: clientEmail || 'billing@client.com',
      clientCompany,
      clientPhone: '+91 98765 00000',
      amount: parsedAmount,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate,
      status: 'pending',
      daysOverdue: 0,
      reminderStage: 'pre_due',
      reminderCount: 0,
      paymentType,
      notes: invoiceNotes || (paymentType === 'advance' ? 'Advance deposit invoice (upfront clearance required).' : paymentType === 'final' ? 'Final settlement invoice for remaining project balance.' : 'Standard commercial invoice.'),
      items: [
        {
          description: itemDesc || 'Technical & Consulting Services',
          quantity: 1,
          unitPrice: parsedAmount,
          amount: parsedAmount,
        },
      ],
    };

    onAddInvoice(newInv);
    setShowAddModal(false);
    setClientName('');
    setClientEmail('');
    setClientCompany('');
    setAmount('');
    setDueDate('');
    setItemDesc('Q3 Software & Consulting Services');
    setPaymentType('full');
    setInvoiceNotes('');
  };

  const handleSendViaResend = async () => {
    if (!resendModalInvoice) return;
    setIsSendingResend(true);
    setResendStatusResult(null);

    try {
      const response = await fetch('/api/resend/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice: resendModalInvoice,
          customMessage: customResendNote,
          recipientEmail: resendModalInvoice.clientEmail,
        }),
      });

      const data = await response.json();
      setResendStatusResult(data);
    } catch (err: any) {
      console.error('Resend dispatch error:', err);
      setResendStatusResult({
        success: false,
        error: err.message || 'Failed to dispatch email',
      });
    } finally {
      setIsSendingResend(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 bg-indigo-600 text-white rounded-md font-extrabold text-xs">
              AR
            </span>
            <span className="text-xs font-semibold text-slate-600">Accounts Receivable</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Invoices & Accounts Receivable
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage client billing in Rupees (₹), track advance & final payments, and dispatch emails or nudges
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNudgeInfo(!showNudgeInfo)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
            title="Toggle Email vs Nudge guide"
          >
            <AlertCircle className="w-4 h-4 text-indigo-600" />
            <span>{showNudgeInfo ? 'Hide Guide' : 'Nudge vs Email Guide'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* Nudge vs Email Guide Banner */}
      {showNudgeInfo && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 shadow-sm border border-indigo-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 text-xs flex-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-indigo-500 text-white font-extrabold text-[10px] rounded uppercase tracking-wider">
                Workflow Guide
              </span>
              <h3 className="font-extrabold text-white text-sm">
                Understanding "Email" vs "Nudge" in OpsPilot
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                <p className="font-bold text-white flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-300 mr-1 shrink-0" />
                  <span>1. Official Email Invoice (Tax Document)</span>
                </p>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Dispatches the formal itemized invoice PDF/HTML document directly to the client's inbox via Resend API. Best for initial billing, advance payment requests, and tax accounting.
                </p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                <p className="font-bold text-white flex items-center space-x-1">
                  <Send className="w-3.5 h-3.5 text-amber-300 mr-1 shrink-0" />
                  <span>2. Payment Nudge (Automated Reminder)</span>
                </p>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Sends a lightweight follow-up notification (WhatsApp / SMS / Quick Email) customized for the payment stage (e.g. pre-due reminder or 7-day overdue notice). Logs reminder attempt counts.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowNudgeInfo(false)}
            className="text-slate-400 hover:text-white text-xs font-bold shrink-0 self-start sm:self-center p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Total Outstanding AR
          </p>
          <p className="text-2xl font-extrabold text-slate-900">{formatRupee(totalOutstanding)}</p>
          <p className="text-[11px] text-slate-400 font-medium">All open client invoices</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Overdue AR Balance
          </p>
          <p className="text-2xl font-extrabold text-rose-600">{formatRupee(totalOverdue)}</p>
          <p className="text-[11px] text-rose-500 font-semibold">
            {invoices.filter((i) => i.status === 'overdue').length} client accounts overdue
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Total Active Invoices
          </p>
          <p className="text-2xl font-extrabold text-slate-900">{invoices.length}</p>
          <p className="text-[11px] text-emerald-700 font-semibold">
            {invoices.filter((i) => i.status === 'paid').length} Marked Paid
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by client, company, or invoice number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['all', 'overdue', 'pending', 'paid'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Action Toolbar Banner (Visible when items selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white rounded-2xl p-3.5 px-5 shadow-md flex flex-wrap items-center justify-between gap-3 transition-all">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold">
              {selectedIds.length} Selected
            </span>
            <span className="text-xs text-slate-300 font-normal">
              Perform multi-invoice operations
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleBulkSendReminders}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Bulk Send Payment Nudges</span>
            </button>

            <button
              onClick={handleBulkMarkPaid}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Bulk Mark as Paid</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Invoices List / Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Client Company</th>
                <th className="py-3.5 px-4">Amount (₹)</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Reminder Stage</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredInvoices.map((inv) => {
                const isSelected = selectedIds.includes(inv.id);
                const tmpl =
                  reminderTemplates.find((t) => t.stage === inv.reminderStage) ||
                  reminderTemplates[0];

                return (
                  <tr
                    key={inv.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectOne(inv.id)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      <div>
                        <span>#{inv.invoiceNumber}</span>
                        <span className="block text-[10px] font-semibold text-indigo-600 font-sans">
                          {inv.paymentType === 'advance'
                            ? '⚡ Advance'
                            : inv.paymentType === 'final'
                            ? '🏁 Final'
                            : inv.paymentType === 'milestone'
                            ? '🎯 Milestone'
                            : inv.paymentType === 'retainer'
                            ? '🔄 Retainer'
                            : 'Full Payment'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-slate-900">{inv.clientCompany}</p>
                        <p className="text-[11px] text-slate-500 font-normal">
                          {inv.clientName} ({inv.clientEmail})
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatRupee(inv.amount)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-normal">
                      {inv.dueDate}
                      {inv.status === 'overdue' && (
                        <span className="block text-[10px] font-semibold text-rose-600">
                          {inv.daysOverdue} days late
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {inv.status === 'overdue' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                          Overdue
                        </span>
                      )}
                      {inv.status === 'pending' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                          Pending
                        </span>
                      )}
                      {inv.status === 'paid' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center w-fit">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <span className="text-[11px] font-semibold text-indigo-700 block">
                          {tmpl.stageName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Nudged: {inv.reminderCount} time(s)
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setPdfModalInvoice(inv)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold transition cursor-pointer inline-flex items-center space-x-1"
                        title="Preview & Download PDF Invoice"
                      >
                        <Printer className="w-3 h-3 text-slate-600" />
                        <span>PDF</span>
                      </button>

                      <button
                        onClick={() => {
                          setResendModalInvoice(inv);
                          setResendStatusResult(null);
                          setCustomResendNote('');
                        }}
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold shadow-2xs transition cursor-pointer inline-flex items-center space-x-1"
                        title="Send invoice via Email API"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Email</span>
                      </button>

                      {inv.status !== 'paid' && (
                        <>
                          <button
                            onClick={() => onSendReminder(inv, tmpl)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-semibold border border-indigo-200 transition cursor-pointer inline-flex items-center space-x-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Nudge</span>
                          </button>
                          <button
                            onClick={() => onMarkPaid(inv.id)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-semibold border border-emerald-200 transition cursor-pointer inline-flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid</span>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Invoice Modal Component */}
      <InvoicePdfModal
        invoice={pdfModalInvoice}
        companyName={companyName}
        onClose={() => setPdfModalInvoice(null)}
        onSendEmail={(inv) => {
          setPdfModalInvoice(null);
          setResendModalInvoice(inv);
          setResendStatusResult(null);
          setCustomResendNote('');
        }}
      />

      {/* Send via Resend API Modal */}
      {resendModalInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                <h3 className="font-extrabold text-sm text-white">
                  Send Invoice #{resendModalInvoice.invoiceNumber} via Resend API
                </h3>
              </div>
              <button
                onClick={() => setResendModalInvoice(null)}
                className="text-slate-400 hover:text-white p-1 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Recipient: {resendModalInvoice.clientCompany}</span>
                  <span className="text-indigo-600">{formatRupee(resendModalInvoice.amount)}</span>
                </div>
                <p className="text-slate-500 font-medium">Email: {resendModalInvoice.clientEmail}</p>
                <p className="text-slate-500 font-medium">Due Date: {resendModalInvoice.dueDate}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Custom Message / Delivery Instructions
                </label>
                <textarea
                  rows={3}
                  value={customResendNote}
                  onChange={(e) => setCustomResendNote(e.target.value)}
                  placeholder="e.g. Hi Sarah, please find attached the Q3 Consulting invoice for payment clearance."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
                />
              </div>

              {resendStatusResult && (
                <div
                  className={`p-3 rounded-xl border ${
                    resendStatusResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-extrabold mb-1">
                    {resendStatusResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>
                      {resendStatusResult.success
                        ? 'Invoice Dispatched via Resend API!'
                        : 'Delivery Failed'}
                    </span>
                  </div>
                  {resendStatusResult.success && (
                    <div className="text-[11px] space-y-0.5 text-slate-700">
                      <p>
                        <strong className="text-slate-900">Resend Message ID:</strong>{' '}
                        <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                          {resendStatusResult.resendId}
                        </code>
                      </p>
                      <p>
                        <strong className="text-slate-900">Sent to:</strong> {resendStatusResult.sentTo}
                      </p>
                      <p>
                        <strong className="text-slate-900">Status:</strong> {resendStatusResult.deliveryStatus}
                      </p>
                    </div>
                  )}
                  {resendStatusResult.error && <p className="text-xs">{resendStatusResult.error}</p>}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setResendModalInvoice(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handleSendViaResend}
                  disabled={isSendingResend}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingResend ? 'Dispatching...' : 'Dispatch Email'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Invoice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Create New Invoice</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp India"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  placeholder="e.g. rajesh@acme.in"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium"
                />
              </div>

              {/* Payment Type Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Payment Type & Structure *
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="full">Standard Full Payment (100%)</option>
                  <option value="advance">⚡ Advance Deposit (Upfront Payment)</option>
                  <option value="final">🏁 Final Settlement (Remaining Balance)</option>
                  <option value="milestone">🎯 Milestone / Deliverable Payment</option>
                  <option value="retainer">🔄 Monthly Retainer Payment</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Line Item Service Title</label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise Cloud Deployment Phase 1"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Invoice Description & Scope / Payment Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Write detailed invoice description, deliverables, or payment terms (e.g., 50% Advance deposit due now; 50% balance upon UAT clearance)."
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount in Rupees (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="50000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
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
                  Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
